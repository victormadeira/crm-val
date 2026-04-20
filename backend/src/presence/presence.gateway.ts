import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { PresenceService } from './presence.service';
import {
  UpdateStatusDto,
  PresenceSyncPayload,
  PresenceUpdatedPayload,
  PresenceLeftPayload,
  UserRole,
} from './presence.types';

// ─────────────────────────────────────────────────────────────────────────────
// PresenceGateway
//
// Namespace: /presence
// Rooms: `tenant:{tenantId}` — todos os usuários do mesmo tenant
//
// Eventos servidor → cliente:
//   presence:sync      — snapshot inicial ao conectar
//   presence:updated   — um usuário mudou de estado
//   presence:left      — um usuário saiu definitivamente
//
// Eventos cliente → servidor:
//   presence:update    — atualiza status/atividade do próprio usuário
//   presence:heartbeat — keep-alive para renovar TTL no Redis
// ─────────────────────────────────────────────────────────────────────────────

@WebSocketGateway({
  namespace: '/presence',
  cors: {
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  constructor(private readonly presenceService: PresenceService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Extrai o contexto de autenticação do handshake do socket.
   * Em produção, valide o JWT aqui. Para integração com o NestJS existente,
   * use o mesmo guard de auth do HTTP (ex: JwtAuthGuard adaptado para WS).
   */
  private extractContext(socket: Socket): { userId: string; tenantId: string; nome: string; role: UserRole } | null {
    // O cliente deve enviar no handshake:
    // socket.io({ auth: { token: 'Bearer ...' } })
    // Aqui extraímos do token decodificado (middleware de auth deve popular socket.data)
    const { userId, tenantId, nome, role } = socket.data ?? {};
    if (!userId || !tenantId) return null;
    return { userId, tenantId, nome: nome ?? userId, role: role ?? 'corretor' };
  }

  private tenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async handleConnection(socket: Socket): Promise<void> {
    const ctx = this.extractContext(socket);
    if (!ctx) {
      this.logger.warn(`Socket ${socket.id} rejeitado: sem contexto de auth`);
      socket.disconnect(true);
      return;
    }

    const { userId, tenantId, nome, role } = ctx;
    this.logger.log(`[${tenantId}] ${nome} (${userId}) conectou — socket ${socket.id}`);

    // Entra na room do tenant
    await socket.join(this.tenantRoom(tenantId));

    // Registra/atualiza presença
    const presence = await this.presenceService.upsertPresence(tenantId, userId, {
      nome,
      role,
      status: 'online_idle',
    });

    // Envia snapshot completo APENAS para o socket que acabou de conectar
    const allPresences = await this.presenceService.getAllPresences(tenantId);
    const syncPayload: PresenceSyncPayload = {
      users: allPresences,
      roomConfig: this.presenceService.getRoomConfig(tenantId),
    };
    socket.emit('presence:sync', syncPayload);

    // Notifica os DEMAIS da sala que este usuário entrou/atualizou
    const updatedPayload: PresenceUpdatedPayload = { user: presence };
    socket.to(this.tenantRoom(tenantId)).emit('presence:updated', updatedPayload);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const ctx = this.extractContext(socket);
    if (!ctx) return;

    const { userId, tenantId, nome } = ctx;
    this.logger.log(`[${tenantId}] ${nome} (${userId}) desconectou — socket ${socket.id}`);

    const shouldEmit = await this.presenceService.handleDisconnect(tenantId, userId);

    if (shouldEmit) {
      const leftPayload: PresenceLeftPayload = { userId };
      this.server
        .to(this.tenantRoom(tenantId))
        .emit('presence:left', leftPayload);
    }
  }

  // ─── Eventos do cliente ───────────────────────────────────────────────────

  /**
   * Atualiza o status e/ou atividade atual do usuário.
   * Emitido pelo frontend quando:
   *   - O corretor abre uma conversa no WhatsApp → status: busy_chat
   *   - O corretor entra em pausa → status: away_break
   *   - O corretor fecha a conversa → status: online_idle
   */
  @SubscribeMessage('presence:update')
  async handleUpdate(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateStatusDto,
  ): Promise<void> {
    const ctx = this.extractContext(socket);
    if (!ctx) throw new WsException('Não autenticado');

    const { userId, tenantId } = ctx;
    const updated = await this.presenceService.updateStatus(
      tenantId,
      userId,
      dto.status,
      dto.currentActivity,
    );

    if (!updated) return;

    const payload: PresenceUpdatedPayload = { user: updated };
    // Broadcast para toda a room (incluindo o próprio socket para confirmar)
    this.server.to(this.tenantRoom(tenantId)).emit('presence:updated', payload);
  }

  /**
   * Keep-alive: renova o TTL no Redis sem mudar o status.
   * O frontend deve emitir a cada 60 segundos.
   */
  @SubscribeMessage('presence:heartbeat')
  async handleHeartbeat(@ConnectedSocket() socket: Socket): Promise<void> {
    const ctx = this.extractContext(socket);
    if (!ctx) return;

    const { userId, tenantId } = ctx;
    const existing = await this.presenceService.getPresence(tenantId, userId);
    if (existing) {
      // Faz upsert para renovar TTL
      await this.presenceService.upsertPresence(tenantId, userId, existing);
    }
  }

  // ─── API interna (chamada por outros serviços NestJS) ─────────────────────

  /**
   * Permite que outros módulos (ex: WhatsAppService, BotService) emitam
   * atualizações de presença de forma programática.
   */
  broadcastPresenceUpdate(tenantId: string, userId: string): void {
    this.presenceService.getPresence(tenantId, userId).then((presence) => {
      if (!presence) return;
      const payload: PresenceUpdatedPayload = { user: presence };
      this.server.to(this.tenantRoom(tenantId)).emit('presence:updated', payload);
    });
  }
}

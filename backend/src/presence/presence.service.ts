import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import {
  UserPresence,
  PresenceStatus,
  CurrentActivity,
  RoomConfig,
  IsometricPosition,
} from './presence.types';

// TTL de grace period: se o socket cair e reconectar em até 10s, não emite "offline"
const OFFLINE_GRACE_TTL = 10; // segundos
// TTL máximo de uma entrada de presença sem heartbeat (30 min)
const PRESENCE_TTL = 1800; // segundos

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  // ─── Chaves Redis ──────────────────────────────────────────────────────────

  private keyUser(tenantId: string, userId: string): string {
    return `presence:${tenantId}:user:${userId}`;
  }

  private keyTenantIndex(tenantId: string): string {
    return `presence:${tenantId}:index`;
  }

  private keyGrace(tenantId: string, userId: string): string {
    return `presence:${tenantId}:grace:${userId}`;
  }

  // ─── Posição isométrica ────────────────────────────────────────────────────

  /**
   * Atribui uma posição fixa na grade isométrica baseada no índice do usuário.
   * Distribui em serpentina (snake order) para preencher a sala uniformemente.
   */
  private computePosition(index: number, cols = 8): IsometricPosition {
    const row = Math.floor(index / cols);
    const col = row % 2 === 0 ? index % cols : cols - 1 - (index % cols);
    return { x: col, y: row };
  }

  // ─── Operações de presença ─────────────────────────────────────────────────

  /**
   * Registra ou atualiza a presença de um usuário.
   * Chamado no evento `connection` do Gateway.
   */
  async upsertPresence(
    tenantId: string,
    userId: string,
    partial: Partial<UserPresence>,
  ): Promise<UserPresence> {
    const key = this.keyUser(tenantId, userId);
    const indexKey = this.keyTenantIndex(tenantId);

    // Verifica se já existe (para manter posição)
    const existing = await this.getPresence(tenantId, userId);

    // Determina posição: mantém a existente ou atribui nova
    let position: IsometricPosition;
    if (existing?.position) {
      position = existing.position;
    } else {
      const count = await this.redis.scard(indexKey);
      position = this.computePosition(count);
    }

    const now = new Date().toISOString();
    const presence: UserPresence = {
      userId,
      tenantId,
      nome: partial.nome ?? existing?.nome ?? userId,
      role: partial.role ?? existing?.role ?? 'corretor',
      status: partial.status ?? 'online_idle',
      statusUpdatedAt: now,
      currentActivity: partial.currentActivity ?? existing?.currentActivity,
      position,
      metrics: partial.metrics ?? existing?.metrics ?? {
        atendimentosHoje: 0,
        tempoMedioResposta: 0,
        filaAtual: 0,
      },
    };

    // Persiste no Redis com TTL
    await this.redis.set(key, JSON.stringify(presence), 'EX', PRESENCE_TTL);
    // Adiciona ao índice do tenant
    await this.redis.sadd(indexKey, userId);

    // Remove grace period se existir
    await this.redis.del(this.keyGrace(tenantId, userId));

    return presence;
  }

  /**
   * Atualiza apenas o status e/ou atividade atual de um usuário.
   */
  async updateStatus(
    tenantId: string,
    userId: string,
    status: PresenceStatus,
    currentActivity?: CurrentActivity,
  ): Promise<UserPresence | null> {
    const existing = await this.getPresence(tenantId, userId);
    if (!existing) return null;

    const updated: UserPresence = {
      ...existing,
      status,
      statusUpdatedAt: new Date().toISOString(),
      currentActivity: currentActivity ?? (status === 'online_idle' ? undefined : existing.currentActivity),
    };

    const key = this.keyUser(tenantId, userId);
    await this.redis.set(key, JSON.stringify(updated), 'EX', PRESENCE_TTL);
    return updated;
  }

  /**
   * Marca usuário como offline com grace period.
   * Retorna true se deve emitir o evento de saída (grace expirado/não existia).
   */
  async handleDisconnect(tenantId: string, userId: string): Promise<boolean> {
    const graceKey = this.keyGrace(tenantId, userId);

    // Se já há um grace period ativo, significa que é uma reconexão rápida — ignora
    const existing = await this.redis.get(graceKey);
    if (existing) return false;

    // Define grace period
    await this.redis.set(graceKey, '1', 'EX', OFFLINE_GRACE_TTL);

    // Agenda o offline via TTL: após OFFLINE_GRACE_TTL segundos sem reconexão,
    // o supervisor verá o usuário como offline no próximo heartbeat/sync.
    // Para emissão imediata, marcamos como offline agora.
    await this.updateStatus(tenantId, userId, 'offline');
    return true;
  }

  /**
   * Retorna a presença de um usuário específico.
   */
  async getPresence(tenantId: string, userId: string): Promise<UserPresence | null> {
    const key = this.keyUser(tenantId, userId);
    const raw = await this.redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as UserPresence;
  }

  /**
   * Retorna todos os usuários presentes em um tenant (excluindo offline há mais de X min).
   */
  async getAllPresences(tenantId: string): Promise<UserPresence[]> {
    const indexKey = this.keyTenantIndex(tenantId);
    const userIds = await this.redis.smembers(indexKey);

    const presences: UserPresence[] = [];
    for (const userId of userIds) {
      const p = await this.getPresence(tenantId, userId);
      if (p) presences.push(p);
    }

    return presences;
  }

  /**
   * Atualiza as métricas de um usuário (chamado pelo serviço de atendimento).
   */
  async updateMetrics(
    tenantId: string,
    userId: string,
    metrics: Partial<UserPresence['metrics']>,
  ): Promise<void> {
    const existing = await this.getPresence(tenantId, userId);
    if (!existing) return;

    const updated: UserPresence = {
      ...existing,
      metrics: { ...existing.metrics, ...metrics } as UserPresence['metrics'],
    };

    const key = this.keyUser(tenantId, userId);
    await this.redis.set(key, JSON.stringify(updated), 'EX', PRESENCE_TTL);
  }

  /**
   * Retorna a configuração da sala para o tenant.
   */
  getRoomConfig(tenantId: string): RoomConfig {
    return {
      gridCols: 8,
      gridRows: 6,
      roomName: `Central de Atendimento`,
    };
  }
}

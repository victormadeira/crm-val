// ─────────────────────────────────────────────────────────────────────────────
// presence.types.ts
// Tipos compartilhados entre Gateway, Service e o cliente WebSocket.
// ─────────────────────────────────────────────────────────────────────────────

export type PresenceStatus =
  | 'online_idle'   // Online, sem atividade ativa
  | 'busy_chat'     // Atendendo via chat (WhatsApp / Instagram)
  | 'busy_call'     // Em ligação (Voice AI / telefone)
  | 'away_break'    // Em pausa (café, banheiro etc.)
  | 'offline';      // Desconectado / sem heartbeat

export type UserRole = 'corretor' | 'sac' | 'supervisor' | 'gestor' | 'admin' | 'bot';

export interface CurrentActivity {
  type: 'whatsapp' | 'instagram' | 'ticket' | 'ligacao' | 'pipeline' | 'bot_processing';
  targetId: string;      // ID do Lead, Ticket ou Conversa
  targetName: string;    // Nome do Lead / Cliente
  startedAt: string;     // ISO 8601
}

/**
 * Posição do avatar na grade isométrica da sala.
 * x: coluna (0-based), y: linha (0-based)
 */
export interface IsometricPosition {
  x: number;
  y: number;
}

/**
 * Estado completo de presença de um usuário (humano ou bot).
 * Armazenado no Redis como JSON serializado.
 */
export interface UserPresence {
  userId: string;
  tenantId: string;
  nome: string;
  role: UserRole;
  status: PresenceStatus;
  statusUpdatedAt: string;         // ISO 8601 — quando o status mudou pela última vez
  currentActivity?: CurrentActivity;
  position: IsometricPosition;
  // Métricas do dia (atualizadas pelo serviço de atendimento)
  metrics?: {
    atendimentosHoje: number;
    tempoMedioResposta: number;    // segundos
    filaAtual: number;             // leads aguardando resposta
  };
}

// ─── Eventos emitidos pelo servidor → cliente ────────────────────────────────

/** Emitido ao conectar: snapshot completo da sala */
export interface PresenceSyncPayload {
  users: UserPresence[];
  roomConfig: RoomConfig;
}

/** Emitido quando um usuário muda de estado */
export interface PresenceUpdatedPayload {
  user: UserPresence;
}

/** Emitido quando um usuário desconecta definitivamente */
export interface PresenceLeftPayload {
  userId: string;
}

// ─── Eventos emitidos pelo cliente → servidor ────────────────────────────────

/** Cliente informa mudança de status (ex: entrou em pausa) */
export interface UpdateStatusDto {
  status: PresenceStatus;
  currentActivity?: CurrentActivity;
}

// ─── Configuração da sala ────────────────────────────────────────────────────

export interface RoomConfig {
  gridCols: number;
  gridRows: number;
  roomName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// presence.types.ts (frontend)
// Espelha os tipos do backend para garantir contrato de eventos.
// ─────────────────────────────────────────────────────────────────────────────

export type PresenceStatus =
  | 'online_idle'
  | 'busy_chat'
  | 'busy_call'
  | 'away_break'
  | 'offline';

export type UserRole = 'corretor' | 'sac' | 'supervisor' | 'gestor' | 'admin' | 'bot';

export interface CurrentActivity {
  type: 'whatsapp' | 'instagram' | 'ticket' | 'ligacao' | 'pipeline' | 'bot_processing';
  targetId: string;
  targetName: string;
  startedAt: string;
}

export interface IsometricPosition {
  x: number;
  y: number;
}

export interface UserPresence {
  userId: string;
  tenantId: string;
  nome: string;
  role: UserRole;
  status: PresenceStatus;
  statusUpdatedAt: string;
  currentActivity?: CurrentActivity;
  position: IsometricPosition;
  metrics?: {
    atendimentosHoje: number;
    tempoMedioResposta: number;
    filaAtual: number;
  };
}

export interface RoomConfig {
  gridCols: number;
  gridRows: number;
  roomName: string;
}

// ─── Payloads de eventos ──────────────────────────────────────────────────────

export interface PresenceSyncPayload {
  users: UserPresence[];
  roomConfig: RoomConfig;
}

export interface PresenceUpdatedPayload {
  user: UserPresence;
}

export interface PresenceLeftPayload {
  userId: string;
}

export interface UpdateStatusDto {
  status: PresenceStatus;
  currentActivity?: CurrentActivity;
}

// ─── Labels e cores de status ─────────────────────────────────────────────────

export const STATUS_LABEL: Record<PresenceStatus, string> = {
  online_idle: 'Disponível',
  busy_chat: 'Em atendimento',
  busy_call: 'Em ligação',
  away_break: 'Em pausa',
  offline: 'Offline',
};

export const STATUS_COLOR: Record<PresenceStatus, string> = {
  online_idle: '#22c55e',   // green-500
  busy_chat: '#3b82f6',     // blue-500
  busy_call: '#f59e0b',     // amber-500
  away_break: '#a855f7',    // purple-500
  offline: '#94a3b8',       // slate-400
};

export const ROLE_LABEL: Record<UserRole, string> = {
  corretor: 'Corretor',
  sac: 'SAC',
  supervisor: 'Supervisor',
  gestor: 'Gestor',
  admin: 'Admin',
  bot: 'Agente IA',
};

export const ACTIVITY_LABEL: Record<CurrentActivity['type'], string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  ticket: 'Ticket SAC',
  ligacao: 'Ligação',
  pipeline: 'Pipeline',
  bot_processing: 'Processando',
};

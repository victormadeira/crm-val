import { create } from "zustand";
import {
  UserPresence,
  RoomConfig,
  PresenceSyncPayload,
  PresenceUpdatedPayload,
  PresenceLeftPayload,
} from "./presence.types";

// ─────────────────────────────────────────────────────────────────────────────
// Dados mock para desenvolvimento (sem WebSocket real).
// Layout de pods (definido em IsometricRoom.tsx):
//   Corretores: cols 0-3
//   SAC:        cols 5-8
//   Bots:       cols 10-12
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PRESENCES: UserPresence[] = [
  {
    userId: "c1",
    tenantId: "tenant-val",
    nome: "Amanda Rocha",
    role: "corretor",
    status: "busy_chat",
    statusUpdatedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    currentActivity: {
      type: "whatsapp",
      targetId: "l1",
      targetName: "Carlos Mendes",
      startedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    },
    position: { x: 1, y: 1 },
    metrics: { atendimentosHoje: 8, tempoMedioResposta: 4, filaAtual: 3 },
  },
  {
    userId: "c2",
    tenantId: "tenant-val",
    nome: "Bruno Lima",
    role: "corretor",
    status: "busy_chat",
    statusUpdatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    currentActivity: {
      type: "whatsapp",
      targetId: "l2",
      targetName: "Fernanda Costa",
      startedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    },
    position: { x: 3, y: 1 },
    metrics: { atendimentosHoje: 5, tempoMedioResposta: 7, filaAtual: 5 },
  },
  {
    userId: "c3",
    tenantId: "tenant-val",
    nome: "Carla Souza",
    role: "corretor",
    status: "online_idle",
    statusUpdatedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    position: { x: 1, y: 2 },
    metrics: { atendimentosHoje: 11, tempoMedioResposta: 3, filaAtual: 1 },
  },
  {
    userId: "c4",
    tenantId: "tenant-val",
    nome: "Diego Ferreira",
    role: "corretor",
    status: "away_break",
    statusUpdatedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    position: { x: 3, y: 2 },
    metrics: { atendimentosHoje: 6, tempoMedioResposta: 9, filaAtual: 2 },
  },
  {
    userId: "c5",
    tenantId: "tenant-val",
    nome: "Elena Martins",
    role: "corretor",
    status: "busy_chat",
    statusUpdatedAt: new Date(Date.now() - 1 * 60_000).toISOString(),
    currentActivity: {
      type: "instagram",
      targetId: "l5",
      targetName: "Rafael Oliveira",
      startedAt: new Date(Date.now() - 1 * 60_000).toISOString(),
    },
    position: { x: 1, y: 3 },
    metrics: { atendimentosHoje: 9, tempoMedioResposta: 5, filaAtual: 4 },
  },
  {
    userId: "c6",
    tenantId: "tenant-val",
    nome: "Felipe Santos",
    role: "corretor",
    status: "busy_call",
    statusUpdatedAt: new Date(Date.now() - 6 * 60_000).toISOString(),
    currentActivity: {
      type: "ligacao",
      targetId: "l6",
      targetName: "Juliana Pereira",
      startedAt: new Date(Date.now() - 6 * 60_000).toISOString(),
    },
    position: { x: 3, y: 3 },
    metrics: { atendimentosHoje: 4, tempoMedioResposta: 6, filaAtual: 2 },
  },
  {
    userId: "c7",
    tenantId: "tenant-val",
    nome: "Isabela Torres",
    role: "corretor",
    status: "offline",
    statusUpdatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    position: { x: 2, y: 2 },
    metrics: { atendimentosHoje: 3, tempoMedioResposta: 15, filaAtual: 0 },
  },
  {
    userId: "sac1",
    tenantId: "tenant-val",
    nome: "Gabriela Nunes",
    role: "sac",
    status: "busy_chat",
    statusUpdatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    currentActivity: {
      type: "ticket",
      targetId: "t1",
      targetName: "Marcos Alves",
      startedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    },
    position: { x: 6, y: 2 },
    metrics: { atendimentosHoje: 14, tempoMedioResposta: 8, filaAtual: 6 },
  },
  {
    userId: "sac2",
    tenantId: "tenant-val",
    nome: "Hugo Carvalho",
    role: "sac",
    status: "online_idle",
    statusUpdatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    position: { x: 8, y: 2 },
    metrics: { atendimentosHoje: 10, tempoMedioResposta: 11, filaAtual: 0 },
  },
  {
    userId: "bot1",
    tenantId: "tenant-val",
    nome: "Aqua Bot",
    role: "bot",
    status: "busy_chat",
    statusUpdatedAt: new Date(Date.now() - 30_000).toISOString(),
    currentActivity: {
      type: "bot_processing",
      targetId: "bc1",
      targetName: "Lead Anônimo #4821",
      startedAt: new Date(Date.now() - 30_000).toISOString(),
    },
    position: { x: 11, y: 1 },
    metrics: { atendimentosHoje: 47, tempoMedioResposta: 1, filaAtual: 12 },
  },
  {
    userId: "bot2",
    tenantId: "tenant-val",
    nome: "Voice AI",
    role: "bot",
    status: "busy_call",
    statusUpdatedAt: new Date(Date.now() - 90_000).toISOString(),
    currentActivity: {
      type: "ligacao",
      targetId: "l10",
      targetName: "Patrícia Ramos",
      startedAt: new Date(Date.now() - 90_000).toISOString(),
    },
    position: { x: 11, y: 3 },
    metrics: { atendimentosHoje: 23, tempoMedioResposta: 0, filaAtual: 3 },
  },
];

const MOCK_ROOM_CONFIG: RoomConfig = {
  gridCols: 13,
  gridRows: 4,
  roomName: "Central de Atendimento — Valparaíso",
};

interface PresenceState {
  users: Record<string, UserPresence>;
  roomConfig: RoomConfig;
  selectedUserId: string | null;
  connected: boolean;
  useMock: boolean;

  _sync: (payload: PresenceSyncPayload) => void;
  _update: (payload: PresenceUpdatedPayload) => void;
  _leave: (payload: PresenceLeftPayload) => void;
  _setConnected: (v: boolean) => void;

  selectUser: (id: string | null) => void;
  getUserList: () => UserPresence[];
  getOnlineCount: () => number;
  getBusyCount: () => number;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  users: Object.fromEntries(MOCK_PRESENCES.map((u) => [u.userId, u])),
  roomConfig: MOCK_ROOM_CONFIG,
  selectedUserId: null,
  connected: false,
  useMock: true,

  _sync: ({ users, roomConfig }) =>
    set({
      users: Object.fromEntries(users.map((u) => [u.userId, u])),
      roomConfig,
      connected: true,
      useMock: false,
    }),

  _update: ({ user }) =>
    set((s) => ({
      users: { ...s.users, [user.userId]: user },
    })),

  _leave: ({ userId }) =>
    set((s) => {
      const updated = { ...s.users };
      if (updated[userId]) {
        updated[userId] = { ...updated[userId], status: "offline" };
      }
      return { users: updated };
    }),

  _setConnected: (v) => set({ connected: v }),

  selectUser: (id) => set({ selectedUserId: id }),

  getUserList: () => Object.values(get().users),

  getOnlineCount: () =>
    Object.values(get().users).filter((u) => u.status !== "offline").length,

  getBusyCount: () =>
    Object.values(get().users).filter(
      (u) => u.status === "busy_chat" || u.status === "busy_call",
    ).length,
}));

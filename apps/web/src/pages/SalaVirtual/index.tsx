import { useState, useMemo, useEffect } from "react";
import { usePresenceStore } from "@/lib/presence/presenceStore";
import { PresenceStatus, UserPresence } from "@/lib/presence/presence.types";
import { OfficeFloorplan } from "./OfficeFloorplan";
import { AttendantPanel } from "./AttendantPanel";
import { RoomStatusBar } from "./RoomStatusBar";

/**
 * SalaVirtual — visão isométrica da central de atendimento.
 *
 * Modos:
 *   - Mock (default): dados em memória + simulação narrativa
 *   - Live: conectado via WebSocket (quando VITE_WS_URL está setada)
 */
export function SalaVirtual() {
  const {
    users: usersMap,
    roomConfig,
    selectedUserId,
    connected,
    selectUser,
    getUserList,
  } = usePresenceStore();

  const [filterStatus, setFilterStatus] = useState<PresenceStatus | "all">("all");

  const allUsers = getUserList();

  // Filtro por dimming (não remove) — mantém o layout da sala estável
  const filteredUserIds = useMemo(() => {
    if (filterStatus === "all") return undefined;
    return new Set(
      allUsers.filter((u) => u.status === filterStatus).map((u) => u.userId),
    );
  }, [allUsers, filterStatus]);

  const selectedUser: UserPresence | null = selectedUserId
    ? (usersMap[selectedUserId] ?? null)
    : null;

  // Simulação narrativa em modo mock: roteiro de eventos a cada 6s
  useEffect(() => {
    if (connected) return;

    const script: Array<(store: ReturnType<typeof usePresenceStore.getState>) => void> = [
      (store) => {
        const u = store.users["c3"];
        if (!u) return;
        store._update({
          user: {
            ...u,
            status: "busy_chat",
            statusUpdatedAt: new Date().toISOString(),
            currentActivity: {
              type: "whatsapp",
              targetId: "l-live-1",
              targetName: "Maria Eduarda",
              startedAt: new Date().toISOString(),
            },
            metrics: u.metrics
              ? { ...u.metrics, filaAtual: Math.max(0, u.metrics.filaAtual - 1) }
              : undefined,
          },
        });
      },
      (store) => {
        const u = store.users["c4"];
        if (!u) return;
        store._update({
          user: {
            ...u,
            status: "online_idle",
            statusUpdatedAt: new Date().toISOString(),
            currentActivity: undefined,
          },
        });
      },
      (store) => {
        const u = store.users["bot1"];
        if (!u?.metrics) return;
        store._update({
          user: {
            ...u,
            metrics: {
              ...u.metrics,
              atendimentosHoje: u.metrics.atendimentosHoje + 1,
              filaAtual: Math.max(0, u.metrics.filaAtual - 1),
            },
          },
        });
      },
      (store) => {
        const u = store.users["sac2"];
        if (!u) return;
        store._update({
          user: {
            ...u,
            status: "busy_chat",
            statusUpdatedAt: new Date().toISOString(),
            currentActivity: {
              type: "ticket",
              targetId: "t-live-2",
              targetName: "Reclamação #482",
              startedAt: new Date().toISOString(),
            },
          },
        });
      },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      script[idx % script.length](usePresenceStore.getState());
      idx++;
    }, 6000);

    return () => clearInterval(interval);
  }, [connected]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <RoomStatusBar
        users={allUsers}
        roomName={roomConfig.roomName}
        connected={connected}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden relative bg-slate-100">
          <div className="relative w-full h-full p-4">
            <OfficeFloorplan
              users={allUsers}
              selectedUserId={selectedUserId}
              onSelectUser={selectUser}
              filteredUserIds={filteredUserIds}
            />
          </div>

          {!selectedUserId && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-slate-600 px-3 py-1.5 rounded-[10px] border border-slate-200 shadow-soft pointer-events-none">
              Clique em um atendente para ver os detalhes
            </div>
          )}

          {!connected && (
            <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              MODO DEMONSTRAÇÃO
            </div>
          )}
        </div>

        <AttendantPanel user={selectedUser} onClose={() => selectUser(null)} />
      </div>
    </div>
  );
}

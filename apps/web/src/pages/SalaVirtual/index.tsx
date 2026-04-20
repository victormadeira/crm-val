import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePresenceStore } from '@/lib/presence/presenceStore';
import { PresenceStatus } from '@/lib/presence/presence.types';
import { IsometricRoom } from './IsometricRoom';
import { AttendantPanel } from './AttendantPanel';
import { RoomStatusBar } from './RoomStatusBar';

// ─────────────────────────────────────────────────────────────────────────────
// SalaVirtual
//
// Página principal da sala virtual. Compõe:
//   1. RoomStatusBar — barra de status e filtros
//   2. IsometricRoom — sala isométrica SVG com avatares
//   3. AttendantPanel — painel lateral de detalhes
//
// Funciona em modo mock (sem WebSocket) por padrão.
// Para ativar o WebSocket real, configure VITE_WS_URL no .env.
// ─────────────────────────────────────────────────────────────────────────────

export function SalaVirtual() {
  const {
    users: usersMap,
    roomConfig,
    selectedUserId,
    connected,
    selectUser,
    getUserList,
  } = usePresenceStore();

  const [filterStatus, setFilterStatus] = useState<PresenceStatus | 'all'>('all');

  const allUsers = getUserList();

  // Aplica filtro de status
  const filteredUsers = useMemo(() => {
    if (filterStatus === 'all') return allUsers;
    return allUsers.filter((u) => u.status === filterStatus);
  }, [allUsers, filterStatus]);

  const selectedUser = selectedUserId ? usersMap[selectedUserId] ?? null : null;

  // Simula animação de atualização de status (apenas em modo mock)
  useEffect(() => {
    if (connected) return; // não simula se conectado ao WS real

    const statuses: PresenceStatus[] = ['busy_chat', 'online_idle', 'busy_chat', 'away_break'];
    let idx = 0;

    const interval = setInterval(() => {
      // Alterna o status do segundo corretor para demonstrar animação
      const store = usePresenceStore.getState();
      const c2 = store.users['c2'];
      if (c2) {
        const nextStatus = statuses[idx % statuses.length];
        store._update({
          user: {
            ...c2,
            status: nextStatus,
            statusUpdatedAt: new Date().toISOString(),
            currentActivity:
              nextStatus === 'busy_chat'
                ? {
                    type: 'whatsapp',
                    targetId: 'l2',
                    targetName: 'Fernanda Costa',
                    startedAt: new Date().toISOString(),
                  }
                : undefined,
          },
        });
      }
      idx++;
    }, 5000);

    return () => clearInterval(interval);
  }, [connected]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Barra de status e filtros */}
      <RoomStatusBar
        users={allUsers}
        roomName={roomConfig.roomName}
        connected={connected}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {/* Corpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sala isométrica */}
        <motion.div
          className="flex-1 overflow-hidden relative"
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Gradiente de fundo */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, #e0f2fe 0%, #f8fafc 60%, #f1f5f9 100%)',
            }}
          />

          {/* SVG da sala */}
          <div className="relative w-full h-full">
            <IsometricRoom
              users={filteredUsers}
              roomConfig={roomConfig}
              selectedUserId={selectedUserId}
              onSelectUser={selectUser}
            />
          </div>

          {/* Dica de interação */}
          {!selectedUserId && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm text-xs text-slate-500 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm pointer-events-none">
              Clique em um avatar para ver os detalhes do atendente
            </div>
          )}

          {/* Badge de modo mock */}
          {!connected && (
            <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium px-2 py-1 rounded-full">
              Modo demonstração — dados simulados
            </div>
          )}
        </motion.div>

        {/* Painel de detalhes */}
        <AttendantPanel
          user={selectedUser}
          onClose={() => selectUser(null)}
        />
      </div>
    </div>
  );
}

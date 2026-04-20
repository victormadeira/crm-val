import React from 'react';
import { UserPresence, STATUS_COLOR, STATUS_LABEL, PresenceStatus } from '@/lib/presence/presence.types';
import { Wifi, WifiOff, Users, MessageCircle, Phone, Coffee } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// RoomStatusBar
//
// Barra superior da sala virtual com:
//   - Nome da sala e indicador de conexão
//   - Contadores de status em tempo real
//   - Filtros de visualização
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  users: UserPresence[];
  roomName: string;
  connected: boolean;
  filterStatus: PresenceStatus | 'all';
  onFilterChange: (f: PresenceStatus | 'all') => void;
}

interface StatusCount {
  status: PresenceStatus | 'all';
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export function RoomStatusBar({ users, roomName, connected, filterStatus, onFilterChange }: Props) {
  const counts = {
    all: users.length,
    online_idle: users.filter((u) => u.status === 'online_idle').length,
    busy_chat: users.filter((u) => u.status === 'busy_chat').length,
    busy_call: users.filter((u) => u.status === 'busy_call').length,
    away_break: users.filter((u) => u.status === 'away_break').length,
    offline: users.filter((u) => u.status === 'offline').length,
  };

  const filters: StatusCount[] = [
    {
      status: 'all',
      label: 'Todos',
      count: counts.all,
      icon: <Users className="h-3.5 w-3.5" />,
      color: '#64748b',
    },
    {
      status: 'busy_chat',
      label: 'Em chat',
      count: counts.busy_chat,
      icon: <MessageCircle className="h-3.5 w-3.5" />,
      color: STATUS_COLOR.busy_chat,
    },
    {
      status: 'busy_call',
      label: 'Em ligação',
      count: counts.busy_call,
      icon: <Phone className="h-3.5 w-3.5" />,
      color: STATUS_COLOR.busy_call,
    },
    {
      status: 'online_idle',
      label: 'Disponível',
      count: counts.online_idle,
      icon: <Wifi className="h-3.5 w-3.5" />,
      color: STATUS_COLOR.online_idle,
    },
    {
      status: 'away_break',
      label: 'Em pausa',
      count: counts.away_break,
      icon: <Coffee className="h-3.5 w-3.5" />,
      color: STATUS_COLOR.away_break,
    },
    {
      status: 'offline',
      label: 'Offline',
      count: counts.offline,
      icon: <WifiOff className="h-3.5 w-3.5" />,
      color: STATUS_COLOR.offline,
    },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
      {/* Nome da sala e status de conexão */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: connected ? '#22c55e' : '#94a3b8' }}
          />
          <span className="text-xs text-slate-500">
            {connected ? 'Ao vivo' : 'Simulação'}
          </span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-sm font-semibold text-slate-700">{roomName}</span>
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-1">
        {filters.map((f) => {
          const isActive = filterStatus === f.status;
          return (
            <button
              key={f.status}
              onClick={() => onFilterChange(f.status)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span style={{ color: isActive ? 'white' : f.color }}>{f.icon}</span>
              {f.label}
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

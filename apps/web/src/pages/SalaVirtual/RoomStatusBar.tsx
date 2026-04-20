import React from 'react';
import { UserPresence, STATUS_COLOR, PresenceStatus } from '@/lib/presence/presence.types';
import {
  Wifi,
  WifiOff,
  Users,
  MessageCircle,
  Phone,
  Coffee,
  Inbox,
  TrendingUp,
  Activity,
} from 'lucide-react';

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

  const active = users.filter((u) => u.status !== 'offline' && u.metrics);
  const totalFila = active.reduce((s, u) => s + (u.metrics?.filaAtual ?? 0), 0);
  const totalAtend = active.reduce((s, u) => s + (u.metrics?.atendimentosHoje ?? 0), 0);
  const avgTempo = active.length
    ? Math.round(
        active.reduce((s, u) => s + (u.metrics?.tempoMedioResposta ?? 0), 0) / active.length,
      )
    : 0;
  const ocupados = counts.busy_chat + counts.busy_call;

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
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-200 bg-white">
      {/* Nome da sala e status de conexão */}
      <div className="flex items-center gap-2.5 shrink-0">
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

      {/* KPIs agregados */}
      <div className="hidden lg:flex items-center gap-2">
        <KpiPill
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Ocupados"
          value={`${ocupados}/${counts.all - counts.offline}`}
          tone="blue"
        />
        <KpiPill
          icon={<Inbox className="h-3.5 w-3.5" />}
          label="Fila total"
          value={String(totalFila)}
          tone={totalFila > 20 ? 'amber' : 'slate'}
        />
        <KpiPill
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Atend. hoje"
          value={String(totalAtend)}
          tone="slate"
        />
        <KpiPill
          icon={<Coffee className="h-3.5 w-3.5" />}
          label="T. médio"
          value={`${avgTempo}m`}
          tone="slate"
        />
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-1 ml-auto">
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

function KpiPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'slate' | 'blue' | 'amber';
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${toneClass}`}
    >
      <span className="opacity-70">{icon}</span>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

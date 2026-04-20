import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPresence,
  STATUS_LABEL,
  STATUS_COLOR,
  ROLE_LABEL,
  ACTIVITY_LABEL,
} from '@/lib/presence/presence.types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  MessageCircle,
  Phone,
  Coffee,
  Wifi,
  WifiOff,
  Clock,
  Users,
  TrendingUp,
  Inbox,
  X,
  Bot,
  Instagram,
  Headphones,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// AttendantPanel
//
// Painel lateral deslizante que exibe os detalhes completos de um atendente
// ou agente de IA selecionado na sala virtual.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  user: UserPresence | null;
  onClose: () => void;
}

/**
 * Formata a duração em segundos para "Xm Ys" ou "Xh Ym".
 */
function formatDuration(startedAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Ícone do canal de atividade.
 */
function ActivityChannelIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4';
  switch (type) {
    case 'whatsapp':    return <MessageCircle className={cls} style={{ color: '#22c55e' }} />;
    case 'instagram':   return <Instagram className={cls} style={{ color: '#e1306c' }} />;
    case 'ligacao':     return <Phone className={cls} style={{ color: '#f59e0b' }} />;
    case 'ticket':      return <Headphones className={cls} style={{ color: '#3b82f6' }} />;
    case 'bot_processing': return <Bot className={cls} style={{ color: '#94a3b8' }} />;
    default:            return <MessageCircle className={cls} />;
  }
}

/**
 * Ícone do status de presença.
 */
function StatusIcon({ status }: { status: string }) {
  const cls = 'h-4 w-4';
  switch (status) {
    case 'busy_chat':   return <MessageCircle className={cls} />;
    case 'busy_call':   return <Phone className={cls} />;
    case 'away_break':  return <Coffee className={cls} />;
    case 'online_idle': return <Wifi className={cls} />;
    default:            return <WifiOff className={cls} />;
  }
}

/**
 * Cronômetro em tempo real que atualiza a cada segundo.
 */
function LiveTimer({ startedAt }: { startedAt: string }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="font-mono text-sm font-semibold">{formatDuration(startedAt)}</span>;
}

export function AttendantPanel({ user, onClose }: Props) {
  return (
    <AnimatePresence>
      {user && (
        <motion.aside
          key={user.userId}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto"
        >
          {/* ── Cabeçalho ── */}
          <div className="flex items-start justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={user.nome} size="lg" />
                {/* Bolinha de status */}
                <span
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white"
                  style={{ background: STATUS_COLOR[user.status] }}
                />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{user.nome}</div>
                <div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Status atual ── */}
          <div className="p-4 border-b border-slate-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Status atual
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                background: `${STATUS_COLOR[user.status]}18`,
                color: STATUS_COLOR[user.status],
              }}
            >
              <StatusIcon status={user.status} />
              {STATUS_LABEL[user.status]}
              <span className="ml-auto text-xs opacity-70">
                <LiveTimer startedAt={user.statusUpdatedAt} />
              </span>
            </div>
          </div>

          {/* ── Atividade atual ── */}
          {user.currentActivity && (
            <div className="p-4 border-b border-slate-100">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Atendimento em curso
              </div>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ActivityChannelIcon type={user.currentActivity.type} />
                  <span className="text-xs font-medium text-slate-600">
                    {ACTIVITY_LABEL[user.currentActivity.type]}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {user.currentActivity.targetName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Duração: </span>
                  <LiveTimer startedAt={user.currentActivity.startedAt} />
                </div>
              </div>
            </div>
          )}

          {/* ── Métricas do dia ── */}
          {user.metrics && (
            <div className="p-4 border-b border-slate-100">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Métricas de hoje
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MetricCard
                  icon={<Users className="h-4 w-4 text-blue-500" />}
                  label="Atendimentos"
                  value={String(user.metrics.atendimentosHoje)}
                />
                <MetricCard
                  icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                  label="T. Médio"
                  value={`${user.metrics.tempoMedioResposta}m`}
                />
                <MetricCard
                  icon={<Inbox className="h-4 w-4 text-amber-500" />}
                  label="Na fila"
                  value={String(user.metrics.filaAtual)}
                  highlight={user.metrics.filaAtual > 5}
                />
              </div>
            </div>
          )}

          {/* ── Ações rápidas ── */}
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Ações rápidas
            </div>
            <div className="space-y-2">
              <QuickActionButton
                icon={<MessageCircle className="h-4 w-4" />}
                label="Ver conversas"
                href={`/whatsapp?corretor=${user.userId}`}
              />
              {user.role !== 'bot' && (
                <QuickActionButton
                  icon={<Users className="h-4 w-4" />}
                  label="Ver perfil completo"
                  href={`/corretores`}
                />
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center ${
        highlight ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'
      }`}
    >
      {icon}
      <span className={`text-base font-bold ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>
        {value}
      </span>
      <span className="text-[9px] text-slate-500 leading-tight">{label}</span>
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition border border-slate-200 hover:border-slate-300"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </a>
  );
}

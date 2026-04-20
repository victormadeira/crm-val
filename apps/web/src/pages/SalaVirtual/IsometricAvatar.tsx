import React, { useEffect, useRef } from 'react';
import { UserPresence, STATUS_COLOR, PresenceStatus } from '@/lib/presence/presence.types';

// ─────────────────────────────────────────────────────────────────────────────
// IsometricAvatar
//
// Renderiza um avatar isométrico simplificado usando SVG inline.
// Cada avatar representa um atendente ou agente de IA na sala virtual.
//
// Estrutura visual:
//   - Mesa isométrica (retângulo projetado)
//   - Cadeira
//   - Boneco sentado (cabeça + corpo)
//   - Indicador de status (bolinha colorida)
//   - Balão de atividade (ícone flutuante)
//   - Nome abaixo
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  user: UserPresence;
  isSelected: boolean;
  onClick: () => void;
  /** Posição em pixels no canvas da sala */
  px: number;
  py: number;
}

// Paleta de cores de avatar baseada no papel
const ROLE_COLORS: Record<string, { body: string; desk: string }> = {
  corretor:   { body: '#60a5fa', desk: '#bfdbfe' },  // blue
  sac:        { body: '#34d399', desk: '#a7f3d0' },  // green
  supervisor: { body: '#f59e0b', desk: '#fde68a' },  // amber
  gestor:     { body: '#a78bfa', desk: '#ddd6fe' },  // violet
  admin:      { body: '#f87171', desk: '#fecaca' },  // red
  bot:        { body: '#94a3b8', desk: '#e2e8f0' },  // slate (IA)
};

// Ícone de atividade por status
function ActivityIcon({ status }: { status: PresenceStatus }) {
  if (status === 'busy_chat') {
    return (
      <g transform="translate(-6, -36)">
        {/* Balão de chat */}
        <rect x="0" y="0" width="12" height="9" rx="3" fill="white" stroke="#3b82f6" strokeWidth="1.2" />
        <circle cx="3" cy="4.5" r="1" fill="#3b82f6" />
        <circle cx="6" cy="4.5" r="1" fill="#3b82f6" />
        <circle cx="9" cy="4.5" r="1" fill="#3b82f6" />
        <polygon points="3,9 6,12 6,9" fill="white" stroke="#3b82f6" strokeWidth="0.8" />
      </g>
    );
  }
  if (status === 'busy_call') {
    return (
      <g transform="translate(-5, -36)">
        {/* Ícone de telefone */}
        <rect x="0" y="0" width="10" height="10" rx="2" fill="#f59e0b" />
        <text x="5" y="8" textAnchor="middle" fontSize="7" fill="white">📞</text>
      </g>
    );
  }
  if (status === 'away_break') {
    return (
      <g transform="translate(-5, -36)">
        {/* Ícone de xícara */}
        <rect x="0" y="0" width="10" height="10" rx="2" fill="#a855f7" />
        <text x="5" y="8" textAnchor="middle" fontSize="7" fill="white">☕</text>
      </g>
    );
  }
  return null;
}

export function IsometricAvatar({ user, isSelected, onClick, px, py }: Props) {
  const colors = ROLE_COLORS[user.role] ?? ROLE_COLORS.corretor;
  const statusColor = STATUS_COLOR[user.status];
  const isOffline = user.status === 'offline';
  const isBot = user.role === 'bot';

  // Iniciais do nome para o avatar
  const initials = user.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const opacity = isOffline ? 0.35 : 1;

  return (
    <g
      transform={`translate(${px}, ${py})`}
      onClick={onClick}
      style={{ cursor: 'pointer', opacity }}
      className="presence-avatar"
    >
      {/* Sombra de seleção */}
      {isSelected && (
        <ellipse
          cx="0" cy="8"
          rx="28" ry="10"
          fill={colors.body}
          opacity="0.25"
        />
      )}

      {/* ── Mesa isométrica ── */}
      {/* Tampo da mesa */}
      <polygon
        points="-22,0  0,-11  22,0  0,11"
        fill={colors.desk}
        stroke={isSelected ? colors.body : '#cbd5e1'}
        strokeWidth={isSelected ? 1.5 : 0.8}
      />
      {/* Lateral esquerda da mesa */}
      <polygon
        points="-22,0  -22,7  0,18  0,11"
        fill={isBot ? '#cbd5e1' : '#dbeafe'}
        stroke="#cbd5e1"
        strokeWidth="0.5"
      />
      {/* Lateral direita da mesa */}
      <polygon
        points="22,0  22,7  0,18  0,11"
        fill={isBot ? '#e2e8f0' : '#eff6ff'}
        stroke="#cbd5e1"
        strokeWidth="0.5"
      />

      {/* ── Cadeira (simplificada) ── */}
      <rect x="-7" y="4" width="14" height="8" rx="2" fill="#94a3b8" opacity="0.6" />

      {/* ── Corpo do boneco ── */}
      {/* Corpo */}
      <rect
        x="-7" y="-22" width="14" height="16" rx="3"
        fill={isBot ? '#94a3b8' : colors.body}
      />
      {/* Cabeça */}
      <circle
        cx="0" cy="-30"
        r={isBot ? 9 : 10}
        fill={isBot ? '#64748b' : colors.body}
        stroke="white"
        strokeWidth="1.5"
      />

      {/* Iniciais ou ícone de bot */}
      {isBot ? (
        <text
          x="0" y="-26"
          textAnchor="middle"
          fontSize="9"
          fill="white"
          fontWeight="bold"
        >
          🤖
        </text>
      ) : (
        <text
          x="0" y="-26"
          textAnchor="middle"
          fontSize="8"
          fill="white"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {initials}
        </text>
      )}

      {/* ── Indicador de status (bolinha) ── */}
      <circle
        cx="8" cy="-38"
        r="4"
        fill={statusColor}
        stroke="white"
        strokeWidth="1.5"
      />

      {/* ── Ícone de atividade ── */}
      <ActivityIcon status={user.status} />

      {/* ── Nome ── */}
      <text
        x="0" y="30"
        textAnchor="middle"
        fontSize="9"
        fill={isOffline ? '#94a3b8' : '#1e293b'}
        fontFamily="system-ui, sans-serif"
        fontWeight={isSelected ? 'bold' : 'normal'}
      >
        {user.nome.split(' ')[0]}
      </text>

      {/* Anel de seleção */}
      {isSelected && (
        <circle
          cx="0" cy="-30"
          r="13"
          fill="none"
          stroke={colors.body}
          strokeWidth="2"
          strokeDasharray="4 2"
        />
      )}
    </g>
  );
}

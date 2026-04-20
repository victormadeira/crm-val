import {
  UserPresence,
  STATUS_COLOR,
  STATUS_LABEL,
  ROLE_LABEL,
  ACTIVITY_LABEL,
} from "@/lib/presence/presence.types";

interface Props {
  user: UserPresence;
  isSelected: boolean;
  onClick: () => void;
  x: number;
  y: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarHue(user: UserPresence): string {
  const palettes: Record<string, { bg: string; fg: string }> = {
    corretor: { bg: "#1E7BE6", fg: "#ffffff" },
    sac: { bg: "#0891B2", fg: "#ffffff" },
    supervisor: { bg: "#D97706", fg: "#ffffff" },
    gestor: { bg: "#7C3AED", fg: "#ffffff" },
    admin: { bg: "#DC2626", fg: "#ffffff" },
    bot: { bg: "#475569", fg: "#ffffff" },
  };
  const base = palettes[user.role] ?? palettes.corretor;

  // small variation per user
  const shift = (hashString(user.userId) % 20) - 10;
  if (user.role === "bot") return base.bg;
  return shiftLightness(base.bg, shift);
}

function shiftLightness(hex: string, delta: number): string {
  // Convert hex to hsl, apply delta to l, return hex
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  if (max !== min) {
    if (max === r) h = (g - b) / (max - min) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h *= 60;
  }
  const newL = Math.max(0.25, Math.min(0.75, l + delta / 100));
  return hslToHex(h, s, newL);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function TopDownAvatar({ user, isSelected, onClick, x, y }: Props) {
  const statusColor = STATUS_COLOR[user.status];
  const isOffline = user.status === "offline";
  const isBusy = user.status === "busy_chat" || user.status === "busy_call";
  const isBot = user.role === "bot";
  const opacity = isOffline ? 0.45 : 1;

  const tooltip = (() => {
    const lines = [`${user.nome} · ${ROLE_LABEL[user.role]}`, STATUS_LABEL[user.status]];
    if (user.currentActivity) {
      lines.push(
        `${ACTIVITY_LABEL[user.currentActivity.type]}: ${user.currentActivity.targetName}`,
      );
    }
    if (user.metrics?.filaAtual) lines.push(`${user.metrics.filaAtual} na fila`);
    return lines.join("\n");
  })();

  const bg = avatarHue(user);
  const initials = getInitials(user.nome);
  const clipId = `avatar-clip-${user.userId}`;

  const RADIUS = 17;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: "pointer", opacity, transition: "transform 320ms ease" }}
      className="presence-avatar-topdown"
    >
      <title>{tooltip}</title>

      {/* Sombra no chão */}
      <ellipse cx="0" cy="2" rx={RADIUS + 1} ry={RADIUS * 0.35} fill="rgba(15, 23, 42, 0.18)" />

      {/* Anel animado quando ocupado */}
      {isBusy && (
        <circle cx="0" cy="0" r={RADIUS + 2} fill="none" stroke={statusColor} strokeWidth="1.5">
          <animate attributeName="r" values={`${RADIUS + 2};${RADIUS + 7};${RADIUS + 2}`} dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Borda de seleção */}
      {isSelected && (
        <circle cx="0" cy="0" r={RADIUS + 4} fill="none" stroke="#1E7BE6" strokeWidth="2.5" />
      )}

      {/* Foto clipada (se existir) ou círculo com iniciais */}
      <defs>
        <clipPath id={clipId}>
          <circle cx="0" cy="0" r={RADIUS} />
        </clipPath>
      </defs>

      <circle
        cx="0"
        cy="0"
        r={RADIUS}
        fill={bg}
        stroke="white"
        strokeWidth="2.5"
      />

      {user.photoUrl ? (
        <image
          href={user.photoUrl}
          x={-RADIUS}
          y={-RADIUS}
          width={RADIUS * 2}
          height={RADIUS * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : isBot ? (
        <BotFace />
      ) : (
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="white"
          fontFamily="Inter, system-ui, sans-serif"
          style={{ userSelect: "none" }}
        >
          {initials}
        </text>
      )}

      {/* Ponto de status */}
      <circle
        cx={RADIUS - 3}
        cy={RADIUS - 3}
        r="5"
        fill={statusColor}
        stroke="white"
        strokeWidth="1.8"
      />

      {/* Fila badge (canto esquerdo inferior) */}
      {user.metrics && user.metrics.filaAtual > 0 && (
        <g transform={`translate(${-(RADIUS - 3)}, ${RADIUS - 3})`}>
          <circle
            cx="0"
            cy="0"
            r="7"
            fill={user.metrics.filaAtual >= 5 ? "#ef4444" : "#64748b"}
            stroke="white"
            strokeWidth="1.5"
          >
            {user.metrics.filaAtual >= 5 && (
              <animate
                attributeName="opacity"
                values="1;0.55;1"
                dur="1.4s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <text
            textAnchor="middle"
            y="2.5"
            fontSize="8"
            fontWeight="700"
            fill="white"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {user.metrics.filaAtual > 9 ? "9+" : user.metrics.filaAtual}
          </text>
        </g>
      )}

      {/* Nome abaixo */}
      <g transform={`translate(0, ${RADIUS + 14})`}>
        <rect
          x="-28"
          y="-7"
          width="56"
          height="13"
          rx="3"
          fill={isSelected ? "#1E7BE6" : "white"}
          stroke={isSelected ? "#0B6BCB" : "#e2e8f0"}
          strokeWidth="0.8"
        />
        <text
          textAnchor="middle"
          y="2.5"
          fontSize="8.5"
          fill={isSelected ? "white" : "#0f172a"}
          fontWeight={isSelected ? "700" : "600"}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {user.nome.split(" ")[0]}
        </text>
      </g>
    </g>
  );
}

function BotFace() {
  return (
    <g>
      {/* visor */}
      <rect x="-9" y="-4" width="18" height="7" rx="2" fill="#0f172a" />
      <rect x="-7" y="-3" width="4" height="5" rx="1" fill="#22d3ee">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
      </rect>
      <rect x="3" y="-3" width="4" height="5" rx="1" fill="#22d3ee">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
      </rect>
      {/* antena */}
      <line x1="0" y1="-12" x2="0" y2="-8" stroke="white" strokeWidth="1.5" />
      <circle cx="0" cy="-13" r="1.8" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

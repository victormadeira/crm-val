import { UserPresence, STATUS_COLOR, PresenceStatus } from "@/lib/presence/presence.types";

interface Props {
  user: UserPresence;
  isSelected: boolean;
  onClick: () => void;
  px: number;
  py: number;
}

// Paleta por papel — alinhada ao tailwind.config.js do CRM
const ROLE_PALETTE = {
  corretor: {
    shirt: "#1E7BE6",
    shirtDark: "#0B6BCB",
    desk: "#E0EDFB",
    deskSide: "#C4D8F2",
  },
  sac: {
    shirt: "#0891B2",
    shirtDark: "#0E7490",
    desk: "#CFFAFE",
    deskSide: "#A5F3FC",
  },
  supervisor: {
    shirt: "#D97706",
    shirtDark: "#B45309",
    desk: "#FEF3C7",
    deskSide: "#FDE68A",
  },
  gestor: {
    shirt: "#7C3AED",
    shirtDark: "#6D28D9",
    desk: "#EDE9FE",
    deskSide: "#DDD6FE",
  },
  admin: {
    shirt: "#DC2626",
    shirtDark: "#B91C1C",
    desk: "#FEE2E2",
    deskSide: "#FECACA",
  },
  bot: {
    shirt: "#64748B",
    shirtDark: "#475569",
    desk: "#E2E8F0",
    deskSide: "#CBD5E1",
  },
} as const;

const SKIN_TONES = ["#F4C9A0", "#E5AA7A", "#C68B5F", "#A06A41", "#6F4A2A"];
const HAIR_TONES = ["#2D1F14", "#4A2E1A", "#6B3E23", "#8B5A2B", "#C0933F", "#3B2621"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function GroundShadow({ selected, color }: { selected: boolean; color: string }) {
  return (
    <ellipse
      cx="0"
      cy="14"
      rx="20"
      ry="6"
      fill={selected ? color : "#0f172a"}
      opacity={selected ? 0.25 : 0.18}
    />
  );
}

function HumanAvatar({ user, selected }: { user: UserPresence; selected: boolean }) {
  const palette = ROLE_PALETTE[user.role] ?? ROLE_PALETTE.corretor;
  const seed = hashString(user.userId);
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_TONES[(seed >> 3) % HAIR_TONES.length];
  const hasLongHair = seed % 3 === 0;

  return (
    <g>
      <path
        d="M -10,-8  L -12,-22  L 12,-22  L 10,-8  Z"
        fill={palette.shirt}
        stroke={palette.shirtDark}
        strokeWidth="0.6"
      />
      <path
        d="M -10,-8  L -12,-22  L -4,-22  L -3,-8  Z"
        fill={palette.shirtDark}
        opacity="0.35"
      />
      <path d="M -3,-22  L 0,-18  L 3,-22  Z" fill={palette.shirtDark} />
      <rect x="-2.5" y="-25" width="5" height="4" fill={skin} />
      <circle cx="0" cy="-30" r="6.5" fill={skin} stroke="#0f172a" strokeWidth="0.3" />
      <circle cx="-6.2" cy="-29.5" r="1.2" fill={skin} />
      <circle cx="6.2" cy="-29.5" r="1.2" fill={skin} />
      {hasLongHair ? (
        <path
          d="M -6.8,-32  Q -7,-36 0,-36.5  Q 7,-36 6.8,-32  L 6.8,-27  L 5.5,-28  L 5,-31  L 3,-32.5  Q 0,-33 -3,-32.5  L -5,-31  L -5.5,-28  L -6.8,-27  Z"
          fill={hair}
        />
      ) : (
        <path
          d="M -6.5,-32.5  Q -6.8,-36 0,-36.5  Q 6.8,-36 6.5,-32.5  Q 3,-33.5 0,-33  Q -3,-33.5 -6.5,-32.5 Z"
          fill={hair}
        />
      )}
      <circle cx="-2.3" cy="-30" r="0.7" fill="#0f172a" />
      <circle cx="2.3" cy="-30" r="0.7" fill="#0f172a" />
      <line
        x1="-1.5"
        y1="-27.5"
        x2="1.5"
        y2="-27.5"
        stroke="#0f172a"
        strokeWidth="0.4"
        strokeLinecap="round"
      />
      {selected && (
        <circle
          cx="0"
          cy="-30"
          r="10"
          fill="none"
          stroke={palette.shirt}
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
        />
      )}
    </g>
  );
}

function RobotAvatar({ selected, pulse }: { selected: boolean; pulse: boolean }) {
  return (
    <g>
      <path
        d="M -11,-8  L -13,-22  L 13,-22  L 11,-8  Z"
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="0.8"
      />
      <path d="M -11,-8  L -13,-22  L -5,-22  L -4,-8  Z" fill="#475569" opacity="0.45" />
      <circle cx="-9" cy="-11" r="0.7" fill="#334155" />
      <circle cx="9" cy="-11" r="0.7" fill="#334155" />
      <circle cx="-9" cy="-19" r="0.7" fill="#334155" />
      <circle cx="9" cy="-19" r="0.7" fill="#334155" />
      <rect x="-5" y="-17" width="10" height="4" rx="0.8" fill="#0f172a" />
      <circle cx="-2.5" cy="-15" r="0.9" fill={pulse ? "#22d3ee" : "#64748b"}>
        {pulse && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="0" cy="-15" r="0.9" fill={pulse ? "#22d3ee" : "#64748b"}>
        {pulse && (
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx="2.5" cy="-15" r="0.9" fill={pulse ? "#22d3ee" : "#64748b"}>
        {pulse && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.4s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <rect x="-2" y="-25" width="4" height="3.5" fill="#64748b" />
      <path
        d="M -7,-25  L -7.5,-32  Q -7.5,-36 0,-36.5  Q 7.5,-36 7.5,-32  L 7,-25  Z"
        fill="#cbd5e1"
        stroke="#475569"
        strokeWidth="0.6"
      />
      <path
        d="M -4,-35.5  Q -4.5,-33 -3,-31  L 3,-31  Q 4.5,-33 4,-35.5  Q 0,-36.8 -4,-35.5 Z"
        fill="#f1f5f9"
        opacity="0.7"
      />
      <rect x="-5.5" y="-30" width="11" height="3" rx="1.2" fill="#0f172a" />
      <rect x="-5" y="-29.6" width="10" height="0.5" fill="#22d3ee" opacity="0.9">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
      <line x1="0" y1="-36.5" x2="0" y2="-40.5" stroke="#475569" strokeWidth="0.8" />
      <circle cx="0" cy="-41.2" r="1.2" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
      </circle>
      {selected && (
        <rect
          x="-10"
          y="-37"
          width="20"
          height="32"
          rx="3"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.4"
          strokeDasharray="2 2"
        />
      )}
    </g>
  );
}

function IsoDesk({ colors }: { colors: { desk: string; deskSide: string } }) {
  return (
    <g>
      <polygon points="24,2  24,10  0,20  0,12" fill={colors.deskSide} opacity="0.85" />
      <polygon points="-24,2  -24,10  0,20  0,12" fill={colors.deskSide} />
      <polygon points="-24,2  -24,10  0,20  0,12" fill="#0f172a" opacity="0.18" />
      <polygon
        points="-24,2  0,-10  24,2  0,12"
        fill={colors.desk}
        stroke="#94a3b8"
        strokeWidth="0.5"
      />
      <polygon points="-18,1.5  0,-7.5  6,-4.5  -12,4.5" fill="white" opacity="0.35" />
    </g>
  );
}

function ActivityBubble({ status }: { status: PresenceStatus }) {
  if (status === "busy_chat") {
    return (
      <g transform="translate(9, -45)">
        <circle cx="0" cy="0" r="7" fill="white" stroke="#1E7BE6" strokeWidth="1.2" />
        <circle cx="-2.8" cy="0" r="0.9" fill="#1E7BE6" />
        <circle cx="0" cy="0" r="0.9" fill="#1E7BE6" />
        <circle cx="2.8" cy="0" r="0.9" fill="#1E7BE6" />
        <path
          d="M -2.5,5.5  L 0,8  L -0.5,5.5 Z"
          fill="white"
          stroke="#1E7BE6"
          strokeWidth="1"
        />
      </g>
    );
  }
  if (status === "busy_call") {
    return (
      <g transform="translate(9, -45)">
        <circle cx="0" cy="0" r="7" fill="white" stroke="#D97706" strokeWidth="1.2" />
        <path
          d="M -2.5,-2.5  L -1,-2.5  L 0,-0.5  L -1,0.5  Q 0,2 1.5,3  L 2.5,2  L 4.5,3  L 4.5,4.5  Q 4.5,5 4,5  Q -1,5 -4,-1.5  Q -4,-2 -3.5,-2 Z"
          fill="#D97706"
        />
      </g>
    );
  }
  if (status === "away_break") {
    return (
      <g transform="translate(9, -45)">
        <circle cx="0" cy="0" r="7" fill="white" stroke="#7C3AED" strokeWidth="1.2" />
        <rect x="-3" y="-2" width="5" height="5" rx="0.6" fill="#7C3AED" />
        <path
          d="M 2,-1  Q 4,-1 4,1  Q 4,2.5 2,2.5"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="1"
        />
        <line x1="-2.5" y1="-3.5" x2="-2.5" y2="-4.5" stroke="#7C3AED" strokeWidth="0.8" />
        <line x1="-0.5" y1="-3.5" x2="-0.5" y2="-4.5" stroke="#7C3AED" strokeWidth="0.8" />
        <line x1="1.5" y1="-3.5" x2="1.5" y2="-4.5" stroke="#7C3AED" strokeWidth="0.8" />
      </g>
    );
  }
  return null;
}

function QueueBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const urgent = count >= 5;
  return (
    <g transform="translate(16, 23)">
      <rect
        x="-8"
        y="-6"
        width="16"
        height="12"
        rx="6"
        fill={urgent ? "#DC2626" : "#64748B"}
      >
        {urgent && (
          <animate attributeName="opacity" values="1;0.6;1" dur="1.2s" repeatCount="indefinite" />
        )}
      </rect>
      <text
        x="0"
        y="2.5"
        textAnchor="middle"
        fontSize="8.5"
        fill="white"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {count}
      </text>
    </g>
  );
}

export function IsometricAvatar({ user, isSelected, onClick, px, py }: Props) {
  const palette = ROLE_PALETTE[user.role] ?? ROLE_PALETTE.corretor;
  const statusColor = STATUS_COLOR[user.status];
  const isOffline = user.status === "offline";
  const isBot = user.role === "bot";
  const opacity = isOffline ? 0.4 : 1;

  return (
    <g
      transform={`translate(${px}, ${py})`}
      onClick={onClick}
      style={{ cursor: "pointer", opacity }}
      className="presence-avatar"
    >
      <rect x="-26" y="-42" width="52" height="76" fill="transparent" />
      <GroundShadow selected={isSelected} color={palette.shirt} />
      <IsoDesk colors={palette} />
      {isBot ? (
        <RobotAvatar selected={isSelected} pulse={!isOffline} />
      ) : (
        <HumanAvatar user={user} selected={isSelected} />
      )}

      <g>
        <circle cx="7" cy="-36" r="3.5" fill={statusColor} stroke="white" strokeWidth="1.2" />
        {(user.status === "busy_chat" || user.status === "busy_call") && (
          <circle cx="7" cy="-36" r="3.5" fill="none" stroke={statusColor} strokeWidth="1">
            <animate attributeName="r" values="3.5;6;3.5" dur="1.8s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.8;0;0.8"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </g>

      <ActivityBubble status={user.status} />
      <QueueBadge count={user.metrics?.filaAtual ?? 0} />

      <g transform="translate(0, 30)">
        <rect
          x="-22"
          y="-6.5"
          width="44"
          height="12"
          rx="3"
          fill={isSelected ? palette.shirtDark : "white"}
          stroke={isSelected ? palette.shirt : "#e2e8f0"}
          strokeWidth="0.8"
        />
        <text
          textAnchor="middle"
          y="2"
          fontSize="8"
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

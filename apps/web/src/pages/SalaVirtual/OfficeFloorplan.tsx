import { useMemo } from "react";
import { UserPresence } from "@/lib/presence/presence.types";
import { TopDownAvatar } from "./TopDownAvatar";

// ─────────────────────────────────────────────────────────────────────────────
// OfficeFloorplan
// Planta baixa 2D (vista de cima) do escritório.
// Cada usuário é posicionado numa sala com base em `role + status + activity`.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  users: UserPresence[];
  selectedUserId: string | null;
  onSelectUser: (id: string | null) => void;
  filteredUserIds?: Set<string>;
}

const VIEW_W = 1000;
const VIEW_H = 720;

type RoomId =
  | "recepcao"
  | "descanso"
  | "master"
  | "comercial"
  | "suporte"
  | "agentes";

interface Room {
  id: RoomId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  accent: string;
  seats: Array<{ x: number; y: number }>;
}

// Salas no grid. Coordenadas são do canto superior esquerdo.
const ROOMS: Room[] = [
  {
    id: "recepcao",
    label: "Recepção",
    x: 20,
    y: 20,
    w: 200,
    h: 220,
    fill: "#FFF7ED",
    stroke: "#FED7AA",
    accent: "#EA580C",
    seats: [
      { x: 60, y: 150 },
      { x: 100, y: 150 },
      { x: 140, y: 150 },
      { x: 60, y: 190 },
      { x: 100, y: 190 },
      { x: 140, y: 190 },
    ],
  },
  {
    id: "descanso",
    label: "Sala de descanso",
    x: 240,
    y: 20,
    w: 300,
    h: 220,
    fill: "#F0FDF4",
    stroke: "#BBF7D0",
    accent: "#16A34A",
    seats: [
      { x: 60, y: 100 },
      { x: 110, y: 100 },
      { x: 160, y: 100 },
      { x: 210, y: 100 },
      { x: 80, y: 170 },
      { x: 140, y: 170 },
      { x: 200, y: 170 },
      { x: 250, y: 170 },
    ],
  },
  {
    id: "master",
    label: "Sala de reunião",
    x: 560,
    y: 20,
    w: 420,
    h: 220,
    fill: "#FAF5FF",
    stroke: "#E9D5FF",
    accent: "#7C3AED",
    seats: [
      { x: 70, y: 80 },
      { x: 130, y: 80 },
      { x: 190, y: 80 },
      { x: 250, y: 80 },
      { x: 310, y: 80 },
      { x: 370, y: 80 },
      { x: 70, y: 160 },
      { x: 130, y: 160 },
      { x: 190, y: 160 },
      { x: 250, y: 160 },
      { x: 310, y: 160 },
      { x: 370, y: 160 },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    x: 20,
    y: 280,
    w: 520,
    h: 420,
    fill: "#EFF6FF",
    stroke: "#BFDBFE",
    accent: "#1E7BE6",
    seats: [
      { x: 90, y: 110 },
      { x: 190, y: 110 },
      { x: 290, y: 110 },
      { x: 390, y: 110 },
      { x: 470, y: 110 },
      { x: 90, y: 220 },
      { x: 190, y: 220 },
      { x: 290, y: 220 },
      { x: 390, y: 220 },
      { x: 470, y: 220 },
      { x: 90, y: 330 },
      { x: 190, y: 330 },
      { x: 290, y: 330 },
      { x: 390, y: 330 },
      { x: 470, y: 330 },
    ],
  },
  {
    id: "suporte",
    label: "Suporte / SAC",
    x: 560,
    y: 280,
    w: 240,
    h: 420,
    fill: "#ECFEFF",
    stroke: "#A5F3FC",
    accent: "#0891B2",
    seats: [
      { x: 70, y: 110 },
      { x: 170, y: 110 },
      { x: 70, y: 220 },
      { x: 170, y: 220 },
      { x: 70, y: 330 },
      { x: 170, y: 330 },
    ],
  },
  {
    id: "agentes",
    label: "Agentes IA",
    x: 820,
    y: 280,
    w: 160,
    h: 420,
    fill: "#F5F3FF",
    stroke: "#DDD6FE",
    accent: "#7C3AED",
    seats: [
      { x: 80, y: 110 },
      { x: 80, y: 200 },
      { x: 80, y: 290 },
      { x: 80, y: 380 },
    ],
  },
];

function assignRoom(user: UserPresence): RoomId {
  if (user.status === "offline") return "recepcao";
  if (user.status === "away_break") return "descanso";

  const a = user.currentActivity;

  if (user.role === "bot") {
    if (a?.type === "ticket") return "suporte";
    if (a?.type === "whatsapp" || a?.type === "instagram" || a?.type === "pipeline") {
      return "comercial";
    }
    return "agentes";
  }

  if (user.role === "sac") {
    return "suporte";
  }

  if (user.role === "supervisor" || user.role === "gestor" || user.role === "admin") {
    if (a?.type === "pipeline") return "master";
    return "comercial";
  }

  // corretor (padrão)
  if (a?.type === "pipeline") return "master";
  return "comercial";
}

function Furniture({ room }: { room: Room }) {
  switch (room.id) {
    case "recepcao":
      return (
        <g>
          {/* Balcão */}
          <rect x="20" y="40" width="160" height="36" rx="6" fill="#D6BC9B" stroke="#A68567" strokeWidth="1" />
          <rect x="20" y="40" width="160" height="8" rx="6" fill="#C4A07F" />
          {/* Sofá de espera */}
          <rect x="30" y="130" width="150" height="36" rx="10" fill="#C7D2FE" stroke="#A5B4FC" strokeWidth="1" />
          <rect x="30" y="130" width="150" height="12" rx="6" fill="#A5B4FC" />
          {/* Planta */}
          <circle cx="180" cy="200" r="10" fill="#22C55E" />
          <circle cx="175" cy="194" r="7" fill="#16A34A" />
        </g>
      );
    case "descanso":
      return (
        <g>
          {/* Sofá */}
          <rect x="30" y="75" width="200" height="40" rx="12" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1" />
          <rect x="30" y="75" width="200" height="12" rx="6" fill="#FDBA74" />
          {/* Mesa de café */}
          <rect x="95" y="130" width="100" height="20" rx="4" fill="#E7D3B0" stroke="#C8AC7F" strokeWidth="1" />
          {/* Armchair cantos */}
          <rect x="40" y="150" width="40" height="36" rx="8" fill="#FECACA" stroke="#FCA5A5" strokeWidth="1" />
          <rect x="220" y="150" width="40" height="36" rx="8" fill="#FECACA" stroke="#FCA5A5" strokeWidth="1" />
          {/* Planta decorativa */}
          <circle cx="275" cy="45" r="8" fill="#22C55E" />
          <circle cx="270" cy="40" r="6" fill="#16A34A" />
        </g>
      );
    case "master":
      return (
        <g>
          {/* Mesa de reunião */}
          <rect
            x="50"
            y="100"
            width="320"
            height="40"
            rx="20"
            fill="#D6BC9B"
            stroke="#A68567"
            strokeWidth="1.2"
          />
          <rect x="50" y="100" width="320" height="10" rx="20" fill="#C4A07F" />
          {/* TV na parede */}
          <rect x="170" y="30" width="80" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <rect x="174" y="34" width="72" height="16" rx="1" fill="#334155" />
        </g>
      );
    case "comercial":
      return (
        <g>
          {/* 5 blocos de mesa compridos */}
          {[90, 190, 290, 390, 470].map((cx) => (
            <g key={cx}>
              {/* Mesa */}
              <rect
                x={cx - 30}
                y={80}
                width="60"
                height="260"
                rx="4"
                fill="white"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              {/* Divisórias de mesa */}
              <line
                x1={cx}
                y1={80}
                x2={cx}
                y2={340}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Monitores simplificados */}
              {[110, 220, 330].map((my) => (
                <rect
                  key={my}
                  x={cx - 8}
                  y={my - 16}
                  width="16"
                  height="4"
                  rx="1"
                  fill="#0f172a"
                />
              ))}
            </g>
          ))}
        </g>
      );
    case "suporte":
      return (
        <g>
          {[70, 170].map((cx) => (
            <g key={cx}>
              <rect
                x={cx - 26}
                y={80}
                width="52"
                height="260"
                rx="4"
                fill="white"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <line
                x1={cx}
                y1={80}
                x2={cx}
                y2={340}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {[110, 220, 330].map((my) => (
                <rect
                  key={my}
                  x={cx - 7}
                  y={my - 16}
                  width="14"
                  height="4"
                  rx="1"
                  fill="#0f172a"
                />
              ))}
            </g>
          ))}
        </g>
      );
    case "agentes":
      return (
        <g>
          {/* Rack de servidores */}
          <rect
            x="50"
            y="80"
            width="60"
            height="320"
            rx="4"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          {[110, 200, 290, 380].map((ly) => (
            <g key={ly}>
              <rect x="56" y={ly - 24} width="48" height="3" rx="1" fill="#22D3EE" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur={`${1.4 + (ly % 3) * 0.3}s`}
                  repeatCount="indefinite"
                />
              </rect>
              <circle cx="95" cy={ly - 8} r="1.5" fill="#22D3EE" />
            </g>
          ))}
        </g>
      );
  }
}

function RoomShell({ room }: { room: Room }) {
  return (
    <g transform={`translate(${room.x}, ${room.y})`}>
      <rect
        x="0"
        y="0"
        width={room.w}
        height={room.h}
        rx="10"
        fill={room.fill}
        stroke={room.stroke}
        strokeWidth="1.5"
      />
      {/* Faixa de título */}
      <rect x="0" y="0" width={room.w} height="24" rx="10" fill={room.accent} opacity="0.95" />
      <rect x="0" y="14" width={room.w} height="10" fill={room.accent} opacity="0.95" />
      <text
        x="14"
        y="16"
        fontSize="10.5"
        fontWeight="700"
        fill="white"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="0.5"
      >
        {room.label.toUpperCase()}
      </text>
    </g>
  );
}

export function OfficeFloorplan({
  users,
  selectedUserId,
  onSelectUser,
  filteredUserIds,
}: Props) {
  const grouped = useMemo(() => {
    const g: Record<RoomId, UserPresence[]> = {
      recepcao: [],
      descanso: [],
      master: [],
      comercial: [],
      suporte: [],
      agentes: [],
    };
    const sorted = [...users].sort((a, b) => a.userId.localeCompare(b.userId));
    for (const u of sorted) {
      g[assignRoom(u)].push(u);
    }
    return g;
  }, [users]);

  const handleBgClick = (e: React.MouseEvent<SVGElement>) => {
    if ((e.target as SVGElement).dataset.bg === "true") {
      onSelectUser(null);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      onClick={handleBgClick}
    >
      <defs>
        <pattern id="floor-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#F1F5F9" />
          <line x1="0" y1="0" x2="0" y2="40" stroke="#E2E8F0" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="40" y2="0" stroke="#E2E8F0" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Piso do escritório */}
      <rect
        x="0"
        y="0"
        width={VIEW_W}
        height={VIEW_H}
        fill="url(#floor-pattern)"
        data-bg="true"
      />

      {/* Corredor central sutil */}
      <rect
        x="0"
        y="252"
        width={VIEW_W}
        height="20"
        fill="#E2E8F0"
        opacity="0.4"
        data-bg="true"
      />

      {/* Salas + móveis */}
      {ROOMS.map((room) => (
        <g key={room.id}>
          <RoomShell room={room} />
          <g transform={`translate(${room.x}, ${room.y})`}>
            <Furniture room={room} />
          </g>
        </g>
      ))}

      {/* Avatares posicionados */}
      {ROOMS.map((room) => {
        const roomUsers = grouped[room.id];
        return roomUsers.map((user, i) => {
          const seat = room.seats[i % room.seats.length];
          const ax = room.x + seat.x;
          const ay = room.y + seat.y;
          const dimmed = filteredUserIds && !filteredUserIds.has(user.userId);
          return (
            <g key={user.userId} style={{ opacity: dimmed ? 0.2 : 1 }}>
              <TopDownAvatar
                user={user}
                isSelected={selectedUserId === user.userId}
                onClick={() => onSelectUser(user.userId)}
                x={ax}
                y={ay}
              />
            </g>
          );
        });
      })}
    </svg>
  );
}

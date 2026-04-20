import { useMemo } from "react";
import { UserPresence, RoomConfig } from "@/lib/presence/presence.types";
import { IsometricAvatar } from "./IsometricAvatar";

const TILE_W = 96;
const TILE_H = 48;
const AVATAR_OFFSET_Y = -18;

interface Props {
  users: UserPresence[];
  roomConfig: RoomConfig;
  selectedUserId: string | null;
  onSelectUser: (id: string | null) => void;
  filteredUserIds?: Set<string>;
}

function gridToIso(col: number, row: number): { px: number; py: number } {
  const px = (col - row) * (TILE_W / 2);
  const py = (col + row) * (TILE_H / 2) + AVATAR_OFFSET_Y;
  return { px, py };
}

interface Pod {
  id: string;
  label: string;
  accentColor: string;
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
  roles: Array<UserPresence["role"]>;
}

const PODS: Pod[] = [
  {
    id: "corretores",
    label: "Corretores",
    accentColor: "#1E7BE6",
    colStart: 0,
    colEnd: 4,
    rowStart: 0,
    rowEnd: 4,
    roles: ["corretor"],
  },
  {
    id: "sac",
    label: "SAC",
    accentColor: "#0891B2",
    colStart: 5,
    colEnd: 9,
    rowStart: 0,
    rowEnd: 4,
    roles: ["sac"],
  },
  {
    id: "bots",
    label: "Agentes IA",
    accentColor: "#7C3AED",
    colStart: 10,
    colEnd: 13,
    rowStart: 0,
    rowEnd: 4,
    roles: ["bot"],
  },
];

function countPod(users: UserPresence[], pod: Pod) {
  const members = users.filter((u) => pod.roles.includes(u.role));
  const online = members.filter((u) => u.status !== "offline").length;
  const busy = members.filter(
    (u) => u.status === "busy_chat" || u.status === "busy_call",
  ).length;
  return { total: members.length, online, busy };
}

function RoomFloor() {
  const tiles: JSX.Element[] = [];
  for (const pod of PODS) {
    for (let row = pod.rowStart; row < pod.rowEnd; row++) {
      for (let col = pod.colStart; col < pod.colEnd; col++) {
        const { px, py } = gridToIso(col, row);
        const depthShade = 1 - (row + (pod.colEnd - col) * 0.02) / 8;
        const baseColor = `rgba(241, 245, 249, ${depthShade.toFixed(3)})`;
        const altColor = `rgba(226, 232, 240, ${depthShade.toFixed(3)})`;
        const isAlt = (col + row) % 2 === 0;
        tiles.push(
          <polygon
            key={`tile-${col}-${row}`}
            points={`${px},${py + TILE_H / 2}  ${px + TILE_W / 2},${py}  ${px},${py - TILE_H / 2}  ${px - TILE_W / 2},${py}`}
            fill={isAlt ? baseColor : altColor}
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="0.4"
          />,
        );
      }
    }
  }
  return <g className="room-floor">{tiles}</g>;
}

function RoomWalls({ users }: { users: UserPresence[] }) {
  const walls: JSX.Element[] = [];
  const WALL_HEIGHT = 90;

  for (const pod of PODS) {
    for (let col = pod.colStart; col < pod.colEnd; col++) {
      const { px, py } = gridToIso(col, pod.rowStart);
      walls.push(
        <g key={`wall-back-${pod.id}-${col}`}>
          <polygon
            points={`
              ${px - TILE_W / 2},${py - WALL_HEIGHT}
              ${px + TILE_W / 2},${py - WALL_HEIGHT - TILE_H / 2}
              ${px + TILE_W / 2},${py - TILE_H / 2}
              ${px - TILE_W / 2},${py}
            `}
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="0.5"
          />
          <polygon
            points={`
              ${px - TILE_W / 2},${py - 6}
              ${px + TILE_W / 2},${py - 6 - TILE_H / 2}
              ${px + TILE_W / 2},${py - TILE_H / 2}
              ${px - TILE_W / 2},${py}
            `}
            fill="#E2E8F0"
          />
        </g>,
      );
    }

    const midCol = (pod.colStart + pod.colEnd) / 2 - 0.5;
    const { px, py } = gridToIso(midCol, pod.rowStart);
    const c = countPod(users, pod);
    walls.push(
      <g key={`sign-${pod.id}`}>
        <rect
          x={px - 52}
          y={py - WALL_HEIGHT + 8}
          width="104"
          height="20"
          rx="4"
          fill={pod.accentColor}
          opacity="0.95"
        />
        <rect
          x={px - 52}
          y={py - WALL_HEIGHT + 8}
          width="104"
          height="20"
          rx="4"
          fill="url(#wall-sign-gradient)"
          opacity="0.2"
        />
        <text
          x={px - 40}
          y={py - WALL_HEIGHT + 21}
          fontSize="10"
          fontWeight="700"
          fill="white"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.5"
        >
          {pod.label.toUpperCase()}
        </text>
        <rect
          x={px + 14}
          y={py - WALL_HEIGHT + 11}
          width="36"
          height="14"
          rx="3"
          fill="white"
          fillOpacity="0.25"
        />
        <text
          x={px + 32}
          y={py - WALL_HEIGHT + 21}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="white"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {c.online}/{c.total}
        </text>
      </g>,
    );
  }

  return <g className="room-walls">{walls}</g>;
}

function PodDividers() {
  const dividers: JSX.Element[] = [];
  const DIV_HEIGHT = 55;

  for (let i = 0; i < PODS.length - 1; i++) {
    const pod = PODS[i];
    const nextPod = PODS[i + 1];
    const gapCol = (pod.colEnd + nextPod.colStart) / 2 - 0.5;

    for (let row = pod.rowStart; row < pod.rowEnd; row++) {
      const { px, py } = gridToIso(gapCol, row);
      dividers.push(
        <polygon
          key={`div-${i}-${row}`}
          points={`
            ${px},${py - TILE_H / 2 - DIV_HEIGHT}
            ${px + TILE_W / 2},${py - DIV_HEIGHT}
            ${px + TILE_W / 2},${py}
            ${px},${py - TILE_H / 2}
          `}
          fill="#CBD5E1"
          fillOpacity="0.25"
          stroke="#94A3B8"
          strokeOpacity="0.5"
          strokeWidth="0.4"
        />,
      );
    }
  }
  return <g className="pod-dividers">{dividers}</g>;
}

function RoomDecorations() {
  const pos = gridToIso(-0.3, 3.5);
  return (
    <g className="room-decorations">
      <g transform={`translate(${pos.px}, ${pos.py})`}>
        <path
          d="M -7,12  L -5,-2  L 5,-2  L 7,12  Z"
          fill="#A16207"
          stroke="#78350F"
          strokeWidth="0.5"
        />
        <ellipse cx="0" cy="-2" rx="5" ry="1.5" fill="#78350F" />
        <ellipse cx="0" cy="-3" rx="9" ry="3" fill="#16A34A" />
        <circle cx="-5" cy="-8" r="6" fill="#15803D" />
        <circle cx="5" cy="-10" r="6.5" fill="#22C55E" />
        <circle cx="0" cy="-13" r="7" fill="#16A34A" />
        <circle cx="-2" cy="-16" r="4" fill="#166534" />
        <circle cx="3" cy="-17" r="3.5" fill="#15803D" />
      </g>
    </g>
  );
}

export function IsometricRoom({
  users,
  selectedUserId,
  onSelectUser,
  filteredUserIds,
}: Props) {
  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const depthA = a.position.x + a.position.y * 1.2;
        const depthB = b.position.x + b.position.y * 1.2;
        return depthA - depthB;
      }),
    [users],
  );

  const allCols = PODS[PODS.length - 1].colEnd;
  const allRows = PODS[0].rowEnd;
  const roomWidth = (allCols + allRows) * (TILE_W / 2) + 80;
  const roomHeight = (allCols + allRows) * (TILE_H / 2) + 220;
  const offsetX = allCols * (TILE_W / 2) - 20;
  const offsetY = 130;

  const handleBgClick = (e: React.MouseEvent<SVGElement>) => {
    if ((e.target as SVGElement).classList.contains("room-bg")) {
      onSelectUser(null);
    }
  };

  return (
    <svg
      viewBox={`${-offsetX} ${-offsetY} ${roomWidth} ${roomHeight}`}
      className="w-full h-full"
      style={{ background: "transparent" }}
      onClick={handleBgClick}
    >
      <defs>
        <linearGradient id="wall-sign-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ambient-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x={-offsetX}
        y={-offsetY}
        width={roomWidth}
        height={roomHeight}
        fill="transparent"
        className="room-bg"
      />

      <RoomWalls users={users} />
      <RoomFloor />
      <PodDividers />
      <RoomDecorations />

      <rect
        x={-offsetX}
        y={-offsetY}
        width={roomWidth}
        height={roomHeight}
        fill="url(#ambient-glow)"
        pointerEvents="none"
        className="room-bg"
      />

      {sortedUsers.map((user) => {
        const { px, py } = gridToIso(user.position.x, user.position.y);
        const dimmed =
          filteredUserIds && !filteredUserIds.has(user.userId) ? 0.25 : 1;
        return (
          <g key={user.userId} style={{ opacity: dimmed }}>
            <IsometricAvatar
              user={user}
              isSelected={selectedUserId === user.userId}
              onClick={() => onSelectUser(user.userId)}
              px={px}
              py={py}
            />
          </g>
        );
      })}
    </svg>
  );
}

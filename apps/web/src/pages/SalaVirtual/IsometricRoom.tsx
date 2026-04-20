import React, { useMemo } from 'react';
import { UserPresence, RoomConfig } from '@/lib/presence/presence.types';
import { IsometricAvatar } from './IsometricAvatar';

// ─────────────────────────────────────────────────────────────────────────────
// IsometricRoom
//
// Renderiza a sala isométrica completa em SVG.
// A projeção isométrica usa as fórmulas padrão:
//   px = (x - y) * (TILE_W / 2)
//   py = (x + y) * (TILE_H / 2)
//
// Onde TILE_W e TILE_H são as dimensões de cada "célula" da grade.
// ─────────────────────────────────────────────────────────────────────────────

const TILE_W = 110;  // largura de cada célula isométrica
const TILE_H = 60;   // altura de cada célula isométrica
const AVATAR_OFFSET_Y = -20; // offset vertical para posicionar o avatar sobre a mesa

interface Props {
  users: UserPresence[];
  roomConfig: RoomConfig;
  selectedUserId: string | null;
  onSelectUser: (id: string | null) => void;
}

/**
 * Converte coordenadas de grade (col, row) para pixels na projeção isométrica.
 */
function gridToIso(col: number, row: number): { px: number; py: number } {
  const px = (col - row) * (TILE_W / 2);
  const py = (col + row) * (TILE_H / 2) + AVATAR_OFFSET_Y;
  return { px, py };
}

/**
 * Renderiza o piso da sala (grade de losangos isométricos).
 */
function RoomFloor({ cols, rows }: { cols: number; rows: number }) {
  const tiles = useMemo(() => {
    const result = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const { px, py } = gridToIso(col, row);
        const isEven = (col + row) % 2 === 0;
        result.push(
          <polygon
            key={`${col}-${row}`}
            points={`${px},${py + TILE_H / 2}  ${px + TILE_W / 2},${py}  ${px},${py - TILE_H / 2}  ${px - TILE_W / 2},${py}`}
            fill={isEven ? '#f8fafc' : '#f1f5f9'}
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />,
        );
      }
    }
    return result;
  }, [cols, rows]);

  return <g className="room-floor">{tiles}</g>;
}

/**
 * Renderiza decorações da sala (plantas, quadros de métricas, etc.).
 */
function RoomDecorations({ cols, rows }: { cols: number; rows: number }) {
  // Planta no canto superior esquerdo
  const plantPos = gridToIso(-0.5, -0.5);
  // Quadro de métricas no fundo
  const boardPos = gridToIso(cols / 2 - 0.5, -1);

  return (
    <g className="room-decorations">
      {/* Parede do fundo (linha superior) */}
      {Array.from({ length: cols }).map((_, col) => {
        const { px, py } = gridToIso(col, -0.5);
        return (
          <polygon
            key={`wall-${col}`}
            points={`${px},${py + TILE_H / 2}  ${px + TILE_W / 2},${py}  ${px},${py - TILE_H / 2}  ${px - TILE_W / 2},${py}`}
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            opacity="0.5"
          />
        );
      })}

      {/* Planta decorativa */}
      <g transform={`translate(${plantPos.px}, ${plantPos.py - 10})`}>
        <ellipse cx="0" cy="8" rx="10" ry="5" fill="#86efac" />
        <circle cx="-4" cy="0" r="7" fill="#4ade80" />
        <circle cx="4" cy="-2" r="8" fill="#22c55e" />
        <circle cx="0" cy="-6" r="6" fill="#16a34a" />
        <rect x="-3" y="8" width="6" height="8" rx="2" fill="#a16207" />
      </g>

      {/* Quadro de métricas na parede */}
      <g transform={`translate(${boardPos.px}, ${boardPos.py - 30})`}>
        <rect x="-40" y="-20" width="80" height="40" rx="4" fill="#1e40af" opacity="0.9" />
        <text x="0" y="-6" textAnchor="middle" fontSize="7" fill="#93c5fd" fontFamily="system-ui">
          CENTRAL DE ATENDIMENTO
        </text>
        <text x="0" y="6" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" fontFamily="system-ui">
          Sala Virtual
        </text>
        <text x="0" y="16" textAnchor="middle" fontSize="6" fill="#bfdbfe" fontFamily="system-ui">
          Valparaíso CRM
        </text>
      </g>
    </g>
  );
}

export function IsometricRoom({ users, roomConfig, selectedUserId, onSelectUser }: Props) {
  const { gridCols, gridRows } = roomConfig;

  // Calcula o viewBox para centralizar a sala
  const roomWidth = (gridCols + gridRows) * (TILE_W / 2);
  const roomHeight = (gridCols + gridRows) * (TILE_H / 2) + 100;
  const offsetX = roomWidth / 2;
  const offsetY = gridRows * (TILE_H / 2) + 60;

  // Ordena usuários por posição Y para renderização correta (isométrico: fundo primeiro)
  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const depthA = a.position.x + a.position.y;
        const depthB = b.position.x + b.position.y;
        return depthA - depthB;
      }),
    [users],
  );

  const handleBackgroundClick = (e: React.MouseEvent<SVGElement>) => {
    if ((e.target as SVGElement).classList.contains('room-bg')) {
      onSelectUser(null);
    }
  };

  return (
    <svg
      viewBox={`${-offsetX} ${-offsetY} ${roomWidth} ${roomHeight}`}
      className="w-full h-full"
      style={{ background: 'transparent' }}
      onClick={handleBackgroundClick}
    >
      {/* Fundo clicável para deselecionar */}
      <rect
        x={-offsetX}
        y={-offsetY}
        width={roomWidth}
        height={roomHeight}
        fill="transparent"
        className="room-bg"
      />

      {/* Piso da sala */}
      <RoomFloor cols={gridCols} rows={gridRows} />

      {/* Decorações */}
      <RoomDecorations cols={gridCols} rows={gridRows} />

      {/* Avatares (renderizados em ordem de profundidade) */}
      {sortedUsers.map((user) => {
        const { px, py } = gridToIso(user.position.x, user.position.y);
        return (
          <IsometricAvatar
            key={user.userId}
            user={user}
            isSelected={selectedUserId === user.userId}
            onClick={() => onSelectUser(user.userId)}
            px={px}
            py={py}
          />
        );
      })}
    </svg>
  );
}

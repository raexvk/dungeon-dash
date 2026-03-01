import { useRef, useEffect } from 'react';
import type { TileType, Player, Monster, Visibility } from '~/game/types';

const TILE_SIZE = 3;

interface MinimapProps {
  grid: TileType[][];
  players: Player[];
  monsters: Monster[];
  visibilityMap?: Visibility[][];
}

export function Minimap({ grid, players, monsters, visibilityMap }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cols * TILE_SIZE, rows * TILE_SIZE);

    // Draw tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const vis = visibilityMap ? visibilityMap[r]?.[c] : 'visible';
        if (vis === 'unexplored') continue;

        const tile = grid[r][c];
        const dimmed = vis === 'explored';

        if (tile === '#') {
          ctx.fillStyle = dimmed ? '#1A1A1A' : '#333';
        } else if (tile === 'D' || tile === '=') {
          ctx.fillStyle = dimmed ? '#2A2A00' : '#886600';
        } else {
          ctx.fillStyle = dimmed ? '#0A0A0A' : '#181820';
        }

        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw monsters (only if visible)
    for (const monster of monsters) {
      if (!monster.alive) continue;
      const vis = visibilityMap ? visibilityMap[monster.r]?.[monster.c] : 'visible';
      if (vis !== 'visible') continue;

      ctx.fillStyle = '#FF4444';
      ctx.fillRect(
        monster.c * TILE_SIZE,
        monster.r * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }

    // Draw players
    for (const player of players) {
      if (!player.alive) continue;

      ctx.fillStyle = player.color;
      ctx.fillRect(
        player.c * TILE_SIZE,
        player.r * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    }
  }, [grid, players, monsters, visibilityMap, rows, cols]);

  if (rows === 0 || cols === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={cols * TILE_SIZE}
      height={rows * TILE_SIZE}
      style={{
        position: 'absolute',
        bottom: 56,
        right: 12,
        border: '1px solid #333',
        imageRendering: 'pixelated',
        opacity: 0.8,
        zIndex: 15,
        pointerEvents: 'none',
      }}
    />
  );
}

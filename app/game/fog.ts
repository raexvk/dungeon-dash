import type { TileType, Visibility, Position } from './types';

export function createVisibilityMap(
  rows: number,
  cols: number,
): Visibility[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 'unexplored' as Visibility),
  );
}

export function updateVisibility(
  playerR: number,
  playerC: number,
  grid: TileType[][],
  visMap: Visibility[][],
  radius: number,
  torches: Position[] = [],
): void {
  const rows = grid.length;
  const cols = grid[0].length;

  // Downgrade all 'visible' to 'explored'
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visMap[r][c] === 'visible') visMap[r][c] = 'explored';
    }
  }

  // Player tile always visible
  visMap[playerR][playerC] = 'visible';

  // Cast shadows in 8 octants from player
  for (let octant = 0; octant < 8; octant++) {
    castShadow(playerR, playerC, grid, visMap, radius, octant, 1, 0, 1);
  }

  // Torches also provide light
  for (const torch of torches) {
    const torchRadius = 3;
    visMap[torch.r][torch.c] = 'visible';
    for (let octant = 0; octant < 8; octant++) {
      castShadow(
        torch.r,
        torch.c,
        grid,
        visMap,
        torchRadius,
        octant,
        1,
        0,
        1,
      );
    }
  }
}

function transformOctant(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  octant: number,
): [number, number] {
  switch (octant) {
    case 0:
      return [cx + dy, cy + dx];
    case 1:
      return [cx + dx, cy + dy];
    case 2:
      return [cx + dx, cy - dy];
    case 3:
      return [cx + dy, cy - dx];
    case 4:
      return [cx - dy, cy - dx];
    case 5:
      return [cx - dx, cy - dy];
    case 6:
      return [cx - dx, cy + dy];
    case 7:
      return [cx - dy, cy + dx];
    default:
      return [cx, cy];
  }
}

function castShadow(
  cx: number,
  cy: number,
  grid: TileType[][],
  visMap: Visibility[][],
  radius: number,
  octant: number,
  row: number,
  startSlope: number,
  endSlope: number,
): void {
  if (startSlope < endSlope) return;

  const rows = grid.length;
  const cols = grid[0].length;
  let nextStart = startSlope;

  for (let i = row; i <= radius; i++) {
    let blocked = false;

    for (let dx = -i; dx <= 0; dx++) {
      const dy = -i;
      const [mapR, mapC] = transformOctant(cx, cy, dx, dy, octant);

      if (mapR < 0 || mapR >= rows || mapC < 0 || mapC >= cols) continue;

      const leftSlope = (dx - 0.5) / (dy + 0.5);
      const rightSlope = (dx + 0.5) / (dy - 0.5);

      if (startSlope < rightSlope) continue;
      if (endSlope > leftSlope) break;

      // Mark visible if within radius
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        visMap[mapR][mapC] = 'visible';
      }

      // Handle wall blocking
      if (blocked) {
        if (grid[mapR][mapC] === '#' || grid[mapR][mapC] === '=') {
          nextStart = rightSlope;
          continue;
        } else {
          blocked = false;
          startSlope = nextStart;
        }
      } else if (
        (grid[mapR][mapC] === '#' || grid[mapR][mapC] === '=') &&
        i < radius
      ) {
        blocked = true;
        castShadow(
          cx,
          cy,
          grid,
          visMap,
          radius,
          octant,
          i + 1,
          startSlope,
          leftSlope,
        );
        nextStart = rightSlope;
      }
    }

    if (blocked) break;
  }
}

// Full visibility (no fog) - mark everything visible
export function setFullVisibility(visMap: Visibility[][]): void {
  for (let r = 0; r < visMap.length; r++) {
    for (let c = 0; c < visMap[r].length; c++) {
      visMap[r][c] = 'visible';
    }
  }
}

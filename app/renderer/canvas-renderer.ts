import type {
  GameState,
  Player,
  Monster,
  Boss,
  Visibility,
  Position,
  Projectile,
  Telegraph,
  Hazard,
  GroundItem,
  MonsterType,
} from '../game/types';
import { PALETTE } from './sprites';
import type { Particle } from './particles';

// ── Constants ──

const TILE = 32;

// ── Exported Interfaces ──

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface AttackEffect {
  x: number;
  y: number;
  direction: { dr: number; dc: number };
  life: number;
  maxLife: number;
  type: 'slash' | 'hit';
}

export interface RenderState {
  gameState: GameState;
  localPlayerId: number;
  spriteCache: any; // SpriteCache from sprites.ts
  particles: Particle[];
  floatingTexts: FloatingText[];
  attackEffects: AttackEffect[];
  shakeX: number;
  shakeY: number;
  shakeDuration: number;
  time: number;
  deltaTime: number;
}

// ── Telegraph Color Mapping ──

const TELEGRAPH_COLORS: Record<string, string> = {
  melee: 'rgba(255, 60, 60, 0.35)',
  shockwave: 'rgba(255, 200, 50, 0.40)',
  acid: 'rgba(80, 255, 80, 0.35)',
  divebomb: 'rgba(180, 100, 255, 0.35)',
  fire: 'rgba(255, 120, 30, 0.40)',
};

const TELEGRAPH_PULSE_COLORS: Record<string, string> = {
  melee: 'rgba(255, 60, 60, 0.55)',
  shockwave: 'rgba(255, 200, 50, 0.60)',
  acid: 'rgba(80, 255, 80, 0.55)',
  divebomb: 'rgba(180, 100, 255, 0.55)',
  fire: 'rgba(255, 120, 30, 0.60)',
};

// ── Hazard Color Mapping ──

const HAZARD_COLORS: Record<string, string> = {
  acid: 'rgba(50, 200, 50, 0.25)',
  fire: 'rgba(220, 80, 30, 0.25)',
};

// ── Item Sprite Key Mapping ──

const ITEM_SPRITE_KEYS: Record<string, string> = {
  healthPotion: 'healthPotion',
  gold: 'gold',
  shieldOrb: 'shieldOrb',
  speedScroll: 'speedScroll',
  swordIron: 'swordIron',
  swordFire: 'swordFire',
  shieldWood: 'shieldWood',
  shieldIron: 'shieldIron',
  bow: 'bow',
  fireballScroll: 'fireballScroll',
  freezeScroll: 'freezeScroll',
  chest: 'chest',
};

// ── Projectile Colors ──

const PROJECTILE_COLORS: Record<string, string> = {
  arrow: '#CCAA66',
  fireball: '#FF6622',
};

// ── Main Render Function ──

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
): void {
  const { gameState, localPlayerId, spriteCache, time } = state;
  const { grid, players, monsters, boss, items, key, door, telegraphs, hazards, projectiles, torches } = gameState;

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // (a) Save context
  ctx.save();

  // (b) Apply screen shake
  if (state.shakeDuration > 0) {
    const intensity = state.shakeDuration / 12;
    const sx = (Math.random() - 0.5) * 6 * intensity;
    const sy = (Math.random() - 0.5) * 6 * intensity;
    state.shakeX = sx;
    state.shakeY = sy;
    ctx.translate(sx, sy);
    state.shakeDuration--;
  } else {
    state.shakeX = 0;
    state.shakeY = 0;
  }

  // (c) Clear to void black
  ctx.fillStyle = PALETTE.voidBlack;
  ctx.fillRect(-10, -10, cols * TILE + 20, rows * TILE + 20);

  // (d) Draw floor tiles for all cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const variant = (r * 11 + c * 17) % 3;
      const floorSprite = spriteCache?.floor?.[variant];
      if (floorSprite) {
        ctx.drawImage(floorSprite, c * TILE, r * TILE, TILE, TILE);
      } else {
        // Fallback: dark floor fill
        ctx.fillStyle = PALETTE.floorDark ?? '#1a1a2e';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
  }

  // (e) Draw wall tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '#' || grid[r][c] === '=') {
        const variant = (r * 7 + c * 13) % 4;
        const wallSprite = spriteCache?.wall?.[variant];
        if (wallSprite) {
          ctx.drawImage(wallSprite, c * TILE, r * TILE, TILE, TILE);
        } else {
          // Fallback: dark wall fill
          ctx.fillStyle = PALETTE.stoneDark ?? '#2d2d44';
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          ctx.fillStyle = PALETTE.stoneMid ?? '#3d3d55';
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE - 4);
        }
      }
    }
  }

  // (f) Draw special tiles: traps, torches, door/doorOpen, exit portal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r][c];
      const px = c * TILE;
      const py = r * TILE;

      switch (tile) {
        case '^': {
          // Trap tile
          const trapSprite = spriteCache?.trap;
          if (trapSprite) {
            ctx.drawImage(trapSprite, px, py, TILE, TILE);
          } else {
            ctx.fillStyle = '#553333';
            ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
            // Draw small spike marks
            ctx.fillStyle = '#AA5555';
            ctx.fillRect(px + 8, py + 10, 4, 12);
            ctx.fillRect(px + 16, py + 8, 4, 14);
            ctx.fillRect(px + 22, py + 12, 4, 10);
          }
          break;
        }
        case 'T': {
          // Torch tile (drawn as part of the floor, the glow is separate)
          const torchFrame = Math.floor(time / 250) % 3;
          const torchSprite = spriteCache?.torch?.[torchFrame];
          if (torchSprite) {
            ctx.drawImage(torchSprite, px, py, TILE, TILE);
          } else {
            // Fallback torch
            ctx.fillStyle = '#664422';
            ctx.fillRect(px + 12, py + 8, 8, 18);
            ctx.fillStyle = '#FFAA33';
            ctx.fillRect(px + 10, py + 2, 12, 8);
          }
          break;
        }
        case 'D': {
          // Door tile
          if (door.open) {
            const doorOpenSprite = spriteCache?.doorOpen;
            if (doorOpenSprite) {
              ctx.drawImage(doorOpenSprite, px, py, TILE, TILE);
            } else {
              ctx.fillStyle = '#445544';
              ctx.fillRect(px, py, TILE, TILE);
              ctx.fillStyle = '#334433';
              ctx.fillRect(px + 4, py + 2, TILE - 8, TILE - 4);
            }
          } else {
            const doorSprite = spriteCache?.door;
            if (doorSprite) {
              ctx.drawImage(doorSprite, px, py, TILE, TILE);
            } else {
              ctx.fillStyle = '#886644';
              ctx.fillRect(px, py, TILE, TILE);
              ctx.fillStyle = '#665533';
              ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
              ctx.fillStyle = '#FFCC44';
              ctx.fillRect(px + 20, py + 14, 6, 4);
            }
          }
          break;
        }
        case '>': {
          // Exit door (animated glow)
          const portalPulse = Math.sin(time / 300) * 0.3 + 0.7;
          // Door frame
          ctx.fillStyle = '#3A2A1A';
          ctx.fillRect(px + 4, py + 2, TILE - 8, TILE - 2);
          // Door body
          ctx.fillStyle = `rgba(68, 136, 255, ${portalPulse})`;
          ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 6);
          // Door arch
          ctx.fillStyle = '#5A3A1A';
          ctx.fillRect(px + 4, py + 2, TILE - 8, 3);
          ctx.fillRect(px + 4, py + 2, 2, TILE - 2);
          ctx.fillRect(px + TILE - 6, py + 2, 2, TILE - 2);
          // Door handle
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(px + TILE - 12, py + 16, 3, 3);
          // Glow effect
          ctx.fillStyle = `rgba(68, 136, 255, ${portalPulse * 0.15})`;
          ctx.fillRect(px - 2, py - 2, TILE + 4, TILE + 4);
          break;
        }
      }
    }
  }

  // Also draw torch tiles from the torches list (for 'T' on the map that became floor)
  for (const torch of torches) {
    const px = torch.c * TILE;
    const py = torch.r * TILE;
    if (grid[torch.r]?.[torch.c] !== 'T') {
      const torchFrame2 = Math.floor(time / 250) % 3;
      const torchSpr = spriteCache?.torch?.[torchFrame2];
      if (torchSpr) {
        ctx.drawImage(torchSpr, px, py, TILE, TILE);
      }
    }
  }

  // (g) Draw ground items (uncollected)
  for (const item of items) {
    if (item.collected) continue;
    const px = item.c * TILE;
    const py = item.r * TILE;
    const spriteKey = ITEM_SPRITE_KEYS[item.type];
    const itemSprite = spriteCache?.items?.[spriteKey];
    if (itemSprite) {
      ctx.drawImage(itemSprite, px + 4, py + 4, TILE - 8, TILE - 8);
    } else {
      // Fallback: small colored square
      ctx.fillStyle = getItemFallbackColor(item.type);
      ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
    }
  }

  // (h) Draw key if exists and not held
  if (key.exists && key.heldBy === -1) {
    const kx = key.c * TILE;
    const ky = key.r * TILE;
    const keySprite = spriteCache?.key;
    if (keySprite) {
      ctx.drawImage(keySprite, kx + 4, ky + 4, TILE - 8, TILE - 8);
    } else {
      // Fallback: yellow key shape
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(kx + 10, ky + 6, 12, 8);
      ctx.fillRect(kx + 18, ky + 14, 4, 10);
      ctx.fillRect(kx + 14, ky + 18, 4, 4);
    }
  }

  // (i) Draw telegraph overlays (pulsing colored semi-transparent rectangles)
  for (const telegraph of telegraphs) {
    const pulse = (Math.sin(time / 150) + 1) / 2; // 0..1 pulsing
    const baseColor = TELEGRAPH_COLORS[telegraph.type] ?? 'rgba(255, 60, 60, 0.35)';
    const pulseColor = TELEGRAPH_PULSE_COLORS[telegraph.type] ?? 'rgba(255, 60, 60, 0.55)';

    ctx.fillStyle = pulse > 0.5 ? pulseColor : baseColor;

    for (const tile of telegraph.tiles) {
      ctx.fillRect(tile.c * TILE, tile.r * TILE, TILE, TILE);
    }

    // Draw indicator on telegraph tiles (fire symbol for fire, ! for others)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbol = telegraph.type === 'fire' ? '\u{1F525}' : '!';
    for (const tile of telegraph.tiles) {
      ctx.fillText(symbol, tile.c * TILE + TILE / 2, tile.r * TILE + TILE / 2);
    }
  }

  // (j) Draw hazard overlays (green/red tinted tiles)
  for (const hazard of hazards) {
    ctx.fillStyle = HAZARD_COLORS[hazard.type] ?? 'rgba(100, 200, 100, 0.25)';
    for (const tile of hazard.tiles) {
      ctx.fillRect(tile.c * TILE, tile.r * TILE, TILE, TILE);
    }
  }

  // (k) Draw monsters sorted by Y for overlap
  const allMonsters: (Monster | Boss)[] = [
    ...monsters.filter((m) => m.alive),
  ];
  if (boss && boss.alive) {
    allMonsters.push(boss);
  }
  allMonsters.sort((a, b) => a.r - b.r);

  for (const monster of allMonsters) {
    const mx = monster.renderX ?? monster.c * TILE;
    const my = monster.renderY ?? monster.r * TILE;
    const isBoss = 'shockwaveCooldown' in monster;

    // Determine sprite frame
    const monsterFrames = spriteCache?.monsters?.[monster.type] as HTMLCanvasElement[] | undefined;
    let monsterSprite: HTMLCanvasElement | undefined;

    if (monsterFrames && monsterFrames.length > 0) {
      if (monster.type === 'skeleton') {
        // Skeleton has 8 frames: [down0, down1, up0, up1, left0, left1, right0, right1]
        let dirIndex = 0; // down
        if (monster.patrolDir.dr < 0) dirIndex = 2; // up
        else if (monster.patrolDir.dc < 0) dirIndex = 4; // left
        else if (monster.patrolDir.dc > 0) dirIndex = 6; // right
        const frameIndex = dirIndex + (monster.animFrame % 2);
        monsterSprite = monsterFrames[frameIndex] ?? monsterFrames[0];
      } else if (isBoss) {
        // Boss: [phase1, phase2, phase3]
        const bossPhase = (monster as Boss).phase - 1;
        monsterSprite = monsterFrames[bossPhase] ?? monsterFrames[0];
      } else {
        // Slime, bat: [frame0, frame1]
        monsterSprite = monsterFrames[monster.animFrame % 2] ?? monsterFrames[0];
      }
    }

    if (monsterSprite) {
      ctx.drawImage(monsterSprite, mx, my, TILE, TILE);
    } else {
      // Fallback: colored rectangle per type
      ctx.fillStyle = getMonsterFallbackColor(monster.type);
      ctx.fillRect(mx + 4, my + 4, TILE - 8, TILE - 8);
      // Eyes
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(mx + 8, my + 10, 4, 4);
      ctx.fillRect(mx + 20, my + 10, 4, 4);
    }

    // Boss unique visual: pulsing dark aura + crown marker
    if (isBoss) {
      const bossMon = monster as Boss;
      // Pulsing aura
      const auraPulse = 0.2 + 0.15 * Math.sin(time / 200);
      const auraColor = bossMon.enraged
        ? `rgba(255, 50, 0, ${auraPulse})`
        : `rgba(100, 0, 180, ${auraPulse})`;
      ctx.save();
      ctx.fillStyle = auraColor;
      ctx.fillRect(mx - 3, my - 3, TILE + 6, TILE + 6);
      ctx.restore();

      // Re-draw sprite on top of aura
      if (monsterSprite) {
        ctx.drawImage(monsterSprite, mx, my, TILE, TILE);
      }

      // Crown/skull marker above boss
      ctx.fillStyle = bossMon.enraged ? '#FF4400' : '#FFD700';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('\u2620', mx + TILE / 2, my - 8); // skull emoji
    }

    // Stun indicator
    if (monster.stunTimer > 0) {
      ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
      ctx.fillRect(mx, my, TILE, TILE);
    }

    // Draw HP bars
    if (isBoss) {
      drawHPBar(ctx, mx, my - 6, monster.hp, monster.maxHp, TILE);

      if ((monster as Boss).enraged) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(mx - 2, my - 2, TILE + 4, TILE + 4);
      }
    } else if (monster.hp < monster.maxHp) {
      drawHPBar(ctx, mx + 4, my - 4, monster.hp, monster.maxHp, 24);
    }
  }

  // (l) Draw players sorted by Y
  const sortedPlayers = [...players].filter((p) => p.alive).sort((a, b) => a.r - b.r);

  for (const player of sortedPlayers) {
    const px = player.renderX ?? player.c * TILE;
    const py = player.renderY ?? player.r * TILE;

    // Invulnerability flash: skip rendering every other frame
    if (player.invulnFrames > 0 && Math.floor(time / 80) % 2 === 0) {
      // Red flash for first few frames after being hit
      if (player.invulnFrames > 25) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#FF2222';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.restore();
      }
      // Still draw name tag and HP bar but skip the sprite
      drawPlayerOverlays(ctx, player, px, py, time);
      continue;
    }

    // Draw player sprite
    const facing = player.facing ?? 'down';
    const animFrame = player.animFrame ?? 0;
    const playerSprite = spriteCache?.players?.[`${player.classType}-${facing}`]?.[animFrame];

    if (playerSprite) {
      ctx.drawImage(playerSprite, px, py, TILE, TILE);
    } else {
      // Fallback: colored rectangle
      ctx.fillStyle = player.color || '#4488FF';
      ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
      // Simple face
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 10, py + 10, 4, 4);
      ctx.fillRect(px + 18, py + 10, 4, 4);
    }

    // Shield glow effect
    if (player.shield) {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(time / 200);
      ctx.strokeStyle = '#44DDFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE / 2, TILE / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Speed boost glow
    if (player.speedBoost > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#FFFF44';
      ctx.fillRect(px - 2, py - 2, TILE + 4, TILE + 4);
      ctx.restore();
    }

    // Key indicator
    if (player.hasKey) {
      const keySprite = spriteCache?.key;
      if (keySprite) {
        ctx.drawImage(keySprite, px + TILE - 10, py - 6, 12, 12);
      } else {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px + TILE - 10, py - 4, 8, 8);
      }
    }

    drawPlayerOverlays(ctx, player, px, py, time);
  }

  // Draw dead/respawning players as ghosts
  for (const player of players) {
    if (player.alive) continue;
    if (player.respawnTimer <= 0) continue;

    const px = player.renderX ?? player.c * TILE;
    const py = player.renderY ?? player.r * TILE;

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = player.color || '#4488FF';
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.restore();

    // Respawn timer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${Math.ceil(player.respawnTimer / 30)}`,
      px + TILE / 2,
      py + TILE / 2 + 3,
    );
  }

  // (m) Draw projectiles
  for (const proj of projectiles) {
    const cx = proj.c * TILE + TILE / 2;
    const cy = proj.r * TILE + TILE / 2;

    // Bright red circle
    ctx.fillStyle = '#FF2222';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx - proj.dir.dc * 5, cy - proj.dir.dr * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // (n) Draw torch glow using additive blending
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const torch of torches) {
    const tx = torch.c * TILE + TILE / 2;
    const ty = torch.r * TILE + TILE / 2;
    const flicker = 0.8 + 0.2 * Math.sin(time / 200 + torch.r * 3 + torch.c * 7);
    const radius = TILE * 2.5 * flicker;

    const gradient = ctx.createRadialGradient(tx, ty, 0, tx, ty, radius);
    gradient.addColorStop(0, 'rgba(255, 180, 60, 0.15)');
    gradient.addColorStop(0.4, 'rgba(255, 140, 40, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 100, 20, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(tx - radius, ty - radius, radius * 2, radius * 2);
  }

  ctx.restore();

  // (o) Draw fog of war overlay
  const visMap = gameState.visibilityMaps?.get(localPlayerId);
  if (visMap) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const vis = visMap[r]?.[c];
        if (vis === 'unexplored') {
          ctx.fillStyle = 'rgba(5, 5, 10, 0.97)';
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        } else if (vis === 'explored') {
          ctx.fillStyle = 'rgba(5, 5, 10, 0.70)';
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
        // 'visible' tiles are not dimmed
      }
    }
  }

  // (p) Render attack effects (slash arcs and hit flashes)
  renderAttackEffects(ctx, state.attackEffects);

  // (q) Render particles
  renderParticles(ctx, state.particles, state.time);

  // (r) Render floating damage texts
  renderFloatingTexts(ctx, state.floatingTexts);

  // (r) Restore context
  ctx.restore();
}

// ── Player Overlay Helper ──

function drawPlayerOverlays(
  ctx: CanvasRenderingContext2D,
  player: Player,
  px: number,
  py: number,
  time: number,
): void {
  // Name tag above player
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(player.name, px + TILE / 2, py - 8);

  // HP bar
  drawHPBar(ctx, px + 4, py - 5, player.hp, player.maxHp, 24);
}

// ── Entity Render Interpolation ──

export function updateEntityRender(
  entity: { r: number; c: number; renderX?: number; renderY?: number },
  dt: number,
  speed?: number,
): void {
  const lerpSpeed = speed ?? 8;
  const targetX = entity.c * TILE;
  const targetY = entity.r * TILE;

  if (entity.renderX === undefined) {
    entity.renderX = targetX;
  }
  if (entity.renderY === undefined) {
    entity.renderY = targetY;
  }

  // Lerp toward target position
  const dx = targetX - entity.renderX;
  const dy = targetY - entity.renderY;

  entity.renderX += dx * lerpSpeed * dt;
  entity.renderY += dy * lerpSpeed * dt;

  // Snap if very close to avoid sub-pixel jitter
  if (Math.abs(dx) < 0.5) entity.renderX = targetX;
  if (Math.abs(dy) < 0.5) entity.renderY = targetY;
}

// ── Floating Text ──

export function addFloatingText(
  texts: FloatingText[],
  x: number,
  y: number,
  text: string,
  color: string,
): void {
  texts.push({
    x,
    y,
    text,
    color,
    life: 60,
    maxLife: 60,
  });
}

export function renderFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
): void {
  for (let i = texts.length - 1; i >= 0; i--) {
    const ft = texts[i];
    ft.life--;

    if (ft.life <= 0) {
      texts.splice(i, 1);
      continue;
    }

    const progress = 1 - ft.life / ft.maxLife; // 0..1
    const alpha = Math.max(0, 1 - progress * 1.2);
    const rise = progress * 24;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline for readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(ft.text, ft.x, ft.y - rise);
    ctx.fillText(ft.text, ft.x, ft.y - rise);

    ctx.restore();
  }
}

// ── Screen Shake ──

export function triggerShake(state: RenderState, duration?: number): void {
  state.shakeDuration = duration ?? 12;
}

// ── Attack Effects ──

export function addAttackEffect(
  state: RenderState,
  x: number,
  y: number,
  direction: { dr: number; dc: number },
  type: 'slash' | 'hit',
): void {
  state.attackEffects.push({
    x,
    y,
    direction,
    life: 12,
    maxLife: 12,
    type,
  });
}

function renderAttackEffects(
  ctx: CanvasRenderingContext2D,
  effects: AttackEffect[],
): void {
  for (let i = effects.length - 1; i >= 0; i--) {
    const eff = effects[i];
    eff.life--;

    if (eff.life <= 0) {
      effects.splice(i, 1);
      continue;
    }

    const progress = 1 - eff.life / eff.maxLife;
    const alpha = Math.max(0, 1 - progress * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (eff.type === 'slash') {
      // Draw white slash arc in attack direction
      const cx = eff.x + TILE / 2;
      const cy = eff.y + TILE / 2;

      // Determine arc angle based on direction
      let baseAngle = 0;
      if (eff.direction.dc > 0) baseAngle = 0;
      else if (eff.direction.dc < 0) baseAngle = Math.PI;
      else if (eff.direction.dr < 0) baseAngle = -Math.PI / 2;
      else baseAngle = Math.PI / 2;

      const radius = TILE * 0.7 + progress * TILE * 0.3;
      const sweep = Math.PI * 0.8;

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3 - progress * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, baseAngle - sweep / 2, baseAngle + sweep / 2);
      ctx.stroke();

      // Inner brighter arc
      ctx.strokeStyle = '#FFFFAA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, baseAngle - sweep / 3, baseAngle + sweep / 3);
      ctx.stroke();
    } else {
      // 'hit' type: red flash overlay
      ctx.fillStyle = `rgba(255, 40, 40, ${alpha * 0.5})`;
      ctx.fillRect(eff.x, eff.y, TILE, TILE);
    }

    ctx.restore();
  }
}

// ── HP Bar ──

export function drawHPBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  width?: number,
): void {
  const barWidth = width ?? 24;
  const barHeight = 3;

  // Background
  ctx.fillStyle = '#111111';
  ctx.fillRect(x, y, barWidth, barHeight);

  // HP fill
  const ratio = Math.max(0, Math.min(1, hp / maxHp));
  const fillColor = ratio > 0.5 ? '#44CC44' : ratio > 0.25 ? '#CCAA22' : '#CC2222';
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, Math.floor(barWidth * ratio), barHeight);

  // Border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, barWidth, barHeight);
}

// ── Particle Rendering ──

function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  time: number,
): void {
  for (const p of particles) {
    if (p.life <= 0) continue;

    const alpha = Math.max(0, p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.size <= 2) {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Fallback Colors ──

function getItemFallbackColor(type: string): string {
  switch (type) {
    case 'healthPotion':
      return '#FF4466';
    case 'gold':
      return '#FFD700';
    case 'shieldOrb':
      return '#44DDFF';
    case 'speedScroll':
      return '#44FF88';
    case 'swordIron':
      return '#AAAACC';
    case 'swordFire':
      return '#FF6622';
    case 'shieldWood':
      return '#AA8855';
    case 'shieldIron':
      return '#8888AA';
    case 'bow':
      return '#CCAA66';
    case 'fireballScroll':
      return '#FF4400';
    case 'freezeScroll':
      return '#4488FF';
    case 'chest':
      return '#CC8833';
    default:
      return '#888888';
  }
}

function getMonsterFallbackColor(type: MonsterType): string {
  switch (type) {
    case 'skeleton':
      return '#CCCCAA';
    case 'slime':
      return '#44CC44';
    case 'bat':
      return '#886688';
    case 'darkKnight':
      return '#442244';
    default:
      return '#AA4444';
  }
}

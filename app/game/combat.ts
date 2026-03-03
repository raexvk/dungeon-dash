import type {
  GameState,
  Player,
  Monster,
  Boss,
  TileType,
  DoorState,
  Direction,
  Position,
  Hazard,
  Projectile,
  Telegraph,
} from './types';
import { SCORE_VALUES } from './scoring';

// Invulnerability is always real-time at 30Hz — 90 ticks = 3 seconds
function invulnTime(_state: GameState): number {
  return 90;
}

// ── Helpers ──

export function isWalkable(grid: TileType[][], r: number, c: number): boolean {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
  const tile = grid[r][c];
  return tile !== '#' && tile !== '=';
}

export function isMonsterWalkable(grid: TileType[][], r: number, c: number, door: DoorState): boolean {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
  const tile = grid[r][c];
  if (tile === '#' || tile === '=') return false;
  if (tile === 'D' && !door.open) return false;
  return true;
}

export function createTelegraph(
  id: string,
  sourceId: string,
  tiles: Position[],
  turnsRemaining: number,
  damage: number,
  ignoresDef: boolean,
  type: 'melee' | 'shockwave' | 'acid' | 'divebomb' | 'fire',
): Telegraph {
  return { id, sourceId, tiles, turnsRemaining, damage, ignoresDef, type };
}

export function canMoveTo(
  grid: TileType[][],
  r: number,
  c: number,
  door: DoorState,
): boolean {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
  const tile = grid[r][c];
  if (tile === '#') return false;
  if (tile === 'D' && !door.open) return false;
  if (tile === '=') return false;
  return true;
}

export function deltaToDirection(dir: { dr: number; dc: number }): Direction {
  if (dir.dr < 0) return 'up';
  if (dir.dr > 0) return 'down';
  if (dir.dc < 0) return 'left';
  return 'right';
}

export function dirDelta(dir: Direction): { dr: number; dc: number } {
  switch (dir) {
    case 'up':
      return { dr: -1, dc: 0 };
    case 'down':
      return { dr: 1, dc: 0 };
    case 'left':
      return { dr: 0, dc: -1 };
    case 'right':
      return { dr: 0, dc: 1 };
  }
}

export function manhattanDist(a: Position, b: Position): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function monsterAt(
  monsters: Monster[],
  r: number,
  c: number,
): Monster | undefined {
  return monsters.find((m) => m.alive && m.r === r && m.c === c);
}

export function bossAt(
  boss: Boss | null,
  r: number,
  c: number,
): Boss | undefined {
  if (boss && boss.alive && boss.r === r && boss.c === c) return boss;
  return undefined;
}

// ── Player attacks Monster / Boss ──

export function resolveAttack(
  state: GameState,
  attacker: Player,
  target: Monster | Boss,
): { damage: number; killed: boolean } {
  const weaponBonus = attacker.weapon?.atkBonus ?? 0;
  const damage = Math.max(1, attacker.atk + weaponBonus - target.def);

  target.hp -= damage;
  attacker.attackCooldown = 2;

  let killed = false;

  // Emit damage event for visual effects
  state.events.push({
    tick: state.tick,
    type: 'damage',
    message: `${attacker.name} hit ${target.type} for ${damage}`,
    playerId: attacker.id,
    targetId: target.id,
  });

  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    killed = true;

    attacker.kills++;
    attacker.score += SCORE_VALUES.kill;

    state.events.push({
      tick: state.tick,
      type: 'kill',
      message: `${attacker.name} killed a ${target.type}`,
      playerId: attacker.id,
      targetId: target.id,
    });

    // Check if target is a boss (has shockwaveCooldown property)
    if ('shockwaveCooldown' in target) {
      const boss = target as Boss;
      boss.lastHitBy = attacker.id;
      attacker.bossKills++;
      attacker.score += SCORE_VALUES.bossKill;

      if (!state.key.exists) {
        state.key.exists = true;
        state.key.r = boss.r;
        state.key.c = boss.c;
      }

      state.events.push({
        tick: state.tick,
        type: 'bossKill',
        message: `${attacker.name} slew the boss!`,
        playerId: attacker.id,
        targetId: boss.id,
      });

      state.phase = 'bossDead';
    }
  } else if ('shockwaveCooldown' in target) {
    (target as Boss).lastHitBy = attacker.id;
  }

  return { damage, killed };
}

// ── Monster attacks Player ──

export function resolveMonsterAttack(
  state: GameState,
  monster: Monster,
  player: Player,
): void {
  if (player.invulnFrames > 0 || !player.alive) return;

  const shieldBonus = player.shieldEquip?.defBonus ?? 0;
  let damage = Math.max(1, monster.atk - player.def - shieldBonus);

  // Shield orb negates damage entirely
  if (player.shield) {
    damage = 0;
    player.shield = false;
  }

  player.hp -= damage;

  // Emit playerHit event for visual effects
  if (damage > 0) {
    state.events.push({
      tick: state.tick,
      type: 'playerHit',
      message: `${player.name} took ${damage} damage from ${monster.type}`,
      playerId: player.id,
      targetId: monster.id,
    });
  }

  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
    player.deaths++;
    player.score += SCORE_VALUES.death;

    // In multiplayer, set respawn timer if lives remain
    if (state.players.length > 1 && player.respawnsLeft > 0) {
      player.respawnTimer = 150;
    }

    state.events.push({
      tick: state.tick,
      type: 'playerDied',
      message: `${player.name} was killed by a ${monster.type}`,
      playerId: player.id,
      targetId: monster.id,
    });

    // Drop key if player was holding it
    if (player.hasKey) {
      player.hasKey = false;
      state.key.heldBy = -1;
      state.key.r = player.r;
      state.key.c = player.c;

      state.events.push({
        tick: state.tick,
        type: 'keyDrop',
        message: `${player.name} dropped the key!`,
        playerId: player.id,
      });
    }
  }

  player.invulnFrames = invulnTime(state);
}

// ── Resolve Telegraphs ──

export function resolveTelegraphs(state: GameState): void {
  const remaining: typeof state.telegraphs = [];

  for (const telegraph of state.telegraphs) {
    telegraph.turnsRemaining--;

    if (telegraph.turnsRemaining <= 0) {
      // Telegraph resolves - deal damage to players on affected tiles
      for (const tile of telegraph.tiles) {
        for (const player of state.players) {
          if (!player.alive) continue;
          if (player.r === tile.r && player.c === tile.c) {
            // Apply telegraph damage using similar logic to resolveMonsterAttack
            if (player.invulnFrames > 0) continue;

            let damage: number;
            if (telegraph.ignoresDef) {
              damage = telegraph.damage;
            } else {
              const shieldBonus = player.shieldEquip?.defBonus ?? 0;
              damage = Math.max(
                1,
                telegraph.damage - player.def - shieldBonus,
              );
            }

            // Shield orb negates damage
            if (player.shield) {
              damage = 0;
              player.shield = false;
            }

            player.hp -= damage;

            if (damage > 0) {
              state.events.push({
                tick: state.tick,
                type: 'playerHit',
                message: `${player.name} took ${damage} damage from ${telegraph.type}`,
                playerId: player.id,
                targetId: telegraph.sourceId,
              });
            }

            if (player.hp <= 0) {
              player.hp = 0;
              player.alive = false;
              player.deaths++;
              player.score += SCORE_VALUES.death;

              if (state.players.length > 1) {
                player.respawnTimer = 150;
              }

              state.events.push({
                tick: state.tick,
                type: 'playerDied',
                message: `${player.name} was hit by ${telegraph.type}`,
                playerId: player.id,
                targetId: telegraph.sourceId,
              });

              // Drop key
              if (player.hasKey) {
                player.hasKey = false;
                state.key.heldBy = -1;
                state.key.r = player.r;
                state.key.c = player.c;

                state.events.push({
                  tick: state.tick,
                  type: 'keyDrop',
                  message: `${player.name} dropped the key!`,
                  playerId: player.id,
                });
              }
            }

            player.invulnFrames = invulnTime(state);
          }
        }
      }

      // If acid type, create a hazard
      if (telegraph.type === 'acid') {
        const hazard: Hazard = {
          id: `hazard-${state.tick}-${telegraph.id}`,
          tiles: [...telegraph.tiles],
          turnsRemaining: 90,
          damage: 1,
          type: 'acid',
        };
        state.hazards.push(hazard);
      }

      // Telegraph is consumed, don't add to remaining
    } else {
      remaining.push(telegraph);
    }
  }

  state.telegraphs = remaining;
}

// ── Tick Hazards ──

export function tickHazards(state: GameState): void {
  const remaining: Hazard[] = [];

  for (const hazard of state.hazards) {
    hazard.turnsRemaining--;

    if (hazard.turnsRemaining <= 0) {
      continue; // Remove expired hazard
    }

    // Deal damage every 30 ticks
    if (hazard.turnsRemaining % 30 === 0) {
      for (const tile of hazard.tiles) {
        for (const player of state.players) {
          if (!player.alive) continue;
          if (player.invulnFrames > 0) continue;
          if (player.r === tile.r && player.c === tile.c) {
            player.hp -= 1;

            state.events.push({
              tick: state.tick,
              type: 'playerHit',
              message: `${player.name} took 1 damage from ${hazard.type}`,
              playerId: player.id,
            });

            if (player.hp <= 0) {
              player.hp = 0;
              player.alive = false;
              player.deaths++;
              player.score += SCORE_VALUES.death;

              if (state.players.length > 1) {
                player.respawnTimer = 150;
              }

              state.events.push({
                tick: state.tick,
                type: 'playerDied',
                message: `${player.name} succumbed to ${hazard.type}`,
                playerId: player.id,
              });

              // Drop key
              if (player.hasKey) {
                player.hasKey = false;
                state.key.heldBy = -1;
                state.key.r = player.r;
                state.key.c = player.c;

                state.events.push({
                  tick: state.tick,
                  type: 'keyDrop',
                  message: `${player.name} dropped the key!`,
                  playerId: player.id,
                });
              }
            }

            player.invulnFrames = invulnTime(state);
          }
        }
      }
    }

    remaining.push(hazard);
  }

  state.hazards = remaining;
}

// ── Projectile Passability ──

function isProjectilePassable(state: GameState, r: number, c: number): boolean {
  if (r < 0 || r >= state.grid.length || c < 0 || c >= state.grid[0].length) return false;
  const tile = state.grid[r][c];
  if (tile === '#' || tile === '=') return false;
  // Closed door blocks projectiles
  if (tile === 'D' && !state.door.open) return false;
  return true;
}

// ── Projectile → Player hit helper ──

function handleProjectilePlayerHit(
  state: GameState,
  proj: Projectile,
  player: Player,
): void {
  if (player.invulnFrames > 0) return;

  let damage = proj.damage;

  // Shield orb negates damage
  if (player.shield) {
    damage = 0;
    player.shield = false;
  } else {
    const shieldBonus = player.shieldEquip?.defBonus ?? 0;
    damage = Math.max(1, proj.damage - player.def - shieldBonus);
  }

  player.hp -= damage;

  if (damage > 0) {
    state.events.push({
      tick: state.tick,
      type: 'playerHit',
      message: `${player.name} took ${damage} damage from a projectile`,
      playerId: player.id,
      targetId: proj.ownerId >= 0 ? proj.ownerId : undefined,
    });
  }

  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
    player.deaths++;
    player.score += SCORE_VALUES.death;

    if (state.players.length > 1 && player.respawnsLeft > 0) {
      player.respawnTimer = 150;
    }

    state.events.push({
      tick: state.tick,
      type: 'playerDied',
      message: `${player.name} was hit by a projectile`,
      playerId: player.id,
    });

    if (player.hasKey) {
      player.hasKey = false;
      state.key.heldBy = -1;
      state.key.r = player.r;
      state.key.c = player.c;

      state.events.push({
        tick: state.tick,
        type: 'keyDrop',
        message: `${player.name} dropped the key!`,
        playerId: player.id,
      });
    }
  }

  player.invulnFrames = invulnTime(state);
}

// ── Process Projectiles ──

export function processProjectiles(state: GameState): void {
  const remaining: Projectile[] = [];

  for (const proj of state.projectiles) {
    // Check if projectile is currently inside a wall (e.g., spawned into one)
    if (!isProjectilePassable(state, proj.r, proj.c)) {
      continue; // Remove projectile
    }

    // Pre-move: check player collision at current position (catches point-blank hits)
    let preHit = false;
    for (const player of state.players) {
      if (!player.alive || player.id === proj.ownerId) continue;
      if (player.r === proj.r && player.c === proj.c) {
        handleProjectilePlayerHit(state, proj, player);
        preHit = true;
        break;
      }
    }
    if (preHit) continue; // Consume projectile, skip the move

    // Move projectile
    proj.r += proj.dir.dr;
    proj.c += proj.dir.dc;
    proj.range--;

    // Check wall collision at new position
    if (!isProjectilePassable(state, proj.r, proj.c)) {
      continue; // Remove projectile
    }

    let hit = false;

    // Check collision with monsters (only for player-owned projectiles)
    if (proj.ownerId >= 0) {
      for (const monster of state.monsters) {
        if (!monster.alive) continue;
        if (monster.r === proj.r && monster.c === proj.c) {
          const owner = state.players.find((p) => p.id === proj.ownerId);
          if (owner) {
            resolveAttack(state, owner, monster);
          }
          hit = true;
          break;
        }
      }

      // Check collision with boss
      if (!hit && state.boss && state.boss.alive) {
        if (state.boss.r === proj.r && state.boss.c === proj.c) {
          const owner = state.players.find((p) => p.id === proj.ownerId);
          if (owner) {
            resolveAttack(state, owner, state.boss);
          }
          hit = true;
        }
      }
    }

    // Check collision with players (for monster projectiles or PvP)
    if (!hit) {
      for (const player of state.players) {
        if (!player.alive || player.id === proj.ownerId) continue;
        if (player.r === proj.r && player.c === proj.c) {
          handleProjectilePlayerHit(state, proj, player);
          hit = true;
          break;
        }
      }
    }

    // Keep projectile if it didn't hit anything and still has range
    if (!hit && proj.range > 0) {
      remaining.push(proj);
    }
  }

  state.projectiles = remaining;
}

// ── Player vs Player ──

export function resolvePlayerVsPlayer(
  state: GameState,
  attacker: Player,
  target: Player,
): void {
  if (target.invulnFrames > 0 || !target.alive) return;

  const shieldBonus = target.shieldEquip?.defBonus ?? 0;
  const weaponBonus = attacker.weapon?.atkBonus ?? 0;
  let damage = Math.max(
    1,
    attacker.atk + weaponBonus - target.def - shieldBonus,
  );

  // Shield orb negates damage
  if (target.shield) {
    damage = 0;
    target.shield = false;
  }

  target.hp -= damage;
  attacker.attackCooldown = 2;

  if (damage > 0) {
    state.events.push({
      tick: state.tick,
      type: 'playerHit',
      message: `${target.name} took ${damage} damage from ${attacker.name}`,
      playerId: target.id,
      targetId: attacker.id,
    });
  }

  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    target.deaths++;
    target.score += SCORE_VALUES.death;

    attacker.pvpKills++;
    attacker.score += SCORE_VALUES.pvpKill;

    if (state.players.length > 1 && target.respawnsLeft > 0) {
      target.respawnTimer = 150;
    }

    state.events.push({
      tick: state.tick,
      type: 'pvpKill',
      message: `${attacker.name} eliminated ${target.name}`,
      playerId: attacker.id,
      targetId: target.id,
    });

    // Drop key if target was holding it
    if (target.hasKey) {
      target.hasKey = false;
      state.key.heldBy = -1;
      state.key.r = target.r;
      state.key.c = target.c;

      state.events.push({
        tick: state.tick,
        type: 'keyDrop',
        message: `${target.name} dropped the key!`,
        playerId: target.id,
      });
    }
  }

  target.invulnFrames = invulnTime(state);
}

// ── Check Player Collisions with Monsters ──

export function checkPlayerCollisions(
  state: GameState,
  player: Player,
): void {
  if (!player.alive) return;

  for (const monster of state.monsters) {
    if (!monster.alive) continue;
    if (monster.r === player.r && monster.c === player.c) {
      resolveMonsterAttack(state, monster, player);
    }
  }

  // Also check boss collision
  if (state.boss && state.boss.alive) {
    if (state.boss.r === player.r && state.boss.c === player.c) {
      resolveMonsterAttack(state, state.boss, player);
    }
  }
}

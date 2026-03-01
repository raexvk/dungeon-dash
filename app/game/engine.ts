import type {
  GameState,
  Player,
  Monster,
  Boss,
  TileType,
  InputAction,
  Direction,
  AbilityType,
  GamePhase,
  GroundItem,
  ItemType,
  LevelConfig,
  PlayerClass,
  Visibility,
  BufferedInput,
} from './types';
import { CLASS_STATS, PLAYER_COLORS } from './types';
import {
  resolveAttack,
  resolveMonsterAttack,
  resolveTelegraphs,
  tickHazards,
  processProjectiles,
  checkPlayerCollisions,
  canMoveTo,
  isMonsterWalkable,
  deltaToDirection,
  monsterAt,
  bossAt,
} from './combat';
import { advanceMonsterTurns, monsterTick, bossTick, createMonster, createBoss, randomDirection4, findNearestPlayer } from './monsters';
import { checkItemPickup, checkTileEffects, checkDoorUnlock } from './items';
import { updateVisibility, createVisibilityMap, setFullVisibility } from './fog';
import { SOLO_LEVELS } from './levels';
import { SCORE_VALUES } from './scoring';

// ── Initialize a solo game state from a level config ──

export function initializeSoloGame(levelIndex: number): GameState {
  const config = SOLO_LEVELS[levelIndex];
  return initializeGameFromConfig(config, levelIndex, [
    {
      name: 'Hero',
      classType: 'knight',
      color: PLAYER_COLORS.knight,
    },
  ]);
}

export function initializeGameFromConfig(
  config: LevelConfig,
  levelIndex: number,
  playerDefs: { name: string; classType: PlayerClass; color: string }[],
): GameState {
  const grid: TileType[][] = [];
  const monsters: Monster[] = [];
  const items: GroundItem[] = [];
  const torches: { r: number; c: number }[] = [];
  const playerSpawns: { r: number; c: number }[] = [];
  let doorPos = { r: 0, c: 0 };
  let bossSpawnR = 0;
  let bossSpawnC = 0;
  let monsterCount = 0;

  // Parse the map
  for (let r = 0; r < config.map.length; r++) {
    grid[r] = [];
    const row = config.map[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      switch (ch) {
        case '#':
        case ' ':
        case '^':
        case '>':
        case '=':
          grid[r][c] = ch as TileType;
          break;
        case 'P':
          playerSpawns[0] = { r, c };
          grid[r][c] = ' ';
          break;
        case '1':
          playerSpawns[0] = { r, c };
          grid[r][c] = ' ';
          break;
        case '2':
          playerSpawns[1] = { r, c };
          grid[r][c] = ' ';
          break;
        case '3':
          playerSpawns[2] = { r, c };
          grid[r][c] = ' ';
          break;
        case '4':
          playerSpawns[3] = { r, c };
          grid[r][c] = ' ';
          break;
        case '5':
          playerSpawns[4] = { r, c };
          grid[r][c] = ' ';
          break;
        case 'S':
          monsters.push(
            createMonster('skeleton', r, c, `mon-${monsterCount++}`),
          );
          grid[r][c] = ' ';
          break;
        case 'B':
          monsters.push(createMonster('bat', r, c, `mon-${monsterCount++}`));
          grid[r][c] = ' ';
          break;
        case 'D':
          doorPos = { r, c };
          grid[r][c] = 'D';
          break;
        case 'T':
          torches.push({ r, c });
          grid[r][c] = 'T' as TileType;
          break;
        case '+':
          items.push(createRandomItem(r, c, `item-${items.length}`));
          grid[r][c] = ' ';
          break;
        case '.':
          // Boss area floor
          bossSpawnR = r;
          bossSpawnC = c;
          grid[r][c] = ' ';
          break;
        case '$':
          items.push({
            id: `gold-win-${r}-${c}`,
            type: 'gold',
            r,
            c,
            collected: false,
            value: 500,
          });
          grid[r][c] = ' ';
          break;
        case '?':
          grid[r][c] = '?' as TileType;
          break;
        default:
          grid[r][c] = ' ';
          break;
      }
    }
  }

  // Create players — each uses their own spawn point (1-5 markers on the map)
  const isSolo = playerDefs.length === 1;
  const fallbackSpawn = playerSpawns[0] ?? { r: 1, c: 1 };
  const players: Player[] = playerDefs.map((def, i) => {
    const stats = CLASS_STATS[def.classType];
    const spawn = playerSpawns[i] ?? fallbackSpawn;
    return {
      id: i,
      name: def.name,
      classType: def.classType,
      color: def.color,
      r: spawn.r,
      c: spawn.c,
      spawnR: spawn.r,
      spawnC: spawn.c,
      hp: isSolo ? 5 : stats.maxHp,
      maxHp: isSolo ? 5 : stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      facing: 'down',
      alive: true,
      respawnTimer: 0,
      respawnsLeft: isSolo ? 0 : 2,
      invulnFrames: 0,
      attackCooldown: 0,
      hasKey: false,
      shield: false,
      speedBoost: 0,
      weapon: null,
      shieldEquip: null,
      abilities: { fireball: 0, freeze: 0 },
      hasFireball: false,
      hasFreeze: false,
      hasBow: false,
      score: 0,
      levelScore: 0,
      deaths: 0,
      kills: 0,
      pvpKills: 0,
      bossKills: 0,
      exitOrder: -1,
      connected: true,
      afkTimer: 0,
      inputBuffer: [],
      renderX: spawn.c * 32,
      renderY: spawn.r * 32,
      animFrame: 0,
    };
  });

  // Create boss
  const boss = config.bossType
    ? createBoss(
        config.bossType,
        bossSpawnR,
        bossSpawnC,
        config.bossHpBase,
        players.length,
      )
    : null;

  // Create visibility maps
  const visibilityMaps = new Map<number, Visibility[][]>();
  for (const player of players) {
    const visMap = createVisibilityMap(grid.length, grid[0].length);
    if (!config.fogOfWar) {
      setFullVisibility(visMap);
    } else {
      updateVisibility(player.r, player.c, grid, visMap, config.visionRadius, torches);
    }
    visibilityMaps.set(player.id, visMap);
  }

  return {
    tick: 0,
    level: levelIndex,
    phase: 'playing',
    exitTimer: -1,
    grid,
    players,
    monsters,
    boss,
    items,
    key: { exists: false, r: -1, c: -1, heldBy: -1 },
    door: { r: doorPos.r, c: doorPos.c, open: false },
    telegraphs: [],
    hazards: [],
    projectiles: [],
    events: [],
    torches,
    visibilityMaps,
  };
}

function createRandomItem(r: number, c: number, id: string): GroundItem {
  const pool: { type: ItemType; weight: number; value?: number }[] = [
    { type: 'healthPotion', weight: 30 },
    { type: 'gold', weight: 25, value: 50 },
    { type: 'gold', weight: 15, value: 100 },
    { type: 'shieldOrb', weight: 10 },
    { type: 'speedScroll', weight: 5 },
    { type: 'swordIron', weight: 5 },
    { type: 'shieldWood', weight: 5 },
    { type: 'chest', weight: 5 },
  ];
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const entry of pool) {
    rand -= entry.weight;
    if (rand <= 0) {
      return { id, type: entry.type, r, c, collected: false, value: entry.value };
    }
  }
  return { id, type: 'gold', r, c, collected: false, value: 50 };
}

// ── Solo Turn Processing ──

export function processSoloTurn(
  state: GameState,
  action: InputAction,
  dir?: { dr: number; dc: number },
  ability?: AbilityType,
): void {
  const player = state.players[0];
  if (!player.alive) return;
  if (state.phase !== 'playing' && state.phase !== 'bossDead' && state.phase !== 'doorOpen' && state.phase !== 'exiting') return;

  // Decrement turn-based cooldowns (attackCooldown is per-turn, invuln is real-time via interval)
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.speedBoost > 0) player.speedBoost--;

  state.tick++;

  if (action === 'move' && dir) {
    player.facing = deltaToDirection(dir);
    const nr = player.r + dir.dr;
    const nc = player.c + dir.dc;

    if (!canMoveTo(state.grid, nr, nc, state.door)) {
      // Check if moving into door to unlock
      if (
        state.grid[nr]?.[nc] === 'D' &&
        !state.door.open &&
        player.hasKey
      ) {
        checkDoorUnlock(state, player);
      }
      // Still process monster turns even on failed move
      resolveTelegraphs(state);
      advanceMonsterTurns(state);
      checkPlayerCollisions(state, player);
      updateFogForState(state);
      checkPhaseTransitions(state);
      return;
    }

    // Bump into monster = blocked, auto-shoot instead
    const targetMonster = monsterAt(state.monsters, nr, nc);
    const targetBoss = bossAt(state.boss, nr, nc);
    if (targetMonster || targetBoss) {
      if (player.attackCooldown <= 0) {
        const weaponBonus = player.weapon?.atkBonus ?? 0;
        state.projectiles.push({
          id: `proj-p${player.id}-${state.tick}`,
          r: player.r + dir.dr,
          c: player.c + dir.dc,
          dir: { dr: dir.dr, dc: dir.dc },
          damage: player.atk + weaponBonus,
          range: 5,
          ownerId: player.id,
          type: 'arrow',
        });
        player.attackCooldown = 2;
      }
      resolveTelegraphs(state);
      advanceMonsterTurns(state);
      checkPlayerCollisions(state, player);
      updateFogForState(state);
      checkPhaseTransitions(state);
      return;
    }

    // Move player
    player.r = nr;
    player.c = nc;
    player.animFrame = (player.animFrame ?? 0) === 0 ? 1 : 0;

    // Check tile effects (traps, exit)
    checkTileEffects(state, player);
    if (!player.alive) {
      resolveTelegraphs(state);
      advanceMonsterTurns(state);
      updateFogForState(state);
      checkPhaseTransitions(state);
      return;
    }

    // Check item pickup
    checkItemPickup(state, player);

    // Check door unlock (adjacent)
    checkDoorUnlock(state, player);
  } else if (action === 'attack' && dir) {
    player.facing = deltaToDirection(dir);
    player.animFrame = (player.animFrame ?? 0) === 0 ? 1 : 0;

    if (player.attackCooldown <= 0) {
      const weaponBonus = player.weapon?.atkBonus ?? 0;
      state.projectiles.push({
        id: `proj-p${player.id}-${state.tick}`,
        r: player.r + dir.dr,
        c: player.c + dir.dc,
        dir: { dr: dir.dr, dc: dir.dc },
        damage: player.atk + weaponBonus,
        range: 5,
        ownerId: player.id,
        type: 'arrow',
      });
      player.attackCooldown = 2;

      state.events.push({
        tick: state.tick,
        type: 'damage',
        message: `${player.name} shoots!`,
        playerId: player.id,
      });
    }
  } else if (action === 'useAbility' && ability && dir) {
    handleAbility(state, player, ability, dir);
  }
  // 'wait' action: do nothing

  // Resolve telegraphs
  resolveTelegraphs(state);

  // Tick hazards
  tickHazards(state);

  // Process projectiles
  processProjectiles(state);

  // Monsters act
  advanceMonsterTurns(state);

  // Check collisions
  checkPlayerCollisions(state, player);

  // Update fog
  updateFogForState(state);

  // Check phase transitions
  checkPhaseTransitions(state);

  // Tick exit timer
  if (state.exitTimer > 0) {
    state.exitTimer--;
    if (state.exitTimer <= 0) {
      state.phase = 'summary';
    }
  }
}

function handleAbility(
  state: GameState,
  player: Player,
  ability: AbilityType,
  dir: { dr: number; dc: number },
): void {
  if (ability === 'fireball' && player.hasFireball && player.abilities.fireball <= 0) {
    // Launch fireball projectile
    state.projectiles.push({
      id: `proj-${state.tick}-fb`,
      r: player.r + dir.dr,
      c: player.c + dir.dc,
      dir,
      damage: 6,
      range: 5,
      ownerId: player.id,
      type: 'fireball',
    });
    player.abilities.fireball = 120; // 4 sec cooldown at 30Hz
  } else if (ability === 'freeze' && player.hasFreeze && player.abilities.freeze <= 0) {
    // Freeze all monsters in 3-tile radius
    for (const monster of state.monsters) {
      if (!monster.alive) continue;
      const dist =
        Math.abs(monster.r - player.r) + Math.abs(monster.c - player.c);
      if (dist <= 3) {
        monster.stunTimer = 60; // 2 sec
      }
    }
    if (state.boss && state.boss.alive) {
      const dist =
        Math.abs(state.boss.r - player.r) +
        Math.abs(state.boss.c - player.c);
      if (dist <= 3) {
        state.boss.stunTimer = 30; // 1 sec for boss (half)
      }
    }
    player.abilities.freeze = 180; // 6 sec cooldown
  }
}

function updateFogForState(state: GameState): void {
  const config = SOLO_LEVELS[state.level];
  if (!config?.fogOfWar) return;

  for (const player of state.players) {
    if (!player.alive) continue;
    const visMap = state.visibilityMaps.get(player.id);
    if (visMap) {
      updateVisibility(
        player.r,
        player.c,
        state.grid,
        visMap,
        config.visionRadius,
        state.torches,
      );
    }
  }
}

export function checkPhaseTransitions(state: GameState): void {
  // Solo: all players dead = game over
  const allDead = state.players.every((p) => !p.alive);
  if (allDead && state.players.length === 1) {
    state.phase = 'gameOver';
    return;
  }

  // Boss dead → key has spawned, wait for door
  // Door open → exiting phase, timer running
  // All exited → summary
  const currentPhase = state.phase;
  if (currentPhase === 'doorOpen') {
    state.phase = 'exiting';
  }

  // Solo: check if player reached exit when door is open
  if (currentPhase === 'exiting' || currentPhase === 'doorOpen') {
    const player = state.players[0];
    if (player && player.exitOrder >= 0) {
      state.phase = 'summary';
    }
  }
}

// ── Multiplayer Tick Processing ──

export function processMultiplayerTick(state: GameState): void {
  state.tick++;

  // Process buffered inputs
  for (const player of state.players) {
    if (!player.alive || !player.connected) continue;
    const input = player.inputBuffer.shift();
    if (input) {
      player.afkTimer = 0;
      processPlayerInput(state, player, input);
    } else {
      player.afkTimer++;
    }
  }

  // Monster movement (monsterTick manages its own moveTimer internally)
  for (const monster of state.monsters) {
    if (!monster.alive) continue;
    monsterTick(state, monster);
  }

  // Boss tick (bossTick manages its own moveTimer internally)
  if (state.boss?.alive) {
    bossTick(state, state.boss);
  }

  // Resolve telegraphs
  resolveTelegraphs(state);

  // Tick hazards
  tickHazards(state);

  // Process projectiles
  processProjectiles(state);

  // Collision detection
  for (const player of state.players) {
    if (!player.alive) continue;
    checkPlayerCollisions(state, player);
  }

  // Update timers
  tickTimers(state);

  // Update fog
  updateFogForState(state);

  // Phase transitions
  checkPhaseTransitions(state);
}

function processPlayerInput(
  state: GameState,
  player: Player,
  input: BufferedInput,
): void {
  if (input.action === 'move' && input.dir) {
    player.facing = deltaToDirection(input.dir);
    const nr = player.r + input.dir.dr;
    const nc = player.c + input.dir.dc;

    if (!canMoveTo(state.grid, nr, nc, state.door)) {
      if (state.grid[nr]?.[nc] === 'D' && !state.door.open && player.hasKey) {
        checkDoorUnlock(state, player);
      }
      return;
    }

    // Bump into monster = blocked, auto-shoot
    const targetMonster = monsterAt(state.monsters, nr, nc);
    const targetBoss = bossAt(state.boss, nr, nc);
    if (targetMonster || targetBoss) {
      if (player.attackCooldown <= 0) {
        const weaponBonus = player.weapon?.atkBonus ?? 0;
        state.projectiles.push({
          id: `proj-p${player.id}-${state.tick}`,
          r: player.r + input.dir.dr,
          c: player.c + input.dir.dc,
          dir: { dr: input.dir.dr, dc: input.dir.dc },
          damage: player.atk + weaponBonus,
          range: 5,
          ownerId: player.id,
          type: 'arrow',
        });
        player.attackCooldown = 2;
      }
      return;
    }

    player.r = nr;
    player.c = nc;
    player.animFrame = (player.animFrame ?? 0) === 0 ? 1 : 0;
    checkTileEffects(state, player);
    checkItemPickup(state, player);
    checkDoorUnlock(state, player);
  } else if (input.action === 'attack' && input.dir) {
    if (player.attackCooldown > 0) return;
    player.facing = deltaToDirection(input.dir);
    player.animFrame = (player.animFrame ?? 0) === 0 ? 1 : 0;
    const weaponBonus = player.weapon?.atkBonus ?? 0;
    state.projectiles.push({
      id: `proj-p${player.id}-${state.tick}`,
      r: player.r + input.dir.dr,
      c: player.c + input.dir.dc,
      dir: { dr: input.dir.dr, dc: input.dir.dc },
      damage: player.atk + weaponBonus,
      range: 5,
      ownerId: player.id,
      type: 'arrow',
    });
    player.attackCooldown = 2;
  } else if (input.action === 'useAbility' && input.ability && input.dir) {
    handleAbility(state, player, input.ability, input.dir);
  }
}

function tickTimers(state: GameState): void {
  for (const player of state.players) {
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invulnFrames > 0) player.invulnFrames--;
    if (player.speedBoost > 0) player.speedBoost--;
    if (player.abilities.fireball > 0) player.abilities.fireball--;
    if (player.abilities.freeze > 0) player.abilities.freeze--;

    // Respawn timer
    if (!player.alive && player.respawnTimer > 0) {
      player.respawnTimer--;
      if (player.respawnTimer <= 0 && player.respawnsLeft > 0) {
        // Respawn player
        player.respawnsLeft--;
        player.alive = true;
        player.hp = Math.floor(player.maxHp / 2);
        player.r = player.spawnR;
        player.c = player.spawnC;
        player.invulnFrames = 90; // 3 seconds at 30Hz (MP only)
        player.shield = false;
        player.weapon = null;
        player.shieldEquip = null;
      }
    }
  }

  // Exit timer
  if (state.exitTimer > 0) {
    state.exitTimer--;
    if (state.exitTimer <= 0) {
      state.phase = 'summary';
    }
  }
}

// ── Continuous Monster Auto-Movement (Pac-Man style, 4 cardinal directions) ──

function canMonsterMoveTo(
  state: GameState,
  monster: Monster,
  nr: number,
  nc: number,
): boolean {
  if (!isMonsterWalkable(state.grid, nr, nc, state.door)) return false;
  for (const m of state.monsters) {
    if (m.id !== monster.id && m.alive && m.r === nr && m.c === nc) return false;
  }
  if (state.boss && state.boss.id !== monster.id && state.boss.alive && state.boss.r === nr && state.boss.c === nc) {
    return false;
  }
  return true;
}

export function advanceMonsterAutoMove(state: GameState): void {
  if (state.phase === 'gameOver' || state.phase === 'summary') return;

  // Advance projectiles each tick so they move continuously
  processProjectiles(state);

  for (const monster of state.monsters) {
    if (!monster.alive) continue;
    if (monster.stunTimer > 0) {
      monster.stunTimer--;
      continue;
    }
    if (monster.attackCooldown > 0) monster.attackCooldown--;

    // Toggle walk animation frame
    monster.animFrame = monster.animFrame === 0 ? 1 : 0;

    const nr = monster.r + monster.patrolDir.dr;
    const nc = monster.c + monster.patrolDir.dc;

    if (canMonsterMoveTo(state, monster, nr, nc)) {
      monster.r = nr;
      monster.c = nc;

      // Check collision with players (bump damage)
      for (const player of state.players) {
        if (!player.alive) continue;
        if (monster.r === player.r && monster.c === player.c) {
          resolveMonsterAttack(state, monster, player);
        }
      }
    } else {
      // Pick a new random cardinal direction
      monster.patrolDir = randomDirection4();
    }

    // Ranged attack: shoot if player within 3 tiles
    if (monster.attackCooldown <= 0) {
      const nearest = findNearestPlayer(state, { r: monster.r, c: monster.c });
      if (nearest) {
        const dist = Math.abs(nearest.r - monster.r) + Math.abs(nearest.c - monster.c);
        if (dist <= 3 && dist > 0) {
          // Determine cardinal direction toward player
          const dr = nearest.r - monster.r;
          const dc = nearest.c - monster.c;
          const dir = Math.abs(dr) >= Math.abs(dc)
            ? { dr: dr > 0 ? 1 : -1, dc: 0 }
            : { dr: 0, dc: dc > 0 ? 1 : -1 };

          state.projectiles.push({
            id: `proj-${monster.id}-${state.tick}`,
            r: monster.r + dir.dr,
            c: monster.c + dir.dc,
            dir,
            damage: Math.max(1, monster.atk - 1),
            range: 4,
            ownerId: -1, // negative = monster-owned
            type: 'arrow',
          });
          monster.attackCooldown = 25;
        }
      }
    }
  }

  // Boss auto-move
  if (state.boss && state.boss.alive) {
    const boss = state.boss;
    if (boss.stunTimer > 0) {
      boss.stunTimer--;
      return;
    }
    if (boss.attackCooldown > 0) boss.attackCooldown--;
    if (boss.shockwaveCooldown > 0) boss.shockwaveCooldown--;

    boss.animFrame = boss.animFrame === 0 ? 1 : 0;

    const nr = boss.r + boss.patrolDir.dr;
    const nc = boss.c + boss.patrolDir.dc;

    if (canMonsterMoveTo(state, boss, nr, nc)) {
      boss.r = nr;
      boss.c = nc;

      for (const player of state.players) {
        if (!player.alive) continue;
        if (boss.r === player.r && boss.c === player.c) {
          resolveMonsterAttack(state, boss, player);
        }
      }
    } else {
      boss.patrolDir = randomDirection4();
    }

    // Boss fire attack: spit fireball at nearest player within 5 tiles
    if (boss.attackCooldown <= 0) {
      const nearest = findNearestPlayer(state, { r: boss.r, c: boss.c });
      if (nearest) {
        const dist = Math.abs(nearest.r - boss.r) + Math.abs(nearest.c - boss.c);
        if (dist <= 5 && dist > 0) {
          const dr = nearest.r - boss.r;
          const dc = nearest.c - boss.c;
          const dir = Math.abs(dr) >= Math.abs(dc)
            ? { dr: dr > 0 ? 1 : -1, dc: 0 }
            : { dr: 0, dc: dc > 0 ? 1 : -1 };

          state.projectiles.push({
            id: `proj-boss-${state.tick}`,
            r: boss.r + dir.dr,
            c: boss.c + dir.dc,
            dir,
            damage: boss.atk,
            range: 6,
            ownerId: -1,
            type: 'fireball',
          });
          boss.attackCooldown = boss.enraged ? 12 : 20;
        }
      }
    }
  }

  // Check if player died from monster/projectile collision
  checkPhaseTransitions(state);
}

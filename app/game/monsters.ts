import type {
  GameState,
  Monster,
  Boss,
  MonsterType,
  MonsterBehavior,
  Player,
  Position,
  Telegraph,
} from './types';
import { createTelegraph, isWalkable } from './combat';

// ── Monster Stats Table ──

export const MONSTER_STATS: Record<MonsterType, {
  hp: number; atk: number; def: number;
  moveInterval: number; alertRadius: number;
  defaultBehavior: MonsterBehavior; attackCooldown: number;
}> = {
  skeleton: { hp: 4, atk: 4, def: 1, moveInterval: 40, alertRadius: 5, defaultBehavior: 'patrol', attackCooldown: 60 },
  slime: { hp: 8, atk: 2, def: 3, moveInterval: 55, alertRadius: 4, defaultBehavior: 'patrol', attackCooldown: 120 },
  bat: { hp: 2, atk: 3, def: 0, moveInterval: 30, alertRadius: 5, defaultBehavior: 'erratic', attackCooldown: 90 },
  darkKnight: { hp: 30, atk: 8, def: 2, moveInterval: 35, alertRadius: 99, defaultBehavior: 'boss', attackCooldown: 75 },
};

// ── Direction Helpers ──

const DIRECTIONS_4 = [
  { dr: -1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
];

export function randomDirection4(): { dr: number; dc: number } {
  return { ...DIRECTIONS_4[Math.floor(Math.random() * DIRECTIONS_4.length)] };
}

// ── Factory Functions ──

export function createMonster(type: MonsterType, r: number, c: number, id: string): Monster {
  const stats = MONSTER_STATS[type];
  const dir = randomDirection4();
  return {
    id,
    type,
    r,
    c,
    spawnR: r,
    spawnC: c,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    behavior: stats.defaultBehavior,
    alertRadius: stats.alertRadius,
    targetPlayerId: null,
    patrolDir: dir,
    moveTimer: 0,
    moveInterval: stats.moveInterval,
    attackCooldown: 0,
    stunTimer: 0,
    alive: true,
    animFrame: 0,
  };
}

export function createBoss(type: MonsterType, r: number, c: number, hpBase: number, playerCount: number): Boss {
  const stats = MONSTER_STATS[type];
  const scaledHp = Math.floor(hpBase * (1 + 0.3 * (playerCount - 1)));
  return {
    id: 'boss',
    type,
    r,
    c,
    spawnR: r,
    spawnC: c,
    hp: scaledHp,
    maxHp: scaledHp,
    atk: stats.atk,
    def: stats.def,
    behavior: 'boss',
    alertRadius: stats.alertRadius,
    targetPlayerId: null,
    patrolDir: randomDirection4(),
    moveTimer: 0,
    moveInterval: stats.moveInterval,
    attackCooldown: 0,
    stunTimer: 0,
    alive: true,
    animFrame: 0,
    phase: 1,
    lastHitBy: null,
    shockwaveCooldown: 0,
    enraged: false,
  };
}

// ── Utility Functions ──

export function findNearestPlayer(state: GameState, pos: Position): Player | null {
  let nearest: Player | null = null;
  let minDist = Infinity;

  for (const player of state.players) {
    if (!player.alive || !player.connected) continue;
    const dist = Math.abs(player.r - pos.r) + Math.abs(player.c - pos.c);
    if (dist < minDist) {
      minDist = dist;
      nearest = player;
    }
  }

  return nearest;
}

export function directionToward(from: Position, to: Position): { dr: number; dc: number } {
  const dr = to.r - from.r;
  const dc = to.c - from.c;

  if (dr === 0 && dc === 0) return { dr: 0, dc: 0 };

  // Return unit direction
  return {
    dr: dr === 0 ? 0 : dr > 0 ? 1 : -1,
    dc: dc === 0 ? 0 : dc > 0 ? 1 : -1,
  };
}

function distanceTo(a: Position, b: Position): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function tryMove(state: GameState, monster: Monster, dr: number, dc: number): boolean {
  const nr = monster.r + dr;
  const nc = monster.c + dc;

  if (!isWalkable(state.grid, nr, nc)) return false;

  // Don't step on other monsters
  for (const m of state.monsters) {
    if (m.id !== monster.id && m.alive && m.r === nr && m.c === nc) return false;
  }

  // Don't step on the boss
  if (state.boss && state.boss.id !== monster.id && state.boss.alive && state.boss.r === nr && state.boss.c === nc) {
    return false;
  }

  monster.r = nr;
  monster.c = nc;
  return true;
}

// ── Monster AI Behaviors ──

export function aiPatrol(state: GameState, monster: Monster): void {
  // Try to move in current patrol direction
  const moved = tryMove(state, monster, monster.patrolDir.dr, monster.patrolDir.dc);

  if (!moved) {
    // Reverse direction on hitting a wall
    monster.patrolDir.dr = -monster.patrolDir.dr;
    monster.patrolDir.dc = -monster.patrolDir.dc;
    tryMove(state, monster, monster.patrolDir.dr, monster.patrolDir.dc);
  }
}

export function aiChase(state: GameState, monster: Monster): void {
  // Find target player
  let target: Player | null = null;

  if (monster.targetPlayerId !== null) {
    const t = state.players.find(p => p.id === monster.targetPlayerId);
    if (t && t.alive && t.connected) {
      target = t;
    }
  }

  if (!target) {
    target = findNearestPlayer(state, { r: monster.r, c: monster.c });
    monster.targetPlayerId = target ? target.id : null;
  }

  if (!target) return;

  const dr = target.r - monster.r;
  const dc = target.c - monster.c;

  // Prefer axis with larger delta (simple pathfinding)
  if (Math.abs(dr) >= Math.abs(dc)) {
    // Try vertical first, then horizontal
    const dirR = dr > 0 ? 1 : -1;
    if (!tryMove(state, monster, dirR, 0)) {
      if (dc !== 0) {
        const dirC = dc > 0 ? 1 : -1;
        tryMove(state, monster, 0, dirC);
      }
    }
  } else {
    // Try horizontal first, then vertical
    const dirC = dc > 0 ? 1 : -1;
    if (!tryMove(state, monster, 0, dirC)) {
      if (dr !== 0) {
        const dirR = dr > 0 ? 1 : -1;
        tryMove(state, monster, dirR, 0);
      }
    }
  }

  // Attack if adjacent and cooldown ready
  if (monster.attackCooldown <= 0) {
    const dist = distanceTo({ r: monster.r, c: monster.c }, { r: target.r, c: target.c });
    if (dist <= 1) {
      switch (monster.type) {
        case 'skeleton':
          skeletonAttack(state, monster, target);
          break;
        case 'slime':
          slimeAttack(state, monster);
          break;
        case 'bat':
          batDiveBomb(state, monster, target);
          break;
        default:
          skeletonAttack(state, monster, target);
          break;
      }
      monster.attackCooldown = MONSTER_STATS[monster.type].attackCooldown;
    }
  }
}

export function aiAmbush(state: GameState, monster: Monster): void {
  // Stay still until player is in alert range, then switch to chase
  const nearest = findNearestPlayer(state, { r: monster.r, c: monster.c });
  if (!nearest) return;

  const dist = distanceTo({ r: monster.r, c: monster.c }, { r: nearest.r, c: nearest.c });
  if (dist <= monster.alertRadius) {
    monster.behavior = 'chase';
    monster.targetPlayerId = nearest.id;
    aiChase(state, monster);
  }
}

export function aiFlee(state: GameState, monster: Monster): void {
  const nearest = findNearestPlayer(state, { r: monster.r, c: monster.c });
  if (!nearest) return;

  // Move away from nearest player
  const dir = directionToward({ r: monster.r, c: monster.c }, { r: nearest.r, c: nearest.c });
  const fleeR = -dir.dr;
  const fleeC = -dir.dc;

  // Try fleeing in opposite direction
  if (!tryMove(state, monster, fleeR, fleeC)) {
    // Try perpendicular directions
    if (!tryMove(state, monster, fleeC, fleeR)) {
      tryMove(state, monster, -fleeC, -fleeR);
    }
  }
}

export function aiErratic(state: GameState, monster: Monster): void {
  // Random valid direction each tick (bat behavior)
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  // Shuffle directions randomly
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }

  // Try each direction until one works
  for (const d of directions) {
    if (tryMove(state, monster, d.dr, d.dc)) {
      break;
    }
  }

  // Attack nearby players if cooldown ready
  if (monster.attackCooldown <= 0) {
    const nearest = findNearestPlayer(state, { r: monster.r, c: monster.c });
    if (nearest) {
      const dist = distanceTo({ r: monster.r, c: monster.c }, { r: nearest.r, c: nearest.c });
      if (dist <= 2) {
        batDiveBomb(state, monster, nearest);
        monster.attackCooldown = MONSTER_STATS[monster.type].attackCooldown;
      }
    }
  }
}

// ── Monster Tick (Main AI Loop) ──

export function monsterTick(state: GameState, monster: Monster): void {
  if (!monster.alive) return;

  // Handle stun
  if (monster.stunTimer > 0) {
    monster.stunTimer--;
    return;
  }

  // Decrement attack cooldown
  if (monster.attackCooldown > 0) {
    monster.attackCooldown--;
  }

  // Move timer
  monster.moveTimer++;
  if (monster.moveTimer < monster.moveInterval) return;
  monster.moveTimer = 0;

  // Check for behavior transitions
  const hpPercent = monster.hp / monster.maxHp;
  const nearest = findNearestPlayer(state, { r: monster.r, c: monster.c });

  // Flee if low HP (< 25%)
  if (hpPercent < 0.25 && (monster.behavior === 'chase' || monster.behavior === 'patrol')) {
    monster.behavior = 'flee';
  }

  // Patrol -> Chase if player in alert radius
  if (monster.behavior === 'patrol' && nearest) {
    const dist = distanceTo({ r: monster.r, c: monster.c }, { r: nearest.r, c: nearest.c });
    if (dist <= monster.alertRadius) {
      monster.behavior = 'chase';
      monster.targetPlayerId = nearest.id;
    }
  }

  // Execute behavior
  switch (monster.behavior) {
    case 'patrol':
      aiPatrol(state, monster);
      break;
    case 'chase':
      aiChase(state, monster);
      break;
    case 'ambush':
      aiAmbush(state, monster);
      break;
    case 'flee':
      aiFlee(state, monster);
      break;
    case 'erratic':
      aiErratic(state, monster);
      break;
  }
}

// ── Monster Attack Patterns ──

export function skeletonAttack(state: GameState, skeleton: Monster, target: Player): void {
  // Create melee telegraph on target tile
  const telegraph = createTelegraph(
    `${skeleton.id}-melee-${state.tick}`,
    skeleton.id,
    [{ r: target.r, c: target.c }],
    1,
    skeleton.atk,
    false,
    'melee'
  );
  state.telegraphs.push(telegraph);
}

export function slimeAttack(state: GameState, slime: Monster): void {
  // Create acid telegraph in cross pattern around slime
  const tiles: Position[] = [
    { r: slime.r - 1, c: slime.c },
    { r: slime.r + 1, c: slime.c },
    { r: slime.r, c: slime.c - 1 },
    { r: slime.r, c: slime.c + 1 },
  ].filter(t => isWalkable(state.grid, t.r, t.c));

  const telegraph = createTelegraph(
    `${slime.id}-acid-${state.tick}`,
    slime.id,
    tiles,
    1,
    slime.atk,
    false,
    'acid'
  );
  state.telegraphs.push(telegraph);
}

export function batDiveBomb(state: GameState, bat: Monster, target: Player): void {
  // Create divebomb telegraph: line of 3 tiles toward target
  const dir = directionToward({ r: bat.r, c: bat.c }, { r: target.r, c: target.c });
  const tiles: Position[] = [];

  for (let i = 1; i <= 3; i++) {
    const tr = bat.r + dir.dr * i;
    const tc = bat.c + dir.dc * i;
    if (isWalkable(state.grid, tr, tc)) {
      tiles.push({ r: tr, c: tc });
    } else {
      break;
    }
  }

  if (tiles.length > 0) {
    const telegraph = createTelegraph(
      `${bat.id}-divebomb-${state.tick}`,
      bat.id,
      tiles,
      1,
      bat.atk,
      false,
      'divebomb'
    );
    state.telegraphs.push(telegraph);
  }
}

// ── Boss AI ──

export function bossShockwave(state: GameState, boss: Boss): void {
  // 3x3 area telegraph around boss
  const tiles: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const tr = boss.r + dr;
      const tc = boss.c + dc;
      if (isWalkable(state.grid, tr, tc)) {
        tiles.push({ r: tr, c: tc });
      }
    }
  }

  const telegraph = createTelegraph(
    `${boss.id}-shockwave-${state.tick}`,
    boss.id,
    tiles,
    2, // 2 turn warning
    boss.atk,
    true,
    'shockwave'
  );
  state.telegraphs.push(telegraph);
  boss.shockwaveCooldown = 60;
}

export function bossSwordStrike(state: GameState, boss: Boss, target: Player): void {
  // Create melee telegraph on target tile
  const telegraph = createTelegraph(
    `${boss.id}-sword-${state.tick}`,
    boss.id,
    [{ r: target.r, c: target.c }],
    1,
    boss.atk,
    false,
    'melee'
  );
  state.telegraphs.push(telegraph);
}

export function bossTick(state: GameState, boss: Boss): void {
  if (!boss.alive) return;

  // Handle stun
  if (boss.stunTimer > 0) {
    boss.stunTimer--;
    return;
  }

  // Decrement cooldowns
  if (boss.attackCooldown > 0) boss.attackCooldown--;
  if (boss.shockwaveCooldown > 0) boss.shockwaveCooldown--;

  // Update phase based on HP percentage
  const hpPercent = boss.hp / boss.maxHp;
  if (hpPercent <= 0.3 && boss.phase < 3) {
    boss.phase = 3;
    boss.enraged = true;
    state.events.push({
      tick: state.tick,
      type: 'bossPhase',
      message: 'Boss enters Phase 3 - ENRAGED!',
    });
  } else if (hpPercent <= 0.6 && boss.phase < 2) {
    boss.phase = 2;
    state.events.push({
      tick: state.tick,
      type: 'bossPhase',
      message: 'Boss enters Phase 2!',
    });
  }

  // Move timer
  boss.moveTimer++;
  const effectiveInterval = boss.enraged
    ? Math.floor(boss.moveInterval * 0.6)
    : boss.moveInterval;

  if (boss.moveTimer < effectiveInterval) return;
  boss.moveTimer = 0;

  // Find target: lastHitBy player or nearest
  let target: Player | null = null;
  if (boss.lastHitBy !== null) {
    const lastHitter = state.players.find(p => p.id === boss.lastHitBy);
    if (lastHitter && lastHitter.alive && lastHitter.connected) {
      target = lastHitter;
    }
  }
  if (!target) {
    target = findNearestPlayer(state, { r: boss.r, c: boss.c });
  }

  if (!target) return;

  boss.targetPlayerId = target.id;

  // Chase target
  const dr = target.r - boss.r;
  const dc = target.c - boss.c;

  if (Math.abs(dr) >= Math.abs(dc)) {
    const dirR = dr > 0 ? 1 : -1;
    if (!tryMove(state, boss, dirR, 0)) {
      if (dc !== 0) {
        const dirC = dc > 0 ? 1 : -1;
        tryMove(state, boss, 0, dirC);
      }
    }
  } else {
    const dirC = dc > 0 ? 1 : -1;
    if (!tryMove(state, boss, 0, dirC)) {
      if (dr !== 0) {
        const dirR = dr > 0 ? 1 : -1;
        tryMove(state, boss, dirR, 0);
      }
    }
  }

  // Phase 3 enraged: double move
  if (boss.enraged) {
    const dr2 = target.r - boss.r;
    const dc2 = target.c - boss.c;

    if (Math.abs(dr2) >= Math.abs(dc2)) {
      const dirR = dr2 > 0 ? 1 : -1;
      if (!tryMove(state, boss, dirR, 0)) {
        if (dc2 !== 0) {
          const dirC = dc2 > 0 ? 1 : -1;
          tryMove(state, boss, 0, dirC);
        }
      }
    } else {
      const dirC = dc2 > 0 ? 1 : -1;
      if (!tryMove(state, boss, 0, dirC)) {
        if (dr2 !== 0) {
          const dirR = dr2 > 0 ? 1 : -1;
          tryMove(state, boss, dirR, 0);
        }
      }
    }
  }

  // Attack logic
  if (boss.attackCooldown <= 0) {
    const dist = distanceTo({ r: boss.r, c: boss.c }, { r: target.r, c: target.c });

    // Phase 1: melee attack (telegraph 1 tile in front)
    if (dist <= 1) {
      bossSwordStrike(state, boss, target);
      boss.attackCooldown = MONSTER_STATS[boss.type].attackCooldown;
    }

    // Phase 2+: shockwave ability
    if (boss.phase >= 2 && boss.shockwaveCooldown <= 0 && dist <= 3) {
      bossShockwave(state, boss);
    }
  }
}

// ── Solo Mode: Advance All Monster Turns ──

export function advanceMonsterTurns(state: GameState): void {
  // Tick all alive monsters
  for (const monster of state.monsters) {
    if (monster.alive) {
      monsterTick(state, monster);
    }
  }

  // Tick boss if present
  if (state.boss && state.boss.alive) {
    bossTick(state, state.boss);
  }
}

import type { GameState, Player, GroundItem, ItemType, WeaponDef, ShieldDef } from './types';
import { SCORE_VALUES } from './scoring';

export const ITEM_DEFS: Record<ItemType, {
  name: string;
  description: string;
}> = {
  healthPotion: { name: 'Health Potion', description: 'Full heal + increases max HP' },
  gold: { name: 'Gold', description: 'Worth points' },
  shieldOrb: { name: 'Shield Orb', description: 'Blocks one hit' },
  speedScroll: { name: 'Speed Scroll', description: 'Faster movement' },
  swordIron: { name: 'Iron Sword', description: '+2 ATK' },
  swordFire: { name: 'Fire Sword', description: '+4 ATK' },
  shieldWood: { name: 'Wood Shield', description: '+1 DEF' },
  shieldIron: { name: 'Iron Shield', description: '+2 DEF' },
  bow: { name: 'Bow', description: 'Ranged attack' },
  fireballScroll: { name: 'Fireball Scroll', description: 'Unlocks fireball' },
  freezeScroll: { name: 'Freeze Scroll', description: 'Unlocks freeze' },
  chest: { name: 'Chest', description: 'Contains a random item' },
};

export const WEAPONS: Record<string, WeaponDef> = {
  swordIron: { name: 'Iron Sword', atkBonus: 2, range: 1 },
  swordFire: { name: 'Fire Sword', atkBonus: 4, range: 1 },
  bow: { name: 'Bow', atkBonus: 1, range: 3 },
};

export const SHIELDS: Record<string, ShieldDef> = {
  shieldWood: { name: 'Wood Shield', defBonus: 1 },
  shieldIron: { name: 'Iron Shield', defBonus: 2 },
};

export function checkItemPickup(state: GameState, player: Player): void {
  for (const item of state.items) {
    if (item.collected) continue;
    if (item.r !== player.r || item.c !== player.c) continue;

    item.collected = true;
    applyItem(state, player, item);

    state.events.push({
      tick: state.tick,
      type: 'itemPickup',
      message: `${player.name} picked up ${ITEM_DEFS[item.type].name}`,
      playerId: player.id,
      targetId: item.id,
    });
  }

  // Check key pickup
  if (
    state.key.exists &&
    state.key.heldBy === -1 &&
    state.key.r === player.r &&
    state.key.c === player.c
  ) {
    state.key.heldBy = player.id;
    player.hasKey = true;
    player.score += SCORE_VALUES.keyPickup;
    player.levelScore += SCORE_VALUES.keyPickup;

    state.events.push({
      tick: state.tick,
      type: 'keyPickup',
      message: `${player.name} picked up the key!`,
      playerId: player.id,
    });
  }
}

function applyItem(state: GameState, player: Player, item: GroundItem): void {
  switch (item.type) {
    case 'healthPotion':
      player.maxHp += 1;         // permanent +1 max HP per bottle
      player.hp = player.maxHp;  // fully heal (to new max)
      break;
    case 'gold': {
      const val = item.value ?? 50;
      player.score += val;
      player.levelScore += val;
      break;
    }
    case 'shieldOrb':
      player.shield = true;
      break;
    case 'speedScroll':
      player.speedBoost = 150; // 5 sec at 30Hz
      break;
    case 'swordIron':
      player.weapon = WEAPONS.swordIron;
      break;
    case 'swordFire':
      player.weapon = WEAPONS.swordFire;
      break;
    case 'shieldWood':
      player.shieldEquip = SHIELDS.shieldWood;
      break;
    case 'shieldIron':
      player.shieldEquip = SHIELDS.shieldIron;
      break;
    case 'bow':
      player.hasBow = true;
      player.weapon = WEAPONS.bow;
      break;
    case 'fireballScroll':
      player.hasFireball = true;
      break;
    case 'freezeScroll':
      player.hasFreeze = true;
      break;
    case 'chest':
      // Random item from chest
      spawnRandomChestItem(state, item.r, item.c);
      break;
  }
}

function spawnRandomChestItem(state: GameState, r: number, c: number): void {
  const pool: ItemType[] = [
    'healthPotion',
    'gold',
    'shieldOrb',
    'speedScroll',
    'swordIron',
    'shieldWood',
  ];
  const type = pool[Math.floor(Math.random() * pool.length)];
  state.items.push({
    id: `chest-${state.tick}-${r}-${c}`,
    type,
    r,
    c,
    collected: false,
    value: type === 'gold' ? 100 : undefined,
  });
}

export function checkTileEffects(state: GameState, player: Player): void {
  const tile = state.grid[player.r]?.[player.c];
  if (!tile) return;

  switch (tile) {
    case '^':
      // Trap damage
      if (player.invulnFrames <= 0) {
        const damage = player.shield ? 0 : Math.max(1, 2 - player.def);
        if (player.shield) {
          player.shield = false;
        } else {
          player.hp -= damage;
        }
        player.invulnFrames = 90; // 3 seconds at 30Hz (real-time)

        if (player.hp <= 0) {
          player.hp = 0;
          player.alive = false;
          player.deaths++;
          player.score += SCORE_VALUES.death;
          if (state.players.length > 1 && player.respawnsLeft > 0) {
            player.respawnTimer = 90;
          }
          state.events.push({
            tick: state.tick,
            type: 'playerDied',
            message: `${player.name} was impaled by spikes!`,
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
      }
      break;

    case '>':
      // Exit portal
      if (state.phase === 'doorOpen' || state.phase === 'exiting') {
        handlePlayerExit(state, player);
      }
      break;
  }
}

export function checkDoorUnlock(state: GameState, player: Player): boolean {
  if (!player.hasKey) return false;
  if (state.door.open) return false;

  // Check if player is adjacent to door
  const dr = Math.abs(player.r - state.door.r);
  const dc = Math.abs(player.c - state.door.c);
  if (dr + dc !== 1) return false;

  // Unlock door
  state.door.open = true;
  state.grid[state.door.r][state.door.c] = ' ';
  player.hasKey = false;
  state.key.heldBy = -1;

  player.score += SCORE_VALUES.doorUnlock;
  player.levelScore += SCORE_VALUES.doorUnlock;

  state.phase = 'doorOpen';
  state.exitTimer = 900; // 30 sec at 30Hz

  state.events.push({
    tick: state.tick,
    type: 'doorOpen',
    message: `${player.name} unlocked the door! Exit is open!`,
    playerId: player.id,
  });

  return true;
}

function handlePlayerExit(state: GameState, player: Player): void {
  if (player.exitOrder >= 0) return; // Already exited

  const exitCount = state.players.filter((p) => p.exitOrder >= 0).length;
  player.exitOrder = exitCount;

  const bonus = SCORE_VALUES.exitOrder[exitCount] ?? 0;
  player.score += bonus;
  player.levelScore += bonus;

  // Survival bonus if 0 deaths this level
  if (player.deaths === 0) {
    player.score += SCORE_VALUES.surviveLevel;
    player.levelScore += SCORE_VALUES.surviveLevel;
  }

  state.events.push({
    tick: state.tick,
    type: 'playerExit',
    message: `${player.name} escaped! (#${exitCount + 1})`,
    playerId: player.id,
  });

  // Check if all alive players have exited
  const alivePlayers = state.players.filter((p) => p.alive && p.connected);
  const allExited = alivePlayers.every((p) => p.exitOrder >= 0);

  if (allExited) {
    state.phase = 'summary';
  }
}

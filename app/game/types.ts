// ── Enums ──

export type TileType = '#' | ' ' | '^' | '>' | 'D' | '=' | 'T' | '?' | '.';
export type MonsterType = 'skeleton' | 'slime' | 'bat' | 'darkKnight';
export type ItemType =
  | 'healthPotion'
  | 'gold'
  | 'shieldOrb'
  | 'speedScroll'
  | 'swordIron'
  | 'swordFire'
  | 'shieldWood'
  | 'shieldIron'
  | 'bow'
  | 'fireballScroll'
  | 'freezeScroll'
  | 'chest';
export type PlayerClass = 'knight' | 'rogue' | 'mage' | 'ranger' | 'bard';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GamePhase =
  | 'lobby'
  | 'playing'
  | 'bossDead'
  | 'doorOpen'
  | 'exiting'
  | 'summary'
  | 'gameOver';
export type MonsterBehavior =
  | 'patrol'
  | 'chase'
  | 'ambush'
  | 'flee'
  | 'erratic'
  | 'boss';
export type InputAction = 'move' | 'attack' | 'wait' | 'useAbility';
export type AbilityType = 'fireball' | 'freeze';

// ── Core State ──

export interface GameState {
  tick: number;
  level: number;
  phase: GamePhase;
  exitTimer: number;
  grid: TileType[][];
  players: Player[];
  monsters: Monster[];
  boss: Boss | null;
  items: GroundItem[];
  key: KeyState;
  door: DoorState;
  telegraphs: Telegraph[];
  hazards: Hazard[];
  projectiles: Projectile[];
  events: GameEvent[];
  torches: Position[];
  visibilityMaps: Map<number, Visibility[][]>;
}

export interface Position {
  r: number;
  c: number;
}

export type Visibility = 'unexplored' | 'explored' | 'visible';

// ── Player ──

export interface Player {
  id: number;
  name: string;
  classType: PlayerClass;
  color: string;
  r: number;
  c: number;
  spawnR: number;
  spawnC: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  facing: Direction;
  alive: boolean;
  respawnTimer: number;
  respawnsLeft: number;
  invulnFrames: number;
  attackCooldown: number;
  hasKey: boolean;
  shield: boolean;
  speedBoost: number;
  weapon: WeaponDef | null;
  shieldEquip: ShieldDef | null;
  abilities: { fireball: number; freeze: number };
  hasFireball: boolean;
  hasFreeze: boolean;
  hasBow: boolean;

  // Scoring
  score: number;
  levelScore: number;
  deaths: number;
  kills: number;
  pvpKills: number;
  bossKills: number;
  exitOrder: number;

  // Multiplayer
  connected: boolean;
  afkTimer: number;
  inputBuffer: BufferedInput[];

  // Render (client-only)
  renderX?: number;
  renderY?: number;
  animFrame?: number;
}

export interface BufferedInput {
  seq: number;
  action: InputAction;
  dir?: { dr: number; dc: number };
  ability?: AbilityType;
}

export interface WeaponDef {
  name: string;
  atkBonus: number;
  range: number;
}

export interface ShieldDef {
  name: string;
  defBonus: number;
}

// ── Monsters ──

export interface Monster {
  id: string;
  type: MonsterType;
  r: number;
  c: number;
  spawnR: number;
  spawnC: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  behavior: MonsterBehavior;
  alertRadius: number;
  targetPlayerId: number | null;
  patrolDir: { dr: number; dc: number };
  moveTimer: number;
  moveInterval: number;
  attackCooldown: number;
  stunTimer: number;
  alive: boolean;
  animFrame: number;
  renderX?: number;
  renderY?: number;
}

export interface Boss extends Monster {
  phase: 1 | 2 | 3;
  lastHitBy: number | null;
  shockwaveCooldown: number;
  enraged: boolean;
}

// ── Items ──

export interface GroundItem {
  id: string;
  type: ItemType;
  r: number;
  c: number;
  collected: boolean;
  value?: number;
}

// ── Key & Door ──

export interface KeyState {
  exists: boolean;
  r: number;
  c: number;
  heldBy: number;
}

export interface DoorState {
  r: number;
  c: number;
  open: boolean;
}

// ── Combat ──

export interface Telegraph {
  id: string;
  sourceId: string;
  tiles: Position[];
  turnsRemaining: number;
  damage: number;
  ignoresDef: boolean;
  type: 'melee' | 'shockwave' | 'acid' | 'divebomb' | 'fire';
}

export interface Hazard {
  id: string;
  tiles: Position[];
  turnsRemaining: number;
  damage: number;
  type: 'acid' | 'fire';
}

export interface Projectile {
  id: string;
  r: number;
  c: number;
  dir: { dr: number; dc: number };
  damage: number;
  range: number;
  ownerId: number;
  type: 'arrow' | 'fireball';
}

// ── Events ──

export interface GameEvent {
  tick: number;
  type:
    | 'kill'
    | 'pvpKill'
    | 'bossKill'
    | 'keyPickup'
    | 'keyDrop'
    | 'doorOpen'
    | 'playerDied'
    | 'playerExit'
    | 'bossPhase'
    | 'itemPickup'
    | 'damage'
    | 'playerHit';
  message: string;
  playerId?: number;
  targetId?: number | string;
}

// ── Scoring ──

export interface ScoreEntry {
  playerId: number;
  name: string;
  classType: PlayerClass;
  color: string;
  totalScore: number;
  totalTime: number;
  totalDeaths: number;
  totalKills: number;
  totalPvpKills: number;
  bossKills: number;
  perLevel: {
    level: number;
    score: number;
    exitOrder: number;
    deaths: number;
  }[];
}

export interface Highlight {
  title: string;
  playerId: number;
  value: string;
}

// ── Level Config ──

export interface LevelConfig {
  name: string;
  subtitle: string;
  map: string[];
  fogOfWar: boolean;
  visionRadius: number;
  monsterSpeed: number;
  bossType: MonsterType | null;
  bossHpBase: number;
  monsterCountBase: number;
}

// ── Network Messages ──

export type ClientMessage =
  | { type: 'join'; name: string; classType: PlayerClass; color: string }
  | { type: 'ready' }
  | { type: 'start' }
  | {
      type: 'input';
      seq: number;
      action: InputAction;
      dir?: { dr: number; dc: number };
      ability?: AbilityType;
    }
  | { type: 'reconnect'; playerId: number }
  | { type: 'ping'; t: number };

export type ServerMessage =
  | {
      type: 'lobby';
      roomCode: string;
      players: LobbyPlayer[];
      hostId: number;
    }
  | { type: 'gameStart'; level: number; state: GameState }
  | {
      type: 'state';
      tick: number;
      players: Player[];
      monsters: Monster[];
      boss: Boss | null;
      items: GroundItem[];
      key: KeyState;
      door: DoorState;
      telegraphs: Telegraph[];
      hazards: Hazard[];
      events: GameEvent[];
    }
  | { type: 'levelSummary'; level: number; scores: ScoreEntry[]; mvp: number }
  | { type: 'gameOver'; rankings: ScoreEntry[]; highlights: Highlight[] }
  | { type: 'error'; message: string }
  | { type: 'pong'; t: number; serverT: number };

export interface LobbyPlayer {
  id: number;
  name: string;
  classType: PlayerClass;
  color: string;
  ready: boolean;
  isHost: boolean;
}

// ── Class Stats ──

export interface ClassStats {
  maxHp: number;
  atk: number;
  def: number;
  description: string;
}

export const CLASS_STATS: Record<PlayerClass, ClassStats> = {
  knight: { maxHp: 12, atk: 3, def: 2, description: 'High defense, balanced' },
  rogue: { maxHp: 8, atk: 4, def: 0, description: 'Fast, high damage' },
  mage: { maxHp: 7, atk: 2, def: 0, description: 'Ranged abilities' },
  ranger: { maxHp: 9, atk: 3, def: 1, description: 'Bow attacks' },
  bard: { maxHp: 10, atk: 2, def: 1, description: 'Support & gold bonus' },
};

export const PLAYER_COLORS: Record<PlayerClass, string> = {
  knight: '#FF4444',
  rogue: '#4488FF',
  mage: '#AA44FF',
  ranger: '#44CC44',
  bard: '#FFAA00',
};

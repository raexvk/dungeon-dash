// ── Procedural Pixel-Art Sprite Generation ──

import type { ItemType, PlayerClass, Direction } from '../game/types';

// ── Color Palette ──

export const PALETTE = {
  // Environment base
  voidBlack: '#0A0A0F',
  deepStone: '#1A1A2E',
  stoneDark: '#2D2D3F',
  stoneMid: '#3D3D52',
  stoneLight: '#4D4D65',
  stoneAccent: '#5A5A70',
  floorDark: '#1E1E2A',
  floorMid: '#252535',
  floorLight: '#2C2C40',

  // Player classes
  knightRed: '#FF4444',
  rogueBlue: '#4488FF',
  magePurple: '#AA44FF',
  rangerGreen: '#44CC44',
  bardGold: '#FFAA00',

  // Character
  skin: '#FFDAB9',
  hair: '#5C3A1E',

  // Monster
  boneWhite: '#E8DCC8',
  boneShadow: '#B0A090',
  slimeGreen: '#44CC44',
  slimeDark: '#228822',
  batPurple: '#8844AA',
  bossArmor: '#333340',
  bossEyes: '#FF2222',

  // Items
  potionRed: '#CC3333',
  keyGold: '#FFD700',
  steel: '#C0C0C0',

  // Effects
  torchOrange: '#FF8830',
  torchYellow: '#FFDD44',
  portalCyan: '#00DDFF',
} as const;

// ── Sprite Cache Interface ──

export interface SpriteCache {
  floor: HTMLCanvasElement[];
  wall: HTMLCanvasElement[];
  trap: HTMLCanvasElement;
  exit: HTMLCanvasElement[];
  door: HTMLCanvasElement;
  doorOpen: HTMLCanvasElement;
  torch: HTMLCanvasElement[];
  key: HTMLCanvasElement;
  players: Record<string, HTMLCanvasElement[]>;
  monsters: Record<string, HTMLCanvasElement[]>;
  items: Record<string, HTMLCanvasElement>;
}

// ── Core Sprite Renderer ──

export function createSprite(
  grid: string[],
  colorMap: Record<string, string>,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < 16; y++) {
    const row = grid[y] ?? '';
    for (let x = 0; x < 16; x++) {
      const ch = row[x] ?? '.';
      if (ch === '.') continue;
      const color = colorMap[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * 2, y * 2, 2, 2);
    }
  }

  return canvas;
}

// ── Helper: class color ──

function classColor(cls: PlayerClass): string {
  switch (cls) {
    case 'knight':
      return PALETTE.knightRed;
    case 'rogue':
      return PALETTE.rogueBlue;
    case 'mage':
      return PALETTE.magePurple;
    case 'ranger':
      return PALETTE.rangerGreen;
    case 'bard':
      return PALETTE.bardGold;
  }
}

// ── Build All Sprites ──

export function buildSpriteCache(): SpriteCache {
  // ═══════════════════════════════════════════
  // FLOOR TILES (3 variants)
  // ═══════════════════════════════════════════

  const floorColors: Record<string, string> = {
    D: PALETTE.floorDark,
    M: PALETTE.floorMid,
    L: PALETTE.floorLight,
    V: PALETTE.voidBlack,
  };

  const floor0 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDMDDDDDDDDDDMDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'MMMMMMMMMMMMMMMM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDMDDDDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    floorColors,
  );

  const floor1 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDMDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDLDDDDDDDDDDL',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'MMMMMMMDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DLDDDDDDDDDDLDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    floorColors,
  );

  const floor2 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDVVDDDDDDDDD',
      'DDDDDDVDDDDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDVDDDD',
      'DDDDDDDDDDDDVDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    floorColors,
  );

  // ═══════════════════════════════════════════
  // WALL TILES (4 variants)
  // ═══════════════════════════════════════════

  const wallColors: Record<string, string> = {
    L: PALETTE.stoneLight,
    M: PALETTE.stoneMid,
    D: PALETTE.stoneDark,
    S: PALETTE.deepStone,
    A: PALETTE.stoneAccent,
    V: PALETTE.voidBlack,
  };

  const wall0 = createSprite(
    [
      'LLLLLLLLLLLLLLLL',
      'LMMMMMMMLMMMMMLS',
      'LMMMMMMMLMMMMMLS',
      'LMMMMMMMLMMMMMLS',
      'LLLLLLLLLLLLLLLL',
      'DDDDDDDDDDDDDDDD',
      'DMMMDDDDDDDMMMDS',
      'DMMMDDDDDDDMMMDS',
      'DMMMDDDDDDDMMMDS',
      'DMMMDDDDDDDMMMDS',
      'DMMMDDDDDDDMMMDS',
      'DDDDDDDDDDDDDDDD',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'SSSSSSSSSSSSSSSS',
    ],
    wallColors,
  );

  const wall1 = createSprite(
    [
      'LLLLLLLLLLLLLLLL',
      'LMMMMLMMMMMMMML.',
      'LMMMMLMMMMMMMML.',
      'LMMMMLMMMMMMMML.',
      'LLLLLLLLLLLLLLLL',
      'DDDDDDDDDDDDDDDD',
      'DDDDDMMMMDDDDDD.',
      'DDDDDMMMMDDDDDD.',
      'DDDDDMMMMDDDDDD.',
      'DDDDDMMMMDDDDDD.',
      'DDDDDDDDDDDVDDD.',
      'DDDDDDDDDDDVDDDS',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'SSSSSSSSSSSSSSSS',
    ],
    wallColors,
  );

  const wall2 = createSprite(
    [
      'LLLLLLLLLLLLLLLL',
      'LMMMMMMMMMMMMMLS',
      'LMMMMMMMMMMMMMLS',
      'LMMMMMMMMMMMMMLS',
      'LLLLLLLLLLLLLLLL',
      'DDDDDDDDDDDDDDDD',
      'DMMMDDDDDDMMMDDS',
      'DMMMDDDDDDMMMDDS',
      'DMMMDDADDDMMMDDS',
      'DMMMDDDDDDMMMDDS',
      'DMMMDDDDDDMMMDDS',
      'DDDDDDDDDDDDDDDD',
      'DSSSSSSSSSSSSSD.',
      'DSSSSASSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'SSSSSSSSSSSSSSSS',
    ],
    wallColors,
  );

  const wall3 = createSprite(
    [
      'LLLLLLLLLLLLLLLL',
      'LMMMLMMMMMMMLMLS',
      'LMMMLMMMMMMMLMLS',
      'LMMMLMMMMMMMLMLS',
      'LLLLLLLLLLLLLLLL',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDMMMMMDDD.',
      'DDDDDDDMMMMMDDD.',
      'DDVDDDDMMMMMDDD.',
      'DDDDDDDMMMMMDDD.',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'DSSSSSSSSSSSSSD.',
      'SSSSSSSSSSSSSSSS',
    ],
    wallColors,
  );

  // ═══════════════════════════════════════════
  // TRAP (spike floor)
  // ═══════════════════════════════════════════

  const trapColors: Record<string, string> = {
    D: PALETTE.floorDark,
    M: PALETTE.floorMid,
    S: PALETTE.steel,
    R: PALETTE.potionRed,
    V: PALETTE.voidBlack,
  };

  const trap = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDSDDSDDSDDDDM',
      'DDDDSDDSDDSDDDDD',
      'DDDDSDDSDDSDDDDM',
      'DDDSSDSSSDSSDDDM',
      'DDDSSSSSSSSSDDDD',
      'DDDRSDRSSDRSDDDM',
      'DDDDSDDSDDSDDDDD',
      'DDDDSDDSDDSDDDDM',
      'DDDDSDDSDDSDDDDD',
      'DDDSSDSSSDSSDDDM',
      'DDDSSSSSSSSSDDDD',
      'DDDRSDRSSDRSDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    trapColors,
  );

  // ═══════════════════════════════════════════
  // EXIT PORTAL (4 animation frames)
  // ═══════════════════════════════════════════

  const exitColors: Record<string, string> = {
    D: PALETTE.floorDark,
    C: PALETTE.portalCyan,
    W: '#FFFFFF',
    B: '#006688',
    V: PALETTE.voidBlack,
  };

  const exit0 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDCCCCCDDDDDM',
      'DDDDCCWWWCCDDDDD',
      'DDDCCCWWWCCCDDDM',
      'DDDCCBBBBBCCDDDM',
      'DDCCBBBVBBBBCCDM',
      'DDCCBBVVVBBCCDDD',
      'DDCCBBVVVBBCCDDD',
      'DDCCBBBVBBBBCCDM',
      'DDDCCBBBBBCCDDDM',
      'DDDCCCWWWCCCDDDM',
      'DDDDCCWWWCCDDDDD',
      'DDDDDCCCCCDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    exitColors,
  );

  const exit1 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDCCCDDDDDDM',
      'DDDDDCCCCCDDDDDD',
      'DDDDCCWWWCCDDDDM',
      'DDDCCWWBWWCCDDDM',
      'DDCCBBVVVBBCCDDD',
      'DDCBBVVVVVBBCDDD',
      'DDCBBVVVVVBBCDDD',
      'DDCCBBVVVBBCCDDD',
      'DDDCCWWBWWCCDDDM',
      'DDDDCCWWWCCDDDDM',
      'DDDDDCCCCCDDDDDD',
      'DDDDDDCCCDDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    exitColors,
  );

  const exit2 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDCCDDDDDDDD',
      'DDDDDCCCCDDDDDDM',
      'DDDDCCCCCCDDDDDD',
      'DDDCCWWWWCCDDDDD',
      'DDCCWWBBWWCCDDDM',
      'DDCBBVVVVBBCDDDD',
      'DDCBBVVVVBBCDDDD',
      'DDCCWWBBWWCCDDDM',
      'DDDCCWWWWCCDDDDD',
      'DDDDCCCCCCDDDDDD',
      'DDDDDCCCCDDDDDDM',
      'DDDDDDCCDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    exitColors,
  );

  const exit3 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDCCCDDDDDDM',
      'DDDDDCCCCCDDDDDD',
      'DDDDCCBBBCCDDDDM',
      'DDDCBBVVVBBCDDDM',
      'DDCCBVVVVVBCCDDD',
      'DDCWWVVVVVWWCDDD',
      'DDCWWVVVVVWWCDDD',
      'DDCCBVVVVVBCCDDD',
      'DDDCBBVVVBBCDDDM',
      'DDDDCCBBBCCDDDDM',
      'DDDDDCCCCCDDDDDD',
      'DDDDDDCCCDDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    exitColors,
  );

  // ═══════════════════════════════════════════
  // DOOR (closed)
  // ═══════════════════════════════════════════

  const doorColors: Record<string, string> = {
    B: '#5C3A1E',
    P: '#7A5030',
    I: '#888899',
    G: PALETTE.keyGold,
    D: PALETTE.stoneDark,
    S: PALETTE.deepStone,
    V: PALETTE.voidBlack,
  };

  const door = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DIIIIIIIIIIIIIID',
      'DIPPPPPPPPPPPPID',
      'DIPPPPPPPPPPPPID',
      'DIIIIIIIIIIIIIID',
      'DIPPPPPPPPPPBID.',
      'DIPPPPPPPPPPBID.',
      'DIPPPPPGGPPPPID.',
      'DIPPPPGVGPPPPID.',
      'DIPPPPPGGPPPPID.',
      'DIPPPPPPPPPPBID.',
      'DIPPPPPPPPPPBID.',
      'DIIIIIIIIIIIIIID',
      'DIPPPPPPPPPPPPID',
      'DIPPPPPPPPPPPPID',
      'DDDDDDDDDDDDDDDD',
    ],
    doorColors,
  );

  // ═══════════════════════════════════════════
  // DOOR (open)
  // ═══════════════════════════════════════════

  const doorOpenColors: Record<string, string> = {
    B: '#5C3A1E',
    P: '#7A5030',
    I: '#888899',
    D: PALETTE.floorDark,
    M: PALETTE.floorMid,
    V: PALETTE.voidBlack,
  };

  const doorOpen = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDMMDDDDDIBD',
      'BIDDDDMMDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'BIDDDDDDDDDDDIBD',
      'DDDDDDDDDDDDDDDD',
    ],
    doorOpenColors,
  );

  // ═══════════════════════════════════════════
  // TORCH (3 animation frames)
  // ═══════════════════════════════════════════

  const torchColors: Record<string, string> = {
    D: PALETTE.floorDark,
    B: '#5C3A1E',
    O: PALETTE.torchOrange,
    Y: PALETTE.torchYellow,
    R: PALETTE.potionRed,
    W: '#FFFFFF',
  };

  const torch0 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDWDDDDDDDD',
      'DDDDDDYWYDDDDDDD',
      'DDDDDYYYDDDDDDDD',
      'DDDDDDOYODDDDDDM',
      'DDDDDOOYOODDDDDM',
      'DDDDDOOROODDDDDM',
      'DDDDDDOOODDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDDDDDDDDDM',
      'DDDDDDDDDDDDDDDD',
    ],
    torchColors,
  );

  const torch1 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDWDDDDDDDDD',
      'DDDDDYWYDDDDDDDM',
      'DDDDDYYYDDDDDDDD',
      'DDDDDOYODDDDDDDD',
      'DDDDOOYOOODDDDDM',
      'DDDDDRROOODDDDDM',
      'DDDDDDOOODDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDDDDDDDDDM',
      'DDDDDDDDDDDDDDDD',
    ],
    torchColors,
  );

  const torch2 = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDWDDDDDD',
      'DDDDDDDDYWDDDDDD',
      'DDDDDDDYYYDDDDDD',
      'DDDDDDDOYODDDDDD',
      'DDDDDDOOYODDDDDD',
      'DDDDDOOROODDDDDM',
      'DDDDDDDOOODDDDDM',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDBBDDDDDDD',
      'DDDDDDDBDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    torchColors,
  );

  // ═══════════════════════════════════════════
  // KEY
  // ═══════════════════════════════════════════

  const keyColors: Record<string, string> = {
    G: PALETTE.keyGold,
    Y: '#CCAA00',
    D: PALETTE.floorDark,
  };

  const key = createSprite(
    [
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
      'DDDDDGGGDDDDDDDM',
      'DDDDGGDGGDDDDDDM',
      'DDDDGDDDGDDDDDDM',
      'DDDDGGDGGDDDDDDM',
      'DDDDDGGGDDDDDDDM',
      'DDDDDDGDDDDDDDDM',
      'DDDDDDGDDDDDDDDM',
      'DDDDDDGGDDDDDDDM',
      'DDDDDDGDDDDDDDDM',
      'DDDDDDGDDDDDDDDM',
      'DDDDDDGGDDDDDDDM',
      'DDDDDDGDDDDDDDDM',
      'DDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDD',
    ],
    keyColors,
  );

  // ═══════════════════════════════════════════
  // PLAYER SPRITES
  // ═══════════════════════════════════════════

  const playerClasses: PlayerClass[] = ['knight', 'rogue', 'mage', 'ranger', 'bard'];
  const directions: Direction[] = ['down', 'up', 'left', 'right'];
  const players: Record<string, HTMLCanvasElement[]> = {};

  for (const cls of playerClasses) {
    const C = classColor(cls);
    const S = PALETTE.skin;
    const H = PALETTE.hair;
    const K = PALETTE.voidBlack;
    const W = '#FFFFFF';
    const ST = PALETTE.steel;

    // Player color map (shared keys across all directions/frames)
    const pColors: Record<string, string> = {
      C, // class armor color
      S, // skin
      H, // hair
      K, // black outline/eyes
      W, // eye whites
      T: ST, // steel (weapon)
      D: PALETTE.floorDark, // not drawn (used as empty)
      X: PALETTE.deepStone, // shadow
      B: '#5C3A1E', // boots
    };

    // ── DOWN-FACING ──

    const downFrame0: string[] = [
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HSSHSH.....',
      '.....SWKWKS.....',
      '.....SSSSSS.....',
      '......SKKS......',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '.....CSSSCC.....',
      '......SSSS......',
      '......SS.SS.....',
      '......BB.BB.....',
      '......BB.BB.....',
    ];

    const downFrame1: string[] = [
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HSSHSH.....',
      '.....SWKWKS.....',
      '.....SSSSSS.....',
      '......SKKS......',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '.....CSSSCC.....',
      '......SSSS......',
      '.....SS..SS.....',
      '.....BB..BB.....',
      '.....BB..BB.....',
    ];

    // ── UP-FACING ──

    const upFrame0: string[] = [
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '......HSSH......',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '......SSSS......',
      '......SS.SS.....',
      '......BB.BB.....',
      '......BB.BB.....',
    ];

    const upFrame1: string[] = [
      '......HHHH......',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '.....HHHHHH.....',
      '......HSSH......',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '....CCCCCCCC....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '.....CCCCCC.....',
      '......SSSS......',
      '.....SS..SS.....',
      '.....BB..BB.....',
      '.....BB..BB.....',
    ];

    // ── LEFT-FACING ──

    const leftFrame0: string[] = [
      '.....HHHH.......',
      '....HHHHHH......',
      '....HSHHHH......',
      '....SKWSSS......',
      '....SSSSSS......',
      '.....SKKS.......',
      '...TCCCCCC......',
      '...TCCCCCC......',
      '....CCCCCC......',
      '....CCCCC.......',
      '....CCCCC.......',
      '....CSSCC.......',
      '.....SSSS.......',
      '.....SS.SS......',
      '.....BB.BB......',
      '.....BB.BB......',
    ];

    const leftFrame1: string[] = [
      '.....HHHH.......',
      '....HHHHHH......',
      '....HSHHHH......',
      '....SKWSSS......',
      '....SSSSSS......',
      '.....SKKS.......',
      '...TCCCCCC......',
      '...TCCCCCC......',
      '....CCCCCC......',
      '....CCCCC.......',
      '....CCCCC.......',
      '....CSSCC.......',
      '.....SSSS.......',
      '....SS..SS......',
      '....BB..BB......',
      '....BB..BB......',
    ];

    // ── RIGHT-FACING ──

    const rightFrame0: string[] = [
      '.......HHHH.....',
      '......HHHHHH....',
      '......HHHHSH....',
      '......SSSWKS....',
      '......SSSSSS....',
      '.......SKKS.....',
      '......CCCCCCT...',
      '......CCCCCCT...',
      '......CCCCCC....',
      '.......CCCCC....',
      '.......CCCCC....',
      '.......CCSSC....',
      '.......SSSS.....',
      '......SS.SS.....',
      '......BB.BB.....',
      '......BB.BB.....',
    ];

    const rightFrame1: string[] = [
      '.......HHHH.....',
      '......HHHHHH....',
      '......HHHHSH....',
      '......SSSWKS....',
      '......SSSSSS....',
      '.......SKKS.....',
      '......CCCCCCT...',
      '......CCCCCCT...',
      '......CCCCCC....',
      '.......CCCCC....',
      '.......CCCCC....',
      '.......CCSSC....',
      '.......SSSS.....',
      '......SS..SS....',
      '......BB..BB....',
      '......BB..BB....',
    ];

    const dirGrids: Record<Direction, string[][]> = {
      down: [downFrame0, downFrame1],
      up: [upFrame0, upFrame1],
      left: [leftFrame0, leftFrame1],
      right: [rightFrame0, rightFrame1],
    };

    for (const dir of directions) {
      const frames = dirGrids[dir];
      const spriteFrames: HTMLCanvasElement[] = [];
      for (let f = 0; f < frames.length; f++) {
        spriteFrames.push(createSprite(frames[f], pColors));
      }
      const k = `${cls}-${dir}`;
      players[k] = spriteFrames;
    }
  }

  // ═══════════════════════════════════════════
  // SKELETON (8 sprites: 4 dirs x 2 frames)
  // ═══════════════════════════════════════════

  const skelColors: Record<string, string> = {
    W: PALETTE.boneWhite,
    B: PALETTE.boneShadow,
    K: PALETTE.voidBlack,
    R: PALETTE.bossEyes,
    T: PALETTE.steel,
  };

  // Skeleton down frame 0
  const skelDown0: string[] = [
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WBBWBW.....',
    '.....WRKWRK.....',
    '.....WWWWWW.....',
    '......WKKW......',
    '.....WWWWWW.....',
    '.....WBWWBW.....',
    '....TWWWWWW.....',
    '....T.WWWW......',
    '.....WWWWWW.....',
    '......WBBW......',
    '......WW.WW.....',
    '......WW.WW.....',
    '......WW.WW.....',
    '......BB.BB.....',
  ];

  const skelDown1: string[] = [
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WBBWBW.....',
    '.....WRKWRK.....',
    '.....WWWWWW.....',
    '......WKKW......',
    '.....WWWWWW.....',
    '.....WBWWBW.....',
    '....TWWWWWW.....',
    '....T.WWWW......',
    '.....WWWWWW.....',
    '......WBBW......',
    '.....WW..WW.....',
    '.....WW..WW.....',
    '.....WW..WW.....',
    '.....BB..BB.....',
  ];

  // Skeleton up frame 0
  const skelUp0: string[] = [
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WBWWBW.....',
    '.....WWWWWWT....',
    '......WWWWT.....',
    '.....WWWWWW.....',
    '......WBBW......',
    '......WW.WW.....',
    '......WW.WW.....',
    '......WW.WW.....',
    '......BB.BB.....',
  ];

  const skelUp1: string[] = [
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '.....WWWWWW.....',
    '......WWWW......',
    '.....WWWWWW.....',
    '.....WBWWBW.....',
    '.....WWWWWWT....',
    '......WWWWT.....',
    '.....WWWWWW.....',
    '......WBBW......',
    '.....WW..WW.....',
    '.....WW..WW.....',
    '.....WW..WW.....',
    '.....BB..BB.....',
  ];

  // Skeleton left frame 0
  const skelLeft0: string[] = [
    '.....WWWW.......',
    '....WWWWWW......',
    '....WBWWWW......',
    '....RKWWWW......',
    '....WWWWWW......',
    '.....WKKW.......',
    '....WWWWWW......',
    '...TWBWWBW......',
    '...TWWWWWW......',
    '....WWWWW.......',
    '....WWWWW.......',
    '.....WBBW.......',
    '.....WW.WW......',
    '.....WW.WW......',
    '.....WW.WW......',
    '.....BB.BB......',
  ];

  const skelLeft1: string[] = [
    '.....WWWW.......',
    '....WWWWWW......',
    '....WBWWWW......',
    '....RKWWWW......',
    '....WWWWWW......',
    '.....WKKW.......',
    '....WWWWWW......',
    '...TWBWWBW......',
    '...TWWWWWW......',
    '....WWWWW.......',
    '....WWWWW.......',
    '.....WBBW.......',
    '....WW..WW......',
    '....WW..WW......',
    '....WW..WW......',
    '....BB..BB......',
  ];

  // Skeleton right frame 0
  const skelRight0: string[] = [
    '.......WWWW.....',
    '......WWWWWW....',
    '......WWWWBW....',
    '......WWWWKR....',
    '......WWWWWW....',
    '.......WKKW.....',
    '......WWWWWW....',
    '......WBWWBWT...',
    '......WWWWWWT...',
    '.......WWWWW....',
    '.......WWWWW....',
    '.......WBBW.....',
    '......WW.WW.....',
    '......WW.WW.....',
    '......WW.WW.....',
    '......BB.BB.....',
  ];

  const skelRight1: string[] = [
    '.......WWWW.....',
    '......WWWWWW....',
    '......WWWWBW....',
    '......WWWWKR....',
    '......WWWWWW....',
    '.......WKKW.....',
    '......WWWWWW....',
    '......WBWWBWT...',
    '......WWWWWWT...',
    '.......WWWWW....',
    '.......WWWWW....',
    '.......WBBW.....',
    '......WW..WW....',
    '......WW..WW....',
    '......WW..WW....',
    '......BB..BB....',
  ];

  const skeleton: HTMLCanvasElement[] = [
    createSprite(skelDown0, skelColors),
    createSprite(skelDown1, skelColors),
    createSprite(skelUp0, skelColors),
    createSprite(skelUp1, skelColors),
    createSprite(skelLeft0, skelColors),
    createSprite(skelLeft1, skelColors),
    createSprite(skelRight0, skelColors),
    createSprite(skelRight1, skelColors),
  ];

  // ═══════════════════════════════════════════
  // SLIME (2 squish frames)
  // ═══════════════════════════════════════════

  const slimeColors: Record<string, string> = {
    G: PALETTE.slimeGreen,
    D: PALETTE.slimeDark,
    K: PALETTE.voidBlack,
    W: '#FFFFFF',
    L: '#66EE66',
  };

  const slime0 = createSprite(
    [
      '................',
      '................',
      '................',
      '.....GGGGG......',
      '....GGGGGGG.....',
      '...GGGGGGGGGG...',
      '...GLGGGGLGGG...',
      '...GWKGGGWKGG...',
      '...GKKGGGGKGG...',
      '...GGGGGGGGGG...',
      '....GGGGGGGG....',
      '....GDGDDGDG....',
      '.....DDDDDD.....',
      '......DDDD......',
      '................',
      '................',
    ],
    slimeColors,
  );

  const slime1 = createSprite(
    [
      '................',
      '................',
      '................',
      '................',
      '................',
      '....GGGGGGGG....',
      '...GGGGGGGGGG...',
      '..GGLGGGGLGGGG..',
      '..GGWKGGGWKGGG..',
      '..GGKKGGGGKGGG..',
      '..GGGGGGGGGGGG..',
      '..GGGDGDDGDGGG..',
      '...DDDDDDDDDD...',
      '....DDDDDDDD....',
      '................',
      '................',
    ],
    slimeColors,
  );

  // ═══════════════════════════════════════════
  // BAT (2 wing-flap frames)
  // ═══════════════════════════════════════════

  const batColors: Record<string, string> = {
    P: PALETTE.batPurple,
    D: '#663388',
    K: PALETTE.voidBlack,
    R: PALETTE.bossEyes,
    W: '#FFFFFF',
  };

  const bat0 = createSprite(
    [
      '................',
      '................',
      'P..............P',
      'PP............PP',
      'PPP..........PPP',
      'PPPP..PPPP..PPPP',
      '.PPPPPPPPPPPPPP.',
      '..PPPPRKKPPPPP..',
      '..PPPPWRRWPPPP..',
      '...PPPPPPPPPP...',
      '....PPPDPPPP....',
      '.....PPPPPP.....',
      '......DPPP......',
      '.......PP.......',
      '................',
      '................',
    ],
    batColors,
  );

  const bat1 = createSprite(
    [
      '................',
      '................',
      '................',
      '................',
      '.PP..........PP.',
      '.PPP..PPPP..PPP.',
      '..PPPPPPPPPPPP..',
      '..PPPPRKKPPPPP..',
      '..PPPPWRRWPPPP..',
      '..PPPPPPPPPPPP..',
      '.PPP.PPPDPPPPPP.',
      '.PP...PPPPPP.PP.',
      '......DPPP......',
      '.......PP.......',
      '................',
      '................',
    ],
    batColors,
  );

  // ═══════════════════════════════════════════
  // BOSS - DARK KNIGHT (3 phase variants)
  // ═══════════════════════════════════════════

  const bossColors: Record<string, string> = {
    A: PALETTE.bossArmor,
    K: PALETTE.voidBlack,
    R: PALETTE.bossEyes,
    S: PALETTE.steel,
    G: '#666677',
    D: PALETTE.deepStone,
    W: '#FFFFFF',
    V: '#443355',
  };

  // Phase 1 - calm dark knight
  const boss0 = createSprite(
    [
      '..S..AAAA..S....',
      '.SS.AAAAAA.SS...',
      '.SSAAAAAAAA.S...',
      '...AAAAAAAAAA...',
      '...AKKRRKKAA....',
      '...AGGRRGGA.....',
      '...AAAKKAAAA....',
      '...AAASSAAAA....',
      '..SAAAAAAAAAS...',
      '..SAAAAAAAAAS...',
      '..SAAAAAAAAAS...',
      '...AAAAAAAA.....',
      '...AASSSSAA.....',
      '....AS..SA......',
      '....AS..SA......',
      '....SS..SS......',
    ],
    bossColors,
  );

  // Phase 2 - red glow intensifies, cracks appear
  const bossColors2: Record<string, string> = {
    ...bossColors,
    R: '#FF4444',
    V: '#552233',
    F: '#FF2222',
  };

  const boss1 = createSprite(
    [
      '..S..AAAA..S....',
      '.SS.AAAAAA.SS...',
      '.SSAAAAAAAA.S...',
      '..FAAAAAAAAF....',
      '...ARRRRRRAA....',
      '...AGGRRGGA.....',
      '...AAARKAAAA....',
      '...AAASSAAAA....',
      '..SAAAAAAAAAS...',
      '..SAAAFAAAAS....',
      '..SAAAAAAFAAS...',
      '...AAAAAAAA.....',
      '...AASSSSAA.....',
      '....AS..SA......',
      '....AS..SA......',
      '....SS..SS......',
    ],
    bossColors2,
  );

  // Phase 3 - enraged, fire aura
  const bossColors3: Record<string, string> = {
    ...bossColors,
    R: '#FF0000',
    F: '#FF4400',
    Y: PALETTE.torchYellow,
    O: PALETTE.torchOrange,
  };

  const boss2 = createSprite(
    [
      'F.S..AAAA..S..F.',
      'FSSYAAAAAAYSSFFF',
      '.SSAAAAAAAA.S...',
      '.OFAAAAAAAAFOO..',
      '...ARRRRRRAA....',
      '..OAGGRRGGA.....',
      '...AAARKAAAA....',
      '..OAAASSAAAA.O..',
      '..SAAAAAAAAAS...',
      '..SAFAAAFAAAS...',
      '..SAAFAAAFAAS...',
      '.O.AAAAAAAA..O..',
      '...AASSSSAA.....',
      '..O.AS..SA.O....',
      '....AS..SA......',
      '....SS..SS......',
    ],
    bossColors3,
  );

  // ═══════════════════════════════════════════
  // ITEMS
  // ═══════════════════════════════════════════

  const items: Record<string, HTMLCanvasElement> = {};

  // ── Health Potion ──

  const potionColors: Record<string, string> = {
    G: '#AABBCC',
    R: PALETTE.potionRed,
    D: '#991111',
    W: '#FFFFFF',
    K: PALETTE.voidBlack,
  };

  items['healthPotion'] = createSprite(
      [
        '................',
        '................',
        '......GG........',
        '.....GWWG.......',
        '......GG........',
        '.....GGGG.......',
        '....GRRRRG......',
        '...GRRRRRRG.....',
        '...GRRWRRRG.....',
        '...GRRWRRRG.....',
        '...GRRRRRRG.....',
        '...GRRDRRGG.....',
        '...GRRDDRRG.....',
        '....GRRRRG......',
        '.....GGGG.......',
        '................',
      ],
      potionColors,
    );

  // ── Gold ──

  const goldColors: Record<string, string> = {
    G: PALETTE.keyGold,
    Y: '#CCAA00',
    W: '#FFEE88',
    D: '#DAA520',
    H: '#FFF5CC',
    S: '#997700',
  };

  items['gold'] = createSprite(
      [
        '................',
        '.....GGGGGG.....',
        '...GGWWHHDGG....',
        '..GWWHHHHHDGG...',
        '..GWHH..HHDGG..',
        '..GWH.GG.HDGG..',
        '..GWH.GGDHDGG..',
        '..GWHHGGDHDGG...',
        '..GWHHHHDHDGG...',
        '..GWHHHHDDGGG...',
        '..GGWHHDDSGGG...',
        '...GGDDDSSGGG...',
        '....GGSSSGG.....',
        '.....GGGGGG.....',
        '................',
        '................',
      ],
      goldColors,
    );

  // ── Shield Orb ──

  const shieldOrbColors: Record<string, string> = {
    B: '#44DDFF',
    L: '#66EEFF',
    D: '#2288AA',
    W: '#FFFFFF',
    K: '#115566',
    C: '#33BBDD',
  };

  items['shieldOrb'] = createSprite(
      [
        '................',
        '.....BBBBBB.....',
        '....BLLLLLLB....',
        '...BLWWWWWLLB...',
        '...BLWWCCWLLB...',
        '..BLWWCCCWWLB...',
        '..BLWCCCCCWLB...',
        '..BBCCCCCCCLB...',
        '..BBCCCCCCCBB...',
        '..BBBCCCCCBBB...',
        '...BBBCCCBBB....',
        '...BBBBCBBDB....',
        '....BBBBBDB.....',
        '.....BKKBB......',
        '......BBB.......',
        '................',
      ],
      shieldOrbColors,
    );

  // ── Speed Scroll ──

  const scrollColors: Record<string, string> = {
    P: '#EEDDCC',
    B: '#CCBB99',
    T: '#887755',
    K: '#443322',
    R: '#DD6633',
  };

  items['speedScroll'] = createSprite(
      [
        '................',
        '................',
        '....BBBBBB......',
        '...BPPPPPBB.....',
        '...BPKKKPPB.....',
        '...BPPPPPPB.....',
        '...BPKKKPPB.....',
        '...BPPPPPPB.....',
        '...BPKKKPPB.....',
        '...BPPPPPPB.....',
        '...BPPPPPBB.....',
        '...BPPPPPPB.....',
        '...BPPPPPPB.....',
        '....BBBBBB......',
        '................',
        '................',
      ],
      scrollColors,
    );

  // ── Iron Sword ──

  const swordColors: Record<string, string> = {
    S: PALETTE.steel,
    G: '#888888',
    B: '#5C3A1E',
    W: '#FFFFFF',
    D: '#999999',
  };

  items['swordIron'] = createSprite(
      [
        '................',
        '..............W.',
        '.............SW.',
        '............SS..',
        '...........SS...',
        '..........SS....',
        '.........SS.....',
        '........SS......',
        '...B...SS.......',
        '....BSS.........',
        '.....BS.........',
        '....BGGG........',
        '...B............',
        '................',
        '................',
        '................',
      ],
      swordColors,
    );

  // ── Fire Sword ──

  const fireSwordColors: Record<string, string> = {
    S: PALETTE.steel,
    F: PALETTE.torchOrange,
    Y: PALETTE.torchYellow,
    B: '#5C3A1E',
    G: '#888888',
    R: PALETTE.potionRed,
  };

  items['swordFire'] = createSprite(
      [
        '..............Y.',
        '.............FYR',
        '............FRF.',
        '...........SFS..',
        '..........SS....',
        '.........SS.....',
        '........SS......',
        '...B...SS.......',
        '....BSS.........',
        '.....BS.........',
        '....BGGG........',
        '...B............',
        '................',
        '................',
        '................',
        '................',
      ],
      fireSwordColors,
    );

  // ── Wood Shield ──

  const woodShieldColors: Record<string, string> = {
    W: '#7A5030',
    B: '#5C3A1E',
    I: '#888899',
    D: '#4A3020',
  };

  items['shieldWood'] = createSprite(
      [
        '................',
        '................',
        '....WWWWWWW.....',
        '...WWWIWWWWW....',
        '...WWWIWWWWW....',
        '...WWWIWWWWW....',
        '...WIIIIIIW.....',
        '...WWWIWWWWW....',
        '...WWWIWWWWW....',
        '...WWWIWWWWW....',
        '....WWIWWWW.....',
        '.....WWWWW......',
        '......DDD.......',
        '................',
        '................',
        '................',
      ],
      woodShieldColors,
    );

  // ── Iron Shield ──

  const ironShieldColors: Record<string, string> = {
    S: PALETTE.steel,
    G: '#888888',
    D: '#666666',
    B: '#AAAAAA',
    W: '#FFFFFF',
    Y: PALETTE.keyGold,
  };

  items['shieldIron'] = createSprite(
      [
        '................',
        '................',
        '....SSSSSSS.....',
        '...SSBBBBBSS....',
        '...SSBWWWBSS....',
        '...SSBBYBBS.....',
        '...SBBYYYBBS....',
        '...SSBBYBBS.....',
        '...SSBBBBBSS....',
        '...SSDDDDDS.....',
        '....SDDDDS......',
        '.....SSSS.......',
        '......SS........',
        '................',
        '................',
        '................',
      ],
      ironShieldColors,
    );

  // ── Bow ──

  const bowColors: Record<string, string> = {
    W: '#7A5030',
    S: '#CCBB99',
    T: PALETTE.steel,
    D: '#5C3A1E',
  };

  items['bow'] = createSprite(
      [
        '................',
        '....W...........',
        '...W............',
        '..W.S...........',
        '..W..S..........',
        '.W....S.........',
        '.W.....S........',
        '.D......S.......',
        '.W.....S........',
        '.W....S.........',
        '..W..S..........',
        '..W.S...........',
        '...W............',
        '....W...........',
        '................',
        '................',
      ],
      bowColors,
    );

  // ── Fireball Scroll ──

  const fbScrollColors: Record<string, string> = {
    P: '#EEDDCC',
    B: '#CCBB99',
    K: PALETTE.torchOrange,
    R: PALETTE.potionRed,
    Y: PALETTE.torchYellow,
  };

  items['fireballScroll'] = createSprite(
      [
        '................',
        '................',
        '....BBBBBB......',
        '...BPPPPPBB.....',
        '...BPYRRPPB.....',
        '...BPRKRKPB.....',
        '...BPYRRPPB.....',
        '...BPPPPPPB.....',
        '...BPKKKPPB.....',
        '...BPPPPPPB.....',
        '...BPPPPPBB.....',
        '...BPPPPPPB.....',
        '...BPPPPPPB.....',
        '....BBBBBB......',
        '................',
        '................',
      ],
      fbScrollColors,
    );

  // ── Freeze Scroll ──

  const fzScrollColors: Record<string, string> = {
    P: '#EEDDCC',
    B: '#CCBB99',
    K: '#4488FF',
    C: PALETTE.portalCyan,
    W: '#FFFFFF',
  };

  items['freezeScroll'] = createSprite(
      [
        '................',
        '................',
        '....BBBBBB......',
        '...BPPPPPBB.....',
        '...BPKCWPPB.....',
        '...BPCKKCPB.....',
        '...BPWCCKPB.....',
        '...BPPPPPPB.....',
        '...BPKKKPPB.....',
        '...BPPPPPPB.....',
        '...BPPPPPBB.....',
        '...BPPPPPPB.....',
        '...BPPPPPPB.....',
        '....BBBBBB......',
        '................',
        '................',
      ],
      fzScrollColors,
    );

  // ── Chest ──

  const chestColors: Record<string, string> = {
    W: '#7A5030',
    B: '#5C3A1E',
    I: '#888899',
    G: PALETTE.keyGold,
    D: '#4A3020',
    K: PALETTE.voidBlack,
  };

  items['chest'] = createSprite(
      [
        '................',
        '................',
        '................',
        '..IIIIIIIIII....',
        '..IWWWWWWWWI....',
        '..IWWWWWWWWI....',
        '..IWWWGWWWWI....',
        '..IIIIGIIIII....',
        '..IWWWGWWWWI....',
        '..IBBBBBBBWI....',
        '..IBBBBBBBWI....',
        '..IBDDDDDBBI....',
        '..IIIIIIIIII....',
        '................',
        '................',
        '................',
      ],
      chestColors,
    );

  // ═══════════════════════════════════════════
  // ASSEMBLE CACHE
  // ═══════════════════════════════════════════

  return {
    floor: [floor0, floor1, floor2],
    wall: [wall0, wall1, wall2, wall3],
    trap,
    exit: [exit0, exit1, exit2, exit3],
    door,
    doorOpen,
    torch: [torch0, torch1, torch2],
    key,
    players,
    monsters: {
      skeleton,
      slime: [slime0, slime1],
      bat: [bat0, bat1],
      darkKnight: [boss0, boss1, boss2],
    },
    items,
  };
}

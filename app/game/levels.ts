import type { LevelConfig } from './types';

// ── Solo Campaign Levels ──
// Grid: 30 columns x 15 rows
// Map key:
//   # = wall, (space) = floor, ^ = trap, > = exit portal
//   P = player start, S = skeleton spawn, B = bat spawn
//   D = door, = = boss arena wall, T = torch, + = item spawn
//   . = boss floor tiles, $ = gold/win (level 5 only)

export const SOLO_LEVELS: LevelConfig[] = [
  // ────────────────────────────────────────
  // Level 1: THE ENTRANCE
  // ────────────────────────────────────────
  {
    name: 'THE ENTRANCE',
    subtitle: 'A warm welcome to the dungeon',
    map: [
      '##############################',
      '#P  T#     #   #T    +      ##',
      '#    #  +  # S #            ##',
      '#    #     #   ### ==========#',
      '## ###  ####        =.......=#',
      '#       T           =.......=#',
      '#  ###  ####   ##    .......=#',
      '#  # +     #        =.......=#',
      '#  #    S  ####    ==========#',
      '#  ###  T  #    D       >   ##',
      '#          #####  ###      ###',
      '## ####          T         ###',
      '#     +    ###              ##',
      '#  T    S       T       +   ##',
      '##############################',
    ],
    fogOfWar: false,
    visionRadius: 99,
    monsterSpeed: 600,
    bossType: 'skeleton',
    bossHpBase: 40,
    monsterCountBase: 2,
  },

  // ────────────────────────────────────────
  // Level 2: THE CORRIDORS
  // ────────────────────────────────────────
  {
    name: 'THE CORRIDORS',
    subtitle: 'Narrow passages hide deadly traps',
    map: [
      '##############################',
      '#P   T   S      +   T        #',
      '#        ^                   #',
      '###### ################ ######',
      '#  +           B       +     #',
      '# ^  S       ^      =========#',
      '#                   =.......=#',
      '############ ######+ .......=#',
      '#  +T               =.......=#',
      '#     S   ^        +=.......=#',
      '# ^               T =========#',
      '###### ################ ######',
      '#      T    ^       D    >   #',
      '#     S                      #',
      '##############################',
    ],
    fogOfWar: false,
    visionRadius: 99,
    monsterSpeed: 500,
    bossType: 'skeleton',
    bossHpBase: 60,
    monsterCountBase: 4,
  },

  // ────────────────────────────────────────
  // Level 3: THE LABYRINTH
  // ────────────────────────────────────────
  {
    name: 'THE LABYRINTH',
    subtitle: 'Lost in the dark, something slithers',
    map: [
      '##############################',
      '#P T #  +#   #T +            #',
      '#            #   #           #',
      '# ## # # #                   #',
      '# S          #   #  =========#',
      '# ####   #       #  =.......=#',
      '#+   # T # B #   #  =.......=#',
      '#  ### ##        #   .......=#',
      '# S     +           =.......=#',
      '# ##   ###          =========#',
      '#         B    T   D    >    #',
      '#  ##          ##            #',
      '#+      S                    #',
      '#                 +          #',
      '##############################',
    ],
    fogOfWar: true,
    visionRadius: 5,
    monsterSpeed: 400,
    bossType: 'slime',
    bossHpBase: 80,
    monsterCountBase: 7,
  },

  // ────────────────────────────────────────
  // Level 4: THE GAUNTLET
  // ────────────────────────────────────────
  {
    name: 'THE GAUNTLET',
    subtitle: 'Only the swift survive the swarm',
    map: [
      '##############################',
      '#P  T#S  # B #+#T +          #',
      '# ## #         #             #',
      '# S    ##    #  B#           #',
      '## # #   #^      #  =========#',
      '#  #T  # #   #      =.......=#',
      '# # #####   +    #  =.......=#',
      '# +  #S          #   .......=#',
      '# ####     ^        =.......=#',
      '#B  #               =.......=#',
      '## #       +        =========#',
      '#  #  T#  S                  #',
      '#+ #        B      T  D   >  #',
      '# S     +                    #',
      '##############################',
    ],
    fogOfWar: true,
    visionRadius: 4,
    monsterSpeed: 300,
    bossType: 'bat',
    bossHpBase: 72,
    monsterCountBase: 10,
  },

  // ────────────────────────────────────────
  // Level 5: THE VAULT
  // ────────────────────────────────────────
  {
    name: 'THE VAULT',
    subtitle: 'Face the Dark Knight or perish',
    map: [
      '##############################',
      '#P T  # ^S #  B T +          #',
      '# ##        +  #             #',
      '#  S +###   ^T #             #',
      '## ####    #       ==========#',
      '#T +        S  #   =........=#',
      '# ### ###          =........=#',
      '#  S  ^ + ##   #    ........=#',
      '# ### ###          =........=#',
      '#B  +     # B +    =....$...=#',
      '## ###             ==========#',
      '#  S   ##   ^      T  D   >  #',
      '# ##                         #',
      '#  T    S   B  T  +    +     #',
      '##############################',
    ],
    fogOfWar: true,
    visionRadius: 3,
    monsterSpeed: 220,
    bossType: 'darkKnight',
    bossHpBase: 200,
    monsterCountBase: 12,
  },

];

// ── Helper ──

export function getSoloLevelConfig(level: number): LevelConfig {
  const index = level - 1;
  if (index < 0 || index >= SOLO_LEVELS.length) {
    throw new Error(
      `Invalid solo level ${level}. Must be between 1 and ${SOLO_LEVELS.length}.`
    );
  }
  return SOLO_LEVELS[index];
}

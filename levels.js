'use strict';

/*
  Level map key
  ─────────────
  P  player start (parsed out, becomes floor)
  M  monster – horizontal patrol (parsed out, tracked separately)
  #  wall
  ^  spike trap
  >  exit portal  (levels 1–4)
  $  gold / win   (level 5)
     space = open floor

  Every row must be exactly 30 characters wide.
*/

const LEVELS = [
  // ── Level 1: THE ENTRANCE ──────────────────────────────────────────────────
  {
    name: 'THE ENTRANCE',
    monsterSpeed: 600,
    map: [
      '##############################',
      '#                            #',
      '# P                          #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#             M              #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                            #',
      '#                        >   #',
      '##############################',
    ],
  },

  // ── Level 2: THE CORRIDORS ─────────────────────────────────────────────────
  // A horizontal wall splits the room in two.
  // Gap on the right lets you drop to the lower half;
  // gap on the left lets you reach the exit.
  {
    name: 'THE CORRIDORS',
    monsterSpeed: 500,
    map: [
      '##############################',
      '# P                          #',
      '#                            #',
      '#    M                       #',
      '#                            #',
      '#                            #',
      '######################       #',
      '#              ^             #',
      '#                            #',
      '#         ^    M             #',
      '#        #####################',
      '#                            #',
      '#                            #',
      '#                        >   #',
      '##############################',
    ],
  },

  // ── Level 3: THE LABYRINTH ─────────────────────────────────────────────────
  // A vertical wall at col 12 divides left / right sections.
  // Row 8 has no wall at col 12 — that's the crossing point.
  // Row 9 seals the left side below, forcing you to stay right.
  {
    name: 'THE LABYRINTH',
    monsterSpeed: 400,
    map: [
      '##############################',
      '# P         #                #',
      '#           #    M           #',
      '#     ^     #                #',
      '#           #       ^        #',
      '#     M     #                #',
      '#           #         M      #',
      '#           ##########       #',
      '#     ^                 ^    #',
      '############                 #',
      '#                            #',
      '#                     ^      #',
      '#                            #',
      '#                        >   #',
      '##############################',
    ],
  },

  // ── Level 4: THE GAUNTLET ──────────────────────────────────────────────────
  // Same zigzag wall structure as level 2 but monsters and traps everywhere.
  {
    name: 'THE GAUNTLET',
    monsterSpeed: 300,
    map: [
      '##############################',
      '# P      M           M       #',
      '#   ^         ^              #',
      '#        M     M      M      #',
      '#   ^              ^         #',
      '#                            #',
      '######################       #',
      '#     ^       ^      M       #',
      '#                            #',
      '#   M    ^         ^    M    #',
      '#        #####################',
      '#                            #',
      '#   ^        M         ^     #',
      '#                        >   #',
      '##############################',
    ],
  },

  // ── Level 5: THE VAULT ─────────────────────────────────────────────────────
  // Same wall structure as level 3 but harder.
  // Win condition: reach the gold $ (no exit portal).
  {
    name: 'THE VAULT',
    monsterSpeed: 220,
    map: [
      '##############################',
      '# P         #                #',
      '#     ^     #    M      ^    #',
      '#           #                #',
      '#   M  ^    #    ^    M      #',
      '#           #                #',
      '#     ^     #    M      ^    #',
      '#           ##########       #',
      '#   M  ^                ^    #',
      '############                 #',
      '#                    M       #',
      '#     ^         ^            #',
      '#          M                 #',
      '#                    $       #',
      '##############################',
    ],
  },
];

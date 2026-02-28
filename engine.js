'use strict';

// ── Game state ────────────────────────────────────────────────────────────────
let levelIndex  = 0;
let lives       = 3;
let steps       = 0;
let staticGrid  = [];   // 2-D char array, walls/traps/exit/gold only
let playerPos   = { r: 0, c: 0 };
let playerStart = { r: 0, c: 0 };
let monsters    = [];   // [{ r, c, dr, dc, startR, startC, startDr, startDc }]
let monsterTimer = null;
let locked      = false; // true while the death-flash animation plays

// ── Level loading ─────────────────────────────────────────────────────────────
function loadLevel(idx) {
  clearInterval(monsterTimer);
  locked = false;

  const lvl  = LEVELS[idx];
  // Split every row string into individual characters
  const rows = lvl.map.map(row => row.split(''));

  staticGrid = [];
  monsters   = [];
  let pr = 1, pc = 1;   // player start fallback

  for (let r = 0; r < rows.length; r++) {
    staticGrid[r] = [];
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];

      if (ch === 'P') {
        pr = r;  pc = c;
        staticGrid[r][c] = ' ';

      } else if (ch === 'M') {
        // Horizontal patrol unless both left and right are walls
        const leftWall  = (rows[r][c - 1] === '#');
        const rightWall = (rows[r][c + 1] === '#');
        const dc = (leftWall && rightWall) ? 0 : 1;
        const dr = dc === 0 ? 1 : 0;
        monsters.push({
          r, c, dr, dc,
          startR: r, startC: c, startDr: dr, startDc: dc,
        });
        staticGrid[r][c] = ' ';

      } else {
        staticGrid[r][c] = ch;
      }
    }
  }

  playerPos   = { r: pr, c: pc };
  playerStart = { r: pr, c: pc };

  hideOverlay();
  updateUI(levelIndex, lives, steps);
  render(staticGrid, playerPos, monsters);

  if (monsters.length > 0) {
    monsterTimer = setInterval(moveMonsters, lvl.monsterSpeed);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cellAt(r, c) {
  if (r < 0 || r >= staticGrid.length) return '#';
  if (c < 0 || c >= staticGrid[0].length) return '#';
  return staticGrid[r][c];
}

function monsterAt(r, c) {
  return monsters.some(m => m.r === r && m.c === c);
}

// ── Player movement ───────────────────────────────────────────────────────────
function movePlayer(dr, dc) {
  if (locked) return;

  const nr = playerPos.r + dr;
  const nc = playerPos.c + dc;

  if (cellAt(nr, nc) === '#') return;   // wall — ignore

  playerPos = { r: nr, c: nc };
  steps++;

  // Check tile under player
  const tile = cellAt(nr, nc);
  if (tile === '>') { advanceLevel(); return; }
  if (tile === '$') { win(); return; }
  if (tile === '^') { die('Spiked! ☠'); return; }

  // Check monster collision (player walked into a monster)
  if (monsterAt(nr, nc)) { die('Caught! ☠'); return; }

  updateUI(levelIndex, lives, steps);
  render(staticGrid, playerPos, monsters);
}

// ── Monster movement ──────────────────────────────────────────────────────────
function moveMonsters() {
  if (locked) return;

  for (const m of monsters) {
    let nr = m.r + m.dr;
    let nc = m.c + m.dc;

    if (cellAt(nr, nc) === '#') {
      m.dr = -m.dr;
      m.dc = -m.dc;
      nr = m.r + m.dr;
      nc = m.c + m.dc;
    }

    // Still blocked after reversing (tight corner) — skip tick
    if (cellAt(nr, nc) === '#') continue;

    m.r = nr;
    m.c = nc;

    // Monster stepped onto the player
    if (m.r === playerPos.r && m.c === playerPos.c) {
      die('Caught! ☠');
      return;
    }
  }

  render(staticGrid, playerPos, monsters);
}

// ── Game events ───────────────────────────────────────────────────────────────
function die(msg) {
  locked = true;
  clearInterval(monsterTimer);
  lives--;
  updateUI(levelIndex, lives, steps);

  flashDeath(() => {
    if (lives <= 0) {
      showOverlay('💀', 'GAME OVER', `Reached level ${levelIndex + 1}`);
    } else {
      showMsg(msg || 'Ouch!');
      // Respawn — reset player and all monsters to their starting positions
      playerPos = { r: playerStart.r, c: playerStart.c };
      for (const m of monsters) {
        m.r = m.startR;  m.c = m.startC;
        m.dr = m.startDr; m.dc = m.startDc;
      }
      locked = false;
      render(staticGrid, playerPos, monsters);
      if (monsters.length > 0) {
        monsterTimer = setInterval(moveMonsters, LEVELS[levelIndex].monsterSpeed);
      }
    }
  });
}

function advanceLevel() {
  clearInterval(monsterTimer);
  levelIndex++;
  loadLevel(levelIndex);
}

function win() {
  clearInterval(monsterTimer);
  locked = true;
  showOverlay('🏆', 'YOU WIN!', `Escaped the dungeon in ${steps} steps!`);
}

function restartGame() {
  levelIndex = 0;
  lives      = 3;
  steps      = 0;
  loadLevel(0);
}

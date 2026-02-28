'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const elGrid      = document.getElementById('grid');
const elLevel     = document.getElementById('ui-level');
const elName      = document.getElementById('ui-name');
const elLives     = document.getElementById('ui-lives');
const elSteps     = document.getElementById('ui-steps');
const elMsg       = document.getElementById('msg');
const elOverlay   = document.getElementById('overlay');
const elOverIcon  = document.getElementById('overlay-icon');
const elOverTitle = document.getElementById('overlay-title');
const elOverSub   = document.getElementById('overlay-sub');

// ── Symbol → CSS class ────────────────────────────────────────────────────────
const CHAR_CLASS = {
  '#': 's-wall',
  '^': 's-trap',
  '>': 's-exit',
  '$': 's-gold',
  '@': 's-player',
  'M': 's-monster',
  ' ': 's-floor',
};

// ── Grid render ───────────────────────────────────────────────────────────────
// Rebuilds the <pre> innerHTML from the static grid, overlaying
// monster and player positions on top.
function render(staticGrid, playerPos, monsters) {
  const rows = staticGrid.length;
  const cols = staticGrid[0].length;
  const lines = [];

  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      let ch = staticGrid[r][c];

      // Overlay monsters
      for (const m of monsters) {
        if (m.r === r && m.c === c) { ch = 'M'; break; }
      }

      // Overlay player (drawn on top)
      if (r === playerPos.r && c === playerPos.c) ch = '@';

      const cls  = CHAR_CLASS[ch] || 's-floor';
      const safe = ch === '>' ? '&gt;' : ch;   // escape the only tricky char
      line += `<span class="${cls}">${safe}</span>`;
    }
    lines.push(line);
  }

  elGrid.innerHTML = lines.join('\n');
}

// ── Side-panel UI ─────────────────────────────────────────────────────────────
function updateUI(levelIndex, lives, steps) {
  elLevel.textContent = `${levelIndex + 1} / 5`;
  elName.textContent  = LEVELS[levelIndex].name;
  elLives.textContent = '❤️'.repeat(lives) || '💀';
  elSteps.textContent = steps;
}

// ── Temporary message in panel ────────────────────────────────────────────────
let _msgTimer = null;
function showMsg(text) {
  elMsg.textContent = text;
  clearTimeout(_msgTimer);
  _msgTimer = setTimeout(() => { elMsg.textContent = ''; }, 1400);
}

// ── Overlay (win / game-over screen) ─────────────────────────────────────────
function showOverlay(icon, title, sub) {
  elOverIcon.textContent  = icon;
  elOverTitle.textContent = title;
  elOverSub.textContent   = sub;
  elOverlay.classList.remove('hidden');
}

function hideOverlay() {
  elOverlay.classList.add('hidden');
}

// ── Death flash ───────────────────────────────────────────────────────────────
function flashDeath(callback) {
  elGrid.classList.add('flashing');
  setTimeout(() => {
    elGrid.classList.remove('flashing');
    if (callback) callback();
  }, 560);
}

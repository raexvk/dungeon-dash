'use strict';

// ── Key → movement delta ──────────────────────────────────────────────────────
const KEY_MAP = {
  'w': { dr: -1, dc:  0 }, 'W': { dr: -1, dc:  0 }, 'ArrowUp':    { dr: -1, dc:  0 },
  's': { dr:  1, dc:  0 }, 'S': { dr:  1, dc:  0 }, 'ArrowDown':  { dr:  1, dc:  0 },
  'a': { dr:  0, dc: -1 }, 'A': { dr:  0, dc: -1 }, 'ArrowLeft':  { dr:  0, dc: -1 },
  'd': { dr:  0, dc:  1 }, 'D': { dr:  0, dc:  1 }, 'ArrowRight': { dr:  0, dc:  1 },
};

// Prevent arrow keys from scrolling the page
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keydown', e => {
  const dir = KEY_MAP[e.key];
  if (dir) movePlayer(dir.dr, dir.dc);
});

document.getElementById('overlay-btn').addEventListener('click', restartGame);

// ── Boot ──────────────────────────────────────────────────────────────────────
restartGame();

let audioCtx: AudioContext | null = null;
let sfxMuted: boolean = false;
let musicMuted: boolean = false;

// ── Preloaded MP3 sounds ──
let deathAudio: HTMLAudioElement | null = null;
let shootAudio: HTMLAudioElement | null = null;
let hitAudio: HTMLAudioElement | null = null;
let entityHitAudio: HTMLAudioElement | null = null;

function loadDeathSound(): void {
  const audio = new Audio('/dog_laughing_meme.mp3');
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => { deathAudio = audio; }, { once: true });
  audio.addEventListener('error', () => console.warn('Failed to load death sound MP3'));
}

function loadShootSound(): void {
  const audio = new Audio('/duck.mp3');
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => { shootAudio = audio; }, { once: true });
  audio.addEventListener('error', () => console.warn('Failed to load shoot sound MP3'));
}

function loadHitSound(): void {
  const audio = new Audio('/faaa.mp3');
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => { hitAudio = audio; }, { once: true });
  audio.addEventListener('error', () => console.warn('Failed to load hit sound MP3'));
}

function loadEntityHitSound(): void {
  const audio = new Audio('/henta_ahh.mp3');
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => { entityHitAudio = audio; }, { once: true });
  audio.addEventListener('error', () => console.warn('Failed to load entity hit sound MP3'));
}

// ── BGM State ──
let bgmPlaying = false;
let bgmTimeout: ReturnType<typeof setTimeout> | null = null;
let bgmNodes: { stop: () => void }[] = [];

export function toggleSFX(): boolean {
  sfxMuted = !sfxMuted;
  return !sfxMuted; // return true = on
}

export function toggleMusic(): boolean {
  musicMuted = !musicMuted;
  if (musicMuted) {
    stopBGM();
  } else {
    startBGM();
  }
  return !musicMuted; // return true = on
}

export function isSFXOn(): boolean {
  return !sfxMuted;
}

export function isMusicOn(): boolean {
  return !musicMuted;
}

// Legacy compat
export function toggleMute(): boolean {
  sfxMuted = !sfxMuted;
  musicMuted = sfxMuted;
  if (musicMuted) stopBGM();
  return sfxMuted;
}

export function isMuted(): boolean {
  return sfxMuted && musicMuted;
}

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    loadDeathSound();
    loadShootSound();
    loadHitSound();
    loadEntityHitSound();
  }
  return audioCtx;
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSound(type: string): void {
  if (sfxMuted) return;

  const ctx = getCtx();
  const now = ctx.currentTime;

  switch (type) {
    case 'footstep': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.03);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }

    case 'swordClang': {
      if (shootAudio) {
        const clone = shootAudio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.7;
        clone.play().catch(() => {});
      } else {
        // Procedural fallback
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
      break;
    }

    case 'pickup': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }

    case 'damage': {
      if (hitAudio) {
        const clone = hitAudio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.6;
        clone.play().catch(() => {});
      } else {
        // Procedural fallback
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(ctx, 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.1);
      }
      break;
    }

    case 'death': {
      stopBGM();

      if (deathAudio) {
        deathAudio.currentTime = 0;
        deathAudio.volume = 1.0;
        deathAudio.play().catch(() => {});
      } else {
        // Procedural fallback if MP3 hasn't loaded
        const dur = 2.5;
        const vocal = ctx.createOscillator();
        vocal.type = 'square';
        vocal.frequency.setValueAtTime(160, now);
        vocal.frequency.linearRampToValueAtTime(120, now + 0.8);
        vocal.frequency.linearRampToValueAtTime(85, now + dur);
        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(400, now);
        lpFilter.frequency.linearRampToValueAtTime(1800, now + 0.06);
        lpFilter.frequency.linearRampToValueAtTime(600, now + dur);
        lpFilter.Q.setValueAtTime(2, now);
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0, now);
        masterGain.gain.linearRampToValueAtTime(0.4, now + 0.06);
        masterGain.gain.linearRampToValueAtTime(0.0, now + dur);
        vocal.connect(lpFilter);
        lpFilter.connect(masterGain);
        masterGain.connect(ctx.destination);
        vocal.start(now);
        vocal.stop(now + dur);
      }
      break;
    }

    case 'doorOpen': {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(300, now);
      osc1.frequency.linearRampToValueAtTime(500, now + 0.1);
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(500, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(700, now + 0.2);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.2);
      break;
    }

    case 'bossRoar': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.3);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.3);

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    }

    case 'levelUp': {
      const freqs = [400, 600, 800];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const startTime = now + i * 0.1;
        osc.frequency.setValueAtTime(freq, startTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.linearRampToValueAtTime(0.01, startTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      });
      break;
    }

    case 'keyPickup': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1000, now + 0.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case 'entityHit': {
      if (entityHitAudio) {
        const clone = entityHitAudio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.6;
        clone.play().catch(() => {});
      }
      break;
    }
  }
}

// ════════════════════════════════════════════════════════════
// ── Procedural BGM — Dark dungeon chiptune loop ──
// ════════════════════════════════════════════════════════════

// Note frequencies (Hz)
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.26, G5: 783.99,
};

const BPM = 110;
const BEAT = 60 / BPM; // seconds per beat
const BAR = BEAT * 4;

// Dark minor melody — 8 bars, each bar = 4 beats
// Pattern: Cm atmospheric dungeon theme
const bassLine: [string, number][] = [
  // bar 1-2: Cm
  ['C3', 2], ['G3', 1], ['Eb3', 1],
  ['C3', 2], ['Bb3', 1], ['G3', 1],
  // bar 3-4: Ab
  ['Ab3', 2], ['Eb3', 1], ['C3', 1],
  ['Ab3', 1], ['G3', 1], ['F3', 1], ['Eb3', 1],
  // bar 5-6: Fm → G
  ['F3', 2], ['Ab3', 1], ['F3', 1],
  ['G3', 2], ['B3', 1], ['G3', 1],
  // bar 7-8: Cm → G resolve
  ['C3', 2], ['Eb3', 1], ['G3', 1],
  ['G3', 2], ['D3', 1], ['G3', 1],
];

const melody: [string, number][] = [
  // bar 1-2
  ['Eb5', 1], ['D5', 0.5], ['C5', 0.5], ['G4', 2],
  ['Ab4', 1], ['G4', 1], ['Eb4', 1], ['D4', 1],
  // bar 3-4
  ['C5', 1.5], ['Bb4', 0.5], ['Ab4', 1], ['G4', 1],
  ['Ab4', 1], ['G4', 0.5], ['F4', 0.5], ['Eb4', 1], ['D4', 1],
  // bar 5-6
  ['F4', 1], ['Ab4', 1], ['C5', 1], ['Ab4', 1],
  ['G4', 1], ['B4', 1], ['D5', 1], ['B4', 1],
  // bar 7-8
  ['C5', 1], ['Eb5', 1], ['G4', 1], ['Eb4', 1],
  ['D4', 1.5], ['Eb4', 0.5], ['D4', 1], ['C4', 1],
];

// Arpeggiated pad chords (one note per beat)
const arpNotes: [string, number][] = [
  // bar 1-2: Cm
  ['C4', 1], ['Eb4', 1], ['G4', 1], ['Eb4', 1],
  ['C4', 1], ['Eb4', 1], ['G4', 1], ['Eb4', 1],
  // bar 3-4: Ab
  ['Ab4', 1], ['C5', 1], ['Eb5', 1], ['C5', 1],
  ['Ab4', 1], ['C5', 1], ['Eb5', 1], ['C5', 1],
  // bar 5-6: Fm → G
  ['F4', 1], ['Ab4', 1], ['C5', 1], ['Ab4', 1],
  ['G4', 1], ['B4', 1], ['D5', 1], ['B4', 1],
  // bar 7-8: Cm → G
  ['C4', 1], ['Eb4', 1], ['G4', 1], ['Eb4', 1],
  ['G4', 1], ['B4', 1], ['D5', 1], ['B4', 1],
];

function scheduleBGMLoop(): void {
  if (musicMuted || !bgmPlaying) return;

  const ctx = getCtx();
  const now = ctx.currentTime + 0.05; // slight lookahead
  const loopDuration = BAR * 8;

  // ── Bass (triangle-ish via filtered sawtooth) ──
  let bassTime = now;
  for (const [note, beats] of bassLine) {
    const dur = beats * BEAT;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(NOTE[note], bassTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, bassTime);
    gain.gain.setValueAtTime(0.07, bassTime + dur * 0.8);
    gain.gain.linearRampToValueAtTime(0.001, bassTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(bassTime);
    osc.stop(bassTime + dur);
    bgmNodes.push(osc);
    bassTime += dur;
  }

  // ── Melody (square wave, soft) ──
  let melTime = now;
  for (const [note, beats] of melody) {
    const dur = beats * BEAT;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(NOTE[note], melTime);
    const gain = ctx.createGain();
    // soft attack → sustain → release
    gain.gain.setValueAtTime(0.001, melTime);
    gain.gain.linearRampToValueAtTime(0.04, melTime + 0.02);
    gain.gain.setValueAtTime(0.04, melTime + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0.001, melTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(melTime);
    osc.stop(melTime + dur + 0.01);
    bgmNodes.push(osc);
    melTime += dur;
  }

  // ── Arpeggio pad (sine, very soft) ──
  let arpTime = now;
  for (const [note, beats] of arpNotes) {
    const dur = beats * BEAT;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(NOTE[note], arpTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, arpTime);
    gain.gain.linearRampToValueAtTime(0.025, arpTime + 0.03);
    gain.gain.setValueAtTime(0.025, arpTime + dur * 0.6);
    gain.gain.linearRampToValueAtTime(0.001, arpTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(arpTime);
    osc.stop(arpTime + dur + 0.01);
    bgmNodes.push(osc);
    arpTime += dur;
  }

  // Schedule next loop
  bgmTimeout = setTimeout(() => {
    bgmNodes = [];
    scheduleBGMLoop();
  }, loopDuration * 1000 - 100); // slight overlap to avoid gap
}

export function startBGM(): void {
  if (bgmPlaying || musicMuted) return;
  bgmPlaying = true;
  getCtx(); // ensure context exists
  scheduleBGMLoop();
}

export function stopBGM(): void {
  bgmPlaying = false;
  if (bgmTimeout) {
    clearTimeout(bgmTimeout);
    bgmTimeout = null;
  }
  for (const node of bgmNodes) {
    try { node.stop(); } catch { /* already stopped */ }
  }
  bgmNodes = [];
}

export function isBGMPlaying(): boolean {
  return bgmPlaying;
}

// ── Key BGM (spider_man.mp3) ──
let keyBgmAudio: HTMLAudioElement | null = null;
let keyBgmPlaying = false;

function ensureKeyBgm(): HTMLAudioElement {
  if (!keyBgmAudio) {
    keyBgmAudio = new Audio('/spider_man.mp3');
    keyBgmAudio.loop = true;
    keyBgmAudio.volume = 0.6;
    keyBgmAudio.preload = 'auto';
  }
  return keyBgmAudio;
}

export function startKeyBGM(): void {
  if (keyBgmPlaying || musicMuted) return;
  stopBGM(); // stop the normal dungeon BGM
  keyBgmPlaying = true;
  const audio = ensureKeyBgm();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopKeyBGM(): void {
  if (!keyBgmPlaying) return;
  keyBgmPlaying = false;
  if (keyBgmAudio) {
    keyBgmAudio.pause();
    keyBgmAudio.currentTime = 0;
  }
}

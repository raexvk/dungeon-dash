import { useRef, useEffect } from 'react';
import type { GameState } from '../game/types';
import type { RenderState } from '../renderer/canvas-renderer';
import {
  renderFrame,
  updateEntityRender,
  addFloatingText,
  addAttackEffect,
  triggerShake,
} from '../renderer/canvas-renderer';
import { buildSpriteCache } from '../renderer/sprites';
import type { SpriteCache } from '../renderer/sprites';
import type { Particle } from '../renderer/particles';
import { updateParticles, spawnParticles } from '../renderer/particles';
import { playSound } from '../renderer/audio';

interface GameCanvasProps {
  gameState: GameState;
  localPlayerId: number;
  gridWidth: number;
  gridHeight: number;
}

export function GameCanvas(props: GameCanvasProps) {
  const { gameState, localPlayerId, gridWidth, gridHeight } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteCacheRef = useRef<SpriteCache | null>(null);
  const renderStateRef = useRef<RenderState>({
    gameState,
    localPlayerId,
    spriteCache: null,
    particles: [],
    floatingTexts: [],
    attackEffects: [],
    shakeX: 0,
    shakeY: 0,
    shakeDuration: 0,
    time: 0,
    deltaTime: 0,
  });
  const rafIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastEventCountRef = useRef<number>(0);

  // Build sprite cache once (lazy init)
  useEffect(() => {
    if (!spriteCacheRef.current) {
      spriteCacheRef.current = buildSpriteCache();
    }
  }, []);

  // Reset event counter only on level changes
  const levelRef = useRef(gameState.level);
  if (gameState.level !== levelRef.current) {
    levelRef.current = gameState.level;
    lastEventCountRef.current = 0;
  }

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    function loop(now: number) {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
      lastTimeRef.current = now;

      const state = renderStateRef.current;
      state.gameState = gameState;
      state.localPlayerId = localPlayerId;
      state.spriteCache = spriteCacheRef.current;
      state.deltaTime = dt;
      state.time += dt * 1000;

      // Update smooth rendering positions for players
      for (const player of gameState.players) {
        updateEntityRender(player, dt);
      }

      // Update smooth rendering positions for monsters (slower lerp for smooth movement)
      for (const monster of gameState.monsters) {
        updateEntityRender(monster, dt, 5);
      }

      // Update smooth rendering positions for boss (even slower for imposing feel)
      if (gameState.boss) {
        updateEntityRender(gameState.boss, dt, 4);
      }

      // Process new game events for visual effects
      const events = gameState.events;
      const prevCount = lastEventCountRef.current;
      if (events.length > prevCount) {
        for (let i = prevCount; i < events.length; i++) {
          const evt = events[i];
          if (evt.type === 'damage' || evt.type === 'kill' || evt.type === 'bossKill') {
            // Find attacker and direction
            const attacker = gameState.players.find(p => p.id === evt.playerId);
            const dir = { dr: 0, dc: 1 };
            if (attacker) {
              if (attacker.facing === 'right') { dir.dr = 0; dir.dc = 1; }
              else if (attacker.facing === 'left') { dir.dr = 0; dir.dc = -1; }
              else if (attacker.facing === 'up') { dir.dr = -1; dir.dc = 0; }
              else { dir.dr = 1; dir.dc = 0; }
            }

            // Find target position for slash effect
            const targetId = evt.targetId;
            let tx = 0, ty = 0;
            let foundTarget = false;
            const targetMonster = gameState.monsters.find(m => m.id === targetId);
            if (targetMonster) {
              tx = (targetMonster as any).renderX ?? targetMonster.c * 32;
              ty = (targetMonster as any).renderY ?? targetMonster.r * 32;
              foundTarget = true;
            } else if (gameState.boss && gameState.boss.id === targetId) {
              tx = (gameState.boss as any).renderX ?? gameState.boss.c * 32;
              ty = (gameState.boss as any).renderY ?? gameState.boss.r * 32;
              foundTarget = true;
            }

            // If no target (swing into air), position slash in front of player
            if (!foundTarget && attacker) {
              const ax = attacker.renderX ?? attacker.c * 32;
              const ay = attacker.renderY ?? attacker.r * 32;
              tx = ax + dir.dc * 32;
              ty = ay + dir.dr * 32;
            }

            addAttackEffect(state, tx, ty, dir, 'slash');
            if (foundTarget) {
              spawnParticles(state.particles, 'sparks', tx + 16, ty + 16);
            }
          } else if (evt.type === 'playerHit') {
            const hitPlayer = gameState.players.find(p => p.id === evt.playerId);
            if (hitPlayer) {
              const hx = (hitPlayer.renderX ?? hitPlayer.c * 32) + 16;
              const hy = (hitPlayer.renderY ?? hitPlayer.r * 32) + 16;
              spawnParticles(state.particles, 'blood', hx, hy);
              addAttackEffect(state, hitPlayer.renderX ?? hitPlayer.c * 32, hitPlayer.renderY ?? hitPlayer.r * 32, { dr: 0, dc: 0 }, 'hit');
              triggerShake(state, 8);
            }
          } else if (evt.type === 'playerDied') {
            playSound('death');
            const deadPlayer = gameState.players.find(p => p.id === evt.playerId);
            if (deadPlayer) {
              spawnParticles(state.particles, 'blood', (deadPlayer.renderX ?? deadPlayer.c * 32) + 16, (deadPlayer.renderY ?? deadPlayer.r * 32) + 16);
              triggerShake(state, 15);
            }
          }
        }
        lastEventCountRef.current = events.length;
      }

      // Update particles
      updateParticles(state.particles, dt * 60);

      // Render the frame
      renderFrame(ctx!, state);

      rafIdRef.current = requestAnimationFrame(loop);
    }

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [gameState, localPlayerId]);

  const canvasWidth = gridWidth * 32;
  const canvasHeight = gridHeight * 32;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        width: '100vw',
        height: '100vh',
        objectFit: 'contain',
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}

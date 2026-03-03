import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, InputAction, AbilityType } from '~/game/types';
import { initializeSoloGame, processSoloTurn, advanceMonsterAutoMove } from '~/game/engine';

export function useSoloGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const stateRef = useRef<GameState | null>(null);
  const checkpointRef = useRef(0);
  const monsterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const energyAccumRef = useRef({ move: 0, shoot: 0 });

  // Continuous monster movement interval
  useEffect(() => {
    if (monsterIntervalRef.current) {
      clearInterval(monsterIntervalRef.current);
      monsterIntervalRef.current = null;
    }

    if (!gameState) return;

    monsterIntervalRef.current = setInterval(() => {
      const state = stateRef.current;
      if (!state) return;
      if (state.phase === 'gameOver' || state.phase === 'summary') return;

      advanceMonsterAutoMove(state);
      setGameState({ ...state });
    }, 600);

    return () => {
      if (monsterIntervalRef.current) {
        clearInterval(monsterIntervalRef.current);
        monsterIntervalRef.current = null;
      }
    };
  }, [gameState?.phase, levelIndex]);

  // Real-time cooldown ticker (invulnFrames) — runs at 30Hz to match MP tick rate
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!gameState) return;

    timerIntervalRef.current = setInterval(() => {
      const state = stateRef.current;
      if (!state) return;
      if (state.phase === 'gameOver' || state.phase === 'summary') return;

      let changed = false;
      for (const player of state.players) {
        if (player.invulnFrames > 0) {
          player.invulnFrames--;
          changed = true;
        }
      }

      // Energy recharge
      const ea = energyAccumRef.current;
      ea.move += 33;
      ea.shoot += 33;
      for (const player of state.players) {
        if (ea.move >= 800 && player.moveEnergy < player.maxMoveEnergy) {
          player.moveEnergy++;
          changed = true;
        }
        if (ea.shoot >= 1500 && player.shootEnergy < player.maxShootEnergy) {
          player.shootEnergy++;
          changed = true;
        }
      }
      if (ea.move >= 800) ea.move = 0;
      if (ea.shoot >= 1500) ea.shoot = 0;

      if (changed) {
        setGameState({ ...state });
      }
    }, 33); // ~30Hz, so 90 frames = 3 seconds

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState?.phase, levelIndex]);

  const startGame = useCallback((level: number = 0) => {
    const state = initializeSoloGame(level);
    stateRef.current = state;
    energyAccumRef.current = { move: 0, shoot: 0 };
    setGameState({ ...state });
    setLevelIndex(level);
    // Update checkpoint to the highest level started
    if (level > checkpointRef.current) {
      checkpointRef.current = level;
    }
  }, []);

  const handleInput = useCallback(
    (
      action: InputAction,
      dir?: { dr: number; dc: number },
      ability?: AbilityType,
    ) => {
      const state = stateRef.current;
      if (!state) return;
      if (state.phase === 'gameOver' || state.phase === 'summary') return;

      processSoloTurn(state, action, dir, ability);

      // Check for level advancement (re-read phase after processing turn;
      // processSoloTurn mutates state.phase so we bypass TypeScript narrowing)
      if ((state as GameState).phase === 'summary') {
        // Advance to next level after a delay
        const nextLevel = state.level + 1;
        if (nextLevel < 5) {
          setTimeout(() => {
            const newState = initializeSoloGame(nextLevel);
            // Carry over score and stats
            const prevPlayer = state.players[0];
            const newPlayer = newState.players[0];
            newPlayer.score = prevPlayer.score;
            newPlayer.kills = prevPlayer.kills;
            newPlayer.deaths = prevPlayer.deaths;
            newPlayer.bossKills = prevPlayer.bossKills;
            // Keep equipment
            newPlayer.weapon = prevPlayer.weapon;
            newPlayer.shieldEquip = prevPlayer.shieldEquip;
            newPlayer.hasFireball = prevPlayer.hasFireball;
            newPlayer.hasFreeze = prevPlayer.hasFreeze;
            newPlayer.hasBow = prevPlayer.hasBow;
            // Carry over energy
            newPlayer.moveEnergy = prevPlayer.moveEnergy;
            newPlayer.maxMoveEnergy = prevPlayer.maxMoveEnergy;
            newPlayer.shootEnergy = prevPlayer.shootEnergy;
            newPlayer.maxShootEnergy = prevPlayer.maxShootEnergy;

            stateRef.current = newState;
            setGameState({ ...newState });
            setLevelIndex(nextLevel);
            checkpointRef.current = nextLevel;
          }, 2000);
        }
      }

      // Force React re-render with a shallow copy
      setGameState({ ...state });
    },
    [],
  );

  const restartGame = useCallback(() => {
    startGame(checkpointRef.current);
  }, [startGame]);

  return {
    gameState,
    levelIndex,
    handleInput,
    startGame,
    restartGame,
  };
}

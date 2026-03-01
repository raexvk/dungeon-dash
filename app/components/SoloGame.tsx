import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { EventFeed } from './EventFeed';
import { Minimap } from './Minimap';
import { DeathOverlay } from './DeathOverlay';
import { LevelTransition } from './LevelTransition';
import { LevelSummary } from './LevelSummary';
import { Leaderboard } from './Leaderboard';
import { useInput } from '~/hooks/useInput';
import { useSoloGameState } from '~/hooks/useGameState';
import { SOLO_LEVELS } from '~/game/levels';
import { buildScoreEntries, calculateHighlights } from '~/game/scoring';
import { playSound, startBGM, stopBGM } from '~/renderer/audio';
import type { InputAction, AbilityType, Visibility } from '~/game/types';

export function SoloGame() {
  const navigate = useNavigate();
  const { gameState, levelIndex, handleInput, startGame, restartGame } =
    useSoloGameState();
  const [showTransition, setShowTransition] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [prevLevel, setPrevLevel] = useState(-1);

  // Start game on mount
  useEffect(() => {
    startGame(0);
    startBGM();
    return () => stopBGM();
  }, [startGame]);

  // Detect level changes for transition
  useEffect(() => {
    if (levelIndex !== prevLevel && gameState) {
      setPrevLevel(levelIndex);
      setShowTransition(true);
      setShowSummary(false);
      setTimeout(() => setShowTransition(false), 2500);
    }
  }, [levelIndex, prevLevel, gameState]);

  // Detect phase changes
  useEffect(() => {
    if (!gameState) return;

    if (gameState.phase === 'summary') {
      setShowSummary(true);
      playSound('levelUp');
    }

    if (gameState.phase === 'gameOver') {
      if (levelIndex >= 4 && gameState.players[0]?.exitOrder >= 0) {
        // Won the game
        setShowLeaderboard(true);
        playSound('levelUp');
      }
    }
  }, [gameState?.phase]);

  const onInput = useCallback(
    (
      action: InputAction,
      dir?: { dr: number; dc: number },
      ability?: AbilityType,
    ) => {
      if (showSummary || showLeaderboard) return;

      // Play sound effects
      if (action === 'move') playSound('footstep');
      if (action === 'attack') playSound('swordClang');

      handleInput(action, dir, ability);
    },
    [handleInput, showSummary, showLeaderboard],
  );

  const inputEnabled =
    !!gameState &&
    gameState.phase !== 'gameOver' &&
    !showSummary &&
    !showLeaderboard;
  useInput(onInput, inputEnabled);

  if (!gameState) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: '#0A0A0F',
          color: '#E0E0E8',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  const config = SOLO_LEVELS[levelIndex];
  const player = gameState.players[0];
  const isDead = player && !player.alive;
  const isGameOver =
    gameState.phase === 'gameOver' && !(levelIndex >= 4 && player?.exitOrder >= 0);
  const visMap = gameState.visibilityMaps.get(0);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        background: '#0A0A0F',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <GameCanvas
          gameState={gameState}
          localPlayerId={0}
          gridWidth={30}
          gridHeight={15}
        />

        <HUD
          players={gameState.players}
          localPlayerId={0}
          level={levelIndex}
          levelName={config.name}
          boss={gameState.boss}
          keyState={gameState.key}
          exitTimer={gameState.exitTimer}
          phase={gameState.phase}
        />

        <EventFeed events={gameState.events} />

        {config.fogOfWar && visMap && (
          <Minimap
            grid={gameState.grid}
            players={gameState.players}
            monsters={gameState.monsters}
            visibilityMap={visMap}
          />
        )}
      </div>

      <DeathOverlay
        visible={isDead || isGameOver}
        respawnTimer={0}
        respawnsLeft={0}
        isSolo={true}
        onRestart={restartGame}
      />

      <LevelTransition
        levelName={config.name}
        subtitle={config.subtitle}
        visible={showTransition}
      />

      {showSummary && levelIndex < 4 && (
        <LevelSummary
          level={levelIndex}
          levelName={config.name}
          scores={buildScoreEntries(gameState, 0)}
          onContinue={() => {
            setShowSummary(false);
            startGame(levelIndex + 1);
          }}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          rankings={buildScoreEntries(gameState, 0)}
          highlights={calculateHighlights(buildScoreEntries(gameState, 0))}
          onPlayAgain={restartGame}
          onMainMenu={() => navigate('/')}
        />
      )}
    </div>
  );
}

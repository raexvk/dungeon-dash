import { useState, useCallback, useRef, useEffect } from 'react';
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
import { useWebSocket } from '~/hooks/useWebSocket';
import { playSound, startBGM, stopBGM } from '~/renderer/audio';
import type {
  GameState,
  ServerMessage,
  InputAction,
  AbilityType,
  ScoreEntry,
  Highlight,
} from '~/game/types';

interface MultiplayerGameProps {
  roomCode: string;
}

export function MultiplayerGame({ roomCode }: MultiplayerGameProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState(0);
  const [levelName, setLevelName] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    level: number;
    scores: ScoreEntry[];
  } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{
    rankings: ScoreEntry[];
    highlights: Highlight[];
  } | null>(null);
  const seqRef = useRef(0);
  const stateRef = useRef<GameState | null>(null);

  // Stop BGM on unmount
  useEffect(() => {
    return () => stopBGM();
  }, []);

  const wsUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/rooms/${roomCode}/ws`
      : '';

  const onMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'gameStart': {
        const state = msg.state;
        // visibilityMaps is a Map but JSON serialization turns it into {}.
        // Reconstitute it as an empty Map (server doesn't track visibility per-client).
        if (!(state.visibilityMaps instanceof Map)) {
          state.visibilityMaps = new Map();
        }
        stateRef.current = state;
        setGameState({ ...state });
        setShowTransition(true);
        setTimeout(() => setShowTransition(false), 2500);
        startBGM();
        break;
      }
      case 'state':
        if (stateRef.current) {
          // Preserve renderX/renderY from existing entities so lerp isn't reset
          for (const newP of msg.players) {
            const old = stateRef.current.players.find((p: any) => p.id === newP.id);
            if (old) {
              (newP as any).renderX = (old as any).renderX;
              (newP as any).renderY = (old as any).renderY;
            }
          }
          for (const newM of msg.monsters) {
            const old = stateRef.current.monsters.find((m: any) => m.id === newM.id);
            if (old) {
              (newM as any).renderX = (old as any).renderX;
              (newM as any).renderY = (old as any).renderY;
            }
          }
          if (msg.boss && stateRef.current.boss) {
            (msg.boss as any).renderX = (stateRef.current.boss as any).renderX;
            (msg.boss as any).renderY = (stateRef.current.boss as any).renderY;
          }
          stateRef.current.players = msg.players;
          stateRef.current.monsters = msg.monsters;
          stateRef.current.boss = msg.boss;
          stateRef.current.items = msg.items;
          stateRef.current.key = msg.key;
          stateRef.current.door = msg.door;
          stateRef.current.telegraphs = msg.telegraphs;
          stateRef.current.hazards = msg.hazards;
          stateRef.current.projectiles = (msg as any).projectiles ?? stateRef.current.projectiles;
          stateRef.current.events = msg.events;
          stateRef.current.tick = msg.tick;
          setGameState({ ...stateRef.current });
        }
        break;
      case 'levelSummary':
        setShowSummary(true);
        setSummaryData({ level: msg.level, scores: msg.scores });
        break;
      case 'gameOver':
        stopBGM();
        setShowLeaderboard(true);
        setLeaderboardData({
          rankings: msg.rankings,
          highlights: msg.highlights,
        });
        break;
      case 'error':
        console.error('Server error:', msg.message);
        break;
    }
  }, []);

  const reconnectMsg = JSON.stringify({ type: 'reconnect', playerId: localPlayerId });

  const { send } = useWebSocket({
    url: wsUrl,
    onMessage,
    onOpen: (ws) => {
      // Send reconnect directly on the raw WebSocket
      ws.send(reconnectMsg);
    },
    enabled: typeof window !== 'undefined',
  });

  const handleInput = useCallback(
    (
      action: InputAction,
      dir?: { dr: number; dc: number },
      ability?: AbilityType,
    ) => {
      if (action === 'move') playSound('footstep');
      if (action === 'attack') playSound('swordClang');

      send({
        type: 'input',
        seq: seqRef.current++,
        action,
        dir,
        ability,
      });
    },
    [send],
  );

  useInput(handleInput, !!gameState && !showSummary && !showLeaderboard);

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
        Waiting for game to start...
      </div>
    );
  }

  const localPlayer = gameState.players.find((p) => p.id === localPlayerId);
  const isDead = localPlayer ? !localPlayer.alive : false;
  const visMap = gameState.visibilityMaps.get(localPlayerId);

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
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GameCanvas
          gameState={gameState}
          localPlayerId={localPlayerId}
          gridWidth={40}
          gridHeight={20}
        />

        <HUD
          players={gameState.players}
          localPlayerId={localPlayerId}
          level={gameState.level}
          levelName={levelName}
          boss={gameState.boss}
          keyState={gameState.key}
          exitTimer={gameState.exitTimer}
          phase={gameState.phase}
        />

        <EventFeed events={gameState.events} />

        {visMap && (
          <Minimap
            grid={gameState.grid}
            players={gameState.players}
            monsters={gameState.monsters}
            visibilityMap={visMap}
          />
        )}
      </div>

      <DeathOverlay
        visible={isDead}
        respawnTimer={localPlayer?.respawnTimer ?? 0}
        respawnsLeft={localPlayer?.respawnsLeft ?? 0}
        isSolo={false}
      />

      <LevelTransition
        levelName={levelName}
        subtitle=""
        visible={showTransition}
      />

      {showSummary && summaryData && (
        <LevelSummary
          level={summaryData.level}
          levelName={levelName}
          scores={summaryData.scores}
          onContinue={() => setShowSummary(false)}
        />
      )}

      {showLeaderboard && leaderboardData && (
        <Leaderboard
          rankings={leaderboardData.rankings}
          highlights={leaderboardData.highlights}
          onPlayAgain={() => navigate('/')}
          onMainMenu={() => navigate('/')}
        />
      )}
    </div>
  );
}

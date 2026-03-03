import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCanvas } from './GameCanvas';
import { HUD, PlayerBar } from './HUD';
import { EventFeed } from './EventFeed';
import { Minimap } from './Minimap';
import { DeathOverlay } from './DeathOverlay';
import { LevelTransition } from './LevelTransition';
import { LevelSummary } from './LevelSummary';
import { Leaderboard } from './Leaderboard';
import { useInput } from '~/hooks/useInput';
import { useWebSocket } from '~/hooks/useWebSocket';
import { getSessionCookie, clearSessionCookie } from '~/utils/sessionCookie';
import { playSound, startBGM, stopBGM } from '~/renderer/audio';
import type {
  GameState,
  ServerMessage,
  InputAction,
  AbilityType,
  ScoreEntry,
  Highlight,
  Player,
} from '~/game/types';
import { canMoveTo, monsterAt, bossAt } from '~/game/combat';

interface MultiplayerGameProps {
  roomCode: string;
}

export function MultiplayerGame({ roomCode }: MultiplayerGameProps) {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayerId] = useState(() => {
    const session = getSessionCookie(roomCode);
    if (session && session.roomCode === roomCode) return session.playerId;
    return -1;
  });
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
  const pendingInputsRef = useRef<{ seq: number; dir: { dr: number; dc: number }; prevR: number; prevC: number }[]>([]);
  const deltaCountRef = useRef(0);

  // Stop BGM on unmount
  useEffect(() => {
    return () => stopBGM();
  }, []);

  // Redirect to lobby if no valid session
  useEffect(() => {
    if (localPlayerId === -1) navigate(`/lobby/${roomCode}`);
  }, [localPlayerId, navigate, roomCode]);

  const wsUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/rooms/${roomCode}/ws`
      : '';

  // Reconcile predicted inputs against server-acknowledged position
  const reconcilePrediction = useCallback((localPlayer: Player) => {
    const pending = pendingInputsRef.current;
    const acked = localPlayer.lastProcessedSeq ?? -1;

    // Drop all inputs the server has already processed
    while (pending.length > 0 && pending[0].seq <= acked) {
      pending.shift();
    }

    // Re-apply remaining unacknowledged move inputs on top of server position
    if (pending.length > 0 && stateRef.current) {
      let r = localPlayer.r;
      let c = localPlayer.c;
      for (const input of pending) {
        const nr = r + input.dir.dr;
        const nc = c + input.dir.dc;
        if (
          canMoveTo(stateRef.current.grid, nr, nc, stateRef.current.door) &&
          !monsterAt(stateRef.current.monsters, nr, nc) &&
          !bossAt(stateRef.current.boss, nr, nc)
        ) {
          r = nr;
          c = nc;
        }
      }
      localPlayer.r = r;
      localPlayer.c = c;
    }
  }, []);

  const onMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'gameStart': {
        const state = msg.state;
        if (!(state.visibilityMaps instanceof Map)) {
          state.visibilityMaps = new Map();
        }
        pendingInputsRef.current = [];
        deltaCountRef.current = 0;
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
          stateRef.current.projectiles = msg.projectiles;
          stateRef.current.events = msg.events;
          stateRef.current.tick = msg.tick;

          // Reconcile client prediction for local player
          const lp = stateRef.current.players.find((p) => p.id === localPlayerId);
          if (lp) reconcilePrediction(lp);

          setGameState({ ...stateRef.current });
        }
        break;
      case 'delta':
        if (stateRef.current) {
          const cur = stateRef.current;
          cur.tick = msg.tick;

          // Merge changed players
          if (msg.players) {
            for (const newP of msg.players) {
              const idx = cur.players.findIndex((p) => p.id === newP.id);
              if (idx >= 0) {
                const old = cur.players[idx];
                // Preserve render positions for lerp continuity
                const rx = old.renderX;
                const ry = old.renderY;
                Object.assign(old, newP);
                old.renderX = rx;
                old.renderY = ry;
              }
            }
          }

          // Merge changed monsters
          if (msg.monsters) {
            for (const newM of msg.monsters) {
              const idx = cur.monsters.findIndex((m) => m.id === newM.id);
              if (idx >= 0) {
                const old = cur.monsters[idx];
                const rx = old.renderX;
                const ry = old.renderY;
                Object.assign(old, newM);
                old.renderX = rx;
                old.renderY = ry;
              }
            }
          }

          // Merge boss if changed
          if (msg.boss !== undefined) {
            if (msg.boss && cur.boss) {
              const rx = cur.boss.renderX;
              const ry = cur.boss.renderY;
              Object.assign(cur.boss, msg.boss);
              cur.boss.renderX = rx;
              cur.boss.renderY = ry;
            } else {
              cur.boss = msg.boss;
            }
          }

          // Merge changed items
          if (msg.items) {
            for (const newI of msg.items) {
              const idx = cur.items.findIndex((i) => i.id === newI.id);
              if (idx >= 0) {
                Object.assign(cur.items[idx], newI);
              }
            }
          }

          // Replace key/door if present
          if (msg.key) cur.key = msg.key;
          if (msg.door) cur.door = msg.door;

          // Always replace volatile arrays
          cur.telegraphs = msg.telegraphs;
          cur.hazards = msg.hazards;
          cur.projectiles = msg.projectiles;
          cur.events = msg.events;

          // Reconcile client prediction for local player
          const lp = cur.players.find((p) => p.id === localPlayerId);
          if (lp) reconcilePrediction(lp);

          // Throttle React re-renders to every 2nd delta (~10Hz)
          deltaCountRef.current++;
          if (deltaCountRef.current % 2 === 0) {
            setGameState({ ...cur });
          }
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
  }, [localPlayerId, reconcilePrediction]);

  const reconnectMsg = localPlayerId >= 0
    ? JSON.stringify({ type: 'reconnect', playerId: localPlayerId })
    : '';

  const { send } = useWebSocket({
    url: wsUrl,
    onMessage,
    onOpen: (ws) => {
      if (reconnectMsg) ws.send(reconnectMsg);
    },
    enabled: typeof window !== 'undefined' && localPlayerId >= 0,
  });

  const handleInput = useCallback(
    (
      action: InputAction,
      dir?: { dr: number; dc: number },
      ability?: AbilityType,
    ) => {
      if (action === 'move') playSound('footstep');
      if (action === 'attack') playSound('swordClang');
      if (action === 'useAbility') playSound('swordClang');

      const seq = seqRef.current++;

      // Client-side prediction for move actions
      if (action === 'move' && dir && stateRef.current) {
        const cur = stateRef.current;
        const lp = cur.players.find((p) => p.id === localPlayerId);
        if (lp && lp.alive) {
          const nr = lp.r + dir.dr;
          const nc = lp.c + dir.dc;
          if (
            canMoveTo(cur.grid, nr, nc, cur.door) &&
            !monsterAt(cur.monsters, nr, nc) &&
            !bossAt(cur.boss, nr, nc)
          ) {
            pendingInputsRef.current.push({
              seq,
              dir,
              prevR: lp.r,
              prevC: lp.c,
            });
            lp.r = nr;
            lp.c = nc;
            setGameState({ ...cur });
          }
        }
      }

      send({
        type: 'input',
        seq,
        action,
        dir,
        ability,
      });
    },
    [send, localPlayerId],
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
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#0A0A0F',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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

      <PlayerBar players={gameState.players} localPlayerId={localPlayerId} />

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
          onPlayAgain={() => { clearSessionCookie(roomCode); navigate('/'); }}
          onMainMenu={() => { clearSessionCookie(roomCode); navigate('/'); }}
        />
      )}
    </div>
  );
}

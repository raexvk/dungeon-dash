import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '~/hooks/useWebSocket';
import type {
  LobbyPlayer,
  PlayerClass,
  ServerMessage,
} from '~/game/types';
import { CLASS_STATS, PLAYER_COLORS } from '~/game/types';

interface LobbyProps {
  roomCode: string;
}

const CLASSES: PlayerClass[] = ['knight', 'rogue', 'mage', 'ranger', 'bard'];

export function Lobby({ roomCode }: LobbyProps) {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [localId, setLocalId] = useState(-1);
  const [isHost, setIsHost] = useState(false);
  const [name, setName] = useState('');
  const [classType, setClassType] = useState<PlayerClass>('knight');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  const wsUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/rooms/${roomCode}/ws`
      : '';

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'lobby':
          setPlayers(msg.players);
          if (localId === -1 && msg.players.length > 0) {
            const me = msg.players[msg.players.length - 1];
            setLocalId(me.id);
            setIsHost(me.isHost);
          } else if (localId >= 0) {
            const me = msg.players.find((p) => p.id === localId);
            if (me) setIsHost(me.isHost);
          }
          break;
        case 'gameStart':
          navigate(`/game/${roomCode}`);
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    },
    [localId, navigate, roomCode],
  );

  const onWsOpen = useCallback((_ws: WebSocket) => {
    // WebSocket connected
  }, []);

  const { connected, send } = useWebSocket({
    url: wsUrl,
    onMessage,
    onOpen: onWsOpen,
    enabled: typeof window !== 'undefined',
  });

  const handleJoin = useCallback(() => {
    if (!name.trim()) return;
    if (!connected) {
      setError('Not connected to server');
      return;
    }
    send({
      type: 'join',
      name: name.trim().slice(0, 8),
      classType,
      color: PLAYER_COLORS[classType],
    });
    setJoined(true);
  }, [name, classType, send, connected]);

  const handleReady = useCallback(() => {
    send({ type: 'ready' });
  }, [send]);

  const handleStart = useCallback(() => {
    send({ type: 'start' });
  }, [send]);

  const canStart =
    isHost &&
    players.length >= 1 &&
    players.every((p) => p.ready || p.isHost);

  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      background: '#0A0A0F',
      color: '#E0E0E8',
      fontFamily: "'Press Start 2P', monospace",
      gap: 24,
    },
    code: {
      fontSize: 32,
      color: '#FFD700',
      letterSpacing: 8,
      textShadow: '0 0 20px rgba(255,215,0,0.3)',
    },
    btn: {
      padding: '12px 24px',
      border: '2px solid #00DDFF',
      color: '#00DDFF',
      background: 'transparent',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 12,
      cursor: 'pointer',
    },
    input: {
      padding: '8px 12px',
      background: '#111118',
      border: '2px solid #2A2A3A',
      color: '#E0E0E8',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 12,
      textAlign: 'center' as const,
    },
  };

  if (!joined) {
    return (
      <div style={s.container}>
        <div style={{ fontSize: 10, color: '#6A6A80' }}>ROOM CODE</div>
        <div style={s.code}>{roomCode}</div>

        <input
          style={{ ...s.input, width: 200 }}
          placeholder="Your name"
          maxLength={8}
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setClassType(c)}
              style={{
                ...s.btn,
                borderColor: classType === c ? PLAYER_COLORS[c] : '#2A2A3A',
                color: classType === c ? PLAYER_COLORS[c] : '#6A6A80',
                fontSize: 9,
              }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 9, color: '#6A6A80' }}>
          {CLASS_STATS[classType].description}
        </div>

        <button style={s.btn} onClick={handleJoin}>
          JOIN
        </button>

        {error && <div style={{ color: '#FF4444', fontSize: 10 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={{ fontSize: 10, color: '#6A6A80' }}>ROOM CODE</div>
      <div style={s.code}>{roomCode}</div>
      <button
        style={{ ...s.btn, fontSize: 9 }}
        onClick={() => navigator.clipboard?.writeText(roomCode)}
      >
        COPY CODE
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginTop: 16,
        }}
      >
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              border: `1px solid ${p.color}`,
              borderRadius: 4,
              background: p.id === localId ? '#1A1A2E' : 'transparent',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: p.color,
              }}
            />
            <div style={{ fontSize: 10, minWidth: 80 }}>{p.name}</div>
            <div style={{ fontSize: 8, color: '#6A6A80' }}>
              {p.classType.toUpperCase()}
            </div>
            <div style={{ fontSize: 8, marginLeft: 'auto' }}>
              {p.isHost ? (
                <span style={{ color: '#FFD700' }}>HOST</span>
              ) : p.ready ? (
                <span style={{ color: '#44CC44' }}>READY</span>
              ) : (
                <span style={{ color: '#6A6A80' }}>...</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isHost && (
        <button style={s.btn} onClick={handleReady}>
          READY
        </button>
      )}

      {isHost && (
        <button
          style={{
            ...s.btn,
            borderColor: canStart ? '#44CC44' : '#6A6A80',
            color: canStart ? '#44CC44' : '#6A6A80',
            cursor: canStart ? 'pointer' : 'not-allowed',
          }}
          onClick={canStart ? handleStart : undefined}
        >
          START GAME
        </button>
      )}

      {!connected && (
        <div style={{ color: '#FF4444', fontSize: 10 }}>Connecting...</div>
      )}

      {error && <div style={{ color: '#FF4444', fontSize: 10 }}>{error}</div>}
    </div>
  );
}

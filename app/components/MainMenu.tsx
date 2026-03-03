import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAllSessionCookies } from '~/utils/sessionCookie';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

const buttonBase: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  padding: '16px 32px',
  background: 'transparent',
  color: COLORS.accent,
  border: `2px solid ${COLORS.accent}`,
  cursor: 'pointer',
  width: 280,
  textAlign: 'center',
  transition: 'background 0.15s, color 0.15s',
};

const buttonHover: React.CSSProperties = {
  background: COLORS.accent,
  color: '#000',
};

function MenuButton({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...buttonBase,
        ...(hovered ? buttonHover : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function MainMenu() {
  const navigate = useNavigate();
  useEffect(() => { clearAllSessionCookies(); }, []);
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleHost = async () => {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/create', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      navigate(`/lobby/${data.roomCode}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create room');
      setCreating(false);
    }
  };

  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 4 || joining) return;
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${code}/status`);
      const data = await res.json();
      if (!data.roomCode || data.phase === 'ended') {
        setError('Room not found');
        setJoining(false);
        return;
      }
      navigate(`/lobby/${code}`);
    } catch {
      setError('Failed to check room');
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        background: COLORS.bg,
        color: COLORS.text,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 48,
          color: COLORS.gold,
          margin: 0,
          textShadow: `0 0 20px ${COLORS.gold}66`,
          letterSpacing: 4,
        }}
      >
        DUNGEON DASH
      </h1>

      <p
        style={{
          fontFamily: FONT,
          fontSize: 12,
          color: COLORS.dim,
          margin: '0 0 40px 0',
        }}
      >
        A Dungeon Crawler
      </p>

      <Link to="/solo" style={{ textDecoration: 'none' }}>
        <MenuButton>SOLO ADVENTURE</MenuButton>
      </Link>

      <MenuButton onClick={handleHost}>
        {creating ? 'CREATING...' : 'HOST GAME'}
      </MenuButton>

      {!showJoin ? (
        <MenuButton onClick={() => setShowJoin(true)}>JOIN GAME</MenuButton>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <input
            type="text"
            maxLength={4}
            placeholder="CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJoin();
            }}
            autoFocus
            style={{
              fontFamily: FONT,
              fontSize: 20,
              width: 140,
              padding: '12px 16px',
              textAlign: 'center',
              background: 'transparent',
              color: COLORS.text,
              border: `2px solid ${COLORS.accent}`,
              outline: 'none',
              letterSpacing: 8,
            }}
          />
          <MenuButton
            onClick={handleJoin}
            style={{ width: 180, fontSize: 12 }}
          >
            JOIN
          </MenuButton>
        </div>
      )}

      {error && (
        <p
          style={{
            fontFamily: FONT,
            fontSize: 10,
            color: COLORS.red,
            margin: '8px 0 0 0',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

interface DeathOverlayProps {
  visible: boolean;
  respawnTimer: number;
  respawnsLeft: number;
  onRestart?: () => void;
  isSolo: boolean;
}

export function DeathOverlay({
  visible,
  respawnTimer,
  respawnsLeft,
  onRestart,
  isSolo,
}: DeathOverlayProps) {
  const [spectating, setSpectating] = useState(false);

  // When permanently dead (no lives, not solo), show death screen for 2s then switch to spectating
  useEffect(() => {
    if (visible && !isSolo && respawnsLeft === 0) {
      setSpectating(false);
      const timer = setTimeout(() => setSpectating(true), 2000);
      return () => clearTimeout(timer);
    }
    if (!visible) setSpectating(false);
  }, [visible, isSolo, respawnsLeft]);

  useEffect(() => {
    if (!visible || !isSolo || !onRestart) return;

    const handler = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      onRestart();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, isSolo, onRestart]);

  // Spectating mode: small badge, no blocking overlay
  if (spectating) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
          fontFamily: FONT,
          fontSize: 10,
          color: COLORS.dim,
          background: 'rgba(10, 10, 15, 0.6)',
          padding: '6px 16px',
          borderRadius: 4,
          border: `1px solid ${COLORS.dim}44`,
        }}
      >
        SPECTATING
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: 'rgba(10, 10, 15, 0.85)',
        zIndex: 50,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.5s ease-in',
      }}
    >
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 48,
          color: COLORS.red,
          margin: 0,
          textShadow: `0 0 30px ${COLORS.red}88`,
          letterSpacing: 6,
        }}
      >
        YOU DIED
      </h1>

      {isSolo ? (
        <>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12,
              color: COLORS.dim,
              margin: 0,
            }}
          >
            Press any key to restart
          </p>
          {onRestart && (
            <button
              onClick={onRestart}
              style={{
                fontFamily: FONT,
                fontSize: 12,
                padding: '12px 24px',
                background: 'transparent',
                color: COLORS.accent,
                border: `2px solid ${COLORS.accent}`,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              RESTART
            </button>
          )}
        </>
      ) : respawnsLeft > 0 ? (
        <>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: COLORS.dim,
              margin: 0,
            }}
          >
            Respawning in{' '}
            <span style={{ color: COLORS.accent, fontSize: 18 }}>
              {Math.ceil(respawnTimer / 30)}
            </span>
            s...
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 10,
              color: COLORS.gold,
              margin: 0,
            }}
          >
            {respawnsLeft} {respawnsLeft === 1 ? 'LIFE' : 'LIVES'} LEFT
          </p>
        </>
      ) : (
        <p
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: COLORS.dim,
            margin: 0,
          }}
        >
          Spectating...
        </p>
      )}
    </div>
  );
}

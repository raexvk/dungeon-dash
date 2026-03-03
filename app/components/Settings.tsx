import { useNavigate } from 'react-router-dom';
import { playSound } from '~/renderer/audio';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

const sounds = [
  { key: 'swordClang', label: 'Shoot / Attack', file: 'duck.mp3', color: COLORS.accent },
  { key: 'damage', label: 'Pickup / Ability', file: 'faaa.mp3', color: COLORS.gold },
  { key: 'entityHit', label: 'Entity Hit (any)', file: 'henta_ahh.mp3', color: '#FF66AA' },
  { key: 'death', label: 'Death', file: 'dog_laughing_meme.mp3', color: COLORS.red },
] as const;

export function Settings() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: COLORS.bg,
        fontFamily: FONT,
        color: COLORS.text,
        gap: 32,
      }}
    >
      <h1 style={{ fontSize: 24, color: COLORS.accent, margin: 0 }}>
        Sound Test
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sounds.map((s) => (
          <button
            key={s.key}
            onClick={() => playSound(s.key)}
            style={{
              fontFamily: FONT,
              fontSize: 13,
              padding: '16px 32px',
              background: 'transparent',
              color: s.color,
              border: `2px solid ${s.color}`,
              cursor: 'pointer',
              width: 320,
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = s.color;
              e.currentTarget.style.color = COLORS.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = s.color;
            }}
          >
            {s.label}
            <span style={{ float: 'right', opacity: 0.5, fontSize: 10 }}>
              {s.file}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          fontFamily: FONT,
          fontSize: 11,
          padding: '12px 24px',
          background: 'transparent',
          color: COLORS.dim,
          border: `1px solid ${COLORS.dim}`,
          cursor: 'pointer',
          marginTop: 16,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.text;
          e.currentTarget.style.borderColor = COLORS.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.dim;
          e.currentTarget.style.borderColor = COLORS.dim;
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}

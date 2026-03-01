import { useState, useEffect } from 'react';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
};

const FONT = "'Press Start 2P', monospace";

interface LevelTransitionProps {
  levelName: string;
  subtitle: string;
  visible: boolean;
}

export function LevelTransition({
  levelName,
  subtitle,
  visible,
}: LevelTransitionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: `${COLORS.bg}ee`,
        zIndex: 40,
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 32,
          color: COLORS.gold,
          margin: 0,
          textShadow: `0 0 20px ${COLORS.gold}66`,
          letterSpacing: 3,
        }}
      >
        {levelName}
      </h1>

      <p
        style={{
          fontFamily: FONT,
          fontSize: 11,
          color: COLORS.dim,
          margin: 0,
          maxWidth: 400,
          textAlign: 'center',
          lineHeight: 1.8,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

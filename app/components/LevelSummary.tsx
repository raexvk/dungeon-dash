import { useState, useEffect } from 'react';
import type { ScoreEntry } from '~/game/types';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

interface LevelSummaryProps {
  level: number;
  levelName: string;
  scores: ScoreEntry[];
  onContinue: () => void;
}

export function LevelSummary({
  level,
  levelName,
  scores,
  onContinue,
}: LevelSummaryProps) {
  const [autoTimer, setAutoTimer] = useState(10);
  const [hovered, setHovered] = useState(false);

  // Auto-advance countdown
  useEffect(() => {
    if (autoTimer <= 0) {
      onContinue();
      return;
    }

    const id = setTimeout(() => setAutoTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [autoTimer, onContinue]);

  // Sort scores by level exit order then total score
  const sorted = [...scores].sort((a, b) => {
    const aLevel = a.perLevel.find((l) => l.level === level);
    const bLevel = b.perLevel.find((l) => l.level === level);
    const aOrder = aLevel?.exitOrder ?? 99;
    const bOrder = bLevel?.exitOrder ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.totalScore - a.totalScore;
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: `${COLORS.bg}f0`,
        zIndex: 55,
        fontFamily: FONT,
        padding: 32,
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: 10,
          color: COLORS.accent,
          margin: 0,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        LEVEL COMPLETE
      </h2>
      <h1
        style={{
          fontSize: 24,
          color: COLORS.gold,
          margin: 0,
          textShadow: `0 0 15px ${COLORS.gold}44`,
        }}
      >
        {levelName}
      </h1>

      {/* Score Table */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderBottom: `1px solid ${COLORS.dim}44`,
          }}
        >
          <span style={{ fontSize: 7, color: COLORS.dim, width: 20 }}>#</span>
          <span style={{ fontSize: 7, color: COLORS.dim, flex: 1 }}>
            PLAYER
          </span>
          <span style={{ fontSize: 7, color: COLORS.dim, width: 50, textAlign: 'right' }}>
            SCORE
          </span>
          <span style={{ fontSize: 7, color: COLORS.dim, width: 50, textAlign: 'right' }}>
            DEATHS
          </span>
        </div>

        {/* Rows */}
        {sorted.map((entry, idx) => {
          const levelData = entry.perLevel.find((l) => l.level === level);
          return (
            <div
              key={entry.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: idx === 0 ? '#1A1A0A' : '#0D0D1A',
                border:
                  idx === 0
                    ? `1px solid ${COLORS.gold}44`
                    : '1px solid #1A1A2E',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: idx === 0 ? COLORS.gold : COLORS.dim,
                  width: 20,
                }}
              >
                {idx + 1}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: entry.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  color: COLORS.text,
                  flex: 1,
                }}
              >
                {entry.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: COLORS.gold,
                  width: 50,
                  textAlign: 'right',
                }}
              >
                {levelData?.score ?? 0}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: COLORS.dim,
                  width: 50,
                  textAlign: 'right',
                }}
              >
                {levelData?.deaths ?? 0}
              </span>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontFamily: FONT,
          fontSize: 12,
          padding: '14px 28px',
          background: hovered ? COLORS.accent : 'transparent',
          color: hovered ? '#000' : COLORS.accent,
          border: `2px solid ${COLORS.accent}`,
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
          marginTop: 8,
        }}
      >
        CONTINUE ({autoTimer}s)
      </button>
    </div>
  );
}

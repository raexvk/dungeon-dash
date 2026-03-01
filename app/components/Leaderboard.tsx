import { useState } from 'react';
import type { ScoreEntry, Highlight } from '~/game/types';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

interface LeaderboardProps {
  rankings: ScoreEntry[];
  highlights: Highlight[];
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
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
      }}
    >
      {children}
    </button>
  );
}

const RANK_COLORS = [COLORS.gold, '#C0C0C0', '#CD7F32', COLORS.dim, COLORS.dim];

export function Leaderboard({
  rankings,
  highlights,
  onPlayAgain,
  onMainMenu,
}: LeaderboardProps) {
  const champion = rankings[0];
  const rest = rankings.slice(1, 5);

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
        background: `${COLORS.bg}f5`,
        zIndex: 60,
        fontFamily: FONT,
        overflow: 'auto',
        padding: 32,
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: 28,
          color: COLORS.gold,
          margin: 0,
          textShadow: `0 0 20px ${COLORS.gold}66`,
          letterSpacing: 4,
        }}
      >
        GAME OVER
      </h1>

      {/* Champion */}
      {champion && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '20px 40px',
            border: `3px solid ${COLORS.gold}`,
            boxShadow: `0 0 20px ${COLORS.gold}33`,
            background: '#1A1A0A',
          }}
        >
          <span style={{ fontSize: 24 }}>{'\u{1F451}'}</span>
          <span style={{ fontSize: 14, color: COLORS.gold }}>CHAMPION</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: champion.color,
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.text }}>
              {champion.name}
            </span>
          </div>
          <span style={{ fontSize: 18, color: COLORS.gold }}>
            {champion.totalScore}
          </span>
          <span style={{ fontSize: 8, color: COLORS.dim }}>
            {champion.totalKills} kills &middot; {champion.totalDeaths} deaths
          </span>
        </div>
      )}

      {/* Rankings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {rest.map((entry, idx) => {
          const rank = idx + 2;
          return (
            <div
              key={entry.playerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
                background: '#0D0D1A',
                border: `1px solid #222`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: RANK_COLORS[rank - 1] || COLORS.dim,
                  minWidth: 28,
                }}
              >
                #{rank}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: entry.color,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: COLORS.text,
                  flex: 1,
                }}
              >
                {entry.name}
              </span>
              <span style={{ fontSize: 10, color: COLORS.gold }}>
                {entry.totalScore}
              </span>
              <span style={{ fontSize: 7, color: COLORS.dim }}>
                {entry.totalKills}K {entry.totalDeaths}D
              </span>
            </div>
          );
        })}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            width: '100%',
            maxWidth: 420,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: COLORS.accent,
              marginBottom: 4,
            }}
          >
            AWARDS
          </span>
          {highlights.map((hl, i) => {
            const player = rankings.find((r) => r.playerId === hl.playerId);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 16px',
                  background: '#0D0D1A',
                  border: '1px solid #1A1A2E',
                }}
              >
                <span style={{ fontSize: 9, color: COLORS.gold, flex: 1 }}>
                  {hl.title}
                </span>
                <span style={{ fontSize: 9, color: COLORS.text }}>
                  {player?.name || '???'}
                </span>
                <span style={{ fontSize: 9, color: COLORS.accent }}>
                  {hl.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <ActionButton onClick={onPlayAgain}>PLAY AGAIN</ActionButton>
        <ActionButton onClick={onMainMenu}>MAIN MENU</ActionButton>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Player, Boss, KeyState, GamePhase } from '~/game/types';
import { toggleSFX, toggleMusic, isSFXOn, isMusicOn } from '~/renderer/audio';

const COLORS = {
  bg: '#0A0A0F',
  text: '#E0E0E8',
  dim: '#6A6A80',
  accent: '#00DDFF',
  gold: '#FFD700',
  red: '#FF4444',
};

const FONT = "'Press Start 2P', monospace";

interface HUDProps {
  players: Player[];
  localPlayerId: number;
  level: number;
  levelName: string;
  boss: Boss | null;
  keyState: KeyState;
  exitTimer: number;
  phase: GamePhase;
}

function BossHealthBar({ boss }: { boss: Boss }) {
  const pct = Math.max(0, boss.hp / boss.maxHp);
  const barColor = boss.enraged ? COLORS.red : '#CC44FF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontFamily: FONT, fontSize: 8, color: COLORS.dim }}>
        BOSS
      </span>
      <div
        style={{
          width: 200,
          height: 10,
          background: '#1A1A2E',
          border: `1px solid ${COLORS.dim}`,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.2s',
          }}
        />
      </div>
      <span style={{ fontFamily: FONT, fontSize: 7, color: COLORS.dim }}>
        {boss.hp}/{boss.maxHp}
      </span>
    </div>
  );
}

function Hearts({ hp, maxHp }: { hp: number; maxHp: number }) {
  const hearts: React.ReactNode[] = [];
  for (let i = 0; i < maxHp; i++) {
    hearts.push(
      <span
        key={i}
        style={{
          color: i < hp ? COLORS.red : '#333',
          fontSize: 10,
        }}
      >
        {i < hp ? '\u2665' : '\u2661'}
      </span>
    );
  }
  return <span style={{ display: 'flex', gap: 1 }}>{hearts}</span>;
}

function PlayerCard({
  player,
  isLocal,
  isMultiplayer,
}: {
  player: Player;
  isLocal: boolean;
  isMultiplayer: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: FONT,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: isLocal ? '#1A1A3A' : '#0D0D1A',
        border: isLocal ? `1px solid ${COLORS.accent}44` : '1px solid #222',
        opacity: player.alive ? 1 : 0.4,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: player.color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 8, color: COLORS.text, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {player.name}
      </span>
      <Hearts hp={player.hp} maxHp={player.maxHp} />
      <span style={{ fontSize: 8, color: COLORS.gold }}>{player.score}</span>
      {player.respawnsLeft > 0 && (
        <span
          style={{ fontSize: 7, color: COLORS.dim }}
          title={`${player.respawnsLeft} lives left`}
        >
          x{player.respawnsLeft}
        </span>
      )}
      {!player.alive && player.respawnsLeft <= 0 && isMultiplayer && (
        <span style={{ fontSize: 7, color: COLORS.red }}>DEAD</span>
      )}
      {player.hasKey && (
        <span style={{ fontSize: 10, color: COLORS.gold }} title="Key Holder">
          {'\u{1F511}'}
        </span>
      )}
      {player.shield && (
        <span style={{ fontSize: 10, color: COLORS.accent }} title="Shield Active">
          {'\u{1F6E1}'}
        </span>
      )}
    </div>
  );
}

const CONTROLS = [
  { key: 'W A S D', action: 'Move' },
  { key: 'SPACE', action: 'Attack' },
  { key: 'X', action: 'Wait' },
  { key: 'E', action: 'Use ability' },
  { key: 'M', action: 'Toggle mute' },
];

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [sfxOn, setSfxOn] = useState(isSFXOn());
  const [musicOn, setMusicOn] = useState(isMusicOn());
  const [showControls, setShowControls] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 36,
        right: 8,
        zIndex: 100,
        background: '#0D0D1Aee',
        border: `1px solid ${COLORS.dim}44`,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 180,
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: COLORS.text, letterSpacing: 1 }}>SETTINGS</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.dim,
            fontFamily: FONT,
            fontSize: 10,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          X
        </button>
      </div>

      {/* Music toggle */}
      <button
        onClick={() => {
          toggleMusic();
          setMusicOn(isMusicOn());
        }}
        style={{
          fontFamily: FONT,
          fontSize: 8,
          padding: '6px 8px',
          background: musicOn ? '#1A2A1A' : '#2A1A1A',
          color: musicOn ? '#44DD44' : COLORS.red,
          border: `1px solid ${musicOn ? '#44DD4444' : COLORS.red + '44'}`,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>MUSIC</span>
        <span>{musicOn ? 'ON' : 'OFF'}</span>
      </button>

      {/* SFX toggle */}
      <button
        onClick={() => {
          toggleSFX();
          setSfxOn(isSFXOn());
        }}
        style={{
          fontFamily: FONT,
          fontSize: 8,
          padding: '6px 8px',
          background: sfxOn ? '#1A2A1A' : '#2A1A1A',
          color: sfxOn ? '#44DD44' : COLORS.red,
          border: `1px solid ${sfxOn ? '#44DD4444' : COLORS.red + '44'}`,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>SFX</span>
        <span>{sfxOn ? 'ON' : 'OFF'}</span>
      </button>

      {/* Controls toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        style={{
          fontFamily: FONT,
          fontSize: 8,
          padding: '6px 8px',
          background: '#1A1A2A',
          color: COLORS.accent,
          border: `1px solid ${COLORS.accent}44`,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        CONTROLS {showControls ? '\u25B2' : '\u25BC'}
      </button>

      {/* Controls list */}
      {showControls && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '4px 0',
          }}
        >
          {CONTROLS.map(({ key, action }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 7,
                  color: COLORS.accent,
                  background: '#1A1A3A',
                  padding: '2px 5px',
                  border: `1px solid ${COLORS.accent}33`,
                  whiteSpace: 'nowrap',
                }}
              >
                {key}
              </span>
              <span style={{ fontSize: 7, color: COLORS.dim }}>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 7,
        color: COLORS.accent,
        background: '#1A1A3A',
        padding: '2px 5px',
        border: `1px solid ${COLORS.accent}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function ControlsHelpBar() {
  const [expanded, setExpanded] = useState(true);

  const hints = [
    { key: 'W A S D', action: 'Move' },
    { key: 'SPACE', action: 'Shoot' },
    { key: 'X', action: 'Wait' },
    { key: 'E', action: 'Ability' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        opacity: 0.7,
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: FONT,
          fontSize: 7,
          color: COLORS.accent,
          cursor: 'pointer',
          padding: '2px 8px',
        }}
      >
        {expanded ? 'HIDE CONTROLS \u25BC' : 'SHOW CONTROLS \u25B2'}
      </button>
      {expanded && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hints.map(({ key, action }) => (
              <span
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <KeyBadge label={key} />
                <span style={{ fontFamily: FONT, fontSize: 6, color: COLORS.dim }}>
                  {action}
                </span>
              </span>
            ))}
          </div>
          <span style={{ fontFamily: FONT, fontSize: 6, color: COLORS.gold, textAlign: 'center' }}>
            DEFEAT THE BOSS TO GET THE KEY &bull; UNLOCK THE DOOR &bull; REACH THE EXIT
          </span>
        </>
      )}
    </div>
  );
}

export function HUD({
  players,
  localPlayerId,
  level,
  levelName,
  boss,
  keyState,
  exitTimer,
  phase,
}: HUDProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showBoss = boss && boss.alive && boss.hp > 0;
  const showExitTimer = phase === 'exiting' && exitTimer > 0;
  const keyCollected = keyState.heldBy >= 0;

  return (
    <>
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'linear-gradient(to bottom, #0A0A0Fcc, transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* Level Name */}
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            color: COLORS.text,
          }}
        >
          L{level}: {levelName}
        </span>

        {/* Boss HP (center) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {showBoss && <BossHealthBar boss={boss} />}
        </div>

        {/* Right side: key status + exit timer + settings gear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' }}>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 10,
              color: keyCollected ? COLORS.gold : COLORS.dim,
            }}
          >
            {keyCollected ? '\u{1F511}' : '\u{1F512}'}
          </span>

          {showExitTimer && (
            <span
              style={{
                fontFamily: FONT,
                fontSize: 12,
                color: exitTimer <= 5 ? COLORS.red : COLORS.accent,
              }}
            >
              {exitTimer}s
            </span>
          )}

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Settings"
            style={{
              background: '#1A1A2Acc',
              border: `1px solid ${settingsOpen ? COLORS.accent : COLORS.text}66`,
              color: settingsOpen ? COLORS.accent : COLORS.text,
              fontFamily: FONT,
              fontSize: 16,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            {'\u2699'}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}

      {/* Bottom Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: 'linear-gradient(to top, #0A0A0Fcc, transparent)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            isLocal={player.id === localPlayerId}
            isMultiplayer={players.length > 1}
          />
        ))}

        {/* Controls help strip */}
        <ControlsHelpBar />
      </div>
    </>
  );
}

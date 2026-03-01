import type { GameState, Player, ScoreEntry, Highlight } from './types';

export const SCORE_VALUES = {
  kill: 100,
  goldSmall: 50,
  goldMedium: 100,
  goldLarge: 200,
  bossHit: 25,
  bossKill: 500,
  keyPickup: 100,
  doorUnlock: 200,
  exitOrder: [300, 200, 100, 50, 25],
  pvpKill: 75,
  surviveLevel: 150,
  death: -100,
};

export function buildScoreEntries(state: GameState, totalTimeMs: number): ScoreEntry[] {
  return state.players.map((p) => ({
    playerId: p.id,
    name: p.name,
    classType: p.classType,
    color: p.color,
    totalScore: p.score,
    totalTime: totalTimeMs,
    totalDeaths: p.deaths,
    totalKills: p.kills,
    totalPvpKills: p.pvpKills,
    bossKills: p.bossKills,
    perLevel: [],
  }));
}

export function buildLevelScoreEntries(state: GameState): ScoreEntry[] {
  return state.players.map((p) => ({
    playerId: p.id,
    name: p.name,
    classType: p.classType,
    color: p.color,
    totalScore: p.score,
    totalTime: 0,
    totalDeaths: p.deaths,
    totalKills: p.kills,
    totalPvpKills: p.pvpKills,
    bossKills: p.bossKills,
    perLevel: [
      {
        level: state.level,
        score: p.levelScore,
        exitOrder: p.exitOrder,
        deaths: p.deaths,
      },
    ],
  }));
}

export function calculateHighlights(entries: ScoreEntry[]): Highlight[] {
  if (entries.length === 0) return [];

  const highlights: Highlight[] = [];

  // Most Kills
  const mostKills = entries.reduce((a, b) =>
    a.totalKills > b.totalKills ? a : b,
  );
  if (mostKills.totalKills > 0) {
    highlights.push({
      title: 'Most Kills',
      playerId: mostKills.playerId,
      value: `${mostKills.totalKills} kills`,
    });
  }

  // Boss Slayer
  const bossSlayer = entries.reduce((a, b) =>
    a.bossKills > b.bossKills ? a : b,
  );
  if (bossSlayer.bossKills > 0) {
    highlights.push({
      title: 'Boss Slayer',
      playerId: bossSlayer.playerId,
      value: `${bossSlayer.bossKills}/5 bosses`,
    });
  }

  // Survivor (fewest deaths)
  const survivor = entries.reduce((a, b) =>
    a.totalDeaths < b.totalDeaths ? a : b,
  );
  highlights.push({
    title: 'Survivor',
    playerId: survivor.playerId,
    value: `${survivor.totalDeaths} deaths`,
  });

  // Pacifist
  const pacifist = entries.find((e) => e.totalPvpKills === 0);
  if (pacifist) {
    highlights.push({
      title: 'Pacifist',
      playerId: pacifist.playerId,
      value: '0 PvP kills',
    });
  }

  return highlights;
}

export function awardExitScore(player: Player, exitOrder: number): void {
  const bonus = SCORE_VALUES.exitOrder[exitOrder] ?? 0;
  player.score += bonus;
  player.levelScore += bonus;
  player.exitOrder = exitOrder;
}

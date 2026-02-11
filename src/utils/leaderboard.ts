export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const LEADERBOARD_KEY = 'riftmas-cranks-leaderboard';
const MAX_ENTRIES = 5;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function isHighScore(score: number): boolean {
  const leaderboard = getLeaderboard();
  if (leaderboard.length < MAX_ENTRIES) return true;
  return score > leaderboard[leaderboard.length - 1].score;
}

export function getScoreRank(score: number): number | null {
  const leaderboard = getLeaderboard();
  for (let i = 0; i < leaderboard.length; i++) {
    if (score > leaderboard[i].score) {
      return i + 1;
    }
  }
  if (leaderboard.length < MAX_ENTRIES) {
    return leaderboard.length + 1;
  }
  return null;
}

export function addScore(name: string, score: number): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    name: name.substring(0, 10), // Max 10 characters
    score,
    date: new Date().toLocaleDateString(),
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.score - a.score);
  const trimmed = leaderboard.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch {
    // LocalStorage might be full or unavailable
  }

  return trimmed;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(LEADERBOARD_KEY);
}

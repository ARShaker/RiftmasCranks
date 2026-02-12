import { supabase } from './supabase'

export interface LeaderboardEntry {
  id: string
  player_name: string
  character_name: string
  score: number
  distance: number
  tricks_completed: number
  max_multiplier: number
  trail_reached: string
  created_at: string
}

export interface ScoreSubmission {
  player_name: string
  character_name: string
  score: number
  distance: number
  tricks_completed?: number
  max_multiplier?: number
  trail_reached?: string
}

const MAX_ENTRIES = 10

// Fetch top scores from Supabase
export async function getLeaderboard(limit: number = MAX_ENTRIES): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data || []
}

// Check if score qualifies for top N
export async function isHighScore(score: number, topN: number = MAX_ENTRIES): Promise<boolean> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('score')
    .order('score', { ascending: false })
    .limit(topN)

  if (error || !data) return true // Allow submission on error

  if (data.length < topN) return true

  const lowestTopScore = data[data.length - 1]?.score || 0
  return score > lowestTopScore
}

// Get rank for a score
export async function getScoreRank(score: number): Promise<number | null> {
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .gt('score', score)

  if (error) return null
  return (count || 0) + 1
}

// Submit a new score
export async function addScore(entry: ScoreSubmission): Promise<LeaderboardEntry[] | null> {
  const { error } = await supabase
    .from('leaderboard')
    .insert([{
      player_name: entry.player_name.slice(0, 10),
      character_name: entry.character_name,
      score: entry.score,
      distance: entry.distance,
      tricks_completed: entry.tricks_completed || 0,
      max_multiplier: entry.max_multiplier || 1,
      trail_reached: entry.trail_reached || 'Green'
    }])

  if (error) {
    console.error('Error adding score:', error)
    return null
  }

  // Return updated leaderboard
  return getLeaderboard()
}

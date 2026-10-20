export type LeagueEntry = {
  id: string
  label: string
  rating: number
  games: number
  wins: number
  losses: number
  draws: number
  engineStamp: string
}

export type LeagueMatch = {
  a: string
  b: string
  /** Siegquote von A, 1 Sieg, 0.5 Remis, 0 Niederlage. */
  scoreA: number
  games: number
  seeds: number[]
  /** Wenn gesetzt, ersetzen sie die aus scoreA gerundete Zählung. */
  wins?: number
  losses?: number
  draws?: number
}

const K = 32

function resultCounts(match: LeagueMatch): { wins: number; losses: number; draws: number } {
  const games = Math.max(0, Math.round(match.games))
  if (match.wins != null && match.losses != null && match.draws != null) {
    return { wins: match.wins, losses: match.losses, draws: match.draws }
  }
  if (match.scoreA === 1) return { wins: games, losses: 0, draws: 0 }
  if (match.scoreA === 0) return { wins: 0, losses: games, draws: 0 }
  if (match.scoreA === 0.5) return { wins: 0, losses: 0, draws: games }
  const wins = Math.max(0, Math.min(games, Math.round(match.scoreA * games)))
  return { wins, losses: games - wins, draws: 0 }
}

/** Bradley-Terry: scoreA ist die Siegquote von A. Mehr Spiele bewegen die Zahl stärker, gedeckelt. */
export function updateLeagueRatings(entries: LeagueEntry[], match: LeagueMatch): LeagueEntry[] {
  const map = new Map(entries.map((e) => [e.id, { ...e }]))
  const a = map.get(match.a)
  const b = map.get(match.b)
  if (!a || !b) throw new Error('Liga: unbekannte Teilnehmer-ID.')
  const expected = 1 / (1 + 10 ** ((b.rating - a.rating) / 400))
  const actual = match.scoreA
  const weight = Math.max(1, Math.min(Math.round(match.games) || 1, 8))
  const delta = K * weight * (actual - expected)
  a.rating += delta
  b.rating -= delta
  const counts = resultCounts(match)
  a.games += match.games
  b.games += match.games
  a.wins += counts.wins
  a.losses += counts.losses
  a.draws += counts.draws
  b.wins += counts.losses
  b.losses += counts.wins
  b.draws += counts.draws
  return [...map.values()].sort((x, y) => y.rating - x.rating)
}

export function createDefaultLeague(engineStamp: string): LeagueEntry[] {
  return [
    { id: 'heuristic', label: 'Heuristik (Anker)', rating: 1000, games: 0, wins: 0, losses: 0, draws: 0, engineStamp },
    { id: 'random', label: 'Zufall', rating: 900, games: 0, wins: 0, losses: 0, draws: 0, engineStamp },
  ]
}

export function ratingUncertainty(entry: LeagueEntry): number {
  if (entry.games < 1) return 120
  return Math.max(25, 400 / Math.sqrt(entry.games))
}

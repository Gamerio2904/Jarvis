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
  scoreA: number
  games: number
  seeds: number[]
}

const K = 32

/** Bradley-Terry style update: scoreA is 1 win, 0.5 draw, 0 loss from A's perspective. */
export function updateLeagueRatings(entries: LeagueEntry[], match: LeagueMatch): LeagueEntry[] {
  const map = new Map(entries.map((e) => [e.id, { ...e }]))
  const a = map.get(match.a)
  const b = map.get(match.b)
  if (!a || !b) throw new Error('Liga: unbekannte Teilnehmer-ID.')
  const expected = 1 / (1 + 10 ** ((b.rating - a.rating) / 400))
  const actual = match.scoreA
  const delta = K * (actual - expected)
  a.rating += delta
  b.rating -= delta
  a.games += match.games
  b.games += match.games
  if (actual === 1) {
    a.wins += match.games
    b.losses += match.games
  } else if (actual === 0) {
    b.wins += match.games
    a.losses += match.games
  } else {
    a.draws += match.games
    b.draws += match.games
  }
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

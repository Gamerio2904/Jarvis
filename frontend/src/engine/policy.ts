import type { Candidate } from './route-types.ts'

export const SCORE_MIN = 0.45
export const SCORE_MARGIN = 0.12

const COST: Record<string, number> = {
  device: 0.05,
  write: 0.02,
  read: 0,
}

export type PolicyPick =
  | { kind: 'run'; id: string; score: number }
  | { kind: 'ask'; a: string; b: string }
  | { kind: 'none' }

export function pickPolicy(cands: Candidate[]): PolicyPick {
  const ranked = [...cands]
    .filter((c) => c.score >= SCORE_MIN)
    .sort((a, b) => b.score - a.score)
  if (!ranked.length) return { kind: 'none' }
  const top = ranked[0]
  const second = ranked[1]
  if (second && top.score - second.score < SCORE_MARGIN && top.id !== second.id) {
    return { kind: 'ask', a: top.id, b: second.id }
  }
  return { kind: 'run', id: top.id, score: top.score }
}

export function withCost(cands: Candidate[]): Candidate[] {
  return cands.map((c) => ({
    ...c,
    score: Math.max(0, c.score - (COST[c.sideEffect] || 0)),
  }))
}

export function withPrior(cands: Candidate[], lastTool: string, followish: boolean): Candidate[] {
  if (!lastTool || !followish) return cands
  return cands.map((c) => (c.id === lastTool ? { ...c, score: Math.min(0.99, c.score + 0.14) } : c))
}

export function isFollowish(text: string): boolean {
  const t = text.trim()
  if (t.length > 48) return false
  return /^(und\s+)?(lauter|leiser|stopp|halt|pause|ok|okay|das\s+zweite|morgen|heute|nochmal)/i.test(t)
}

export const TOOL_LABEL: Record<string, string> = {
  weather: 'Wetter',
  calendar: 'Kalender',
  tv: 'Fernseher',
  reminder: 'Erinnerung',
  timer: 'Timer',
  alarm: 'Wecker',
  brief: 'Tageslage',
  film: 'Film',
  fuel: 'Tanke',
  drive: 'Fahrmodus',
  shopping: 'Einkauf',
  memory: 'Gedächtnis',
  news: 'Nachrichten',
  poi: 'Ort in der Nähe',
  transit: 'Bahn',
  holiday: 'Feiertag',
  warn: 'Unwetter',
  ferien: 'Ferien',
  fx: 'Kurs',
  food: 'Lebensmittel',
  library: 'Buch',
  sport: 'Sport',
  sky: 'Himmel',
  nature: 'Natur',
  flights: 'Flug',
  law: 'Gesetz',
  haushalt: 'Haushalt',
  sensors: 'Sensor',
  chess: 'Schach',
}

export function askReply(a: string, b: string): string {
  const left = TOOL_LABEL[a] || a
  const right = TOOL_LABEL[b] || b
  return `${left} oder ${right}? Ein Wort reicht.`
}

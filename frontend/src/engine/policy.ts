import type { Candidate } from './route-types.ts'

export const SCORE_MIN = 0.45
export const SCORE_MARGIN = 0.12

/**
 * Scores sind Rangwerte, keine Wahrscheinlichkeiten. Die Decke liegt deutlich
 * über dem Parser-Band, damit eine gewollte Konflikt-Vorfahrt nicht wegsättigt
 * und der Abstand zum Zweiten erhalten bleibt.
 */
export const SCORE_CEIL = 4

const COST: Record<string, number> = {
  device: 0.05,
  write: 0.02,
  read: 0,
}

/**
 * Feste Vorfahrt bei exaktem Gleichstand — engster Auslöser zuerst, breitester
 * zuletzt. Nicht gelistete Agenten sind gleichrangig und fragen weiter zurück.
 */
const TIE_ORDER = [
  'wont',
  'identity',
  'hud',
  'app',
  'face',
  'backup',
  'trace',
  'doc',
  'desk',
  'pack',
  'teach',
  'blitzer',
  'taxi',
  'chat-folder',
  'watch-price',
  'amazon',
  'digest',
  'recall',
  'timer',
  'alarm',
  'calendar',
  'reminder',
  'brief',
  'outlook',
  'ferien',
  'holiday',
  'fuel',
  'transit',
  'poi',
  'warn',
  'fx',
  'sport',
  'tv',
  'film',
  'drive',
  'maps',
]

const TIE_RANK: Record<string, number> = Object.fromEntries(TIE_ORDER.map((id, i) => [id, i]))

/** Kleiner ist Vorfahrt. Unbekannte Agenten teilen den letzten Rang. */
export function tieRank(id: string): number {
  const n = TIE_RANK[id]
  return n == null ? TIE_ORDER.length : n
}

export type PolicyPick =
  | { kind: 'run'; id: string; score: number }
  | { kind: 'ask'; a: string; b: string }
  | { kind: 'none' }

/**
 * Gleichstand darf keine Rückfrage werden. Ein Parser-Treffer ist deterministisch,
 * also entscheidet bei identischem Score die feste Reihenfolge — nicht der Zufall
 * der Katalog-Position. Nur echte Gleichrangigkeit fragt zurück.
 */
const TIE_EPS = 1e-6

/** Schwelle zählt den Parse-Score, Kosten verschieben nur die Reihenfolge. */
function eligible(c: Candidate): boolean {
  return (c.base ?? c.score) >= SCORE_MIN
}

export function pickPolicy(cands: Candidate[]): PolicyPick {
  const ranked = cands
    .filter(eligible)
    .sort((a, b) => b.score - a.score || tieRank(a.id) - tieRank(b.id) || a.id.localeCompare(b.id))
  if (!ranked.length) return { kind: 'none' }
  const top = ranked[0]
  const second = ranked[1]
  if (second && top.id !== second.id && top.score - second.score < SCORE_MARGIN) {
    const exactTie = top.score - second.score < TIE_EPS
    const ranksDiffer = tieRank(top.id) !== tieRank(second.id)
    if (!exactTie || !ranksDiffer) return { kind: 'ask', a: top.id, b: second.id }
  }
  return { kind: 'run', id: top.id, score: top.score }
}

export function withCost(cands: Candidate[]): Candidate[] {
  return cands.map((c) => ({
    ...c,
    base: c.base ?? c.score,
    score: c.score - (COST[c.sideEffect] || 0),
  }))
}

export function withPrior(cands: Candidate[], lastTool: string, followish: boolean): Candidate[] {
  if (!lastTool || !followish) return cands
  return cands.map((c) => (c.id === lastTool ? { ...c, score: Math.min(SCORE_CEIL, c.score + 0.14) } : c))
}

export function parserScore(text: string, extra = 0): number {
  const n = text.trim().length
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const brevity = n <= 24 ? 0.14 : n <= 48 ? 0.08 : n <= 80 ? 0.02 : -0.08
  const tight = words <= 4 ? 0.06 : words <= 8 ? 0.02 : 0
  return Math.min(0.98, Math.max(0.45, 0.58 + brevity + tight + extra))
}

export function isFollowish(text: string): boolean {
  const t = text.trim()
  if (t.length > 48) return false
  if (/^(und\s+)?(lauter|leiser|stopp|halt|pause|ok|okay|das\s+zweite|morgen|heute|nochmal)/i.test(t)) return true
  if (/^noch\s*mal(?:s)?(?:\s+bitte)?[.!?]*$/i.test(t)) return true
  if (/^(wieder|erneut)(?:\s+bitte)?[.!?]*$/i.test(t)) return true
  if (/^(und\s+)?(morgen|übermorgen|gestern)[?.!]*$/i.test(t)) return true
  if (/^(und\s+)?(benzin|e10|öl|warum|dollar)[?.!]*$/i.test(t)) return true
  return false
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
  hud: 'Lage',
  trace: 'Traceroute',
  digest: 'Gespräch',
  outlook: 'Weltlage',
  taxi: 'Taxi',
  interrupt: 'Hinweis',
  backup: 'Hausstand',
  face: 'Gesicht',
  blitzer: 'Blitzer',
  'chat-folder': 'Ordner',
  'watch-price': 'Preiswache',
  amazon: 'Amazon Music',
  recall: 'Gedächtnis',
}

export function askReply(a: string, b: string): string {
  const left = TOOL_LABEL[a] || a
  const right = TOOL_LABEL[b] || b
  return `${left} oder ${right}? Ein Wort reicht.`
}

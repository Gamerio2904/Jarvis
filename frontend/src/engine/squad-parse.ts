import { normalizeUtterance } from './utterance.ts'

export type SquadIntent =
  | { kind: 'analyze' }
  | { kind: 'year'; year: number }
  | { kind: 'pick'; name: string }
  | { kind: 'cards' }

const ANALYZE =
  /\b(mannschaft|aufstellung|kader|squad|fc\s*26|fifa\s*karten|karrier(?:e|emodus)|wer\s+fehlt)\b/i
const YEAR = /(?:jahr|karrierejahr|saison)\s*(?:ist\s+)?(\d{4})|(\d{4})\s*(?:bin\s+ich|spiele\s+ich)|ich\s+bin\s+(?:im\s+jahr\s+)?(\d{4})/i

export function parseSquadIntent(text: string): SquadIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  const y = YEAR.exec(t)
  if (y) {
    const year = Number(y[1] || y[2] || y[3])
    if (year >= 2025 && year <= 2040) return { kind: 'year', year }
  }
  if (/^\s*(?:zeig(?:e)?|öffne)\s+(?:die\s+)?(?:karten|fifa\s*karten|spieler)\s*[.!?]*$/i.test(t)) {
    return { kind: 'cards' }
  }
  if (ANALYZE.test(t)) return { kind: 'analyze' }
  return null
}

export function parseSquadPick(text: string, names: string[]): string | null {
  const t = normalizeUtterance(text.trim()).toLowerCase()
  if (!t || t.length > 40) return null
  for (const name of names) {
    const n = name.toLowerCase()
    if (t === n || t.includes(n) || n.includes(t)) return name
  }
  return null
}

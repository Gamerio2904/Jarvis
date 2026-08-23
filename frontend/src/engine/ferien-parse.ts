import { landFromText } from './land-de.ts'
import { normalizeUtterance } from './utterance.ts'

export type FerienIntent = { kind: 'now' | 'next'; land?: string }

export function parseFerienIntent(text: string): FerienIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (!/\b(ferien|schulferien|unterrichtsfrei)\b/i.test(t)) return null
  if (/\b(feiertag|wecker|timer|termin)\b/i.test(t)) return null
  const land = landFromText(t)
  const next = /\b(nächste|wann|kommende)\b/i.test(t)
  return { kind: next ? 'next' : 'now', land: land?.api }
}

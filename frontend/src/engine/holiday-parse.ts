import { normalizeUtterance } from './utterance.ts'

export type HolidayIntent = { kind: 'today' | 'tomorrow' | 'next' }

export function parseHolidayIntent(text: string): HolidayIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 120) return null
  if (!/\b(feiertag(?:e)?|gesetzlicher\s+feiertag)\b/i.test(t) && !/\bist\s+(?:heute|morgen)\s+frei\b/i.test(t)) {
    return null
  }
  if (/\b(wecker|timer|termin|geburtstag)\b/i.test(t)) return null
  if (/\b(nächste[rn]?|wann\s+ist)\b/i.test(t)) return { kind: 'next' }
  if (/\bmorgen\b/i.test(t)) return { kind: 'tomorrow' }
  return { kind: 'today' }
}

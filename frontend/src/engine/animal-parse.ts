import { normalizeUtterance } from './utterance.ts'

export type AnimalIntent = { kind: 'id'; query?: string }

const ANIMAL = /\b(vogel|vögel|tier|tierart|xeno-?canto|gesang|welcher\s+vogel)\b/i
const WHAT = /\b(welcher\s+vogel\s+ist\s+das|was\s+ist\s+das\s+für\s+ein\s+(?:vogel|tier))\b/i

export function parseAnimalIntent(text: string): AnimalIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(pflanze|produkt|buch|flugzeug|iss)\b/i.test(t)) return null
  if (!ANIMAL.test(t) && !WHAT.test(t)) return null
  const q = t
    .replace(WHAT, '')
    .replace(/\b(welcher|was\s+ist|vogel|vögel|tier|tierart|gesang)\b/gi, '')
    .replace(/[?.!]+/g, '')
    .trim()
  return { kind: 'id', query: q || undefined }
}

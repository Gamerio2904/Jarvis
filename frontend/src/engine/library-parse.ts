import { normalizeUtterance } from './utterance.ts'

export type LibraryIntent = { kind: 'lookup'; query?: string }

const BOOK = /\b(buch|bücher|open\s+library|isbn|autor|roman)\b/i
const WHAT = /\bwas\s+ist\s+das\s+für\s+ein\s+buch\b/i

export function parseLibraryIntent(text: string): LibraryIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(produkt|pflanze|vogel|fernseher|film)\b/i.test(t)) return null
  if (!BOOK.test(t) && !WHAT.test(t)) return null
  const q = t
    .replace(WHAT, '')
    .replace(/\b(was\s+ist|buch|bücher|open\s+library|isbn|autor|roman|titel)\b/gi, '')
    .replace(/[?.!]+/g, '')
    .trim()
  return { kind: 'lookup', query: q || undefined }
}

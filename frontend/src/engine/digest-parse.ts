import { normalizeUtterance } from './utterance.ts'

export type DigestIntent = { kind: 'summary' } | { kind: 'note'; body?: string }

export function parseDigestIntent(text: string): DigestIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 200) return null
  if (
    /\b(fass(?:e)?\s+das\s+gespräch\s+zusammen|zusammenfassen|learnings?|was\s+lag\s+auf\s+dem\s+tisch|gespräch\s+nachbereiten)\b/i.test(
      t,
    )
  ) {
    return { kind: 'summary' }
  }
  const note = /^\s*(?:sprachnotiz|notiz\s+aus\s+sprache)\s*[:-]?\s*(.*)$/i.exec(t)
  if (note) return { kind: 'note', body: note[1].trim() }
  return null
}

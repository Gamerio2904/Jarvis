import { normalizeUtterance } from './utterance.ts'

export function parseRecallIntent(text: string): string | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/^\s*was\s+weißt\s+du\s+über\s+mich\b/i.test(t)) return null
  const a = /^\s*was\s+weißt\s+du\s+über\s+(?:den\s+|die\s+|das\s+)?(.+?)\s*$/i.exec(t)
  if (a) return a[1].replace(/[.!?]+$/g, '').trim()
  const b = /^\s*wo\s+stand\s+das\s+mit\s+(?:der|dem|den)?\s*(.+?)\s*$/i.exec(t)
  if (b) return b[1].replace(/[.!?]+$/g, '').trim()
  const c = /^\s*erinnerst\s+du\s+dich\s+an\s+(.+?)\s*$/i.exec(t)
  if (c) {
    const q = c[1].replace(/[.!?]+$/g, '').trim()
    if (/^mich$/i.test(q)) return null
    return q
  }
  return null
}

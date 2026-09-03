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
  if (/\b(?:wlan|wifi|fritzbox|router)\b/i.test(t)) {
    const d = /^\s*was\s+ist\s+(?:mein\s+)?(.+?)\s*$/i.exec(t)
    if (d) return d[1].replace(/[.!?]+$/g, '').trim()
  }
  if (/\b(?:japan|tokyo|reise)/i.test(t) && /\b(?:wollte\s+ich|welche\s+reisen|plane\s+ich)\b/i.test(t)) {
    return t.replace(/[.!?]+$/g, '').trim()
  }
  return null
}

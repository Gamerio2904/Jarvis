import { normalizeUtterance } from './utterance.ts'

const SKIP = /^(ja|nein|ok|okay|danke|bitte|gut|jo|passt|mach)\s*[.!]?\s*$/i
const FOLLOW_UP =
  /^(und\s+)?(lösch(e|en)?(\s+das)?|das\s+löschen|vergiss?\s+das|und\s+um\s+\d{1,2}([:.]\d{2})?(\s+uhr)?|und\s+morgen\??|morgen\s+auch)\s*[.?!]?$/i

export function shouldRefreshTitle(text: string): boolean {
  const t = text.trim()
  if (!t || SKIP.test(t)) return false
  if (FOLLOW_UP.test(t)) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length < 2 && t.length < 8) return false
  return true
}

export function titleFromUser(text: string): string {
  const t = normalizeUtterance(text).replace(/\s+/g, ' ').trim()
  if (t.length <= 32) return t
  const cut = t.slice(0, 32)
  const sp = cut.lastIndexOf(' ')
  return (sp > 16 ? cut.slice(0, sp) : cut).trim()
}

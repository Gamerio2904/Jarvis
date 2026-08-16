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
  return text.trim().replace(/\s+/g, ' ').slice(0, 42)
}

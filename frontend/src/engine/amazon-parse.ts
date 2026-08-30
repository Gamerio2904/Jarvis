import { normalizeUtterance } from './utterance.ts'

export function parseAmazonMusicIntent(text: string): boolean {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return false
  if (/\b(?:amazon\s+music|amazon\s+musik|amzn\s+music)\b/i.test(t)) return true
  if (/\bamazon\b/i.test(t) && /\b(?:spiel|spiele|musik|song|lied)\b/i.test(t)) return true
  return false
}

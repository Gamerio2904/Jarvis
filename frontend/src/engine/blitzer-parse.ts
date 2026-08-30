import { normalizeUtterance } from './utterance.ts'

export type BlitzerIntent = { kind: 'ask'; want: 'camera' | 'works' | 'both' }

export function parseBlitzerIntent(text: string): BlitzerIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const cam = /\b(?:blitzer|radar(?:falle)?|geschwindigkeit(?:s)?kontrolle|speed.?camera)\b/i.test(t)
  const works = /\b(?:baustelle(?:n)?|sperrung(?:en)?)\b/i.test(t)
  if (!cam && !works) return null
  if (cam && works) return { kind: 'ask', want: 'both' }
  if (works) return { kind: 'ask', want: 'works' }
  return { kind: 'ask', want: 'camera' }
}

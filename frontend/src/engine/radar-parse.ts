import { normalizeUtterance } from './utterance.ts'

export type RadarIntent = { kind: 'radar' | 'works' | 'ahead' }

const RADAR = /\b(blitzer|radar(?:falle|warnung)?|geschwindigkeitskontrolle|blitz(?:er)?warnung)\b/i
const WORKS = /\b(baustelle|straßenbau|strassenbau|sperrung|vollsperrung|mobile(?:n)?\s+baustelle)\b/i
const AHEAD = /\b(vor\s+mir|vor\s+uns|auf\s+der\s+strecke|voraus)\b/i

export function parseRadarIntent(text: string): RadarIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  const radar = RADAR.test(t)
  const works = WORKS.test(t)
  if (!radar && !works) return null
  if (AHEAD.test(t) || /\b(gibt.?s|gibt\s+es|liegt|kommt)\b/i.test(t)) {
    if (works && !radar) return { kind: 'works' }
    return { kind: 'ahead' }
  }
  if (works && !radar) return { kind: 'works' }
  return { kind: 'radar' }
}

export function mentionsMobileRadar(text: string): boolean {
  return /\b(mobil(?:e[rn]?)?|anhänger|blitzeranhänger)\b/i.test(text)
}

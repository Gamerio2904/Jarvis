import { parseDeviceIntent } from './device-parse.ts'
import { parsePcIntent } from './pc-parse.ts'
import { parseDriveIntent } from './drive-parse.ts'
import { parseFilmIntent } from './film-parse.ts'
import { parseFuelIntent } from './fuel-parse.ts'
import { parseHereIntent } from './here-parse.ts'
import { parsePlaceNav } from './places-parse.ts'
import { parsePoiIntent } from './poi-parse.ts'
import { parseSpotifyIntent } from './spotify-parse.ts'
import { parseTvIntent, parseTvWatch } from './tv-parse.ts'
import { normalizeUtterance } from './utterance.ts'

function commandScore(text: string): number {
  const t = normalizeUtterance(text) || text
  let n = 0
  if (parseTvWatch(t)) n += 6
  if (parseFilmIntent(t)) n += 6
  if (parseTvIntent(t)) n += 5
  if (parseSpotifyIntent(t)) n += 5
  if (parseHereIntent(t)) n += 6
  if (parseFuelIntent(t)) n += 6
  if (parsePoiIntent(t)) n += 6
  if (parseDriveIntent(t, false)) n += 5
  if (parseDeviceIntent(t)) n += 5
  if (parsePcIntent(t)) n += 6
  if (parsePlaceNav(t)) n += 3
  return n + Math.min(t.length, 48) / 48
}

let extraNames: string[] = []

export function setHeardNames(names: string[]) {
  extraNames = names.map((n) => n.trim()).filter((n) => n.length >= 2)
}

/** Pick the STT candidate that looks most like a Jarvis command. */
export function pickHeard(primary: string, alts: string[] = []): string {
  const raw = [primary, ...alts].map((s) => String(s || '').trim()).filter(Boolean)
  const cands: string[] = []
  for (const s of raw) {
    const n = normalizeUtterance(s)
    if (n && !cands.includes(n)) cands.push(n)
    if (s && !cands.includes(s)) cands.push(s)
  }
  if (!cands.length) return primary.trim()
  let best = cands[0]
  let bestScore = -1
  for (const t of cands) {
    let s = commandScore(t)
    for (const name of extraNames) {
      if (name && t.toLowerCase().includes(name.toLowerCase())) s += 4
    }
    if (s > bestScore) {
      best = t
      bestScore = s
    }
  }
  return best
}

import { parseDriveIntent } from './drive-parse.ts'
import { parseFuelIntent } from './fuel-parse.ts'
import { parseHereIntent } from './here-parse.ts'
import { parsePlaceNav } from './places-parse.ts'
import { parseSpotifyIntent } from './spotify-parse.ts'
import { parseTvIntent, parseTvWatch } from './tv-parse.ts'
import { normalizeUtterance } from './utterance.ts'

function commandScore(text: string): number {
  const t = normalizeUtterance(text) || text
  let n = 0
  if (parseTvWatch(t)) n += 6
  if (parseTvIntent(t)) n += 5
  if (parseSpotifyIntent(t)) n += 5
  if (parseHereIntent(t)) n += 6
  if (parseFuelIntent(t)) n += 6
  if (parseDriveIntent(t, false)) n += 5
  if (parsePlaceNav(t)) n += 3
  return n + Math.min(t.length, 48) / 48
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
    const s = commandScore(t)
    if (s > bestScore) {
      best = t
      bestScore = s
    }
  }
  return best
}

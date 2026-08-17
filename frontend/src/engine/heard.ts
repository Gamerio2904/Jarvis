import { parseDriveIntent } from './drive-parse.ts'
import { parsePlaceNav } from './places-parse.ts'
import { parseSpotifyIntent } from './spotify-parse.ts'
import { parseTvIntent, parseTvWatch } from './tv-parse.ts'
import { normalizeUtterance } from './utterance.ts'

/** Pick the STT candidate that looks most like a Jarvis command. */
export function pickHeard(primary: string, alts: string[] = []): string {
  const raw = [primary, ...alts].map((s) => String(s || '').trim()).filter(Boolean)
  const cands: string[] = []
  for (const s of raw) {
    const n = normalizeUtterance(s)
    if (n && !cands.includes(n)) cands.push(n)
    if (s && !cands.includes(s)) cands.push(s)
  }
  for (const t of cands) {
    if (parseDriveIntent(t, true)) return t
    if (parsePlaceNav(t)) return t
    if (parseSpotifyIntent(t)) return t
    if (parseTvWatch(t)) return t
    if (parseTvIntent(t)) return t
  }
  return cands[0] || primary.trim()
}

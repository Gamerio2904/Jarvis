import { normalizeUtterance } from './utterance.ts'

export type FlightIntent = { kind: 'overhead' }

const ASK =
  /\b(was\s+fliegt\s+da|flüge\s+über|flugzeug\s+über|opensky|ads-?b|überflug|was\s+ist\s+das\s+für\s+ein\s+flugzeug)\b/i

export function parseFlightIntent(text: string): FlightIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (/\b(iss|raumstation|vogel|mond)\b/i.test(t)) return null
  if (!ASK.test(t) && !/\b(flugzeug|flieger)\b/i.test(t)) return null
  if (/\b(flugzeug|flieger|opensky|überflug|was\s+fliegt)\b/i.test(t)) return { kind: 'overhead' }
  return null
}

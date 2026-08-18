import { isFuelPlace } from './fuel-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type PoiKind = 'pharmacy' | 'bakery' | 'parking' | 'supermarket'

export type PoiIntent = { kind: PoiKind | 'ask' }

const NEAREST = /\b(?:nächste[nrs]?|nächster|zum\s+nächsten|zur\s+nächsten)\b/i
const POI_WORD = /\b(?:poi|pol)\b/i
const GO =
  /\b(?:fahr(?:e)?(?:\s+mich)?|bring(?:e)?(?:\s+mich)?|navigier(?:e)?|zeig(?:e)?|wo\s+ist|öffne)\b/i

const KINDS: Array<{ kind: PoiKind; re: RegExp }> = [
  { kind: 'pharmacy', re: /\bapotheke(?:n)?\b/i },
  { kind: 'bakery', re: /\bb(?:ä|ae|a)cker(?:ei)?\b/i },
  { kind: 'parking', re: /\bpark(?:platz|plätze|haus|häuser|en)\b/i },
  { kind: 'supermarket', re: /\b(?:supermarkt|discounter|aldi|lidl|rewe|edeka)\b/i },
]

export function parsePoiIntent(text: string): PoiIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (isFuelPlace(t)) return null
  if (/\b(?:song|titel|track|lied)\b/i.test(t)) return null
  const typed = detectKind(t)
  if (POI_WORD.test(t)) {
    if (NEAREST.test(t) || GO.test(t) || /^\s*(?:nächste[nrs]?\s+)?(?:poi|pol)\s*[.!?]*$/i.test(t)) {
      return { kind: typed || 'ask' }
    }
  }
  if (!typed) return null
  if (NEAREST.test(t) || GO.test(t) || /^\s*(?:zur|zum)\s+\S+/i.test(t)) return { kind: typed }
  return null
}

export function poiLabel(kind: PoiKind | 'ask'): string {
  if (kind === 'pharmacy') return 'Apotheke'
  if (kind === 'bakery') return 'Bäcker'
  if (kind === 'parking') return 'Parkplatz'
  if (kind === 'supermarket') return 'Supermarkt'
  return 'Ort'
}

function detectKind(t: string): PoiKind | null {
  for (const row of KINDS) {
    if (row.re.test(t)) return row.kind
  }
  return null
}

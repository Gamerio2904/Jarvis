import { isFuelPlace } from './fuel-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type PoiKind = 'pharmacy' | 'bakery' | 'parking' | 'supermarket' | 'chemist' | 'shop'

export type PoiIntent = { kind: PoiKind | 'ask'; hours: boolean }

const NEAREST = /\b(?:nächste[nrs]?|nächster|zum\s+nächsten|zur\s+nächsten)\b/i
const POI_WORD = /\b(?:poi|pol)\b/i
const GO =
  /\b(?:fahr(?:e)?(?:\s+mich)?|bring(?:e)?(?:\s+mich)?|navigier(?:e)?|zeig(?:e)?|wo\s+ist|öffne)\b/i
const HOURS =
  /öffnungszeiten|geschäftszeiten|\bgeöffnet\b|\b(?:hat|haben|habt)\b.{0,48}\b(?:auf|offen)\b|\b(?:ist|sind)\b.{0,40}\b(?:auf|offen|geöffnet|zu|geschlossen)\b|\bwann\b.{0,40}\b(?:auf|offen|zu)\b|\bnoch\s+auf\b|\bjetzt\s+(?:auf|offen)\b/i
const HOURS_FOLLOW =
  /^\s*(?:öffnungszeiten|hat\s+(?:die|der|das)?\s*(?:auf|offen)|hat\s+auf|ist\s+(?:die|der|das)?\s*(?:auf|offen|zu|geschlossen)|noch\s+auf|jetzt\s+(?:auf|offen)|geöffnet)\s*[.!?]*$/i

const KINDS: Array<{ kind: PoiKind; re: RegExp }> = [
  { kind: 'pharmacy', re: /\bapotheke(?:n)?\b/i },
  { kind: 'bakery', re: /\bb(?:ä|ae|a)cker(?:ei)?\b/i },
  { kind: 'parking', re: /\bpark(?:platz|plätze|haus|häuser|en)\b/i },
  { kind: 'supermarket', re: /\b(?:supermarkt|discounter|aldi|lidl|rewe|edeka)\b/i },
  { kind: 'chemist', re: /\b(?:drogerie|dm|rossmann)\b/i },
  { kind: 'shop', re: /\b(?:laden|geschäft|kiosk|spät[ie]|späti)\b/i },
]

export function parsePoiIntent(text: string, lastKind?: PoiKind | null): PoiIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (isFuelPlace(t)) return null
  if (/\b(?:song|titel|track|lied)\b/i.test(t)) return null
  const typed = detectKind(t)
  const hours = HOURS.test(t)
  if (POI_WORD.test(t)) {
    if (NEAREST.test(t) || GO.test(t) || hours || /^\s*(?:nächste[nrs]?\s+)?(?:poi|pol)\s*[.!?]*$/i.test(t)) {
      return { kind: typed || 'ask', hours: hours && !NEAREST.test(t) && !GO.test(t) }
    }
  }
  if (typed) {
    if (NEAREST.test(t) || GO.test(t) || /^\s*(?:zur|zum)\s+\S+/i.test(t)) {
      return { kind: typed, hours: false }
    }
    if (hours) return { kind: typed, hours: true }
  }
  if (hours && lastKind && HOURS_FOLLOW.test(t) && !typed && !NEAREST.test(t)) {
    return { kind: lastKind, hours: true }
  }
  if (/^\s*öffnungszeiten\s*[.!?]*$/i.test(t)) return { kind: lastKind || 'ask', hours: true }
  return null
}

export function poiLabel(kind: PoiKind | 'ask'): string {
  if (kind === 'pharmacy') return 'Apotheke'
  if (kind === 'bakery') return 'Bäcker'
  if (kind === 'parking') return 'Parkplatz'
  if (kind === 'supermarket') return 'Supermarkt'
  if (kind === 'chemist') return 'Drogerie'
  if (kind === 'shop') return 'Laden'
  return 'Ort'
}

function detectKind(t: string): PoiKind | null {
  for (const row of KINDS) {
    if (row.re.test(t)) return row.kind
  }
  return null
}

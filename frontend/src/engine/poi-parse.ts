import { isFuelPlace } from './fuel-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type PoiKind = 'pharmacy' | 'bakery' | 'parking' | 'supermarket' | 'chemist' | 'shop' | 'cafe'

export type PoiIntent = { kind: PoiKind | 'ask'; hours: boolean; nav?: boolean }

const NEAREST = /\b(?:nächste[nrs]?|nächster|zum\s+nächsten|zur\s+nächsten)\b/i
const NEARBY = /\bin\s+der\s+nähe\b/i
const BREAKFAST =
  /(?<!\p{L})(?:frühstück(?:en)?|fruehstueck(?:en)?|breakfast)(?!\p{L})/iu
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
  { kind: 'cafe', re: /(?<!\p{L})(?:cafés?|cafes?|kaffeehaus|kaffeehäuser)(?!\p{L})/iu },
]

export function parsePoiIntent(text: string, lastKind?: PoiKind | null): PoiIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (isFuelPlace(t)) return null
  if (/\b(?:song|titel|track|lied)\b/i.test(t)) return null
  if (namedCafe(t)) return null
  const typed = detectKind(t)
  const hours = HOURS.test(t)
  const near = NEAREST.test(t) || NEARBY.test(t)
  if (BREAKFAST.test(t) && !typed) {
    return { kind: 'cafe', hours, nav: near || GO.test(t) }
  }
  if (POI_WORD.test(t)) {
    if (near || GO.test(t) || hours || /^\s*(?:nächste[nrs]?\s+)?(?:poi|pol)\s*[.!?]*$/i.test(t)) {
      return { kind: typed || 'ask', hours: hours && !near && !GO.test(t), nav: !hours }
    }
  }
  if (typed) {
    if (near || GO.test(t) || /^\s*(?:zur|zum)\s+\S+/i.test(t)) {
      return { kind: typed, hours: false, nav: true }
    }
    if (hours) return { kind: typed, hours: true, nav: false }
    if (typed === 'cafe') return { kind: 'cafe', hours: false, nav: false }
  }
  if (hours && lastKind && HOURS_FOLLOW.test(t) && !typed && !near) {
    return { kind: lastKind, hours: true, nav: false }
  }
  if (/^\s*öffnungszeiten\s*[.!?]*$/i.test(t)) return { kind: lastKind || 'ask', hours: true, nav: false }
  return null
}

export function poiLabel(kind: PoiKind | 'ask'): string {
  if (kind === 'pharmacy') return 'Apotheke'
  if (kind === 'bakery') return 'Bäcker'
  if (kind === 'parking') return 'Parkplatz'
  if (kind === 'supermarket') return 'Supermarkt'
  if (kind === 'chemist') return 'Drogerie'
  if (kind === 'shop') return 'Laden'
  if (kind === 'cafe') return 'Café'
  return 'Ort'
}

function namedCafe(t: string): boolean {
  return /(?<!\p{L})caf[eé]s?\s+(?!in\s+der\s+nähe|hier|jetzt|bitte|auf|offen|in\s+der)\S{2,}/iu.test(t)
}

function detectKind(t: string): PoiKind | null {
  for (const row of KINDS) {
    if (row.re.test(t)) return row.kind
  }
  return null
}

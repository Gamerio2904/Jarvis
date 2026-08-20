import { isFuelPlace } from './fuel-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type PlaceWrite = { name: string; place: string }
export type PlaceRecall = { name: string }
export type TravelMode = 'driving' | 'walking' | 'transit'

export type PlaceNav =
  | { kind: 'navigate'; query: string; via: 'zu' | 'nach'; mode?: TravelMode }
  | { kind: 'list' }
  | { kind: 'call'; query: string }
  | { kind: 'sms'; query: string; body: string }
  | { kind: 'phone'; name: string; number: string }
  | { kind: 'alias'; name: string; alias: string }

const HOME = /^(zuhause|zu\s*hause|hause|heim|wohnung)$/i
const REL =
  /^(freundin|freund|bro|mama|papa|mutter|vater|oma|opa|eltern|zahnarzt|arzt|ärztin|praxis|chef|chefin|schwester|bruder|kollege|kollegin|arbeit|arbeitsplatz|büro|buero)$/i
const PEOPLE_LIST = /^(personen|leute|alle|orte|kontakte)$/i
const ART =
  /^(der|die|das|dem|den|des|ein|eine|einer|einem|einen|meine|mein|meiner|meinen|unsere|unser)\s+/i

const NAV =
  /^\s*(?:fahr(?:e)?\s+mich|fähr(?:e)?\s+mich|bring(?:e)?\s+mich|navigier(?:e)?|route|zeig(?:e)?\s+(?:mir\s+)?den\s+weg)\s+(?:(zu(?:r|m)?)|(nach))\s+(.+?)\s*$/i
const NAV_HOME =
  /^\s*(?:fahr(?:e)?\s+mich|fähr(?:e)?\s+mich|bring(?:e)?\s+mich|navigier(?:e)?|route)\s+(?:nach\s+)?(?:hause|heim|zuhause)\s*$/i
const LIST =
  /^\s*(?:(?:fahr(?:e)?\s+mich\s+zu|route\s+zu)\s+(?:den\s+)?personen|wen\s+kennst\s+du|wo\s+wohnen\s+(?:die|sie)|zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?orte|personen\s+mit\s+ort)\s*[.?!]?\s*$/i
const RECALL =
  /^\s*wo\s+(?:wohnt|ist|liegt)\s+(?:denn\s+)?(.+?)\s*[.?!]?\s*$/i
const WRITE_WOHNT =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?(.+?)\s+wohnt\s+(?:in|auf|an)\s+(.+?)\s*$/i
const FORGET_PLACE =
  /^\s*(?:die\s+|der\s+)?([\wÄÖÜäöüß.-]{2,40})\s+(?:wohnt|lebt)\s+nicht\s+mehr(?:\s+in\s+.+)?\s*[.!]?\s*$/i
const WRITE_ICH =
  /^\s*ich\s+wohne\s+(?:in|auf|an)\s+(.+?)\s*$/i
const WRITE_ICH_ARBEITE =
  /^\s*ich\s+arbeite\s+(?:in|auf|an)\s+(.+?)\s*$/i
const WRITE_IST =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?(?:mein(?:e[rn]?)?\s+)?(.+?)\s+(?:ist|liegt)\s+in\s+(.+?)\s*$/i
const WRITE_DASH =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?([A-ZÄÖÜ][\wÄÖÜäöüß.-]{1,24})\s+[—–-]\s+(.+?)\s*$/i

export function normalizePlaceName(raw: string): string {
  let t = raw.trim().replace(/[.!?,;:]+$/g, '')
  t = t.replace(ART, '').trim()
  t = t.replace(/^(zu(?:r|m)?|nach)\s+/i, '').trim()
  if (HOME.test(t)) return 'zuhause'
  const low = t.toLowerCase()
  if (/^(arbeitsplatz|büro|buero)$/i.test(low)) return low === 'arbeitsplatz' ? 'arbeit' : 'büro'
  return low
}

export function displayPlaceName(key: string): string {
  if (key === 'zuhause') return 'Zuhause'
  if (key === 'arbeit' || key === 'arbeitsplatz') return 'Arbeit'
  if (key === 'büro' || key === 'buero') return 'Büro'
  if (key === 'eltern') return 'Eltern'
  if (key === 'freundin') return 'Freundin'
  if (key === 'bro') return 'Bro'
  return key.replace(/^\w/, (c) => c.toUpperCase())
}

export function isHomeName(name: string): boolean {
  return HOME.test(normalizePlaceName(name))
}

export function isRelationName(name: string): boolean {
  return REL.test(normalizePlaceName(name))
}

export function isPeopleListQuery(name: string): boolean {
  return PEOPLE_LIST.test(normalizePlaceName(name))
}

const STREET_BIT =
  /(?:straße|strasse|str\.|platz|allee|gasse)(?:\s|$|\d)|(?:^|[\s,])(?:weg|ring|damm|ufer)\b/i

export function looksLikeAddress(text: string): boolean {
  const t = text.trim()
  if (/\d/.test(t)) return true
  if (STREET_BIT.test(t)) return true
  return false
}

/** Straße ohne Stadt — nicht als fernen Ortsnamen geocoden. */
export function looksLikeBareStreet(text: string): boolean {
  const t = text.trim().replace(/\s+/g, ' ')
  if (!t || /,/.test(t)) return false
  if (!STREET_BIT.test(t)) return false
  const parts = t.split(' ')
  if (parts.length === 1) return true
  if (parts.length === 2 && /^\d+[a-z]?$/i.test(parts[1] || '')) return true
  return false
}

export function isBarePlaceAnswer(text: string): boolean {
  const t = text.trim().replace(/^[iI]n\s+/, '')
  if (!t || t.length < 2 || t.length > 80) return false
  if (/[?]/.test(t)) return false
  if (isFuelPlace(t)) return false
  if (/^(ja|nein|ok|okay|danke|bitte|gut|jo|passt|mach)\s*[.!]?\s*$/i.test(t)) return false
  if (
    /\b(wecker|timer|termin|todo|wetter|fernseh|notiz|suche|erinner|fahr|navigier|route|ruf|anruf|tel)\b/i.test(
      t,
    )
  ) {
    return false
  }
  if (extractPhone(t)) return false
  return true
}

export function parsePlaceForget(text: string): string | null {
  const m = FORGET_PLACE.exec(text.trim())
  if (!m?.[1]) return null
  const name = normalizePlaceName(m[1])
  return name || null
}

export function parsePlaceWrite(text: string): PlaceWrite | null {
  const t = text.trim()
  if (!t || t.length > 200) return null
  const ich = WRITE_ICH.exec(t)
  if (ich) return { name: 'zuhause', place: cleanPlace(ich[1]) }
  const arbeite = WRITE_ICH_ARBEITE.exec(t)
  if (arbeite) return { name: 'arbeit', place: cleanPlace(arbeite[1]) }
  const wohnt = WRITE_WOHNT.exec(t)
  if (wohnt) {
    const name = normalizePlaceName(wohnt[1])
    const place = cleanPlace(wohnt[2])
    if (name && place && name !== place) return { name, place }
  }
  const ist = WRITE_IST.exec(t)
  if (ist) {
    const name = normalizePlaceName(ist[1])
    const place = cleanPlace(ist[2])
    if (
      name &&
      place &&
      !/^(ich|wir|das|es|termin|timer|wecker|wetter|todo|erinnerung|notiz)$/i.test(name) &&
      !/\b(stunde|minute|woche|tag|monat|sekunde)\b/i.test(place)
    ) {
      return { name, place }
    }
  }
  const dash = WRITE_DASH.exec(t)
  if (dash) {
    const name = normalizePlaceName(dash[1])
    const place = cleanPlace(dash[2])
    if (name && place) return { name, place }
  }
  return null
}

export function parsePlaceRecall(text: string): PlaceRecall | null {
  const m = RECALL.exec(text.trim())
  if (!m) return null
  if (isFuelPlace(text) || isFuelPlace(m[1])) return null
  const name = normalizePlaceName(m[1])
  if (!name || PEOPLE_LIST.test(name) || isFuelPlace(name)) return null
  return { name }
}

export function parsePlaceNav(text: string): PlaceNav | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (isFuelPlace(t)) return null
  const extra = parseCallOrPhone(t) || parseSms(t) || parseAlias(t) || parseTravelNav(t)
  if (extra) return extra
  if (LIST.test(t) || (NAV.test(t) && PEOPLE_LIST.test(normalizePlaceName(NAV.exec(t)?.[3] || '')))) {
    return { kind: 'list' }
  }
  if (NAV_HOME.test(t)) return { kind: 'navigate', query: 'zuhause', via: 'nach' }
  const nav = NAV.exec(t)
  if (!nav) return null
  const via = nav[2] ? 'nach' : 'zu'
  const query = normalizePlaceName(nav[3])
  if (!query) return null
  if (PEOPLE_LIST.test(query)) return { kind: 'list' }
  if (isFuelPlace(query) || isFuelPlace(nav[3])) return null
  return { kind: 'navigate', query, via }
}

export function mapsDirUrl(destination: string, mode: TravelMode = 'driving'): string {
  const q = encodeURIComponent(destination.trim())
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=${mode}`
}

const WALK =
  /^\s*(?:lauf(?:e)?|geh(?:e)?\s+zu\s+fuß|zu\s+fuß)\s+(?:zu(?:r|m)?|nach)\s+(.+?)\s*$/i
const TRANSIT =
  /^\s*(?:mit\s+der\s+bahn|öpnv|mit\s+bus\s+und\s+bahn)\s+(?:zu(?:r|m)?|nach)\s+(.+?)\s*$/i
const CALL =
  /^\s*(?:(?:kannst\s+du|könnten\s+sie)\s+)?(?:bitte\s+)?(?:ruf(?:e)?\s+(?:die|den|das|meine[nrs]?|mein|unsere[n]?|ihr[en]?)?\s*(.+?)\s+an|(?:den\s+kontakt\s+)?(.+?)\s+anrufen|anrufen\s+(.+))\s*$/i
const CALL_BARE =
  /^\s*(?:anruf(?:e)?|anrufen)\s+(?:mal\s+)?(?:die|den|das|meine[nrs]?|mein|unsere[n]?)?\s*(.+?)\s*$/i
const CALL_MAL =
  /^\s*ruf(?:e)?\s+mal\s+(?:die|den|das|meine[nrs]?)?\s*(.+?)(?:\s+an)?\s*$/i
const CALL_TEL =
  /^\s*telefon(?:at|ier(?:e)?)?\s+(?:mit\s+)?(?:der|dem|die|den|das|meine[nrs]?)?\s*(.+?)\s*$/i
const SMS =
  /^\s*(?:schreib(?:e)?(?:\s+mal)?|(?:sende?\s+)?(?:eine?\s+)?(?:sms|kurze?\s*nachricht|nachricht))\s+(?:der|dem|an\s+(?:die|den|das)?\s*)?(.+)$/i
const PHONE =
  /^\s*(?:(?:nummer\s+von|tel(?:efon)?\s+von)\s+(.+?)\s*[:-]\s*(.+)|(.+?)\s*[,:]\s*tel(?:efon)?\s+(.+))\s*$/i
const PHONE_NAME =
  /^\s*(.+?)\s*[,:–-]\s*((?:\+|00)?\d[\d\s/-]{5,}\d)\s*$/i
const PHONE_SPACE =
  /^\s*([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.-]{1,28})\s+(?:(?:tel(?:efon)?|nummer)\s+)?((?:\+|00)?\d[\d\s/-]{5,}\d)\s*$/i
const ALIAS =
  /^\s*(?:meine[nrs]?\s+)?(.+?)\s+heißt\s+(.+?)\s*$/i

export function looksLikePhone(value: string): boolean {
  const d = value.replace(/\D/g, '')
  return d.length >= 6 && d.length <= 16
}

export function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+|00)?\d[\d\s/-]{5,}\d/)
  if (!m) return null
  const compact = m[0].replace(/[^\d+]/g, '')
  return looksLikePhone(compact) ? compact : null
}

export function findContactRow(
  rows: Array<{ key: string; value: string; category: string }>,
  query: string,
): { key: string; value: string } | undefined {
  const q = normalizePlaceName(query)
  if (!q) return undefined
  const phones = rows.filter((r) => r.category === 'contact' && looksLikePhone(r.value))
  const direct = phones.find((r) => r.key === q)
  if (direct) return { key: direct.key, value: direct.value }
  const fuzzy = phones.find((r) => r.key.includes(q) || q.includes(r.key))
  if (fuzzy) return { key: fuzzy.key, value: fuzzy.value }
  const forward = rows.find((r) => r.key === `alias:${q}` && r.value.trim())
  if (forward) {
    const other = normalizePlaceName(forward.value)
    const hit = phones.find((r) => r.key === other)
    if (hit) return { key: hit.key, value: hit.value }
  }
  const reverse = rows.find((r) => r.key.startsWith('alias:') && normalizePlaceName(r.value) === q)
  if (reverse) {
    const rel = reverse.key.slice('alias:'.length)
    const hit = phones.find((r) => r.key === rel)
    if (hit) return { key: hit.key, value: hit.value }
  }
  return undefined
}

export function findPlaceRow(
  rows: Array<{ key: string; value: string; category: string }>,
  query: string,
): { key: string; value: string } | undefined {
  const q = normalizePlaceName(query)
  if (!q) return undefined
  const places = rows.filter((r) => r.category === 'place' && r.value.trim())
  const direct = places.find((r) => r.key === q)
  if (direct) return { key: direct.key, value: direct.value }
  const forward = rows.find((r) => r.key === `alias:${q}` && r.value.trim())
  if (forward) {
    const other = normalizePlaceName(forward.value)
    const hit = places.find((r) => r.key === other)
    if (hit) return { key: hit.key, value: hit.value }
  }
  const reverse = rows.find((r) => r.key.startsWith('alias:') && normalizePlaceName(r.value) === q)
  if (reverse) {
    const rel = reverse.key.slice('alias:'.length)
    const hit = places.find((r) => r.key === rel)
    if (hit) return { key: hit.key, value: hit.value }
  }
  const fuzzy = places.find((r) => r.key.includes(q) || q.includes(r.key))
  if (fuzzy) return { key: fuzzy.key, value: fuzzy.value }
  return undefined
}

function isNameLike(raw: string): boolean {
  const n = normalizePlaceName(raw)
  if (!n || n.length < 2 || n.length > 28) return false
  if (/^(was|wer|wie|das|es|ich|wir|der|die|wo|wann)$/i.test(n)) return false
  return !/\s/.test(n) || isRelationName(n)
}

export function parseAlias(text: string): PlaceNav | null {
  const m = ALIAS.exec(text.trim())
  if (!m) return null
  const name = normalizePlaceName(m[1])
  const alias = normalizePlaceName(m[2])
  if (!isNameLike(name) || !isNameLike(alias) || name === alias) return null
  if (name === 'ich') return null
  return { kind: 'alias', name, alias }
}

export function parseSms(text: string): PlaceNav | null {
  const t = text.trim()
  const m = SMS.exec(t)
  if (!m) return null
  const rest = (m[1] || '').trim()
  if (!rest) return null
  const rel = rest.match(
    /^(freundin|freund|bro|mama|papa|mutter|vater|oma|opa|eltern|chef|chefin|schwester|bruder|kollege|kollegin|arbeit)\s+(?:dass\s+)?(.+)$/i,
  )
  if (rel) {
    const query = normalizePlaceName(rel[1])
    const body = rel[2].trim()
    if (query && body.length >= 2) return { kind: 'sms', query, body }
  }
  const named = rest.match(/^([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.-]{1,24})\s+(?:dass\s+)?(.+)$/)
  if (named) {
    const query = normalizePlaceName(named[1])
    const body = named[2].trim()
    if (query && isNameLike(query) && body.length >= 2) return { kind: 'sms', query, body }
  }
  const only = normalizePlaceName(rest)
  if (only && isNameLike(only)) return { kind: 'sms', query: only, body: '' }
  return null
}

export function parseCallOrPhone(text: string): PlaceNav | null {
  const t = text.trim()
  const homePhone = parseHomePhone(t)
  if (homePhone) return homePhone
  const mal = CALL_MAL.exec(t)
  if (mal) {
    const query = normalizePlaceName(mal[1] || '')
    if (query) return { kind: 'call', query }
  }
  const bare = CALL_BARE.exec(t)
  if (bare) {
    const query = normalizePlaceName(bare[1] || '')
    if (query) return { kind: 'call', query }
  }
  const tel = CALL_TEL.exec(t)
  if (tel) {
    const query = normalizePlaceName(tel[1] || '')
    if (query) return { kind: 'call', query }
  }
  const call = CALL.exec(t)
  if (call) {
    const query = normalizePlaceName(call[1] || call[2] || call[3] || '')
    if (query) return { kind: 'call', query }
  }
  const phone = PHONE.exec(t)
  if (phone) {
    const name = normalizePlaceName(phone[1] || phone[3] || '')
    const number = (phone[2] || phone[4] || '').replace(/[^\d+]/g, '')
    if (name && looksLikePhone(number)) return { kind: 'phone', name, number }
  }
  const named = PHONE_NAME.exec(t) || PHONE_SPACE.exec(t)
  if (named) {
    const name = normalizePlaceName(named[1].replace(/\bte[l]?e?f[o]?n\b/i, ''))
    const number = named[2].replace(/[^\d+]/g, '')
    if (name && isNameLike(name) && looksLikePhone(number)) return { kind: 'phone', name, number }
  }
  return null
}

function parseHomePhone(text: string): PlaceNav | null {
  if (
    !/\b(heimnummer|hausnummer|zuhause|zu\s*hause|\bheim\b|meinem\s+haus|vom\s+haus|nummer\s+von\s+(?:zu\s*)?hause)\b/i.test(
      text,
    )
  ) {
    return null
  }
  if (/\b(freundin|freund|bro|mama|papa|odett)\b/i.test(text) && !/\b(haus|heim|zuhause)\b/i.test(text)) {
    return null
  }
  const num = extractPhone(text)
  if (!num) return null
  return { kind: 'phone', name: 'zuhause', number: num }
}

export function parseTravelNav(text: string): PlaceNav | null {
  const walk = WALK.exec(text.trim())
  if (walk) return { kind: 'navigate', query: normalizePlaceName(walk[1]), via: 'zu', mode: 'walking' }
  const tr = TRANSIT.exec(text.trim())
  if (tr) return { kind: 'navigate', query: normalizePlaceName(tr[1]), via: 'nach', mode: 'transit' }
  return null
}

function cleanPlace(raw: string): string {
  return raw.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim()
}

export function isCommYes(text: string, kind?: 'call' | 'sms'): boolean {
  const t = text.trim()
  if (/^\s*(ja|jo|yes|ok|okay|mach(?:\s+(?:es|mal))?|bitte|passt|los|tu\s+es)\s*[.!?]*$/i.test(t)) {
    return true
  }
  if (kind === 'sms') return /^\s*(senden|schick(?:en)?)\s*[.!?]*$/i.test(t)
  if (kind === 'call') {
    if (/^\s*anrufen\s*[.!?]*$/i.test(t)) return true
    if (/^\s*ruf(?:e)?\s+.+\s+an\s*[.!?]*$/i.test(t)) return true
    if (/^\s*(?:den\s+kontakt\s+)?.+\s+anrufen\s*[.!?]*$/i.test(t)) return true
    return false
  }
  return /^\s*(anrufen|senden|schick(?:en)?)\s*[.!?]*$/i.test(t)
}

export function isCommNo(text: string): boolean {
  return /^\s*(nein|no|abbrechen|stopp(?:e)?|halt|lass(?:\s+es)?|nicht)\s*[.!?]*$/i.test(text.trim())
}

export type PlaceWrite = { name: string; place: string }
export type PlaceRecall = { name: string }
export type TravelMode = 'driving' | 'walking' | 'transit'

export type PlaceNav =
  | { kind: 'navigate'; query: string; via: 'zu' | 'nach'; mode?: TravelMode }
  | { kind: 'list' }
  | { kind: 'call'; query: string }
  | { kind: 'phone'; name: string; number: string }

const HOME = /^(zuhause|zu\s*hause|hause|heim|wohnung)$/i
const REL =
  /^(freundin|freund|mama|papa|mutter|vater|oma|opa|zahnarzt|arzt|ärztin|praxis|chef|chefin|schwester|bruder|kollege|kollegin)$/i
const PEOPLE_LIST = /^(personen|leute|alle|orte|kontakte)$/i
const ART = /^(der|die|das|dem|den|des|ein|eine|einem|einen|meine|mein|meiner|meinen|unsere|unser)\s+/i

const NAV =
  /^\s*(?:fahr(?:e)?\s+mich|bring(?:e)?\s+mich|navigier(?:e)?|route|zeig(?:e)?\s+(?:mir\s+)?den\s+weg)\s+(?:(zu(?:r|m)?)|(nach))\s+(.+?)\s*$/i
const NAV_HOME =
  /^\s*(?:fahr(?:e)?\s+mich|bring(?:e)?\s+mich|navigier(?:e)?|route)\s+(?:nach\s+)?(?:hause|heim|zuhause)\s*$/i
const LIST =
  /^\s*(?:(?:fahr(?:e)?\s+mich\s+zu|route\s+zu)\s+(?:den\s+)?personen|wen\s+kennst\s+du|wo\s+wohnen\s+(?:die|sie)|zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?orte|personen\s+mit\s+ort)\s*[.?!]?\s*$/i
const RECALL =
  /^\s*wo\s+(?:wohnt|ist|liegt)\s+(?:denn\s+)?(.+?)\s*[.?!]?\s*$/i
const WRITE_WOHNT =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?(.+?)\s+wohnt\s+(?:in|auf|an)\s+(.+?)\s*$/i
const WRITE_ICH =
  /^\s*ich\s+wohne\s+(?:in|auf|an)\s+(.+?)\s*$/i
const WRITE_IST =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?(?:mein(?:e[rn]?)?\s+)?(.+?)\s+(?:ist|liegt)\s+in\s+(.+?)\s*$/i
const WRITE_DASH =
  /^\s*(?:merk(?:e)?\s*dir\s*[:-]?\s*)?([A-ZÄÖÜ][\wÄÖÜäöüß.-]{1,24})\s+[—–-]\s+(.+?)\s*$/i

export function normalizePlaceName(raw: string): string {
  let t = raw.trim().replace(/[.!?,;:]+$/g, '')
  t = t.replace(ART, '').trim()
  t = t.replace(/^(zu(?:r|m)?|nach)\s+/i, '').trim()
  if (HOME.test(t)) return 'zuhause'
  return t.toLowerCase()
}

export function displayPlaceName(key: string): string {
  if (key === 'zuhause') return 'Zuhause'
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

export function looksLikeAddress(text: string): boolean {
  const t = text.trim()
  if (/\d/.test(t)) return true
  if (/\b(straße|strasse|str\.|platz|weg|allee|gasse|ring|damm|ufer)\b/i.test(t)) return true
  return false
}

export function isBarePlaceAnswer(text: string): boolean {
  const t = text.trim().replace(/^[iI]n\s+/, '')
  if (!t || t.length < 2 || t.length > 80) return false
  if (/[?]/.test(t)) return false
  if (/^(ja|nein|ok|okay|danke|bitte|gut|jo|passt|mach)\s*[.!]?\s*$/i.test(t)) return false
  if (
    /\b(wecker|timer|termin|todo|wetter|fernseh|notiz|suche|erinner|fahr|navigier|route)\b/i.test(t)
  ) {
    return false
  }
  return true
}

export function parsePlaceWrite(text: string): PlaceWrite | null {
  const t = text.trim()
  if (!t || t.length > 200) return null
  const ich = WRITE_ICH.exec(t)
  if (ich) return { name: 'zuhause', place: cleanPlace(ich[1]) }
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
  const name = normalizePlaceName(m[1])
  if (!name || PEOPLE_LIST.test(name)) return null
  return { name }
}

export function parsePlaceNav(text: string): PlaceNav | null {
  const t = text.trim()
  if (!t || t.length > 180) return null
  const extra = parseCallOrPhone(t) || parseTravelNav(t)
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
const CALL = /^\s*(?:ruf(?:e)?\s+(?:die|den|das)?\s*(.+?)\s+an|anrufen\s+(.+))\s*$/i
const PHONE =
  /^\s*(?:(?:nummer\s+von|tel(?:efon)?\s+von)\s+(.+?)\s*[:-]\s*(.+)|(.+?)\s*[,:]\s*tel(?:efon)?\s+(.+))\s*$/i

export function parseCallOrPhone(text: string): PlaceNav | null {
  const t = text.trim()
  const call = CALL.exec(t)
  if (call) return { kind: 'call', query: normalizePlaceName(call[1] || call[2] || '') }
  const phone = PHONE.exec(t)
  if (phone) {
    const name = normalizePlaceName(phone[1] || phone[3] || '')
    const number = (phone[2] || phone[4] || '').replace(/[^\d+]/g, '')
    if (name && number.length >= 6) return { kind: 'phone', name, number }
  }
  return null
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

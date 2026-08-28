import { gazetteerHit } from './globe-geo.ts'
import { normalizeUtterance } from './utterance.ts'

export const HUD_CATALOG = [
  { id: 'weather', label: 'Wetterstatistik' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'device', label: 'Gerät' },
  { id: 'brief', label: 'Tageslage' },
  { id: 'chat', label: 'Chat' },
  { id: 'plugs', label: 'Steckdosen' },
  { id: 'tv', label: 'Fernseher' },
  { id: 'news', label: 'Nachrichten' },
  { id: 'drive', label: 'Restweg' },
  { id: 'warn', label: 'Unwetter' },
  { id: 'fx', label: 'Kurs' },
  { id: 'sport', label: 'Sport' },
  { id: 'chess', label: 'Schach' },
  { id: 'trace', label: 'Route' },
  { id: 'world', label: 'Welt' },
] as const

export type HudId = (typeof HUD_CATALOG)[number]['id']

export const HUD_DEFAULT_ON: HudId[] = ['weather', 'device', 'brief', 'chat']

export type HudView = 'tiles' | 'body' | 'globe'

export const BODY_ORGANS = [
  'brain',
  'eye',
  'hand',
  'ear',
  'mouth',
  'memory',
  'pc_eye',
  'pc_hand',
] as const

export type BodyOrgan = (typeof BODY_ORGANS)[number]

const ALIAS: Record<string, HudId> = {
  wetterstatistik: 'weather',
  wetterstats: 'weather',
  wetterkurve: 'weather',
  statistik: 'weather',
  spotify: 'spotify',
  musik: 'spotify',
  gerät: 'device',
  geraet: 'device',
  akku: 'device',
  uhr: 'device',
  tageslage: 'brief',
  kalender: 'brief',
  chat: 'chat',
  steckdosen: 'plugs',
  steckdose: 'plugs',
  fernseher: 'tv',
  tv: 'tv',
  nachrichten: 'news',
  restweg: 'drive',
  unwetter: 'warn',
  dwd: 'warn',
  kurs: 'fx',
  dollar: 'fx',
  sport: 'sport',
  bundesliga: 'sport',
  schach: 'chess',
  traceroute: 'trace',
  hops: 'trace',
  route: 'trace',
  welt: 'world',
  weltlage: 'world',
  ausblick: 'world',
}

const ORGAN_ALIAS: Record<string, BodyOrgan> = {
  hirn: 'brain',
  gehirn: 'brain',
  auge: 'eye',
  hand: 'hand',
  ohr: 'ear',
  mund: 'mouth',
  stimme: 'mouth',
  gedächtnis: 'memory',
  gedaechtnis: 'memory',
  'pc-auge': 'pc_eye',
  'pc auge': 'pc_eye',
  pcauge: 'pc_eye',
  'pc-hand': 'pc_hand',
  'pc hand': 'pc_hand',
  pchand: 'pc_hand',
}

export type HudIntent =
  | { kind: 'lage'; on: boolean }
  | { kind: 'accent'; amber: boolean }
  | { kind: 'module'; id: HudId; on: boolean }
  | { kind: 'list' }
  | { kind: 'view'; view: HudView }
  | { kind: 'organ'; id: BodyOrgan }
  | { kind: 'pin'; name: string; lat: number; lon: number; blurb: string }
  | { kind: 'look' }
  | { kind: 'unknown_place'; asked: string }

function hudText(raw: string): string {
  return normalizeUtterance(raw.trim())
    .replace(/\b(bitte|mal|doch|einfach)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseHudIntent(text: string): HudIntent | null {
  const t = hudText(text)
  if (!t || t.length > 80) return null
  if (/^\s*(?:lage|tablet(?:[- ]?lage)?|hud)\s+(an|ein|auf|zeig(?:e)?)\s*$/i.test(t)) {
    return { kind: 'lage', on: true }
  }
  if (/^\s*(?:lage|tablet(?:[- ]?lage)?|hud)\s+(aus|weg|zu)\s*$/i.test(t)) {
    return { kind: 'lage', on: false }
  }
  if (/^\s*zeig(?:e)?\s+(?:die\s+)?(?:lage|tablet)\s*$/i.test(t)) return { kind: 'lage', on: true }
  if (/^\s*(?:lage|tablet)\s+aus\s*$/i.test(t)) return { kind: 'lage', on: false }
  if (/^\s*(?:orange|amber)[- ]?(?:akzent|lage)\s+(an|aus)\s*$/i.test(t)) {
    return { kind: 'accent', amber: /an/i.test(t) }
  }
  if (/^\s*(?:module|kacheln|lage[- ]?kacheln)\s*$/i.test(t)) return { kind: 'list' }

  if (
    /^\s*(?:mach(?:e)?\s+)?(?:den\s+|die\s+)?(?:körper|koerper)\s+(an|ein|auf|zeig(?:e)?)\s*$/i.test(t) ||
    /^\s*zeig(?:e)?\s+(?:mir\s+)?(?:den\s+|die\s+)?(?:körper|koerper)\s*$/i.test(t) ||
    /^\s*zeig(?:e)?\s+hirn\s*$/i.test(t) ||
    /^\s*den\s+(?:körper|koerper)\s*$/i.test(t)
  ) {
    return { kind: 'view', view: 'body' }
  }
  if (
    /^\s*(?:mach(?:e)?\s+)?(?:den\s+|die\s+)?(?:körper|koerper)\s+(aus|weg|zu)\s*$/i.test(t)
  ) {
    return { kind: 'view', view: 'tiles' }
  }
  if (
    /^\s*(?:mach(?:e)?\s+)?(?:die\s+)?(?:kugel|weltkugel|erde)\s+(an|ein|auf)\s*$/i.test(t) ||
    /^\s*zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?(?:erde|kugel|weltkugel)\s*$/i.test(t) ||
    /^\s*weltkugel\s*$/i.test(t) ||
    /^\s*die\s+(?:erde|kugel|weltkugel)\s*$/i.test(t)
  ) {
    return { kind: 'view', view: 'globe' }
  }
  if (
    /^\s*(?:mach(?:e)?\s+)?(?:die\s+)?(?:kugel|weltkugel|erde)\s+(aus|weg|zu)\s*$/i.test(t)
  ) {
    return { kind: 'view', view: 'tiles' }
  }

  if (
    /^\s*was\s+ist\s+das\s+für\s+eine\s+stadt\s*\??\s*$/i.test(t) ||
    /^\s*was\s+sehe\s+ich\s*\??\s*$/i.test(t) ||
    /^\s*welche\s+stadt\s+(?:ist\s+das|sehe\s+ich)\s*\??\s*$/i.test(t) ||
    /^\s*wo\s+schaue\s+ich\s+hin\s*\??\s*$/i.test(t)
  ) {
    return { kind: 'look' }
  }

  const where = /^\s*(?:wo\s+(?:liegt|ist)|zeig(?:e)?(?:\s+mir)?(?:\s+die\s+stadt)?|flieg(?:e)?\s+nach|zoom(?:e)?\s+auf)\s+(.+?)\s*$/i.exec(
    t,
  )
  if (where) {
    const rest = where[1].replace(/^(?:die\s+|das\s+|den\s+|stadt\s+)/i, '').trim()
    const hit = gazetteerHit(rest)
    if (hit) return { kind: 'pin', name: hit.name, lat: hit.lat, lon: hit.lon, blurb: hit.blurb }
    if (
      /^(?:zeig|flieg|zoom)/i.test(t) &&
      rest &&
      rest.length < 40 &&
      !/\b(körper|koerper|kugel|erde|weltkugel|hirn|gehirn|auge|hand|ohr|mund|stimme|gedächtnis|wetter|spotify|lage|kachel|modul|mond|iss|sonne|himmel|foto|beleg|bild|speichern|fenster)\b/i.test(
        rest,
      )
    ) {
      return { kind: 'unknown_place', asked: rest }
    }
  }

  const organ = /^\s*zeig(?:e)?\s+(?:mir\s+)?(?:das\s+|die\s+|den\s+)?(hirn|gehirn|auge|hand|ohr|mund|stimme|gedächtnis|gedaechtnis|pc[- ]auge|pc[- ]hand|pcauge|pchand)\s*$/i.exec(
    t,
  )
  if (organ) {
    const id = ORGAN_ALIAS[organ[1].toLowerCase()]
    if (id) return { kind: 'organ', id }
  }

  const mod =
    /^(?:(?:modul|kachel)\s+)?(wetterstatistik|wetterstats|wetterkurve|statistik|spotify|musik|gerät|geraet|akku|uhr|tageslage|kalender|chat|steckdosen|steckdose|fernseher|tv|nachrichten|restweg|unwetter|dwd|kurs|dollar|sport|bundesliga|schach|traceroute|hops|route|welt|weltlage|ausblick)(?:[- ]kachel)?\s+(an|ein|aus|weg)\s*$/i.exec(
      t,
    )
  if (mod) {
    const id = ALIAS[mod[1].toLowerCase()]
    if (!id) return null
    if (id !== 'weather' && !/\b(kachel|modul|lage|statistik)\b/i.test(t)) return null
    return { kind: 'module', id, on: /an|ein/i.test(mod[2]) }
  }

  const wet =
    /^\s*wetterstatistik\s+(an|ein|aus|weg)\s*$/i.exec(t) ||
    /^\s*(?:zeig(?:e)?|nimm)\s+wetterstatistik\s*(?:weg)?\s*$/i.exec(t)
  if (wet) {
    const on = /zeig|an|ein/i.test(t) && !/aus|weg/i.test(t)
    return { kind: 'module', id: 'weather', on }
  }
  return null
}

export function organLabel(id: BodyOrgan): string {
  const map: Record<BodyOrgan, string> = {
    brain: 'Hirn',
    eye: 'Auge',
    hand: 'Hand',
    ear: 'Ohr',
    mouth: 'Mund',
    memory: 'Gedächtnis',
    pc_eye: 'PC-Auge',
    pc_hand: 'PC-Hand',
  }
  return map[id]
}

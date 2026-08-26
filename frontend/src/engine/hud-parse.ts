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
] as const

export type HudId = (typeof HUD_CATALOG)[number]['id']

export const HUD_DEFAULT_ON: HudId[] = ['weather', 'device', 'brief', 'chat']

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
}

export type HudIntent =
  | { kind: 'lage'; on: boolean }
  | { kind: 'accent'; amber: boolean }
  | { kind: 'module'; id: HudId; on: boolean }
  | { kind: 'list' }

export function parseHudIntent(text: string): HudIntent | null {
  const t = normalizeUtterance(text.trim())
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

  const mod =
    /^(?:(?:modul|kachel)\s+)?(wetterstatistik|wetterstats|wetterkurve|statistik|spotify|musik|gerät|geraet|akku|uhr|tageslage|kalender|chat|steckdosen|steckdose|fernseher|tv|nachrichten|restweg|unwetter|dwd|kurs|dollar|sport|bundesliga|schach|traceroute|hops|route)(?:[- ]kachel)?\s+(an|ein|aus|weg)\s*$/i.exec(
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

import { normalizeUtterance } from './utterance.ts'

export type HereIntent = { kind: 'locate' } | { kind: 'activate' }

const SKIP =
  /\b(fahrmodus|carplay|fernseher|ventilator|lüfter|spotify|wecker|timer|netflix|youtube)\b/i

const LOCATE =
  /\b(?:wo\s+bin\s+ich(?:\s+gerade)?|wo\s+stehe\s+ich|wo\s+befinde\s+ich\s+mich|meine?\s+standort|aktuelle(?:r|n)?\s+position|live[- ]?ortung)\b/i

const ACTIVATE_EXPLICIT =
  /\b(?:standort(?:freigabe)?|live[- ]?ortung|gps)\b.+\b(?:aktivier|erlaub|freigeb|anschalt|an\s*$)|(?:aktivier|erlaub|freigeb|anschalt).+\b(?:standort|gps|ortung|freigabe)\b|^\s*(?:standort|gps)\s+(?:an|aktivier(?:e|en)?|erlauben|freigeben)\s*[.!?]*$/i

const ACTIVATE_PRONOUN =
  /^\s*(?:kannst du\s+|können sie\s+)?(?:bitte\s+)?(?:sie|ihn|das|die\s+freigabe|den\s+standort)?\s*(?:bitte\s+)?(?:aktivier(?:e|en)?|freigeben|erlauben)\s*[.!?]*$/i

const LOCATION_TOOLS = new Set(['here', 'here_ask', 'fuel', 'weather', 'leave', 'drive', 'poi', 'transit'])

export function parseHereIntent(text: string, lastTool = ''): HereIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (SKIP.test(t) && !LOCATE.test(t) && !/\bstandort\b/i.test(t)) return null
  if (LOCATE.test(t)) return { kind: 'locate' }
  if (ACTIVATE_EXPLICIT.test(t)) return { kind: 'activate' }
  if (ACTIVATE_PRONOUN.test(t) && LOCATION_TOOLS.has(lastTool)) return { kind: 'activate' }
  return null
}

export function formatHereReply(place: string): string {
  const p = place.trim()
  if (!p || /^hier$/i.test(p)) return 'Ortname fehlt. Koordinaten liegen, das Netz nennt den Platz nicht.'
  return `${p}.`
}

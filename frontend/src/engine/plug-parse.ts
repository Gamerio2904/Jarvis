import { expandZahlenworte } from './zahlenworte.ts'
import { normalizeUtterance } from './utterance.ts'

export type PlugAction = 'on' | 'off' | 'toggle' | 'status'

export type PlugIntent = {
  action: PlugAction
  target: 'all' | 'single' | 'named'
  name?: string
}

export const PLUG_FOLLOWUP_MS = 120_000

const SKIP =
  /\b(ventilator|deckenventilator|l[uü]fter|fan|fernseher|tv|netflix|youtube|spotify|taschenlampe|handylicht|blitzlicht|wecker|timer|fahrmodus|carplay)\b/i

const ANCHOR =
  /\b(steckdosen?|zwischenstecker|wlan[- ]?stecker|smart[- ]?plugs?|power[- ]?plugs?)\b/i

const FOLLOW =
  /^\s*(an|aus|ein|umschalten)(?:\s+bitte)?\s*[.!?]*$/i

const ALL = /\balle\s+(?:die\s+)?(?:steckdosen?|zwischenstecker|plugs?)\b/i

function actionOf(t: string): PlugAction | null {
  if (/\b(status|wie\s+steht)\b/i.test(t) || /^\s*ist\b/i.test(t)) return 'status'
  if (/\b(umschalten|toggle)\b/i.test(t)) return 'toggle'
  if (/\b(aus(?:schalten)?|ausmachen|abschalten|strom\s+aus|aus\s+machen)\b/i.test(t)) return 'off'
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|strom\s+an|an\s+machen)\b/i.test(t)) return 'on'
  return null
}

function stripNoise(t: string): string {
  return t
    .replace(ANCHOR, ' ')
    .replace(/\b(mach(?:e|en)?|schalt(?:e|en)?|setz(?:e|en)?|bitte|mal|doch|die|der|das|den|dem|im|in|der|zum|zur)\b/gi, ' ')
    .replace(/\b(an|aus|ein|umschalten|status)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchName(t: string, names: string[]): string | null {
  const list = Array.isArray(names) ? names : []
  const hay = t.toLowerCase()
  let best: string | null = null
  for (const raw of list) {
    const n = raw.trim().toLowerCase()
    if (n.length < 3) continue
    if (hay.includes(n) && (!best || n.length > best.length)) best = raw.trim()
  }
  return best
}

export function parsePlugIntent(text: string, names: string[] = [], followUp = false): PlugIntent | null {
  const t = expandZahlenworte(normalizeUtterance(text.trim()))
  if (!t || t.length > 180) return null
  if (SKIP.test(t)) return null

  const named = matchName(t, names)
  const hasAnchor = ANCHOR.test(t)
  if (!hasAnchor && !named && !followUp) return null
  if (!hasAnchor && followUp && !FOLLOW.test(t) && !named) return null

  if (ALL.test(t)) {
    const action = actionOf(t) || 'off'
    return { action, target: 'all' }
  }

  const action = actionOf(t) || (hasAnchor && !followUp ? 'on' : null)
  if (!action) {
    if (followUp && FOLLOW.test(t)) {
      const a = /\baus\b/i.test(t) ? 'off' : /\bumschalten\b/i.test(t) ? 'toggle' : 'on'
      return named ? { action: a, target: 'named', name: named } : { action: a, target: 'single' }
    }
    return null
  }

  if (named) return { action, target: 'named', name: named }
  const rest = stripNoise(t)
  if (rest.length >= 3) {
    const restHit = matchName(rest, names)
    if (restHit) return { action, target: 'named', name: restHit }
  }
  return { action, target: 'single' }
}

export function isPlugFollowUpPhrase(text: string): boolean {
  return FOLLOW.test(expandZahlenworte(normalizeUtterance(text.trim())))
}

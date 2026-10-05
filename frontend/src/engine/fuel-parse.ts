import { normalizeUtterance } from './utterance.ts'

export type FuelPrefer = 'nearest' | 'cheapest'

export type FuelIntent = {
  kind: 'search'
  prefer: FuelPrefer
}

const FUEL_WORD = /\b(?:tanke|tanken|tankstelle|tankstellen)\b/i

const FOLLOW =
  /^\s*(?:(?:fahr(?:e)?(?:\s+mich)?|bring(?:e)?(?:\s+mich)?|nimm|zeig(?:e)?)\s+)?(?:zu(?:r|m)?\s+)?(?:die[rn]?\s+)?(nächste[nrs]?|günstigste[nrs]?|billigste[nrs]?|preiswerteste[nrs]?)\s*[.!?]*$/i

export function isFuelPlace(text: string): boolean {
  const t = normalizeUtterance((text || '').trim())
  if (!t) return false
  return FUEL_WORD.test(t)
}

export function parseFuelIntent(text: string): FuelIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || !FUEL_WORD.test(t)) return null
  const prefer: FuelPrefer = /\b(günstigst|billigst|preiswertest)/i.test(t)
    ? 'cheapest'
    : 'nearest'
  return { kind: 'search', prefer }
}

/** Nur nach einer Tanke-Antwort: „günstigste“, „nächste“, „fahr zur billigsten“. */
export function parseFuelFollowUp(text: string): FuelPrefer | null {
  const t = normalizeUtterance(text.trim())
  const m = FOLLOW.exec(t)
  if (!m) return null
  const w = m[1].toLowerCase()
  if (w.startsWith('günstig') || w.startsWith('billig') || w.startsWith('preiswert')) return 'cheapest'
  return 'nearest'
}

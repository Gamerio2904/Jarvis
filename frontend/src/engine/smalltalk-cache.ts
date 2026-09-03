/** L1 cache for identical smalltalk. Never a router. Skip live facts. */

const UNSAFE =
  /\b(?:uhr|wetter|temperatur|grad|erinner|termin|kalender|nachricht|news|kurs|blitzer|standort|wo bin|retrieve|suche|tank|preis)\b/i

const GREET = /^(?:hallo|hi|hey|moin|guten (?:morgen|tag|abend)|wie geht(?:'s|s| es)?(?: dir| Ihnen)?)\b/i

const mem = new Map<string, string>()

export function normalizeSmalltalkKey(utterance: string): string {
  return (utterance || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function canCacheSmalltalk(utterance: string): boolean {
  const t = normalizeSmalltalkKey(utterance)
  if (t.length < 4 || t.length > 80) return false
  if (UNSAFE.test(t)) return false
  if (/\d/.test(t)) return false
  return GREET.test(t)
}

export function lookupSmalltalk(utterance: string): string | null {
  if (!canCacheSmalltalk(utterance)) return null
  return mem.get(normalizeSmalltalkKey(utterance)) || null
}

export function rememberSmalltalk(utterance: string, reply: string): void {
  const body = (reply || '').replace(/\s+/g, ' ').trim()
  if (!body || !canCacheSmalltalk(utterance)) return
  mem.set(normalizeSmalltalkKey(utterance), body)
}

export function clearSmalltalkCache() {
  mem.clear()
}

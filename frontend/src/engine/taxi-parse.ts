import { normalizeUtterance } from './utterance.ts'

export type TaxiApp = 'call' | 'uber' | 'freenow' | 'ask'

export type TaxiIntent = {
  kind: 'order'
  dest?: 'poi' | 'here'
}

export function parseTaxiIntent(text: string): TaxiIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/\b(bahn|öpnv|zug|sbahn|u-bahn)\b/i.test(t)) return null
  if (/^\s*nachrichten?\s*$/i.test(t)) return null
  const taxiWord = /\b(taxi|uber|freenow|free\s*now)\b/i.test(t)
  const order = /\b(bestell(?:e|en)?|hol(?:en)?|ruf(?:e)?|brauchen|brauche|kommen)\b/i.test(t)
  if (!taxiWord && !/\b(ein\s+taxi)\b/i.test(t)) return null
  if (!taxiWord) return null
  if (/\bfahr(?:e|en)?\s+mich\b/i.test(t) && !taxiWord) return null
  if (!order && !/^\s*(?:ein\s+)?taxi(?:\s+(?:bitte|her|kommen|zur|nach|dorthin).*)?\s*$/i.test(t) && !/\btaxi\s+(?:zur|nach|dorthin|hierher|her)\b/i.test(t) && !/\b(uber|freenow)\b/i.test(t)) {
    if (!/\bbestell|\bruf(?:e)?\s+(?:ein\s+)?taxi|\btaxi\s+(?:bestellen|holen)/i.test(t)) return null
  }
  const dest = /\b(dorthin|zur\s+bar|zur\s+kneipe|zum\s+poi|hierher|hier)\b/i.test(t) ? (/\bhier/i.test(t) ? 'here' : 'poi') : undefined
  return { kind: 'order', dest }
}

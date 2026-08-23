import { normalizeUtterance } from './utterance.ts'

export type FxIntent = { from: string; to: string; label: string }

const CUR: Array<{ code: string; re: RegExp; label: string }> = [
  { code: 'USD', re: /\b(dollar|usd|\$|us-?dollar)\b/i, label: 'US-Dollar' },
  { code: 'EUR', re: /\b(euro|eur|€)\b/i, label: 'Euro' },
  { code: 'GBP', re: /\b(pfund|pound|gbp|sterling)\b/i, label: 'Pfund' },
  { code: 'CHF', re: /\b(franken|chf|schweizer\s+franken)\b/i, label: 'Franken' },
  { code: 'JPY', re: /\b(yen|jpy)\b/i, label: 'Yen' },
  { code: 'CNY', re: /\b(yuan|renminbi|cny)\b/i, label: 'Yuan' },
  { code: 'PLN', re: /\b(zloty|złoty|pln)\b/i, label: 'Złoty' },
  { code: 'SEK', re: /\b(schwedische\s+krone|sek)\b/i, label: 'schwedische Kronen' },
]

const ASK =
  /\b(wechselkurs|kurs|was\s+ist\s+der|was\s+kostet|wie\s+steht|umrechnen|in\s+euro|zu\s+euro)\b/i

export function parseFxIntent(text: string): FxIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (!ASK.test(t) && !/\b(dollar|pfund|franken|yen|yuan|zloty)\b/i.test(t)) return null
  if (/\b(wetter|unwetter|blitzer|fernseher|spotify)\b/i.test(t)) return null
  const hits = CUR.filter((c) => c.re.test(t))
  if (!hits.length) return null
  if (hits.length >= 2) {
    const from = hits[0]
    const to = hits[1]
    return { from: from.code, to: to.code, label: `${from.label} zu ${to.label}` }
  }
  const one = hits[0]
  if (one.code === 'EUR') return { from: 'EUR', to: 'USD', label: 'Euro zu Dollar' }
  return { from: one.code, to: 'EUR', label: `${one.label} zu Euro` }
}

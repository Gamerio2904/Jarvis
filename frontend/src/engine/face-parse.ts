export type Face = 'jarvis' | 'friday'

const FRIDAY_ONLY =
  /^(?:(?:hey|hi|ok(?:ay)?)\s+)?friday(?:\s+übernimmt)?\s*[.!?]*$/i
const JARVIS_ONLY =
  /^(?:(?:hey|hi|ok(?:ay)?)\s+)?jarvis(?:\s+übernimmt)?\s*[.!?]*$/i
const AS_FRIDAY = /^\s*sprich\s+als\s+friday\s*[.!?]*$/i
const AS_JARVIS = /^\s*sprich\s+als\s+jarvis\s*[.!?]*$/i

/** Wake/switch. Wochentag Freitag is not a face. */
export function parseFaceIntent(text: string): Face | null {
  const t = text.trim()
  if (!t) return null
  if (/\bfreitag\b/i.test(t) && !/\bfriday\b/i.test(t)) return null
  if (FRIDAY_ONLY.test(t) || AS_FRIDAY.test(t)) return 'friday'
  if (JARVIS_ONLY.test(t) || AS_JARVIS.test(t)) return 'jarvis'
  return null
}

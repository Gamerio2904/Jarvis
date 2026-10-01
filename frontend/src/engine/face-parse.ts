export type Face = 'ultron'

const ULTRON_ONLY =
  /^(?:(?:hey|hi|hallo|ok(?:ay)?)\s+)?(?:ultron|ultorn|altron|ultronn)(?:\s+übernimmt)?\s*[.!?]*$/i
const AS_ULTRON = /^\s*sprich\s+als\s+(?:ultron|ultorn|altron|ultronn)\s*[.!?]*$/i

/** Ein Name. Wochentag Freitag und das englische Friday bleiben Kalender. */
export function parseFaceIntent(text: string): Face | null {
  const t = text.trim()
  if (!t) return null
  if (/\bfreitag\b/i.test(t)) return null
  if (/\bwas\s+steht\b/i.test(t) && /\bfriday\b/i.test(t)) return null
  if (ULTRON_ONLY.test(t) || AS_ULTRON.test(t)) return 'ultron'
  return null
}

/** Deutsche Zahlwörter → Ziffern, plus Viertel-/halbe Stunde. Nur vor Einheiten. */

const WORD: Record<string, number> = {
  ein: 1,
  eine: 1,
  einen: 1,
  einem: 1,
  einer: 1,
  eins: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  funf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  zwoelf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fünfzehn: 15,
  funfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19,
  zwanzig: 20,
  dreißig: 30,
  dreissig: 30,
  vierzig: 40,
  fünfzig: 50,
  funfzig: 50,
  sechzig: 60,
}

const WORD_RE = Object.keys(WORD)
  .sort((a, b) => b.length - a.length)
  .join('|')

const UNIT = 'sekunden?|minuten?|stunden?|uhr|stufen?'

/** Wörter, nach denen eine nackte Zahl gesprochen wird: „Lautstärke fünfzig". */
const BEFORE = 'lautstärke|lautstaerke|lauter\\s+um|leiser\\s+um|kanal|stufe'

/** Tageszeiten, die eine Uhrzeit ohne „Uhr" abschließen: „um acht abends". */
const AFTER_TIME = 'uhr|morgens|vormittags|mittags|nachmittags|abends|nachts'

export function expandZahlenworte(text: string): string {
  let t = text.replace(/\s+/g, ' ').trim()
  t = t.replace(/\b(?:einer?\s+)?viertel\s*stunden?\b/gi, '15 Minuten')
  t = t.replace(/\b(?:einer?\s+)?halbe[n]?\s+stunden?\b/gi, '30 Minuten')
  t = t.replace(
    new RegExp(`\\b(${WORD_RE})\\s+(${UNIT})\\b`, 'gi'),
    (_m, w: string, unit: string) => `${WORD[w.toLowerCase()] ?? w} ${unit}`,
  )
  t = t.replace(
    new RegExp(`\\bstufe\\s+(${WORD_RE})\\b`, 'gi'),
    (_m, w: string) => `Stufe ${WORD[w.toLowerCase()] ?? w}`,
  )
  t = t.replace(
    new RegExp(`\\b(${BEFORE})\\s+(${WORD_RE})\\b`, 'gi'),
    (_m, lead: string, w: string) => `${lead} ${WORD[w.toLowerCase()] ?? w}`,
  )
  /**
   * „um acht" ist eine Uhrzeit, „um drei Dinge" nicht. Deshalb nur, wenn die
   * Zahl den Satz beendet oder eine Tageszeit folgt.
   */
  t = t.replace(
    new RegExp(`\\bum\\s+(${WORD_RE})(?=\\s*[.!?]*$|\\s+(?:${AFTER_TIME})\\b)`, 'gi'),
    (_m, w: string) => `um ${WORD[w.toLowerCase()] ?? w}`,
  )
  return t.replace(/\s+/g, ' ').trim()
}

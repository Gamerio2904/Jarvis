/** Spoken German → written command. Vocative, fillers, STT-Tippfehler. */

const VOCATIVE =
  /^(?:(?:hey|hallo|hi|ok(?:ay)?|so)\s+)?(?:jarvis|service|google)\s*[,:\-–]?\s+/i
const FILLER =
  /^(?:ähm+|also|ja\s+)?(?:bitte\s+)?(?:kannst\s+du(?:\s+mal)?|könntest\s+du|könnten\s+sie|würdest\s+du|ich\s+(?:möchte|will|würde\s+gerne)|mach(?:e)?(?:\s+mal)?)\s+/i
const COMMAND_START =
  /^(?:ruf|anruf|fahr|bring|navigier|route|spiel|pause|weiter|wecker|timer|termin|kalender|wetter|merk|zeig|such|lies|aktivier|deaktivier|laut|fernseh|\btv\b|einkauf|erinner|todo|notiz|wo\s+|lauf|geh|nach|zu(?:r|m)?\s+|carplay|fahrmodus)/i

const REPAIRS: Array<[RegExp, string]> = [
  [/\bheil\s*bron(?:n|e)?\b/gi, 'Heilbronn'],
  [/\bhailbronn?\b/gi, 'Heilbronn'],
  [/\bcar\s*play\b/gi, 'CarPlay'],
  [/\bkarplay\b/gi, 'CarPlay'],
  [/\bfahr(?:er)?\s*modus\b/gi, 'Fahrmodus'],
  [/\bnach\s*hause\b/gi, 'nach Hause'],
  [/\bnaviga(?:tion|iere?n?)\b/gi, 'navigiere'],
]

export function repairSpeech(text: string): string {
  let t = text.replace(/\s+/g, ' ').trim()
  for (const [re, to] of REPAIRS) t = t.replace(re, to)
  return t.replace(/\s+/g, ' ').trim()
}

export function normalizeUtterance(text: string): string {
  let raw = repairSpeech(text)
  if (!raw) return raw
  const voc = VOCATIVE.exec(raw)
  if (voc) {
    const rest = raw.slice(voc[0].length).trim()
    if (rest && COMMAND_START.test(rest)) raw = rest
  }
  const fill = FILLER.exec(raw)
  if (fill) {
    const rest = raw.slice(fill[0].length).trim()
    if (rest && COMMAND_START.test(rest)) raw = rest
  }
  for (;;) {
    const lead = /^(?:ja|bitte|mal|ähm+|also)\s+/i.exec(raw)
    if (!lead) break
    const rest = raw.slice(lead[0].length).trim()
    if (!rest || !COMMAND_START.test(rest)) break
    raw = rest
  }
  return raw
}

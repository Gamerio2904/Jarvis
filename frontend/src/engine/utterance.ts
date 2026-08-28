import { expandZahlenworte } from './zahlenworte.ts'
import { setFace } from './face.ts'

/** Spoken German → written command. Vocative, fillers, STT-Tippfehler. */

const VOCATIVE =
  /^(?:(?:hey|hallo|hi|ok(?:ay)?|so)\s+)?(?:jarvis|friday|service|google)\s*[,:\-–]?\s+/i
const FILLER =
  /^(?:ähm+|also|ja\s+)?(?:bitte\s+)?(?:kannst\s+du(?:\s+mal)?|könntest\s+du|könnten\s+sie|würdest\s+du|ich\s+(?:möchte|will|würde\s+gerne)|mach(?:e)?(?:\s+mal)?)\s+/i
const COMMAND_START =
  /^(?:ruf|anruf|fahr|bring|navigier|route|spiel|pause|weiter|wecker|timer|termin|kalender|wetter|merk|zeig|öffne[n]?|such|lies|aktivier|deaktivier|laut|fernseh|\btv\b|einkauf|erinner|todo|notiz|wo\s+|lauf|geh|nach|zu(?:r|m)?\s+|carplay|fahrmodus|spotify|musik|karte|overlay|restweg|akku|taschenlampe|schreib|sms|youtube|netflix|disney|amazon|körper|koerper|kugel|erde|weltkugel|(?:den\s+|die\s+)?(?:körper|koerper|kugel|erde)|lage)/i

const REPAIRS: Array<[RegExp, string]> = [
  [/\bheil\s*bron(?:n|e)?\b/gi, 'Heilbronn'],
  [/\bhailbronn?\b/gi, 'Heilbronn'],
  [/\bingers(?:heim)?\b/gi, 'Ingersheim'],
  [/\bnet\s*fli(?:cks|x)\b/gi, 'Netflix'],
  [/\bnetfliks?\b/gi, 'Netflix'],
  [/\byou\s*tube\b/gi, 'YouTube'],
  [/\bdisney\s*plus\b/gi, 'Disney+'],
  [/\bprime\s*video\b/gi, 'Prime'],
  [/\bfire\s*t[ve]\b/gi, 'Fire TV'],
  [/\bcar\s*play\b/gi, 'CarPlay'],
  [/\bkarplay\b/gi, 'CarPlay'],
  [/\bfahr(?:er)?\s*modus\b/gi, 'Fahrmodus'],
  [/\bfähre\s+mich\b/gi, 'fahr mich'],
  [/\bfähr\s+mich\b/gi, 'fahr mich'],
  [/\bnach\s*hause\b/gi, 'nach Hause'],
  [/\bover\s*lay\b/gi, 'overlay'],
  [/\bnächster\s+pol\b/gi, 'nächster POI'],
  [/\btaxsi\b/gi, 'Taxi'],
  [/\bkneibe\b/gi, 'Kneipe'],
  [/\bkalnader\b/gi, 'Kalender'],
  [/\bsteckose\b/gi, 'Steckdose'],
  [/\bheilbron\b/gi, 'Heilbronn'],
  [/\bsprach\s*nachricht\b/gi, 'Sprachnachricht'],
  [/\brotren\s+tomato(?:es|s)?\b/gi, 'Rotten Tomatoes'],
  [/\brotten\s+tomato(?:es|s)?\b/gi, 'Rotten Tomatoes'],
  [/\bnaviga(?:tion|iere?n?)\b/gi, 'navigiere'],
]

export function repairSpeech(text: string): string {
  let t = text.replace(/\s+/g, ' ').trim()
  t = t.replace(/([A-Za-zÄÖÜäöüß]{2,})\.\s+([A-Za-zÄÖÜäöüß])/g, '$1 $2')
  for (const [re, to] of REPAIRS) t = t.replace(re, to)
  t = repairBarnBahn(t)
  return t.replace(/\s+/g, ' ').trim()
}

function repairBarnBahn(t: string): string {
  if (!/\bbarn\b/i.test(t)) return t
  if (/\b(nähe|naehe|nächste|naechste|kneipe|pubs?|bar)\b/i.test(t)) return t.replace(/\bbarn\b/gi, 'Bar')
  if (/\b(mit\s+der|zug|öpnv|sbahn|u-bahn)\b/i.test(t)) return t.replace(/\bbarn\b/gi, 'Bahn')
  return t
}

export function normalizeUtterance(text: string): string {
  let raw = expandZahlenworte(repairSpeech(text))
  if (!raw) return raw
  const voc = VOCATIVE.exec(raw)
  if (voc) {
    const spoken = voc[0].toLowerCase()
    if (/\bfriday\b/.test(spoken)) setFace('friday')
    else if (/\bjarvis\b/.test(spoken)) setFace('jarvis')
    const rest = raw.slice(voc[0].length).trim()
    if (rest && !/^übernimmt\b/i.test(rest) && (COMMAND_START.test(rest) || rest.length >= 2)) raw = rest
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

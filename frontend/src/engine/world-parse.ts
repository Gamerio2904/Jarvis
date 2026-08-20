import { normalizeUtterance } from './utterance.ts'

export type WorldIntent =
  | { kind: 'warn' }
  | { kind: 'ferien'; land?: string }
  | { kind: 'fx'; from: string; to: string }
  | { kind: 'food'; query: string }
  | { kind: 'book'; query: string }
  | { kind: 'sport'; query: string; league?: string }
  | { kind: 'plant'; query: string }
  | { kind: 'iss' }
  | { kind: 'moon' }
  | { kind: 'animal'; query: string }
  | { kind: 'flights' }
  | { kind: 'law'; query: string }
  | { kind: 'house'; query: string }
  | { kind: 'chess'; move?: string; reset?: boolean }

const SKIP =
  /\b(wecker|timer|fernseher|\btv\b|steckdose|ventilator|fahrmodus|carplay|einkaufsliste)\b/i

const LAND: Array<[RegExp, string]> = [
  [/\b(?:baden[- ]württemb|bw|stuttgart|heilbronn)\b/i, 'BW'],
  [/\b(?:bayern|by|münchen|muenchen)\b/i, 'BY'],
  [/\bberlin\b/i, 'BE'],
  [/\bhamburg\b/i, 'HH'],
  [/\b(?:nrw|nordrhein|köln|koeln)\b/i, 'NW'],
  [/\b(?:hessen|frankfurt)\b/i, 'HE'],
  [/\b(?:niedersachsen|hannover)\b/i, 'NI'],
  [/\b(?:rheinland-pfalz|mainz)\b/i, 'RP'],
  [/\bsaarland\b/i, 'SL'],
  [/\bsachsen-anhalt\b/i, 'ST'],
  [/\bsachsen\b/i, 'SN'],
  [/\bthüringen\b/i, 'TH'],
  [/\bschleswig\b/i, 'SH'],
  [/\bmecklenburg\b/i, 'MV'],
  [/\bbrandenburg\b/i, 'BB'],
  [/\bbremen\b/i, 'HB'],
]

export function parseWorldIntent(text: string): WorldIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 200 || SKIP.test(t)) return null

  if (/\bschach\s+neu\b/i.test(t) || /^\s*schach\s+reset\s*$/i.test(t)) {
    return { kind: 'chess', reset: true }
  }
  const chessMove = /^\s*schach\s+([a-h][1-8][a-h][1-8][qrbn]?|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|O-O-O|O-O)\s*$/i.exec(
    t,
  )
  if (chessMove) return { kind: 'chess', move: chessMove[1] }
  if (/^\s*schach\b/i.test(t) && !/\b(uhr|wetter|termin)\b/i.test(t)) {
    return { kind: 'chess' }
  }

  if (/\b(unwetter|dwd(?:-|\s+)?warnung|unwetterwarnung|gibt['’]?s\s+unwetter|warnlage)\b/i.test(t)) {
    return { kind: 'warn' }
  }

  if (/\b(schulferien|ferien(?:zeit)?)\b/i.test(t) && !/\bfeiertag\b/i.test(t)) {
    let land: string | undefined
    for (const [re, code] of LAND) {
      if (re.test(t)) {
        land = code
        break
      }
    }
    return { kind: 'ferien', land }
  }

  if (/\b(wechselkurs|euro\s+in\s+dollar|dollar\s+in\s+euro|was\s+ist\s+der\s+dollar|was\s+ist\s+der\s+kurs)\b/i.test(t)) {
    if (/\bpfunds*sterling|pfund\b/i.test(t)) return { kind: 'fx', from: 'GBP', to: 'EUR' }
    if (/\byen\b/i.test(t)) return { kind: 'fx', from: 'JPY', to: 'EUR' }
    if (/\beuro\s+in\s+dollar\b/i.test(t)) return { kind: 'fx', from: 'EUR', to: 'USD' }
    return { kind: 'fx', from: 'USD', to: 'EUR' }
  }

  const food = /(?:was\s+ist\s+das\s+für\s+ein\s+produkt|open\s+food\s+facts|lebensmittel\s+)(.+)/i.exec(t)
  if (food) return { kind: 'food', query: clean(food[1]) }
  if (/^\s*(?:was\s+ist\s+das\s+für\s+ein\s+produkt|produkt\s+scannen)\s*[.!?]*$/i.test(t)) {
    return { kind: 'food', query: '' }
  }
  if (/\b(ean|gtin|barcode)\b/i.test(t)) {
    const code = t.match(/\b(\d{8,14})\b/)
    if (code) return { kind: 'food', query: code[1] }
  }

  const book =
    /(?:was\s+ist\s+das\s+für\s+ein\s+buch|open\s+library|wer\s+schrieb|autor(?:in)?\s+von)\s+(.+)/i.exec(t) ||
    /^\s*buch\s*[:-]\s*(.+)$/i.exec(t)
  if (book) return { kind: 'book', query: clean(book[1]) }

  if (/\b(bundesliga|openligadb|wie\s+hat\s+der\s+vfb|spielstand\s+bayern|ergebnis\s+bayern)\b/i.test(t)
    || (/\b(spielstand|ergebnis|wie\s+hat(?:te)?)\b/i.test(t)
      && /\b(fc|sv|vfb|bayern|dortmund|leipzig|leverkusen|frankfurt|union|wolfsburg|stuttgart|hoffenheim|augsburg|mainz|freiburg|gladbach|köln|koeln|champions\s+league|bundesliga|2\.\s*liga|3\.\s*liga|dfb)\b/i.test(t))) {
    return { kind: 'sport', query: t, league: leagueFrom(t) }
  }

  const plant = /(?:was\s+ist\s+das\s+für\s+eine\s+pflanze|welche\s+pflanze|pflanzenbestimmung)\s*(.*)$/i.exec(t)
  if (plant && /\bpflanze\b/i.test(t)) return { kind: 'plant', query: clean(plant[1] || '') }

  if (/\b(iss\b|internationale\s+raumstation|wann\s+fliegt\s+die\s+iss)\b/i.test(t)) return { kind: 'iss' }
  if (/\b(mondphase|mond\s+(?:heute|jetzt)|wie\s+ist\s+der\s+mond)\b/i.test(t)) return { kind: 'moon' }

  const animal =
    /(?:welcher\s+vogel|was\s+für\s+ein\s+(?:vogel|tier)|tierbestimmung)\s*(.*)$/i.exec(t)
  if (animal && /\b(vogel|tier)\b/i.test(t)) return { kind: 'animal', query: clean(animal[1] || '') }

  if (/\b(was\s+fliegt\s+da|flüge\s+überm?\s+haus|opensky)\b/i.test(t)) return { kind: 'flights' }

  if (/\b(kündigungsfrist|mietrecht|\bbgb\b|was\s+sagt\s+das\s+gesetz)\b/i.test(t)) {
    return { kind: 'law', query: t }
  }

  if (/\b(waschschüssel|waschsymbol|fleck(?:en)?|was\s+bedeutet\s+das\s+wasch)\b/i.test(t)) {
    return { kind: 'house', query: t }
  }

  return null
}

function clean(s: string): string {
  return s.replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
}

function leagueFrom(t: string): string {
  if (/\b(3\.?\s*liga|dritte\s+liga)\b/i.test(t)) return 'bl3'
  if (/\b(2\.?\s*liga|zweite\s+liga)\b/i.test(t)) return 'bl2'
  if (/\b(dfb[- ]?pokal|dfb\b)\b/i.test(t)) return 'dfb'
  return 'bl1'
}

export function isMusicHonesty(text: string): boolean {
  const t = normalizeUtterance(text.trim())
  if (!t) return false
  return /^(?:spiel(?:e)?(?:\s+mal)?\s+(?:was\s+)?(?:nettes|schönes|gutes|liebes|musik)|mach(?:e)?(?:\s+mal)?\s+musik|musik(?:\s+an)?)\s*[.!?]*$/i.test(
    t,
  )
}

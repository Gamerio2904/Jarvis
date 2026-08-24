import { normalizeUtterance } from './utterance.ts'

export type WorldKind =
  | 'dwd'
  | 'ferien'
  | 'fx'
  | 'food'
  | 'library'
  | 'sport'
  | 'plant'
  | 'sky'
  | 'fauna'
  | 'flight'
  | 'law'
  | 'household'
  | 'sensors'
  | 'chess'

export type WorldIntent = {
  kind: WorldKind
  q: string
  land?: string
  move?: string
  reset?: boolean
}

const SKIP =
  /\b(steckdose|ventilator|fernseher|einkaufsliste|wecker|timer|spotify|carplay|fahrmodus)\b/i

export function parseWorldIntent(text: string): WorldIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 200) return null
  if (SKIP.test(t)) return null

  const chess = parseChess(t)
  if (chess) return chess

  if (/\b(unwetter|dwd|wetterwarnung|unwetterwarnung|warnlage)\b/i.test(t) && !/\bwetter\s+heute\b/i.test(t)) {
    return { kind: 'dwd', q: t }
  }
  if (/\b(schulferien|sind\s+(?:in\s+\w+\s+)?ferien|ferien\s+in)\b/i.test(t) && !/\bfeiertag\b/i.test(t)) {
    return { kind: 'ferien', q: t, land: landHint(t) }
  }
  if (
    /\b(wechselkurs|dollar|us-dollar|\busd\b|was\s+ist\s+der\s+dollar|euro\s+in\s+|kurs\s+(?:von\s+)?(?:dollar|euro|pfund|yen|franken))\b/i.test(
      t,
    ) &&
    !/\bbip\b/i.test(t)
  ) {
    return { kind: 'fx', q: t }
  }
  if (/\b(open\s*food|lebensmittel\s+scannen|was\s+ist\s+das\s+für\s+ein\s+produkt|nutri-?score|barcode)\b/i.test(t)) {
    return { kind: 'food', q: t }
  }
  if (/\b(open\s*library|was\s+ist\s+das\s+für\s+ein\s+buch|isbn|wer\s+schrieb)\b/i.test(t)) {
    return { kind: 'library', q: t }
  }
  if (
    /\b(bundesliga|openligadb|wie\s+hat\s+(?:der|die)\s+\w+\s+gespielt|ergebnis\s+(?:von\s+)?(?:bayern|vfb|dortmund|leverkusen|leipzig))\b/i.test(
      t,
    ) &&
    !/\bfilm\b/i.test(t)
  ) {
    return { kind: 'sport', q: t }
  }
  if (/\b(pflanze|garten|was\s+wächst|welches\s+kraut)\b/i.test(t) && !/\bessen\b/i.test(t)) {
    return { kind: 'plant', q: t }
  }
  if (/\b(iss\b|internationale\s+raumstation|mondphase|mond\s+(?:heute|phase)|wann\s+fliegt\s+die\s+iss)\b/i.test(t)) {
    return { kind: 'sky', q: t }
  }
  if (/\b(welcher\s+vogel|was\s+für\s+ein\s+tier|xeno-?canto|inaturalist)\b/i.test(t)) {
    return { kind: 'fauna', q: t }
  }
  if (/\b(was\s+fliegt\s+da|flugzeug\s+über|opensky|flugverkehr)\b/i.test(t)) {
    return { kind: 'flight', q: t }
  }
  if (
    /\b(kündigungsfrist|mietrecht|gesetze-im-internet|was\s+steht\s+im\s+gesetz|wohnungskündigung)\b/i.test(t) &&
    !/\banwalt\b/i.test(t)
  ) {
    return { kind: 'law', q: t }
  }
  if (/\b(waschschüssel|waschsymbol|wascheichen|fleck\s+(?:in|auf|entfernen)|bügelsymbol)\b/i.test(t)) {
    return { kind: 'household', q: t }
  }
  if (/\b(schritte\s+heute|wie\s+viele\s+schritte|luftdruck|barometer|kompass|nordrichtung)\b/i.test(t)) {
    return { kind: 'sensors', q: t }
  }
  return null
}

function parseChess(t: string): WorldIntent | null {
  if (/^\s*schach\s+(?:neu|reset|neues\s+spiel)\s*[.!?]*$/i.test(t)) {
    return { kind: 'chess', q: t, reset: true }
  }
  const m = /^\s*schach\s+([a-h][1-8][a-h][1-8][qrnb]?)\s*[.!?]*$/i.exec(t)
  if (m) return { kind: 'chess', q: t, move: m[1].toLowerCase() }
  if (/^\s*schach\s*$/i.test(t) || /^\s*schach\s+stellung\s*$/i.test(t)) {
    return { kind: 'chess', q: t }
  }
  return null
}

function landHint(t: string): string | undefined {
  const m =
    /\b(baden-württemberg|baden|bw|bayern|berlin|brandenburg|bremen|hamburg|hessen|mecklenburg|niedersachsen|nordrhein|nrw|rheinland|saarland|sachsen-anhalt|sachsen|schleswig|thüringen|thueringen)\b/i.exec(
      t,
    )
  return m ? m[1] : undefined
}

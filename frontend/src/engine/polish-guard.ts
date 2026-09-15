const PLACE_BODY =
  'berlin|london|paris|hamburg|münchen|muenchen|stuttgart|rom|wien|madrid|tokio|tokyo|moskau|peking|new york|washington|kairo|sydney|istanbul|dublin|prag|warschau|athen|oslo|stockholm|helsinki|amsterdam|brüssel|bruessel|kiew|dubai|seoul|bangkok|singapur|chicago|toronto|nairobi|lagos|kapstadt|ingersheim|heilbronn|köln|koeln|frankfurt'

function placesIn(text: string): string[] {
  const re = new RegExp(`\\b(${PLACE_BODY})\\b`, 'gi')
  return [...text.matchAll(re)].map((m) => m[0].toLowerCase())
}

const ABBREV = new Set([
  'ca',
  'ggf',
  'bzw',
  'usw',
  'etc',
  'vgl',
  'dh',
  'zb',
  'ua',
  'dr',
  'nr',
  'abs',
  'art',
  'str',
  'tel',
  'inkl',
  'exkl',
  'min',
  'max',
  'std',
  'evtl',
  'insb',
  'mio',
  'mrd',
  'bzw',
])

function isAbbrevDot(text: string, dotIndex: number): boolean {
  const before = text.slice(0, dotIndex)
  if (/\b(?:z|u|d|i)\.\s*[BbAaHh]$/.test(before)) return true
  const m = /([A-Za-zÄÖÜäöüß.]+)$/.exec(before.trimEnd())
  if (!m) return false
  const tok = m[1].replace(/\./g, '').toLowerCase()
  return ABBREV.has(tok)
}

export function looksTruncated(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return true
  if (!/[.!?…»"')\]]$/u.test(t)) return true
  const re = /[.!?]\s+[a-zäöü]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) {
    if (!isAbbrevDot(t, m.index)) return true
  }
  return false
}

export function guardPolish(facts: string, polished: string): string {
  const draft = (polished || '').trim()
  const pack = (facts || '').trim()
  if (!draft) return pack
  if (!pack) return draft
  const factNums = new Set((pack.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(',', '.')))
  const outNums = draft.match(/\d+(?:[.,]\d+)?/g) || []
  for (const n of outNums) {
    if (!factNums.has(n.replace(',', '.'))) return pack
  }
  const factPlaces = new Set(placesIn(pack))
  const outPlaces = placesIn(draft)
  for (const p of outPlaces) {
    if (factPlaces.size && !factPlaces.has(p)) return pack
  }
  if (draft.length > 420) return pack
  return draft
}

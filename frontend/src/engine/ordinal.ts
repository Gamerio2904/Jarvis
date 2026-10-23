const ORD: Record<string, number> = {
  erste: 0,
  erstes: 0,
  ersten: 0,
  '1.': 0,
  '1': 0,
  zweite: 1,
  zweites: 1,
  zweiten: 1,
  '2.': 1,
  '2': 1,
  dritte: 2,
  drittes: 2,
  dritten: 2,
  '3.': 2,
  '3': 2,
  vierte: 3,
  viertes: 3,
  vierten: 3,
  '4.': 3,
  '4': 3,
  // P6: Ordnungszahlen ohne Limit — „das zwölfte von der liste raus“.
  'fünfte': 4,
  fuenfte: 4,
  'fünftes': 4,
  'fünften': 4,
  '5.': 4,
  '5': 4,
  sechste: 5,
  sechstes: 5,
  sechsten: 5,
  '6.': 5,
  '6': 5,
  siebte: 6,
  siebtes: 6,
  siebten: 6,
  '7.': 6,
  '7': 6,
  achte: 7,
  achtes: 7,
  achten: 7,
  '8.': 7,
  '8': 7,
  neunte: 8,
  neuntes: 8,
  neunten: 8,
  '9.': 8,
  '9': 8,
  zehnte: 9,
  zehntes: 9,
  zehnten: 9,
  '10.': 9,
  '10': 9,
  elfte: 10,
  elftes: 10,
  elften: 10,
  '11.': 10,
  '11': 10,
  'zwölfte': 11,
  zwoelfte: 11,
  'zwölftes': 11,
  'zwölften': 11,
  '12.': 11,
  '12': 11,
}

const ORDINALS = Object.keys(ORD)
  .filter((k) => !/^\d/.test(k))
  .map((k) => k.replace('ü', '[üu]'))
  .join('|')
const ORD_TOKEN = String.raw`(?:${ORDINALS}|\d{1,2}\.?)`

export function parseOrdinalFollowUp(text: string): { index: number; del: boolean } | null {
  const raw = text.trim()
  const m =
    new RegExp(
      String.raw`^\s*(?:lösch(?:e)?\s+)?(?:das|die|der|den)\s+(${ORD_TOKEN})(?:\s+(?:davon|da|bitte))?\s*$`,
      'i',
    ).exec(raw) || null
  const n = /^\s*(?:nummer|nr\.?|posten)\s*(\d{1,2})\s*$/i.exec(raw)
  const token = (m?.[1] || n?.[1] || '').toLowerCase()
  if (!token) return null
  const index = ORD[token]
  if (index === undefined) return null
  return { index, del: /^lösch/i.test(raw) }
}

export function rewriteOrdinal(
  text: string,
  tool: string,
  titles: string[],
  listHint?: string[],
): string | null {
  const hit = parseOrdinalFollowUp(text)
  if (!hit) return null
  if (!titles.length) return null
  const title = titles[hit.index]
  if (!title) return null
  if (!hit.del) return null
  if (tool === 'calendar') return `lösche Termin ${title}`
  if (tool === 'todo') return `lösche Todo ${title}`
  if (tool === 'reminder') return `lösche Erinnerung ${title}`
  if (tool === 'shopping') return `${title} hab ich`
  if (tool === 'alarm') return `lösche Wecker ${title}`
  if (tool === 'watchlist') {
    const n = hit.index + 1
    const fav = listHint || []
    const sameFav = fav.length === titles.length && titles.every((t, i) => t === fav[i])
    return sameFav ? `Lieblingsliste ${n} weg` : `Watchliste ${n} weg`
  }
  if (tool === 'idea') return `Idee ${hit.index + 1} weg`
  return null
}

import { normalizeUtterance } from './utterance.ts'
import { parseTvWatch } from './tv-parse.ts'
import { parseFilmIntent } from './film-parse.ts'
import { RECOMMEND_LIMIT, type GenreKey, type RecommendAsk } from './film-taste.ts'

export type TasteIntent =
  | { kind: 'recommend'; ask: RecommendAsk }
  | { kind: 'seen'; title: string; index?: number }

const SKIP =
  /\b(wecker|timer|tanke|fahrmodus|carplay|wetter|einkauf|todo|spotify|ventilator|akku|wlan)\b/i

const GENRE_WORD: Array<[RegExp, GenreKey]> = [
  [/\b(?:horrorfilme?|horror|grusel|gruesel|slasher)\b/i, 'horror'],
  [/\b(?:sci[\s-]?fi|science[\s-]?fiction)\b/i, 'sci-fi'],
  [/\bthriller(?:filme?)?\b/i, 'thriller'],
  [/\b(?:komödien?|komoedien?|comedy|lustspiel)\b/i, 'comedy'],
  [/\bdrama(?:filme?)?\b/i, 'drama'],
  [/\b(?:actionfilme?|aktionsfilme?|action|aktion)\b/i, 'action'],
  [/\b(?:romanze|liebesfilme?|romantik)\b/i, 'romance'],
  [/\b(?:animationsfilme?|animation|zeichentrick|anime)\b/i, 'animation'],
  [/\b(?:krimis?|crime)\b/i, 'crime'],
  [/\b(?:abenteuerfilme?|abenteuer|adventure)\b/i, 'adventure'],
  [/\b(?:fantasyfilme?|fantasy|fantastik)\b/i, 'fantasy'],
  [/\b(?:kriegsfilme?|krieg)\b/i, 'war'],
  [/\bwestern(?:filme?)?\b/i, 'western'],
  [/\b(?:mysteryfilme?|mystery|rätsel|raetsel)\b/i, 'mystery'],
  [/\b(?:dokus?|dokumentationen?)\b/i, 'documentary'],
  [/\b(?:familienfilme?|kinderfilme?|familie|family)\b/i, 'family'],
]

const EN_GENRE: Record<string, GenreKey> = {
  horror: 'horror',
  'sci-fi': 'sci-fi',
  'sci fi': 'sci-fi',
  thriller: 'thriller',
  comedy: 'comedy',
  drama: 'drama',
  action: 'action',
  romance: 'romance',
  animation: 'animation',
  crime: 'crime',
  adventure: 'adventure',
  fantasy: 'fantasy',
  war: 'war',
  western: 'western',
  mystery: 'mystery',
  documentary: 'documentary',
  family: 'family',
}

/** OMDb `Genre` "Horror, Mystery" → Keys. */
export function genresFromOmdb(raw: string | undefined): GenreKey[] {
  const s = String(raw || '')
  if (!s.trim() || s === 'N/A') return []
  const out: GenreKey[] = []
  const seen = new Set<GenreKey>()
  const add = (key: GenreKey) => {
    if (seen.has(key)) return
    seen.add(key)
    out.push(key)
  }
  for (const part of s.split(/[,/]/)) {
    const k = EN_GENRE[part.trim().toLowerCase()]
    if (k) add(k)
  }
  for (const [re, key] of GENRE_WORD) {
    if (re.test(s)) add(key)
  }
  return out
}

export function genreFromText(text: string): GenreKey | undefined {
  for (const [re, key] of GENRE_WORD) {
    if (re.test(text)) return key
  }
  return undefined
}

const NIGHT = /\b(?:filmabend|movie\s*night|heute\s+abend|heut\s*abend)\b/i

const RECOMMEND =
  /^\s*(?:nenn(?:e)?(?:\s+mir)?|empfehl(?:e)?(?:\s+mir)?|empfiehl(?:\s+mir)?|was\s+(?:sollen|können|koennen)\s+wir(?:\s+(?:heute|mal))?(?:\s+(?:schauen|sehen|gucken|streamen))?|filmtipp(?:s)?|film\s*tipp(?:s)?)\b/i
const RECOMMEND_NIGHT = /^\s*(?:filmabend)\b/i

const SEEN_INDEX =
  /^\s*(?:watchliste|liste)\s+(\d+)\s+(?:gesehen|geschaut|geguckt|fertig)\s*$/i

const SEEN_RES: RegExp[] = [
  /^\s*(?:ich\s+habe|ich\s+hab)\s+(?:den\s+film\s+)?(.+?)\s+(?:schon\s+)?(?:geschaut|gesehen|geguckt)\s*$/i,
  /^\s*(.+?)\s+habe?\s+ich\s+(?:schon\s+)?(?:geschaut|gesehen|geguckt)\s*$/i,
  /^\s*(?:hab(?:e)?)\s+(.+?)\s+(?:geschaut|gesehen|geguckt)\s*$/i,
]

function cleanSeenTitle(raw: string): string | null {
  let t = (raw || '')
    .replace(/[.!?]+$/g, '')
    .replace(/\b(?:den|die|das|dem|den|ein|eine|einen|film|filme)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 2 || t.length > 80) return null
  return t
}

export function parseTasteIntent(text: string): TasteIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || SKIP.test(t)) return null
  if (parseTvWatch(t)) return null
  if (parseFilmIntent(t)) return null

  const idx = SEEN_INDEX.exec(t)
  if (idx) {
    const n = Number(idx[1])
    if (n >= 1 && n <= 40) return { kind: 'seen', title: '', index: n }
  }
  for (const re of SEEN_RES) {
    const m = re.exec(t)
    if (!m) continue
    const title = cleanSeenTitle(m[1])
    if (title) return { kind: 'seen', title }
  }

  if (RECOMMEND.test(t) || RECOMMEND_NIGHT.test(t) || (NIGHT.test(t) && /\b(?:film|filme|schauen|gucken)\b/i.test(t))) {
    const genre = genreFromText(t)
    const occasion = NIGHT.test(t) ? 'night' : null
    return { kind: 'recommend', ask: { genre, occasion, limit: RECOMMEND_LIMIT } }
  }
  return null
}

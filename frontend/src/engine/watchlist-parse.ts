import { normalizeUtterance } from './utterance.ts'
import { parseTvWatch } from './tv-parse.ts'
import { parseFilmIntent } from './film-parse.ts'
import { parseToolIntent } from './tools-parse.ts'
import { parseIdeaIntent } from './idea-parse.ts'
import { parseTasteIntent } from './film-taste-parse.ts'
import { isMemoryWrite } from './memory-parse.ts'
import { parseTeachIntent } from './teach-parse.ts'

export type WatchListKind = 'watch' | 'favorite'

export type WatchlistIntent =
  | { kind: 'add'; list: WatchListKind; title: string }
  | { kind: 'list'; list: WatchListKind }
  | { kind: 'show'; list: WatchListKind }
  | { kind: 'remove'; list: WatchListKind; title?: string; index?: number }

const LIST_WORDS =
  /\b(?:watchliste|lieblingsfilm(?:e)?|lieblingsliste|lieblinge|zum\s+schauen)\b/i

function cleanTitle(raw: string): string | null {
  let t = (raw || '')
    .replace(/[.!?]+$/g, '')
    .replace(/\b(?:den|die|das|dem|den|ein|eine|einen|film|filme)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 2 || t.length > 80) return null
  return t
}

function indexOf(raw: string): number | undefined {
  const n = Number(raw)
  return n >= 1 && n <= 40 ? n : undefined
}

export function parseWatchlistIntent(text: string): WatchlistIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (parseTvWatch(t)) return null
  if (parseFilmIntent(t)) return null
  if (parseToolIntent(t)) return null
  if (parseTeachIntent(t)) return null
  if (isMemoryWrite(t)) return null
  const idea = parseIdeaIntent(t)
  if (idea && idea.kind === 'create') return null
  if (parseTasteIntent(t)) return null
  if (!LIST_WORDS.test(t) && !/\b(?:watchliste|lieblings)\b/i.test(t)) return null

  const showFav =
    /^\s*öffne(?:\s+die)?\s+(?:lieblings(?:filme|liste)|lieblinge)\s*$/i.test(t)
  if (showFav) return { kind: 'show', list: 'favorite' }
  if (/^\s*öffne(?:\s+die)?\s+watchliste\s*$/i.test(t)) return { kind: 'show', list: 'watch' }

  if (
    /^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+meine)?|meine)\s+(?:lieblingsfilme|lieblingsliste|lieblinge)\s*$/i.test(t) ||
    /^\s*zeig(?:e)?\s+lieblinge\s*$/i.test(t)
  ) {
    return { kind: 'list', list: 'favorite' }
  }
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+meine)?|meine)\s+watchliste\s*$/i.test(t)) {
    return { kind: 'list', list: 'watch' }
  }

  const rmFavN = /^\s*lieblingsliste\s+(\d+)\s+weg\s*$/i.exec(t)
  if (rmFavN) return { kind: 'remove', list: 'favorite', index: indexOf(rmFavN[1]) }
  const rmWatchN = /^\s*watchliste\s+(\d+)\s+weg\s*$/i.exec(t)
  if (rmWatchN) return { kind: 'remove', list: 'watch', index: indexOf(rmWatchN[1]) }
  const rmFavT =
    /^\s*(?:von\s+der\s+lieblingsliste|lieblingsfilm)\s+(.+?)(?:\s+weg)?\s*$/i.exec(t)
  if (rmFavT) {
    const title = cleanTitle(rmFavT[1].replace(/\s+weg$/i, ''))
    if (title) return { kind: 'remove', list: 'favorite', title }
  }
  const rmWatchT = /^\s*von\s+der\s+watchliste\s+(.+)$/i.exec(t)
  if (rmWatchT) {
    const title = cleanTitle(rmWatchT[1])
    if (title) return { kind: 'remove', list: 'watch', title }
  }

  const addFav =
    /^\s*(?:lieblingsfilm(?:e)?|lieblingsliste)\s*[:\s]\s*(.+)$/i.exec(t) ||
    /^\s*(.+)\s+zu\s+meinen\s+lieblingsfilmen\s*$/i.exec(t) ||
    /^\s*auf\s+(?:die\s+)?lieblingsliste\s+(.+)$/i.exec(t)
  if (addFav) {
    const title = cleanTitle(addFav[1])
    if (title) return { kind: 'add', list: 'favorite', title }
  }

  const addWatch =
    /^\s*watchliste\s*[:\s]\s*(.+)$/i.exec(t) ||
    /^\s*(.+)\s+auf\s+(?:die\s+)?watchliste\s*$/i.exec(t) ||
    /^\s*merk(?:e)?(?:\s+dir)?(?:\s+den\s+film)?\s+(.+)\s+zum\s+schauen\s*$/i.exec(t)
  if (addWatch) {
    const title = cleanTitle(addWatch[1])
    if (title) return { kind: 'add', list: 'watch', title }
  }

  return null
}

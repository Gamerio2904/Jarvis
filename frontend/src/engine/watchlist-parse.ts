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
  | { kind: 'move'; list: WatchListKind; title?: string }
  | { kind: 'list'; list: WatchListKind }
  | { kind: 'show'; list: WatchListKind }
  | { kind: 'remove'; list: WatchListKind; title?: string; index?: number }
  | { kind: 'dedupe'; title?: string }

const LIST_WORDS =
  /\b(?:watchliste|lieblingsfilme?n?|lieblingsliste|lieblinge|zum\s+schauen|filmliste)\b/i

const REMOVE_BARE =
  /^\s*(?:ja\s+)?(?:entferne(?:n)?|lösch(?:e|en)?)\s+(?:das|es|den|ihn|sie)(?:\s+(?:bitte|mal))?\s*$/i

const DEDUPE_BARE =
  /^\s*(?:das\s+)?(?:duplikat|doppelte?(?:n)?\s+(?:einträge?)?)\s+(?:entfernen|weg|fixe?\s+das)\s*$/i

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

function looksWatchlistTalk(t: string): boolean {
  if (LIST_WORDS.test(t) || /\b(?:watchliste|liebling)/i.test(t)) return true
  if (REMOVE_BARE.test(t) || DEDUPE_BARE.test(t)) return true
  if (/\bzu\s+(?:meinen\s+)?lieblingsfilmen\b/i.test(t)) return true
  if (/\b(?:ist|sind)\s+(?:doppelt|zweimal)\b/i.test(t) && /\b(?:liste|watchliste|liebling)/i.test(t)) {
    return true
  }
  return false
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
  if (!looksWatchlistTalk(t)) return null

  if (REMOVE_BARE.test(t)) {
    return { kind: 'remove', list: 'watch' }
  }
  if (DEDUPE_BARE.test(t)) {
    return { kind: 'dedupe' }
  }

  const dedupeNamed =
    /^\s*(.+?)\s+(?:ist|sind)\s+(?:doppelt|zweimal)(?:\s+auf\s+der\s+(?:watch)?liste)?(?:\s+(?:fixe?\s+das|zusammenlegen|entfernen|weg))?\s*$/i.exec(
      t,
    )
  if (dedupeNamed) {
    const title = cleanTitle(dedupeNamed[1])
    if (title && !/^(?:der|die|das|ein|eine)$/i.test(title)) return { kind: 'dedupe', title }
    return { kind: 'dedupe' }
  }

  const showOpen =
    /^\s*(?:öffne[n]?|zeig(?:e)?(?:\s+mir)?|mach(?:e)?(?:\s+(?:mal\s+)?auf)?)\s+(?:das\s+|die\s+|den\s+|meine\s+)?(?:watchliste|lieblings(?:filme|liste)|lieblinge)(?:\s+(?:overlay|folie|panel|liste))?\s*$/i
  if (showOpen.test(t)) {
    const fav = /\bliebling/i.test(t)
    return { kind: 'show', list: fav ? 'favorite' : 'watch' }
  }

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
  if (/^\s*(?:von\s+der\s+watchliste|watchliste\s+weg)\s*$/i.test(t)) {
    return { kind: 'remove', list: 'watch' }
  }
  if (/^\s*(?:von\s+der\s+lieblingsliste|lieblingsliste\s+weg)\s*$/i.test(t)) {
    return { kind: 'remove', list: 'favorite' }
  }
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
  const rmNamed =
    /^\s*(?:entferne(?:n)?|lösch(?:e|en)?)\s+(.+?)\s+von\s+der\s+(?:watchliste|lieblingsliste|liste)\s*$/i.exec(t) ||
    /^\s*(.+)\s+von\s+der\s+(?:watchliste|lieblingsliste|liste)\s+(?:entfernen|löschen|weg)\s*$/i.exec(t)
  if (rmNamed) {
    const title = cleanTitle(rmNamed[1])
    const fav = /\bliebling/i.test(t)
    if (title) return { kind: 'remove', list: fav ? 'favorite' : 'watch', title }
  }

  /**
   * Korrektur ohne Titel: „Nee auf die Lieblingsliste“ nach einem Add.
   * Ein bloßes „Nee“ als Filmtitel wäre falsch.
   */
  if (
    /^\s*(?:(?:nee+|nein|nicht|lieber|doch|stattdessen),?\s+)?(?:auf\s+(?:die\s+)?)?(?:die\s+)?lieblings(?:liste|filme)?\s*$/i.test(
      t,
    ) ||
    /^\s*(?:verschieb(?:e)?|pack(?:e)?|leg(?:e)?)\s+(?:das|den|ihn|sie|es)\s+(?:auf\s+(?:die\s+)?|zu\s+(?:den\s+)?)liebling/i.test(
      t,
    )
  ) {
    return { kind: 'move', list: 'favorite' }
  }
  if (
    /^\s*(?:(?:nee+|nein|nicht|lieber|doch|stattdessen),?\s+)?(?:auf\s+(?:die\s+)?)?(?:die\s+)?watchliste\s*$/i.test(
      t,
    )
  ) {
    return { kind: 'move', list: 'watch' }
  }
  const moveNamed =
    /^\s*(?:verschieb(?:e)?|pack(?:e)?|leg(?:e)?)\s+(.+?)\s+(?:auf\s+(?:die\s+)?|zu\s+(?:den\s+)?)liebling/i.exec(t)
  if (moveNamed) {
    const title = cleanTitle(moveNamed[1])
    if (title && !/^(?:das|den|ihn|sie|es|nee+|nein)$/i.test(title)) {
      return { kind: 'move', list: 'favorite', title }
    }
    return { kind: 'move', list: 'favorite' }
  }

  const addFav =
    /^\s*(?:lieblingsfilm(?:e)?n?|lieblingsliste)\s*[:\s]\s*(.+)$/i.exec(t) ||
    /^\s*(.+)\s+zu\s+(?:meinen\s+)?lieblingsfilmen(?:\s+hinzufügen)?\s*$/i.exec(t) ||
    /^\s*(.+)\s+zu\s+(?:den\s+)?lieblingen(?:\s+hinzufügen)?\s*$/i.exec(t) ||
    /^\s*auf\s+(?:die\s+)?lieblingsliste\s+(.+)$/i.exec(t) ||
    /^\s*(.+)\s+auf\s+(?:die\s+)?lieblingsliste\s*$/i.exec(t)
  if (addFav) {
    const title = cleanTitle(addFav[1])
    if (title && !/^(?:nee+|nein|nicht|lieber|doch|stattdessen)$/i.test(title)) {
      return { kind: 'add', list: 'favorite', title }
    }
  }

  const addWatch =
    /^\s*watchliste\s*[:\s]\s*(.+)$/i.exec(t) ||
    /^\s*(.+)\s+auf\s+(?:die\s+)?watchliste\s*$/i.exec(t) ||
    /^\s*(.+)\s+(?:zu\s+der\s+watchliste|auf\s+die\s+(?:film)?liste)\s+hinzufügen\s*$/i.exec(t) ||
    /^\s*merk(?:e)?(?:\s+dir)?(?:\s+den\s+film)?\s+(.+)\s+zum\s+schauen\s*$/i.exec(t)
  if (addWatch) {
    const title = cleanTitle(addWatch[1])
    if (title) return { kind: 'add', list: 'watch', title }
  }

  return null
}

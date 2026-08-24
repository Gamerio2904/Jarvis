import { normalizeUtterance } from './utterance.ts'
import { parseTvWatch } from './tv-parse.ts'

export type FilmIntent = { kind: 'where' | 'rate' | 'about'; title: string }

const SKIP =
  /\b(wecker|timer|tanke|fahrmodus|carplay|wetter|einkauf|todo|spotify|ventilator|akku|wlan|kaufmodus|sortier(?:e|en)?)\b/i

const WHERE =
  /^\s*(?:wo\s+(?:läuft|laeuft|gibt'?s|gibt\s+es|kann\s+ich(?:\s+mir)?)\s+(?:den\s+film\s+|die\s+serie\s+|das\s+)?(.+?)(?:\s+(?:kostenlos|gratis|umsonst|schauen|sehen|streamen|gucken))?)\s*$/i
const WHERE2 =
  /^\s*(?:ist|läuft|laeuft)\s+(?:der\s+film\s+|die\s+serie\s+)?(.+?)\s+(?:kostenlos|gratis|umsonst|free)\b/i
const WHERE3 =
  /^\s*(.+?)\s+(?:kostenlos|gratis|umsonst)\s+(?:schauen|sehen|streamen|gucken|laufen)\s*$/i
const RATE =
  /^\s*(?:imdb|rotten\s*tomatos?|rotten\s*tomatoes?|\brt\b)\s+(?:von\s+|für\s+|zu\s+)?(.+)\s*$/i
const RATE2 =
  /^\s*(?:wie\s+gut\s+ist|bewertung\s+(?:von|für)|wie\s+ist\s+(?:der\s+film|die\s+serie))\s+(?:der\s+film\s+|die\s+serie\s+)?(.+?)\s*$/i
const RATE3 =
  /^\s*(.+?)\s+(?:imdb|rotten\s*tomatoes?|rotten\s*tomatos?|bewertung)\s*$/i
const ABOUT =
  /^\s*(?:filminfo)\s+(?:zu\s+|von\s+)?(.+)\s*$/i
const ABOUT2 =
  /^\s*(?:was\s+ist\s+(?:das\s+für\s+ein\s+|der\s+)?film)\s+(.+)\s*$/i
const ABOUT3 =
  /^\s*was\s+ist\s+(.+?)\s+für\s+ein(?:en)?\s+film\s*$/i

function cleanTitle(raw: string): string | null {
  let t = (raw || '')
    .replace(/[.!?]+$/g, '')
    .replace(/\b(?:kostenlos|gratis|umsonst|free|schauen|sehen|streamen|gucken|laufen)\b/gi, ' ')
    .replace(/\b(?:der|die|das|dem|den|ein|eine|einen|film|filme|serie|serien)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 2 || t.length > 80) return null
  if (/^(wo|was|wie|ist|läuft|imdb|rotten|mein\s+name)$/i.test(t)) return null
  return t
}

export function parseFilmIntent(text: string): FilmIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || SKIP.test(t)) return null
  if (parseTvWatch(t)) return null
  const where = WHERE.exec(t) || WHERE2.exec(t) || WHERE3.exec(t)
  if (where) {
    const title = cleanTitle(where[1])
    if (title) return { kind: 'where', title }
  }
  const rate = RATE.exec(t) || RATE2.exec(t) || RATE3.exec(t)
  if (rate) {
    const title = cleanTitle(rate[1])
    if (title) return { kind: 'rate', title }
  }
  const about = ABOUT.exec(t) || ABOUT2.exec(t) || ABOUT3.exec(t)
  if (about) {
    const title = cleanTitle(about[1])
    if (title) return { kind: 'about', title }
  }
  return null
}

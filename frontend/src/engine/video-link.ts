/** Chat-Link auf eine YouTube-Suche. Kein erfundener watch?v=-Treffer. */

import { youtubeSearchLink } from './tv-watch.ts'

const LINK = /\b(?:link|url|adresse)\b/i
const VIDEO = /\b(?:videos?|youtube|\byt\b)\b/i
const LATEST = /\b(?:neustes|neuestes|neusten|neuesten|aktuelles|aktuellen)\b/i

export function parseVideoLinkAsk(text: string): string | null {
  const t = text.trim().replace(/[.!?]+$/g, '')
  if (!t || t.length > 180) return null
  if (!(LINK.test(t) && VIDEO.test(t)) && !(LATEST.test(t) && VIDEO.test(t))) return null
  const named =
    /\b(?:zum|zur|von|für)\s+(?:neustes|neuestes|neusten|neuesten|aktuelles|aktuellen)?\s*(?:der|dem|den|die|das)?\s*(.+?)\s+(?:video|youtube|yt)\b/i.exec(t)
    || /\b(?:video|youtube|yt)\s+(?:von|vom)\s+(?:der|dem|den|die|das)?\s*(.+)$/i.exec(t)
  const name = (named?.[1] || '')
    .replace(/\b(?:neustes|neuestes|neusten|neuesten|aktuelles|aktuellen|link|video|youtube|yt)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (name.length < 2) return null
  return name
}

export function videoLinkReply(name: string): string {
  const url = youtubeSearchLink(`${name} neuestes Video`)
  return `Suchlink zum neuesten Video von ${name}: ${url}`
}

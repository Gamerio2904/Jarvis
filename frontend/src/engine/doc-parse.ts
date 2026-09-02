import { normalizeUtterance } from './utterance.ts'

export type DocIntent = { kind: 'read' } | { kind: 'ask' }

const PHOTO =
  /\b(foto|zettel|beleg|waschlabel|strichcode|ean|auge|bildschirm|schirm)\b/i
const FILE =
  /\b(pdf|dokument(?:e)?|datei(?:en)?|anhang|attachment|txt|markdown|text(?:datei)?)\b/i
const READ =
  /\b(lies|lese|lesen|was\s+steht|inhalt|zusammenfass(?:e|en)?|was\s+steht\s+drin)\b/i
const BARE_READ = /^\s*(?:lies|lese)\s+(?:das|die|den)\s+.+\s*$/i

export function parseDocIntent(text: string): DocIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (PHOTO.test(t) && !FILE.test(t)) return null
  if (/\b(was\s+steht\s+am|was\s+steht\s+heute|freitag|termin)\b/i.test(t) && !FILE.test(t)) return null
  if (/^\s*(?:was\s+steht\s+drin|lies\s+(?:das|die)\s+(?:pdf|datei|dokument)|datei\s+lesen)\s*[.!?]*$/i.test(t)) {
    return { kind: 'read' }
  }
  if (FILE.test(t) && READ.test(t)) return { kind: 'read' }
  if (FILE.test(t) && /^(?:zeig(?:e)?|öffne)\s+(?:das|die|den)?\s*(?:pdf|datei|dokument)/i.test(t)) {
    return { kind: 'ask' }
  }
  if (FILE.test(t) && BARE_READ.test(t)) return { kind: 'read' }
  return null
}

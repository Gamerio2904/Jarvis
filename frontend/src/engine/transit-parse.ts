import { normalizeUtterance } from './utterance.ts'

export type TransitIntent =
  | { kind: 'to'; to: string; from?: string }
  | { kind: 'ask' }

const SKIP =
  /^(fuß|fuss|hause|heim|zuhause|hier|jetzt|mal|bitte|los|mir|dir)$/i

export function parseTransitIntent(text: string): TransitIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (!/\b(bahn|zug|öpnv|oepnv|s-?bahn|u-?bahn|bus|nahverkehr|abfahrt|verbindung(?:en)?|fahrplan)\b/i.test(t)) {
    return null
  }
  if (/\b(tanke|tankstelle|fernseh|netflix|wecker|timer|anklicken|fifa)\b/i.test(t)) return null

  const fromTo =
    /^\s*(?:mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)|öpnv|bahn|zug)\s+von\s+(.+?)\s+nach\s+(.+?)\s*$/i.exec(t) ||
    /^\s*von\s+(.+?)\s+nach\s+(.+?)\s+mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)\s*$/i.exec(t)
  if (fromTo) {
    const from = cleanPlace(fromTo[1])
    const to = cleanPlace(fromTo[2])
    if (from && to) return { kind: 'to', from, to }
  }

  const to =
    /^\s*(?:(?:nächste|nächster|nächstes)\s+)?(?:(?:mit\s+(?:der\s+)?)?(?:bahn|zug|bus|öpnv|s-?bahn)\s+)?(?:nach|zu(?:r|m)?)\s+(.+?)\s*$/i.exec(
      t,
    ) ||
    /^\s*(?:wann\s+fährt|nächste\s+abfahrt|verbindung(?:en)?|fahrplan)\s+(?:(?:der\s+)?(?:zug|die\s+bahn|der\s+bus)\s+)?(?:nach|zu(?:r|m)?)\s+(.+?)\s*$/i.exec(
      t,
    ) ||
    /^\s*(?:nächste|nächster)\s+(?:bahn|zug|bus|s-?bahn|öpnv)\s+(?:nach|zu(?:r|m)?)\s+(.+?)\s*$/i.exec(t) ||
    /^\s*(?:mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)|öpnv)\s+(?:zu(?:r|m)?|nach)\s+(.+?)\s*$/i.exec(t) ||
    /^\s*(?:nach|zu(?:r|m)?)\s+(.+?)\s+mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)\s*$/i.exec(t) ||
    /^\s*(?:fahr(?:e)?(?:\s+mich)?|bring(?:e)?(?:\s+mich)?)\s+mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)\s+(?:zu(?:r|m)?|nach)\s+(.+?)\s*$/i.exec(
      t,
    )
  if (to) {
    const dest = cleanPlace(to[1])
    if (dest) return { kind: 'to', to: dest }
  }

  if (
    /^\s*(?:nächste\s+)?(?:bahn|zug|öpnv|abfahrt|fahrplan|verbindung(?:en)?)\s*[.!?]*$/i.test(t) ||
    /^\s*wann\s+fährt\s+(?:der\s+)?(?:zug|die\s+bahn|der\s+bus)\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'ask' }
  }
  return null
}

function cleanPlace(raw: string): string {
  const t = raw
    .trim()
    .replace(/[?.!]+$/g, '')
    .replace(/\s+(?:fahren|los|bitte|heute|jetzt)$/i, '')
    .replace(/\s+mit\s+(?:der\s+)?(?:bahn|dem\s+zug|bus|öpnv)$/i, '')
    .trim()
  if (!t || t.length < 2 || SKIP.test(t)) return ''
  return t
}

import { normalizeUtterance } from './utterance.ts'

export type OfferIntent = { kind: 'watch' | 'unwatch' | 'check' | 'status'; query?: string }

const ITEM =
  /\b(instanudeln|instant\s*nudeln|instant\s*noodles?|ramen|fertigsuppe|5\s*minuten\s*terrine)\b/i

export function parseOfferIntent(text: string): OfferIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  const item = ITEM.exec(t)?.[1]
  const watch = /\b(sag\s+bescheid|benachrichtig(?:e)?|erinner(?:e)?\s+mich|watchlist)\b/i.test(t) &&
    (item || /\bangebot\b/i.test(t))
  if (/\b(nicht\s+mehr|watchlist\s+aus|kein\s+bescheid)\b/i.test(t) && (item || /\binsta/i.test(t))) {
    return { kind: 'unwatch', query: item || 'Instanudeln' }
  }
  if (watch && item) return { kind: 'watch', query: item }
  if (watch && /\binsta/i.test(t)) return { kind: 'watch', query: 'Instanudeln' }
  if (/\b(ist|sind|gibt.?s|liegt)\b/i.test(t) && item && /\bangebot\b/i.test(t)) {
    return { kind: 'check', query: item }
  }
  if (/^\s*(?:watchlist|angebots.?liste)\s*[.!?]*$/i.test(t)) return { kind: 'status' }
  return null
}

export const DEFAULT_OFFER_TERMS = ['instanudeln', 'instant noodles', 'ramen']

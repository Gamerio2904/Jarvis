import { normalizeUtterance } from './utterance.ts'

export type AmazonIntent =
  | { kind: 'play'; query: string }
  | { kind: 'open' }
  | { kind: 'pause' }

const AMAZON = /\bamazon(?:\s+musik|\s+music)?\b/i

export function namesAmazon(text: string): boolean {
  return AMAZON.test(text)
}

export function parseAmazonIntent(text: string): AmazonIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || !AMAZON.test(t)) return null
  if (/^\s*(?:zeig(?:e)?|öffne)\s+amazon(?:\s+musik|\s+music)?\s*[.!?]*$/i.test(t)) return { kind: 'open' }
  if (/\b(pause|pausier|stopp)\b/i.test(t)) return { kind: 'pause' }
  const play = /^\s*(?:spiel(?:e)?(?:\s+mal)?|play)\s+(?:auf\s+amazon(?:\s+musik|\s+music)?\s+)?(.+?)\s*$/i.exec(
    t.replace(/\s+auf\s+amazon(?:\s+musik|\s+music)?\s*[.!?]*$/i, '').trim(),
  )
  if (play?.[1]) {
    const query = play[1]
      .replace(/\s+auf\s+amazon(?:\s+musik|\s+music)?$/i, '')
      .replace(/[.!?]+$/, '')
      .trim()
    if (!query || /^(das|es|musik|was)$/i.test(query)) return { kind: 'open' }
    return { kind: 'play', query }
  }
  if (/^\s*amazon(?:\s+musik|\s+music)?\s*[.!?]*$/i.test(t)) return { kind: 'open' }
  return { kind: 'open' }
}

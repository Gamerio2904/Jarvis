import { normalizeUtterance } from './utterance.ts'

export type NewsIntent = { kind: 'national' } | { kind: 'place'; place: string }

const SKIP =
  /^(heute|jetzt|hier|los|news|nachrichten|tagesschau|passiert)$/i

export function parseNewsIntent(text: string): NewsIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (
    /\b(weltlage|weltbrief|in\s+der\s+welt|auf\s+der\s+welt)\b/i.test(t) &&
    !/\b(nachrichten|tagesschau|schlagzeilen)\b/i.test(t)
  ) {
    return null
  }

  const local =
    /^\s*was\s+(?:ist|war|gab\s+es|passierte)\s+(?:denn\s+)?(?:heute\s+)?in\s+(.+?)\s+(?:passiert|los|gewesen)\s*[.!?]*$/i.exec(
      t,
    ) ||
    /^\s*was\s+ist\s+(?:heute\s+)?in\s+(.+?)\s+passiert\s*[.!?]*$/i.exec(t) ||
    /^\s*(?:lokale\s+)?nachrichten\s+(?:aus|für|in)\s+(.+?)\s*$/i.exec(t) ||
    /^\s*was\s+gibt\s+es\s+(?:heute\s+)?(?:neues\s+)?(?:in|aus)\s+(.+?)\s*$/i.exec(t)
  if (local) {
    const place = cleanPlace(local[1])
    if (place) return { kind: 'place', place }
  }

  if (
    /^\s*(?:die\s+)?(?:nachrichten|tagesschau|news|schlagzeilen)\s*[.!?]*$/i.test(t) ||
    /^\s*was\s+(?:gibt\s+es\s+)?(?:in\s+den\s+)?(?:nachrichten|schlagzeilen)\s*[.!?]*$/i.test(t) ||
    /^\s*was\s+sind\s+(?:die\s+)?(?:heutigen\s+)?(?:schlagzeilen|nachrichten)\s*[.!?]*$/i.test(t) ||
    /^\s*was\s+ist\s+(?:heute\s+)?(?:in\s+den\s+nachrichten\s+)?passiert\s*[.!?]*$/i.test(t) ||
    /^\s*tagesschau\s*[.!?]*$/i.test(t)
  ) {
    return { kind: 'national' }
  }
  if (
    /\b(nachrichten|tagesschau|schlagzeilen)\b/i.test(t) &&
    t.length < 80 &&
    !/\b(suche|im\s+internet)\b/i.test(t)
  ) {
    const inPlace = /(?:in|aus|für)\s+([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-\s]{1,40})$/i.exec(t)
    if (inPlace) {
      const place = cleanPlace(inPlace[1])
      if (place) return { kind: 'place', place }
    }
    return { kind: 'national' }
  }
  return null
}

function cleanPlace(raw: string): string {
  const t = raw
    .trim()
    .replace(/[?.!]+$/g, '')
    .replace(/^(dem|der|den|die|das)\s+/i, '')
    .trim()
  if (!t || t.length < 2 || SKIP.test(t)) return ''
  return t
}

/** Treffer nur, wenn der Ortsname nicht bloß in einer Uni-/College-Zeile steht. */
export function placeInHeadline(place: string, title: string, teaser: string): boolean {
  const p = place.trim()
  if (!p) return false
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const word = new RegExp(`\\b${esc}\\b`, 'i')
  const affiliation = new RegExp(
    `(?:king['’]?s\\s+college(?:\\s+${esc})?|university(?:\\s+college)?\\s+of\\s+${esc}|${esc}\\s+(?:university|universität|college|school)|college\\s+${esc})`,
    'gi',
  )
  const cleaned = (s: string) => s.replace(affiliation, ' ')
  return word.test(cleaned(title)) || word.test(cleaned(teaser))
}

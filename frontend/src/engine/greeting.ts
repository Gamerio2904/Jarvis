import { normalizeUtterance } from './utterance.ts'
import { isBriefAsk } from './brief-parse.ts'

export type DayPart = 'morning' | 'day' | 'evening' | 'night'

export function dayPartAt(now = new Date()): DayPart {
  const h = now.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export function parseGreeting(text: string): DayPart | 'echo' | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 80) return null
  if (isBriefAsk(t)) return null
  if (/\b(wetter|timer|wecker|termin|fahr|zeig|suche)\b/i.test(t)) return null
  const named = /^\s*(?:guten\s+|gute\s+)(morgen|tag|abend|nacht)\b/i.exec(t)
  if (named) return partFromWord(named[1])
  if (/^\s*(?:hallo|hi|hey|na)(?:\s+jarvis)?\s*[.!?]*$/i.test(t)) return 'echo'
  if (/^\s*(?:schönen?\s+abend|gute\s+nacht)\s*[.!?]*$/i.test(t)) {
    return /nacht/i.test(t) ? 'night' : 'evening'
  }
  if (/wie\s+geht(?:'|\u2019)?s?(?:\s+es)?\s+(?:dir|ihnen)\b/i.test(t) || /^\s*ach\b.{0,40}\bgeht/i.test(t)) {
    if (/\b(arbeit|nachricht|welt|valeo|nachrichten)\b/i.test(t)) return null
    if ((/\b(und|aber|weil)\b/i.test(t) || t.length > 48) && t.split(/\s+/).length >= 8) return null
    if (/\babend\b/i.test(t)) return 'evening'
    if (/\bnacht\b/i.test(t)) return 'night'
    if (/\bmorgen\b/i.test(t)) return 'morning'
    if (/\btag\b/i.test(t)) return 'day'
    return 'echo'
  }
  return null
}

function partFromWord(w: string): DayPart {
  const s = w.toLowerCase()
  if (s === 'morgen') return 'morning'
  if (s === 'abend') return 'evening'
  if (s === 'nacht') return 'night'
  return 'day'
}

export function greetingReply(part: DayPart | 'echo', now = new Date(), asked = ''): string {
  const clock = dayPartAt(now)
  const want = part === 'echo' ? clock : part
  const line =
    want === 'morning'
      ? 'Guten Morgen.'
      : want === 'evening'
        ? 'Guten Abend.'
        : want === 'night'
          ? 'Gute Nacht.'
          : 'Guten Tag.'
  if (part !== 'echo' && part !== clock) {
    if (clock === 'night' && (part === 'evening' || part === 'day')) {
      return `${line} Hier ist Mitternacht vorbei — ich bleibe beim Abend, wenn Sie so kommen.`
    }
  }
  if (/wie\s+geht/i.test(asked)) return `${line} Gut, danke. Und Ihnen?`
  return `${line} Was steht an?`
}

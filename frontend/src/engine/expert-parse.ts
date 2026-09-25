/** Ein Dispatcher-Agent, der Themen-Experten anlegt. Kein Schwarm, kein 5. Hirn. */
import { normalizeUtterance } from './utterance.ts'
import { slugTopic } from './teach-parse.ts'

export type ExpertIntent =
  | { kind: 'create'; topic: string; confirm: boolean }
  | { kind: 'list' }
  | { kind: 'forget'; topic: string }
  | { kind: 'ask'; topic: string | null }

const CONFIRM = /^(?:ja(?:\s+bitte)?|jo|yes|ok|okay|mach(?:\s+es|\s+mal)?)\s*[.!?]?$/i

const STEAL = /\b(nutella|carbonara|wäsche|zutat(?:en)?\s+von|staffel\s+[6-9])\b/i

const CREATE =
  /^\s*(?:werde(?:\s+ein)?|sei|mach(?:e)?(?:\s+dich)?(?:\s+zum)?|erstell(?:e)?(?:\s+einen?)?)\s+experte[n]?\s+(?:in|für|zu|im|zum?)\s+(.+?)\s*[.!]?\s*$/i

const LIST = /^\s*(?:welche|zeig(?:e)?(?:\s+mir)?(?:\s+deine)?)\s+experte[n]?(?:\s+hast\s+du)?\s*[?!.]?\s*$/i

const FORGET = /^\s*vergiss(?:\s+den)?\s+experte[n]?\s+(.+?)\s*[.!]?\s*$/i

const ASK_MARK =
  /^\s*(?:(?:als\s+)?experte|im\s+fach)\s*[:–—]?\s+(.+?)\s*$/i

function cleanTopic(raw: string): string | null {
  const t = raw
    .replace(/[.!?]+$/g, '')
    .replace(/^(?:z\.?\s*b\.?|zum\s+beispiel)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length < 2 || t.length > 80) return null
  return t
}

export function readExpertTopics(raw: string): string[] {
  try {
    const rows = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(rows)) return []
    return rows.map((x) => String(x || '').trim()).filter((x) => x.length >= 2).slice(0, 24)
  } catch {
    return []
  }
}

export function topicMatches(text: string, topics: string[]): string | null {
  const n = text.toLowerCase()
  for (const topic of topics) {
    const slug = slugTopic(topic)
    if (slug && n.includes(slug.replace(/-/g, ' '))) return topic
    if (slug && n.includes(slug.replace(/-/g, ''))) return topic
    if (topic && n.includes(topic.toLowerCase())) return topic
  }
  return null
}

export function parseExpertIntent(
  text: string,
  lastTool = '',
  topicsRaw = '',
): ExpertIntent | null {
  const t = normalizeUtterance(text || '').trim()
  if (!t || t.length > 240) return null
  if (STEAL.test(t)) return null

  if ((lastTool === 'expert' || lastTool === 'expert_offer') && CONFIRM.test(t)) {
    return { kind: 'create', topic: '', confirm: true }
  }

  const create = CREATE.exec(t)
  if (create) {
    const topic = cleanTopic(create[1])
    if (!topic) return null
    return { kind: 'create', topic, confirm: false }
  }

  if (LIST.test(t)) return { kind: 'list' }

  const forget = FORGET.exec(t)
  if (forget) {
    const topic = cleanTopic(forget[1])
    if (!topic) return null
    return { kind: 'forget', topic }
  }

  const marked = ASK_MARK.exec(t)
  if (marked) {
    return { kind: 'ask', topic: cleanTopic(marked[1]) }
  }

  const topics = readExpertTopics(topicsRaw)
  const hit = topicMatches(t, topics)
  if (hit && /\b(?:wer|was|wie|warum|wo|erzähl|welche)\b/i.test(t)) {
    return { kind: 'ask', topic: hit }
  }

  if (lastTool === 'expert' && /^(?:wer|was|wie|warum|wo|erzähl|welche)\b/i.test(t)) {
    return { kind: 'ask', topic: null }
  }

  return null
}

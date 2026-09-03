/** Bewusstes Anlernen. Nicht Mate, nicht Zahnarzt-Freitag, nicht IR-Ventilator. */

export type TeachIntent = {
  kind: 'teach' | 'merge'
  topic: string | null
  body: string | null
  confirm: boolean
}

const WEEKDAY_CAL =
  /\b(?:freitag|montag|dienstag|mittwoch|donnerstag|samstag|sonntag|zahnarzt|termin)\b/i

const CONFIRM = /^(?:ja(?:\s+bitte)?|jo|yes|ok|okay|mach(?:\s+es|\s+mal)?)\s*[.!?]?$/i

const TEACH_BARE = /^\s*lern(?:e)?\s+das\s*[.!]?\s*$/i

const TEACH_AS =
  /^\s*(?:lern(?:e)?\s+das|merk(?:e)?\s*dir|das\s+(?:ist|gehört(?:\s+zum)?))\s+(?:als\s+)?fachwissen\s+(.+)$/is

const MERGE =
  /^\s*(?:ergänze\s+fachwissen|lern(?:e)?\s+das\s+noch\s+zum\s+thema)\s+(.+)$/is

export function slugTopic(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function titleFromTopic(topic: string): string {
  const t = topic.replace(/[-_]+/g, ' ').trim()
  if (!t) return 'Fachwissen'
  return t.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function splitTopicBody(rest: string): { topic: string | null; body: string | null } {
  const raw = rest.replace(/[.!?]+$/g, '').trim()
  if (!raw) return { topic: null, body: null }
  const m = /^(.+?)\s*[:–—]\s+(.+)$/s.exec(raw)
  if (m) {
    const topic = slugTopic(m[1])
    const body = m[2].trim()
    return { topic: topic || null, body: body || null }
  }
  return { topic: slugTopic(raw) || null, body: null }
}

export function parseTeachIntent(text: string, lastTool = ''): TeachIntent | null {
  const t = text.trim()
  if (!t || t.length > 2000) return null
  if (/^\s*merk(?:e)?\s*dir\b/i.test(t) && WEEKDAY_CAL.test(t) && !/fachwissen/i.test(t)) return null
  if (/^\s*merk(?:e)?\s*dir\b/i.test(t) && !/fachwissen/i.test(t)) return null

  if ((lastTool === 'teach_offer' || lastTool === 'knowledge_offer') && CONFIRM.test(t)) {
    return { kind: 'teach', topic: null, body: null, confirm: true }
  }

  const merge = MERGE.exec(t)
  if (merge) {
    const { topic, body } = splitTopicBody(merge[1])
    return { kind: 'merge', topic, body, confirm: false }
  }

  const as = TEACH_AS.exec(t)
  if (as) {
    const { topic, body } = splitTopicBody(as[1])
    return { kind: 'teach', topic, body, confirm: false }
  }

  if (TEACH_BARE.test(t)) return { kind: 'teach', topic: null, body: null, confirm: false }
  return null
}

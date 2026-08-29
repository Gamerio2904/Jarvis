import { formatDue, parseReminderIntent, startOfDay } from './remind-parse.ts'

export type CalendarIntent =
  | { kind: 'create'; title: string; start: Date; whenLabel: string; place?: string }
  | { kind: 'list'; day?: Date; until?: Date; label?: string }
  | { kind: 'delete'; query: string }
  | { kind: 'delete_last' }
  | { kind: 'open' }

const WEEKDAYS = 'montag|dienstag|mittwoch|donnerstag|freitag|friday|samstag|sonnabend|sonntag'
const CREATE = /^\s*termin(?:e)?\s*[:-]?\s*(.+)$/is
const CREATE_NL =
  /^\s*(?:erstell(?:e)?|leg(?:e)?\s+an|mach(?:e)?)\s+(?:einen?\s+)?termin(?:\s+für)?(?:\s+den)?\s+(\d{1,2})\.(\d{1,2})\.?\s*(\d{2,4})?\s*[, ]+(?:um\s+)?(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)?\s*[,:]?\s+(.+)$/is
const OPEN = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+)?)?kalender\s*$/i
const LIST_ALL = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:meine\s+)?)?termine\s*$/i
const LIST_DAY = new RegExp(
  `^\\s*(?:was\\s+habe\\s+ich|termine?|kalender|was\\s+steht)\\s+(?:so\\s+)?(?:am\\s+)?(heute|morgen|übermorgen|${WEEKDAYS})(?:\\s+so)?(?:\\s+an)?\\s*\\??\\s*$`,
  'i',
)
const LIST_WEEK =
  /^\s*was\s+steht\s+(?:so\s+)?diese\s+woche(?:\s+so)?(?:\s+an)?\s*\??\s*$/i
const LIST_DAYS =
  /^\s*was\s+steht\s+(?:so\s+)?(?:die\s+)?nächste(?:n)?\s+(\d{1,2})\s+tage(?:\s+an)?\s*\??\s*$/i
const DELETE = /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?termin\s+(.+)$/is
const DELETE_LAST =
  /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?letzten\s+termin\s*$/i

const DAY_SHIFT: Record<string, number> = {
  heute: 0,
  morgen: 1,
  übermorgen: 2,
}

const WEEKDAY_JS: Record<string, number> = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  friday: 5,
  samstag: 6,
  sonnabend: 6,
}

export function dayFromWord(word: string, now = new Date()): Date {
  const w = word.toLowerCase()
  const d = startOfDay(now)
  if (w in DAY_SHIFT) {
    d.setDate(d.getDate() + DAY_SHIFT[w])
    return d
  }
  const want = WEEKDAY_JS[w]
  if (want === undefined) return d
  const add = (want - d.getDay() + 7) % 7
  d.setDate(d.getDate() + add)
  return d
}

function dateFromParts(
  now: Date,
  dayStr: string,
  monthStr: string,
  yearStr?: string,
): Date | null {
  const day = Number(dayStr)
  const month = Number(monthStr)
  if (!Number.isFinite(day) || !Number.isFinite(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null
  }
  let year = now.getFullYear()
  if (yearStr) {
    const y = Number(yearStr)
    if (!Number.isFinite(y)) return null
    year = y < 100 ? 2000 + y : y
  }
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  if (!yearStr && startOfDay(d).getTime() < startOfDay(now).getTime()) d.setFullYear(year + 1)
  return d
}

function createFromInner(raw: string, now: Date): CalendarIntent | null {
  const inner = parseReminderIntent(raw.trim(), now)
  if (inner?.kind === 'create') {
    const split = splitTitlePlace(inner.title)
    return {
      kind: 'create',
      title: split.title,
      place: split.place,
      start: inner.due,
      whenLabel: inner.whenLabel,
    }
  }
  const title = raw.trim()
  if (!title) return null
  const split = splitTitlePlace(title)
  const start = new Date(now)
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  return { kind: 'create', title: split.title, place: split.place, start, whenLabel: formatDue(start, now) }
}

export function parseCalendarIntent(text: string, now = new Date()): CalendarIntent | null {
  const t = text.trim()
  if (!t || t.length > 220) return null
  if (OPEN.test(t)) return { kind: 'open' }
  if (LIST_ALL.test(t)) return { kind: 'list' }
  if (LIST_WEEK.test(t)) {
    const from = startOfDay(now)
    const until = new Date(from)
    until.setDate(until.getDate() + 7)
    return { kind: 'list', day: from, until, label: 'diese Woche' }
  }
  const days = LIST_DAYS.exec(t)
  if (days) {
    const n = Math.min(14, Math.max(1, Number(days[1]) || 1))
    const from = startOfDay(now)
    const until = new Date(from)
    until.setDate(until.getDate() + n)
    return { kind: 'list', day: from, until, label: `die nächsten ${n} Tage` }
  }
  const day = LIST_DAY.exec(t)
  if (day) return { kind: 'list', day: dayFromWord(day[1], now) }
  if (DELETE_LAST.test(t)) return { kind: 'delete_last' }
  const del = DELETE.exec(t)
  if (del) return { kind: 'delete', query: del[1].replace(/[.!?]+$/, '').trim() }

  const nl = CREATE_NL.exec(t)
  if (nl) {
    const startDay = dateFromParts(now, nl[1], nl[2], nl[3] || undefined)
    const h = Number(nl[4])
    const m = nl[5] ? Number(nl[5]) : 0
    const split = splitTitlePlace(nl[6].replace(/[.!?]+$/, '').trim())
    if (startDay && Number.isFinite(h) && split.title) {
      startDay.setHours(h, Number.isFinite(m) ? m : 0, 0, 0)
      return {
        kind: 'create',
        title: split.title,
        place: split.place,
        start: startDay,
        whenLabel: formatDue(startDay, now),
      }
    }
  }

  const created = CREATE.exec(t)
  if (created) return createFromInner(created[1], now)
  return null
}

export function splitTitlePlace(raw: string): { title: string; place?: string } {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (!t) return { title: 'Termin' }
  const inPlace = t.match(/^(.+?)\s+(?:in|an der|am|auf der)\s+(.+)$/i)
  if (inPlace && inPlace[1].trim().length >= 2) {
    const place = inPlace[2].trim()
    if (!/\b(?:uhr|minuten?|stunden?)\b/i.test(place) && !/^\d/.test(place)) {
      return { title: inPlace[1].trim(), place }
    }
  }
  const m = t.match(/^(.+?)\s+((?:[A-ZÄÖÜ][\wÄÖÜäöüß.-]{2,})(?:\s+\d+[a-z]?)?)$/)
  if (m && m[1].trim().length >= 2) {
    const place = m[2].trim()
    if (!/\b(?:uhr|minuten?|stunden?)\b/i.test(place) && !/^\d/.test(place)) {
      return { title: m[1].trim(), place }
    }
  }
  return { title: t }
}

export type CalDecision = 'overwrite' | 'keep' | 'add' | 'yes'

export function parseCalDecision(text: string): CalDecision | null {
  const t = text.trim()
  if (/^\s*(belassen|behalten|lassen|nein|nicht|abbrechen)\s*[.!?]*$/i.test(t)) return 'keep'
  if (/^\s*(überschreiben|ueberschreiben|ersetzen)\s*[.!?]*$/i.test(t)) return 'overwrite'
  if (/^\s*(trotzdem|beides|auch|eintragen)\s*[.!?]*$/i.test(t)) return 'add'
  if (/^\s*(ja|jo|yes|ok|okay|mach(?:\s+(?:es|mal))?|bitte|passt)\s*[.!?]*$/i.test(t)) return 'yes'
  return null
}

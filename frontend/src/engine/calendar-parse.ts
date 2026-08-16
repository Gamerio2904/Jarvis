import { formatDue, parseReminderIntent, startOfDay } from './remind-parse.ts'

export type CalendarIntent =
  | { kind: 'create'; title: string; start: Date; whenLabel: string }
  | { kind: 'list'; day?: Date }
  | { kind: 'delete'; query: string }
  | { kind: 'delete_last' }
  | { kind: 'open' }

const WEEKDAYS = 'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag'
const CREATE = /^\s*termin(?:e)?\s*[:-]?\s*(.+)$/is
const OPEN = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+)?)?kalender\s*$/i
const LIST_ALL = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:meine\s+)?)?termine\s*$/i
const LIST_DAY = new RegExp(
  `^\\s*(?:was\\s+habe\\s+ich|termine?|kalender)\\s+(?:am\\s+)?(heute|morgen|übermorgen|${WEEKDAYS})\\s*\\??\\s*$`,
  'i',
)
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

export function parseCalendarIntent(text: string, now = new Date()): CalendarIntent | null {
  const t = text.trim()
  if (!t || t.length > 200) return null
  if (OPEN.test(t)) return { kind: 'open' }
  if (LIST_ALL.test(t)) return { kind: 'list' }
  const day = LIST_DAY.exec(t)
  if (day) return { kind: 'list', day: dayFromWord(day[1], now) }
  if (DELETE_LAST.test(t)) return { kind: 'delete_last' }
  const del = DELETE.exec(t)
  if (del) return { kind: 'delete', query: del[1].replace(/[.!?]+$/, '').trim() }

  const created = CREATE.exec(t)
  if (created) {
    const inner = parseReminderIntent(created[1].trim(), now)
    if (inner?.kind === 'create') {
      return {
        kind: 'create',
        title: inner.title,
        start: inner.due,
        whenLabel: inner.whenLabel,
      }
    }
    const title = created[1].trim()
    if (title) {
      const start = new Date(now)
      start.setMinutes(0, 0, 0)
      start.setHours(start.getHours() + 1)
      return { kind: 'create', title, start, whenLabel: formatDue(start, now) }
    }
  }
  return null
}

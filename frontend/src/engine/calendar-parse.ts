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
const LIST_NEXT = new RegExp(
  `^\\s*(?:was\\s+steht|termine?|kalender)\\s+(?:so\\s+)?(?:am\\s+)?nächste(?:n)?\\s+(${WEEKDAYS})(?:\\s+an)?\\s*\\??\\s*$`,
  'i',
)
const LIST_CAL_DAY = new RegExp(
  `^\\s*(?:zeig(?:e)?\\s+(?:mir\\s+)?)?(?:den\\s+)?kalender\\s+(heute|morgen|übermorgen|${WEEKDAYS})\\s*$`,
  'i',
)
const LIST_WEEK =
  /^\s*was\s+steht\s+(?:so\s+)?diese\s+woche(?:\s+so)?(?:\s+an)?\s*\??\s*$/i
const LIST_DAYS =
  /^\s*was\s+steht\s+(?:so\s+)?(?:die\s+)?nächste(?:n)?\s+(\d{1,2})\s+tage(?:\s+an)?\s*\??\s*$/i
const DELETE = /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?termin\s+(.+)$/is
const DELETE_LAST =
  /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?letzten\s+termin\s*$/i
const CANCEL_LAST =
  /^\s*(?:(?:den\s+)?(?:letzten\s+)?termin(?:e)?\s+absagen|sag(?:e)?\s+(?:den\s+)?(?:letzten\s+)?termin\s+ab)\s*[.!]?\s*$/i

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

/** „nächsten Freitag“: wenn heute Freitag ist, +7. */
export function nextNamedDay(word: string, now = new Date()): Date {
  const d = dayFromWord(word, now)
  if (startOfDay(d).getTime() === startOfDay(now).getTime()) d.setDate(d.getDate() + 7)
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
  const nxt = LIST_NEXT.exec(t)
  if (nxt) {
    const day = nextNamedDay(nxt[1], now)
    return { kind: 'list', day, label: `nächsten ${nxt[1]}` }
  }
  const calDay = LIST_CAL_DAY.exec(t)
  if (calDay) return { kind: 'list', day: dayFromWord(calDay[1], now) }
  const day = LIST_DAY.exec(t)
  if (day) return { kind: 'list', day: dayFromWord(day[1], now) }
  if (DELETE_LAST.test(t) || CANCEL_LAST.test(t)) return { kind: 'delete_last' }
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
  const merk = /^\s*merk(?:e)?\s*dir\s+(?:bitte\s*)?(?:dass\s+)?(.+)$/is.exec(t)
  if (merk && /\b(?:zahnarzt|arzt|termin|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen)\b/i.test(merk[1])) {
    const inner = merk[1].replace(/^ich\s+/i, '').replace(/\s+habe\.?$/i, '').trim()
    return createFromInner(inner, now)
  }
  return null
}

export function splitTitlePlace(raw: string): { title: string; place?: string } {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (!t) return { title: 'Termin' }
  const inPlace = t.match(/^(.+?)\s+(?:in|an der|am|auf der)\s+(.+)$/i)
  if (inPlace && inPlace[1].trim().length >= 2) {
    return { title: inPlace[1].trim(), place: inPlace[2].trim() }
  }
  const m = t.match(/^(.+?)\s+((?:[A-ZÄÖÜ][\wÄÖÜäöüß.-]{2,})(?:\s+\d+[a-z]?)?)$/)
  if (m && m[1].trim().length >= 2) {
    return { title: m[1].trim(), place: m[2].trim() }
  }
  return { title: t }
}

const WORD_NUM: Record<string, number> = {
  ein: 1,
  eine: 1,
  einem: 1,
  einer: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  fünfzehn: 15,
  zwanzig: 20,
  vierundzwanzig: 24,
  dreißig: 30,
  sechzig: 60,
}

const OFFSET_TOKEN =
  /(?:(\d+)|(ein(?:e[mr]?|e)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|fünfzehn|zwanzig|vierundzwanzig|dreißig|sechzig))\s*(minuten?|min\.?|stunden?|tag(?:en|e)?)\s*(?:davor|vorher|vor\s+(?:dem\s+)?termin)/gi

const NONE_REMIND =
  /^\s*(?:keine(?:\s+extra)?\s+erinnerung|nicht\s+erinnern|ohne\s+erinnerung|nein,?\s*nicht\s+erinnern)\s*[.!]?\s*$/i
const AT_START =
  /^\s*(?:am\s+termin|zum\s+termin|nur\s+(?:am|zum)\s+(?:termin|start)|nur\s+dann)\s*[.!]?\s*$/i

export type RemindOffsetHit =
  | { kind: 'offsets'; minutes: number[] }
  | { kind: 'none' }
  | { kind: 'at_start' }

function tokenToMinutes(n: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('min')) return n
  if (u.startsWith('stund')) return n * 60
  return n * 24 * 60
}

/** Fristen nach „Wann soll ich Sie erinnern?“. Sonst null — dann kein Kalender-Diebstahl. */
export function parseRemindOffsets(text: string): RemindOffsetHit | null {
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw) return null
  if (NONE_REMIND.test(raw)) return { kind: 'none' }
  if (AT_START.test(raw)) return { kind: 'at_start' }
  const minutes: number[] = []
  OFFSET_TOKEN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = OFFSET_TOKEN.exec(raw))) {
    const n = m[1] ? Number(m[1]) : WORD_NUM[(m[2] || '').toLowerCase()]
    if (!Number.isFinite(n) || n <= 0) continue
    minutes.push(tokenToMinutes(n, m[3] || 'minuten'))
  }
  if (!minutes.length) return null
  const uniq = [...new Set(minutes)].sort((a, b) => b - a).slice(0, 5)
  return { kind: 'offsets', minutes: uniq }
}

export function formatRemindOffsets(minutes: number[]): string {
  if (!minutes.length) return 'keine extra Erinnerung'
  const parts = minutes.map((m) => {
    if (m === 0) return 'am Termin'
    if (m % (24 * 60) === 0) {
      const d = m / (24 * 60)
      return d === 1 ? '1 Tag davor' : `${d} Tage davor`
    }
    if (m % 60 === 0) {
      const h = m / 60
      return h === 1 ? '1 Stunde davor' : `${h} Stunden davor`
    }
    return m === 1 ? '1 Minute davor' : `${m} Minuten davor`
  })
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
}

export type ReminderIntent =
  | {
      kind: 'create'
      title: string
      due: Date
      whenLabel: string
      recur?: 'daily' | 'weekly'
      weekday?: number
    }
  | { kind: 'list' }
  | { kind: 'agenda' }
  | { kind: 'delete'; query: string }

const WEEKDAYS: Record<string, number> = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonnabend: 6,
}

const DAY_WORD = 'heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag'
const TIME =
  '(?:um\\s+)?(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s*uhr)?'
const REL_UNIT = 'minuten?|stunden?|tage(?:n)?|tag'

function stripTail(s: string): string {
  return s.replace(/^[,\s.:;-]+/, '').replace(/[.!?]+$/, '').trim()
}

function cleanTitle(raw: string): string {
  return stripTail(raw.replace(/^(?:an|an\s+den|an\s+die|an\s+das)\s+/i, ''))
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function formatDue(d: Date, now = new Date()): string {
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (diff === 0) return `heute ${time}`
  if (diff === 1) return `morgen ${time}`
  if (diff === 2) return `übermorgen ${time}`
  return `${d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })} ${time}`
}

function atHours(base: Date, h: number, m: number): Date {
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

function applyDay(now: Date, word: string): Date {
  const w = word.toLowerCase()
  const d = new Date(now)
  if (w === 'heute') return d
  if (w === 'morgen') {
    d.setDate(d.getDate() + 1)
    return d
  }
  if (w === 'übermorgen') {
    d.setDate(d.getDate() + 2)
    return d
  }
  const want = WEEKDAYS[w]
  if (want === undefined) return d
  const add = (want - d.getDay() + 7) % 7
  d.setDate(d.getDate() + add)
  return d
}

function parseClock(hStr: string, mStr?: string): { h: number; m: number } | null {
  const h = Number(hStr)
  const m = mStr ? Number(mStr) : 0
  if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return null
  return { h, m }
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
  if (!yearStr && startOfDay(d).getTime() < startOfDay(now).getTime()) {
    d.setFullYear(year + 1)
  }
  return d
}

function dueFromDayTime(now: Date, dayWord: string | null, h: number, m: number): Date {
  const base = dayWord ? applyDay(now, dayWord) : new Date(now)
  let due = atHours(base, h, m)
  if (!dayWord && due.getTime() <= now.getTime() + 15_000) {
    due = atHours(new Date(now.getTime() + 86_400_000), h, m)
  }
  if (dayWord && dayWord.toLowerCase() === 'heute' && due.getTime() <= now.getTime()) {
    return due
  }
  if (dayWord && WEEKDAYS[dayWord.toLowerCase()] !== undefined && due.getTime() <= now.getTime()) {
    due.setDate(due.getDate() + 7)
  }
  return due
}

function relMs(n: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('min')) return n * 60_000
  if (u.startsWith('stund')) return n * 3_600_000
  return n * 86_400_000
}

const REL = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?in\\s+(\\d+)\\s+(${REL_UNIT})\\s+(?:an\\s+)?(.+)$`,
  'is',
)
const REL_ONE = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?in\\s+einer?\\s+(minute|stunde|tag)\\s+(?:an\\s+)?(.+)$`,
  'is',
)
const DAY_TIME = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?(?:am\\s+)?(${DAY_WORD})\\s+${TIME}\\s+(?:an\\s+)?(.+)$`,
  'is',
)
const TIME_ONLY = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?um\\s+(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s*uhr)?\\s+(?:an\\s+)?(.+)$`,
  'is',
)
const CLOCK_TITLE = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?(\\d{1,2})(?:[:.](\\d{2}))\\s+(?:uhr\\s+)?(?:an\\s+)?(.+)$`,
  'is',
)
const DATE_TITLE = new RegExp(
  `^\\s*(?:erinner(?:e)?\\s+mich\\s+)?(\\d{1,2})\\.(\\d{1,2})\\.(\\d{2,4})?(?:\\s+${TIME})?\\s+(?:an\\s+)?(.+)$`,
  'is',
)
const LIST = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:meine\s+)?)?erinnerungen\s*\??\s*$/i
const AGENDA =
  /^\s*(?:was\s+steht\s+an|was\s+habe\s+ich\s+(?:heute\s+)?an|termine?\s+heute|was\s+liegt\s+an)\s*\??\s*$/i
const DELETE =
  /^\s*(?:lösch(?:e)?|streich(?:e)?|nimm\s+weg)\s+(?:die\s+)?erinnerung(?:en)?\s*(?:an\s+)?(.+)$/is

function parseRecur(t: string, now: Date): ReminderIntent | null {
  const weekly = new RegExp(
    `^\\s*jeden\\s+(${Object.keys(WEEKDAYS).join('|')})\\s+${TIME}\\s+(?:an\\s+)?(.+)$`,
    'is',
  ).exec(t)
  if (weekly) {
    const clock = parseClock(weekly[2], weekly[3])
    const title = cleanTitle(weekly[4])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, weekly[1], clock.h, clock.m)
    return {
      kind: 'create',
      title,
      due,
      whenLabel: `jeden ${weekly[1]} ${clock.h}:${String(clock.m).padStart(2, '0')}`,
      recur: 'weekly',
      weekday: WEEKDAYS[weekly[1].toLowerCase()],
    }
  }
  const daily = new RegExp(
    `^\\s*(?:jeden\\s+tag|täglich)\\s+${TIME}\\s+(?:an\\s+)?(.+)$`,
    'is',
  ).exec(t)
  if (daily) {
    const clock = parseClock(daily[1], daily[2])
    const title = cleanTitle(daily[3])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, 'heute', clock.h, clock.m)
    const next = due.getTime() <= now.getTime() ? new Date(due.getTime() + 86_400_000) : due
    return {
      kind: 'create',
      title,
      due: next,
      whenLabel: `jeden Tag ${clock.h}:${String(clock.m).padStart(2, '0')}`,
      recur: 'daily',
    }
  }
  const morning = /^\s*jeden\s+morgen\s+(?:um\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)?\s+)?(?:an\s+)?(.+)$/is.exec(t)
  if (morning) {
    const clock = morning[1] ? parseClock(morning[1], morning[2]) : { h: 8, m: 0 }
    const title = cleanTitle(morning[3])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, 'heute', clock.h, clock.m)
    const next = due.getTime() <= now.getTime() ? new Date(due.getTime() + 86_400_000) : due
    return {
      kind: 'create',
      title,
      due: next,
      whenLabel: `jeden Morgen ${clock.h}:${String(clock.m).padStart(2, '0')}`,
      recur: 'daily',
    }
  }
  return null
}

export function parseReminderIntent(text: string, now = new Date()): ReminderIntent | null {
  const t = text.trim()
  if (!t || t.length > 200) return null
  if (LIST.test(t)) return { kind: 'list' }
  if (AGENDA.test(t)) return { kind: 'agenda' }
  const del = DELETE.exec(t)
  if (del) return { kind: 'delete', query: cleanTitle(del[1]) }

  const recur = parseRecur(t, now)
  if (recur) return recur

  const rel = REL.exec(t)
  if (rel) {
    const n = Number(rel[1])
    const title = cleanTitle(rel[3])
    if (!title || !Number.isFinite(n) || n <= 0) return null
    const due = new Date(now.getTime() + relMs(n, rel[2]))
    return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
  }

  const relOne = REL_ONE.exec(t)
  if (relOne) {
    const title = cleanTitle(relOne[2])
    if (!title) return null
    const due = new Date(now.getTime() + relMs(1, relOne[1]))
    return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
  }

  const dayTime = DAY_TIME.exec(t)
  if (dayTime) {
    const clock = parseClock(dayTime[2], dayTime[3])
    const title = cleanTitle(dayTime[4])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, dayTime[1], clock.h, clock.m)
    return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
  }

  const timeOnly = TIME_ONLY.exec(t)
  if (timeOnly) {
    const clock = parseClock(timeOnly[1], timeOnly[2])
    const title = cleanTitle(timeOnly[3])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, null, clock.h, clock.m)
    return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
  }

  const dateTitle = DATE_TITLE.exec(t)
  if (dateTitle) {
    const day = dateFromParts(now, dateTitle[1], dateTitle[2], dateTitle[3] || undefined)
    const title = cleanTitle(dateTitle[6] || '')
    if (day && title) {
      const clock = dateTitle[4] ? parseClock(dateTitle[4], dateTitle[5]) : { h: 10, m: 0 }
      if (clock) {
        const due = atHours(day, clock.h, clock.m)
        return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
      }
    }
  }

  const clockTitle = CLOCK_TITLE.exec(t)
  if (clockTitle) {
    const clock = parseClock(clockTitle[1], clockTitle[2])
    const title = cleanTitle(clockTitle[3])
    if (!clock || !title) return null
    const due = dueFromDayTime(now, null, clock.h, clock.m)
    return { kind: 'create', title, due, whenLabel: formatDue(due, now) }
  }

  return null
}

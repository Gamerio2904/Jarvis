import { normalizeUtterance } from './utterance.ts'

export type HolidayIntent =
  | { kind: 'today' | 'tomorrow' | 'next' }
  | { kind: 'until'; name: string; at: Date }

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
] as const

const WEEKDAYS: Array<[RegExp, number]> = [
  [/\bsonntag\b/i, 0],
  [/\bmontag\b/i, 1],
  [/\bdienstag\b/i, 2],
  [/\bmittwoch\b/i, 3],
  [/\bdonnerstag\b/i, 4],
  [/\bfreitag\b/i, 5],
  [/\bsamstag\b/i, 6],
]

/** Feste Tage. Heiligabend vor Weihnachten, der zweite Weihnachtstag vor dem ersten. */
const MARKS: Array<{ re: RegExp; month: number; day: number; name: string }> = [
  { re: /\bheilig(?:er|en)?\s+abend\b|\bheiligabend\b/i, month: 12, day: 24, name: 'Heiligabend' },
  { re: /\b2\.?\s*weihnachtstag\b|\bzweiten\s+weihnachtstag\b/i, month: 12, day: 26, name: '2. Weihnachtstag' },
  { re: /\bweihnacht(?:en|s)?\b|\bchristfest\b|\b1\.?\s*weihnachtstag\b/i, month: 12, day: 25, name: 'Weihnachten' },
  { re: /\bsilvester\b/i, month: 12, day: 31, name: 'Silvester' },
  { re: /\bneujahr(?:stag)?\b/i, month: 1, day: 1, name: 'Neujahr' },
  { re: /\bnikolaus\b/i, month: 12, day: 6, name: 'Nikolaus' },
  { re: /\bhalloween\b/i, month: 10, day: 31, name: 'Halloween' },
  { re: /\bvalentinstag\b/i, month: 2, day: 14, name: 'Valentinstag' },
  { re: /\bostermontag\b/i, month: 0, day: 1, name: 'Ostermontag' },
  { re: /\bkarfreitag\b/i, month: 0, day: -2, name: 'Karfreitag' },
  { re: /\bostern\b/i, month: 0, day: 0, name: 'Ostern' },
]

export function isCountdownAsk(text: string): boolean {
  return countdownTarget(text) !== null
}

export function countdownTarget(text: string, now = new Date()): { name: string; at: Date } | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 120) return null
  if (/\b(?:wecker|timer|termin|geburtstag|einkauf)\b/i.test(t)) return null
  const asks =
    /\bwie\s+viele?\s+tage\b/i.test(t) ||
    /\btage\s+bis\b/i.test(t) ||
    /^\s*wann\s+ist\s+/i.test(t) ||
    /^\s*wann\s+haben\s+wir\s+/i.test(t)
  if (!asks) return null
  for (const mark of MARKS) {
    if (!mark.re.test(t)) continue
    return { name: mark.name, at: nextMark(mark, now) }
  }
  for (const [re, weekday] of WEEKDAYS) {
    if (!re.test(t) || !/\bbis\b/i.test(t)) continue
    return { name: weekdayName(weekday), at: nextWeekday(weekday, now) }
  }
  const numeric = /\b(\d{1,2})\.\s*(\d{1,2})\.(?:(\d{4}))?\b/.exec(t)
  if (numeric && /\bbis\b/i.test(t)) {
    const day = Number(numeric[1])
    const month = Number(numeric[2])
    const year = numeric[3] ? Number(numeric[3]) : now.getFullYear()
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const at = nextCalendarDay(year, month, day, now, Boolean(numeric[3]))
      if (at) return { name: `${day}. ${MONTHS[month - 1]}`, at }
    }
  }
  return null
}

export function daysUntil(at: Date, now = new Date()): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const b = Date.UTC(at.getFullYear(), at.getMonth(), at.getDate())
  return Math.round((b - a) / 86_400_000)
}

export function formatCountdownDay(at: Date, now = new Date()): string {
  const base = `${at.getDate()}. ${MONTHS[at.getMonth()]}`
  return at.getFullYear() === now.getFullYear() ? base : `${base} ${at.getFullYear()}`
}

function nextMark(mark: { month: number; day: number }, now: Date): Date {
  if (mark.month === 0) {
    let easter = easterSunday(now.getFullYear())
    let at = addDays(easter, mark.day)
    if (startOf(at) < startOf(now)) {
      easter = easterSunday(now.getFullYear() + 1)
      at = addDays(easter, mark.day)
    }
    return at
  }
  return nextCalendarDay(now.getFullYear(), mark.month, mark.day, now, false) || startOf(now)
}

function nextCalendarDay(year: number, month: number, day: number, now: Date, pinnedYear: boolean): Date | null {
  const at = new Date(year, month - 1, day)
  if (at.getMonth() !== month - 1 || at.getDate() !== day) return null
  at.setHours(0, 0, 0, 0)
  if (!pinnedYear && at.getTime() < startOf(now).getTime()) at.setFullYear(year + 1)
  return at
}

function nextWeekday(weekday: number, now: Date): Date {
  const start = startOf(now)
  const delta = (weekday - start.getDay() + 7) % 7
  return addDays(start, delta)
}

function startOf(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + days)
  return next
}

function weekdayName(day: number): string {
  return ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][day] || 'Tag'
}

/** Anonymer gregorianischer Osteralgorithmus. Ostern ist der Sonntag. */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function parseHolidayIntent(text: string): HolidayIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 120) return null
  const until = countdownTarget(t)
  if (until) return { kind: 'until', name: until.name, at: until.at }
  if (!/\b(feiertag(?:e)?|gesetzlicher\s+feiertag)\b/i.test(t) && !/\bist\s+(?:heute|morgen)\s+frei\b/i.test(t)) {
    return null
  }
  if (/\b(wecker|timer|termin|geburtstag)\b/i.test(t)) return null
  if (/\b(nächste[rn]?|wann\s+ist)\b/i.test(t)) return { kind: 'next' }
  if (/\bmorgen\b/i.test(t)) return { kind: 'tomorrow' }
  return { kind: 'today' }
}

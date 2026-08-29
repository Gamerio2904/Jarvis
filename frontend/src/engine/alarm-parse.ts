import { formatDue, startOfDay } from './remind-parse.ts'

export type AlarmIntent =
  | {
      kind: 'create'
      title: string
      due: Date
      whenLabel: string
      recur?: 'daily' | 'weekly'
      weekday?: number
    }
  | { kind: 'stop' }
  | { kind: 'list' }
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

const DAY_NAMES = Object.keys(WEEKDAYS).join('|')

function cleanTitle(raw: string): string {
  const t = raw.replace(/^[,\s.:;-]+/, '').replace(/[.!?]+$/, '').trim()
  return t || 'Wecker'
}

function parseClock(hStr: string, mStr?: string): { h: number; m: number } | null {
  const h = Number(hStr)
  const m = mStr ? Number(mStr) : 0
  if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(m) || m < 0 || m > 59) return null
  return { h, m }
}

function atHours(base: Date, h: number, m: number): Date {
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

function nextClock(now: Date, h: number, m: number, dayWord: string | null): Date {
  const w = (dayWord || '').toLowerCase()
  const d = new Date(now)
  if (w === 'morgen') d.setDate(d.getDate() + 1)
  if (w === 'übermorgen') d.setDate(d.getDate() + 2)
  const wd = WEEKDAYS[w]
  if (wd !== undefined) {
    const add = (wd - d.getDay() + 7) % 7
    d.setDate(d.getDate() + add)
  }
  let due = atHours(d, h, m)
  if (due.getTime() <= now.getTime() + 15_000) {
    if (wd !== undefined) due.setDate(due.getDate() + 7)
    else due = atHours(new Date(now.getTime() + 86_400_000), h, m)
  }
  return due
}

export function parseAlarmIntent(text: string, now = new Date()): AlarmIntent | null {
  const raw = text.trim()
  if (!raw || raw.length > 180 || !/\bwecker\b/i.test(raw)) return null
  if (/^(?:wecker\s+(?:aus|stopp|stop|abbrechen)|stopp(?:e)?\s+(?:den\s+)?wecker)$/i.test(raw)) {
    return { kind: 'stop' }
  }
  if (/^(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+|die\s+|meine\s+)?)?wecker\s*\??$/i.test(raw)) {
    return { kind: 'list' }
  }
  const del = /^(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?wecker\s+(.+)$/i.exec(raw)
  if (del) return { kind: 'delete', query: cleanTitle(del[1]) }

  let t = raw
    .replace(/stell(?:e)?\s+(?:einen\s+|den\s+)?wecker\s+(?:auf\s+|für\s+)?/i, 'wecker ')
    .replace(/^wecker\s+/i, '')
    .trim()

  let recur: 'daily' | 'weekly' | undefined
  let weekday: number | undefined
  const weekly = new RegExp(`jeden\\s+(${DAY_NAMES})`, 'i').exec(t)
  if (weekly) {
    recur = 'weekly'
    weekday = WEEKDAYS[weekly[1].toLowerCase()]
  } else if (/(?:jeden\s+tag|täglich|mit\s+wiederholung|wiederholen)/i.test(t)) {
    recur = 'daily'
  }

  const dayHit = /\b(heute|morgen|übermorgen)\b/i.exec(t)
  const clock = /(?:um\s+)?(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)?/i.exec(t)
  if (!clock) return null
  const parsed = parseClock(clock[1], clock[2])
  if (!parsed) return null

  const title = cleanTitle(
    t
      .replace(clock[0], ' ')
      .replace(/\b(heute|morgen|übermorgen|jeden\s+tag|täglich|mit\s+wiederholung|wiederholen|einmal|jeden\s+\w+)\b/gi, ' ')
      .replace(/\s+/g, ' '),
  )

  const dayWord = weekly ? weekly[1] : dayHit?.[1] || null
  const due = nextClock(now, parsed.h, parsed.m, dayWord)
  const clockLabel = `${parsed.h}:${String(parsed.m).padStart(2, '0')}`
  const whenLabel = recur === 'daily'
    ? `jeden Tag ${clockLabel}`
    : recur === 'weekly' && weekly
      ? `jeden ${weekly[1]} ${clockLabel}`
      : formatDue(due, now)

  return { kind: 'create', title, due, whenLabel, recur, weekday }
}

export function alarmDayLabel(due: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (diff === 0) return 'heute'
  if (diff === 1) return 'morgen'
  return due.toLocaleDateString('de-DE', { weekday: 'long' })
}

import type { CalendarEvent } from './store.ts'

export type CalendarRecur = 'weekly' | 'monthly'

const HOUR = 60 * 60_000
const DAY = 24 * HOUR

export function eventDurationMs(row: Pick<CalendarEvent, 'start_at' | 'end_at' | 'all_day'>): number {
  if (row.all_day) return DAY
  if (row.end_at) {
    const span = new Date(row.end_at).getTime() - new Date(row.start_at).getTime()
    if (Number.isFinite(span) && span > 0) return span
  }
  return HOUR
}

export function eventEndAt(row: Pick<CalendarEvent, 'start_at' | 'end_at' | 'all_day'>): Date {
  return new Date(new Date(row.start_at).getTime() + eventDurationMs(row))
}

export function defaultEndIso(start: Date, allDay = false): string {
  return new Date(start.getTime() + (allDay ? DAY : HOUR)).toISOString()
}

export function isCalendarRecur(v: unknown): v is CalendarRecur {
  return v === 'weekly' || v === 'monthly'
}

/** Vorkommen im Fenster. Serie bleibt eine Zeile im Store; die GUI sieht Kopien. */
export function expandEvents(events: CalendarEvent[], from: Date, until: Date): CalendarEvent[] {
  const fromMs = from.getTime()
  const untilMs = until.getTime()
  if (!Number.isFinite(fromMs) || !Number.isFinite(untilMs) || untilMs <= fromMs) return []
  const out: CalendarEvent[] = []
  for (const row of events) {
    const start = new Date(row.start_at)
    if (Number.isNaN(start.getTime())) continue
    if (!row.recur) {
      const t = start.getTime()
      const end = eventEndAt(row).getTime()
      if (end > fromMs && t < untilMs) out.push(row)
      continue
    }
    let cursor = new Date(start)
    let guard = 0
    while (cursor.getTime() < untilMs && guard < 400) {
      const occ: CalendarEvent = {
        ...row,
        start_at: cursor.toISOString(),
        end_at: new Date(cursor.getTime() + eventDurationMs(row)).toISOString(),
      }
      const t = cursor.getTime()
      const end = eventEndAt(occ).getTime()
      if (end > fromMs && t < untilMs) out.push(occ)
      if (row.recur === 'weekly') cursor = new Date(cursor.getTime() + 7 * DAY)
      else {
        const next = new Date(cursor)
        next.setMonth(next.getMonth() + 1)
        if (next.getTime() <= cursor.getTime()) break
        cursor = next
      }
      guard += 1
    }
  }
  return out.sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
}

export type CalOverlap = { other: CalendarEvent; label: string }

export function firstOverlap(candidate: CalendarEvent, others: CalendarEvent[]): CalOverlap | null {
  const a0 = new Date(candidate.start_at).getTime()
  const a1 = eventEndAt(candidate).getTime()
  if (!Number.isFinite(a0) || !Number.isFinite(a1) || a1 <= a0) return null
  const windowFrom = new Date(Math.min(a0, Date.now()) - DAY)
  const windowUntil = new Date(a1 + 8 * 7 * DAY)
  const pool = expandEvents(
    others.filter((e) => e.id !== candidate.id),
    windowFrom,
    windowUntil,
  )
  for (const other of pool) {
    const b0 = new Date(other.start_at).getTime()
    const b1 = eventEndAt(other).getTime()
    if (a0 < b1 && b0 < a1) {
      const when = new Date(other.start_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      return { other, label: `${other.title} ${when}` }
    }
  }
  return null
}

export function recurLabel(row: Pick<CalendarEvent, 'recur'>): string | undefined {
  if (row.recur === 'weekly') return 'jede Woche'
  if (row.recur === 'monthly') return 'jeden Monat'
  return undefined
}

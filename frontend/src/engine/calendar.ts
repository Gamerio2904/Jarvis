import { notifyIdFromKey, requestNotifyPermission, scheduleNotify, cancelNotify } from '../native/notify'
import { formatDue, startOfDay } from './remind-parse'
import { parseCalendarIntent } from './calendar-parse'
import {
  addEvent,
  deleteEvent,
  listEvents,
  listReminders,
  persistLastList,
  type CalendarEvent,
} from './store'
import type { ToolMeta } from './tools'

export { parseCalendarIntent } from './calendar-parse'

export async function handleCalendar(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; open?: boolean }> {
  const intent = parseCalendarIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'open') {
    const upcoming = (await listEvents())
      .filter((e) => new Date(e.start_at).getTime() >= startOfDay(new Date()).getTime())
      .slice(0, 8)
    const lines = upcoming.length
      ? upcoming.map((e, i) => `${i + 1}. ${e.title}${e.place ? ` · ${e.place}` : ''} — ${formatDue(new Date(e.start_at))}`).join('\n')
      : 'Keine kommenden Termine. In der Kalender-Ansicht oder per „Termin morgen 15 Uhr …“ anlegen.'
    persistLastList('calendar', upcoming.map((e) => e.title))
    return {
      handled: true,
      open: true,
      reply: `Kalender:\n${lines}`,
      tool: { tool_status: 'executed', tool: 'calendar', action: 'open', label: 'Kalender' },
    }
  }

  if (intent.kind === 'create') {
    const row = await addEvent({
      title: intent.title,
      start_at: intent.start.toISOString(),
      place: intent.place,
      conversationId,
    })
    await requestNotifyPermission()
    await scheduleNotify({
      id: notifyIdFromKey(`evt-${row.id}`),
      title: 'Jarvis · Termin',
      body: row.place ? `${row.title} · ${row.place}` : row.title,
      at: intent.start,
    })
    persistLastList('calendar', [row.title])
    const where = row.place ? ` · ${row.place}` : ''
    return {
      handled: true,
      reply: `Termin: ${row.title}${where}, ${intent.whenLabel}. Steht im Kalender.`,
      tool: {
        tool_status: 'executed',
        tool: 'calendar',
        action: 'create',
        label: 'Termin liegt',
        preview: `${row.title}${where} · ${intent.whenLabel}`,
      },
    }
  }

  if (intent.kind === 'list') {
    const rows = await eventsInWindow(intent.day, intent.until)
    const span = intent.label
      ? intent.label
      : intent.day
        ? intent.day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
        : 'kommend'
    const calTool: ToolMeta = { tool_status: 'executed', tool: 'calendar', action: 'list', label: 'Kalender' }
    if (!rows.length) {
      return {
        handled: true,
        reply: intent.until || intent.day ? `Keine Termine ${span}.` : 'Keine Termine.',
        tool: calTool,
      }
    }
    const lines = rows.map((e, i) => `${i + 1}. ${e.title}${e.place ? ` · ${e.place}` : ''} — ${formatDue(new Date(e.start_at))}`)
    persistLastList('calendar', rows.map((e) => e.title))
    return { handled: true, reply: `Termine ${span}:\n${lines.join('\n')}`, tool: calTool }
  }

  if (intent.kind === 'delete_last') {
    const rows = await listEvents()
    const hit = [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
    if (!hit) return { handled: true, reply: 'Kein Termin zum Löschen.' }
    await cancelNotify(notifyIdFromKey(`evt-${hit.id}`))
    await deleteEvent(hit.id)
    return {
      handled: true,
      reply: `Termin weg: ${hit.title}.`,
      tool: { tool_status: 'executed', tool: 'calendar', action: 'delete', label: 'Termin weg' },
    }
  }

  const rows = await listEvents()
  const q = intent.query.toLowerCase()
  const hit = rows.find((e) => e.title.toLowerCase().includes(q) || q.includes(e.title.toLowerCase()))
  if (!hit) return { handled: true, reply: `Kein Termin zu „${intent.query}“.` }
  await cancelNotify(notifyIdFromKey(`evt-${hit.id}`))
  await deleteEvent(hit.id)
  return {
    handled: true,
    reply: `Termin weg: ${hit.title}.`,
    tool: { tool_status: 'executed', tool: 'calendar', action: 'delete', label: 'Termin weg' },
  }
}

async function eventsInWindow(day?: Date, until?: Date): Promise<CalendarEvent[]> {
  const rows = await listEvents()
  if (!day) {
    const start = startOfDay(new Date()).getTime()
    return rows.filter((e) => new Date(e.start_at).getTime() >= start).slice(0, 20)
  }
  const from = startOfDay(day).getTime()
  const to = until ? startOfDay(until).getTime() : from + 86_400_000
  return rows
    .filter((e) => {
      const t = new Date(e.start_at).getTime()
      return t >= from && t < to
    })
    .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
}

export async function removeEvent(id: string): Promise<void> {
  await cancelNotify(notifyIdFromKey(`evt-${id}`))
  await deleteEvent(id)
}

export async function createEventFromGui(opts: {
  title: string
  start: Date
}): Promise<CalendarEvent> {
  const row = await addEvent({
    title: opts.title,
    start_at: opts.start.toISOString(),
  })
  await requestNotifyPermission()
  await scheduleNotify({
    id: notifyIdFromKey(`evt-${row.id}`),
    title: 'Jarvis · Termin',
    body: row.title,
    at: opts.start,
  })
  return row
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export async function marksForMonth(year: number, month: number): Promise<Set<string>> {
  const events = await listEvents()
  const reminders = (await listReminders()).filter((r) => r.status === 'open')
  const keys = new Set<string>()
  for (const e of events) {
    const d = new Date(e.start_at)
    if (d.getFullYear() === year && d.getMonth() === month) keys.add(isoDay(d))
  }
  for (const r of reminders) {
    const d = new Date(r.due_at)
    if (d.getFullYear() === year && d.getMonth() === month) keys.add(isoDay(d))
  }
  return keys
}

export function isoDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

import { notifyIdFromKey, requestNotifyPermission, scheduleNotify, cancelNotify } from '../native/notify.ts'
import { formatDue, startOfDay } from './remind-parse.ts'
import { parseCalendarIntent, parseRemindOffsets, formatRemindOffsets } from './calendar-parse.ts'
import { isDebugRunActive } from './debug-flag.ts'
import {
  addEvent,
  clearPending,
  deleteEvent,
  getPending,
  listEvents,
  listReminders,
  persistLastList,
  putEvent,
  setPending,
  type CalendarEvent,
} from './store.ts'
import type { ToolMeta } from './tools.ts'

export { parseCalendarIntent, parseRemindOffsets, formatRemindOffsets } from './calendar-parse.ts'

export function eventNotifyId(eventId: string, minutes = 0): number {
  return notifyIdFromKey(minutes > 0 ? `evt-${eventId}-m${minutes}` : `evt-${eventId}`)
}

export function eventNotifyMinutes(row: Pick<CalendarEvent, 'remind_offsets_min'>): number[] {
  if (row.remind_offsets_min === undefined) return [0]
  return row.remind_offsets_min
}

export async function cancelEventNotifies(row: Pick<CalendarEvent, 'id' | 'remind_offsets_min'>): Promise<void> {
  const mins = new Set([0, ...eventNotifyMinutes(row)])
  for (const m of mins) await cancelNotify(eventNotifyId(row.id, m))
}

export async function scheduleEventNotifies(row: CalendarEvent, now = Date.now()): Promise<string[]> {
  const start = new Date(row.start_at)
  const skipped: string[] = []
  const list = eventNotifyMinutes(row)
  if (!list.length) return skipped
  void requestNotifyPermission()
  for (const m of list) {
    const at = new Date(start.getTime() - m * 60_000)
    if (at.getTime() <= now) {
      skipped.push(formatRemindOffsets([m]))
      continue
    }
    await scheduleNotify({
      id: eventNotifyId(row.id, m),
      title: 'Jarvis · Termin',
      body: row.place ? `${row.title} · ${row.place}` : row.title,
      at,
    })
  }
  return skipped
}

const ASK_REMIND =
  'Wann soll ich Sie erinnern? Zum Beispiel 24 Stunden davor und 2 Stunden davor — oder „am Termin“ / „keine extra Erinnerung“.'

export async function handleCalendar(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; open?: boolean }> {
  const pending = await getPending(conversationId)
  if (pending?.tool === 'calendar' && pending.action === 'remind_offsets') {
    const hit = parseRemindOffsets(text)
    if (!hit) return { handled: false }
    const eventId = String(pending.args?.event_id || '')
    const row = (await listEvents()).find((e) => e.id === eventId)
    await clearPending(conversationId)
    if (!row) {
      return {
        handled: true,
        reply: 'Der Termin ist weg. Legen Sie ihn nochmal an.',
        tool: { tool_status: 'error', tool: 'calendar', action: 'remind', label: 'Termin weg' },
      }
    }
    await cancelEventNotifies(row)
    const next: CalendarEvent = {
      ...row,
      remind_offsets_min: hit.kind === 'none' ? [] : hit.kind === 'at_start' ? [0] : hit.minutes,
    }
    await putEvent(next)
    const skipped = await scheduleEventNotifies(next)
    const label = hit.kind === 'none' ? 'keine extra Erinnerung' : formatRemindOffsets(next.remind_offsets_min || [0])
    const skipLine = skipped.length ? ` ${skipped.join(', ')} ist schon vorbei.` : ''
    return {
      handled: true,
      reply: `Erinnerung: ${label}.${skipLine}`,
      tool: { tool_status: 'executed', tool: 'calendar', action: 'remind', label: 'Erinnerung' },
    }
  }

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
    await scheduleEventNotifies(row)
    persistLastList('calendar', [row.title])
    const where = row.place ? ` · ${row.place}` : ''
    const running = isDebugRunActive()
    if (!running) {
      await setPending({
        conversation_id: conversationId,
        tool: 'calendar',
        action: 'remind_offsets',
        args: { event_id: row.id },
        preview: `${row.title}${where}`,
        created_at: new Date().toISOString(),
      })
    }
    return {
      handled: true,
      reply: running
        ? `Termin: ${row.title}${where}, ${intent.whenLabel}. Steht im Kalender.`
        : `Termin: ${row.title}${where}, ${intent.whenLabel}. Steht im Kalender. ${ASK_REMIND}`,
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
    await cancelEventNotifies(hit)
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
  await cancelEventNotifies(hit)
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
  const row = (await listEvents()).find((e) => e.id === id)
  if (row) await cancelEventNotifies(row)
  else await cancelNotify(eventNotifyId(id, 0))
  await deleteEvent(id)
}

export async function applyEventOffsets(id: string, minutes: number[]): Promise<CalendarEvent | null> {
  const row = (await listEvents()).find((e) => e.id === id)
  if (!row) return null
  await cancelEventNotifies(row)
  const next: CalendarEvent = { ...row, remind_offsets_min: minutes }
  await putEvent(next)
  await scheduleEventNotifies(next)
  return next
}

export async function createEventFromGui(opts: {
  title: string
  start: Date
  remind_offsets_min?: number[]
}): Promise<CalendarEvent> {
  const row = await addEvent({
    title: opts.title,
    start_at: opts.start.toISOString(),
    remind_offsets_min: opts.remind_offsets_min,
  })
  await scheduleEventNotifies(row)
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

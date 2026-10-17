import { notifyIdFromKey, requestNotifyPermission, scheduleNotify, cancelNotify } from '../native/notify.ts'
import { formatDue, startOfDay } from './remind-parse.ts'
import { parseCalendarIntent, parseRemindOffsets, formatRemindOffsets, type RemoveClause } from './calendar-parse.ts'
import { classifyEventTheme, eventTheme, isCalThemeId, type CalThemeId } from './calendar-theme.ts'
import { isDebugRunActive } from './debug-flag.ts'
import {
  addEvent,
  addTodo,
  clearPending,
  deleteEvent,
  deleteReminder,
  deleteTodo,
  getPending,
  listEvents,
  listReminders,
  listTodos,
  loadSettings,
  persistLastList,
  putEvent,
  setPending,
  updateTodo,
  type CalendarEvent,
  type Reminder,
  type Todo,
} from './store.ts'
import type { ToolMeta } from './tools.ts'
import { defaultEndIso, expandEvents, firstOverlap, recurLabel } from './calendar-occur.ts'
import { shareOrDownloadIcs } from './calendar-ics.ts'
import { parseGreeting, wrongNameGreeting } from './greeting.ts'
import { isBriefAsk } from './brief-parse.ts'

export { parseCalendarIntent, parseRemindOffsets, formatRemindOffsets, normalizeCalendarSpeech } from './calendar-parse.ts'

let focusDayIso: string | null = null

export function peekCalendarFocus(): string | null {
  return focusDayIso
}

export function takeCalendarFocus(): string | null {
  const v = focusDayIso
  focusDayIso = null
  return v
}

export function noteCalendarFocus(day: Date): void {
  focusDayIso = isoDay(day)
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('jarvis-cal-focus', { detail: { day: focusDayIso } }))
}

export const ASK_REMIND =
  'Wann soll ich Sie erinnern? Zum Beispiel 24 Stunden davor und 2 Stunden davor — oder „am Termin“ / „keine extra Erinnerung“.'

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

/** Verhindert, dass Termin und Todo sich beim Spiegeln gegenseitig noch einmal anstoßen. */
let syncing = false

function localStart(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map((part) => Number(part))
  const [hour, minute] = time.split(':').map((part) => Number(part))
  return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0)
}

function clockLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function eventOwnsTodo(
  event: CalendarEvent,
  todo: Pick<Todo, 'id' | 'title' | 'event_id' | 'deadline_date'>,
): boolean {
  if (event.todo_id === todo.id || (todo.event_id && todo.event_id === event.id)) return true
  if (event.todo_id && event.todo_id !== todo.id) return false
  if (!todo.deadline_date) return false
  return (
    event.title.trim().toLocaleLowerCase() === todo.title.trim().toLocaleLowerCase() &&
    isoDay(new Date(event.start_at)) === todo.deadline_date
  )
}

/** Nimmt den Kalendereintrag einer Deadline weg. Das Todo bleibt, bis der Aufrufer es löscht. */
export async function forgetTodoCalendar(
  todo: Pick<Todo, 'id' | 'title' | 'event_id' | 'deadline_date'>,
): Promise<void> {
  if (syncing) return
  const hits = (await listEvents()).filter((event) => eventOwnsTodo(event, todo))
  if (!hits.length) return
  syncing = true
  try {
    for (const event of hits) {
      await cancelEventNotifies(event)
      await deleteEvent(event.id)
    }
  } finally {
    syncing = false
  }
}

/** Todo-Deadline: Termin plus Benachrichtigung einen Tag und zwei Stunden davor. */
export async function recordTodoDeadline(opts: {
  title: string
  date: string
  time: string | null
  conversationId?: string
  todoId?: string
}): Promise<string> {
  const time = opts.time || '18:00'
  const existing = opts.todoId ? (await listEvents()).find((event) => event.todo_id === opts.todoId) : undefined
  const allDay = Boolean(existing?.all_day) && !opts.time
  const start = localStart(opts.date, allDay ? '00:00' : time)
  if (existing) {
    await cancelEventNotifies(existing)
    const next: CalendarEvent = {
      ...existing,
      title: opts.title,
      todo_id: opts.todoId,
      start_at: start.toISOString(),
      end_at: defaultEndIso(start, allDay),
      all_day: allDay || undefined,
    }
    await putEvent(next)
    await scheduleEventNotifies(next)
    return `${opts.date} ${allDay ? 'ganztägig' : time}`
  }
  const row = await addEvent({
    title: opts.title,
    start_at: start.toISOString(),
    end_at: defaultEndIso(start, false),
    conversationId: opts.conversationId,
    remind_offsets_min: [24 * 60, 2 * 60],
    todoId: opts.todoId,
  })
  if (opts.todoId) {
    const held = syncing
    syncing = true
    try {
      await updateTodo(opts.todoId, { eventId: row.id })
    } finally {
      syncing = held
    }
  }
  await scheduleEventNotifies(row)
  return `${opts.date} ${time}`
}

/** Kalendereintrag einer Deadline ohne passendes Todo: die Aufgabe kommt in die eine To-do-Liste. */
export async function adoptOrphanDeadlineTodos(): Promise<number> {
  if (syncing) return 0
  const events = await listEvents()
  const todos = await listTodos()
  let added = 0
  for (const event of events) {
    if (!event.todo_id) continue
    if (todos.some((todo) => todo.id === event.todo_id || todo.event_id === event.id)) continue
    const start = new Date(event.start_at)
    if (Number.isNaN(start.getTime())) continue
    syncing = true
    try {
      const row = await addTodo(event.title, event.source_conversation_id || undefined, {
        listId: 'todo-list-general',
        deadlineDate: isoDay(start),
        deadlineTime: event.all_day ? null : clockLabel(start),
        eventId: event.id,
        linkOnly: true,
      })
      await putEvent({ ...event, todo_id: row.id })
      todos.push(row)
      added += 1
    } finally {
      syncing = false
    }
  }
  return added
}

/** Schreibt Deadline und Namen eines Todos in seinen Kalendereintrag. */
export async function mirrorTodoDeadline(todo: Todo): Promise<void> {
  if (syncing) return
  if (!todo.deadline_date || todo.status === 'done') {
    await forgetTodoCalendar(todo)
    return
  }
  syncing = true
  try {
    await recordTodoDeadline({
      title: todo.title,
      date: todo.deadline_date,
      time: todo.deadline_time || null,
      conversationId: todo.source_conversation_id || undefined,
      todoId: todo.id,
    })
  } finally {
    syncing = false
  }
}

async function syncEventOntoTodo(previous: CalendarEvent, next: CalendarEvent): Promise<CalendarEvent> {
  const todos = await listTodos()
  const owner =
    todos.find((todo) => todo.id === next.todo_id || todo.id === previous.todo_id || todo.event_id === next.id) ||
    todos.find(
      (todo) =>
        Boolean(todo.deadline_date) &&
        todo.title.trim().toLocaleLowerCase() === previous.title.trim().toLocaleLowerCase() &&
        todo.deadline_date === isoDay(new Date(previous.start_at)),
    )
  if (!owner) return next
  const start = new Date(next.start_at)
  const linked = next.todo_id === owner.id ? next : { ...next, todo_id: owner.id }
  if (linked !== next) await putEvent(linked)
  await updateTodo(owner.id, {
    title: linked.title,
    deadlineDate: isoDay(start),
    deadlineTime: linked.all_day ? null : clockLabel(start),
    eventId: linked.id,
  })
  return linked
}

export async function scheduleEventNotifies(row: CalendarEvent, now = Date.now()): Promise<string[]> {
  const upcoming = expandEvents([row], new Date(now - 60_000), new Date(now + 400 * 24 * 60 * 60_000))
  const next = upcoming.find((e) => new Date(e.start_at).getTime() > now)
  const start = next ? new Date(next.start_at) : new Date(row.start_at)
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
      title: 'Ultron · Termin',
      body: row.place ? `${row.title} · ${row.place}` : row.title,
      at,
    })
  }
  return skipped
}

export async function handleCalendar(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; open?: boolean }> {
  const pending = await getPending(conversationId)
  if (pending?.tool === 'calendar' && pending.action === 'remind_offsets') {
    const hit = parseRemindOffsets(text)
    if (!hit) {
      const nextIntent = parseCalendarIntent(text)
      if (nextIntent) await settlePendingRemind(pending, conversationId)
      else if (releasesRemindHold(text)) {
        await settlePendingRemind(pending, conversationId)
        return { handled: false }
      } else {
        return {
          handled: true,
          reply: ASK_REMIND,
          tool: { tool_status: 'executed', tool: 'calendar', action: 'remind', label: 'Erinnerung' },
        }
      }
    } else {
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
  }

  const intent = parseCalendarIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'export_ics') {
    const reply = await shareOrDownloadIcs()
    return {
      handled: true,
      reply,
      tool: { tool_status: 'executed', tool: 'calendar', action: 'export', label: 'Kalender-ICS' },
    }
  }

  if (intent.kind === 'close') {
    return {
      handled: true,
      reply: 'Kalender zu.',
      tool: { tool_status: 'executed', tool: 'calendar', action: 'close', label: 'Kalender' },
    }
  }

  if (intent.kind === 'open') {
    const from = startOfDay(new Date())
    const until = new Date(from)
    until.setDate(until.getDate() + 60)
    const upcoming = expandEvents(await listEvents(), from, until).slice(0, 8)
    const lines = upcoming.length
      ? upcoming.map((e, i) => `${i + 1}. ${e.title}${e.place ? ` · ${e.place}` : ''} — ${formatDue(new Date(e.start_at))}`).join('\n')
      : 'Keine kommenden Termine. In der Kalender-Ansicht oder per „Termin morgen 15 Uhr …“ anlegen.'
    persistLastList('calendar', upcoming.map((e) => e.title))
    const first = upcoming[0]
    if (first) noteCalendarFocus(new Date(first.start_at))
    return {
      handled: true,
      open: true,
      reply: `Kalender:\n${lines}`,
      tool: {
        tool_status: 'executed',
        tool: 'calendar',
        action: 'open',
        label: 'Kalender',
        result: { focus: first ? isoDay(new Date(first.start_at)) : '' },
      },
    }
  }

  if (intent.kind === 'create') {
    const theme = classifyEventTheme(intent.title, intent.place)
    const endAt = intent.end
      ? intent.end.toISOString()
      : defaultEndIso(intent.start, Boolean(intent.allDay))
    const stated = intent.remind_offsets_min
    const row = await addEvent({
      title: intent.title,
      start_at: intent.start.toISOString(),
      place: intent.place,
      conversationId,
      theme,
      end_at: endAt,
      all_day: intent.allDay,
      recur: intent.recur,
      remind_offsets_min: stated,
    })
    await scheduleEventNotifies(row)
    void refineThemeLater(row)
    persistLastList('calendar', [row.title])
    noteCalendarFocus(new Date(row.start_at))
    const where = row.place ? ` · ${row.place}` : ''
    const series = recurLabel(row) ? ` ${recurLabel(row)}.` : ''
    const clash = firstOverlap(row, await listEvents())
    const warn = clash ? ` Achtung: überlappt mit ${clash.label}.` : ''
    const running = isDebugRunActive()
    if (!running && !stated) {
      await setPending({
        conversation_id: conversationId,
        tool: 'calendar',
        action: 'remind_offsets',
        args: { event_id: row.id },
        preview: `${row.title}${where}`,
        created_at: new Date().toISOString(),
      })
    }
    const remindLine = stated ? ` Erinnerung: ${intent.remindLabel || formatRemindOffsets(stated)}.` : ''
    return {
      handled: true,
      reply:
        running || stated
          ? `Termin: ${row.title}${where}, ${intent.whenLabel}. Steht im Kalender.${series}${warn}${remindLine}`
          : `Termin: ${row.title}${where}, ${intent.whenLabel}. Steht im Kalender.${series}${warn} ${ASK_REMIND}`,
      tool: {
        tool_status: 'executed',
        tool: 'calendar',
        action: 'create',
        label: 'Termin liegt',
        preview: `${row.title}${where} · ${intent.whenLabel}`,
        result: { focus: isoDay(new Date(row.start_at)) },
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
    if (rows[0]) noteCalendarFocus(new Date(rows[0].start_at))
    return {
      handled: true,
      reply: `Termine ${span}:\n${lines.join('\n')}`,
      tool: { ...calTool, result: { focus: rows[0] ? isoDay(new Date(rows[0].start_at)) : '' } },
    }
  }

  if (intent.kind === 'delete_many') {
    return removeNamed(intent.clauses)
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
  const hit = findEventByQuery(rows, intent.query)
  if (!hit) return { handled: true, reply: `Kein Termin zu „${intent.query}“.` }

  if (intent.kind === 'move') {
    const next = await updateEventFromGui(hit.id, {
      title: hit.title,
      start: intent.start,
      theme: eventTheme(hit),
      remind_offsets_min: hit.remind_offsets_min,
    })
    if (!next) return { handled: true, reply: 'Wohin soll der Termin?' }
    persistLastList('calendar', [next.title])
    noteCalendarFocus(new Date(next.start_at))
    return {
      handled: true,
      reply: `Termin verschoben: ${next.title}, ${intent.whenLabel}. Steht im Kalender.`,
      tool: {
        tool_status: 'executed',
        tool: 'calendar',
        action: 'move',
        label: 'Termin verschoben',
        preview: `${next.title} · ${intent.whenLabel}`,
        result: { focus: isoDay(new Date(next.start_at)) },
      },
    }
  }

  if (intent.kind === 'rename') {
    const next = await renameEvent(hit.id, intent.title)
    if (!next) return { handled: true, reply: 'Wie soll der Termin heißen?' }
    persistLastList('calendar', [next.title])
    noteCalendarFocus(new Date(next.start_at))
    return {
      handled: true,
      reply: `Termin umbenannt: ${hit.title} → ${next.title}. Steht im Kalender.`,
      tool: {
        tool_status: 'executed',
        tool: 'calendar',
        action: 'rename',
        label: 'Termin umbenannt',
        preview: next.title,
        result: { focus: isoDay(new Date(next.start_at)) },
      },
    }
  }

  await cancelEventNotifies(hit)
  await deleteEvent(hit.id)
  return {
    handled: true,
    reply: `Termin weg: ${hit.title}.`,
    tool: { tool_status: 'executed', tool: 'calendar', action: 'delete', label: 'Termin weg' },
  }
}

/** Wetter und Smalltalk bleiben in der Frage. Echte andere Sätze geben sie frei. */
function releasesRemindHold(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 400) return false
  if (parseGreeting(t) || wrongNameGreeting(t) || isBriefAsk(t)) return true
  if (/^\s*plan(?:e)?\s+das\b/i.test(t)) return true
  if (/\b(?:tischplatte|werkbank|projekttafel)\b/i.test(t)) return true
  if (/^\s*(?:lösch(?:e)?|streich(?:e)?|entfern(?:e)?|nimm\s+weg)\b/i.test(t)) return true
  if (/^\s*lade\b/i.test(t)) return true
  if (/^\s*(?:schieb|wirf|räum|raeum|hol)\b/i.test(t)) return true
  if (/^\s*(?:zeig(?:e)?|hintergrund|idee\s*:|wecker|timer|erinner(?:e)?|mach|füll|fuell|such(?:e)?|stell)\b/i.test(t)) return true
  if (/^\s*(?:go|umsetzen|leg\s+los|übernehmen|uebernehmen)\s*[.!?]?$/i.test(t)) return true
  if (/^\s*so\s*[.!?]?$/i.test(t) && loadSettings().plan_phase === 'live') return true
  return false
}

async function settlePendingRemind(
  pending: { args?: { event_id?: unknown } },
  conversationId: string,
): Promise<void> {
  const eventId = String(pending.args?.event_id || '')
  const row = (await listEvents()).find((e) => e.id === eventId)
  await clearPending(conversationId)
  if (!row || row.remind_offsets_min !== undefined) return
  const next: CalendarEvent = { ...row, remind_offsets_min: [0] }
  await cancelEventNotifies(row)
  await putEvent(next)
  await scheduleEventNotifies(next)
}

function titleHits(title: string, query: string): boolean {
  const t = title.toLowerCase().trim()
  const q = query.toLowerCase().replace(/[.!?]+$/g, '').trim()
  if (!t || !q) return false
  if (t === q || t.includes(q) || q.includes(t)) return true
  const stem = q.replace(/[^a-zäöüß0-9]+/g, '')
  const compact = t.replace(/[^a-zäöüß0-9]+/g, '')
  return stem.length >= 4 && compact.includes(stem.slice(0, 8))
}

function reminderFits(row: Reminder, recur?: RemoveClause['recur']): boolean {
  if (!recur) return true
  if (recur !== 'daily' && recur !== 'weekly') return false
  return row.recur === recur
}

function recurFace(recur: NonNullable<RemoveClause['recur']>): string {
  if (recur === 'daily') return 'tägliches'
  if (recur === 'weekly') return 'wöchentliches'
  if (recur === 'yearly') return 'jährliches'
  return 'monatliches'
}

async function removeNamed(clauses: RemoveClause[]): Promise<{
  handled: true
  reply: string
  tool: ToolMeta
}> {
  const events = await listEvents()
  const reminders = (await listReminders()).filter((r) => r.status === 'open')
  const gone: string[] = []
  const missed: string[] = []
  const seenE = new Set<string>()
  const seenR = new Set<string>()
  for (const clause of clauses) {
    const evHits = events.filter(
      (e) => !seenE.has(e.id) && titleHits(e.title, clause.query) && (!clause.recur || e.recur === clause.recur),
    )
    const remHits = reminders.filter(
      (r) => !seenR.has(r.id) && titleHits(r.title, clause.query) && reminderFits(r, clause.recur),
    )
    if (!evHits.length && !remHits.length) {
      missed.push(clause.recur ? `${recurFace(clause.recur)} ${clause.query}` : clause.query)
      continue
    }
    for (const row of evHits) {
      seenE.add(row.id)
      await cancelEventNotifies(row)
      await deleteEvent(row.id)
      gone.push(row.title)
    }
    for (const row of remHits) {
      seenR.add(row.id)
      await cancelNotify(row.notify_id ?? notifyIdFromKey(row.id))
      await deleteReminder(row.id)
      gone.push(row.title)
    }
  }
  const tool: ToolMeta = {
    tool_status: 'executed',
    tool: 'calendar',
    action: 'delete',
    label: gone.length ? 'Termin weg' : 'Nichts zu löschen',
  }
  if (!gone.length) {
    return { handled: true, reply: `Nichts davon steht im Kalender: ${missed.join(', ')}.`, tool }
  }
  const names = [...new Set(gone)]
  if (!missed.length) return { handled: true, reply: `Weg: ${names.join(', ')}.`, tool }
  return {
    handled: true,
    reply: `Weg: ${names.join(', ')}. Nicht im Kalender: ${missed.join(', ')}.`,
    tool,
  }
}

function findEventByQuery(rows: CalendarEvent[], query: string): CalendarEvent | undefined {
  const q = query.toLowerCase().replace(/[.!?]+$/g, '').trim()
  if (!q) return undefined
  return (
    rows.find((e) => e.title.toLowerCase() === q) ||
    rows.find((e) => e.title.toLowerCase().includes(q) || q.includes(e.title.toLowerCase()))
  )
}

async function eventsInWindow(day?: Date, until?: Date): Promise<CalendarEvent[]> {
  const rows = await listEvents()
  if (!day) {
    const start = startOfDay(new Date())
    const horizon = new Date(start)
    horizon.setDate(horizon.getDate() + 60)
    return expandEvents(rows, start, horizon).slice(0, 20)
  }
  const from = startOfDay(day)
  const to = until ? startOfDay(until) : new Date(from.getTime() + 86_400_000)
  return expandEvents(rows, from, to)
}

export async function removeEvent(id: string): Promise<void> {
  const row = (await listEvents()).find((e) => e.id === id)
  if (row) await cancelEventNotifies(row)
  else await cancelNotify(eventNotifyId(id, 0))
  const owner = row
    ? (await listTodos()).find((todo) => eventOwnsTodo(row, todo))
    : undefined
  syncing = true
  try {
    await deleteEvent(id)
    if (owner) {
      try {
        await deleteTodo(owner.id)
      } catch {
        /* Todo ist schon weg. */
      }
    }
  } finally {
    syncing = false
  }
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

export async function renameEvent(id: string, title: string): Promise<CalendarEvent | null> {
  const row = (await listEvents()).find((e) => e.id === id)
  if (!row) return null
  const nextTitle = title.replace(/\s+/g, ' ').trim()
  if (!nextTitle) return null
  const theme = classifyEventTheme(nextTitle, row.place)
  const next: CalendarEvent = { ...row, title: nextTitle, theme }
  await cancelEventNotifies(row)
  await putEvent(next)
  await scheduleEventNotifies(next)
  syncing = true
  let linked = next
  try {
    linked = await syncEventOntoTodo(row, next)
  } finally {
    syncing = false
  }
  if (theme === 'sonstiges') void refineThemeLater(linked)
  return linked
}

export async function updateEventFromGui(
  id: string,
  opts: {
    title: string
    start: Date
    place?: string
    remind_offsets_min?: number[]
    theme?: CalThemeId
    end?: Date
    all_day?: boolean
    recur?: CalendarEvent['recur']
  },
): Promise<CalendarEvent | null> {
  const row = (await listEvents()).find((e) => e.id === id)
  if (!row) return null
  const title = opts.title.replace(/\s+/g, ' ').trim()
  if (!title) return null
  const place = opts.place !== undefined ? opts.place.replace(/\s+/g, ' ').trim() : row.place
  const theme = opts.theme && isCalThemeId(opts.theme) ? opts.theme : classifyEventTheme(title, place)
  await cancelEventNotifies(row)
  const allDay = opts.all_day ?? row.all_day
  const next: CalendarEvent = {
    ...row,
    title,
    start_at: opts.start.toISOString(),
    place: place || '',
    theme,
    end_at: opts.end ? opts.end.toISOString() : defaultEndIso(opts.start, Boolean(allDay)),
    all_day: allDay,
  }
  if (opts.recur !== undefined) next.recur = opts.recur
  if (opts.remind_offsets_min !== undefined) next.remind_offsets_min = opts.remind_offsets_min
  await putEvent(next)
  await scheduleEventNotifies(next)
  syncing = true
  let linked = next
  try {
    linked = await syncEventOntoTodo(row, next)
  } finally {
    syncing = false
  }
  noteCalendarFocus(opts.start)
  if (!opts.theme) void refineThemeLater(linked)
  return linked
}

export async function createEventFromGui(opts: {
  title: string
  start: Date
  place?: string
  remind_offsets_min?: number[]
  theme?: CalThemeId
  end?: Date
  all_day?: boolean
  recur?: CalendarEvent['recur']
}): Promise<CalendarEvent> {
  const theme = opts.theme && isCalThemeId(opts.theme) ? opts.theme : classifyEventTheme(opts.title, opts.place)
  const row = await addEvent({
    title: opts.title,
    start_at: opts.start.toISOString(),
    place: opts.place,
    remind_offsets_min: opts.remind_offsets_min,
    theme,
    end_at: opts.end ? opts.end.toISOString() : defaultEndIso(opts.start, Boolean(opts.all_day)),
    all_day: opts.all_day,
    recur: opts.recur,
  })
  await scheduleEventNotifies(row)
  noteCalendarFocus(opts.start)
  if (!opts.theme) void refineThemeLater(row)
  return row
}

async function refineThemeLater(row: CalendarEvent): Promise<void> {
  if (eventTheme(row) !== 'sonstiges') return
  if (isDebugRunActive()) return
  if (typeof window === 'undefined') return
  try {
    const { classifyEventThemeSmart } = await import('./calendar-theme-llm.ts')
    const next = await classifyEventThemeSmart(row.title, row.place)
    if (next === 'sonstiges' || next === row.theme) return
    const live = (await listEvents()).find((e) => e.id === row.id)
    if (!live) return
    await putEvent({ ...live, theme: next })
  } catch {
    /* offline / kein Key */
  }
}

export function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export async function applyIcsEvents(incoming: CalendarEvent[]): Promise<string> {
  if (!incoming.length) return 'Keine VEVENT in der Datei.'
  for (const row of incoming) {
    const have = (await listEvents()).find((e) => e.id === row.id)
    if (have) {
      await cancelEventNotifies(have)
      const next: CalendarEvent = { ...have, ...row, id: have.id, created_at: have.created_at }
      await putEvent(next)
      await scheduleEventNotifies(next)
    } else {
      const created = await addEvent({
        title: row.title,
        start_at: row.start_at,
        place: row.place,
        remind_offsets_min: row.remind_offsets_min,
        theme: row.theme,
        end_at: row.end_at || defaultEndIso(new Date(row.start_at), Boolean(row.all_day)),
        all_day: row.all_day,
        recur: row.recur,
        id: row.id,
      })
      await scheduleEventNotifies(created)
    }
  }
  return `${incoming.length} Termine aus ICS. Keys und der Rest vom Hausstand bleiben.`
}

export async function marksForMonth(year: number, month: number): Promise<Set<string>> {
  const from = new Date(year, month, 1)
  const until = new Date(year, month + 1, 1)
  const events = expandEvents(await listEvents(), from, until)
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

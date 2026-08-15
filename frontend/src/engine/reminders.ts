import { cancelNotify, notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify'
import { formatDue, parseReminderIntent } from './remind-parse'
import {
  addReminder,
  deleteReminder,
  listEvents,
  listReminders,
  listTodos,
  setReminderStatus,
  type Reminder,
} from './store'
import type { ToolMeta } from './tools'

export { parseReminderIntent } from './remind-parse'
export { formatDue }

export async function handleReminders(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const intent = parseReminderIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    if (intent.due.getTime() <= Date.now() - 5_000) {
      return {
        handled: true,
        reply: `Die Zeit liegt in der Vergangenheit (${intent.whenLabel}). Eine spätere Zeit?`,
        tool: { tool_status: 'error', tool: 'reminder', action: 'create', label: 'Zeit vorbei' },
      }
    }
    const row = await addReminder({
      title: intent.title,
      due_at: intent.due.toISOString(),
      conversationId,
    })
    const perm = await requestNotifyPermission()
    const scheduled = await scheduleNotify({
      id: notifyIdFromKey(row.id),
      title: 'Jarvis',
      body: row.title,
      at: intent.due,
    })
    const ping = perm && scheduled.ok
      ? 'Ich piepe dann.'
      : 'Gespeichert. Benachrichtigung unter Android erlauben, sonst kein Ping.'
    return {
      handled: true,
      reply: `${row.title}, ${intent.whenLabel}. ${ping}`,
      tool: {
        tool_status: 'executed',
        tool: 'reminder',
        action: 'create',
        label: 'Erinnerung liegt',
        preview: `${row.title} · ${intent.whenLabel}`,
      },
    }
  }

  if (intent.kind === 'list') {
    return { handled: true, reply: await formatReminderList() }
  }

  if (intent.kind === 'agenda') {
    return { handled: true, reply: await formatAgenda() }
  }

  const rows = await upcomingReminders()
  if (!rows.length) {
    return { handled: true, reply: 'Keine offene Erinnerung zum Löschen.' }
  }
  const q = intent.query.toLowerCase()
  const byIndex = /^(\d+)$/.exec(q.trim())
  const hit = byIndex
    ? rows[Number(byIndex[1]) - 1]
    : rows.find((r) => r.title.toLowerCase().includes(q) || q.includes(r.title.toLowerCase()))
  if (!hit) {
    return { handled: true, reply: `Keine Erinnerung zu „${intent.query}“.` }
  }
  await cancelNotify(notifyIdFromKey(hit.id))
  await deleteReminder(hit.id)
  return {
    handled: true,
    reply: `Weg: ${hit.title}.`,
    tool: { tool_status: 'executed', tool: 'reminder', action: 'delete', label: 'Erinnerung weg' },
  }
}

export async function upcomingReminders(): Promise<Reminder[]> {
  const rows = await listReminders()
  return rows
    .filter((r) => r.status === 'open')
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
}

export async function formatReminderList(): Promise<string> {
  const rows = await upcomingReminders()
  if (!rows.length) return 'Keine offenen Erinnerungen.'
  const lines = rows.map((r, i) => `${i + 1}. ${r.title} — ${formatDue(new Date(r.due_at))}`)
  return `Erinnerungen:\n${lines.join('\n')}`
}

export async function formatAgenda(): Promise<string> {
  const reminders = await upcomingReminders()
  const todos = (await listTodos()).filter((t) => t.status === 'open')
  const parts: string[] = []
  if (reminders.length) {
    parts.push(
      'Erinnerungen:\n' +
        reminders.map((r, i) => `${i + 1}. ${r.title} — ${formatDue(new Date(r.due_at))}`).join('\n'),
    )
  }
  if (todos.length) {
    parts.push(
      'Todos:\n' +
        todos
          .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
          .map((t, i) => `${i + 1}. ${t.title}`)
          .join('\n'),
    )
  }
  const events = (await listEvents()).filter(
    (e) => new Date(e.start_at).getTime() >= Date.now() - 60_000,
  )
  if (events.length) {
    parts.push(
      'Termine:\n' +
        events
          .slice(0, 8)
          .map((e, i) => `${i + 1}. ${e.title} — ${formatDue(new Date(e.start_at))}`)
          .join('\n'),
    )
  }
  return parts.length ? parts.join('\n\n') : 'Nichts offen. Weder Erinnerung, Todo noch Termin.'
}

export async function removeReminder(id: string): Promise<void> {
  await cancelNotify(notifyIdFromKey(id))
  await deleteReminder(id)
}

export async function syncReminderAlarms(): Promise<void> {
  const rows = await listReminders()
  const now = Date.now()
  for (const r of rows) {
    if (r.status !== 'open') continue
    const due = new Date(r.due_at).getTime()
    if (due <= now - 2 * 3_600_000) {
      await setReminderStatus(r.id, 'missed')
      await cancelNotify(notifyIdFromKey(r.id))
      continue
    }
    if (due <= now) {
      await scheduleNotify({
        id: notifyIdFromKey(r.id),
        title: 'Jarvis',
        body: r.title,
        at: new Date(now + 1_500),
      })
      await setReminderStatus(r.id, 'fired')
      continue
    }
    await scheduleNotify({
      id: notifyIdFromKey(r.id),
      title: 'Jarvis',
      body: r.title,
      at: new Date(r.due_at),
    })
  }
}

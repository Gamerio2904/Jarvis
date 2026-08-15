import { cancelNotify, notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify'
import { syncGlance } from './glance'
import { formatDue, parseReminderIntent } from './remind-parse'
import {
  addReminder,
  deleteReminder,
  listEvents,
  listReminders,
  listTodos,
  putReminder,
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
      kind: intent.recur ? 'recur' : 'once',
      recur: intent.recur || null,
      weekday: intent.weekday ?? null,
    })
    const perm = await requestNotifyPermission()
    const scheduled = await scheduleNotify({
      id: notifyIdFromKey(row.id),
      title: intent.recur ? 'Erinnerung' : 'Jarvis',
      body: row.title,
      at: intent.due,
      alarm: true,
      recur: intent.recur,
    })
    await syncGlance()
    const ping = perm && scheduled.ok
      ? 'Klingelt auch bei Bildschirm aus.'
      : 'Gespeichert. Benachrichtigung unter Android erlauben, sonst kein Klingeln.'
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
  await syncGlance()
  return {
    handled: true,
    reply: `Weg: ${hit.title}.`,
    tool: { tool_status: 'executed', tool: 'reminder', action: 'delete', label: 'Erinnerung weg' },
  }
}

export async function upcomingReminders(): Promise<Reminder[]> {
  const rows = await listReminders()
  return rows
    .filter((r) => r.status === 'open' && r.kind !== 'timer')
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
}

export async function formatReminderList(): Promise<string> {
  const rows = await upcomingReminders()
  if (!rows.length) return 'Keine offenen Erinnerungen.'
    const lines = rows.map((r, i) => `${i + 1}. ${recurTag(r)}${r.title} — ${formatDue(new Date(r.due_at))}`)
  return `Erinnerungen:\n${lines.join('\n')}`
}

export async function formatAgenda(): Promise<string> {
  const reminders = await upcomingReminders()
  const todos = (await listTodos()).filter((t) => t.status === 'open')
  const parts: string[] = []
  if (reminders.length) {
    parts.push(
      'Erinnerungen:\n' +
        reminders.map((r, i) => `${i + 1}. ${recurTag(r)}${r.title} — ${formatDue(new Date(r.due_at))}`).join('\n'),
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

function recurTag(r: Reminder): string {
  if (r.recur === 'daily') return 'täglich · '
  if (r.recur === 'weekly') return 'wöchentlich · '
  return ''
}

export async function removeReminder(id: string): Promise<void> {
  await cancelNotify(notifyIdFromKey(id))
  await deleteReminder(id)
  await syncGlance()
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
      if (r.recur === 'daily' || r.recur === 'weekly') {
        const next = nextRecurDue(new Date(r.due_at), r.recur)
        await putReminder({ ...r, due_at: next.toISOString(), status: 'open' })
        await scheduleNotify({
          id: notifyIdFromKey(r.id),
          title: 'Erinnerung',
          body: r.title,
          at: next,
          alarm: true,
          recur: r.recur,
        })
        continue
      }
      await scheduleNotify({
        id: notifyIdFromKey(r.id),
        title: r.kind === 'timer' ? 'Timer' : 'Jarvis',
        body: r.title,
        at: new Date(now + 1_500),
        alarm: true,
      })
      await setReminderStatus(r.id, 'fired')
      continue
    }
    await scheduleNotify({
      id: notifyIdFromKey(r.id),
      title: r.kind === 'timer' ? 'Timer' : 'Jarvis',
      body: r.title,
      at: new Date(r.due_at),
      alarm: true,
      recur: r.recur || undefined,
    })
  }
  await syncGlance()
}

export function nextRecurDue(from: Date, recur: 'daily' | 'weekly'): Date {
  const step = recur === 'weekly' ? 7 : 1
  const next = new Date(from)
  next.setDate(next.getDate() + step)
  while (next.getTime() <= Date.now()) next.setDate(next.getDate() + step)
  return next
}

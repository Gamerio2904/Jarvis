import { cancelNotify, notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify'
import { syncGlance } from './glance'
import {
  addReminder,
  deleteReminder,
  listReminders,
  type Reminder,
} from './store'
import { parseTimerIntent } from './timer-parse'
import { timerDoneLine } from './timer-announce'
import type { ToolMeta } from './tools'

export { parseTimerIntent } from './timer-parse'

export async function handleTimers(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const intent = parseTimerIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    const row = await addReminder({
      title: intent.title,
      due_at: intent.due.toISOString(),
      conversationId,
      kind: 'timer',
    })
    const perm = await requestNotifyPermission()
    const scheduled = await scheduleNotify({
      id: notifyIdFromKey(row.id),
      title: 'Timer',
      body: row.title,
      at: intent.due,
      alarm: true,
      mode: 'speak',
      say: timerDoneLine(row.title),
    })
    await syncGlance()
    const ping = perm && scheduled.ok
      ? 'Ich sage Bescheid, auch bei Bildschirm aus. Kein Klingeln.'
      : 'Gespeichert. Benachrichtigung erlauben, sonst kein Hinweis.'
    return {
      handled: true,
      reply: `Timer ${row.title}, ${intent.whenLabel}. ${ping}`,
      tool: {
        tool_status: 'executed',
        tool: 'timer',
        action: 'create',
        label: 'Timer läuft',
        preview: `${row.title} · ${intent.whenLabel}`,
      },
    }
  }

  if (intent.kind === 'list') {
    const rows = await openTimers()
    if (!rows.length) return { handled: true, reply: 'Kein laufender Timer.' }
    const lines = rows.map((r, i) => `${i + 1}. ${r.title} — ${leftLabel(r.due_at)}`)
    return { handled: true, reply: `Timer:\n${lines.join('\n')}` }
  }

  const rows = await openTimers()
  if (!rows.length) return { handled: true, reply: 'Kein Timer zum Stoppen.' }
  for (const r of rows) {
    await cancelNotify(notifyIdFromKey(r.id))
    await deleteReminder(r.id)
  }
  await syncGlance()
  return {
    handled: true,
    reply: rows.length === 1 ? `Timer ${rows[0].title} aus.` : `${rows.length} Timer aus.`,
    tool: { tool_status: 'executed', tool: 'timer', action: 'stop', label: 'Timer aus' },
  }
}

export async function openTimers(): Promise<Reminder[]> {
  const now = Date.now()
  return (await listReminders())
    .filter((r) => r.kind === 'timer' && r.status === 'open' && new Date(r.due_at).getTime() > now - 2_000)
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
}

function leftLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'gleich'
  if (ms < 90_000) return `noch ${Math.round(ms / 1000)} s`
  return `noch ${Math.max(1, Math.round(ms / 60_000))} min`
}

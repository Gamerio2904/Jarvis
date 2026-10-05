import { cancelNotify, notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify'
import { parseAlarmIntent } from './alarm-parse'
import { syncGlance } from './glance'
import {
  addReminder,
  deleteReminder,
  listReminders,
  loadSettings,
  type Reminder,
} from './store'
import type { ToolMeta } from './tools'

export { parseAlarmIntent } from './alarm-parse'

export async function handleAlarms(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const intent = parseAlarmIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    const row = await addReminder({
      title: intent.title,
      due_at: intent.due.toISOString(),
      conversationId,
      kind: 'alarm',
      recur: intent.recur || null,
      weekday: intent.weekday ?? null,
    })
    const perm = await requestNotifyPermission()
    const tone = loadSettings().alarm_tone_uri
    const scheduled = await scheduleNotify({
      id: notifyIdFromKey(row.id),
      title: 'Wecker',
      body: row.title,
      at: intent.due,
      alarm: true,
      recur: intent.recur,
      tone,
    })
    await syncGlance()
    const ping = perm && scheduled.ok
      ? 'Klingelt bei Bildschirm aus.'
      : 'Gespeichert. Benachrichtigung erlauben, sonst kein Klingeln.'
    const again = intent.recur ? ' Mit Wiederholung.' : ' Einmalig.'
    const name = row.title && row.title !== 'Wecker' ? ` ${row.title}` : ''
    return {
      handled: true,
      reply: `Wecker${name}, ${intent.whenLabel}.${again} ${ping}`,
      tool: {
        tool_status: 'executed',
        tool: 'alarm',
        action: 'create',
        label: 'Wecker liegt',
        preview: `${row.title} · ${intent.whenLabel}`,
      },
    }
  }

  if (intent.kind === 'list') {
    const rows = await openAlarms()
    if (!rows.length) return { handled: true, reply: 'Kein Wecker gestellt.' }
    const lines = rows.map((r, i) => `${i + 1}. ${tag(r)}${r.title} — ${new Date(r.due_at).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`)
    return { handled: true, reply: `Wecker:\n${lines.join('\n')}` }
  }

  if (intent.kind === 'delete') {
    const rows = await openAlarms()
    const q = intent.query.toLowerCase()
    const hit = rows.find((r) => r.title.toLowerCase().includes(q) || q.includes(r.title.toLowerCase()))
    if (!hit) return { handled: true, reply: `Kein Wecker zu „${intent.query}“.` }
    await cancelNotify(notifyIdFromKey(hit.id))
    await deleteReminder(hit.id)
    await syncGlance()
    return {
      handled: true,
      reply: `Wecker ${hit.title} aus.`,
      tool: { tool_status: 'executed', tool: 'alarm', action: 'delete', label: 'Wecker weg' },
    }
  }

  const rows = await openAlarms()
  if (!rows.length) return { handled: true, reply: 'Kein Wecker zum Stoppen.' }
  for (const r of rows) {
    await cancelNotify(notifyIdFromKey(r.id))
    await deleteReminder(r.id)
  }
  await syncGlance()
  return {
    handled: true,
    reply: rows.length === 1 ? `Wecker ${rows[0].title} aus.` : `${rows.length} Wecker aus.`,
    tool: { tool_status: 'executed', tool: 'alarm', action: 'stop', label: 'Wecker aus' },
  }
}

export async function openAlarms(): Promise<Reminder[]> {
  return (await listReminders())
    .filter((r) => r.kind === 'alarm' && r.status === 'open')
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
}

function tag(r: Reminder): string {
  if (r.recur === 'daily') return 'täglich · '
  if (r.recur === 'weekly') return 'wöchentlich · '
  return 'einmal · '
}

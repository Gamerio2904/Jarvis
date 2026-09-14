import { nextBirthday, parseBirthdayIntent } from './birthday-parse.ts'
import { addReminder, listReminders, persistLastList, upsertMemory } from './store.ts'
import { requestNotifyPermission, scheduleNotify, notifyIdFromKey } from '../native/notify.ts'
import { formatDue } from './remind-parse.ts'
import type { ToolMeta } from './tools.ts'

export { parseBirthdayIntent } from './birthday-parse.ts'

export async function handleBirthday(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseBirthdayIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'list') {
    const rows = (await listReminders()).filter((r) => r.kind === 'birthday' && r.status === 'open')
    if (!rows.length) return { handled: true, reply: 'Keine Geburtstage gespeichert.' }
    persistLastList('birthday', rows.map((r) => r.title))
    return {
      handled: true,
      reply: rows.map((r, i) => `${i + 1}. ${r.title} — ${formatDue(new Date(r.due_at))}`).join('\n'),
      lastTool: 'birthday',
    }
  }

  const due = nextBirthday(intent.month, intent.day)
  await upsertMemory(intent.name.toLowerCase(), `${intent.day}.${intent.month}.`, 'birthday', conversationId)
  const row = await addReminder({
    title: `Geburtstag ${intent.name}`,
    due_at: due.toISOString(),
    conversationId,
    kind: 'birthday',
  })
  await requestNotifyPermission()
  await scheduleNotify({
    id: notifyIdFromKey(row.id),
    title: 'Geburtstag',
    body: row.title,
    at: due,
  })
  return {
    handled: true,
    reply: `${intent.name}, ${intent.day}.${intent.month}. — nächste Erinnerung ${formatDue(due)}.`,
    tool: { tool_status: 'executed', tool: 'birthday', action: 'save', label: 'Geburtstag', preview: intent.name },
    lastTool: 'birthday',
  }
}

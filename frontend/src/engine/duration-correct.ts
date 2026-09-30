/** „Nein 90 Minuten“ setzt die Zeit, statt sie nur zu wiederholen. */

import { cancelNotify, notifyIdFromKey } from '../native/notify.ts'
import { formatRemindOffsets } from './calendar-parse.ts'
import { cancelEventNotifies, scheduleEventNotifies } from './calendar.ts'
import { handleReminders, removeReminder, upcomingReminders } from './reminders.ts'
import { handleTimers } from './timers.ts'
import {
  deleteReminder,
  getPending,
  listEvents,
  listReminders,
  loadSettings,
  putEvent,
  type CalendarEvent,
} from './store.ts'

export function parseDurationNo(text: string): { n: number; unit: string; ms: number } | null {
  const m = /^\s*(?:nein|nee+|doch)[,.]?\s*(\d+)\s*(minuten?|stunden?|sekunden?)\s*[.!]?\s*$/i.exec(
    text.trim(),
  )
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n <= 0) return null
  const unit = m[2].toLowerCase()
  const ms = unit.startsWith('sek') ? n * 1000 : unit.startsWith('stund') ? n * 3_600_000 : n * 60_000
  if (ms < 5_000 || ms > 12 * 3_600_000) return null
  return { n, unit, ms }
}

function unitWord(unit: string, n: number): string {
  if (unit.startsWith('sek')) return n === 1 ? 'Sekunde' : 'Sekunden'
  if (unit.startsWith('stund')) return n === 1 ? 'Stunde' : 'Stunden'
  return n === 1 ? 'Minute' : 'Minuten'
}

export async function applyDurationCorrection(
  conversationId: string,
  text: string,
): Promise<{ reply: string; tool: string } | null> {
  const hit = parseDurationNo(text)
  if (!hit) return null
  const pending = await getPending(conversationId)
  if (pending?.tool === 'calendar' && pending.action === 'remind_offsets') return null
  const tool = (loadSettings().last_step_tool || '').trim()
  const title = (loadSettings().last_step_title || '').trim()
  if (tool === 'reminder') {
    const reply = await moveReminder(conversationId, hit, title)
    return reply ? { reply, tool: 'reminder' } : null
  }
  if (tool === 'calendar') {
    const reply = await remindLastEvent(hit)
    if (reply) return { reply, tool: 'calendar' }
  }
  const reply = await replaceTimer(conversationId, hit)
  return reply ? { reply, tool: 'timer' } : null
}

async function replaceTimer(conversationId: string, hit: { n: number; unit: string }): Promise<string | null> {
  const open = (await listReminders()).filter((r) => r.status === 'open' && r.kind === 'timer')
  for (const row of open) {
    await cancelNotify(notifyIdFromKey(row.id))
    await deleteReminder(row.id)
  }
  const word = unitWord(hit.unit, hit.n)
  const made = await handleTimers(conversationId, `Timer auf ${hit.n} ${word}`)
  return made.reply || null
}

async function moveReminder(
  conversationId: string,
  hit: { n: number; unit: string },
  title: string,
): Promise<string | null> {
  const rows = await upcomingReminders()
  const hitRow =
    (title && rows.find((r) => r.title.toLowerCase() === title.toLowerCase())) || rows[0]
  if (hitRow) await removeReminder(hitRow.id)
  const name = hitRow?.title || title || 'Erinnerung'
  const word = unitWord(hit.unit, hit.n)
  const made = await handleReminders(conversationId, `erinner mich in ${hit.n} ${word} an ${name}`)
  return made.reply || null
}

async function remindLastEvent(hit: { n: number; unit: string }): Promise<string | null> {
  const rows = await listEvents()
  const row = [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
  if (!row) return null
  const minutes = hit.unit.startsWith('sek')
    ? Math.max(1, Math.round(hit.n / 60))
    : hit.unit.startsWith('stund')
      ? hit.n * 60
      : hit.n
  const next: CalendarEvent = { ...row, remind_offsets_min: [minutes] }
  await cancelEventNotifies(row)
  await putEvent(next)
  await scheduleEventNotifies(next)
  return `Erinnerung: ${formatRemindOffsets([minutes])}.`
}

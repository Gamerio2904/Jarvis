/**
 * I8: Proaktiv werden — Morgen-Briefing und Fristen-Wache.
 *
 * Kein Hintergrunddienst: Beim App-Start (einmal pro Tag) prüft die Wache
 * Termine und Todos von heute und morgen. Wenn etwas ansteht, gibt es eine
 * Mitteilung — den Inhalt kann Jarvis danach im Chat ausführlich erzählen.
 * Mehrfachmeldungen pro Tag werden über `last_watch_day` verhindert.
 */
import { listEvents, listTodos, loadSettings, saveSettings } from './store.ts'
import { expandEvents } from './calendar-occur.ts'
import { notifyIdFromKey, scheduleNotify } from '../native/notify.ts'

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function clockOf(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export type WatchResult = { lines: string[]; briefing: string }

/** Einmal pro Tag: Fristen-Wache (morgen fällig) + Morgen-Briefing (heute). */
export async function runDailyWatches(now = new Date()): Promise<WatchResult> {
  const lines: string[] = []
  const today = isoDay(now)
  const s = loadSettings()
  if (s.last_watch_day === today) return { lines, briefing: '' }
  saveSettings({ last_watch_day: today })

  const briefingParts: string[] = []
  try {
    const events = expandEvents(await listEvents(), new Date(now.getFullYear(), now.getMonth(), now.getDate()), addDays(now, 1))
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
    const todayEvents = events.filter((e) => isoDay(new Date(e.start_at)) === today)
    if (todayEvents.length) {
      const heads = todayEvents.slice(0, 3).map((e) => `${e.all_day ? e.title : `${clockOf(e.start_at)} ${e.title}`}`)
      briefingParts.push(`Heute ${todayEvents.length === 1 ? '1 Termin' : `${todayEvents.length} Termine`}: ${heads.join(', ')}${todayEvents.length > 3 ? ' …' : ''}`)
      lines.push(`${todayEvents.length} Termin(e) heute`)
    }
    const todos = (await listTodos()).filter((t) => t.status !== 'done' && t.deadline_date)
    const todayTodos = todos.filter((t) => t.deadline_date === today)
    if (todayTodos.length) {
      briefingParts.push(`Heute fällig: ${todayTodos.slice(0, 4).map((t) => t.title).join(', ')}`)
      lines.push(`${todayTodos.length} Todo(s) heute fällig`)
    }
    const tomorrow = isoDay(addDays(now, 1))
    const tomorrowTodos = todos.filter((t) => t.deadline_date === tomorrow)
    const tomorrowEvents = events.filter((e) => isoDay(new Date(e.start_at)) === tomorrow)
    const watch: string[] = []
    if (tomorrowTodos.length) watch.push(`Todos: ${tomorrowTodos.slice(0, 4).map((t) => t.title).join(', ')}`)
    if (tomorrowEvents.length) watch.push(`Termine: ${tomorrowEvents.slice(0, 3).map((e) => `${clockOf(e.start_at)} ${e.title}`).join(', ')}`)
    if (watch.length) {
      const body = `Morgen anstehen — ${watch.join(' · ')}`
      const out = await scheduleNotify({
        id: notifyIdFromKey(`fristen-wache-${tomorrow}`),
        title: 'Fristen-Wache: morgen',
        body,
        at: new Date(Date.now() + 2_000),
      })
      lines.push(out.ok ? 'Fristen-Wache meldet morgen' : 'Fristen-Wache stumm (keine Berechtigung?)')
    }
  } catch {
    /* Die Wache darf nie den Start blockieren. */
  }

  const briefing = briefingParts.join(' · ')
  if (briefing) {
    await scheduleNotify({
      id: notifyIdFromKey(`morgen-briefing-${today}`),
      title: 'Guten Morgen — die Lage',
      body: briefing,
      at: new Date(Date.now() + 1_000),
    }).catch(() => null)
    lines.push('Morgen-Briefing raus')
  }
  return { lines, briefing }
}

/** Briefing-Text auf Abruf („wie ist die Lage heute?“) — ohne Meldung. */
export async function briefingText(now = new Date()): Promise<string> {
  const parts: string[] = []
  const today = isoDay(now)
  try {
    const events = expandEvents(await listEvents(), new Date(now.getFullYear(), now.getMonth(), now.getDate()), addDays(now, 1))
      .filter((e) => isoDay(new Date(e.start_at)) === today)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
    if (events.length) {
      parts.push(`Termine heute: ${events.map((e) => (e.all_day ? e.title : `${clockOf(e.start_at)} ${e.title}`)).join(', ')}`)
    } else {
      parts.push('Heute keine Termine.')
    }
    const todos = (await listTodos()).filter((t) => t.status !== 'done' && (!t.deadline_date || t.deadline_date <= isoDay(addDays(now, 1))))
    if (todos.length) {
      parts.push(`Anstehende Todos: ${todos.slice(0, 6).map((t) => `${t.title}${t.deadline_date && t.deadline_date <= today ? ' (heute)' : ''}`).join(', ')}`)
    } else {
      parts.push('Keine offenen Todos mit Frist.')
    }
  } catch {
    parts.push('Die Lage ließ sich nicht ganz lesen.')
  }
  return parts.join(' ')
}

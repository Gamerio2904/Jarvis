import { APP_VERSION, listEvents, listReminders, listShopping, loadSettings } from './store.ts'
import { formatDue } from './remind-parse.ts'

/** Werte für die Homescreen-Leiste. Nur Store, nichts Erfundenes. */
export type GlanceSnap = {
  clock: string
  weekday: string
  next: string
  weather: string
  shop: number
  timer: string
  groq: boolean
  gemini: boolean
  version: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function clockLabel(now = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function weekdayLabel(now = new Date()): string {
  return now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })
}

export async function readGlanceSnap(now = new Date()): Promise<GlanceSnap> {
  const t = now.getTime()
  const rows = (await listReminders())
    .filter((r) => r.status === 'open' && new Date(r.due_at).getTime() > t - 2_000)
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
  const events = (await listEvents())
    .filter((e) => new Date(e.start_at).getTime() >= t - 60_000)
    .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
  const shop = (await listShopping()).filter((s) => s.status === 'open')
  const timer = rows.find((r) => r.kind === 'timer')
  const rem = rows.find((r) => r.kind !== 'timer' && r.kind !== 'home')
  const alarm = rows.find((r) => r.kind === 'alarm')
  const ev = events[0]
  let next = 'Nichts geplant'
  if (ev) {
    const where = ev.place ? ` · ${ev.place}` : ''
    next = `${ev.title}${where} · ${formatDue(new Date(ev.start_at), now)}`
  } else if (alarm) {
    const tag = alarm.recur ? 'Wecker täglich' : 'Wecker'
    next = `${tag} ${alarm.title} · ${formatDue(new Date(alarm.due_at), now)}`
  } else if (timer) {
    const name = (timer.title || '').trim()
    next = `${name && !/^timer$/i.test(name) ? name : 'Timer'} · ${formatDue(new Date(timer.due_at), now)}`
  } else if (shop.length) next = `Einkauf: ${shop.slice(0, 3).map((s) => s.title).join(', ')}`
  else if (rem) {
    const tag = rem.recur === 'daily' ? 'täglich' : rem.recur === 'weekly' ? 'wöchentlich' : ''
    next = `${tag ? `${tag} · ` : ''}${rem.title} · ${formatDue(new Date(rem.due_at), now)}`
  }
  const s = loadSettings()
  const weather = s.last_weather_line.trim() || 'Wetter im Chat fragen'
  let timerLine = ''
  if (timer) {
    const name = (timer.title || '').trim()
    timerLine = `${name && !/^timer$/i.test(name) ? name : 'Timer'} · ${formatDue(new Date(timer.due_at), now)}`
  }
  return {
    clock: clockLabel(now),
    weekday: weekdayLabel(now),
    next,
    weather,
    shop: shop.length,
    timer: timerLine,
    groq: Boolean(s.groq_api_key.trim()),
    gemini: Boolean(s.gemini_enabled && s.gemini_api_key.trim()),
    version: APP_VERSION,
  }
}

import { publishGlance } from '../native/notify'
import { formatDue } from './remind-parse'
import { listEvents, listMemory, listReminders, listShopping, loadSettings } from './store'

export async function syncGlance(): Promise<void> {
  try {
    const now = Date.now()
    const rows = (await listReminders())
      .filter((r) => r.status === 'open' && new Date(r.due_at).getTime() > now - 2_000)
      .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
    const events = (await listEvents())
      .filter((e) => new Date(e.start_at).getTime() >= now - 60_000)
      .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
    const shop = (await listShopping()).filter((s) => s.status === 'open')
    const timer = rows.find((r) => r.kind === 'timer')
    const rem = rows.find((r) => r.kind !== 'timer' && r.kind !== 'home')
    const alarm = rows.find((r) => r.kind === 'alarm')
    const ev = events[0]
    let next = 'Nichts geplant'
    if (ev) {
      const where = ev.place ? ` · ${ev.place}` : ''
      next = `${ev.title}${where} · ${formatDue(new Date(ev.start_at))}`
    } else if (alarm) {
      const tag = alarm.recur ? 'Wecker täglich' : 'Wecker'
      next = `${tag} ${alarm.title} · ${formatDue(new Date(alarm.due_at))}`
    } else if (timer) {
      const name = (timer.title || '').trim()
      next = `${name && !/^timer$/i.test(name) ? name : 'Timer'} · ${formatDue(new Date(timer.due_at))}`
    } else if (shop.length) next = `Einkauf: ${shop.slice(0, 3).map((s) => s.title).join(', ')}`
    else if (rem) {
      const tag = rem.recur === 'daily' ? 'täglich' : rem.recur === 'weekly' ? 'wöchentlich' : ''
      next = `${tag ? `${tag} · ` : ''}${rem.title} · ${formatDue(new Date(rem.due_at))}`
    }
    const home = (await listMemory('place')).find((m) => m.key === 'zuhause' && m.value.trim())
    const weather =
      loadSettings().last_weather_line ||
      (home ? 'Route nach Hause im Chat' : 'Wetter im Chat fragen')
    await publishGlance({ next, weather })
  } catch {
    /* Widget ist optional */
  }
}

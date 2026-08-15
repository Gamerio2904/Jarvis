import { publishGlance } from '../native/notify'
import { formatDue } from './remind-parse'
import { listReminders, loadSettings } from './store'

export async function syncGlance(): Promise<void> {
  try {
    const now = Date.now()
    const rows = (await listReminders())
      .filter((r) => r.status === 'open' && new Date(r.due_at).getTime() > now - 2_000)
      .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
    const timer = rows.find((r) => r.kind === 'timer')
    const rem = rows.find((r) => r.kind !== 'timer')
    let next = 'Nichts geplant'
    const alarm = rows.find((r) => r.kind === 'alarm')
    if (alarm) {
      const tag = alarm.recur ? 'Wecker täglich' : 'Wecker'
      next = `${tag} ${alarm.title} · ${formatDue(new Date(alarm.due_at))}`
    } else if (timer) next = `Timer ${timer.title} · ${formatDue(new Date(timer.due_at))}`
    else if (rem) {
      const tag = rem.recur === 'daily' ? 'täglich' : rem.recur === 'weekly' ? 'wöchentlich' : ''
      next = `${tag ? `${tag} · ` : ''}${rem.title} · ${formatDue(new Date(rem.due_at))}`
    }
    const weather = loadSettings().last_weather_line || 'Wetter im Chat fragen'
    await publishGlance({ next, weather })
  } catch {
    /* Widget ist optional */
  }
}

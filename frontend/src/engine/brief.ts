import { formatAgenda, upcomingReminders } from './reminders'
import { listShopping, listEvents, listReminders, loadSettings } from './store'
import { handleWeather } from './weather'
import type { ToolMeta } from './tools'

export { isBriefAsk } from './brief-parse'

export async function handleBrief(): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const parts: string[] = []
  const weather = await handleWeather('Wetter heute')
  if (weather.handled && weather.reply) parts.push(weather.reply.split(/[.!?]/)[0] + '.')

  const agenda = await formatAgenda()
  if (agenda && !/^Nichts offen/.test(agenda)) parts.push(agenda)

  const shop = (await listShopping()).filter((s) => s.status === 'open')
  if (shop.length) parts.push(`Einkauf: ${shop.map((s) => s.title).join(', ')}.`)

  const timers = (await listReminders()).filter((r) => r.kind === 'timer' && r.status === 'open')
  if (timers.length) parts.push(`${timers.map((t) => (t.title && !/^timer$/i.test(t.title) ? t.title : 'Timer')).join(', ')}.`)

  const soon = (await listEvents()).filter((e) => new Date(e.start_at).getTime() >= Date.now() - 60_000)
  if (soon[0] && !parts.some((p) => p.includes(soon[0].title))) {
    /* agenda already has events */
  }

  const home = (await upcomingReminders()).filter((r) => r.kind === 'home')
  if (home.length) parts.push(`Zuhause: ${home.map((h) => h.title).join(', ')}.`)

  const s = loadSettings()
  if (!parts.length) {
    return { handled: true, reply: s.last_weather_line ? `${s.last_weather_line} Sonst liegt nichts an.` : 'Im Kalender liegt nichts, die Listen sind leer.' }
  }
  return {
    handled: true,
    reply: parts.join(' '),
    lastTool: 'brief',
  }
}

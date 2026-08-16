import { parseHomeIntent } from './home-parse'
import { geocodePlace, haversineM } from './geo-lookup'
import { readDeviceLocation, hasLocationPermission } from '../native/geo'
import { scheduleNotify, notifyIdFromKey, requestNotifyPermission } from '../native/notify'
import {
  addReminder,
  listMemory,
  listReminders,
  loadSettings,
  saveSettings,
  setReminderStatus,
} from './store'
import type { ToolMeta } from './tools'

export { parseHomeIntent } from './home-parse'

async function ensureHomeFix(): Promise<{ ok: boolean; message?: string }> {
  const s = loadSettings()
  if (Number(s.home_lat) && Number(s.home_lon)) return { ok: true }
  const home = (await listMemory('place')).find((m) => m.key === 'zuhause')
  if (!home?.value) return { ok: false, message: 'Kein Zuhause. Sage zuerst „Ich wohne in …“.' }
  const geo = await geocodePlace(home.value)
  if (!geo.ok) return { ok: false, message: geo.message }
  saveSettings({ home_lat: String(geo.fix.lat), home_lon: String(geo.fix.lon) })
  return { ok: true }
}

export async function fireHomeTasks(): Promise<string[]> {
  const rows = (await listReminders()).filter((r) => r.kind === 'home' && r.status === 'open')
  const fired: string[] = []
  for (const r of rows) {
    await requestNotifyPermission()
    await scheduleNotify({
      id: notifyIdFromKey(r.id),
      title: 'Jarvis · Zuhause',
      body: r.title,
      at: new Date(Date.now() + 1_200),
      alarm: true,
    })
    await setReminderStatus(r.id, 'fired')
    fired.push(r.title)
  }
  return fired
}

export async function checkHomeFence(): Promise<string[]> {
  const ready = await ensureHomeFix()
  if (!ready.ok) return []
  const granted = await hasLocationPermission()
  if (!granted) return []
  const s = loadSettings()
  const here = await readDeviceLocation()
  if (!here.ok || here.lat == null || here.lon == null) return []
  const dist = haversineM(
    { lat: Number(s.home_lat), lon: Number(s.home_lon), place: 'home' },
    { lat: here.lat, lon: here.lon },
  )
  const radius = Number(s.home_radius_m) || 250
  if (dist > radius) return []
  return fireHomeTasks()
}

export async function handleHome(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseHomeIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'im_home') {
    const fired = await fireHomeTasks()
    return {
      handled: true,
      reply: fired.length ? `Zuhause: ${fired.join('; ')}.` : 'Nichts für Zuhause offen.',
      lastTool: 'home',
    }
  }

  const home = (await listMemory('place')).find((m) => m.key === 'zuhause')
  if (!home?.value) {
    saveSettings({ last_step_tool: 'home_ask', last_step_title: intent.task })
    return {
      handled: true,
      reply: 'Wo ist Zuhause? Sage „Ich wohne in …“, dann merke ich die Aufgabe.',
      lastTool: 'home_ask',
    }
  }
  const fix = await ensureHomeFix()
  if (!fix.ok) return { handled: true, reply: fix.message }

  await addReminder({
    title: intent.task,
    due_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    conversationId,
    kind: 'home',
  })
  return {
    handled: true,
    reply: `Wenn Sie zuhause sind: ${intent.task}. Handy muss an sein — Gerät aus löst nicht aus.`,
    tool: { tool_status: 'executed', tool: 'home', action: 'save', label: 'Zuhause', preview: intent.task },
    lastTool: 'home',
  }
}

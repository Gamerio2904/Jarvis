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
  upsertMemory,
} from './store'
import { packVerified } from './action-fsm.ts'
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
    const packed = packVerified({
      domain: 'home',
      intent: 'im_home',
      plan: 'fire',
      label: 'Zuhause',
      observation: { fired: fired.length, titles: fired },
      verify: () => true,
      successReply: fired.length ? `Zuhause: ${fired.join('; ')}.` : 'Nichts für Zuhause offen.',
      failReply: 'Zuhause-Aufgaben nicht ausgelöst.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'home' }
  }

  const home = (await listMemory('place')).find((m) => m.key === 'zuhause')
  if (intent.kind === 'when_home' && intent.address) {
    const geo = await geocodePlace(intent.address)
    if (!geo.ok) {
      return { handled: true, reply: geo.message, lastTool: 'home' }
    }
    await upsertMemory('zuhause', intent.address, 'place', conversationId)
    saveSettings({
      home_lat: String(geo.fix.lat),
      home_lon: String(geo.fix.lon),
      home_radius_m: String(intent.radiusM || 250),
    })
  } else if (!home?.value) {
    saveSettings({ last_step_tool: 'home_ask', last_step_title: intent.task })
    const packed = packVerified({
      domain: 'home',
      intent: 'when_home',
      plan: 'ask',
      label: 'Zuhause',
      waiting: true,
      observation: null,
      successReply: 'Wo ist Zuhause? Sage „Ich wohne in …“, dann merke ich die Aufgabe.',
      failReply: 'Wo ist Zuhause? Sage „Ich wohne in …“, dann merke ich die Aufgabe.',
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'home_ask' }
  }
  const fix = await ensureHomeFix()
  if (!fix.ok) return { handled: true, reply: fix.message }

  await addReminder({
    title: intent.task,
    due_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    conversationId,
    kind: 'home',
  })
  const rows = await listReminders()
  const saved = rows.some((r) => r.kind === 'home' && r.title === intent.task && r.status === 'open')
  const meters = intent.kind === 'when_home' && intent.radiusM ? ` Radius ${intent.radiusM} Meter.` : ''
  const where = intent.kind === 'when_home' && intent.address ? ` ${intent.address}.` : ''
  const packed = packVerified({
    domain: 'home',
    intent: 'when_home',
    plan: 'save',
    label: 'Zuhause',
    observation: { saved, task: intent.task },
    verify: (obs) => obs.saved === true,
    successReply: `Wenn Sie zuhause sind:${where} ${intent.task}.${meters} Handy muss an sein — Gerät aus löst nicht aus.`,
    failReply: 'Die Zuhause-Aufgabe ist nicht gespeichert.',
    extra: { preview: intent.task },
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'home' }
}

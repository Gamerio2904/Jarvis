import { ensureDeviceLocation } from '../native/geo'
import { reversePlace } from './geo-lookup'
import { formatHereReply, parseHereIntent } from './here-parse'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { formatHereReply, parseHereIntent } from './here-parse'
export type { HereIntent } from './here-parse'

type HereHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
  retry?: 'fuel' | 'weather' | 'poi'
}

export async function handleHere(text: string): Promise<HereHit> {
  const last = (loadSettings().last_step_tool || '').trim()
  const intent = parseHereIntent(text, last)
  if (!intent) return { handled: false }
  if (intent.kind === 'activate') return activate(last)
  return locate(false)
}

async function activate(lastTool: string): Promise<HereHit> {
  const loc = await ensureDeviceLocation({ openSettingsIfDenied: true })
  if (loc.ok && loc.lat != null && loc.lon != null) {
    await rememberFix(loc.lat, loc.lon)
    if (lastTool === 'fuel') return { handled: true, retry: 'fuel' }
    if (lastTool === 'weather') return { handled: true, retry: 'weather' }
    if (lastTool === 'poi') return { handled: true, retry: 'poi' }
    return speakPlace(loc.lat, loc.lon)
  }
  return {
    handled: true,
    reply: loc.message || 'Standort weiter aus. Ich rate nicht.',
    tool: hereTool(loc.openedSettings ? 'settings' : 'ask'),
    lastTool: lastTool === 'fuel' || lastTool === 'weather' || lastTool === 'poi' ? lastTool : 'here',
  }
}

async function locate(openSettings: boolean): Promise<HereHit> {
  const loc = await ensureDeviceLocation({ openSettingsIfDenied: openSettings })
  if (!loc.ok || loc.lat == null || loc.lon == null) {
    return {
      handled: true,
      reply: loc.message || 'Kein Standort. Ich rate nicht.',
      tool: hereTool(loc.openedSettings ? 'settings' : 'ask'),
      lastTool: 'here',
    }
  }
  await rememberFix(loc.lat, loc.lon)
  return speakPlace(loc.lat, loc.lon)
}

async function speakPlace(lat: number, lon: number): Promise<HereHit> {
  const place = (await reversePlace(lat, lon)) || ''
  if (place) saveSettings({ last_place: place })
  const reply = place
    ? formatHereReply(place)
    : `Ungefähr ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° O. Den Ortsnamen liefert das Netz gerade nicht.`
  return {
    handled: true,
    reply,
    tool: {
      tool_status: 'executed',
      tool: 'here',
      action: 'locate',
      label: 'Standort',
      preview: place || `${lat.toFixed(3)},${lon.toFixed(3)}`,
    },
    lastTool: 'here',
  }
}

async function rememberFix(lat: number, lon: number) {
  const place = loadSettings().last_place || ''
  saveSettings({
    last_lat: String(lat),
    last_lon: String(lon),
    last_fix_at: new Date().toISOString(),
    last_place: place,
  })
}

function hereTool(action: string): ToolMeta {
  return { tool_status: action === 'ask' ? 'error' : 'executed', tool: 'here', action, label: 'Standort' }
}

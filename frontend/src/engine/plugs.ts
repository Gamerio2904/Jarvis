import { loadSettings, type Settings } from './store'
import { PLUG_ALIASES, isSafeHost, parsePlugCommand, plugUrl, type PlugId } from './plugs-parse'

export type { PlugId, PlugIntent } from './plugs-parse'
export { isSafeHost, parsePlugCommand, plugUrl }

export type PlugProtocol = 'tasmota' | 'shelly' | 'shelly_rpc'

export type PlugDef = {
  id: PlugId
  label: string
  aliases: RegExp
  hostKey: keyof Settings
  protocolKey: keyof Settings
}

const KEYS: Record<PlugId, { hostKey: keyof Settings; protocolKey: keyof Settings }> = {
  pc: { hostKey: 'plug_pc_host', protocolKey: 'plug_pc_protocol' },
  screen: { hostKey: 'plug_screen_host', protocolKey: 'plug_screen_protocol' },
  leds: { hostKey: 'plug_leds_host', protocolKey: 'plug_leds_protocol' },
}

export const PLUGS: PlugDef[] = PLUG_ALIASES.map((p) => ({ ...p, ...KEYS[p.id] }))

export function configuredPlugs(settings: Settings = loadSettings()) {
  return PLUGS.map((def) => {
    const host = String(settings[def.hostKey] || '').trim()
    const protocol = String(settings[def.protocolKey] || 'tasmota')
    return { ...def, host, protocol, ready: Boolean(settings.plugs_enabled && host && isSafeHost(host)) }
  })
}

async function httpGet(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const { CapacitorHttp } = await import('@capacitor/core')
    const res = await CapacitorHttp.get({ url, connectTimeout: 4000, readTimeout: 4000 })
    const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '')
    return { ok: res.status >= 200 && res.status < 300, status: res.status, body }
  } catch {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(4000) })
    return { ok: res.ok, status: res.status, body: await res.text() }
  }
}

export async function switchPlug(id: PlugId, on: boolean): Promise<{ ok: boolean; detail: string }> {
  const plug = configuredPlugs().find((p) => p.id === id)
  if (!plug) return { ok: false, detail: `${id}: unbekannt` }
  if (!plug.ready) return { ok: false, detail: `${plug.label}: keine IP in den Einstellungen` }
  const url = plugUrl(plug.host, plug.protocol, on ? 'on' : 'off')
  try {
    const res = await httpGet(url)
    if (!res.ok) return { ok: false, detail: `${plug.label}: HTTP ${res.status}` }
    return { ok: true, detail: `${plug.label} ${on ? 'an' : 'aus'}` }
  } catch {
    return { ok: false, detail: `${plug.label}: nicht erreichbar (${plug.host})` }
  }
}

export async function testPlug(id: PlugId): Promise<{ ok: boolean; detail: string }> {
  const plug = configuredPlugs().find((p) => p.id === id)
  if (!plug) return { ok: false, detail: 'unbekannt' }
  if (!isSafeHost(plug.host)) return { ok: false, detail: 'IP fehlt oder ungültig' }
  const url = plugUrl(plug.host, plug.protocol, 'status')
  try {
    const res = await httpGet(url)
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
    return { ok: true, detail: 'erreichbar' }
  } catch {
    return { ok: false, detail: `keine Antwort von ${plug.host}` }
  }
}

export function listPlugReply(): string {
  const rows = configuredPlugs()
  if (!loadSettings().plugs_enabled) return 'Steckdosen sind aus. Unter Einstellungen einschalten und IPs setzen.'
  const lines = rows.map((p) =>
    p.ready ? `• ${p.label}: ${p.host} (${p.protocol})` : `• ${p.label}: keine IP`,
  )
  return `WLAN-Steckdosen (gleiches WLAN):\n${lines.join('\n')}\n„PC an“ / „LEDs aus“ — dann Ja.`
}

import { loadSettings, saveSettings, newId } from './store'
import { plugDiscoverNative, plugProbeNative, plugSetNative, type HomeDevice } from '../native/home'
import {
  PLUG_FOLLOWUP_MS,
  isPlugFollowUpPhrase,
  parsePlugIntent,
  type PlugAction,
  type PlugIntent,
} from './plug-parse'

export { parsePlugIntent } from './plug-parse'

export type PlugKind = 'auto' | 'shelly' | 'tasmota' | 'tuya' | 'http' | 'broadlink'

export type Plug = {
  id: string
  name: string
  kind: PlugKind
  host: string
  mac?: string
  deviceId?: string
  localKey?: string
  version?: string
  dps?: string
  onUrl?: string
  offUrl?: string
}

let lastPlugAt = 0

export function loadPlugs(): Plug[] {
  try {
    const raw = loadSettings().plugs_json
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(asPlug)
      .filter((p): p is Plug => Boolean(p && p.name && (p.host || p.kind === 'http')))
  } catch {
    return []
  }
}

function asPlug(row: unknown): Plug | null {
  if (!row || typeof row !== 'object') return null
  const o = row as Record<string, unknown>
  const name = String(o.name || '').trim()
  const host = String(o.host || '').trim()
  const kind = String(o.kind || 'auto').trim() as PlugKind
  if (!name) return null
  return {
    id: String(o.id || newId()),
    name,
    kind: ['auto', 'shelly', 'tasmota', 'tuya', 'http', 'broadlink'].includes(kind) ? kind : 'auto',
    host,
    mac: String(o.mac || '').trim() || undefined,
    deviceId: String(o.deviceId || '').trim() || undefined,
    localKey: String(o.localKey || '').trim() || undefined,
    version: String(o.version || '').trim() || undefined,
    dps: String(o.dps || '').trim() || undefined,
    onUrl: String(o.onUrl || '').trim() || undefined,
    offUrl: String(o.offUrl || '').trim() || undefined,
  }
}

export function savePlugs(list: Plug[]): Plug[] {
  saveSettings({ plugs_json: JSON.stringify(list), plugs_enabled: list.length ? true : loadSettings().plugs_enabled })
  return list
}

export function upsertPlug(plug: Plug): Plug[] {
  const list = loadPlugs()
  const i = list.findIndex((p) => p.id === plug.id)
  const next = { ...plug, name: plug.name.trim() || 'Steckdose', host: plug.host.trim() }
  if (i >= 0) list[i] = next
  else list.push(next)
  return savePlugs(list)
}

export function removePlug(id: string): Plug[] {
  return savePlugs(loadPlugs().filter((p) => p.id !== id))
}

export function emptyPlug(): Plug {
  return { id: newId(), name: '', kind: 'auto', host: '' }
}

export async function discoverPlugs(): Promise<{ items: HomeDevice[]; message?: string }> {
  const res = await plugDiscoverNative()
  return { items: res.items || [], message: res.message }
}

export async function probePlug(plug: Partial<Plug>): Promise<{ ok: boolean; reply: string; kind?: string }> {
  const host = (plug.host || '').trim()
  if (!host && plug.kind !== 'http') return { ok: false, reply: 'Keine IP. Unter Haus eintragen oder suchen.' }
  const res = await plugProbeNative(nativeOpts(plug, true, false))
  if (!res.ok) return { ok: false, reply: res.message || 'Steckdose nicht erreichbar.' }
  return { ok: true, reply: res.message || `Da: ${host}`, kind: res.kind }
}

export async function testPlug(plug: Partial<Plug>, on: boolean): Promise<{ ok: boolean; reply: string }> {
  const res = await plugSetNative(nativeOpts(plug, on, false))
  if (!res.ok) return { ok: false, reply: res.message || 'Nicht geschaltet.' }
  const name = (plug.name || 'Steckdose').trim()
  return { ok: true, reply: res.message || `${name} ${on ? 'an' : 'aus'}.` }
}

function nativeOpts(plug: Partial<Plug>, on: boolean, statusOnly: boolean) {
  return {
    host: (plug.host || '').trim(),
    kind: plug.kind || 'auto',
    mac: plug.mac,
    deviceId: plug.deviceId,
    localKey: plug.localKey,
    version: plug.version,
    dps: plug.dps || '1',
    onUrl: plug.onUrl,
    offUrl: plug.offUrl,
    on,
    statusOnly,
  }
}

function pickNamed(list: Plug[], name: string): Plug | null {
  const q = name.trim().toLowerCase()
  const exact = list.find((p) => p.name.toLowerCase() === q)
  if (exact) return exact
  const has = list.filter((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()))
  return has.length === 1 ? has[0] : has.sort((a, b) => b.name.length - a.name.length)[0] || null
}

function line(name: string, action: PlugAction, ok: boolean, detail?: string): string {
  if (!ok) return detail || `${name} hat nicht geschaltet.`
  if (action === 'status') return detail || `${name} geprüft.`
  if (action === 'toggle') return `${name} umgeschaltet.`
  return `${name} ${action === 'on' ? 'an' : 'aus'}.`
}

async function apply(plug: Plug, action: PlugAction): Promise<string> {
  const on = action === 'off' ? false : true
  const statusOnly = action === 'status'
  const res = await plugSetNative(nativeOpts(plug, on, statusOnly))
  return line(plug.name, action, res.ok, res.message)
}

export function isPlugFollowUp(text: string): boolean {
  return Date.now() - lastPlugAt <= PLUG_FOLLOWUP_MS && isPlugFollowUpPhrase(text)
}

export async function handlePlug(text: string): Promise<{ handled: boolean; reply?: string }> {
  const list = loadPlugs()
  const names = list.map((p) => p.name)
  const follow = isPlugFollowUp(text)
  const intent = parsePlugIntent(text, names, follow)
  if (!intent) return { handled: false }
  const s = loadSettings()
  if (!s.plugs_enabled) {
    return { handled: true, reply: 'Steckdosen sind aus (Einstellungen → Haus).' }
  }
  lastPlugAt = Date.now()
  if (!list.length) {
    return {
      handled: true,
      reply: 'Keine Steckdose hinterlegt. Einstellungen → Haus: IP eintragen oder suchen, dann prüfen.',
    }
  }
  return { handled: true, reply: await runIntent(list, intent) }
}

async function runIntent(list: Plug[], intent: PlugIntent): Promise<string> {
  if (intent.target === 'all') {
    const parts: string[] = []
    for (const p of list) parts.push(await apply(p, intent.action))
    return parts.join(' ')
  }
  let plug: Plug | null = null
  if (intent.target === 'named' && intent.name) plug = pickNamed(list, intent.name)
  if (!plug && intent.target === 'single' && list.length === 1) plug = list[0]
  if (!plug && intent.target === 'single' && list.length > 1) {
    const names = list.map((p) => p.name).join(', ')
    return `Welche Steckdose? ${names}.`
  }
  if (!plug) return `Steckdose „${intent.name || ''}“ kenne ich nicht.`
  return apply(plug, intent.action)
}

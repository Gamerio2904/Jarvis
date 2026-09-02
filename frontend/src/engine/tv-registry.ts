/** TV Device-Registry + Launch-Verify. Kein SmartThings, kein Schirm-OCR. */

import { loadSettings, saveSettings } from './store.ts'
import type { TvAppId } from './tv-apps.ts'

export type TvKind = 'tizen' | 'fire'

export type TvDeviceRec = {
  id: string
  name: string
  kind: TvKind
  host: string
  mac: string
  port: number
  token: string
  paired: boolean
  enabled: boolean
  apps: TvAppId[]
}

export const TIZEN_APPS: TvAppId[] = ['youtube', 'netflix', 'disney', 'prime']

export type TvLaunchObs = {
  launched?: boolean
  deviceId?: string
  paired?: boolean
  kind?: string
  app?: string
  appId?: string
  apps?: string[]
  reachable?: boolean
}

export function tvLaunchVerified(obs: TvLaunchObs): { ok: boolean; error?: string } {
  if (!String(obs.deviceId || '').trim()) return { ok: false, error: 'Kein Gerät in der Registry.' }
  if (obs.kind === 'fire') return { ok: false, error: 'Fire TV startet hier keine Apps. Samsung oder HDMI.' }
  if (!obs.paired) return { ok: false, error: 'TV nicht gekoppelt.' }
  if (!obs.launched) return { ok: false, error: 'Start nicht angekommen.' }
  if (!String(obs.appId || '').trim()) return { ok: false, error: 'Keine App-ID gesendet.' }
  const app = String(obs.app || '')
  const apps = Array.isArray(obs.apps) ? obs.apps : []
  if (app && !apps.includes(app)) return { ok: false, error: 'App nicht in der Registry.' }
  return { ok: true }
}

export function deviceCanLaunch(dev: TvDeviceRec, app: TvAppId): boolean {
  return Boolean(dev.enabled && dev.kind === 'tizen' && dev.paired && dev.host && dev.apps.includes(app))
}

export function pickTvDevice(devices: TvDeviceRec[], text = '', via?: 'tv' | 'fire'): TvDeviceRec | null {
  const list = devices.filter((d) => d.enabled && d.host)
  if (!list.length) return null
  if (via === 'fire' || /\b(?:fire[\s-]*tv|fire[\s-]*stick)\b/i.test(text)) {
    return list.find((d) => d.kind === 'fire') || null
  }
  const named = list.find((d) => d.name && new RegExp(`\\b${escapeRe(d.name)}\\b`, 'i').test(text))
  if (named) return named
  return list.find((d) => d.kind === 'tizen' && d.paired) || list.find((d) => d.kind === 'tizen') || list[0]
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function seedTvDevices(s: {
  tv_enabled?: boolean
  tv_name?: string
  tv_host?: string
  tv_mac?: string
  tv_port?: number
  tv_token?: string
  tv_paired?: boolean
  tv_fire_host?: string
  tv_fire_port?: number
}): TvDeviceRec[] {
  const out: TvDeviceRec[] = []
  if ((s.tv_host || '').trim()) {
    out.push({
      id: 'tizen-default',
      name: (s.tv_name || 'Wohnzimmer').trim() || 'Wohnzimmer',
      kind: 'tizen',
      host: s.tv_host!.trim(),
      mac: (s.tv_mac || '').trim(),
      port: s.tv_port || 8002,
      token: s.tv_token || '',
      paired: Boolean(s.tv_paired && s.tv_token),
      enabled: s.tv_enabled !== false,
      apps: [...TIZEN_APPS],
    })
  }
  if ((s.tv_fire_host || '').trim()) {
    out.push({
      id: 'fire-default',
      name: 'Fire TV',
      kind: 'fire',
      host: s.tv_fire_host!.trim(),
      mac: '',
      port: s.tv_fire_port || 5555,
      token: '',
      paired: true,
      enabled: true,
      apps: [],
    })
  }
  return out
}

function asDevice(raw: unknown): TvDeviceRec | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const kind = o.kind === 'fire' ? 'fire' : o.kind === 'tizen' ? 'tizen' : null
  if (!kind || typeof o.id !== 'string' || !o.id) return null
  const apps = Array.isArray(o.apps)
    ? o.apps.filter((a): a is TvAppId => a === 'youtube' || a === 'netflix' || a === 'disney' || a === 'prime')
    : kind === 'tizen'
      ? [...TIZEN_APPS]
      : []
  return {
    id: o.id,
    name: String(o.name || (kind === 'fire' ? 'Fire TV' : 'Wohnzimmer')),
    kind,
    host: String(o.host || ''),
    mac: String(o.mac || ''),
    port: Number(o.port) || (kind === 'fire' ? 5555 : 8002),
    token: String(o.token || ''),
    paired: Boolean(o.paired),
    enabled: o.enabled !== false,
    apps,
  }
}

export function loadTvRegistry(): TvDeviceRec[] {
  const s = loadSettings()
  try {
    const raw = s.tv_devices_json
    if (raw) {
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr)) {
        const rows = arr.map(asDevice).filter((d): d is TvDeviceRec => Boolean(d))
        if (rows.length) return rows
      }
    }
  } catch {
    /* seed */
  }
  const seeded = seedTvDevices(s)
  if (seeded.length) saveTvRegistry(seeded)
  return seeded
}

export function saveTvRegistry(rows: TvDeviceRec[]): void {
  saveSettings({ tv_devices_json: JSON.stringify(rows) })
}

export function upsertTvDevice(patch: Partial<TvDeviceRec> & { id: string }): TvDeviceRec {
  const rows = loadTvRegistry()
  const i = rows.findIndex((d) => d.id === patch.id)
  const prev = i >= 0 ? rows[i] : {
    id: patch.id,
    name: 'Wohnzimmer',
    kind: 'tizen' as const,
    host: '',
    mac: '',
    port: 8002,
    token: '',
    paired: false,
    enabled: true,
    apps: [...TIZEN_APPS],
  }
  const next = { ...prev, ...patch, apps: patch.apps || prev.apps }
  if (i >= 0) rows[i] = next
  else rows.push(next)
  saveTvRegistry(rows)
  return next
}

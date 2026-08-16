import { loadSettings, saveSettings } from './store'
import {
  tvDiscoverNative,
  tvPairNative,
  tvSendKeyNative,
  tvTestNative,
  tvWakeNative,
  type TvDevice,
  type TvResult,
} from '../native/tv'
import {
  TV_FOLLOWUP_MS,
  isFollowUpPhrase,
  parseTvIntent,
  type TvAction,
} from './tv-parse'

export { parseTvIntent } from './tv-parse'
export type { TvAction, TvIntent } from './tv-parse'

let lastTvAt = 0

const KEYS: Record<TvAction, string | null> = {
  on: null,
  off: 'KEY_POWER',
  volume_up: 'KEY_VOLUP',
  volume_down: 'KEY_VOLDOWN',
  volume_set: null,
  mute: 'KEY_MUTE',
  hdmi1: 'KEY_HDMI1',
  hdmi2: 'KEY_HDMI2',
  hdmi3: 'KEY_HDMI3',
  hdmi4: 'KEY_HDMI4',
}

const REPLIES: Record<TvAction, string> = {
  on: 'Fernseher an — Magic-Packet ist raus.',
  off: 'Fernseher aus.',
  volume_up: 'Lauter.',
  volume_down: 'Leiser.',
  volume_set: 'Lautstärke gesetzt.',
  mute: 'Stumm umgeschaltet.',
  hdmi1: 'HDMI 1.',
  hdmi2: 'HDMI 2.',
  hdmi3: 'HDMI 3.',
  hdmi4: 'HDMI 4.',
}

export function isTvFollowUp(text: string): boolean {
  return Date.now() - lastTvAt <= TV_FOLLOWUP_MS && isFollowUpPhrase(text)
}

function markTvTurn() {
  lastTvAt = Date.now()
}

export function tvStatusFromSettings() {
  const s = loadSettings()
  return {
    enabled: s.tv_enabled,
    name: s.tv_name,
    host: s.tv_host,
    mac: s.tv_mac,
    port: s.tv_port,
    paired: s.tv_paired,
    reachable: Boolean(s.tv_paired && s.tv_host),
  }
}

export async function discoverTvs(): Promise<{ items: TvDevice[]; message?: string }> {
  const res = await tvDiscoverNative()
  const items = res.items || []
  if (!items.length) {
    return {
      items,
      message:
        res.message ||
        'Nichts gefunden. Gleiches WLAN wie der TV? Gastnetz/AP-Isolation blockiert oft Geräte.',
    }
  }
  return { items, message: res.message }
}

export async function pairTv(body: {
  host?: string
  mac?: string
  name?: string
  port?: number
}): Promise<{ ok: boolean; message: string }> {
  const s = loadSettings()
  const host = (body.host || s.tv_host).trim()
  if (!host) return { ok: false, message: 'Keine TV-Adresse. Erst suchen oder Host eintragen.' }
  const name = body.name || s.tv_name || 'Wohnzimmer'
  const port = body.port || s.tv_port || 8001
  const res = await tvPairNative({
    host,
    port,
    name: 'Jarvis',
    token: s.tv_token || undefined,
  })
  if (!res.ok) {
    saveSettings({
      tv_host: host,
      tv_name: name,
      tv_mac: body.mac || s.tv_mac,
      tv_port: port,
      tv_paired: false,
    })
    return {
      ok: false,
      message:
        res.message ||
        'Koppeln fehlgeschlagen. Am TV erlauben, gleiches WLAN, kein Gastnetz.',
    }
  }
  saveSettings({
    tv_enabled: true,
    tv_host: host,
    tv_name: name,
    tv_mac: body.mac || s.tv_mac,
    tv_port: res.port || port,
    tv_token: res.token || s.tv_token,
    tv_paired: true,
  })
  return { ok: true, message: res.message || 'Gekoppelt. Token liegt auf dem Handy.' }
}

export async function testTv(): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  if (!s.tv_host) return { ok: false, reply: 'Kein Host. Unter Einstellungen suchen oder eintragen.' }
  const res = await tvTestNative({
    host: s.tv_host,
    port: s.tv_port || 8002,
    token: s.tv_token || undefined,
  })
  if (!res.ok) {
    return {
      ok: false,
      reply: res.message || 'TV nicht erreichbar. An, gleiches WLAN, gekoppelt?',
    }
  }
  return { ok: true, reply: res.message || `Erreichbar: ${s.tv_name || s.tv_host}` }
}

async function sendOrExplain(action: TvAction, count = 1): Promise<string> {
  const s = loadSettings()
  const key = KEYS[action]
  if (!key) return REPLIES[action]
  const n = Math.max(1, Math.min(100, count))
  const res = await tvSendKeyNative({
    host: s.tv_host,
    port: s.tv_port || 8002,
    token: s.tv_token || undefined,
    key,
    count: n,
  })
  if (!res.ok) {
    return res.message || 'Taste nicht angekommen. TV an, gekoppelt, gleiches WLAN?'
  }
  return REPLIES[action]
}

function rememberedVolume(): number | null {
  const n = Number(loadSettings().tv_volume)
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : null
}

async function applyVolume(intent: { action: TvAction; steps?: number; level?: number }): Promise<string> {
  const steps = intent.steps || 1
  if (intent.action === 'volume_set') {
    const target = Math.max(1, Math.min(100, intent.level || 1))
    const from = rememberedVolume() ?? 30
    const delta = target - from
    if (delta === 0) {
      saveSettings({ tv_volume: String(target) })
      return `Lautstärke bleibt bei etwa ${target}.`
    }
    const reply = await sendOrExplain(delta > 0 ? 'volume_up' : 'volume_down', Math.abs(delta))
    if (reply.includes('nicht')) return reply
    saveSettings({ tv_volume: String(target) })
    return `Lautstärke etwa ${target}. Tasten, keine exakte Skala vom TV.`
  }
  if (intent.action === 'volume_up') {
    const reply = await sendOrExplain('volume_up', steps)
    if (reply.includes('nicht')) return reply
    const from = rememberedVolume() ?? 0
    const next = Math.min(100, from + steps)
    saveSettings({ tv_volume: String(next || steps) })
    return steps > 1 ? `Lauter um ${steps} — etwa ${next || steps}.` : 'Lauter.'
  }
  if (intent.action === 'volume_down') {
    const reply = await sendOrExplain('volume_down', steps)
    if (reply.includes('nicht')) return reply
    const from = rememberedVolume() ?? 0
    const next = Math.max(1, from - steps)
    saveSettings({ tv_volume: String(next) })
    return steps > 1 ? `Leiser um ${steps} — etwa ${next}.` : 'Leiser.'
  }
  return sendOrExplain(intent.action)
}

export async function handleTv(text: string): Promise<{ handled: boolean; reply?: string }> {
  const follow = isTvFollowUp(text)
  const intent = parseTvIntent(text, follow)
  if (!intent) return { handled: false }

  const s = loadSettings()
  if (!s.tv_enabled) {
    return { handled: true, reply: 'Fernseher ist aus (Einstellungen → Fernseher).' }
  }
  if (!s.tv_host) {
    return { handled: true, reply: 'Kein TV hinterlegt. Unter Einstellungen suchen und koppeln.' }
  }

  if (intent.action === 'on') {
    if (!s.tv_mac) {
      return {
        handled: true,
        reply: 'Keine MAC für Wake-on-LAN. Unter Einstellungen eintragen oder neu suchen.',
      }
    }
    const wol = await tvWakeNative(s.tv_mac)
    markTvTurn()
    if (!wol.ok) {
      return {
        handled: true,
        reply:
          wol.message ||
          'WOL fehlgeschlagen. Magic-Packet braucht die Android-App, MAC und oft WOL am TV.',
      }
    }
    return {
      handled: true,
      reply:
        'Magic-Packet gesendet. Wacht er nicht auf: WOL am TV prüfen, gleiches WLAN, kein Gastnetz.',
    }
  }

  if (!s.tv_paired || !s.tv_token) {
    return {
      handled: true,
      reply: 'TV noch nicht gekoppelt. Unter Einstellungen koppeln und am Fernseher erlauben.',
    }
  }

  const reply =
    intent.action === 'volume_up' || intent.action === 'volume_down' || intent.action === 'volume_set'
      ? await applyVolume(intent)
      : await sendOrExplain(intent.action)
  markTvTurn()
  return { handled: true, reply }
}

export type { TvDevice, TvResult }

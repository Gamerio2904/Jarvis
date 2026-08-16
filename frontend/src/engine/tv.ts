import { loadSettings, saveSettings } from './store'
import {
  tvDiscoverNative,
  tvFireKeyNative,
  tvFireTestNative,
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
let lastVia: 'tv' | 'fire' = 'tv'

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
  play: null,
  pause: null,
  next: null,
  prev: null,
  home: null,
  back: null,
  ok: null,
  up: null,
  down: null,
  left: null,
  right: null,
}

const FIRE_CODE: Partial<Record<TvAction, number>> = {
  on: 224,
  off: 223,
  play: 126,
  pause: 127,
  next: 87,
  prev: 88,
  home: 3,
  back: 4,
  ok: 23,
  up: 19,
  down: 20,
  left: 21,
  right: 22,
  mute: 91,
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
  play: 'Play auf Fire TV.',
  pause: 'Pause auf Fire TV.',
  next: 'Weiter auf Fire TV.',
  prev: 'Zurück auf Fire TV.',
  home: 'Fire TV Home.',
  back: 'Zurück auf Fire TV.',
  ok: 'OK auf Fire TV.',
  up: 'Hoch.',
  down: 'Runter.',
  left: 'Links.',
  right: 'Rechts.',
}

export function isTvFollowUp(text: string): boolean {
  return Date.now() - lastTvAt <= TV_FOLLOWUP_MS && isFollowUpPhrase(text)
}

function markTvTurn(via: 'tv' | 'fire' = 'tv') {
  lastTvAt = Date.now()
  lastVia = via
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

export async function testFireTv(opts?: { host?: string; port?: number }): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  const host = (opts?.host || s.tv_fire_host || '').trim()
  const port = opts?.port || s.tv_fire_port || 5555
  if (!host) {
    return {
      ok: false,
      reply:
        'Keine Fire-TV-Adresse. IP unter Info → Netzwerk am Fire TV, dann hier eintragen und testen.',
    }
  }
  const res = await tvFireTestNative({ host, port })
  if (!res.ok) return { ok: false, reply: res.message || 'Fire TV nicht erreichbar.' }
  return { ok: true, reply: res.message || 'Fire TV per ADB da.' }
}

function fireHdmiAction(): TvAction {
  const n = Math.max(1, Math.min(4, Number(loadSettings().tv_fire_hdmi) || 3))
  return `hdmi${n}` as TvAction
}

async function sendFire(action: TvAction): Promise<string> {
  const s = loadSettings()
  const host = s.tv_fire_host.trim()
  const code = FIRE_CODE[action]
  if (!host) {
    return 'Fire TV: IP unter Einstellungen → Fernseher eintragen. ADB über Netzwerk, sonst nur HDMI am Samsung.'
  }
  if (code == null) return REPLIES[action]
  const res = await tvFireKeyNative({ host, port: s.tv_fire_port || 5555, code })
  if (!res.ok) return res.message || 'Fire TV hat die Taste nicht genommen.'
  return REPLIES[action]
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
  let intent = parseTvIntent(text, follow)
  if (!intent && follow && lastVia === 'fire') {
    intent = parseTvIntent(`Fire TV ${text.trim()}`, false)
  }
  if (!intent) return { handled: false }

  const s = loadSettings()
  if (!s.tv_enabled) {
    return { handled: true, reply: 'Fernseher ist aus (Einstellungen → Fernseher).' }
  }

  const fire = intent.via === 'fire'
  const vol =
    intent.action === 'volume_up' || intent.action === 'volume_down' || intent.action === 'volume_set'

  if (fire && !vol) {
    const bits: string[] = []
    if (intent.action === 'on' || intent.action.startsWith('hdmi')) {
      const hdmiAct = intent.action.startsWith('hdmi') ? intent.action : fireHdmiAction()
      if (s.tv_paired && s.tv_host) {
        bits.push(await sendOrExplain(hdmiAct))
      } else {
        bits.push(`Quelle ${hdmiAct.replace('hdmi', 'HDMI ')} am Samsung, wenn gekoppelt.`)
      }
      if (intent.action === 'on') bits.push(await sendFire('on'))
    } else {
      bits.push(await sendFire(intent.action))
    }
    markTvTurn('fire')
    return { handled: true, reply: bits.filter(Boolean).join(' ') }
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
    markTvTurn(intent.via || 'tv')
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

  const reply = vol ? await applyVolume(intent) : await sendOrExplain(intent.action)
  markTvTurn()
  return { handled: true, reply }
}

export type { TvDevice, TvResult }

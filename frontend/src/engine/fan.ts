import { loadSettings, saveSettings } from './store'
import {
  homeDiscoverNative,
  homeLearnNative,
  homeSendNative,
  homeTestNative,
  type HomeDevice,
} from '../native/home'
import {
  FAN_FOLLOWUP_MS,
  isFanFollowUpPhrase,
  parseFanIntent,
  type FanAction,
  type FanIntent,
} from './fan-parse'

export { parseFanIntent } from './fan-parse'

let lastFanAt = 0
let lastSpeed = 2

type FanCodes = Partial<Record<'on' | 'off' | 'speed1' | 'speed2' | 'speed3' | 'light', string>>

function codes(): FanCodes {
  try {
    const raw = loadSettings().fan_codes_json
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FanCodes
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveCodes(next: FanCodes) {
  saveSettings({ fan_codes_json: JSON.stringify(next) })
}

function codeFor(action: FanAction, speed?: number): { key: keyof FanCodes; hex: string } | null {
  const c = codes()
  if (action === 'on') {
    const hex = c.on || c.speed2 || c.speed1 || c.speed3 || ''
    return hex ? { key: c.on ? 'on' : 'speed2', hex } : null
  }
  if (action === 'off') return c.off ? { key: 'off', hex: c.off } : null
  if (action === 'light_on' || action === 'light_off') return c.light ? { key: 'light', hex: c.light } : null
  if (action === 'speed') {
    const n = Math.max(1, Math.min(3, speed || 2)) as 1 | 2 | 3
    const key = (`speed${n}` as const)
    const hex = c[key] || ''
    return hex ? { key, hex } : null
  }
  if (action === 'faster') {
    const n = Math.min(3, lastSpeed + 1) as 1 | 2 | 3
    const key = (`speed${n}` as const)
    return c[key] ? { key, hex: c[key] as string } : null
  }
  if (action === 'slower') {
    const n = Math.max(1, lastSpeed - 1) as 1 | 2 | 3
    const key = (`speed${n}` as const)
    return c[key] ? { key, hex: c[key] as string } : null
  }
  return null
}

const REPLIES: Record<FanAction, string> = {
  on: 'Ventilator an.',
  off: 'Ventilator aus.',
  speed: 'Stufe gesetzt.',
  light_on: 'Ventilator-Licht umgeschaltet.',
  light_off: 'Ventilator-Licht umgeschaltet.',
  faster: 'Schneller.',
  slower: 'Langsamer.',
}

export function isFanFollowUp(text: string): boolean {
  return Date.now() - lastFanAt <= FAN_FOLLOWUP_MS && isFanFollowUpPhrase(text)
}

export async function discoverFan(): Promise<{ items: HomeDevice[]; message?: string }> {
  const res = await homeDiscoverNative()
  return { items: res.items || [], message: res.message }
}

export async function testFan(opts?: { host?: string }): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  const host = (opts?.host || s.fan_host || '').trim()
  if (!host) return { ok: false, reply: 'Keine Brücken-IP. Unter Haus eintragen oder suchen.' }
  const res = await homeTestNative({ host, mac: s.fan_mac || undefined })
  if (!res.ok) return { ok: false, reply: res.message || 'Brücke nicht erreichbar.' }
  if (res.host) saveSettings({ fan_host: res.host, fan_mac: res.mac || s.fan_mac, fan_enabled: true })
  return { ok: true, reply: res.message || `Brücke da: ${host}` }
}

export async function learnFan(slot: keyof FanCodes): Promise<{ ok: boolean; reply: string }> {
  const s = loadSettings()
  const host = s.fan_host.trim()
  if (!host) return { ok: false, reply: 'Erst die Brücken-IP eintragen, dann lernen.' }
  const res = await homeLearnNative({ host, mac: s.fan_mac || undefined })
  if (!res.ok || !res.code) {
    return { ok: false, reply: res.message || 'Nichts gelernt. Taste an der Original-Fernbedienung drücken.' }
  }
  saveCodes({ ...codes(), [slot]: res.code })
  saveSettings({ fan_enabled: true, fan_host: host, fan_mac: res.mac || s.fan_mac })
  return { ok: true, reply: `Gelernt: ${slot}.` }
}

export async function pickFan(item: { host?: string; mac?: string; name?: string }): Promise<string> {
  const host = (item.host || '').trim()
  if (!host) return 'Keine Adresse.'
  saveSettings({ fan_host: host, fan_mac: item.mac || '', fan_name: item.name || 'Ventilator', fan_enabled: true })
  return `Brücke ${host}. Als Nächstes Tasten lernen.`
}

async function sendCode(intent: FanIntent): Promise<string> {
  const s = loadSettings()
  const host = s.fan_host.trim()
  if (!host) {
    return 'Kein Ventilator hinterlegt. Einstellungen → Haus: Brücke suchen, Tasten lernen.'
  }
  const found = codeFor(intent.action, intent.speed)
  if (!found) {
    const need =
      intent.action === 'speed'
        ? `Stufe ${intent.speed}`
        : intent.action.startsWith('light')
          ? 'Licht'
          : intent.action === 'off'
            ? 'Aus'
            : 'An'
    return `Taste „${need}“ ist noch nicht gelernt. Unter Haus die Original-Fernbedienung drücken.`
  }
  const res = await homeSendNative({ host, mac: s.fan_mac || undefined, code: found.hex })
  if (!res.ok) return res.message || 'Brücke hat nicht gesendet.'
  if (intent.action === 'speed' && intent.speed) lastSpeed = intent.speed
  if (intent.action === 'faster') lastSpeed = Math.min(3, lastSpeed + 1)
  if (intent.action === 'slower') lastSpeed = Math.max(1, lastSpeed - 1)
  if (intent.action === 'speed') return `Stufe ${intent.speed}.`
  return REPLIES[intent.action]
}

export async function handleFan(text: string): Promise<{ handled: boolean; reply?: string }> {
  const follow = isFanFollowUp(text)
  const intent = parseFanIntent(text, follow)
  if (!intent) return { handled: false }
  const s = loadSettings()
  if (!s.fan_enabled) {
    return { handled: true, reply: 'Ventilator ist aus (Einstellungen → Haus).' }
  }
  lastFanAt = Date.now()
  return { handled: true, reply: await sendCode(intent) }
}

export type PlugId = 'pc' | 'screen' | 'leds'

export const PLUG_ALIASES: { id: PlugId; label: string; aliases: RegExp }[] = [
  { id: 'pc', label: 'PC', aliases: /\b(pc|rechner|computer)\b/i },
  { id: 'screen', label: 'Bildschirm', aliases: /\b(bildschirm|monitor|screen)\b/i },
  { id: 'leds', label: 'LEDs', aliases: /\b(leds?|lichter?|lampe|beleuchtung)\b/i },
]

const ON = /\b(an|ein|on|einschalten|anmachen)\b/i
const OFF = /\b(aus|off|ausschalten|ausmachen)\b/i
const ALL = /\b(alle|alles|überall)\b/i
const LIST = /\b(steckdosen|stecker)\b/i

export type PlugIntent =
  | { kind: 'switch'; ids: PlugId[]; on: boolean }
  | { kind: 'list' }

export function parsePlugCommand(text: string): PlugIntent | null {
  const t = text.trim()
  if (LIST.test(t) && !ON.test(t) && !OFF.test(t)) return { kind: 'list' }

  const on = ON.test(t)
  const off = OFF.test(t)
  if (on === off) return null

  const ids = PLUG_ALIASES.filter((p) => p.aliases.test(t)).map((p) => p.id)
  if (ALL.test(t)) return { kind: 'switch', ids: PLUG_ALIASES.map((p) => p.id), on }
  if (!ids.length) return null
  return { kind: 'switch', ids, on }
}

export function isSafeHost(host: string): boolean {
  const h = host.trim()
  if (!h || h.length > 64) return false
  if (/[/:\\\s]/.test(h)) return false
  return /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(
    h,
  )
}

export function plugUrl(host: string, protocol: string, action: 'on' | 'off' | 'status'): string {
  const h = host.trim()
  if (protocol === 'shelly_rpc') {
    if (action === 'status') return `http://${h}/rpc/Switch.GetStatus?id=0`
    return `http://${h}/rpc/Switch.Set?id=0&on=${action === 'on' ? 'true' : 'false'}`
  }
  if (protocol === 'shelly') {
    if (action === 'status') return `http://${h}/relay/0`
    return `http://${h}/relay/0?turn=${action === 'on' ? 'on' : 'off'}`
  }
  if (action === 'status') return `http://${h}/cm?cmnd=Power`
  return `http://${h}/cm?cmnd=Power%20${action === 'on' ? 'On' : 'Off'}`
}

import { normalizeUtterance } from './utterance.ts'

export type DevicePage = 'wifi' | 'bluetooth' | 'dnd'

export type DeviceIntent =
  | { kind: 'clock' }
  | { kind: 'battery' }
  | { kind: 'network' }
  | { kind: 'steps' }
  | { kind: 'pressure' }
  | { kind: 'compass' }
  | { kind: 'torch'; on: boolean }
  | { kind: 'page'; page: DevicePage }
  | { kind: 'ask' }

const SKIP =
  /\b(notiz|todo|erinnerung|wecker|timer|fernseher|ventilator|lüfter|spotify|youtube|netflix|steckdose)\b/i

const BATTERY =
  /\b(?:akku|ladestand|ladezustand|batterie)\b|\bwie\s+voll\b|\blädt\s+(?:das\s+)?(?:handy|telefon|gerät)\b/i

const NETWORK =
  /\b(?:wie\s+ist\s+(?:die\s+)?verbindung|bin\s+ich\s+(?:im\s+wlan|online|im\s+netz)|mobilfunk|netzwerkstatus|welche\s+verbindung)\b/i

const TORCH_ON =
  /^\s*(?:(?:mach(?:e)?(?:\s+mal)?|schalt(?:e)?)\s+)?(?:die\s+)?(?:taschenlampe|handylicht|blitzlicht)(?:\s+(?:an|ein|aktivieren))?\s*[.!?]*$/i
const TORCH_OFF =
  /^\s*(?:(?:mach(?:e)?|schalt(?:e)?)\s+)?(?:die\s+)?(?:taschenlampe|handylicht|blitzlicht)\s+(?:aus|ab|deaktivieren)\s*[.!?]*$/i

const PAGE_WIFI =
  /\b(?:wlan|wifi|wi-fi)\b.+\b(?:einstell|öffne|zeig|aktivier|anstoß)|(?:öffne|zeig|aktivier|anstoß).+\b(?:wlan|wifi)\b|^\s*(?:wlan|wifi)\s+(?:an|ein|einstellungen)\s*[.!?]*$/i
const PAGE_BT =
  /\bbluetooth\b.+\b(?:einstell|öffne|zeig|aktivier|anstoß)|(?:öffne|zeig|aktivier|anstoß).+\bbluetooth\b|^\s*bluetooth\s+(?:an|ein|einstellungen)\s*[.!?]*$/i
const PAGE_DND =
  /\b(?:nicht\s+stören|störung(?:smodus)?|dnd)\b/i

const SYSTEM =
  /^\s*(?:stoß(?:e|en)?|anstoß(?:e|en)?)\s+(?:das\s+)?system|(?:system)\s+(?:anstoßen|aktivieren)\s*[.!?]*$/i

const CLOCK =
  /\b(?:wie\s+spät(?:\s+ist\s+(?:es|die\s+uhr))?|wie\s*viel\s+uhr(?:\s+es\s+ist)?|wie\s*viel\s+uhr\s+ist\s+es|welche\s+uhrzeit|wie\s+ist\s+(?:die\s+)?uhrzeit|weißt?\s+du(?:\s+denn)?\s+(?:wie\s+spät|wie\s*viel\s+uhr)|aktuelle(?:\s+)?uhrzeit)\b/i

const STEPS =
  /\b(?:wie\s+viele\s+schritte|schritte(?:\s+heute)?|schrittzähler)\b/i
const PRESSURE = /\b(?:luftdruck|barometer)\b/i
const COMPASS = /\b(?:kompass|himmelsrichtung|wo\s+ist\s+norden)\b/i

export function formatClockReply(now = new Date()): string {
  const time = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
  const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(now)
  const day = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1) : ''
  const clock = time.replace(/\s/g, '')
  return day ? `${day}, ${clock} Uhr.` : `Es ist ${clock} Uhr.`
}

export function parseDeviceIntent(text: string): DeviceIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (SKIP.test(t)) return null
  if (SYSTEM.test(t)) return { kind: 'ask' }
  if (TORCH_OFF.test(t)) return { kind: 'torch', on: false }
  if (TORCH_ON.test(t)) return { kind: 'torch', on: true }
  if (PAGE_WIFI.test(t)) return { kind: 'page', page: 'wifi' }
  if (PAGE_BT.test(t)) return { kind: 'page', page: 'bluetooth' }
  if (PAGE_DND.test(t) && /\b(?:nicht\s+stören|störung|dnd|öffne|zeig|aktivier)\b/i.test(t)) {
    return { kind: 'page', page: 'dnd' }
  }
  if (CLOCK.test(t)) return { kind: 'clock' }
  if (BATTERY.test(t)) return { kind: 'battery' }
  if (NETWORK.test(t)) return { kind: 'network' }
  if (STEPS.test(t)) return { kind: 'steps' }
  if (PRESSURE.test(t)) return { kind: 'pressure' }
  if (COMPASS.test(t)) return { kind: 'compass' }
  return null
}

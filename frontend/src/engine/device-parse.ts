import { normalizeUtterance } from './utterance.ts'

export type DevicePage = 'wifi' | 'bluetooth' | 'dnd'

export type DeviceIntent =
  | { kind: 'battery' }
  | { kind: 'network' }
  | { kind: 'torch'; on: boolean }
  | { kind: 'page'; page: DevicePage }
  | { kind: 'ask' }

const SKIP =
  /\b(notiz|todo|erinnerung|wecker|timer|fernseher|ventilator|lüfter|spotify|youtube|netflix)\b/i

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
  if (BATTERY.test(t)) return { kind: 'battery' }
  if (NETWORK.test(t)) return { kind: 'network' }
  return null
}

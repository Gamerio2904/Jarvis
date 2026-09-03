import { normalizeUtterance } from './utterance.ts'

export type DevicePage = 'wifi' | 'bluetooth' | 'dnd' | 'location' | 'sound' | 'display' | 'battery'

export type DeviceIntent =
  | { kind: 'clock' }
  | { kind: 'battery' }
  | { kind: 'network' }
  | { kind: 'torch'; on: boolean }
  | { kind: 'page'; page: DevicePage }
  | { kind: 'bt_list' }
  | { kind: 'volume'; dir: 'up' | 'down' }
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
const PAGE_LOCATION =
  /\b(?:standort|gps)\b.+\b(?:einstell|öffne|zeig)|(?:öffne|zeig).+\b(?:standort|gps)\b|^\s*standort\s+(?:an|ein|einstellungen)\s*[.!?]*$/i
const PAGE_SOUND =
  /\b(?:klingelton|ton\s*einstell|sound\s*settings)\b|(?:öffne|zeig).+\b(?:lautstärke[- ]?einstell|klingelton)\b/i
const PAGE_DISPLAY =
  /\b(?:display|helligkeit|bildschirmhell)\b.+\b(?:einstell|öffne)|(?:öffne|zeig).+\b(?:display|helligkeit)\b/i
const PAGE_BATTERY_SAVER =
  /\b(?:akku[- ]?einstell|batterie[- ]?spar)\b|(?:öffne|zeig).+\b(?:akku[- ]?einstell|energiespar)\b/i
const BT_LIST =
  /\b(?:bluetooth[- ]?geräte|gekoppelte\s+geräte|welche\s+geräte.{0,12}bluetooth|kopfhörer\s+verbinden|bt[- ]?geräte)\b/i
const PHONE_VOL_UP =
  /^\s*(?:handy|telefon|medien)\s+(?:lauter|hoch|plus)\s*[.!?]*$/i
const PHONE_VOL_DOWN =
  /^\s*(?:handy|telefon|medien)\s+(?:leiser|runter|minus)\s*[.!?]*$/i

const SYSTEM =
  /^\s*(?:stoß(?:e|en)?|anstoß(?:e|en)?)\s+(?:das\s+)?system|(?:system)\s+(?:anstoßen|aktivieren)\s*[.!?]*$/i

const CLOCK =
  /\b(?:wie\s+spät(?:\s+ist\s+(?:es|die\s+uhr))?|wie\s*viel\s+uhr(?:\s+es\s+ist)?|wie\s*viel\s+uhr\s+ist\s+es|welche\s+uhrzeit|wie\s+ist\s+(?:die\s+)?uhrzeit|weißt?\s+du(?:\s+denn)?\s+(?:wie\s+spät|wie\s*viel\s+uhr)|aktuelle(?:\s+)?uhrzeit)\b/i

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
  if (BT_LIST.test(t)) return { kind: 'bt_list' }
  if (PHONE_VOL_UP.test(t)) return { kind: 'volume', dir: 'up' }
  if (PHONE_VOL_DOWN.test(t)) return { kind: 'volume', dir: 'down' }
  if (PAGE_WIFI.test(t)) return { kind: 'page', page: 'wifi' }
  if (PAGE_BT.test(t)) return { kind: 'page', page: 'bluetooth' }
  if (PAGE_LOCATION.test(t)) return { kind: 'page', page: 'location' }
  if (PAGE_SOUND.test(t)) return { kind: 'page', page: 'sound' }
  if (PAGE_DISPLAY.test(t)) return { kind: 'page', page: 'display' }
  if (PAGE_BATTERY_SAVER.test(t)) return { kind: 'page', page: 'battery' }
  if (PAGE_DND.test(t) && /\b(?:nicht\s+stören|störung|dnd|öffne|zeig|aktivier)\b/i.test(t)) {
    return { kind: 'page', page: 'dnd' }
  }
  if (CLOCK.test(t)) return { kind: 'clock' }
  if (BATTERY.test(t)) return { kind: 'battery' }
  if (NETWORK.test(t)) return { kind: 'network' }
  return null
}

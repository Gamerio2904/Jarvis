import { normalizeUtterance } from './utterance.ts'

export type TabletIntent =
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'show_image' }
  | { kind: 'show_weather' }
  | { kind: 'show_status' }

const ON =
  /^\s*(?:aktivier(?:e)?|start(?:e)?|öffne[n]?|zeig(?:e)?)\s+(?:den\s+|das\s+)?(?:fullscreen|vollbild|tablet(?:\s*modus)?|kiosk)\s*[.!?]*$/i
const ON2 =
  /^\s*(?:fullscreen|vollbild|tablet(?:\s*modus)?|kiosk)\s+(?:an|aktivieren|starten|öffnen)\s*[.!?]*$/i
const BARE_ON = /^\s*(?:fullscreen|vollbild|tablet(?:\s*modus)?)\s*[.!?]*$/i
const OFF =
  /^\s*(?:deaktivier(?:e)?|beend(?:e)?|schließ(?:e)?)\s+(?:den\s+|das\s+)?(?:fullscreen|vollbild|tablet(?:\s*modus)?|kiosk)|(?:fullscreen|vollbild|tablet(?:\s*modus)?|kiosk)\s+aus\s*[.!?]*$/i
const SHOW_IMAGE =
  /^\s*(?:zeig(?:e)?|öffne)\s+(?:mir\s+)?(?:das\s+)?(?:letzte\s+)?(?:bild|foto|aufnahme)(?:\s+(?:nochmal|an|auf))?\s*[.!?]*$/i
const SHOW_WEATHER =
  /^\s*(?:zeig(?:e)?|öffne)\s+(?:mir\s+)?(?:das\s+)?wetter(?:\s+an)?\s*[.!?]*$/i
const SHOW_STATUS =
  /^\s*(?:zeig(?:e)?|öffne)\s+(?:mir\s+)?(?:den\s+)?(?:status|stand|zustand)\s*[.!?]*$/i

export function parseTabletIntent(text: string, inMode = false): TabletIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (OFF.test(t)) return { kind: 'off' }
  if (SHOW_IMAGE.test(t)) return { kind: 'show_image' }
  if (SHOW_WEATHER.test(t)) return { kind: 'show_weather' }
  if (SHOW_STATUS.test(t)) return { kind: 'show_status' }
  if (ON.test(t) || ON2.test(t) || (inMode && BARE_ON.test(t))) return { kind: 'on' }
  if (BARE_ON.test(t)) return { kind: 'on' }
  return null
}

export function isNameOnly(text: string): boolean {
  return /^\s*(?:(?:hey|hallo|hi|ok(?:ay)?|so)\s+)?(?:jarvis|service)\s*[.!?]*$/i.test(text.trim())
}

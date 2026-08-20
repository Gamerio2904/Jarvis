import { isGeminiConfigured, loadSettings } from './store'

export const OFFLINE_NET =
  'Kein Netz. Timer, Merken, Kalender, Einkauf gehen lokal. Wetter, Suche, Karte und Foto brauchen Verbindung.'
export const NO_MODEL =
  'Modell nicht geladen. Unter Einstellungen → Modell laden (0.5B) oder unter Cloud Gemini einschalten.'
export const NO_KEY =
  'Gemini an, aber kein API-Key. Unter Einstellungen → APIs eintragen — oder Gemini aus und lokal laden.'
export const NO_GEMINI_VOICE =
  'Befehl nicht erkannt. Smalltalk im Sprachmodus braucht Gemini. Wetter, Timer, Route, Einkauf gehen ohne.'

export type BlockedReason = 'ok' | 'offline' | 'no_model' | 'no_key'

export function isOnline(): boolean {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  } catch {
    /* ignore */
  }
  return true
}

export function blockedReason(localReady: boolean): BlockedReason {
  const s = loadSettings()
  const cloud = isGeminiConfigured()
  if (s.gemini_enabled && !s.gemini_api_key.trim()) return 'no_key'
  if (cloud || localReady) return 'ok'
  return 'no_model'
}

export function blockedCopy(reason: BlockedReason, online = isOnline()): string {
  if (!online) return OFFLINE_NET
  if (reason === 'no_key') return NO_KEY
  if (reason === 'no_model') return NO_MODEL
  return ''
}

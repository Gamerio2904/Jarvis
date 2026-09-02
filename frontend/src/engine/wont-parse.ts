import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'
import { gazetteerHit, type PlaceFix } from './globe-geo.ts'
import { CITY_FLY_ZOOM } from './globe-gibs.ts'
import { saveSettings } from './store.ts'

export type WontReason =
  | 'captcha'
  | 'banking'
  | 'agent'
  | 'phone_ground'
  | 'street'
  | 'live_sat'
  | 'watch'
  | 'mail'
  | 'emergency'
  | 'paint'
  | 'app'
  | 'food_order'
  | 'photo'
  | 'need_place'
  | 'foreign_wake'

export type WontIntent = { reason: WontReason }

export const WONT_LABEL = 'Geht nicht'

const REPLY: Record<WontReason, string> = {
  captcha: 'Captchas klicke ich nicht. Kein Bypass.',
  banking: 'Banking und Überweisungen mache ich nicht.',
  agent:
    'Autonomen Computer-Use mit mehreren Schritten mache ich nicht. Ein sichtbarer GUI-Schritt, dann Ja — nicht drei hintereinander.',
  phone_ground:
    'LocateAnything liegt auf dem PC, nicht im Handy. Am Telefon: Foto-Knopf, kein GUI-Klick auf Speichern.',
  street: 'Street View habe ich nicht. Nur die Kugel mit Lexikon-Orten, kein Straßenblick.',
  live_sat: 'Live-Satellitenvideo gibt es nicht. Die Kugel zeigt Standbilder, oft Stunden alt.',
  watch: 'Leute beobachte ich nicht. Keine Überwachung.',
  mail: 'E-Mail schreibe ich nicht. SMS nach Nachfrage, wenn ein Kontakt da ist.',
  emergency: 'Notruf und 112 starte ich nicht. Bei Not: selbst wählen.',
  paint: 'Bilder male ich nicht. Kein Generator, kein Clipart.',
  app: 'Fremde Apps wie Instagram öffne ich nicht.',
  food_order: 'Essen bestelle ich nicht. Kein Lieferdienst.',
  photo: 'Foto macht der Kamera-Knopf, kein Sprachbefehl.',
  need_place: 'Welche Stadt soll ich auf der Kugel zeigen?',
  foreign_wake: 'Das klang nach einem anderen Assistenten. Timer und Wecker starte ich so nicht still. Nochmal ohne Ok Google / Siri / Alexa.',
}

export function parseWontIntent(text: string): WontIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 220) return null
  if (/\bcaptcha\b/i.test(t) && /\b(klick|click|löse|loese|bypass|umgeh)\b/i.test(t)) {
    return { reason: 'captcha' }
  }
  if (
    /(?:^|[^A-Za-z])(?:banking|online[- ]?banking|überweis(?:e|ung)|ueberweis(?:e|ung)|iban)(?:[^A-Za-z]|$)/i.test(
      t,
    )
  ) {
    return { reason: 'banking' }
  }
  if (
    /\b(computer[- ]?use|computer\s+benutzen|autonomen?\s+agent)\b/i.test(t) &&
    /\b(dann|erst|danach|gmail|senden)\b/i.test(t)
  ) {
    return { reason: 'agent' }
  }
  if (
    /\b(speichern|start|ok|button)\b/i.test(t) &&
    /\b(handy|smartphone|telefon)\b/i.test(t) &&
    !/\b(?:am\s+)?(?:pc|rechner|computer|desktop)\b/i.test(t)
  ) {
    return { reason: 'phone_ground' }
  }
  if (/\bstreet\s*view\b/i.test(t)) return { reason: 'street' }
  if (/\b(live[- ]?satellit(?:en)?(?:video|bild)?|live[- ]?erde)\b/i.test(t)) return { reason: 'live_sat' }
  if (/\bbeobacht(?:e|en)?\b/i.test(t) && /\b(leute|menschen|personen|straße|strasse)\b/i.test(t)) {
    return { reason: 'watch' }
  }
  if (/\b(e-?mails?|emails?)\b/i.test(t) && /\b(schreib|sende|verfass|öffne)\b/i.test(t)) {
    return { reason: 'mail' }
  }
  if (/^\s*(?:notruf|ruf(?:e)?\s*(?:den\s+)?(?:notruf|112)|112\s+anrufen)\s*[.!?]*$/i.test(t)) {
    return { reason: 'emergency' }
  }
  if (/\b112\b/.test(t) && /\b(ruf|anruf|notruf|wahl|wähl)\b/i.test(t)) return { reason: 'emergency' }
  if (
    /\b(bilder?\s+malen|zeichnen|generiere?\s+(?:ein\s+)?bild|mach(?:e)?\s+ein\s+bild)\b/i.test(t) ||
    /^\s*(?:kannst\s+du\s+)?(?:bilder?\s+malen|eine\s+katze\s+zeichnen)/i.test(t)
  ) {
    return { reason: 'paint' }
  }
  if (/^\s*(?:öffne[n]?|start(?:e)?)\s+(?:instagram|tiktok|facebook|snapchat)\b/i.test(t)) {
    return { reason: 'app' }
  }
  if (/\b(bestell(?:e)?|order)\b/i.test(t) && /\b(pizza|essen|liefer(?:ando|dienst)|doordash)\b/i.test(t)) {
    return { reason: 'food_order' }
  }
  if (/^\s*(?:mach(?:e)?|nimm)\s+(?:ein\s+)?(?:foto|bild)\s*[.!?]*$/i.test(t)) return { reason: 'photo' }
  if (/^\s*zeig(?:e)?(?:\s+(?:mir|uns))?\s*$/i.test(t)) return { reason: 'need_place' }
  if (
    /^(?:ok(?:ay)?\s+google|hey\s+siri|alexa)\b/i.test(t) &&
    /\b(timer|wecker|erinner(?:e|ung)?)\b/i.test(t)
  ) {
    return { reason: 'foreign_wake' }
  }
  return null
}

/** Gazetteer after stripping Street-View-Füllwörter — „Zeig Street View von London“ → London. */
export function streetViewPlace(text: string): PlaceFix | null {
  const stripped = (text || '')
    .replace(/\bstreet\s*view\b/gi, ' ')
    .replace(/\bstraßen(?:blick|ansicht)\b/gi, ' ')
    .replace(/\bstrassen(?:blick|ansicht)\b/gi, ' ')
    .replace(/\bzeig(?:e)?(?:\s+(?:mir|uns))?\b/gi, ' ')
    .replace(/\bvon\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return gazetteerHit(stripped)
}

function flyGlobe(place: PlaceFix): void {
  try {
    const focus = JSON.stringify({ name: place.name, lat: place.lat, lon: place.lon, zoom: CITY_FLY_ZOOM })
    saveSettings({
      hud_view: 'globe',
      hud_force: true,
      hud_hidden: false,
      last_globe_focus: focus,
      last_globe_look: JSON.stringify({ lat: place.lat, lon: place.lon, zoom: CITY_FLY_ZOOM }),
    })
  } catch {
    /* localStorage fehlt in manchen Tests */
  }
}

export function handleWont(
  text: string,
): { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string } {
  const intent = parseWontIntent(text)
  if (!intent) return { handled: false }
  let reply = REPLY[intent.reason]
  if (intent.reason === 'street') {
    const hit = streetViewPlace(text)
    if (hit) {
      flyGlobe(hit)
      reply = `${hit.name} steht auf der Kugel. Street View habe ich nicht — nur Lexikon-Orte, kein Straßenblick.`
    }
  }
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'wont', action: intent.reason, label: WONT_LABEL },
    lastTool: 'wont',
  }
}

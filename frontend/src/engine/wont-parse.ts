import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

export type WontReason = 'captcha' | 'banking' | 'agent' | 'phone_ground'

export type WontIntent = { reason: WontReason }

const REPLY: Record<WontReason, string> = {
  captcha: 'Captchas klicke ich nicht. Kein Bypass.',
  banking: 'Banking und Überweisungen mache ich nicht.',
  agent:
    'Autonomen Computer-Use mit mehreren Schritten mache ich nicht. Ein sichtbarer GUI-Schritt, dann Ja — nicht drei hintereinander.',
  phone_ground:
    'LocateAnything liegt auf dem PC, nicht im Handy. Am Telefon: Foto-Knopf, kein GUI-Klick auf Speichern.',
}

export function parseWontIntent(text: string): WontIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 220) return null
  if (/\bcaptcha\b/i.test(t) && /\b(klick|click|löse|loese|bypass|umgeh)\b/i.test(t)) {
    return { reason: 'captcha' }
  }
  if (/\b(banking|online[- ]?banking|überweis(?:e|ung)|ueberweis(?:e|ung)|iban)\b/i.test(t)) {
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
  return null
}

export function handleWont(
  text: string,
): { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string } {
  const intent = parseWontIntent(text)
  if (!intent) return { handled: false }
  return {
    handled: true,
    reply: REPLY[intent.reason],
    tool: { tool_status: 'executed', tool: 'wont', action: intent.reason, label: 'Won’t' },
    lastTool: 'wont',
  }
}

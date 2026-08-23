import { normalizeUtterance } from './utterance.ts'

export type SpeakMode = 'only' | 'then'

export function briefSpeak(text: string, max = 96): string {
  const raw = (text || '').replace(/\s+/g, ' ').trim()
  if (!raw) return raw
  const first = raw.split(/(?<=[.!?])\s+/)[0] || raw
  if (first.length <= max) return first
  const cut = first.slice(0, max).replace(/\s+\S*$/, '').trim()
  return cut ? `${cut}.` : first.slice(0, max)
}

export function parseSpeakMode(text: string): SpeakMode | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (/^\s*(?:nur\s+vorlesen|nur\s+sprechen|bloß\s+vorlesen)\s*[.!?]*$/i.test(t)) return 'only'
  if (
    /^\s*(?:erst\s+(?:ausführen|tun|machen)(?:\s+dann\s+(?:antworten\s+)?vorlesen)?|ausführlich\s+vorlesen|auch\s+den\s+text)\s*[.!?]*$/i.test(
      t,
    )
  ) {
    return 'then'
  }
  return null
}

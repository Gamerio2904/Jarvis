import { groqReady } from './groq.ts'
import { loadSettings } from './store.ts'
import { turnLooksComplete } from './turn-detect.ts'

/** Zweite STT-Bahn. Lane-1 bleibt Android/Google. Kein Pflicht-Upload. */
export const GROQ_STT_MODEL = 'whisper-large-v3-turbo'
export const GROQ_STT_TIMEOUT_MS = 1500
export const WHISPER_VOCAB =
  'Fernseher Watchliste Körper Lage Timer Kalender Wetter Steckdose Taschenlampe Overlay Jarvis Friday Fahrmodus'

export type GroqSttNeed = {
  groqReady: boolean
  googleText: string
  repaired: boolean
  closed: boolean
}

/** Nur bei Repair oder unsicherem/leerem Google-Text — nicht bei klarem Closed-Command. */
export function shouldUseGroqStt(need: GroqSttNeed): boolean {
  if (!need.groqReady) return false
  if (need.repaired) return true
  const empty = !need.googleText.trim()
  if (empty) return true
  if (!need.closed) return true
  return false
}

export function shouldUseGroqSttFor(googleText: string, repairedText: string): boolean {
  return shouldUseGroqStt({
    groqReady: groqReady(),
    googleText,
    repaired: Boolean(repairedText) && repairedText !== googleText,
    closed: turnLooksComplete(repairedText || googleText),
  })
}

export type GroqSttIo = {
  fetch: typeof fetch
  key?: string
  timeoutMs?: number
}

export async function transcribeGroqWhisper(audio: Blob, io: GroqSttIo): Promise<string | null> {
  const key = (io.key || loadSettings().groq_api_key || '').trim()
  if (!key || !audio || audio.size < 8) return null
  const timeoutMs = io.timeoutMs ?? GROQ_STT_TIMEOUT_MS
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const body = new FormData()
    body.append('file', audio, 'heard.webm')
    body.append('model', GROQ_STT_MODEL)
    body.append('language', 'de')
    body.append('prompt', WHISPER_VOCAB)
    const res = await io.fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body,
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const json = (await res.json()) as { text?: string }
    const text = String(json.text || '').replace(/\s+/g, ' ').trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Google-Text bleibt, wenn kein Audio, kein Key oder Groq tot/timeout. */
export async function refineHeard(opts: {
  googleText: string
  repairedText: string
  audio?: Blob | null
  io?: GroqSttIo
}): Promise<string> {
  const google = (opts.repairedText || opts.googleText || '').trim()
  if (!opts.audio || !opts.io) return google
  if (!shouldUseGroqSttFor(opts.googleText, opts.repairedText)) return google
  const hit = await transcribeGroqWhisper(opts.audio, opts.io)
  return hit || google
}

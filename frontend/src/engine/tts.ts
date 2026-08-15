import { postJson } from './http-json'
import { isGeminiConfigured, loadSettings, saveSettings } from './store'

const TTS_MODELS = [
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
]

export function wantGeminiVoice(): boolean {
  const s = loadSettings()
  if (s.voice_tts === 'system') return false
  if (s.voice_tts === 'gemini') return isGeminiConfigured()
  return isGeminiConfigured()
}

function spokenForGemini(text: string): string {
  const body = text
    .replace(/[`#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800)
  if (!body) return ''
  return (
    'Say in warm, conversational German, slightly brisk, with natural emphasis on key words. ' +
    'Not monotone, not theatrical. Read only the following text, add nothing: ' +
    body
  )
}

export async function synthesizeGemini(text: string): Promise<Blob | null> {
  const key = loadSettings().gemini_api_key.trim()
  if (!key) return null
  const spoken = spokenForGemini(text)
  if (!spoken) return null
  let last = ''
  const cached = loadSettings().gemini_tts_model
  const models = cached ? [cached, ...TTS_MODELS.filter((m) => m !== cached)] : TTS_MODELS
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const { status, json } = await postJson(
        url,
        { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        {
          contents: [{ parts: [{ text: spoken }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              languageCode: 'de-DE',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        },
      )
      if (status === 404 || isUnknownModel(json)) {
        last = 'Modell fehlt'
        continue
      }
      if (status < 200 || status >= 300) {
        last = errorMessage(json) || `HTTP ${status}`
        if (status === 429 || status >= 500) continue
        break
      }
      const blob = audioFrom(json)
      if (blob) {
        saveSettings({ gemini_tts_model: model })
        return blob
      }
      last = 'Keine Audiodaten'
    } catch (err) {
      last = err instanceof Error ? err.message : 'TTS fehlgeschlagen'
    }
  }
  if (last) console.warn('[tts]', last)
  return null
}

function isUnknownModel(json: Record<string, unknown>): boolean {
  const err = json.error as { message?: string; status?: string } | undefined
  const msg = `${err?.message || ''} ${err?.status || ''}`.toLowerCase()
  return msg.includes('not found') || msg.includes('unknown') || msg.includes('not supported')
}

function errorMessage(json: Record<string, unknown>): string {
  const err = json.error as { message?: string } | undefined
  return err?.message || ''
}

function audioFrom(json: Record<string, unknown>): Blob | null {
  const cand = (json.candidates as Array<Record<string, unknown>> | undefined)?.[0]
  const parts = ((cand?.content as Record<string, unknown> | undefined)?.parts || []) as Array<
    Record<string, unknown>
  >
  for (const part of parts) {
    const inline = (part.inlineData || part.inline_data) as
      | { data?: string; mimeType?: string; mime_type?: string }
      | undefined
    if (!inline?.data) continue
    const mime = inline.mimeType || inline.mime_type || 'audio/wav'
    const raw = base64ToBytes(inline.data)
    if (!raw.length) continue
    if (mime.includes('wav') || mime.includes('mpeg') || mime.includes('mp3')) {
      return new Blob([copyBuf(raw)], { type: mime.includes('mp') ? 'audio/mpeg' : 'audio/wav' })
    }
    const rate = rateFromMime(mime)
    return pcm16ToWav(raw, rate)
  }
  return null
}

function rateFromMime(mime: string): number {
  const m = /rate=(\d+)/i.exec(mime)
  return m ? Number(m[1]) : 24000
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function pcm16ToWav(pcm: Uint8Array, sampleRate: number): Blob {
  const header = new ArrayBuffer(44)
  const view = new DataView(header)
  const size = pcm.byteLength
  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + size, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, size, true)
  return new Blob([header, copyBuf(pcm)], { type: 'audio/wav' })
}

function copyBuf(u: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u.byteLength)
  new Uint8Array(out).set(u)
  return out
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
}

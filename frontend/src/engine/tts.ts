import { postJson } from './http-json.ts'
import { markSkip, parseSkipMap } from './cloud-errors.ts'
import { isGeminiConfigured, loadSettings, saveSettings } from './store.ts'

const TTS_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-pro-preview-tts',
]

/** Male default after 4.34 spike. Charon lost the 500 ms race too often. One voice, no carousel. */
export const TTS_VOICE = 'Algieba'
export const TTS_VOICE_FRIDAY = 'Kore'
export const TTS_VOICES = ['Algieba', 'Kore', 'Charon', 'Puck', 'Fenrir', 'Orus', 'Aoede', 'Zephyr'] as const

/** Standing: wait for Gemini. Driving: short cap so Native wins. */
export const TTS_BUDGET_STANDING_MS = 3500
export const TTS_BUDGET_DRIVE_MS = 700
export const TTS_NATIVE_RACE_DRIVE_MS = 400
/** @deprecated use ttsBudgetMs() — kept so old imports do not break. */
export const TTS_BUDGET_MS = TTS_BUDGET_STANDING_MS
/** Standing: 0 = do not race Native. Driving uses TTS_NATIVE_RACE_DRIVE_MS. */
export const TTS_NATIVE_RACE_MS = 0

export function ttsVoiceName(face?: string): string {
  const s = loadSettings()
  const who = (face || s.face || 'jarvis').toLowerCase()
  if (who === 'friday') return (s.tts_voice_friday || '').trim() || TTS_VOICE_FRIDAY
  return (s.gemini_tts_voice || s.tts_voice_jarvis || '').trim() || TTS_VOICE
}

export function ttsBudgetMs(inDrive = loadSettings().drive_mode): number {
  return inDrive ? TTS_BUDGET_DRIVE_MS : TTS_BUDGET_STANDING_MS
}

export function ttsNativeRaceMs(inDrive = loadSettings().drive_mode): number {
  if (!inDrive) return 0
  return TTS_NATIVE_RACE_DRIVE_MS
}

export function wantGeminiVoice(): boolean {
  const s = loadSettings()
  if (s.voice_tts === 'system') return false
  if (s.voice_tts === 'gemini') return isGeminiConfigured()
  return isGeminiConfigured()
}

function spokenForGemini(text: string): string {
  const body = text
    .replace(/[`#*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 420)
  if (!body) return ''
  return `Calm, low German, precise, slightly dry. Not theatrical. Read only: ${body}`
}

export function ttsModelsToTry(cached?: string, skipRaw?: string): string[] {
  const skip = parseSkipMap(skipRaw)
  const first = cached && TTS_MODELS.includes(cached) ? cached : TTS_MODELS[0]
  const rest = TTS_MODELS.filter((m) => m !== first)
  const ordered = [first, ...rest]
  const ready = ordered.filter((m) => !skip[m])
  const later = ordered.filter((m) => skip[m])
  return [...ready, ...later].slice(0, 3)
}

/** Standing: Gemini first, no Native-Race. Drive: kurzes Race bleibt. */
export function ttsGeminiPrimary(inDrive = loadSettings().drive_mode): boolean {
  return ttsNativeRaceMs(inDrive) === 0
}

export async function synthesizeGemini(text: string): Promise<Blob | null> {
  const key = loadSettings().gemini_api_key.trim()
  if (!key) return null
  const spoken = spokenForGemini(text)
  if (!spoken) return null
  const started = Date.now()
  const budget = ttsBudgetMs()
  const voice = ttsVoiceName()
  let skipRaw = loadSettings().gemini_tts_skip_until
  for (const model of ttsModelsToTry(loadSettings().gemini_tts_model, skipRaw)) {
    const left = budget - (Date.now() - started)
    if (left < 200) break
    const hit = await tryTts(model, voice, spoken, left)
    if (hit.blob) {
      saveSettings({ gemini_tts_model: model })
      return hit.blob
    }
    if (hit.skip) {
      skipRaw = markSkip(skipRaw, model)
      saveSettings({ gemini_tts_skip_until: skipRaw })
    }
  }
  return null
}

async function tryTts(
  model: string,
  voice: string,
  spoken: string,
  timeoutMs: number,
): Promise<{ blob: Blob | null; skip: boolean }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const { status, json } = await postJson(
      url,
      { 'Content-Type': 'application/json', 'x-goog-api-key': loadSettings().gemini_api_key.trim() },
      {
        contents: [{ parts: [{ text: spoken }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: 'de-DE',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      },
      timeoutMs,
    )
    if (status === 404 || isUnknownModel(json)) return { blob: null, skip: true }
    if (status === 429 || status === 503) return { blob: null, skip: true }
    if (status < 200 || status >= 300) return { blob: null, skip: false }
    const blob = audioFrom(json)
    return { blob, skip: false }
  } catch {
    return { blob: null, skip: false }
  }
}

function isUnknownModel(json: Record<string, unknown>): boolean {
  const err = json.error as { message?: string; status?: string } | undefined
  const msg = `${err?.message || ''} ${err?.status || ''}`.toLowerCase()
  return msg.includes('not found') || msg.includes('unknown') || msg.includes('not supported')
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

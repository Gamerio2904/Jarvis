import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { GEMINI_PERSONA } from './persona'
import { isGeminiConfigured, loadSettings, saveSettings } from './store'

export const GEMINI_LABEL = 'Gemini Flash (Google)'

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
]

type GeminiPart = { text?: string }
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

function apiKey(): string {
  return loadSettings().gemini_api_key.trim()
}

export function geminiReady(): boolean {
  return isGeminiConfigured()
}

function explainHttp(status: number, message: string): string {
  const m = message.toLowerCase()
  if (status === 401 || status === 403 || m.includes('api key') || m.includes('invalid')) {
    return 'Gemini-Key ungültig. In Google AI Studio einen neuen Key holen.'
  }
  if (status === 429 || m.includes('quota') || m.includes('resource_exhausted')) {
    return 'Gemini-Kontingent leer. Später erneut oder in AI Studio prüfen.'
  }
  if (status === 404 || m.includes('not found')) {
    return 'Gemini-Modell nicht gefunden. App-Update oder anderes Modell.'
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('timeout')) {
    return 'Keine Verbindung zu Google. WLAN prüfen.'
  }
  return message || `Gemini-Fehler (${status || '?'}).`
}

async function postGemini(model: string, body: unknown): Promise<{ status: number; json: GeminiResponse }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const key = apiKey()
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.post({
      url,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      data: body,
      connectTimeout: 15_000,
      readTimeout: 60_000,
    })
    let json: GeminiResponse = {}
    try {
      json = (typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data || {}) as GeminiResponse
    } catch {
      json = { error: { message: String(res.data || 'Ungültige Antwort') } }
    }
    return { status: res.status, json }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as GeminiResponse
  return { status: res.status, json }
}

function textFrom(json: GeminiResponse): string {
  const parts = json.candidates?.[0]?.content?.parts || []
  return parts
    .map((p) => p.text || '')
    .join('')
    .trim()
}

function modelList(): string[] {
  const preferred = loadSettings().gemini_model.trim()
  const rest = MODELS.filter((m) => m !== preferred)
  return preferred ? [preferred, ...rest] : [...MODELS]
}

function buildBody(model: string, messages: Array<{ role: string; content: string }>) {
  const system = messages.find((m) => m.role === 'system')?.content || GEMINI_PERSONA
  const turns = messages.filter((m) => m.role !== 'system')
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  for (const t of turns) {
    const role = t.role === 'assistant' ? 'model' : 'user'
    const text = t.content.trim()
    if (!text) continue
    const last = contents[contents.length - 1]
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`
    } else {
      contents.push({ role, parts: [{ text }] })
    }
  }
  if (!contents.length || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hallo.' }] })
  }
  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: 512,
  }
  if (model.includes('2.5')) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }
  return {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig,
  }
}

export async function completeGemini(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!geminiReady()) {
    throw new Error('Gemini ist aus oder ohne Key. Unter Einstellungen eintragen.')
  }
  let last = 'Gemini antwortet nicht.'
  for (const model of modelList()) {
    try {
      const { status, json } = await postGemini(model, buildBody(model, messages))
      if (status === 404 || status === 400) {
        last = explainHttp(status, json.error?.message || '')
        continue
      }
      if (status < 200 || status >= 300 || json.error) {
        throw new Error(explainHttp(status, json.error?.message || ''))
      }
      if (json.promptFeedback?.blockReason) {
        throw new Error('Google hat die Antwort blockiert.')
      }
      const text = textFrom(json)
      if (!text) {
        last = 'Gemini lieferte keinen Text.'
        continue
      }
      saveSettings({ gemini_model: model })
      onToken?.(text, text)
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('nicht gefunden') || msg.toLowerCase().includes('not found')) {
        last = msg
        continue
      }
      throw err instanceof Error ? err : new Error(explainHttp(0, msg))
    }
  }
  throw new Error(last)
}

export async function testGemini(): Promise<{ ok: boolean; reply: string }> {
  if (!loadSettings().gemini_api_key.trim()) {
    return { ok: false, reply: 'Kein API-Key. In Google AI Studio erzeugen und hier eintragen.' }
  }
  if (!loadSettings().gemini_enabled) {
    return { ok: false, reply: 'Gemini ist aus. Zuerst den Schalter an.' }
  }
  try {
    const text = await completeGemini([
      { role: 'system', content: GEMINI_PERSONA },
      { role: 'user', content: 'Antworten Sie mit genau einem Wort: Bereit.' },
    ])
    return { ok: true, reply: text || 'Verbunden.' }
  } catch (err) {
    return { ok: false, reply: err instanceof Error ? err.message : 'Test fehlgeschlagen' }
  }
}

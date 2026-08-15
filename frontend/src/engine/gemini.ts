import {
  germanAuthError,
  germanNetworkError,
  germanQuotaHint,
  geminiModelOrder,
  isFatalAuth,
  isRetryableCloud,
  isUnknownModel,
  markSkip,
  userFacingCloudError,
} from './cloud-errors'
import { completeGroq, groqReady } from './groq'
import { postJson } from './http-json'
import { GEMINI_PERSONA } from './persona'
import { isGeminiConfigured, loadSettings, saveSettings } from './store'

export const GEMINI_LABEL = 'Gemini Flash (Google)'

type GeminiPart = { text?: string }
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

const missingModels = new Set<string>()

function apiKey(): string {
  return loadSettings().gemini_api_key.trim()
}

export function geminiReady(): boolean {
  return isGeminiConfigured()
}

function errorFields(json: GeminiResponse): { message: string; status: string } {
  return {
    message: json.error?.message || '',
    status: json.error?.status || '',
  }
}

async function postGemini(model: string, body: unknown): Promise<{ status: number; json: GeminiResponse }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const { status, json } = await postJson(
    url,
    {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey(),
    },
    body,
  )
  return { status, json: json as GeminiResponse }
}

function textFrom(json: GeminiResponse): string {
  const parts = json.candidates?.[0]?.content?.parts || []
  return parts
    .map((p) => p.text || '')
    .join('')
    .trim()
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
  if (/2\.5|3\./.test(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }
  return {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig,
  }
}

function rememberSkip(model: string) {
  const s = loadSettings()
  saveSettings({ gemini_skip_until: markSkip(s.gemini_skip_until, model) })
}

export async function completeGemini(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  if (!geminiReady()) {
    throw new Error('Gemini ist aus oder ohne Key. Unter Einstellungen eintragen.')
  }
  const groqOn = groqReady()
  let last = germanQuotaHint(groqOn)
  for (const model of geminiModelOrder(loadSettings().gemini_skip_until, missingModels)) {
    try {
      const { status, json } = await postGemini(model, buildBody(model, messages))
      const { message, status: errStatus } = errorFields(json)
      if (isFatalAuth(status, message, errStatus)) {
        throw new Error(germanAuthError())
      }
      if (isUnknownModel(status, message, errStatus) || status === 400) {
        missingModels.add(model)
        last = 'Gemini-Modell nicht verfügbar, nächstes wird versucht.'
        continue
      }
      if (isRetryableCloud(status, message, errStatus) || status < 200 || status >= 300 || json.error) {
        rememberSkip(model)
        last = germanQuotaHint(groqOn)
        continue
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
      if (msg === germanAuthError() || msg.includes('blockiert')) {
        throw err instanceof Error ? err : new Error(msg)
      }
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        last = germanNetworkError()
        continue
      }
      last = userFacingCloudError(msg, groqOn)
    }
  }
  if (groqOn) {
    try {
      return await completeGroq(messages, onToken)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('ungültig')) throw new Error(msg)
      throw new Error(germanQuotaHint(true))
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
    const via = loadSettings().gemini_model.startsWith('gemini')
      ? loadSettings().gemini_model
      : groqReady()
        ? 'Groq-Fallback'
        : 'Cloud'
    return { ok: true, reply: `${text || 'Verbunden.'} (${via})` }
  } catch (err) {
    return {
      ok: false,
      reply: userFacingCloudError(
        err instanceof Error ? err.message : 'Test fehlgeschlagen',
        groqReady(),
      ),
    }
  }
}

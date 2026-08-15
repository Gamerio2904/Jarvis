import type { ResearchMeta, ResearchSource } from './research-parse'
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

export type CloudComplete = {
  text: string
  research?: ResearchMeta
}

type GeminiPart = { text?: string }
type GroundingChunk = { web?: { uri?: string; title?: string } }
type GroundingMetadata = {
  webSearchQueries?: string[]
  groundingChunks?: GroundingChunk[]
}
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
    groundingMetadata?: GroundingMetadata
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

function researchFrom(json: GeminiResponse): ResearchMeta | undefined {
  const g = json.candidates?.[0]?.groundingMetadata
  if (!g) return undefined
  const now = new Date().toISOString()
  const sources: ResearchSource[] = (g.groundingChunks || [])
    .map((c) => ({
      title: c.web?.title || 'Quelle',
      url: c.web?.uri || '',
      snippet: '',
      provider: 'google_search',
      retrieved_at: now,
    }))
    .filter((s) => s.url)
  const query = (g.webSearchQueries || []).filter(Boolean)[0]
  if (!sources.length && !query) return undefined
  return {
    used: sources.length > 0,
    status: sources.length ? 'ok' : 'empty',
    status_label: sources.length ? 'Research' : 'Keine Quellen',
    badge: sources.length ? 'Research' : undefined,
    query,
    sources,
    network_attempted: true,
    privacy_note: 'Nur die Suchanfrage ging zu Google, nicht der ganze Chatverlauf extra.',
  }
}

function buildBody(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { search?: boolean; thinking?: boolean } = {},
) {
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
    temperature: 0.55,
    maxOutputTokens: 640,
  }
  const thinking = opts.thinking !== false && /2\.5|3\./.test(model) && !opts.search
  if (thinking) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 }
  }
  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig,
  }
  if (opts.search) {
    body.tools = [{ google_search: {} }]
  }
  return body
}

function rememberSkip(model: string) {
  const s = loadSettings()
  saveSettings({ gemini_skip_until: markSkip(s.gemini_skip_until, model) })
}

export async function completeGemini(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
  opts?: { search?: boolean },
): Promise<CloudComplete> {
  if (!geminiReady()) {
    throw new Error('Gemini ist aus oder ohne Key. Unter Einstellungen eintragen.')
  }
  const groqOn = groqReady()
  let last = germanQuotaHint(groqOn)
  const wantSearch = Boolean(opts?.search)
  for (const model of geminiModelOrder(loadSettings().gemini_skip_until, missingModels)) {
    const attempts = wantSearch
      ? [
          buildBody(model, messages, { search: true, thinking: false }),
          buildBody(model, messages, { search: false, thinking: true }),
        ]
      : [buildBody(model, messages, { search: false, thinking: true })]
    let modelRetryable = false
    try {
      for (let i = 0; i < attempts.length; i += 1) {
        const { status, json } = await postGemini(model, attempts[i])
        const { message, status: errStatus } = errorFields(json)
        if (isFatalAuth(status, message, errStatus)) {
          throw new Error(germanAuthError())
        }
        if (isUnknownModel(status, message, errStatus)) {
          missingModels.add(model)
          last = 'Gemini-Modell nicht verfügbar, nächstes wird versucht.'
          break
        }
        if (status === 400 && i < attempts.length - 1) {
          last = 'Suche an diesem Modell nicht verfügbar, ohne Tool nochmal.'
          continue
        }
        if (isRetryableCloud(status, message, errStatus)) {
          rememberSkip(model)
          last = germanQuotaHint(groqOn)
          modelRetryable = true
          break
        }
        if (status < 200 || status >= 300 || json.error) {
          last = userFacingCloudError(message || '', groqOn)
          break
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
        return { text, research: researchFrom(json) }
      }
      if (modelRetryable) continue
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
      const text = await completeGroq(messages, onToken)
      return { text }
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
    const { text } = await completeGemini([
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

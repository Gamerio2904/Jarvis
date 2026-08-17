import { hostOf, sourcesFromText, type ResearchMeta, type ResearchSource } from './research-parse'
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
import { streamSseLines } from '../native/voice'
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

async function postGemini(
  model: string,
  body: unknown,
  timeoutMs?: number,
): Promise<{ status: number; json: GeminiResponse }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const { status, json } = await postJson(
    url,
    {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey(),
    },
    body,
    timeoutMs,
  )
  return { status, json: json as GeminiResponse }
}

function textFrom(json: GeminiResponse, trim = true): string {
  const parts = json.candidates?.[0]?.content?.parts || []
  const raw = parts.map((p) => p.text || '').join('')
  return trim ? raw.trim() : raw
}

function researchFrom(json: GeminiResponse, answer = ''): ResearchMeta | undefined {
  const cand = json.candidates?.[0] as Record<string, unknown> | undefined
  const g = (cand?.groundingMetadata || cand?.grounding_metadata) as
    | (GroundingMetadata & {
        grounding_chunks?: GroundingChunk[]
        web_search_queries?: string[]
        searchEntryPoint?: { renderedContent?: string }
        search_entry_point?: { renderedContent?: string; rendered_content?: string }
      })
    | undefined
  const now = new Date().toISOString()
  const chunks = g?.groundingChunks || g?.grounding_chunks || []
  const fromChunks: ResearchSource[] = chunks.flatMap((c) => {
    const web = c.web || (c as { retrievedContext?: { uri?: string; title?: string } }).retrievedContext
    const url = web?.uri || ''
    if (!url) return []
    return [
      {
        title: web?.title || hostOf(url) || 'Quelle',
        url,
        snippet: '',
        provider: 'google_search',
        retrieved_at: now,
      },
    ]
  })
  const html = g?.searchEntryPoint?.renderedContent || g?.search_entry_point?.renderedContent || g?.search_entry_point?.rendered_content || ''
  const fromHtml = html ? sourcesFromText(html.replace(/href=["']([^"']+)["']/gi, ' $1 '), 'google_search') : []
  const fromAnswer = sourcesFromText(answer)
  const seen = new Set<string>()
  const sources: ResearchSource[] = []
  for (const s of [...fromChunks, ...fromHtml, ...fromAnswer]) {
    if (!s.url || seen.has(s.url)) continue
    seen.add(s.url)
    sources.push(s)
  }
  const query = (g?.webSearchQueries || g?.web_search_queries || []).filter(Boolean)[0]
  if (!sources.length && !query && !g) return undefined
  return {
    used: sources.length > 0,
    status: sources.length ? 'ok' : 'empty',
    status_label: sources.length ? `${sources.length} Quellen` : 'Suche ohne Links',
    badge: sources.length ? 'Quellen' : 'Suche',
    query,
    sources,
    network_attempted: true,
    privacy_note: 'Nur die Suchanfrage ging zu Google. Tippen öffnet die Seite.',
  }
}

function buildBody(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { search?: boolean; thinking?: boolean; maxOutputTokens?: number } = {},
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
    temperature: opts.search ? 0.35 : opts.maxOutputTokens && opts.maxOutputTokens < 200 ? 0.62 : 0.72,
    maxOutputTokens: opts.maxOutputTokens || 720,
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

export async function streamGemini(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
  opts?: { search?: boolean; maxOutputTokens?: number },
): Promise<CloudComplete> {
  if (opts?.search) {
    return completeGemini(messages, onToken, {
      ...opts,
      timeoutMs: 10_000,
      maxModels: 2,
      thinking: false,
    })
  }
  if (!geminiReady()) {
    throw new Error('Gemini ist aus oder ohne Key. Unter Einstellungen eintragen.')
  }
  const key = loadSettings().gemini_api_key.trim()
  const order = geminiModelOrder(loadSettings().gemini_skip_until, missingModels)
  const preferred = loadSettings().gemini_model
  const models = [...new Set([preferred, ...order].filter(Boolean))].slice(0, 2)
  const budgetMs = 9_000
  const started = Date.now()
  for (const model of models) {
    const left = budgetMs - (Date.now() - started)
    if (left < 1_200) break
    const body = buildBody(model, messages, {
      search: false,
      thinking: false,
      maxOutputTokens: opts?.maxOutputTokens || 160,
    })
    let full = ''
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
    const res = await streamSseLines({ url, body, apiKey: key, timeoutMs: Math.min(7_000, left) }, (json) => {
      const incoming = textFrom(json as GeminiResponse, false)
      if (!incoming) return
      let piece = incoming
      if (incoming.startsWith(full) && incoming.length >= full.length) {
        piece = incoming.slice(full.length)
        full = incoming
      } else if (full && incoming && !/\s$/.test(full) && !/^\s/.test(incoming) && /[a-zäöüß.]$/i.test(full) && /^[A-ZÄÖÜ]/.test(incoming)) {
        full += ` ${incoming}`
        piece = ` ${incoming}`
      } else {
        full += incoming
      }
      if (piece) onToken?.(piece, full)
    })
    if (full.trim()) {
      saveSettings({ gemini_model: model })
      return { text: full.trim() }
    }
    if (res.message?.includes('403') || res.message?.toLowerCase().includes('unauth')) {
      throw new Error(germanAuthError())
    }
  }
  const left = budgetMs - (Date.now() - started)
  if (left < 1_500) {
    throw new Error('Antwort dauert zu lange. Nochmal?')
  }
  return completeGemini(messages, onToken, {
    ...opts,
    maxOutputTokens: opts?.maxOutputTokens || 160,
    timeoutMs: Math.min(8_000, left),
    maxModels: 1,
    thinking: false,
  })
}

export async function completeGemini(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
  opts?: { search?: boolean; maxOutputTokens?: number; timeoutMs?: number; maxModels?: number; thinking?: boolean },
): Promise<CloudComplete> {
  if (!geminiReady()) {
    throw new Error('Gemini ist aus oder ohne Key. Unter Einstellungen eintragen.')
  }
  const groqOn = groqReady()
  let last = germanQuotaHint(groqOn)
  const wantSearch = Boolean(opts?.search)
  const models = geminiModelOrder(loadSettings().gemini_skip_until, missingModels).slice(
    0,
    opts?.maxModels || 99,
  )
  for (const model of models) {
    const attempts = wantSearch
      ? [
          buildBody(model, messages, { search: true, thinking: false, maxOutputTokens: opts?.maxOutputTokens }),
          buildBody(model, messages, { search: false, thinking: opts?.thinking !== false, maxOutputTokens: opts?.maxOutputTokens }),
        ]
      : [buildBody(model, messages, { search: false, thinking: opts?.thinking !== false, maxOutputTokens: opts?.maxOutputTokens })]
    let modelRetryable = false
    try {
      for (let i = 0; i < attempts.length; i += 1) {
        const { status, json } = await postGemini(model, attempts[i], opts?.timeoutMs)
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
        return { text, research: researchFrom(json, text) }
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

export async function completeGeminiVision(
  prompt: string,
  base64: string,
  mime: string,
): Promise<string> {
  if (!geminiReady()) throw new Error('Gemini ist aus oder ohne Key.')
  const models = geminiModelOrder(loadSettings().gemini_skip_until, missingModels)
  let last = 'Gemini lieferte keinen Text zum Bild.'
  const run = async () => {
    for (const model of models) {
      const body = {
        system_instruction: { parts: [{ text: GEMINI_PERSONA }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mime || 'image/jpeg', data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 320 },
      }
      const { status, json } = await postGemini(model, body)
      const text = textFrom(json)
      if (status >= 200 && status < 300 && text) {
        saveSettings({ gemini_model: model })
        return text
      }
      last = json.error?.message || last
      if (status === 400 || status === 404) continue
    }
    throw new Error(last)
  }
  return Promise.race([
    run(),
    new Promise<string>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error('Bild dauert zu lange. Nochmal, kleineres Foto.')), 40_000)
    }),
  ])
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

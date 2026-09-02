import { GEMINI_PERSONA } from './persona'
import { GROQ_MODELS_BEST_FIRST, isFatalAuth, isRetryableCloud, isUnknownModel } from './cloud-errors'
import { postJson } from './http-json'
import { streamSseLines } from '../native/voice'
import { loadSettings } from './store'

type GroqChoice = { message?: { content?: string }; delta?: { content?: string } }
type GroqResponse = {
  choices?: GroqChoice[]
  error?: { message?: string; type?: string; code?: string }
}

function groqKey(): string {
  return loadSettings().groq_api_key.trim()
}

export function groqReady(): boolean {
  return Boolean(groqKey())
}

function textFrom(json: GroqResponse): string {
  return (json.choices?.[0]?.message?.content || '').trim()
}

function deltaFrom(json: Record<string, unknown>): string {
  const choices = json.choices as GroqChoice[] | undefined
  return choices?.[0]?.delta?.content || ''
}

export async function completeGroq(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  const key = groqKey()
  if (!key) throw new Error('Kein Groq-Schlüssel.')
  const mapped = messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
    content: m.content,
  }))
  const body = {
    messages: mapped,
    temperature: 0.68,
    max_tokens: 420,
  }
  let last = 'Groq antwortet nicht.'
  for (const model of GROQ_MODELS_BEST_FIRST) {
    const streamed = await streamGroq({ ...body, stream: true, model }, key, onToken)
    if (streamed.fatal) throw new Error(streamed.last)
    if (streamed.text) return streamed.text
    if (streamed.last) last = streamed.last
    try {
      const { status, json } = await postJson(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        { ...body, model, stream: false },
        10_000,
      )
      const parsed = json as GroqResponse
      const errMsg = parsed.error?.message || ''
      const errCode = String(parsed.error?.code || parsed.error?.type || '')
      if (isFatalAuth(status, errMsg, errCode)) {
        throw new Error('Groq-Key ungültig. Unter console.groq.com/keys einen neuen holen.')
      }
      if (isUnknownModel(status, errMsg, errCode) || status === 400) {
        last = 'Groq-Modell nicht verfügbar.'
        continue
      }
      if (isRetryableCloud(status, errMsg, errCode) || status < 200 || status >= 300) {
        last = 'Groq gerade ausgelastet.'
        continue
      }
      const text = textFrom(parsed)
      if (!text) {
        last = 'Groq lieferte keinen Text.'
        continue
      }
      onToken?.(text, text)
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('ungültig')) throw err instanceof Error ? err : new Error(msg)
      last = msg
    }
  }
  throw new Error(last)
}

async function streamGroq(
  body: unknown,
  key: string,
  onToken?: (piece: string, full: string) => void,
): Promise<{ text: string; last: string; fatal: boolean }> {
  let full = ''
  const res = await streamSseLines(
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      body,
      apiKey: key,
      timeoutMs: 8_000,
      auth: 'bearer',
    },
    (json) => {
      const piece = deltaFrom(json)
      if (!piece) return
      full += piece
      onToken?.(piece, full)
    },
  )
  const t = full.trim()
  if (t) return { text: t, last: '', fatal: false }
  const msg = (res.message || '').toLowerCase()
  if (msg.includes('401') || msg.includes('403') || msg.includes('unauth')) {
    return { text: '', last: 'Groq-Key ungültig. Unter console.groq.com/keys einen neuen holen.', fatal: true }
  }
  return { text: '', last: res.message || 'Groq-Stream leer.', fatal: false }
}

export async function testGroq(): Promise<{ ok: boolean; reply: string }> {
  if (!groqKey()) {
    return { ok: false, reply: 'Kein Groq-Key. Auf console.groq.com/keys erzeugen und hier einfügen.' }
  }
  try {
    const text = await completeGroq([
      { role: 'system', content: GEMINI_PERSONA },
      { role: 'user', content: 'Antworten Sie mit genau einem Wort: Bereit.' },
    ])
    return { ok: true, reply: text || 'Groq verbunden.' }
  } catch (err) {
    return { ok: false, reply: err instanceof Error ? err.message : 'Groq-Test fehlgeschlagen' }
  }
}

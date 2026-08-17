import { GEMINI_PERSONA } from './persona'
import { GROQ_MODELS_BEST_FIRST, isFatalAuth, isRetryableCloud, isUnknownModel } from './cloud-errors'
import { postJson } from './http-json'
import { loadSettings } from './store'

type GroqChoice = { message?: { content?: string } }
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

export async function completeGroq(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
): Promise<string> {
  const key = groqKey()
  if (!key) throw new Error('Kein Groq-Schlüssel.')
  const body = {
    messages: messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content,
    })),
    temperature: 0.68,
    max_tokens: 420,
    stream: false,
  }
  let last = 'Groq antwortet nicht.'
  for (const model of GROQ_MODELS_BEST_FIRST) {
    try {
      const { status, json } = await postJson(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        { ...body, model },
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

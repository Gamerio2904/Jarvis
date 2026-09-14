import { GEMINI_PERSONA } from './persona.ts'
import {
  groqModelOrder,
  isFatalAuth,
  isRetryableCloud,
  isUnknownModel,
  markSkip,
  parseSkipMap,
} from './cloud-errors.ts'
import { postJson } from './http-json.ts'
import { streamSseLines } from '../native/voice.ts'
import { loadSettings, saveSettings } from './store.ts'
import { noteQuotaExhausted, noteQuotaHeaders } from './quota.ts'

/**
 * Gemini merkt sich über `markSkip`, welches Modell gerade nicht geht. Groq
 * lief bei jedem Aufruf von vorne durch dieselbe tote Liste — dasselbe
 * Gedächtnis, nur bisher nicht angeschlossen.
 */
function skipGroqModel(model: string): void {
  saveSettings({ groq_skip_until: markSkip(loadSettings().groq_skip_until, model) })
}

/** Ein Modell, das wieder antwortet, gehört sofort zurück nach vorne. */
function groqUnskip(model: string): void {
  const raw = loadSettings().groq_skip_until
  const map = parseSkipMap(raw)
  if (!map[model]) return
  delete map[model]
  saveSettings({ groq_skip_until: JSON.stringify(map) })
}

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

/** Groq speech (PlayAI/Orpheus) is English/Arabic only — mouth stays Edge/Gemini. */

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
  for (const model of groqModelOrder(loadSettings().groq_skip_until)) {
    const streamed = await streamGroq({ ...body, stream: true, model }, key, onToken)
    if (streamed.fatal) throw new Error(streamed.last)
    if (streamed.text) {
      groqUnskip(model)
      return streamed.text
    }
    if (streamed.last) last = streamed.last
    /**
     * Ein Modell, das es nicht gibt, hat es auch beim zweiten Anlauf nicht.
     * Vorher kostete genau dieser Fall **zwei** Anfragen pro Zug — bei 1.000
     * am Tag und einem toten Modell an Position 1 die Hälfte des Budgets.
     */
    if (isUnknownModel(0, streamed.last)) {
      skipGroqModel(model)
      last = 'Groq-Modell nicht verfügbar.'
      continue
    }
    try {
      const { status, json, headers } = await postJson(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        { ...body, model, stream: false },
        10_000,
      )
      noteQuotaHeaders('groq', headers)
      const parsed = json as GroqResponse
      const errMsg = parsed.error?.message || ''
      const errCode = String(parsed.error?.code || parsed.error?.type || '')
      if (isFatalAuth(status, errMsg, errCode)) {
        throw new Error('Groq-Key ungültig. Unter console.groq.com/keys einen neuen holen.')
      }
      if (isUnknownModel(status, errMsg, errCode) || status === 400) {
        skipGroqModel(model)
        last = 'Groq-Modell nicht verfügbar.'
        continue
      }
      if (status === 429) {
        noteQuotaExhausted('groq', headers)
        last = 'Groq-Tageslimit erreicht.'
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
      groqUnskip(model)
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

import { completeGemini, geminiReady, GEMINI_LABEL } from './gemini.ts'
import { completeGroq, groqReady } from './groq.ts'
import { completeChat, isModelReady } from './llm.ts'
import { DEFAULT_MODEL, loadSettings } from './store.ts'
import { pickBrain, type BrainKind } from './brain-pick.ts'

export type { BrainKind }
export { pickBrain }

export function brainKind(): BrainKind {
  return pickBrain({ gemini: geminiReady(), groq: groqReady(), local: isModelReady() })
}

export function brainLabel(kind = brainKind()): string {
  if (kind === 'gemini') return GEMINI_LABEL
  if (kind === 'groq') return 'Groq (Backup)'
  if (kind === 'local') return DEFAULT_MODEL.label
  return 'kein Hirn'
}

export function noBrainLine(): string {
  const s = loadSettings()
  if (s.gemini_api_key.trim() && !s.gemini_enabled) {
    return 'Gemini-Key liegt, aber Gemini ist aus. Unter Einstellungen → Hirn einschalten. Wetter, Timer und Einkauf laufen trotzdem.'
  }
  if (s.gemini_enabled && !s.gemini_api_key.trim()) {
    return 'Gemini ist an, aber kein API-Key. Unter Einstellungen → API-Keys eintragen. Wetter, Timer und Einkauf laufen trotzdem.'
  }
  return 'Kein Hirn bereit. Gemini-Key in den Einstellungen, sonst Groq, sonst lokales 0,5B-Modell laden. Wetter, Timer und Einkauf laufen trotzdem.'
}

export type BrainComplete = { text: string; research?: { sources?: unknown[] }; via: BrainKind }

export async function completeBrain(
  messages: Array<{ role: string; content: string }>,
  onToken?: (piece: string, full: string) => void,
  opts?: { search?: boolean; maxOutputTokens?: number; timeoutMs?: number; voice?: boolean },
): Promise<BrainComplete> {
  const kind = brainKind()
  if (kind === 'gemini') {
    const r = await completeGemini(messages, onToken, {
      search: opts?.search,
      maxOutputTokens: opts?.maxOutputTokens,
      timeoutMs: opts?.timeoutMs,
    })
    return { text: r.text, research: r.research, via: 'gemini' }
  }
  if (kind === 'groq') {
    const text = await completeGroq(messages, onToken)
    return { text, via: 'groq' }
  }
  if (kind === 'local') {
    const text = await completeChat(messages, onToken)
    return { text, via: 'local' }
  }
  throw new Error(noBrainLine())
}

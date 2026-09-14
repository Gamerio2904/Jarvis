import { completeGemini, geminiReady, GEMINI_LABEL } from './gemini.ts'
import { completeGroq, groqReady } from './groq.ts'
import { completeChat, isModelReady } from './llm.ts'
import { DEFAULT_MODEL, loadSettings } from './store.ts'
import { pickBrain, type BrainKind } from './brain-pick.ts'
import { primaryChatModel } from './brain-tasks.ts'
import { quotaBlocked, quotaHint } from './quota.ts'

export type { BrainKind }
export { pickBrain }

/**
 * Ein fast leeres Tageslimit ist kein Fehler, sondern ein erwarteter Zustand
 * des Free Tiers. Vorher lief Jarvis erst in den `429` und sagte dann ab;
 * jetzt wird er vorher schlichter, statt später stumm.
 *
 * Nur wenn das lokale Modell wirklich bereit ist — sonst wäre die Absage mit
 * Erklärung immer noch besser als gar keine Antwort.
 */
function demoteOnQuota(kind: BrainKind): BrainKind {
  if (kind !== 'gemini' && kind !== 'groq') return kind
  if (!quotaBlocked(kind)) return kind
  return isModelReady() ? 'local' : kind
}

export function brainKind(): BrainKind {
  return demoteOnQuota(chosenBrain())
}

function chosenBrain(): BrainKind {
  const s = loadSettings()
  if (s.brain_v2) {
    const model = primaryChatModel({
      brain_v2: s.brain_v2,
      brain_primary: s.brain_primary,
      gemini_enabled: s.gemini_enabled,
      gemini_api_key: s.gemini_api_key,
      groq_api_key: s.groq_api_key,
    })
    if (model === 'gemini' && geminiReady()) return 'gemini'
    if (model === 'groq' && groqReady()) return 'groq'
    if (model === 'local' && isModelReady()) return 'local'
    return 'none'
  }
  return pickBrain({ gemini: geminiReady(), groq: groqReady(), local: isModelReady() })
}

export function brainLabel(kind = brainKind()): string {
  const s = loadSettings()
  if (kind === 'gemini') return s.brain_v2 ? `${GEMINI_LABEL} (Spezialist)` : GEMINI_LABEL
  if (kind === 'groq') return s.brain_v2 ? 'Groq (primär)' : 'Groq (Backup)'
  if (kind === 'local') {
    const chosen = chosenBrain()
    return chosen === 'local' ? DEFAULT_MODEL.label : `${DEFAULT_MODEL.label} (Tageslimit)`
  }
  return 'kein Hirn'
}

/**
 * Was der Nutzer hören soll, wenn die Cloud wegen des Kontingents übersprungen
 * wird: ein Hinweis, keine Fehlermeldung.
 */
export function brainQuotaNote(): string {
  const chosen = chosenBrain()
  if (chosen !== 'gemini' && chosen !== 'groq') return ''
  if (demoteOnQuota(chosen) === chosen) return ''
  return quotaHint(chosen)
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

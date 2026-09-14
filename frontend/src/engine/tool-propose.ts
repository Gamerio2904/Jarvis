import { completeGroqJson, groqReady } from './groq.ts'
import { quotaBlocked } from './quota.ts'
import { loadSettings } from './store.ts'
import { readProposal, toolJsonSchema, toolSystemPrompt, type ParsedProposal } from './tool-contract.ts'

/**
 * Der Vorschlagsweg: das Modell nennt ein Werkzeug, mehr nicht.
 *
 * Vier Schranken liegen dazwischen, bevor irgendetwas passiert — Schema,
 * Übersetzung in einen deutschen Satz, Parser-Bestätigung und bei Geräten die
 * Bestätigung des Nutzers. Diese Datei ist die erste davon.
 */

/** Ohne erzwungenes JSON wird der Weg abgeschaltet, nicht mit Regex nachgebaut. */
export function proposeReady(): boolean {
  const s = loadSettings()
  if (!s.tool_propose) return false
  if (!groqReady()) return false
  return !quotaBlocked('groq')
}

export async function proposeTool(text: string): Promise<ParsedProposal | null> {
  if (!proposeReady()) return null
  const raw = await completeGroqJson({
    system: toolSystemPrompt(),
    user: text,
    name: 'tool_call',
    schema: toolJsonSchema(),
  })
  return readProposal(raw)
}

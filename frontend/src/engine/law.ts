import { parseLawIntent } from './law-parse'
import type { ToolMeta } from './tools'

export { parseLawIntent } from './law-parse'

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'law', action, label }
}

export async function handleLaw(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseLawIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'ask') {
    return {
      handled: true,
      reply:
        'Welcher Alltag: Kündigungsfrist Wohnung, Arbeitsvertrag, Widerruf, Gewährleistung, Mietminderung oder Urlaub? Ich zitiere das Gesetz mit Link — kein Rat, ob Sie klagen sollen.',
      tool: tool('ask', 'Recht'),
      lastTool: 'law',
    }
  }
  const t = intent.topic
  return {
    handled: true,
    reply: `${t.title}: ${t.cite}. ${t.note} ${t.url} Das ist der Gesetzestext, kein Mandat.`,
    tool: tool('cite', t.cite),
    lastTool: 'law',
  }
}

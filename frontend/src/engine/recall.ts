import { parseRecallIntent } from './recall-parse.ts'
import { formatRetrieveHits, retrieve } from './retrieve.ts'
import type { ToolMeta } from './tools.ts'

export { parseRecallIntent }

export async function handleRecall(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const q = parseRecallIntent(text)
  if (!q) return { handled: false }
  const hits = await retrieve(q)
  if (!hits.length) {
    return {
      handled: true,
      reply: `Nichts Belegtes zu „${q}“ in den lokalen Speichern.`,
      tool: { tool_status: 'executed', tool: 'recall', action: 'empty', label: 'Gedächtnis' },
      lastTool: 'recall',
    }
  }
  const line = hits
    .slice(0, 4)
    .map((h) => `${h.title}: ${h.body}`)
    .join(' ')
  return {
    handled: true,
    reply: line,
    tool: { tool_status: 'executed', tool: 'recall', action: 'hit', label: 'Gedächtnis' },
    lastTool: 'recall',
  }
}

void formatRetrieveHits

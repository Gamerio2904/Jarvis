import { parseGardenIntent } from './garden-parse'
import { formatTaxon, searchInat } from './inat'
import { latestEye } from './tablet'
import type { ToolMeta } from './tools'

export { parseGardenIntent } from './garden-parse'

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'garden', action, label }
}

export async function handleGarden(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseGardenIntent(text)
  if (!intent) return { handled: false }
  const q = (intent.query || latestEye()?.caption || '').trim()
  if (!q) {
    return {
      handled: true,
      reply:
        latestEye()
          ? 'Foto ist da, aber ohne Namen suche ich iNaturalist nicht. Die Art nenne ich nur mit Treffer — Essbarkeit nicht.'
          : 'Welche Pflanze? Name oder Foto. Ohne Treffer bestimme ich nichts, und Gift behaupte ich nicht.',
      tool: tool('ask', 'Pflanze'),
      lastTool: 'garden',
    }
  }
  const rows = await searchInat(q)
  if (!rows.length) {
    return {
      handled: true,
      reply: `iNaturalist kennt „${q}“ so nicht. Unbekannt — ich rate die Art nicht und sage nichts zur Essbarkeit.`,
      tool: tool('empty', 'Unbekannt'),
      lastTool: 'garden',
    }
  }
  return {
    handled: true,
    reply: `${formatTaxon(rows[0], ' Keine Aussage zur Giftigkeit.')} Quelle: iNaturalist.`,
    tool: tool('id', rows[0].name),
    lastTool: 'garden',
  }
}

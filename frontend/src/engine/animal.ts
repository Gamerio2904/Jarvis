import { parseAnimalIntent } from './animal-parse'
import { getJson } from './http-json'
import { formatTaxon, searchInat } from './inat'
import { latestEye } from './tablet'
import type { ToolMeta } from './tools'

export { parseAnimalIntent } from './animal-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'animal', action, label }
}

export async function handleAnimal(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseAnimalIntent(text)
  if (!intent) return { handled: false }
  const q = (intent.query || latestEye()?.caption || '').trim()
  if (!q) {
    return {
      handled: true,
      reply:
        latestEye()
          ? 'Foto ohne Namen: ohne Clip und ohne Treffer bestimme ich den Vogel nicht.'
          : 'Welcher Vogel oder welches Tier? Name, Foto — ohne Treffer bei iNaturalist oder xeno-canto bleibt es offen.',
      tool: tool('ask', 'Tier'),
      lastTool: 'animal',
    }
  }
  const taxa = await searchInat(q)
  const xc = await xenoCanto(q)
  if (!taxa.length && !xc) {
    return {
      handled: true,
      reply: `Keine sichere Art zu „${q}“. Ohne Treffer keine Bestimmung.`,
      tool: tool('empty', 'Unbekannt'),
      lastTool: 'animal',
    }
  }
  const head = taxa[0] ? formatTaxon(taxa[0]) : ''
  const song = xc ? ` Gesang: ${xc}.` : ''
  return {
    handled: true,
    reply: `${head || q}.${song} Quellen: iNaturalist${xc ? ', xeno-canto' : ''}.`,
    tool: tool('id', taxa[0]?.name || q),
    lastTool: 'animal',
  }
}

async function xenoCanto(q: string): Promise<string | null> {
  try {
    const { status, json } = await getJson(
      `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(q)}`,
      UA,
    )
    if (status < 200 || status >= 300) return null
    const recs = Array.isArray((json as { recordings?: unknown }).recordings)
      ? ((json as { recordings: Array<Record<string, unknown>> }).recordings)
      : []
    const r = recs[0]
    if (!r) return null
    const en = String(r.en || r.gen || '').trim()
    const url = String(r.url || '').trim()
    const href = url.startsWith('http') ? url : url ? `https:${url}` : ''
    if (!en && !href) return null
    return `${en || 'Aufnahme'}${href ? ` ${href}` : ''}`
  } catch {
    return null
  }
}

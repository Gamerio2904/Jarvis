import { getJson } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.0.0 (local.jarvis.app)' }

export type NatureIntent = { kind: 'plant' | 'animal'; query: string }

export function parseNatureIntent(text: string): NatureIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const plant = /(?:was\s+ist\s+das\s+für\s+eine\s+pflanze|welche\s+pflanze|pflanzenname)\s*[: -]?\s*(.*)$/i.exec(t)
  const animal =
    /(?:was\s+ist\s+das\s+für\s+ein\s+(?:tier|vogel)|welcher\s+vogel|welches\s+tier)\s*[: -]?\s*(.*)$/i.exec(t)
  if (plant) return { kind: 'plant', query: (plant[1] || '').trim() }
  if (animal) return { kind: 'animal', query: (animal[1] || '').trim() }
  return null
}

export async function handleNature(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseNatureIntent(text)
  if (!intent) return { handled: false }
  if (!intent.query) {
    return {
      handled: true,
      reply:
        intent.kind === 'plant'
          ? 'Den Namen sagen oder den Foto-Knopf. Essbarkeit sage ich nicht.'
          : 'Den Namen sagen oder den Foto-Knopf. Ohne Clip bestimme ich keinen Vogel.',
      tool: { tool_status: 'executed', tool: 'nature', action: 'ask', label: 'Natur' },
      lastTool: 'nature',
    }
  }
  const hit = await taxa(intent.query)
  if (!hit) {
    return {
      handled: true,
      reply: `iNaturalist kennt „${intent.query}“ so nicht. Ich rate die Art nicht.`,
      tool: { tool_status: 'executed', tool: 'nature', action: 'empty', label: 'Kein Treffer' },
      lastTool: 'nature',
    }
  }
  const warn = intent.kind === 'plant' ? ' Essbarkeit sage ich nicht.' : ''
  return {
    handled: true,
    reply: `${hit.name}${hit.wiki ? `. ${hit.wiki}` : '.'}${warn}`,
    tool: { tool_status: 'executed', tool: 'nature', action: 'lookup', label: 'Natur' },
    lastTool: 'nature',
  }
}

async function taxa(q: string): Promise<{ name: string; wiki: string } | null> {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(q)}&per_page=1`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return null
    const results = Array.isArray(json.results) ? json.results : []
    const row = results[0] as Record<string, unknown> | undefined
    if (!row) return null
    const name = String(row.preferred_common_name || row.name || '').trim()
    if (!name) return null
    const wiki = String(row.wikipedia_url || '').trim()
    return { name, wiki }
  } catch {
    return null
  }
}

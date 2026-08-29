import { getJson } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }

export type FoodIntent = { query: string }

export function parseFoodIntent(text: string): FoodIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const m =
    /(?:was\s+ist\s+das\s+für\s+ein\s+produkt|lebensmittel|open\s+food\s+facts|zutaten\s+von|barcode|ean)\s*[: -]?\s*(.*)$/i.exec(
      t,
    )
  if (!m && !/\b(produktinfo|nährwert)\b/i.test(t)) return null
  const q = (m?.[1] || t).replace(/^(was\s+ist\s+das\s+für\s+ein\s+produkt|produktinfo)\s*/i, '').trim()
  if (!q || q.length < 2) {
    return { query: '' }
  }
  if (/\b(wetter|fernseh|wecker)\b/i.test(q)) return null
  return { query: q.slice(0, 80) }
}

export async function handleFood(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFoodIntent(text)
  if (!intent) return { handled: false }
  if (!intent.query) {
    return {
      handled: true,
      reply: 'Den Namen oder die EAN sagen, oder den Foto-Knopf. Ohne Treffer bestimme ich nichts.',
      tool: { tool_status: 'executed', tool: 'food', action: 'ask', label: 'Lebensmittel' },
      lastTool: 'food',
    }
  }
  const hit = await searchFood(intent.query)
  if (!hit) {
    return {
      handled: true,
      reply: `Open Food Facts kennt „${intent.query}“ so nicht. Essbarkeit rate ich nicht.`,
      tool: { tool_status: 'executed', tool: 'food', action: 'empty', label: 'Kein Treffer' },
      lastTool: 'food',
    }
  }
  return {
    handled: true,
    reply: `${hit.name}${hit.brands ? `, ${hit.brands}` : ''}. ${hit.url}`,
    tool: { tool_status: 'executed', tool: 'food', action: 'lookup', label: 'Lebensmittel' },
    lastTool: 'food',
  }
}

async function searchFood(q: string): Promise<{ name: string; brands: string; url: string } | null> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=1`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return null
    const products = Array.isArray(json.products) ? json.products : []
    const row = products[0] as Record<string, unknown> | undefined
    if (!row) return null
    const name = String(row.product_name || row.generic_name || '').trim()
    const code = String(row.code || '').trim()
    if (!name) return null
    return {
      name,
      brands: String(row.brands || '').trim(),
      url: code ? `https://world.openfoodfacts.org/product/${code}` : 'https://world.openfoodfacts.org/',
    }
  } catch {
    return null
  }
}

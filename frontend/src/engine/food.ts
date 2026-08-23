import { parseFoodIntent } from './food-parse'
import { getJson, getText } from './http-json'
import { latestEye } from './tablet'
import type { ToolMeta } from './tools'

export { parseFoodIntent } from './food-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.0 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'food', action, label }
}

export async function handleFood(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFoodIntent(text)
  if (!intent) return { handled: false }
  const barcode = intent.barcode
  if (barcode) {
    const hit = await byBarcode(barcode)
    return hit
  }
  const q = (intent.query || latestEye()?.caption || '').trim()
  if (!q) {
    return {
      handled: true,
      reply:
        latestEye()
          ? 'Letztes Foto ist da, aber ohne erkennbaren Produktnamen. Barcode sagen oder den Namen — Essbarkeit behaupte ich nicht.'
          : 'Welches Produkt? Name, EAN oder Foto. Ohne Treffer bei Open Food Facts rate ich nicht.',
      tool: tool('ask', 'Produkt'),
      lastTool: 'food',
    }
  }
  const rows = await searchName(q)
  if (!rows.length) {
    return {
      handled: true,
      reply: `Bei Open Food Facts nichts Sicheres zu „${q}“. Ich erfinde kein Produkt.`,
      tool: tool('empty', 'Kein Treffer'),
      lastTool: 'food',
    }
  }
  const p = rows[0]
  return {
    handled: true,
    reply: formatProduct(p),
    tool: tool('lookup', p.name),
    lastTool: 'food',
  }
}

async function byBarcode(code: string): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  try {
    const { status, json } = await getJson(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, UA)
    const product = json?.product && typeof json.product === 'object' ? (json.product as Record<string, unknown>) : null
    if (status < 200 || status >= 300 || String(json.status) === '0' || !product) {
      return {
        handled: true,
        reply: `EAN ${code} steht so nicht bei Open Food Facts. Ich rate die Nährwerte nicht.`,
        tool: tool('empty', 'Kein Treffer'),
        lastTool: 'food',
      }
    }
    const row = fromProduct(product, code)
    return { handled: true, reply: formatProduct(row), tool: tool('barcode', row.name), lastTool: 'food' }
  } catch {
    return {
      handled: true,
      reply: 'Open Food Facts antwortet gerade nicht. Ich rate nicht.',
      tool: tool('error', 'OFF fehlt'),
      lastTool: 'food',
    }
  }
}

async function searchName(q: string): Promise<Array<ReturnType<typeof fromProduct>>> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=3`
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) return []
    const data = JSON.parse(text) as { products?: Array<Record<string, unknown>> }
    return (data.products || []).slice(0, 3).map((p) => fromProduct(p, String(p.code || '')))
  } catch {
    return []
  }
}

function fromProduct(p: Record<string, unknown>, code: string) {
  const name = String(p.product_name || p.generic_name || 'Ohne Namen').trim()
  const brand = String(p.brands || '').trim()
  const nutriscore = String(p.nutriscore_grade || '').toUpperCase()
  const url = code ? `https://world.openfoodfacts.org/product/${code}` : String(p.url || '')
  return { name, brand, nutriscore, url, code }
}

function formatProduct(p: { name: string; brand: string; nutriscore: string; url: string; code: string }): string {
  const brand = p.brand ? ` von ${p.brand}` : ''
  const score = p.nutriscore && p.nutriscore !== 'UNKNOWN' ? ` Nutri-Score ${p.nutriscore}.` : ''
  const link = p.url ? ` ${p.url}` : ''
  return `${p.name}${brand}.${score} Open Food Facts, kein Urteil zur Essbarkeit.${link}`
}

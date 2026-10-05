import { getJson } from './http-json.ts'
import { jsonUA } from './ua.ts'

const UA = jsonUA

export type OffProductHit = {
  title: string
  image_url?: string
  product_ref?: string
  brands?: string
}

/** Open Food Facts — nur echte API-Felder, kein erfundener Preis. */
export async function searchOffProducts(q: string, pageSize = 8): Promise<OffProductHit[]> {
  const term = q.trim()
  if (!term || term.length < 2) return []
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=${pageSize}`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return []
    const products = Array.isArray(json.products) ? json.products : []
    const out: OffProductHit[] = []
    for (const row of products as Record<string, unknown>[]) {
      const name = String(row.product_name || row.generic_name || '').trim()
      if (!name) continue
      const code = String(row.code || '').trim()
      const image = String(row.image_small_url || row.image_url || '').trim()
      out.push({
        title: name,
        image_url: image || undefined,
        product_ref: code || undefined,
        brands: String(row.brands || '').trim() || undefined,
      })
    }
    return out
  } catch {
    return []
  }
}

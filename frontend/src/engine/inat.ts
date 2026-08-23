import { getJson } from './http-json'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }

export type InatTaxon = { name: string; common: string; rank: string; wiki: string; url: string }

export async function searchInat(query: string): Promise<InatTaxon[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const { status, json } = await getJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(q)}&is_active=true&per_page=5`,
      UA,
    )
    if (status < 200 || status >= 300) return []
    const results = Array.isArray((json as { results?: unknown }).results)
      ? ((json as { results: Array<Record<string, unknown>> }).results)
      : []
    return results
      .map((r) => {
        const id = r.id
        const wiki = String(r.wikipedia_url || '').trim()
        return {
          name: String(r.name || '').trim(),
          common: String(r.preferred_common_name || r.matched_term || '').trim(),
          rank: String(r.rank || '').trim(),
          wiki,
          url: id ? `https://www.inaturalist.org/taxa/${id}` : wiki,
        }
      })
      .filter((t) => t.name)
  } catch {
    return []
  }
}

export function formatTaxon(t: InatTaxon, extra = ''): string {
  const common = t.common && t.common.toLowerCase() !== t.name.toLowerCase() ? `${t.common} — ` : ''
  const link = t.url || t.wiki
  return `${common}${t.name}${t.rank ? ` (${t.rank})` : ''}.${extra}${link ? ` ${link}` : ''}`
}

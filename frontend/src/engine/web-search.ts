import { getJson, getText } from './http-json'
import {
  compareShopSources,
  isProductLookup,
  mergeResearchSources,
  researchQuery,
  shopRank,
  sourcesFromHtml,
  sourcesFromText,
  type ResearchMeta,
  type ResearchSource,
} from './research-parse'

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Jarvis/1.33'

export async function fillResearchLinks(
  queryText: string,
  answer: string,
  research?: ResearchMeta,
): Promise<ResearchMeta> {
  const query = researchQuery(research?.query || queryText)
  const product = isProductLookup(queryText) || isProductLookup(query)
  const extra: ResearchSource[] = [
    ...sourcesFromText(answer),
    ...(research?.sources || []),
  ]
  const need = product ? 3 : 2
  if (extra.filter((s) => s.url).length < need) {
    const searches = product ? [query, `${query} Preis Vergleich`] : [query]
    const found = await Promise.all(searches.map((q) => duckDuckGo(q)))
    extra.push(...found.flat())
  }
  if (extra.filter((s) => s.url && s.snippet).length < 1) {
    extra.push(...(await duckInstant(query)))
  }
  if (extra.filter((s) => s.url).length < 2) {
    extra.push(...(await wikipedia(query)))
  }
  if (product) extra.push(...compareShopSources(query))
  extra.sort((a, b) => shopRank(a.url) - shopRank(b.url))
  return mergeResearchSources(research, extra, query)
}

async function duckDuckGo(query: string): Promise<ResearchSource[]> {
  const q = encodeURIComponent(query.slice(0, 120))
  try {
    const { status, text } = await getText(`https://html.duckduckgo.com/html/?q=${q}&kl=de-de`, {
      Accept: 'text/html',
      'User-Agent': UA,
    })
    if (status < 200 || status >= 400 || !text) return []
    return sourcesFromHtml(text)
  } catch {
    return []
  }
}

async function duckInstant(query: string): Promise<ResearchSource[]> {
  const q = encodeURIComponent(query.slice(0, 80))
  const url = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`
  try {
    const { status, json } = await getJson(url, { Accept: 'application/json', 'User-Agent': UA })
    if (status < 200 || status >= 400) return []
    const abstract = String(json.AbstractText || json.Abstract || '').trim()
    const href = String(json.AbstractURL || json.AbstractSource || '').trim()
    const now = new Date().toISOString()
    const out: ResearchSource[] = []
    if (abstract) {
      out.push({
        title: String(json.Heading || query),
        url: /^https?:/i.test(href) ? href : `https://duckduckgo.com/?q=${q}`,
        snippet: abstract.slice(0, 280),
        provider: 'duckduckgo_ia',
        retrieved_at: now,
      })
    }
    const related = json.RelatedTopics
    if (Array.isArray(related)) {
      for (const row of related.slice(0, 3)) {
        if (!row || typeof row !== 'object') continue
        const item = row as { FirstURL?: string; Text?: string }
        const link = String(item.FirstURL || '')
        if (!link) continue
        out.push({
          title: String(item.Text || 'Thema').slice(0, 80),
          url: link,
          snippet: String(item.Text || '').slice(0, 180),
          provider: 'duckduckgo',
          retrieved_at: now,
        })
      }
    }
    return out
  } catch {
    return []
  }
}

async function wikipedia(query: string): Promise<ResearchSource[]> {
  const q = encodeURIComponent(query.slice(0, 80))
  const url = `https://de.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=4&namespace=0&format=json`
  try {
    const { status, text } = await getText(url, { Accept: 'application/json', 'User-Agent': UA })
    if (status < 200 || status >= 400 || !text) return []
    const data = JSON.parse(text) as unknown
    if (!Array.isArray(data) || !Array.isArray(data[1]) || !Array.isArray(data[3])) return []
    const titles = data[1] as unknown[]
    const urls = data[3] as unknown[]
    const now = new Date().toISOString()
    const out: ResearchSource[] = []
    for (let i = 0; i < urls.length; i += 1) {
      const href = String(urls[i] || '')
      if (!href) continue
      out.push({
        title: String(titles[i] || 'Wikipedia'),
        url: href,
        snippet: '',
        provider: 'wikipedia',
        retrieved_at: now,
      })
    }
    return out
  } catch {
    return []
  }
}

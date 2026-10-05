import { getJson, getText } from './http-json'
import {
  compareDiscountSources,
  compareShopSources,
  isFactLookup,
  isProductLookup,
  mergeResearchSources,
  researchQuery,
  shopRank,
  sourcesFromHtml,
  sourcesFromText,
  type ResearchMeta,
  type ResearchSource,
} from './research-parse'
import { loadSettings } from './store'

const UA = 'Jarvis/2.0.0 (local.jarvis.app)'
const DDG_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Jarvis/2.0.0'

export async function fillResearchLinks(
  queryText: string,
  answer: string,
  research?: ResearchMeta,
): Promise<ResearchMeta> {
  const query = researchQuery(research?.query || queryText)
  const discount = Boolean(loadSettings().shop_discount)
  const product = isProductLookup(queryText, discount) || isProductLookup(query, discount)
  const extra: ResearchSource[] = [
    ...sourcesFromText(answer),
    ...(research?.sources || []),
  ]
  const fact = isFactLookup(queryText) || isFactLookup(query)
  const need = product ? 3 : fact ? 3 : 2
  if (extra.filter((s) => s.url).length < need || (fact && extra.filter((s) => (s.snippet || '').length > 40).length < 1)) {
    const searches = product
      ? discount
        ? [query, `${query} Preis Vergleich`, `${query} Gutschein Rabatt`]
        : [query, `${query} Preis Vergleich`]
      : fact
        ? [query, `${query} Statistik`, `${query} Geschäftsbericht`]
        : [query]
    const found = await Promise.all(searches.map((q) => duckDuckGo(q)))
    extra.push(...found.flat())
  }
  if (extra.filter((s) => s.url && s.snippet).length < 1) {
    extra.push(...(await duckInstant(query)))
  }
  if (extra.filter((s) => s.url).length < 2 || (fact && extra.filter((s) => (s.snippet || '').length > 40).length < 1)) {
    extra.push(...(await wikipedia(fact ? companyHint(query) : query)))
  }
  if (product) extra.push(...compareShopSources(query))
  if (product && discount) extra.push(...compareDiscountSources(query))
  extra.sort((a, b) => shopRank(a.url) - shopRank(b.url))
  return mergeResearchSources(research, extra, query)
}

async function duckDuckGo(query: string): Promise<ResearchSource[]> {
  const q = encodeURIComponent(query.slice(0, 120))
  try {
    const { status, text } = await getText(`https://html.duckduckgo.com/html/?q=${q}&kl=de-de`, {
      Accept: 'text/html',
      'User-Agent': DDG_UA,
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
    for (let i = 0; i < Math.min(urls.length, 2); i += 1) {
      const href = String(urls[i] || '')
      if (!href) continue
      const title = String(titles[i] || 'Wikipedia')
      const snippet = await wikiExtract(title)
      out.push({
        title,
        url: href,
        snippet,
        provider: 'wikipedia',
        retrieved_at: now,
      })
    }
    return out
  } catch {
    return []
  }
}

function companyHint(q: string): string {
  const skip = /^(wie|was|wer|wo|wann|wieso|weshalb|viele|viel|am|tag|pro|der|die|das|ein|eine)$/i
  const words = q.split(/\s+/)
  for (let i = words.length - 1; i >= 0; i -= 1) {
    const w = words[i].replace(/[?.!,]/g, '')
    if (w.length >= 3 && !skip.test(w) && /^[A-ZÄÖÜ]/.test(w)) return w
  }
  return q
}

async function wikiExtract(title: string): Promise<string> {
  const q = encodeURIComponent(title.slice(0, 80))
  const url = `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${q}&format=json`
  try {
    const { status, json } = await getJson(url, { Accept: 'application/json', 'User-Agent': UA })
    if (status < 200 || status >= 400) return ''
    const pages =
      json?.query && typeof json.query === 'object'
        ? (json.query as { pages?: Record<string, { extract?: string }> }).pages
        : undefined
    if (!pages) return ''
    for (const page of Object.values(pages)) {
      const extract = String(page?.extract || '')
        .replace(/\s+/g, ' ')
        .trim()
      if (extract) return extract.slice(0, 400)
    }
  } catch {
    /* Extract ist optional */
  }
  return ''
}

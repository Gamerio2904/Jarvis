import { getText } from './http-json'
import {
  mergeResearchSources,
  researchQuery,
  sourcesFromHtml,
  sourcesFromText,
  type ResearchMeta,
  type ResearchSource,
} from './research-parse'

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Jarvis/1.29'

export async function fillResearchLinks(
  queryText: string,
  answer: string,
  research?: ResearchMeta,
): Promise<ResearchMeta> {
  const query = researchQuery(research?.query || queryText)
  const extra: ResearchSource[] = [
    ...sourcesFromText(answer),
    ...(research?.sources || []),
  ]
  if (extra.filter((s) => s.url).length < 2) {
    extra.push(...(await duckDuckGo(query)))
  }
  if (extra.filter((s) => s.url).length < 2) {
    extra.push(...(await wikipedia(query)))
  }
  return mergeResearchSources(research, extra, query)
}

async function duckDuckGo(query: string): Promise<ResearchSource[]> {
  const q = encodeURIComponent(query.slice(0, 120))
  try {
    const { status, text } = await getText(`https://html.duckduckgo.com/html/?q=${q}`, {
      Accept: 'text/html',
      'User-Agent': UA,
    })
    if (status < 200 || status >= 400 || !text) return []
    return sourcesFromHtml(text)
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

import { getJson } from './http-json.ts'
import { jsonUA } from './ua.ts'
import { ovenCelsiusFromText, type CookRecipe } from './recipe-ld.ts'

const UA = jsonUA
const API = 'https://de.wikibooks.org/w/api.php'

export function cookbookHistoryUrl(title: string): string {
  const t = title.replace(/ /g, '_')
  return `https://de.wikibooks.org/w/index.php?title=${encodeURIComponent(t)}&action=history`
}

export function parseCookbookExtract(title: string, extract: string, pageUrl: string): CookRecipe | null {
  const text = extract.replace(/\r/g, '').trim()
  if (!text) return null
  const section = (name: string) =>
    new RegExp(
      `(?:^|\\n)(?:#{1,3}|={2,3})\\s*${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n(?:#{1,3}|={2,3})\\s|\\n==|$)`,
      'i',
    ).exec(`\n${text}`)
  const zutaten = section('zutaten')
  const zubereitung = section('zubereitung')
  const ing = (zutaten?.[1] || '')
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter((l) => l.length >= 2 && !/^variante/i.test(l))
  const steps = (zubereitung?.[1] || '')
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter((l) => l.length >= 2 && !/^variante/i.test(l))
  if (!ing.length && !steps.length) return null
  const timeBits = `${zutaten?.[1] || ''}\n${zubereitung?.[1] || ''}`
  const minM = /(\d{1,3})\s*min(?:uten)?\b/i.exec(timeBits)
  const portion =
    /zutaten\s+für\s+(\d+)\s+personen/i.exec(text) || /(?:^|\n)portion(?:en)?:?\s*(\d+)/i.exec(text)
  return {
    title: title.replace(/^Kochbuch\/\s*/i, ''),
    url: pageUrl,
    credit: `Laut Wikibooks Kochbuch / ${title.replace(/^Kochbuch\/\s*/i, '')} (CC-BY-SA, Autoren: ${cookbookHistoryUrl(title)})`,
    prepMin: minM ? Number(minM[1]) : null,
    cookMin: null,
    totalMin: null,
    ovenC: ovenCelsiusFromText(text),
    yieldText: portion ? `${portion[1]} Personen` : '',
    ingredients: ing,
    steps,
  }
}

export async function searchWikibooksCookbook(ingredients: string[]): Promise<CookRecipe | null> {
  const q = ['Kochbuch', ...ingredients.slice(0, 4)].join(' ').slice(0, 80)
  const searchUrl = `${API}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=0&srlimit=8&format=json`
  try {
    const { status, json } = await getJson(searchUrl, UA)
    if (status < 200 || status >= 300) return null
    const hits = (json.query as { search?: Array<{ title?: string }> } | undefined)?.search || []
    const title = hits.map((h) => String(h.title || '')).find((t) => /^Kochbuch\//i.test(t) && !/Kategorie:/i.test(t))
    if (!title) return null
    return loadWikibooksPage(title)
  } catch {
    return null
  }
}

export async function loadWikibooksPage(title: string): Promise<CookRecipe | null> {
  const url = `${API}?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&format=json`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return null
    const pages = (json.query as { pages?: Record<string, { title?: string; extract?: string }> } | undefined)
      ?.pages
    const row = pages ? Object.values(pages)[0] : undefined
    const extract = String(row?.extract || '')
    const pageTitle = String(row?.title || title)
    const pageUrl = `https://de.wikibooks.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
    return parseCookbookExtract(pageTitle, extract, pageUrl)
  } catch {
    return null
  }
}

import { getJson, getText } from './http-json.ts'
import { jsonUA } from './ua.ts'
import { fillResearchLinks } from './web-search.ts'
import { formatResearchReply, researchHasSources, type ResearchMeta, type ResearchSource } from './research-parse.ts'
import { parseNewsIntent, placeInHeadline } from './news-parse.ts'
import type { ToolMeta } from './tools.ts'
import { saveSettings } from './store.ts'

export { parseNewsIntent, placeInHeadline } from './news-parse.ts'

const UA = jsonUA
const TS = 'https://www.tagesschau.de/api2u'
/** Fest eingetragen — keine freie Website. Vite-Proxy kennt rss.dw.com. */
const DW_RSS = 'https://rss.dw.com/xml/rss-de-top'

export async function handleNews(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; research?: ResearchMeta; lastTool?: string }> {
  const intent = parseNewsIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'place') {
    const local = await tagesschauSearch(intent.place)
    if (local.hits.length) {
      return pack(`Zur Lage in ${intent.place}: ${local.hits.join(' ')}`, local.sources, intent.place)
    }
    const web = await fillResearchLinks(`${intent.place} heute Nachrichten`, '', {
      query: `${intent.place} heute`,
      used: false,
      status: 'empty',
      sources: [],
    })
    if (researchHasSources(web)) {
      const body = formatResearchReply(`${intent.place} heute`, web.sources || [], false)
      return {
        handled: true,
        reply: `Die Tagesschau erwähnt ${intent.place} nicht. Aus dem Netz: ${body}`,
        research: { ...web, status_label: 'Ort · Netz' },
        tool: { tool_status: 'executed', tool: 'news', action: 'web', label: 'Nachrichten' },
        lastTool: 'news',
      }
    }
    return {
      handled: true,
      reply: `Zur Lage in ${intent.place} sagt die Tagesschau nichts, im Netz ebenfalls kein klarer Treffer. Eine Lokalnachricht würde ich nicht erfinden.`,
      tool: { tool_status: 'executed', tool: 'news', action: 'empty', label: 'Nichts gefunden' },
      lastTool: 'news',
    }
  }

  const national = await fetchTagesschauHome(false)
  if (!national.hits.length) {
    return {
      handled: true,
      reply: 'Die Tagesschau ist gerade nicht da. Meldungen würde ich nicht erfinden.',
      tool: { tool_status: 'error', tool: 'news', action: 'fetch', label: 'Nachrichten fehlen' },
      lastTool: 'news',
    }
  }
  return pack(`Die Lage laut Tagesschau: ${national.hits.join(' ')}`, national.sources, 'Tagesschau')
}

function pack(
  reply: string,
  sources: ResearchSource[],
  query: string,
): { handled: boolean; reply: string; tool: ToolMeta; research: ResearchMeta; lastTool: string } {
  saveSettings({ last_news_line: reply.slice(0, 220) })
  return {
    handled: true,
    reply,
    research: {
      used: true,
      status: 'ok',
      status_label: 'Tagesschau',
      query,
      sources,
      privacy_note: 'Meldungen von tagesschau.de, kein Raten.',
    },
    tool: { tool_status: 'executed', tool: 'news', action: 'list', label: 'Nachrichten' },
    lastTool: 'news',
  }
}

export async function fetchTagesschauHome(
  bust = false,
): Promise<{ hits: string[]; sources: ResearchSource[] }> {
  try {
    const url = bust ? `${TS}/news?_=${Date.now()}` : `${TS}/news`
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return { hits: [], sources: [] }
    const news = (json.news as Array<Record<string, unknown>> | undefined) || []
    return take(news, 3)
  } catch {
    return { hits: [], sources: [] }
  }
}

export function parseDwRss(xml: string): { hits: string[]; sources: ResearchSource[] } {
  const now = new Date().toISOString()
  const hits: string[] = []
  const sources: ResearchSource[] = []
  const items = xml.split(/<item[\s>]/i).slice(1)
  for (const raw of items) {
    if (hits.length >= 3) break
    const title = String(raw.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!title) continue
    const link = String(raw.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '')
      .replace(/<[^>]+>/g, '')
      .trim()
    hits.push(`${title}.`)
    if (link.startsWith('http')) {
      sources.push({ title, url: link, snippet: title, provider: 'dw', retrieved_at: now })
    }
  }
  return { hits, sources }
}

export async function fetchDwHome(): Promise<{ hits: string[]; sources: ResearchSource[] }> {
  try {
    const { status, text } = await getText(DW_RSS, UA)
    if (status < 200 || status >= 300 || !text) return { hits: [], sources: [] }
    return parseDwRss(text)
  } catch {
    return { hits: [], sources: [] }
  }
}

export async function tagesschauSearch(place: string): Promise<{ hits: string[]; sources: ResearchSource[] }> {
  try {
    const q = new URLSearchParams({ searchText: place })
    const { status, json } = await getJson(`${TS}/search?${q}`, UA)
    if (status < 200 || status >= 300) return { hits: [], sources: [] }
    const rows = (json.searchResults as Array<Record<string, unknown>> | undefined) || []
    const tight = rows.filter((r) =>
      placeInHeadline(place, String(r.title || ''), String(r.teaser || r.firstSentence || '')),
    )
    return take(tight, 3)
  } catch {
    return { hits: [], sources: [] }
  }
}

function take(rows: Array<Record<string, unknown>>, n: number): { hits: string[]; sources: ResearchSource[] } {
  const now = new Date().toISOString()
  const hits: string[] = []
  const sources: ResearchSource[] = []
  for (const r of rows) {
    if (hits.length >= n) break
    if (String(r.type || '') === 'video' && !r.title) continue
    const title = String(r.title || '')
      .replace(/^\s*\d+[.)]\s*/, '')
      .trim()
    if (!title) continue
    const teaser = String(r.firstSentence || r.teaser || '').trim()
    const url = String(r.shareURL || r.details || '').trim()
    hits.push(teaser ? `${title}. ${teaser.slice(0, 140)}` : `${title}.`)
    if (url) {
      sources.push({
        title,
        url: url.startsWith('http') ? url : `https://www.tagesschau.de${url.startsWith('/') ? '' : '/'}${url}`,
        snippet: teaser.slice(0, 200),
        provider: 'tagesschau',
        retrieved_at: now,
      })
    }
  }
  return { hits, sources }
}

import type { ChatBlock } from './chat-blocks.ts'
import { getJson, getText } from './http-json.ts'
import { parseImageAsk, safeImageSrc, type ImageAsk } from './image-parse.ts'
import { seasonYears } from './sport.ts'
import type { ToolMeta } from './tools.ts'
import { jsonUA } from './ua.ts'

const NONE = 'Kein Bild geladen.'

export function wikiTitle(q: string): string {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function thumbFromSummary(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (o.type === 'disambiguation') return null
  const thumb = o.thumbnail
  const original = o.originalimage
  const fromThumb = thumb && typeof thumb === 'object' ? String((thumb as { source?: string }).source || '') : ''
  const fromOriginal =
    original && typeof original === 'object' ? String((original as { source?: string }).source || '') : ''
  return safeImageSrc(fromThumb) || safeImageSrc(fromOriginal)
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function crestFromTeams(rows: unknown, query: string): string | null {
  if (!Array.isArray(rows)) return null
  const tokens = fold(query)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(?:fc|sc|sv|tsv|tsg|rb|club|verein)$/.test(w))
  if (!tokens.length) return null
  let best: { url: string; hits: number } | null = null
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const name = fold(`${o.teamName || ''} ${o.shortName || ''}`)
    const hits = tokens.filter((t) => name.includes(t)).length
    if (hits !== tokens.length) continue
    const url = safeImageSrc(String(o.teamIconUrl || ''))
    if (!url) continue
    if (!best || hits > best.hits) best = { url, hits }
  }
  return best?.url || null
}

async function wikiThumb(q: string): Promise<string | null> {
  const title = encodeURIComponent(wikiTitle(q))
  for (const host of ['de.wikipedia.org', 'en.wikipedia.org']) {
    try {
      const { status, json } = await getJson(`https://${host}/api/rest_v1/page/summary/${title}`, jsonUA)
      if (status < 200 || status >= 300) continue
      const src = thumbFromSummary(json)
      if (src) return src
    } catch {
      /* nächster Host */
    }
  }
  return null
}

async function crestUrl(q: string): Promise<string | null> {
  for (const year of seasonYears()) {
    for (const league of ['bl1', 'bl2']) {
      try {
        const { status, text } = await getText(`https://api.openligadb.de/getavailableteams/${league}/${year}`, jsonUA)
        if (status < 200 || status >= 300 || !text) continue
        const src = crestFromTeams(JSON.parse(text) as unknown, q)
        if (src) return src
      } catch {
        /* nächste Liga */
      }
    }
  }
  return null
}

export async function handleImage(
  ask: ImageAsk,
): Promise<{ handled: boolean; reply: string; tool: ToolMeta; lastTool: string; blocks?: ChatBlock[] }> {
  const src = ask.kind === 'crest' ? await crestUrl(ask.q) : await wikiThumb(ask.q)
  const tool: ToolMeta = { tool_status: 'executed', tool: 'search', action: 'image', label: 'Bild' }
  if (!src) return { handled: true, reply: NONE, tool, lastTool: 'search' }
  const source = ask.kind === 'crest' ? 'OpenLigaDB' : 'Wikipedia'
  return {
    handled: true,
    reply: `Bild: ${ask.q}.`,
    tool,
    lastTool: 'search',
    blocks: [{ kind: 'image', src, alt: ask.q, source }],
  }
}

export async function handleImageAsk(text: string) {
  const ask = parseImageAsk(text)
  if (!ask) return null
  return handleImage(ask)
}

import { getText } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'
import type { ResearchMeta } from './research-parse.ts'

const UA = { Accept: 'text/html', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }

export type LawIntent = { query: string }

export function parseLawIntent(text: string): LawIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (
    !/\b(kündigungsfrist|mietrecht|bgb|gesetz(?:estext)?|was\s+steht\s+im\s+gesetz|paragraph|darf\s+ich\s+im\s+park\s+grillen|grillverbot)\b/i.test(
      t,
    )
  ) {
    return null
  }
  if (/\b(wecker|timer|wetter|fernseh)\b/i.test(t)) return null
  return { query: t.slice(0, 100) }
}

export async function handleLaw(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string; research?: ResearchMeta }> {
  const intent = parseLawIntent(text)
  if (!intent) return { handled: false }
  const wiki = await wikiHit(intent.query)
  const link = 'https://www.gesetze-im-internet.de/'
  if (!wiki) {
    return {
      handled: true,
      reply: `Einen passenden Gesetzestext habe ich nicht gefunden. Nachschlagen: ${link} Das ist kein Anwaltsrat.`,
      tool: { tool_status: 'executed', tool: 'law', action: 'empty', label: 'Recht' },
      lastTool: 'law',
    }
  }
  const extra = /\bpark\b/i.test(intent.query)
    ? ' Ob Grillen im Park erlaubt ist, steht in der örtlichen Grünanlagenverordnung, nicht in einem Bundesgesetz.'
    : ''
  return {
    handled: true,
    reply: `${wiki.extract}${extra} ${wiki.url} Gesetzestexte: ${link} Das ist kein Anwaltsrat.`,
    tool: { tool_status: 'executed', tool: 'law', action: 'lookup', label: 'Recht' },
    lastTool: 'law',
    research: {
      used: true,
      status: 'ok',
      query: intent.query,
      sources: [
        {
          title: wiki.title,
          url: wiki.url,
          snippet: wiki.extract.slice(0, 180),
          provider: 'wikipedia',
          retrieved_at: new Date().toISOString(),
        },
      ],
      privacy_note: 'Wikipedia plus Link zu gesetze-im-internet.de. Kein Mandat.',
    },
  }
}

const LAW_SKIP_TITLE =
  /\b(darf ich bitten|casting|talentshow|schlager|sat\.1|rtl|prosieben|castingshow)\b/i
const LAW_SKIP_PAGE = /^(liste der|westpark|mainz-|covid-19)/i
const LAW_KEEP =
  /\b(grill(?:en|verbot)?|park|verbot|gesetz|ordnung|vorschrift|bußgeld|bussgeld|ordnungsamt|grünfläche|gruenflaeche|waldgesetz)\b/i

export function lawWikiQuery(q: string): string {
  if (/\bgrillen\b/i.test(q) || /\bgrillverbot\b/i.test(q)) return 'Grillverbot'
  return q
}

export function isLawWikiTitle(title: string, snippet = ''): boolean {
  if (LAW_SKIP_PAGE.test(title) || /straßen und plätze/i.test(title)) return false
  const blob = `${title} ${snippet}`
  if (LAW_SKIP_TITLE.test(blob)) return false
  if (LAW_KEEP.test(blob)) return true
  return /gesetz|verordnung|ordnung|verbot/i.test(title)
}

export function lawWikiTitleScore(title: string, snippet = ''): number {
  if (!isLawWikiTitle(title, snippet)) return -1
  const t = title.toLowerCase()
  if (t === 'grillverbot' || t === 'grillen') return 10
  if (/grillverbot|grünanlagenverordnung|gruenanlagenverordnung/.test(t)) return 8
  if (/gesetz|verordnung|verbot/.test(t)) return 6
  return 3
}

function wikiPageUrl(title: string): string {
  return `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
}

function cleanWikiSnippet(raw: string): string {
  return raw.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}

async function wikiExtract(title: string): Promise<string> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&utf8=&format=json`
  try {
    const { status, text } = await getText(url, { Accept: 'application/json', 'User-Agent': UA['User-Agent'] })
    if (status < 200 || status >= 300 || !text) return ''
    const data = JSON.parse(text) as { query?: { pages?: Record<string, { extract?: string }> } }
    const page = Object.values(data.query?.pages || {})[0]
    return String(page?.extract || '').replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

async function wikiHit(q: string): Promise<{ title: string; extract: string; url: string } | null> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(lawWikiQuery(q))}&utf8=&format=json`
  try {
    const { status, text } = await getText(url, { Accept: 'application/json', 'User-Agent': UA['User-Agent'] })
    if (status < 200 || status >= 300 || !text) return null
    const data = JSON.parse(text) as { query?: { search?: Array<{ title?: string; snippet?: string }> } }
    const rows = (data.query?.search || [])
      .map((r) => ({
        title: String(r.title || '').trim(),
        snippet: cleanWikiSnippet(String(r.snippet || '')),
        score: lawWikiTitleScore(String(r.title || ''), String(r.snippet || '')),
      }))
      .filter((r) => r.title && r.score >= 0)
      .sort((a, b) => b.score - a.score)
    const row = rows[0]
    if (!row) return null
    const extract = (await wikiExtract(row.title)) || row.snippet || row.title
    return {
      title: row.title,
      extract: extract.slice(0, 280),
      url: wikiPageUrl(row.title),
    }
  } catch {
    return null
  }
}

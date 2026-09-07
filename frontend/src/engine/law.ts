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
  return {
    handled: true,
    reply: `${wiki.extract} ${wiki.url} Gesetzestexte: ${link} Das ist kein Anwaltsrat.`,
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
const LAW_KEEP =
  /\b(grill|park|verbot|gesetz|ordnung|vorschrift|bußgeld|bussgeld|ordnungsamt|grünfläche|gruenflaeche|waldgesetz)\b/i

export function lawWikiQuery(q: string): string {
  if (/\bgrillen\b/i.test(q) || /\bgrillverbot\b/i.test(q)) return 'Grillverbot Park Grünanlage Ordnung'
  return q
}

export function isLawWikiTitle(title: string, snippet = ''): boolean {
  const blob = `${title} ${snippet}`
  if (LAW_SKIP_TITLE.test(blob)) return false
  if (LAW_KEEP.test(blob)) return true
  return /gesetz|verordnung|ordnung|verbot/i.test(title)
}

async function wikiHit(q: string): Promise<{ title: string; extract: string; url: string } | null> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(lawWikiQuery(q))}&utf8=&format=json`
  try {
    const { status, text } = await getText(url, { Accept: 'application/json', 'User-Agent': UA['User-Agent'] })
    if (status < 200 || status >= 300 || !text) return null
    const data = JSON.parse(text) as { query?: { search?: Array<{ title?: string; snippet?: string }> } }
    const rows = data.query?.search || []
    const row = rows.find((r) => isLawWikiTitle(String(r.title || ''), String(r.snippet || '')))
    const title = String(row?.title || '').trim()
    if (!title) return null
    const snippet = String(row?.snippet || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .trim()
    return {
      title,
      extract: snippet.slice(0, 220) || title,
      url: `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    }
  } catch {
    return null
  }
}

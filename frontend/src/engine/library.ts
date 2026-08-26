import { getJson } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.18.1 (local.jarvis.app)' }

export type LibraryIntent = { query: string }

export function parseLibraryIntent(text: string): LibraryIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const m =
    /(?:was\s+ist\s+das\s+für\s+ein\s+buch|open\s+library|wer\s+schrieb|autor\s+von|buchinfo)\s*[: -]?\s*(.*)$/i.exec(
      t,
    )
  if (!m && !/\b(isbn)\b/i.test(t)) return null
  const q = (m?.[1] || t).replace(/^(was\s+ist\s+das\s+für\s+ein\s+buch|buchinfo|isbn)\s*/i, '').trim()
  if (!q) return { query: '' }
  if (/\b(wetter|fernseh|wecker)\b/i.test(q)) return null
  return { query: q.slice(0, 80) }
}

export async function handleLibrary(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseLibraryIntent(text)
  if (!intent) return { handled: false }
  if (!intent.query) {
    return {
      handled: true,
      reply: 'Titel oder ISBN sagen. Ohne Treffer erfinde ich kein Buch.',
      tool: { tool_status: 'executed', tool: 'library', action: 'ask', label: 'Buch' },
      lastTool: 'library',
    }
  }
  const hit = await searchBook(intent.query)
  if (!hit) {
    return {
      handled: true,
      reply: `Open Library kennt „${intent.query}“ so nicht.`,
      tool: { tool_status: 'executed', tool: 'library', action: 'empty', label: 'Kein Treffer' },
      lastTool: 'library',
    }
  }
  return {
    handled: true,
    reply: `${hit.title}${hit.author ? ` von ${hit.author}` : ''}${hit.year ? `, ${hit.year}` : ''}. ${hit.url}`,
    tool: { tool_status: 'executed', tool: 'library', action: 'lookup', label: 'Buch' },
    lastTool: 'library',
  }
}

async function searchBook(q: string): Promise<{ title: string; author: string; year: string; url: string } | null> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return null
    const docs = Array.isArray(json.docs) ? json.docs : []
    const row = docs[0] as Record<string, unknown> | undefined
    if (!row) return null
    const title = String(row.title || '').trim()
    if (!title) return null
    const authors = Array.isArray(row.author_name) ? row.author_name.map(String) : []
    const key = String(row.key || '').trim()
    return {
      title,
      author: authors[0] || '',
      year: String(row.first_publish_year || ''),
      url: key ? `https://openlibrary.org${key}` : 'https://openlibrary.org/',
    }
  } catch {
    return null
  }
}

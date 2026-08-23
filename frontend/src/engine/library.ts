import { parseLibraryIntent } from './library-parse'
import { getJson } from './http-json'
import { latestEye } from './tablet'
import type { ToolMeta } from './tools'

export { parseLibraryIntent } from './library-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.0 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'library', action, label }
}

export async function handleLibrary(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseLibraryIntent(text)
  if (!intent) return { handled: false }
  const q = (intent.query || latestEye()?.caption || '').trim()
  if (!q) {
    return {
      handled: true,
      reply: 'Welcher Titel oder Autor? Ohne Namen suche ich Open Library nicht und rate kein Buch.',
      tool: tool('ask', 'Buch'),
      lastTool: 'library',
    }
  }
  try {
    const { status, json } = await getJson(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`,
      UA,
    )
    const docs = Array.isArray((json as { docs?: unknown }).docs)
      ? ((json as { docs: Array<Record<string, unknown>> }).docs)
      : []
    if (status < 200 || status >= 300 || !docs.length) {
      return {
        handled: true,
        reply: `Open Library hat zu „${q}“ keinen Treffer. Ich erfinde kein Buch.`,
        tool: tool('empty', 'Kein Buch'),
        lastTool: 'library',
      }
    }
    const d = docs[0]
    const title = String(d.title || q)
    const author = Array.isArray(d.author_name) ? String(d.author_name[0] || '') : ''
    const year = d.first_publish_year ? String(d.first_publish_year) : ''
    const key = String(d.key || '')
    const href = key ? `https://openlibrary.org${key}` : 'https://openlibrary.org'
    const who = author ? ` von ${author}` : ''
    const when = year ? `, ${year}` : ''
    return {
      handled: true,
      reply: `${title}${who}${when}. Open Library: ${href}`,
      tool: tool('lookup', title),
      lastTool: 'library',
    }
  } catch {
    return {
      handled: true,
      reply: 'Open Library antwortet gerade nicht. Ich rate den Titel nicht.',
      tool: tool('error', 'Library fehlt'),
      lastTool: 'library',
    }
  }
}

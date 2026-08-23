import { parseFerienIntent } from './ferien-parse'
import { landFromText, landName } from './land-de'
import { getText } from './http-json'
import { loadSettings } from './store'
import type { ToolMeta } from './tools'

export { parseFerienIntent } from './ferien-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }

type Row = { start: string; end: string; name?: string; stateCode?: string }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'ferien', action, label }
}

export async function handleFerien(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFerienIntent(text)
  if (!intent) return { handled: false }
  const land = intent.land || landFromText(loadSettings().last_place || '')?.api
  if (!land) {
    return {
      handled: true,
      reply: 'Welches Bundesland? Zum Beispiel Baden-Württemberg oder Bayern. Ohne Land rate ich keine Ferien.',
      tool: tool('ask', 'Land fehlt'),
      lastTool: 'ferien',
    }
  }
  const year = new Date().getFullYear()
  const rows = [...(await loadYear(land, year)), ...(await loadYear(land, year + 1))]
  if (!rows.length) {
    return {
      handled: true,
      reply: `Die Ferienliste für ${landName(land)} ist gerade nicht da. Ich rate nicht.`,
      tool: tool('error', 'Ferien fehlen'),
      lastTool: 'ferien',
    }
  }
  const today = isoDate(new Date())
  const current = rows.find((r) => r.start <= today && r.end >= today)
  if (intent.kind === 'now') {
    if (current) {
      return {
        handled: true,
        reply: `Ja. In ${landName(land)} sind ${label(current)} — ${fmt(current.start)} bis ${fmt(current.end)}. Quelle: Ferien-API.`,
        tool: tool('now', 'Schulferien'),
        lastTool: 'ferien',
      }
    }
    const next = rows.find((r) => r.start > today)
    return {
      handled: true,
      reply: next
        ? `In ${landName(land)} sind gerade keine Schulferien. Als Nächstes ${label(next)}, ${fmt(next.start)} bis ${fmt(next.end)}.`
        : `In ${landName(land)} sind gerade keine Schulferien in der Liste.`,
      tool: tool('now', 'Keine Ferien'),
      lastTool: 'ferien',
    }
  }
  const next = rows.find((r) => r.start > today) || current
  if (!next) {
    return {
      handled: true,
      reply: `Einen nächsten Ferientermin für ${landName(land)} habe ich nicht.`,
      tool: tool('next', 'Leer'),
      lastTool: 'ferien',
    }
  }
  return {
    handled: true,
    reply: `Nächste Ferien in ${landName(land)}: ${label(next)}, ${fmt(next.start)} bis ${fmt(next.end)}.`,
    tool: tool('next', 'Schulferien'),
    lastTool: 'ferien',
  }
}

async function loadYear(api: string, year: number): Promise<Row[]> {
  try {
    const { status, text } = await getText(`https://ferien-api.de/api/v1/holidays/${api}/${year}`, UA)
    if (status < 200 || status >= 300 || !text) return []
    const parsed = JSON.parse(text) as unknown
    const rows = Array.isArray(parsed) ? (parsed as Row[]) : []
    return rows.filter((r) => r?.start && r?.end).map((r) => ({ start: r.start.slice(0, 10), end: r.end.slice(0, 10), name: r.name }))
  } catch {
    return []
  }
}

function label(r: Row): string {
  return (r.name || 'Schulferien').replace(/\s+\d{4}$/, '')
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
}

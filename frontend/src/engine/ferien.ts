import { getText } from './http-json.ts'
import { loadSettings } from './store.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }

const LAND: Record<string, string> = {
  bw: 'BW',
  'baden-württemberg': 'BW',
  'baden württemberg': 'BW',
  bayern: 'BY',
  by: 'BY',
  berlin: 'BE',
  be: 'BE',
  brandenburg: 'BB',
  bb: 'BB',
  bremen: 'HB',
  hb: 'HB',
  hamburg: 'HH',
  hh: 'HH',
  hessen: 'HE',
  he: 'HE',
  mv: 'MV',
  'mecklenburg-vorpommern': 'MV',
  niedersachsen: 'NI',
  ni: 'NI',
  nrw: 'NW',
  nordrhein: 'NW',
  nw: 'NW',
  rlp: 'RP',
  'rheinland-pfalz': 'RP',
  rp: 'RP',
  saarland: 'SL',
  sl: 'SL',
  sachsen: 'SN',
  sn: 'SN',
  'sachsen-anhalt': 'ST',
  st: 'ST',
  sh: 'SH',
  'schleswig-holstein': 'SH',
  thüringen: 'TH',
  th: 'TH',
}

export type FerienIntent = { land: string }

export function parseFerienIntent(text: string, lastPlace = ''): FerienIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (!/\b(schulferien|ferien)\b/i.test(t)) return null
  if (/\b(urlaub|flug|hotel|wecker|timer)\b/i.test(t)) return null
  const land = landOf(t) || landOf(lastPlace) || 'BW'
  return { land }
}

export async function handleFerien(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFerienIntent(text, loadSettings().last_place || '')
  if (!intent) return { handled: false }
  const year = new Date().getFullYear()
  const rows = await loadFerien(intent.land, year)
  if (!rows.length) {
    return {
      handled: true,
      reply: `Die Ferienliste für ${intent.land} ist gerade nicht da. Ich rate nicht.`,
      tool: { tool_status: 'error', tool: 'ferien', action: 'fetch', label: 'Ferien fehlen' },
      lastTool: 'ferien',
    }
  }
  const today = iso(new Date())
  const now = rows.find((r) => r.start <= today && r.end >= today)
  if (now) {
    return {
      handled: true,
      reply: `In ${intent.land} sind ${now.name}, bis ${fmt(now.end)}.`,
      tool: { tool_status: 'executed', tool: 'ferien', action: 'now', label: 'Ferien' },
      lastTool: 'ferien',
    }
  }
  const next = rows.find((r) => r.start > today)
  return {
    handled: true,
    reply: next
      ? `In ${intent.land} sind gerade keine Schulferien. Als Nächstes ${next.name} ab ${fmt(next.start)}.`
      : `In ${intent.land} stehen in der Liste keine weiteren Schulferien.`,
    tool: { tool_status: 'executed', tool: 'ferien', action: 'next', label: 'Ferien' },
    lastTool: 'ferien',
  }
}

type Row = { name: string; start: string; end: string }

async function loadFerien(land: string, year: number): Promise<Row[]> {
  const url = `https://ferien-api.de/api/v1/holidays/${land}/${year}`
  try {
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) return []
    const data = JSON.parse(text) as unknown
    const arr = Array.isArray(data) ? data : []
    return arr
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const name = String(o.name || o.title || '').trim()
        const start = String(o.start || o.startsOn || '').slice(0, 10)
        const end = String(o.end || o.endsOn || '').slice(0, 10)
        if (!name || !start || !end) return null
        return { name, start, end }
      })
      .filter((r): r is Row => Boolean(r))
  } catch {
    return []
  }
}

function landOf(raw: string): string | null {
  const p = raw.toLowerCase()
  for (const [k, v] of Object.entries(LAND)) {
    if (p.includes(k)) return v
  }
  if (/stuttgart|heilbronn|karlsruhe|mannheim|ingersheim|ulm/.test(p)) return 'BW'
  if (/münchen|muenchen|nürnberg/.test(p)) return 'BY'
  return null
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
  })
}

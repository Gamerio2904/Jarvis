import { getJson } from './http-json'
import { loadSettings } from './store'
import { parseHolidayIntent } from './holiday-parse'
import type { ToolMeta } from './tools'

export { parseHolidayIntent } from './holiday-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/1.48.3 (local.jarvis.app)' }

type Holiday = {
  date: string
  localName: string
  global?: boolean
  counties?: string[] | null
}

export async function handleHoliday(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseHolidayIntent(text)
  if (!intent) return { handled: false }
  const year = new Date().getFullYear()
  const rows = await loadHolidays(year)
  if (!rows.length) {
    return {
      handled: true,
      reply: 'Die Feiertagsliste ist gerade nicht da. Ob frei ist, würde ich nicht raten.',
      tool: { tool_status: 'error', tool: 'holiday', action: 'fetch', label: 'Feiertag fehlt' },
      lastTool: 'holiday',
    }
  }
  const land = landOf(loadSettings().last_place || '')
  const today = isoDate(new Date())
  const tomorrow = isoDate(addDays(new Date(), 1))
  if (intent.kind === 'today') {
    const hit = matchOn(rows, today, land)
    return {
      handled: true,
      reply: hit
        ? `Heute ist ${hit.localName}${where(hit)}.`
        : land
          ? `Heute ist${landLabel(land)} kein gesetzlicher Feiertag.`
          : 'Heute ist kein bundesweiter Feiertag. In einzelnen Ländern kann es anders sein.',
      tool: { tool_status: 'executed', tool: 'holiday', action: 'today', label: 'Feiertag' },
      lastTool: 'holiday',
    }
  }
  if (intent.kind === 'tomorrow') {
    const hit = matchOn(rows, tomorrow, land)
    return {
      handled: true,
      reply: hit
        ? `Morgen ist ${hit.localName}${where(hit)}.`
        : 'Morgen ist kein gesetzlicher Feiertag, soweit die Liste reicht.',
      tool: { tool_status: 'executed', tool: 'holiday', action: 'tomorrow', label: 'Feiertag' },
      lastTool: 'holiday',
    }
  }
  const next = rows.find((h) => h.date >= today && relevant(h, land))
  if (!next) {
    const more = await loadHolidays(year + 1)
    const n = more.find((h) => relevant(h, land))
    return {
      handled: true,
      reply: n ? `Der nächste Feiertag ist ${n.localName}, ${fmt(n.date)}${where(n)}.` : 'Einen nächsten Feiertag habe ich nicht gefunden.',
      tool: { tool_status: 'executed', tool: 'holiday', action: 'next', label: 'Feiertag' },
      lastTool: 'holiday',
    }
  }
  return {
    handled: true,
    reply: `Der nächste Feiertag ist ${next.localName}, ${fmt(next.date)}${where(next)}.`,
    tool: { tool_status: 'executed', tool: 'holiday', action: 'next', label: 'Feiertag' },
    lastTool: 'holiday',
  }
}

async function loadHolidays(year: number): Promise<Holiday[]> {
  try {
    const { status, json } = await getJson(`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`, UA)
    if (status < 200 || status >= 300) return []
    const rows = Array.isArray(json) ? (json as unknown as Holiday[]) : []
    return rows.filter((h) => h?.date && h.localName)
  } catch {
    return []
  }
}

function matchOn(rows: Holiday[], iso: string, land: string | null): Holiday | null {
  return rows.find((h) => h.date === iso && relevant(h, land)) || null
}

function relevant(h: Holiday, land: string | null): boolean {
  if (h.global) return true
  if (!h.counties || !h.counties.length) return true
  if (land && h.counties.includes(land)) return true
  return false
}

function where(h: Holiday): string {
  if (h.global || !h.counties?.length) return ''
  if (h.counties.length >= 8) return ' (mehrere Länder)'
  return ` (${h.counties.map(landName).join(', ')})`
}

function landOf(place: string): string | null {
  const p = place.toLowerCase()
  if (/baden|württemb|wuerttemb|stuttgart|heilbronn|karlsruhe|mannheim|ingersheim|ingesheim|ulm/.test(p)) return 'DE-BW'
  if (/bayern|münchen|muenchen|nürnberg|nuernberg|augsburg/.test(p)) return 'DE-BY'
  if (/berlin/.test(p)) return 'DE-BE'
  if (/hamburg/.test(p)) return 'DE-HH'
  if (/nrw|nordrhein|köln|koeln|düsseldorf|duesseldorf|dortmund|essen/.test(p)) return 'DE-NW'
  if (/hessen|frankfurt|darmstadt|kassel/.test(p)) return 'DE-HE'
  if (/sachsen-anhalt|magdeburg|halle/.test(p)) return 'DE-ST'
  if (/\bsachsen\b|dresden|leipzig/.test(p)) return 'DE-SN'
  if (/thüringen|thueringen|erfurt/.test(p)) return 'DE-TH'
  if (/niedersachsen|hannover|braunschweig/.test(p)) return 'DE-NI'
  if (/rheinland-pfalz|mainz|koblenz/.test(p)) return 'DE-RP'
  if (/saarland|saarbrücken|saarbruecken/.test(p)) return 'DE-SL'
  if (/schleswig|kiel|lübeck|luebeck/.test(p)) return 'DE-SH'
  if (/mecklenburg|rostock|schwerin/.test(p)) return 'DE-MV'
  if (/brandenburg|potsdam/.test(p)) return 'DE-BB'
  if (/bremen/.test(p)) return 'DE-HB'
  return null
}

function landLabel(code: string): string {
  return ` in ${landName(code)}`
}

function landName(code: string): string {
  const map: Record<string, string> = {
    'DE-BW': 'Baden-Württemberg',
    'DE-BY': 'Bayern',
    'DE-BE': 'Berlin',
    'DE-BB': 'Brandenburg',
    'DE-HB': 'Bremen',
    'DE-HH': 'Hamburg',
    'DE-HE': 'Hessen',
    'DE-MV': 'Mecklenburg-Vorpommern',
    'DE-NI': 'Niedersachsen',
    'DE-NW': 'Nordrhein-Westfalen',
    'DE-RP': 'Rheinland-Pfalz',
    'DE-SL': 'Saarland',
    'DE-SN': 'Sachsen',
    'DE-ST': 'Sachsen-Anhalt',
    'DE-SH': 'Schleswig-Holstein',
    'DE-TH': 'Thüringen',
  }
  return map[code] || code
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  return dt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

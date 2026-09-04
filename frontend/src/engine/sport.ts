import { getText } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'
import { saveSettings } from './store.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }

const TEAMS: Record<string, string> = {
  vfb: 'Stuttgart',
  stuttgart: 'Stuttgart',
  bayern: 'Bayern',
  münchen: 'Bayern',
  muenchen: 'Bayern',
  dortmund: 'Dortmund',
  bvb: 'Dortmund',
  leverkusen: 'Leverkusen',
  frankfurt: 'Frankfurt',
  leipzig: 'Leipzig',
  wolfsburg: 'Wolfsburg',
  gladbach: 'Gladbach',
  union: 'Union',
  köln: 'Köln',
  koeln: 'Köln',
  mainz: 'Mainz',
  freiburg: 'Freiburg',
  augsburg: 'Augsburg',
  bremen: 'Bremen',
  hoffenheim: 'Hoffenheim',
  heidenheim: 'Heidenheim',
  'st. pauli': 'St. Pauli',
  pauli: 'St. Pauli',
}

const LEAGUES: Record<string, string> = {
  bundesliga: 'bl1',
  bl1: 'bl1',
  zweite: 'bl2',
  '2. liga': 'bl2',
  bl2: 'bl2',
  dfb: 'dfb',
  pokal: 'dfb',
  champions: 'cl',
}

export type SportIntent = { league: string; team?: string; table?: boolean }

export function parseSportIntent(text: string): SportIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const sportish =
    /\b(bundesliga|spielstand|spielergebnis|wie\s+hat\s+(?:der|die)\s+|ergebnis\s+|dfb[\s-]*pokal|zweite\s+liga)\b/i.test(
      t,
    ) ||
    (/\b(vfb|bayern|bvb|dortmund)\b/i.test(t) && /\b(gespielt|gewonnen|ergebnis|spiel)\b/i.test(t))
  if (!sportish) return null
  if (/\b(wetter|wecker|timer|fernseh)\b/i.test(t)) return null
  let league = 'bl1'
  for (const [k, v] of Object.entries(LEAGUES)) {
    if (t.toLowerCase().includes(k)) league = v
  }
  let team: string | undefined
  const low = t.toLowerCase()
  for (const [k, v] of Object.entries(TEAMS)) {
    if (low.includes(k)) {
      team = v
      break
    }
  }
  const matchAsk = /\b(gespielt|gewonnen|verloren|ergebnis|spielstand|spielergebnis)\b/i.test(t)
  const tableAsk = /\b(steht|tabelle|tabellenstand|punkte|platzierung|rangfolge)\b/i.test(t)
  return { league, team, table: tableAsk && !matchAsk }
}

export async function handleSport(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSportIntent(text)
  if (!intent) return { handled: false }
  if (intent.table && !intent.team) {
    const rows = await loadTable(intent.league)
    if (rows.length) {
      const line = formatTable(rows)
      saveSettings({ last_sport_line: formatTableHud(rows).slice(0, 220) })
      return {
        handled: true,
        reply: `${line}\nOpenLigaDB, kein Tipp.`,
        tool: { tool_status: 'executed', tool: 'sport', action: 'table', label: 'Sport' },
        lastTool: 'sport',
      }
    }
  }
  const matches = await loadMatches(intent.league)
  if (!matches.length) {
    return {
      handled: true,
      reply: 'OpenLigaDB liefert gerade keine Spiele. Einen Stand rate ich nicht.',
      tool: { tool_status: 'error', tool: 'sport', action: 'fetch', label: 'Sport fehlt' },
      lastTool: 'sport',
    }
  }
  const filtered = intent.team
    ? matches.filter(
        (m) =>
          m.home.toLowerCase().includes(intent.team!.toLowerCase()) ||
          m.away.toLowerCase().includes(intent.team!.toLowerCase()),
      )
    : matches
  const use = (filtered.length ? filtered : matches).slice(-3).reverse()
  const line = use
    .map((m) =>
      m.done ? `${m.home} ${m.hs}:${m.as} ${m.away}` : `${m.home} gegen ${m.away}, noch kein Stand`,
    )
    .join('\n')
  saveSettings({ last_sport_line: line.slice(0, 220) })
  return {
    handled: true,
    reply: `${line}\nOpenLigaDB, kein Tipp.`,
    tool: { tool_status: 'executed', tool: 'sport', action: 'score', label: 'Sport' },
    lastTool: 'sport',
  }
}

type Match = { home: string; away: string; hs: number; as: number; done: boolean }

type TableRow = { rank: number; name: string; points: number; gf: number; ga: number; played: number }

/** Kurznamen, damit 18 Zeilen auf dem Handy lesbar bleiben. */
export function shortClub(name: string): string {
  const n = name.trim()
  const known: Array<[RegExp, string]> = [
    [/bayern/i, 'Bayern'],
    [/freiburg/i, 'Freiburg'],
    [/augsburg/i, 'Augsburg'],
    [/leipzig/i, 'Leipzig'],
    [/dortmund/i, 'Dortmund'],
    [/k[oö]ln|koeln/i, 'Köln'],
    [/elversberg/i, 'Elversberg'],
    [/union/i, 'Union'],
    [/frankfurt/i, 'Frankfurt'],
    [/mainz/i, 'Mainz'],
    [/paderborn/i, 'Paderborn'],
    [/leverkusen/i, 'Leverkusen'],
    [/hoffenheim/i, 'Hoffenheim'],
    [/hamburger|hsv\b/i, 'HSV'],
    [/werder|bremen/i, 'Bremen'],
    [/gladbach|mönchengladbach|moenchengladbach/i, 'Gladbach'],
    [/schalke/i, 'Schalke'],
    [/stuttgart|vfb/i, 'Stuttgart'],
    [/heidenheim/i, 'Heidenheim'],
    [/st\.?\s*pauli/i, 'St. Pauli'],
    [/wolfsburg/i, 'Wolfsburg'],
  ]
  for (const [re, short] of known) {
    if (re.test(n)) return short
  }
  return n
    .replace(/^(?:1\.\s*)?(?:fc|sc|sv|tsv|tsg|rb|bayer)\s+/i, '')
    .replace(/\s+\d{2}$/g, '')
    .trim()
    .slice(0, 16) || n.slice(0, 16)
}

export function formatTable(rows: TableRow[]): string {
  const body = rows.map((r) => {
    const rank = String(r.rank).padStart(2, ' ')
    const club = shortClub(r.name).padEnd(12, ' ')
    const pts = String(r.points).padStart(2, ' ')
    return `${rank}  ${club} ${pts}   ${r.gf}:${r.ga}`
  })
  return ['Platz Verein       Pkt  Tore', ...body].join('\n')
}

export function formatTableHud(rows: TableRow[]): string {
  return rows
    .slice(0, 3)
    .map((r) => `${r.rank}. ${shortClub(r.name)} ${r.points}`)
    .join(' · ')
}

async function loadTable(league: string): Promise<TableRow[]> {
  const year = new Date().getFullYear()
  for (const y of [year, year - 1]) {
    const rows = await fetchTable(league, y)
    if (rows.length) return rows
  }
  return []
}

async function fetchTable(league: string, year: number): Promise<TableRow[]> {
  const url = `https://api.openligadb.de/getbltable/${league}/${year}`
  try {
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) return []
    const data = JSON.parse(text) as unknown
    const arr = Array.isArray(data) ? data : []
    const rows: TableRow[] = []
    for (let i = 0; i < arr.length; i++) {
      const row = arr[i]
      if (!row || typeof row !== 'object') continue
      const o = row as Record<string, unknown>
      const name = String(o.teamName || o.shortName || '').trim()
      if (!name) continue
      const points = Number(o.points)
      const gf = Number(o.goals)
      const ga = Number(o.opponentGoals)
      const played = Number(o.matches)
      rows.push({
        rank: i + 1,
        name,
        points: Number.isFinite(points) ? points : 0,
        gf: Number.isFinite(gf) ? gf : 0,
        ga: Number.isFinite(ga) ? ga : 0,
        played: Number.isFinite(played) ? played : 0,
      })
    }
    return rows
  } catch {
    return []
  }
}

async function loadMatches(league: string): Promise<Match[]> {
  const year = new Date().getFullYear()
  const url = `https://api.openligadb.de/getmatchdata/${league}/${year}`
  try {
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) return []
    const data = JSON.parse(text) as unknown
    const arr = Array.isArray(data) ? data : []
    return arr
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const home = String(o.team1 && typeof o.team1 === 'object' ? (o.team1 as { teamName?: string }).teamName : '').trim()
        const away = String(o.team2 && typeof o.team2 === 'object' ? (o.team2 as { teamName?: string }).teamName : '').trim()
        const results = Array.isArray(o.matchResults) ? o.matchResults : []
        const last = results[results.length - 1] as { pointsTeam1?: number; pointsTeam2?: number } | undefined
        if (!home || !away) return null
        const hs = Number(last?.pointsTeam1)
        const as = Number(last?.pointsTeam2)
        return {
          home,
          away,
          hs: Number.isFinite(hs) ? hs : 0,
          as: Number.isFinite(as) ? as : 0,
          done: Boolean(o.matchIsFinished) && Number.isFinite(hs),
        }
      })
      .filter((m): m is Match => Boolean(m))
  } catch {
    return []
  }
}

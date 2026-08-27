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

export type SportIntent = { league: string; team?: string }

export function parseSportIntent(text: string): SportIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const sportish =
    /\b(bundesliga|spielstand|spielergebnis|wie\s+hat\s+(?:der|die)\s+|ergebnis\s+|dfb[\s-]*pokal|zweite\s+liga)\b/i.test(
      t,
    ) ||
    /\b(vfb|bayern|bvb|dortmund)\b/i.test(t) && /\b(gespielt|gewonnen|ergebnis|spiel)\b/i.test(t)
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
  return { league, team }
}

export async function handleSport(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSportIntent(text)
  if (!intent) return { handled: false }
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
    .join('. ')
  saveSettings({ last_sport_line: line.slice(0, 220) })
  return {
    handled: true,
    reply: `${line}. OpenLigaDB, kein Tipp.`,
    tool: { tool_status: 'executed', tool: 'sport', action: 'score', label: 'Sport' },
    lastTool: 'sport',
  }
}

type Match = { home: string; away: string; hs: number; as: number; done: boolean }

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

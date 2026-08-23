import { parseSportIntent } from './sport-parse'
import { getText } from './http-json'
import { persistLastList, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseSportIntent } from './sport-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }

type Match = {
  team1?: { teamName?: string }
  team2?: { teamName?: string }
  matchResults?: Array<{ resultName?: string; pointsTeam1?: number; pointsTeam2?: number }>
  matchDateTime?: string
  matchIsFinished?: boolean
  leagueName?: string
}

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'sport', action, label }
}

export async function handleSport(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSportIntent(text)
  if (!intent) return { handled: false }
  const rows = await loadLeague(intent.league)
  if (!rows.length) {
    return {
      handled: true,
      reply: 'OpenLigaDB liefert gerade keine Spiele. Ich erfinde keinen Stand.',
      tool: tool('error', 'Sport fehlt'),
      lastTool: 'sport',
    }
  }
  const filtered = intent.team
    ? rows.filter((m) => names(m).some((n) => n.includes(norm(intent.team || '')) || norm(intent.team || '').includes(n)))
    : rows.filter((m) => m.matchIsFinished).slice(-5)
  persistLastList(
    'sport',
    filtered.slice(0, 6).map((m) => line(m)),
  )
  saveSettings({ last_sport_json: JSON.stringify({ at: new Date().toISOString(), league: intent.league }) })
  if (!filtered.length) {
    return {
      handled: true,
      reply: intent.team
        ? `Kein Spiel von ${intent.team} in dieser OpenLigaDB-Liste. Ich rate das Ergebnis nicht.`
        : 'Keine beendeten Spiele in der Liste.',
      tool: tool('empty', 'Kein Spiel'),
      lastTool: 'sport',
    }
  }
  const pick = intent.team
    ? [...filtered].reverse().find((m) => m.matchIsFinished) || filtered[filtered.length - 1]
    : filtered[filtered.length - 1]
  const extra = !intent.team && filtered.length > 1 ? ` Weitere: ${filtered.slice(-3, -1).map(short).join('; ')}.` : ''
  return {
    handled: true,
    reply: `${line(pick)} Quelle: OpenLigaDB.${extra}`,
    tool: tool('score', pick.team1?.teamName || 'Spiel'),
    lastTool: 'sport',
  }
}

async function loadLeague(league: string): Promise<Match[]> {
  const year = seasonYear()
  const urls = [
    `https://api.openligadb.de/getmatchdata/${league}/${year}`,
    `https://api.openligadb.de/getmatchdata/${league}`,
  ]
  for (const url of urls) {
    try {
      const { status, text } = await getText(url, UA)
      if (status < 200 || status >= 300 || !text) continue
      const parsed = JSON.parse(text) as unknown
      if (Array.isArray(parsed) && parsed.length) return parsed as Match[]
    } catch {
      /* nächste URL */
    }
  }
  return []
}

function seasonYear(): number {
  const n = new Date()
  return n.getMonth() >= 6 ? n.getFullYear() : n.getFullYear() - 1
}

function names(m: Match): string[] {
  return [m.team1?.teamName, m.team2?.teamName].filter(Boolean).map((s) => norm(String(s)))
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[.\-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function score(m: Match): string {
  const end = (m.matchResults || []).find((r) => /end|ende/i.test(String(r.resultName || ''))) || m.matchResults?.[0]
  if (!end || end.pointsTeam1 == null || end.pointsTeam2 == null) {
    return m.matchIsFinished ? 'ohne Zahl' : 'noch kein Ergebnis'
  }
  return `${end.pointsTeam1}:${end.pointsTeam2}`
}

function line(m: Match): string {
  const a = m.team1?.teamName || 'Heim'
  const b = m.team2?.teamName || 'Gast'
  const when = m.matchDateTime ? ` ${fmt(m.matchDateTime)}` : ''
  return `${a} gegen ${b} ${score(m)}.${when}`
}

function short(m: Match): string {
  return `${m.team1?.teamName || '?'} ${score(m)} ${m.team2?.teamName || '?'}`
}

function fmt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

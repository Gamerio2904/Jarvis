import { completeGeminiVision, geminiReady } from './gemini'
import { estimateOvr, FC26_PLAYERS, FC26_START_YEAR, findPlayer, type FcPlayer } from './fc26-players'
import { latestEye, showTabletCard } from './tablet'
import { parseSquadIntent, parseSquadPick } from './squad-parse'
import { loadSettings, persistLastList, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseSquadIntent, parseSquadPick } from './squad-parse'
export type { SquadIntent } from './squad-parse'
export type { FcPlayer } from './fc26-players'

export type SquadPick = {
  name: string
  pos: string
  age: number
  ovr: number
  pot: number
  club: string
  kind: 'veteran' | 'youth' | 'mid'
  est: number
}

type LastFc = {
  year?: number
  names: string[]
  picks: SquadPick[]
  waiting?: 'year'
}

type SquadHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

function squadTool(action: string, label: string, extra?: Record<string, unknown>): ToolMeta {
  return { tool_status: 'executed', tool: 'squad', action, label, result: extra }
}

function readLast(): LastFc {
  try {
    const raw = loadSettings().last_fc_json
    if (!raw) return { names: [], picks: [] }
    const parsed = JSON.parse(raw) as LastFc
    return {
      year: parsed.year,
      names: Array.isArray(parsed.names) ? parsed.names : [],
      picks: Array.isArray(parsed.picks) ? parsed.picks : [],
      waiting: parsed.waiting,
    }
  } catch {
    return { names: [], picks: [] }
  }
}

function writeLast(next: LastFc) {
  saveSettings({ last_fc_json: JSON.stringify(next) })
}

export async function handleSquad(_conversationId: string, text: string): Promise<SquadHit> {
  const last = readLast()
  const pickName = parseSquadPick(text, [...last.picks.map((p) => p.name), ...last.names])
  if (pickName && (last.picks.length || last.names.length)) return focusPick(pickName, last)

  const intent = parseSquadIntent(text)
  if (intent?.kind === 'year') return finishWithYear(intent.year, last)

  if (intent?.kind === 'cards') {
    if (!last.picks.length) {
      return {
        handled: true,
        reply: 'Noch keine Karten. Foto der Mannschaft, dann das Karrierejahr.',
        tool: squadTool('ask', 'Karten fehlen'),
        lastTool: 'squad',
      }
    }
    publishCards(last.picks)
    return {
      handled: true,
      reply: 'Die drei Karten im Vollbild. Nennen Sie einen Namen.',
      tool: squadTool('cards', 'Karten'),
      lastTool: 'squad',
    }
  }

  if (!intent) {
    if (last.waiting === 'year' && /^\s*\d{4}\s*[.!?]*$/.test(text.trim())) {
      const year = Number(text.trim())
      if (year >= 2025 && year <= 2040) return finishWithYear(year, last)
    }
    return { handled: false }
  }

  const names = await readRoster(text)
  const year = last.year
  if (!year) {
    writeLast({ ...last, names, waiting: 'year' })
    return {
      handled: true,
      reply: names.length
        ? `Ich sehe ${names.slice(0, 6).join(', ')}. In welchem Karrierejahr sind Sie? Zum Beispiel 2027. Wachstum ist eine Näherung, nicht der EA-Kernel.`
        : 'In welchem Karrierejahr sind Sie? Und ein Foto der Aufstellung hilft — ohne Jahr und ohne Werte erfinde ich keine Gesamtstärke.',
      tool: squadTool('ask', 'Jahr fehlt'),
      lastTool: 'squad',
    }
  }
  return finishWithYear(year, { ...last, names })
}

async function finishWithYear(year: number, last: LastFc): Promise<SquadHit> {
  const names = last.names
  const known = names.map(findPlayer).filter((p): p is FcPlayer => Boolean(p))
  const picks = suggestPicks(known, year)
  writeLast({ year, names, picks })
  persistLastList(
    'squad',
    picks.map((p) => p.name),
  )
  publishCards(picks)
  if (!picks.length) {
    return {
      handled: true,
      reply: `Jahr ${year} liegt. Für die genannten Namen habe ich keine FC-26-Werte in der Jarvis-Liste. Ich erfinde kein OVR.`,
      tool: squadTool('empty', 'Keine Werte'),
      lastTool: 'squad',
    }
  }
  const lines = picks.map((p) => `${p.kind === 'veteran' ? 'Erfahren' : p.kind === 'youth' ? 'Talent' : 'Mitte'}: ${p.name}, ${p.pos}, etwa ${p.est} in ${year} (jetzt ${p.ovr}, Potenzial ${p.pot}).`)
  return {
    handled: true,
    reply: `${lines.join(' ')} Näherung aus dem Jarvis-Stand, nicht der EA-Kernel. Nennen Sie einen Namen.`,
    tool: squadTool('suggest', 'Vorschläge', { picks }),
    lastTool: 'squad',
  }
}

function focusPick(name: string, last: LastFc): SquadHit {
  const hit = last.picks.find((p) => p.name.toLowerCase() === name.toLowerCase()) || last.picks.find((p) =>
    p.name.toLowerCase().includes(name.toLowerCase()),
  )
  const player = hit || (findPlayer(name)
    ? {
        ...findPlayer(name)!,
        kind: 'mid' as const,
        est: estimateOvr(findPlayer(name)!, last.year || FC26_START_YEAR),
      }
    : null)
  if (!player) {
    return {
      handled: true,
      reply: `${name} steht nicht in der Jarvis-Liste. Ich erfinde keine Karte.`,
      tool: squadTool('ask', 'Spieler fehlt'),
      lastTool: 'squad',
    }
  }
  const picks = last.picks.length ? last.picks : [player]
  writeLast({ ...last, picks })
  if (loadSettings().tablet_mode) {
    showTabletCard({ kind: 'squad', picks, focus: player.name })
  }
  return {
    handled: true,
    reply: `Gute Wahl, Sir. ${player.name}.`,
    tool: squadTool('pick', player.name, { focus: player.name }),
    lastTool: 'squad',
  }
}

function publishCards(picks: SquadPick[]) {
  if (loadSettings().tablet_mode) showTabletCard({ kind: 'squad', picks })
}

function suggestPicks(have: FcPlayer[], year: number): SquadPick[] {
  const haveNames = new Set(have.map((p) => p.name))
  const pool = FC26_PLAYERS.filter((p) => !haveNames.has(p.name))
  const needPos = missingPositions(have)
  const veteran = pickBest(
    pool.filter((p) => p.age >= 30 && p.ovr >= 82),
    year,
    needPos,
  )
  const youth = pickBest(
    pool.filter((p) => p.age <= 22 && p.pot >= 86),
    year,
    needPos,
    true,
  )
  const mid = pickBest(
    pool.filter((p) => p.age >= 23 && p.age <= 29 && p.ovr >= 80 && p.ovr <= 87),
    year,
    needPos,
  )
  const out: SquadPick[] = []
  if (veteran) out.push(asPick(veteran, year, 'veteran'))
  if (youth) out.push(asPick(youth, year, 'youth'))
  if (mid && mid.name !== veteran?.name && mid.name !== youth?.name) out.push(asPick(mid, year, 'mid'))
  return out.slice(0, 3)
}

function missingPositions(have: FcPlayer[]): string[] {
  const havePos = new Set(have.map((p) => p.pos))
  return ['ST', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK', 'LW', 'RW'].filter((p) => !havePos.has(p))
}

function pickBest(pool: FcPlayer[], year: number, needPos: string[], byPot = false): FcPlayer | undefined {
  if (!pool.length) return undefined
  const scored = [...pool].sort((a, b) => {
    const needA = needPos.includes(a.pos) ? 8 : 0
    const needB = needPos.includes(b.pos) ? 8 : 0
    const sa = needA + (byPot ? estimateOvr(a, year) + a.pot : estimateOvr(a, year))
    const sb = needB + (byPot ? estimateOvr(b, year) + b.pot : estimateOvr(b, year))
    return sb - sa
  })
  return scored[0]
}

function asPick(p: FcPlayer, year: number, kind: SquadPick['kind']): SquadPick {
  return { ...p, kind, est: estimateOvr(p, year) }
}

async function readRoster(text: string): Promise<string[]> {
  const named = FC26_PLAYERS.filter((p) => text.toLowerCase().includes(p.name.toLowerCase()) || text.toLowerCase().includes(p.name.split(' ').pop()!.toLowerCase())).map((p) => p.name)
  const shot = latestEye()
  if (!shot || !geminiReady()) return [...new Set(named)]
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(shot.dataUrl)
  if (!m) return [...new Set(named)]
  try {
    const raw = await completeGeminiVision(
      'Liste nur die Spielernamen auf diesem FC-26- oder FIFA-Kaderfoto, Komma-getrennt. Keine Werte erfinden. Unbekannt: leer.',
      m[2],
      m[1],
    )
    const bits = String(raw || '')
      .split(/[,;\n]/)
      .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
      .filter((s) => s.length >= 3 && s.length <= 40)
    const matched = bits
      .map((b) => findPlayer(b)?.name)
      .filter((n): n is string => Boolean(n))
    return [...new Set([...named, ...matched])]
  } catch {
    return [...new Set(named)]
  }
}

import { parseChessIntent } from './chess-parse'
import { getText } from './http-json'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseChessIntent } from './chess-parse'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const FILES = 'abcdefgh'
const PIECES = 'PNBRQKpnbrqk'

type State = {
  b: string[]
  white: boolean
  castle: string
  ep: number
  half: number
  full: number
}

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'chess', action, label }
}

export async function handleChess(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseChessIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'lichess') {
    return readLichess(intent.user)
  }
  if (intent.kind === 'new') {
    saveSettings({ last_chess_fen: START })
    return {
      handled: true,
      reply: `Neues Spiel. Weiß am Zug.\n${boardText(parseFen(START) as State)}`,
      tool: tool('new', 'Schach'),
      lastTool: 'chess',
    }
  }
  const fen = loadSettings().last_chess_fen || START
  const st = parseFen(fen)
  if (!st) {
    saveSettings({ last_chess_fen: START })
    return {
      handled: true,
      reply: `Stellung war unlesbar. Neu aufgestellt.\n${boardText(parseFen(START)!)}`,
      tool: tool('new', 'Schach'),
      lastTool: 'chess',
    }
  }
  if (intent.kind === 'status') {
    return {
      handled: true,
      reply: `${st.white ? 'Weiß' : 'Schwarz'} am Zug.\n${boardText(st)}`,
      tool: tool('status', 'Schach'),
      lastTool: 'chess',
    }
  }
  const mv = resolveMove(st, intent.token)
  if (!mv) {
    return {
      handled: true,
      reply: `Zug ${intent.token} ist so nicht legal. Stellung bleibt.\n${boardText(st)}`,
      tool: tool('illegal', 'Schach'),
      lastTool: 'chess',
    }
  }
  const next = applyMove(st, mv)
  saveSettings({ last_chess_fen: toFen(next) })
  const check = inCheck(next, next.white) ? ' Schach.' : ''
  return {
    handled: true,
    reply: `${uci(mv)} gespielt.${check} ${next.white ? 'Weiß' : 'Schwarz'} am Zug.\n${boardText(next)}`,
    tool: tool('move', uci(mv)),
    lastTool: 'chess',
  }
}

async function readLichess(user: string): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const name = user.replace(/[^\w-]/g, '')
  if (!name) {
    return { handled: true, reply: 'Welcher Lichess-Name?', tool: tool('ask', 'Lichess'), lastTool: 'chess' }
  }
  try {
    const { status, text } = await getText(`https://lichess.org/api/games/user/${encodeURIComponent(name)}?max=1&moves=true&opening=true`, {
      Accept: 'application/x-ndjson',
      'User-Agent': 'Jarvis/2.28.0 (local.jarvis.app)',
    })
    if (status < 200 || status >= 300 || !text.trim()) {
      return {
        handled: true,
        reply: `Keine öffentliche Partie von ${name} bei Lichess.`,
        tool: tool('empty', 'Lichess'),
        lastTool: 'chess',
      }
    }
    const row = JSON.parse(text.trim().split('\n')[0] || '{}') as {
      winner?: string
      status?: string
      opening?: { name?: string }
      moves?: string
    }
    const open = row.opening?.name ? ` Eröffnung ${row.opening.name}.` : ''
    const end = row.winner ? ` Gewinner: ${row.winner}.` : row.status ? ` Stand: ${row.status}.` : ''
    const mv = row.moves ? ` Züge: ${row.moves.split(' ').slice(0, 8).join(' ')}…` : ''
    return {
      handled: true,
      reply: `Letzte öffentliche Partie von ${name} auf Lichess.${open}${end}${mv}`,
      tool: tool('lichess', name),
      lastTool: 'chess',
    }
  } catch {
    return {
      handled: true,
      reply: 'Lichess antwortet nicht. Das Brett hier bleibt lokal.',
      tool: tool('error', 'Lichess'),
      lastTool: 'chess',
    }
  }
}

function parseFen(fen: string): State | null {
  const parts = fen.trim().split(/\s+/)
  if (parts.length < 4) return null
  const b = Array<string>(64).fill('')
  let i = 0
  for (const ch of parts[0]) {
    if (ch === '/') continue
    if (/[1-8]/.test(ch)) {
      i += Number(ch)
      continue
    }
    if (!PIECES.includes(ch) || i >= 64) return null
    b[i] = ch
    i += 1
  }
  if (i !== 64) return null
  const ep = parts[3] === '-' ? -1 : sq(parts[3])
  return {
    b,
    white: parts[1] === 'w',
    castle: parts[2] === '-' ? '' : parts[2],
    ep: ep ?? -1,
    half: Number(parts[4] || 0) || 0,
    full: Number(parts[5] || 1) || 1,
  }
}

function toFen(s: State): string {
  const rows: string[] = []
  for (let r = 0; r < 8; r += 1) {
    let empty = 0
    let line = ''
    for (let f = 0; f < 8; f += 1) {
      const p = s.b[r * 8 + f]
      if (!p) empty += 1
      else {
        if (empty) line += String(empty)
        empty = 0
        line += p
      }
    }
    if (empty) line += String(empty)
    rows.push(line)
  }
  const ep = s.ep >= 0 ? alg(s.ep) : '-'
  return `${rows.join('/')} ${s.white ? 'w' : 'b'} ${s.castle || '-'} ${ep} ${s.half} ${s.full}`
}

function sq(a: string): number {
  const f = FILES.indexOf(a[0])
  const r = 8 - Number(a[1])
  if (f < 0 || r < 0 || r > 7) return -1
  return r * 8 + f
}

function alg(i: number): string {
  return `${FILES[i % 8]}${8 - Math.floor(i / 8)}`
}

function uci(m: { from: number; to: number; promo?: string }): string {
  return `${alg(m.from)}${alg(m.to)}${m.promo || ''}`
}

function isWhite(p: string): boolean {
  return p !== '' && p === p.toUpperCase()
}

function enemy(p: string, white: boolean): boolean {
  return p !== '' && isWhite(p) !== white
}

function own(p: string, white: boolean): boolean {
  return p !== '' && isWhite(p) === white
}

function kingAt(s: State, white: boolean): number {
  const k = white ? 'K' : 'k'
  return s.b.findIndex((p) => p === k)
}

function inCheck(s: State, white: boolean): boolean {
  const k = kingAt(s, white)
  if (k < 0) return true
  return attacks(s, k, !white)
}

function attacks(s: State, target: number, byWhite: boolean): boolean {
  for (let i = 0; i < 64; i += 1) {
    const p = s.b[i]
    if (!own(p, byWhite)) continue
    for (const m of pieceMoves(s, i, true)) {
      if (m.to === target) return true
    }
  }
  return false
}

function pieceMoves(s: State, from: number, attackOnly: boolean): Array<{ from: number; to: number; promo?: string }> {
  const p = s.b[from]
  if (!p) return []
  const white = isWhite(p)
  const kind = p.toUpperCase()
  const out: Array<{ from: number; to: number; promo?: string }> = []
  const push = (to: number, promo?: string) => {
    if (to < 0 || to > 63) return
    out.push({ from, to, promo })
  }
  if (kind === 'P') {
    const dir = white ? -8 : 8
    const start = white ? from >= 48 && from <= 55 : from >= 8 && from <= 15
    const fwd = from + dir
    if (!attackOnly && fwd >= 0 && fwd < 64 && !s.b[fwd]) {
      addPawn(push, fwd, white)
      const two = from + dir * 2
      if (start && !s.b[two]) push(two)
    }
    for (const df of [-1, 1]) {
      const to = from + dir + df
      if (to < 0 || to > 63) continue
      if (file(from) + df !== file(to)) continue
      if (enemy(s.b[to], white) || to === s.ep) addPawn(push, to, white)
    }
    return out
  }
  const rays: Record<string, number[][]> = {
    N: [[-17], [-15], [-10], [-6], [6], [10], [15], [17]].map((x) => x),
    B: [[-9], [-7], [7], [9]],
    R: [[-8], [-1], [1], [8]],
    Q: [[-9], [-8], [-7], [-1], [1], [7], [8], [9]],
    K: [[-9], [-8], [-7], [-1], [1], [7], [8], [9]],
  }
  const slide = kind === 'B' || kind === 'R' || kind === 'Q'
  const steps = kind === 'N' ? [-17, -15, -10, -6, 6, 10, 15, 17] : (rays[kind] || []).flat()
  if (kind === 'N' || kind === 'K') {
    for (const d of steps) {
      const to = from + d
      if (!okStep(from, to, d)) continue
      if (!s.b[to] || enemy(s.b[to], white)) push(to)
    }
    if (kind === 'K' && !attackOnly) addCastle(s, from, white, push)
    return out
  }
  if (slide) {
    const dirs = kind === 'B' ? [-9, -7, 7, 9] : kind === 'R' ? [-8, -1, 1, 8] : [-9, -8, -7, -1, 1, 7, 8, 9]
    for (const d of dirs) {
      let to = from + d
      while (okStep(to - d, to, d) && to >= 0 && to < 64) {
        if (!s.b[to]) push(to)
        else {
          if (enemy(s.b[to], white)) push(to)
          break
        }
        to += d
      }
    }
  }
  return out
}

function addPawn(
  push: (to: number, promo?: string) => void,
  to: number,
  white: boolean,
): void {
  const rank = Math.floor(to / 8)
  if ((white && rank === 0) || (!white && rank === 7)) {
    for (const pr of white ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n']) push(to, pr)
  } else push(to)
}

function addCastle(s: State, from: number, white: boolean, push: (to: number) => void): void {
  if (inCheck(s, white)) return
  const rights = white ? ['K', 'Q'] : ['k', 'q']
  const home = white ? 60 : 4
  if (from !== home) return
  if (s.castle.includes(rights[0]) && !s.b[home + 1] && !s.b[home + 2]) {
    if (!squareHit(s, home + 1, white) && !squareHit(s, home + 2, white)) push(home + 2)
  }
  if (s.castle.includes(rights[1]) && !s.b[home - 1] && !s.b[home - 2] && !s.b[home - 3]) {
    if (!squareHit(s, home - 1, white) && !squareHit(s, home - 2, white)) push(home - 2)
  }
}

function squareHit(s: State, i: number, white: boolean): boolean {
  return attacks({ ...s, b: s.b.slice() }, i, !white)
}

function file(i: number): number {
  return i % 8
}

function okStep(from: number, to: number, d: number): boolean {
  if (to < 0 || to > 63) return false
  const ff = file(from)
  const ft = file(to)
  if (Math.abs(d) === 1) return Math.floor(from / 8) === Math.floor(to / 8)
  if (Math.abs(d) === 8) return ff === ft
  if (Math.abs(d) === 7 || Math.abs(d) === 9) return Math.abs(ff - ft) === 1
  if (Math.abs(d) === 6 || Math.abs(d) === 10) return Math.abs(ff - ft) === 1
  if (Math.abs(d) === 15 || Math.abs(d) === 17) return Math.abs(ff - ft) === 1
  return true
}

function legalMoves(s: State): Array<{ from: number; to: number; promo?: string }> {
  const all: Array<{ from: number; to: number; promo?: string }> = []
  for (let i = 0; i < 64; i += 1) {
    if (!own(s.b[i], s.white)) continue
    for (const m of pieceMoves(s, i, false)) {
      const n = applyMove(s, m)
      if (!inCheck(n, s.white)) all.push(m)
    }
  }
  return all
}

function applyMove(s: State, m: { from: number; to: number; promo?: string }): State {
  const b = s.b.slice()
  const p = b[m.from]
  b[m.from] = ''
  let castle = s.castle
  if (p === 'K') castle = castle.replace(/[KQ]/g, '')
  if (p === 'k') castle = castle.replace(/[kq]/g, '')
  if (m.from === 63 || m.to === 63) castle = castle.replace('K', '')
  if (m.from === 56 || m.to === 56) castle = castle.replace('Q', '')
  if (m.from === 7 || m.to === 7) castle = castle.replace('k', '')
  if (m.from === 0 || m.to === 0) castle = castle.replace('q', '')
  if (p.toUpperCase() === 'K' && Math.abs(m.to - m.from) === 2) {
    if (m.to === m.from + 2) {
      b[m.from + 1] = b[m.from + 3]
      b[m.from + 3] = ''
    } else {
      b[m.from - 1] = b[m.from - 4]
      b[m.from - 4] = ''
    }
  }
  let ep = -1
  if (p.toUpperCase() === 'P' && m.to === s.ep && s.ep >= 0) {
    b[s.white ? m.to + 8 : m.to - 8] = ''
  }
  if (p.toUpperCase() === 'P' && Math.abs(m.to - m.from) === 16) ep = (m.from + m.to) / 2
  b[m.to] = m.promo || p
  return {
    b,
    white: !s.white,
    castle,
    ep,
    half: p.toUpperCase() === 'P' || s.b[m.to] ? 0 : s.half + 1,
    full: s.white ? s.full : s.full + 1,
  }
}

function resolveMove(s: State, token: string): { from: number; to: number; promo?: string } | null {
  const t = token.trim()
  const legal = legalMoves(s)
  const uciM = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/i.exec(t)
  if (uciM) {
    const from = sq(uciM[1])
    const to = sq(uciM[2])
    const promo = uciM[3] ? (s.white ? uciM[3].toUpperCase() : uciM[3].toLowerCase()) : undefined
    return legal.find((m) => m.from === from && m.to === to && (promo ? m.promo === promo : !m.promo || m.promo.toLowerCase() === 'q')) || null
  }
  if (t === 'O-O' || t === '0-0') return legal.find((m) => s.b[m.from].toUpperCase() === 'K' && m.to === m.from + 2) || null
  if (t === 'O-O-O' || t === '0-0-0') return legal.find((m) => s.b[m.from].toUpperCase() === 'K' && m.to === m.from - 2) || null
  const san = /^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(?:=([NBRQ]))?$/.exec(t)
  if (!san) return null
  const want = san[1] || 'P'
  const to = sq(san[4])
  const fileHint = san[2] ? FILES.indexOf(san[2]) : -1
  const rankHint = san[3] ? 8 - Number(san[3]) : -1
  const promo = san[5] ? (s.white ? san[5] : san[5].toLowerCase()) : undefined
  const hits = legal.filter((m) => {
    const p = s.b[m.from].toUpperCase()
    if (p !== want) return false
    if (m.to !== to) return false
    if (fileHint >= 0 && file(m.from) !== fileHint) return false
    if (rankHint >= 0 && Math.floor(m.from / 8) !== rankHint) return false
    if (promo && m.promo !== promo) return false
    return true
  })
  return hits.length === 1 ? hits[0] : null
}

function boardText(s: State): string {
  const map: Record<string, string> = {
    K: '♔',
    Q: '♕',
    R: '♖',
    B: '♗',
    N: '♘',
    P: '♙',
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  }
  const lines: string[] = []
  for (let r = 0; r < 8; r += 1) {
    let line = `${8 - r} `
    for (let f = 0; f < 8; f += 1) {
      const p = s.b[r * 8 + f]
      line += p ? map[p] || p : '·'
      line += ' '
    }
    lines.push(line.trimEnd())
  }
  lines.push('  a b c d e f g h')
  return lines.join('\n')
}

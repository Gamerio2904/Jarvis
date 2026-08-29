import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const START =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KEY = 'jarvis_chess_fen'

export type ChessIntent = { kind: 'new' | 'show' | 'move'; move?: string }

export function parseChessIntent(text: string, follow = false): ChessIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 80) return null
  if (/^\s*schach\s*(?:neu|reset|von\s+vorn)\s*$/i.test(t) || /^\s*neues\s+schach\s*$/i.test(t)) {
    return { kind: 'new' }
  }
  if (/^\s*schach\s*$/i.test(t) || /^\s*schachbrett\s*$/i.test(t)) return { kind: 'show' }
  const m = /(?:schach\s+)?([a-h][1-8][a-h][1-8][qrbn]?)|([a-h][1-8]-[a-h][1-8])/i.exec(t)
  if (m && (/^\s*schach\b/i.test(t) || follow || /^\s*[a-h][1-8][a-h][1-8]/.test(t))) {
    const raw = (m[1] || m[2] || '').replace('-', '')
    return { kind: 'move', move: raw.toLowerCase() }
  }
  return null
}

export async function handleChess(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const follow = loadFen() !== START
  const intent = parseChessIntent(text, follow)
  if (!intent) return { handled: false }
  if (intent.kind === 'new') {
    saveFen(START)
    return pack('Neues Spiel. Weiß am Zug.', boardText(START))
  }
  const fen = loadFen()
  if (intent.kind === 'show') {
    return pack(turnLine(fen), boardText(fen))
  }
  const move = intent.move || ''
  const next = applyMove(fen, move)
  if (!next) {
    return pack(`Zug ${move} ist nicht legal. ${turnLine(fen)}`, boardText(fen))
  }
  saveFen(next)
  return pack(`${move}. ${turnLine(next)}`, boardText(next))
}

function pack(line: string, board: string) {
  return {
    handled: true,
    reply: `${line}\n${board}`,
    tool: { tool_status: 'executed', tool: 'chess', action: 'move', label: 'Schach' } as ToolMeta,
    lastTool: 'chess',
  }
}

export function loadFen(): string {
  try {
    return localStorage.getItem(KEY) || START
  } catch {
    return START
  }
}

function saveFen(fen: string): void {
  try {
    localStorage.setItem(KEY, fen)
  } catch {
    /* ignore */
  }
}

function turnLine(fen: string): string {
  const side = fen.split(' ')[1] === 'b' ? 'Schwarz' : 'Weiß'
  return `${side} am Zug.`
}

function boardText(fen: string): string {
  const rows = fen.split(' ')[0].split('/')
  return rows
    .map((row) =>
      row
        .replace(/(\d)/g, (n) => '.'.repeat(Number(n)))
        .split('')
        .join(' '),
    )
    .join('\n')
}

type Sq = { p: string; white: boolean } | null

function parseBoard(fen: string): { grid: Sq[][]; white: boolean } {
  const [place, stm] = fen.split(' ')
  const grid: Sq[][] = []
  for (const row of place.split('/')) {
    const line: Sq[] = []
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) line.push(null)
      } else {
        line.push({ p: ch.toLowerCase(), white: ch === ch.toUpperCase() })
      }
    }
    while (line.length < 8) line.push(null)
    grid.push(line.slice(0, 8))
  }
  return { grid, white: stm !== 'b' }
}

function fenOf(grid: Sq[][], white: boolean, rest: string): string {
  const rows = grid.map((row) => {
    let s = ''
    let z = 0
    for (const sq of row) {
      if (!sq) {
        z += 1
        continue
      }
      if (z) {
        s += String(z)
        z = 0
      }
      s += sq.white ? sq.p.toUpperCase() : sq.p
    }
    if (z) s += String(z)
    return s
  })
  const bits = rest.split(' ')
  bits[0] = white ? 'w' : 'b'
  return `${rows.join('/')} ${bits.join(' ')}`
}

function applyMove(fen: string, uci: string): string | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null
  const { grid, white } = parseBoard(fen)
  const ff = uci.charCodeAt(0) - 97
  const fr = 8 - Number(uci[1])
  const tf = uci.charCodeAt(2) - 97
  const tr = 8 - Number(uci[3])
  const piece = grid[fr]?.[ff]
  if (!piece || piece.white !== white) return null
  const dest = grid[tr]?.[tf]
  if (dest && dest.white === white) return null
  const df = tf - ff
  const dr = tr - fr
  if (!legal(grid, piece, ff, fr, tf, tr, df, dr, dest)) return null
  grid[tr][tf] = piece
  grid[fr][ff] = null
  if (piece.p === 'p' && (tr === 0 || tr === 7)) {
    const promo = uci[4] || 'q'
    grid[tr][tf] = { p: promo, white: piece.white }
  }
  const rest = fen.split(' ').slice(1).join(' ')
  return fenOf(grid, !white, rest)
}

function legal(
  grid: Sq[][],
  piece: { p: string; white: boolean },
  ff: number,
  fr: number,
  tf: number,
  tr: number,
  df: number,
  dr: number,
  dest: Sq,
): boolean {
  const dir = piece.white ? -1 : 1
  if (piece.p === 'p') {
    if (df === 0 && !dest) {
      if (dr === dir) return true
      if (dr === 2 * dir && ((piece.white && fr === 6) || (!piece.white && fr === 1)) && !grid[fr + dir][ff]) return true
    }
    if (Math.abs(df) === 1 && dr === dir && dest) return true
    return false
  }
  if (piece.p === 'n') return (Math.abs(df) === 1 && Math.abs(dr) === 2) || (Math.abs(df) === 2 && Math.abs(dr) === 1)
  if (piece.p === 'k') return Math.abs(df) <= 1 && Math.abs(dr) <= 1 && (df !== 0 || dr !== 0)
  if (piece.p === 'b') return Math.abs(df) === Math.abs(dr) && df !== 0 && clear(grid, ff, fr, tf, tr)
  if (piece.p === 'r') return (df === 0 || dr === 0) && (df !== 0 || dr !== 0) && clear(grid, ff, fr, tf, tr)
  if (piece.p === 'q') {
    const diag = Math.abs(df) === Math.abs(dr) && df !== 0
    const ortho = (df === 0 || dr === 0) && (df !== 0 || dr !== 0)
    return (diag || ortho) && clear(grid, ff, fr, tf, tr)
  }
  return false
}

function clear(grid: Sq[][], ff: number, fr: number, tf: number, tr: number): boolean {
  const sf = Math.sign(tf - ff)
  const sr = Math.sign(tr - fr)
  let f = ff + sf
  let r = fr + sr
  while (f !== tf || r !== tr) {
    if (grid[r][f]) return false
    f += sf
    r += sr
  }
  return true
}

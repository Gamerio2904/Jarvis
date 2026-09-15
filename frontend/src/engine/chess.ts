import type { ChatBlock } from './chat-blocks.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const START =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KEY = 'jarvis_chess_fen'

const PIECE = '(bauer|springer|pferd|l[aä]ufer|turm|dame|k[oö]nig(?:in)?)'

/** Genannte Figur → FEN-Buchstabe. „Königin“ ist die Dame, nicht der König. */
const PIECE_LETTER: Array<[RegExp, string]> = [
  [/^bauer$/i, 'p'],
  [/^(?:springer|pferd)$/i, 'n'],
  [/^l[aä]ufer$/i, 'b'],
  [/^turm$/i, 'r'],
  [/^(?:dame|k[oö]nigin)$/i, 'q'],
  [/^k[oö]nig$/i, 'k'],
]

const PIECE_NAME: Record<string, string> = {
  p: 'Bauer',
  n: 'Springer',
  b: 'Läufer',
  r: 'Turm',
  q: 'Dame',
  k: 'König',
}

/** Die Dame ist die einzige weibliche Figur — „kein Dame“ liest sich wie ein Fehler. */
export function piecePhrase(letter: string, negated: boolean): string {
  const name = PIECE_NAME[letter] || 'Figur'
  const female = letter === 'q'
  return `${negated ? 'kein' : 'ein'}${female ? 'e' : ''} ${name}`
}

function pieceLetter(word: string): string {
  const w = (word || '').trim()
  for (const [re, letter] of PIECE_LETTER) {
    if (re.test(w)) return letter
  }
  return ''
}
const SQ = '([a-h])\\s*([1-8])'
/** Ziel darf 9 sein — sonst fällt „Läufer e8 f9“ ans Modell statt auf illegal. */
const SQ_ANY = '([a-h])\\s*(\\d+)'
const FROM_TO = new RegExp(`${SQ}\\s*(?:[-–]|nach|auf|bis)?\\s*${SQ_ANY}([qrbn])?`, 'i')
const PIECE_MOVE = new RegExp(`${PIECE}\\s+${SQ}\\s*(?:[-–]|nach|auf|bis)?\\s*${SQ_ANY}([qrbn])?`, 'i')
const PLAY =
  /\b(?:lass(?:t)?\s+(?:uns|mich)|las\s+uns|wollen\s+wir|spiel(?:en)?\s+wir)\s+schach\b|\bschach\s+spiel(?:en)?\b|^\s*(?:spiel(?:e)?(?:\s+mal)?|play)\s+schach\b/i

export type ChessIntent = { kind: 'new' | 'show' | 'move'; move?: string; piece?: string }

export function parseChessIntent(text: string, follow = false): ChessIntent | null {
  const t = normalizeUtterance(text.trim()).toLowerCase()
  if (!t || t.length > 120) return null
  if (/\b(spotify|musik|song|lied|titel)\b/i.test(t)) return null
  if (/^\s*schach\s*(?:neu|reset|von\s+vorn)\s*$/i.test(t) || /^\s*neues\s+schach\s*$/i.test(t)) {
    return { kind: 'new' }
  }
  if (PLAY.test(t)) return { kind: 'new' }
  if (
    /^\s*(?:das\s+)?schach(?:brett)?\s*$/i.test(t) ||
    /\bzeig(?:e)?(?:\s+mir)?(?:\s+(?:mal\s+)?)?(?:das\s+|ein\s+)?schachbrett\b/i.test(t)
  ) {
    return { kind: 'show' }
  }
  const piece = PIECE_MOVE.exec(t)
  if (piece) {
    return {
      kind: 'move',
      move: `${piece[2]}${piece[3]}${piece[4]}${piece[5]}${piece[6] || ''}`.toLowerCase(),
      piece: pieceLetter(piece[1]),
    }
  }
  const spaced = FROM_TO.exec(t)
  if (
    spaced &&
    (/\bschach\b/i.test(t) || follow || PIECE_MOVE.test(t) || /^\s*[a-h]\s*[1-8]\s/.test(t))
  ) {
    return { kind: 'move', move: `${spaced[1]}${spaced[2]}${spaced[3]}${spaced[4]}${spaced[5] || ''}`.toLowerCase() }
  }
  const m = /(?:schach\s+)?([a-h][1-8][a-h][1-8][qrbn]?)|([a-h][1-8]-[a-h][1-8])/i.exec(t)
  if (m && (/\bschach\b/i.test(t) || follow || /^\s*[a-h][1-8][a-h][1-8]/.test(t))) {
    const raw = (m[1] || m[2] || '').replace('-', '')
    return { kind: 'move', move: raw.toLowerCase() }
  }
  return null
}

export async function handleChess(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string; blocks?: ChatBlock[] }> {
  const follow = loadFen() !== START
  const intent = parseChessIntent(text, follow)
  if (!intent) return { handled: false }
  if (intent.kind === 'new') {
    saveFen(START)
    return pack('Neues Spiel. Weiß am Zug. Züge wie Bauer e2 e4.', START)
  }
  const fen = loadFen()
  if (intent.kind === 'show') {
    return pack(turnLine(fen), fen)
  }
  const move = intent.move || ''
  /**
   * Die genannte Figur wurde vorher nur zum Erkennen gelesen und dann
   * weggeworfen: „Dame e2 e4“ zog den Bauern auf e2 und meldete Erfolg. Wer
   * eine Figur benennt, meint sie auch.
   */
  const named = intent.piece ? standsOn(fen, move) : ''
  if (intent.piece && named && named !== intent.piece) {
    return pack(
      `Auf ${move.slice(0, 2)} steht ${piecePhrase(intent.piece, true)}, sondern ${piecePhrase(named, false)}. ${turnLine(fen)}`,
      fen,
    )
  }
  const next = applyMove(fen, move)
  if (!next) {
    return pack(`Zug ${prettyMove(move)} ist nicht legal. ${turnLine(fen)}`, fen)
  }
  saveFen(next)
  return pack(`${prettyMove(move)}. ${turnLine(next)}`, next)
}

/** Welche Figur steht auf dem Startfeld des Zugs? Leer, wenn das Feld frei ist. */
function standsOn(fen: string, uci: string): string {
  if (!/^[a-h][1-8]/.test(uci)) return ''
  const { grid } = parseBoard(fen)
  const sq = grid[8 - Number(uci[1])]?.[uci.charCodeAt(0) - 97]
  return sq ? sq.p : ''
}

function prettyMove(uci: string): string {
  const m = /^([a-h][1-8])([a-h]\d+)/.exec(uci)
  if (!m) return uci
  return `${m[1]}–${m[2]}`
}

function pack(line: string, fen: string) {
  return {
    handled: true,
    reply: line,
    tool: { tool_status: 'executed', tool: 'chess', action: 'move', label: 'Schach' } as ToolMeta,
    lastTool: 'chess',
    blocks: [{ kind: 'chess' as const, fen }],
  }
}

export const START_FEN = START

const chessListeners = new Set<() => void>()

export function loadFen(): string {
  try {
    return localStorage.getItem(KEY) || START
  } catch {
    return START
  }
}

export function saveFen(fen: string): void {
  try {
    localStorage.setItem(KEY, fen)
  } catch {
    /* ignore */
  }
  for (const fn of [...chessListeners]) {
    try {
      fn()
    } catch {
      /* listener */
    }
  }
}

export function subscribeChess(fn: () => void): () => void {
  chessListeners.add(fn)
  return () => {
    chessListeners.delete(fn)
  }
}

function turnLine(fen: string): string {
  const side = fen.split(' ')[1] === 'b' ? 'Schwarz' : 'Weiß'
  return `${side} am Zug.`
}

export function turnLabel(fen: string): string {
  return turnLine(fen)
}

type Sq = { p: string; white: boolean } | null

function parseBoard(fen: string): { grid: Sq[][]; white: boolean } {
  const [place, stm] = fen.split(' ')
  const grid: Sq[][] = []
  for (const row of (place || '').split('/')) {
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

export function pieceAt(fen: string, sq: string): { p: string; white: boolean } | null {
  if (!/^[a-h][1-8]$/.test(sq)) return null
  const { grid } = parseBoard(fen)
  const ff = sq.charCodeAt(0) - 97
  const fr = 8 - Number(sq[1])
  return grid[fr]?.[ff] || null
}

export function sideToMoveWhite(fen: string): boolean {
  return parseBoard(fen).white
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

export function applyMove(fen: string, uci: string): string | null {
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

export function legalMovesFrom(fen: string, from: string): string[] {
  if (!/^[a-h][1-8]$/.test(from)) return []
  const out: string[] = []
  for (let f = 0; f < 8; f++) {
    for (let r = 1; r <= 8; r++) {
      const to = `${String.fromCharCode(97 + f)}${r}`
      if (to === from) continue
      if (applyMove(fen, from + to)) out.push(to)
    }
  }
  return out
}

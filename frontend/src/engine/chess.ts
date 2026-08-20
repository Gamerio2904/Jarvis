/** Minimal legal chess: start position, UCI or SAN pawn/piece moves, castling. */

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

type Board = Array<Piece | ''>

export type ChessState = {
  board: Board
  white: boolean
  castle: string
  ep: number | null
}

const FILES = 'abcdefgh'

export function parseFen(fen = START_FEN): ChessState {
  const [place, stm, castle, ep] = fen.split(' ')
  const board: Board = Array(64).fill('')
  let i = 0
  for (const row of place.split('/')) {
    for (const ch of row) {
      if (/[1-8]/.test(ch)) i += Number(ch)
      else {
        board[i] = ch as Piece
        i += 1
      }
    }
  }
  const epSq = ep && ep !== '-' ? algebraicToSq(ep) : null
  return { board, white: stm !== 'b', castle: castle || '-', ep: epSq }
}

export function fenOf(s: ChessState): string {
  const rows: string[] = []
  for (let r = 0; r < 8; r += 1) {
    let empty = 0
    let line = ''
    for (let f = 0; f < 8; f += 1) {
      const p = s.board[r * 8 + f]
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
  const ep = s.ep == null ? '-' : sqToAlgebraic(s.ep)
  return `${rows.join('/')} ${s.white ? 'w' : 'b'} ${s.castle || '-'} ${ep} 0 1`
}

export function boardText(s: ChessState): string {
  const lines = ['  a b c d e f g h']
  for (let r = 0; r < 8; r += 1) {
    const rank = 8 - r
    let row = `${rank} `
    for (let f = 0; f < 8; f += 1) {
      row += (s.board[r * 8 + f] || '.') + ' '
    }
    lines.push(row.trimEnd())
  }
  lines.push(s.white ? 'Weiß am Zug.' : 'Schwarz am Zug.')
  return lines.join('\n')
}

export function applyMove(s: ChessState, raw: string): { ok: true; next: ChessState } | { ok: false; message: string } {
  const token = raw.trim()
  const uci = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.exec(token)
  if (uci) {
    const from = algebraicToSq(token.slice(0, 2))
    const to = algebraicToSq(token.slice(2, 4))
    const promo = token[4]?.toLowerCase()
    return tryMove(s, from, to, promo)
  }
  if (/^O-O-O$/i.test(token)) return castle(s, false)
  if (/^O-O$/i.test(token)) return castle(s, true)
  const san = parseSan(s, token)
  if (!san.ok) return san
  return tryMove(s, san.from, san.to, san.promo)
}

function parseSan(
  s: ChessState,
  token: string,
): { ok: true; from: number; to: number; promo?: string } | { ok: false; message: string } {
  const t = token.replace(/[+#]$/, '')
  const promoM = /=([QRBN])$/i.exec(t)
  const promo = promoM?.[1]?.toLowerCase()
  const body = t.replace(/=[QRBN]$/i, '').replace(/x/g, '')
  const dest = body.slice(-2)
  if (!/^[a-h][1-8]$/i.test(dest)) return { ok: false, message: 'Zug nicht gelesen. z. B. e2e4 oder Nf3.' }
  const to = algebraicToSq(dest)
  const pieceLetter = /^[NBRQK]/i.test(body) ? body[0].toUpperCase() : 'P'
  const want = (s.white ? pieceLetter : pieceLetter.toLowerCase()) as Piece
  const rest = /^[NBRQK]/i.test(body) ? body.slice(1, -2) : body.slice(0, -2)
  const fileHint = rest.match(/[a-h]/i)?.[0]
  const rankHint = rest.match(/[1-8]/)?.[0]
  const cands: number[] = []
  for (let i = 0; i < 64; i += 1) {
    const piece = s.board[i]
    if (!piece || piece !== want) continue
    if (fileHint && FILES[i % 8] !== fileHint.toLowerCase()) continue
    if (rankHint && String(8 - Math.floor(i / 8)) !== rankHint) continue
    if (attacks(s, i, to, piece)) cands.push(i)
  }
  if (cands.length !== 1) return { ok: false, message: cands.length ? 'Zug zweideutig.' : 'Kein legaler Zug.' }
  return { ok: true, from: cands[0], to, promo }
}

function tryMove(
  s: ChessState,
  from: number,
  to: number,
  promo?: string,
): { ok: true; next: ChessState } | { ok: false; message: string } {
  const p = s.board[from]
  if (!p) return { ok: false, message: 'Kein Stein auf dem Startfeld.' }
  if (s.white !== isWhite(p)) return { ok: false, message: 'Der andere ist am Zug.' }
  if (!attacks(s, from, to, p) && !isEp(s, from, to, p)) return { ok: false, message: 'Zug nicht legal.' }
  const next: ChessState = {
    board: [...s.board],
    white: !s.white,
    castle: s.castle,
    ep: null,
  }
  if (isEp(s, from, to, p) && s.ep === to) {
    const cap = to + (isWhite(p) ? 8 : -8)
    next.board[cap] = ''
  }
  next.board[to] = promote(p, to, promo)
  next.board[from] = ''
  if (p === 'P' && to - from === -16) next.ep = from - 8
  if (p === 'p' && to - from === 16) next.ep = from + 8
  next.castle = updateCastle(s.castle, from, to)
  return { ok: true, next }
}

function castle(
  s: ChessState,
  kingSide: boolean,
): { ok: true; next: ChessState } | { ok: false; message: string } {
  const white = s.white
  const flag = white ? (kingSide ? 'K' : 'Q') : kingSide ? 'k' : 'q'
  if (!s.castle.includes(flag)) return { ok: false, message: 'Rochade nicht erlaubt.' }
  const king = white ? 60 : 4
  const rook = kingSide ? (white ? 63 : 7) : white ? 56 : 0
  const kingTo = kingSide ? king + 2 : king - 2
  const rookTo = kingSide ? king + 1 : king - 1
  const step = kingSide ? 1 : -1
  for (let sq = king + step; sq !== rook; sq += step) {
    if (s.board[sq]) return { ok: false, message: 'Rochade versperrt.' }
  }
  const next: ChessState = { board: [...s.board], white: !white, castle: s.castle.replace(flag, ''), ep: null }
  next.board[kingTo] = s.board[king]
  next.board[king] = ''
  next.board[rookTo] = s.board[rook]
  next.board[rook] = ''
  next.castle = updateCastle(next.castle, king, kingTo)
  return { ok: true, next }
}

function promote(p: Piece, to: number, promo?: string): Piece {
  const rank = Math.floor(to / 8)
  if (p === 'P' && rank === 0) return ((promo || 'q').toUpperCase() as Piece) || 'Q'
  if (p === 'p' && rank === 7) return ((promo || 'q').toLowerCase() as Piece) || 'q'
  return p
}

function isEp(s: ChessState, from: number, to: number, p: Piece): boolean {
  if (p !== 'P' && p !== 'p') return false
  return s.ep === to && Math.abs((from % 8) - (to % 8)) === 1
}

function attacks(s: ChessState, from: number, to: number, p: Piece): boolean {
  const df = (to % 8) - (from % 8)
  const dr = Math.floor(to / 8) - Math.floor(from / 8)
  const target = s.board[to]
  if (target && isWhite(target) === isWhite(p)) return false
  const absf = Math.abs(df)
  const absr = Math.abs(dr)
  switch (p) {
    case 'P':
      if (df === 0 && dr === -1 && !target) return true
      if (df === 0 && dr === -2 && from >= 48 && from <= 55 && !target && !s.board[from - 8]) return true
      if (absf === 1 && dr === -1 && target) return true
      return false
    case 'p':
      if (df === 0 && dr === 1 && !target) return true
      if (df === 0 && dr === 2 && from >= 8 && from <= 15 && !target && !s.board[from + 8]) return true
      if (absf === 1 && dr === 1 && target) return true
      return false
    case 'N':
    case 'n':
      return (absf === 1 && absr === 2) || (absf === 2 && absr === 1)
    case 'B':
    case 'b':
      return absf === absr && absf > 0 && clear(s.board, from, to)
    case 'R':
    case 'r':
      return ((df === 0) !== (dr === 0)) && clear(s.board, from, to)
    case 'Q':
    case 'q':
      return ((absf === absr && absf > 0) || ((df === 0) !== (dr === 0))) && clear(s.board, from, to)
    case 'K':
    case 'k':
      return absf <= 1 && absr <= 1 && (absf !== 0 || absr !== 0)
    default:
      return false
  }
}

function clear(board: Board, from: number, to: number): boolean {
  const df = Math.sign((to % 8) - (from % 8))
  const dr = Math.sign(Math.floor(to / 8) - Math.floor(from / 8))
  let f = (from % 8) + df
  let r = Math.floor(from / 8) + dr
  const tf = to % 8
  const tr = Math.floor(to / 8)
  while (f !== tf || r !== tr) {
    if (board[r * 8 + f]) return false
    f += df
    r += dr
  }
  return true
}

function updateCastle(castle: string, from: number, to: number): string {
  let c = castle
  if (from === 60 || to === 60) c = c.replace(/K/g, '').replace(/Q/g, '')
  if (from === 4 || to === 4) c = c.replace(/k/g, '').replace(/q/g, '')
  if (from === 63 || to === 63) c = c.replace(/K/g, '')
  if (from === 56 || to === 56) c = c.replace(/Q/g, '')
  if (from === 7 || to === 7) c = c.replace(/k/g, '')
  if (from === 0 || to === 0) c = c.replace(/q/g, '')
  return c || '-'
}

function isWhite(p: Piece): boolean {
  return p === p.toUpperCase()
}

function algebraicToSq(a: string): number {
  const f = a.toLowerCase().charCodeAt(0) - 97
  const r = 8 - Number(a[1])
  return r * 8 + f
}

function sqToAlgebraic(sq: number): string {
  return FILES[sq % 8] + String(8 - Math.floor(sq / 8))
}

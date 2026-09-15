import { allLegalUci, applyMove, pieceAt, sideToMoveWhite } from './chess.ts'

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

/** Weiß minus Schwarz. Nur Material plus grobe Zentrums-Felder — ohne Engine. */
export function materialScore(fen: string): number {
  let score = 0
  for (let f = 0; f < 8; f++) {
    for (let r = 1; r <= 8; r++) {
      const sq = `${String.fromCharCode(97 + f)}${r}`
      const piece = pieceAt(fen, sq)
      if (!piece) continue
      const sign = piece.white ? 1 : -1
      score += sign * (VAL[piece.p] || 0)
      score += sign * squareBonus(piece.p, piece.white, sq)
    }
  }
  return score
}

function squareBonus(p: string, white: boolean, sq: string): number {
  if (p === 'p') {
    if (sq === 'e4' || sq === 'e5') return 25
    if (sq === 'd4' || sq === 'd5') return 20
    if (sq === 'c4' || sq === 'c5' || sq === 'f4' || sq === 'f5') return 8
  }
  if (p === 'n') {
    if (white && (sq === 'c3' || sq === 'f3')) return 18
    if (!white && (sq === 'c6' || sq === 'f6')) return 18
  }
  return 0
}

/**
 * Ein Ply: bester Materialwert für die Seite am Zug.
 * Gleichstand → lexikographisch kleinster UCI, damit Tests fest sind.
 */
export function pickReplyMove(fen: string): string | null {
  const moves = allLegalUci(fen)
  if (!moves.length) return null
  const white = sideToMoveWhite(fen)
  let best = moves[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const uci of moves) {
    const next = applyMove(fen, uci)
    if (!next) continue
    const score = white ? materialScore(next) : -materialScore(next)
    if (score > bestScore || (score === bestScore && uci < best)) {
      bestScore = score
      best = uci
    }
  }
  return best
}

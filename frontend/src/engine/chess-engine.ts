import { allLegalUci, applyMove, inCheck, sideToMoveWhite, threatValue } from './chess.ts'

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

/** Weiß minus Schwarz. Nur Material plus grobe Zentrums-Felder — ohne Engine. */
export function materialScore(fen: string): number {
  const place = (fen || '').split(' ')[0] || ''
  let score = 0
  let file = 0
  let rank = 8
  for (const ch of place) {
    if (ch === '/') {
      file = 0
      rank -= 1
      continue
    }
    if (/\d/.test(ch)) {
      file += Number(ch)
      continue
    }
    const white = ch === ch.toUpperCase()
    const p = ch.toLowerCase()
    const sign = white ? 1 : -1
    score += sign * ((VAL[p] || 0) + squareBonus(p, white, file, rank))
    file += 1
  }
  return score
}

/** 0 am Rand, 7 im Zentrum. */
function centrality(file: number, rank: number): number {
  return 3.5 - Math.abs(file - 3.5) + (3.5 - Math.abs(rank - 4.5))
}

/**
 * Feld-Zuschläge. Ohne sie war die Stellung meist unentschieden bewertet, und
 * der lexikographische Gleichstand schob denselben Turm hin und her.
 */
export function squareBonus(p: string, white: boolean, file: number, rank: number): number {
  const cent = centrality(file, rank)
  if (p === 'p') {
    const step = white ? rank - 2 : 7 - rank
    const sq = `${String.fromCharCode(97 + file)}${rank}`
    let bonus = 6 * Math.max(0, step)
    if (sq === 'e4' || sq === 'e5') bonus += 25
    else if (sq === 'd4' || sq === 'd5') bonus += 20
    else if (/^[cf][45]$/.test(sq)) bonus += 8
    return bonus
  }
  if (p === 'n') return Math.round(4 * cent)
  if (p === 'b') return Math.round(3 * cent)
  if (p === 'r') return Math.round(2 * (3.5 - Math.abs(file - 3.5)))
  if (p === 'q') return Math.round(cent)
  if (p === 'k') return -Math.round(3 * cent)
  return 0
}

const MATE = 100000

/**
 * Ein Ply Material, minus was der Gegner danach abräumt, plus Matt und Schach.
 * Gleichstand → lexikographisch kleinster UCI, damit Tests fest sind.
 */
/** Eine Stellung zum zweiten Mal ist kein Zug, sondern Zeitverschwendung. */
const REPEAT_PENALTY = 45

export function scoreMove(fen: string, uci: string, avoid?: Set<string>): number | null {
  const white = sideToMoveWhite(fen)
  const next = applyMove(fen, uci)
  if (!next) return null
  const mine = white ? 1 : -1
  const repeat = avoid?.has(next.split(' ')[0] || '') ? REPEAT_PENALTY : 0
  // Der volle Zug-Scan ist teuer, deshalb nur im Schach: Matt ist immer Schach.
  if (inCheck(next)) {
    if (!allLegalUci(next).length) return MATE
    return mine * materialScore(next) - threatValue(next) + 14 - repeat
  }
  return mine * materialScore(next) - threatValue(next) - repeat
}

export function pickReplyMove(fen: string, avoid?: Set<string>): string | null {
  const moves = allLegalUci(fen)
  if (!moves.length) return null
  let best = moves[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const uci of moves) {
    const score = scoreMove(fen, uci, avoid)
    if (score === null) continue
    if (score > bestScore || (score === bestScore && uci < best)) {
      bestScore = score
      best = uci
    }
  }
  return best
}

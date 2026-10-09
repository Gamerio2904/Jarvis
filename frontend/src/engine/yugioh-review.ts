import type { MoveRecord } from './yugioh-selfplay.ts'

export type ReviewCandidate = {
  move: number
  halfTurn: number
  side: 0 | 1
  label: string
  kind: MoveRecord['kind']
  drop: number
  bestAlternative: string
  bestValue: number
  chosenValue: number
  valueBefore: number
  valueAfter: number
}

export type ReviewStats = {
  totalMoves: number
  mistakeCandidates: number
  byKind: Record<string, { moves: number; mistakes: number; avgDrop: number }>
  missedAttacks: number
  unusedEffects: number
  tempoLoss: number
}

/** Mark moves where the chosen action scored much worse than the best candidate. */
export function findMistakeCandidates(moves: readonly MoveRecord[], minGap = 0.35): ReviewCandidate[] {
  const out: ReviewCandidate[] = []
  for (const move of moves) {
    if (!move.candidates.length) continue
    const values = move.candidates.map((c, i) => c.value ?? move.candidates[i]?.value ?? 0)
    let bestIdx = 0
    let bestVal = values[0] ?? 0
    values.forEach((v, i) => {
      if (v > bestVal) {
        bestVal = v
        bestIdx = i
      }
    })
    const chosenVal = values[move.chosen] ?? 0
    const gap = bestVal - chosenVal
    const positionDrop = move.valueBefore - move.valueAfter
    if (bestIdx !== move.chosen && gap >= minGap && positionDrop > 0.05) {
      out.push({
        move: move.n,
        halfTurn: move.halfTurn,
        side: move.side,
        label: move.label,
        kind: move.kind,
        drop: gap,
        bestAlternative: move.candidates[bestIdx]?.label ?? '?',
        bestValue: bestVal,
        chosenValue: chosenVal,
        valueBefore: move.valueBefore,
        valueAfter: move.valueAfter,
      })
    }
  }
  return out
}

export function aggregateReviewStats(moves: readonly MoveRecord[], mistakes: readonly ReviewCandidate[]): ReviewStats {
  const byKind: ReviewStats['byKind'] = {}
  for (const move of moves) {
    const key = move.kind
    const bucket = (byKind[key] ||= { moves: 0, mistakes: 0, avgDrop: 0 })
    bucket.moves += 1
  }
  let dropSum = 0
  for (const m of mistakes) {
    const bucket = (byKind[m.kind] ||= { moves: 0, mistakes: 0, avgDrop: 0 })
    bucket.mistakes += 1
    dropSum += m.drop
  }
  if (mistakes.length) {
    for (const key of Object.keys(byKind)) {
      const b = byKind[key]
      if (b.mistakes) b.avgDrop = dropSum / mistakes.length
    }
  }
  const missedAttacks = mistakes.filter((m) => m.kind === 'pass' && /Phase|angr/i.test(m.label)).length
  const unusedEffects = mistakes.filter((m) => m.kind !== 'effect' && /Effekt|aktiviert/i.test(m.bestAlternative)).length
  const tempoLoss = mistakes.filter((m) => m.valueAfter < m.valueBefore - 0.2).length
  return {
    totalMoves: moves.length,
    mistakeCandidates: mistakes.length,
    byKind,
    missedAttacks,
    unusedEffects,
    tempoLoss,
  }
}

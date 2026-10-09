import { duelStateVector } from './yugioh-duel.ts'
import type { LeagueEntry } from './yugioh-league.ts'
import { createDefaultLeague, updateLeagueRatings } from './yugioh-league.ts'
import { aggregateReviewStats, findMistakeCandidates } from './yugioh-review.ts'
import type { NetModel } from './yugioh-net.ts'
import { validateNetModel } from './yugioh-net.ts'
import { SEARCH_PROFILES } from './yugioh-search.ts'
import {
  DEFAULT_AGENT,
  type SelfPlayAgent,
  type SelfPlayResult,
  playSelfPlayMatch,
} from './yugioh-selfplay.ts'

export const PROOF_FORMAT = 'jarvis-yugioh-proof-v1' as const
export const ENGINE_STAMP = '18.45.0-ygo-sim'

export const PUBLIC_HOLDOUT_SEEDS = [101, 202, 303, 404, 505, 606, 707, 808] as const
/** Only used inside verify — not written into the public test block of the proof. */
export const VERIFY_ONLY_SEEDS = [9001, 9002, 9003, 9004] as const

export type ProofMeasurement = {
  opponent: string
  games: number
  wins: number
  winRate: number
  wilsonLow: number
  wilsonHigh: number
  seeds: number[]
}

export type ProofGameRecord = {
  seed: number
  deckSource: string
  winner: 0 | 1 | null
  end: string
  moveCount: number
  moveLabels: string[]
}

export type YugiohProofFile = {
  format: typeof PROOF_FORMAT
  createdAt: string
  appVersion: string
  engineStamp: string
  netSchema: number
  weightsSha256: string
  weightsBeforeSha256: string | null
  hyperparameters: Record<string, number | string | boolean>
  publicSeeds: number[]
  measurements: ProofMeasurement[]
  holdoutMeasurements: ProofMeasurement[]
  games: ProofGameRecord[]
  gate: { passed: boolean; reason: string; beforeWinRate: number; afterWinRate: number }
  league: LeagueEntry[]
  trainingCurve: number[]
  reviewSummary: ReturnType<typeof aggregateReviewStats>
  mistakeCount: number
}

export function wilsonInterval(wins: number, games: number, z = 1.96): { low: number; high: number } {
  if (games < 1) return { low: 0, high: 1 }
  const p = wins / games
  const denom = 1 + (z * z) / games
  const center = p + (z * z) / (2 * games)
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * games)) / games)
  return { low: Math.max(0, (center - margin) / denom), high: Math.min(1, (center + margin) / denom) }
}

export function stableWeightsHash(model: NetModel): string {
  const body = JSON.stringify(validateNetModel(model).params.map((v) => Math.round(v * 1e6) / 1e6))
  let h = 2166136261
  for (let i = 0; i < body.length; i += 1) {
    h ^= body.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function measureAgent(agent: SelfPlayAgent, seeds: readonly number[], deckSource: 'generated' = 'generated'): ProofMeasurement {
  let wins = 0
  const games = seeds.length
  for (const seed of seeds) {
    const result = playSelfPlayMatch({
      seed,
      deckSource,
      agents: [agent, { ...DEFAULT_AGENT, name: 'Referenz', search: null, temperature: 0 }],
    })
    if (result.winner === 0) wins += 1
    else if (result.winner === null) wins += 0.5
  }
  const winRate = wins / games
  const interval = wilsonInterval(Math.round(wins), games)
  return {
    opponent: 'referenz-klon',
    games,
    wins: Math.round(wins),
    winRate,
    wilsonLow: interval.low,
    wilsonHigh: interval.high,
    seeds: [...seeds],
  }
}

export function runProofGames(agent: SelfPlayAgent, seeds: readonly number[]): ProofGameRecord[] {
  return seeds.map((seed) => {
    const result = playSelfPlayMatch({ seed, agents: [agent, agent], deckSource: 'generated' })
    return {
      seed,
      deckSource: 'generated',
      winner: result.winner,
      end: result.end,
      moveCount: result.moves.length,
      moveLabels: result.moves.map((m) => m.label),
    }
  })
}

export type BuildProofOptions = {
  appVersion: string
  model: NetModel
  modelBefore?: NetModel | null
  agent?: SelfPlayAgent
  hyperparameters?: Record<string, number | string | boolean>
  trainingCurve?: number[]
  lastMatch?: SelfPlayResult | null
  gatePassed?: boolean
  gateReason?: string
  beforeWinRate?: number
  afterWinRate?: number
}

export function buildProofFile(options: BuildProofOptions): YugiohProofFile {
  const agent: SelfPlayAgent = options.agent ?? {
    ...DEFAULT_AGENT,
    model: options.model,
    search: SEARCH_PROFILES.proof,
    temperature: 0,
  }
  const publicSeeds = [...PUBLIC_HOLDOUT_SEEDS]
  const measurements = [measureAgent(agent, publicSeeds)]
  const holdoutMeasurements = [measureAgent(agent, VERIFY_ONLY_SEEDS)]
  const games = runProofGames(agent, publicSeeds)
  const mistakes = options.lastMatch ? findMistakeCandidates(options.lastMatch.moves) : []
  const reviewSummary = options.lastMatch
    ? aggregateReviewStats(options.lastMatch.moves, mistakes)
    : { totalMoves: 0, mistakeCandidates: 0, byKind: {}, missedAttacks: 0, unusedEffects: 0, tempoLoss: 0 }
  let league = createDefaultLeague(ENGINE_STAMP)
  league.push({
    id: 'candidate',
    label: 'Kandidat',
    rating: 1000,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    engineStamp: ENGINE_STAMP,
  })
  league = updateLeagueRatings(league, {
    a: 'candidate',
    b: 'heuristic',
    scoreA: measurements[0].winRate,
    games: measurements[0].games,
    seeds: publicSeeds,
  })
  return {
    format: PROOF_FORMAT,
    createdAt: new Date().toISOString(),
    appVersion: options.appVersion,
    engineStamp: ENGINE_STAMP,
    netSchema: 1,
    weightsSha256: stableWeightsHash(options.model),
    weightsBeforeSha256: options.modelBefore ? stableWeightsHash(options.modelBefore) : null,
    hyperparameters: options.hyperparameters ?? { temperature: 0, search: 'proof' },
    publicSeeds,
    measurements,
    holdoutMeasurements,
    games,
    gate: {
      passed: options.gatePassed ?? false,
      reason: options.gateReason ?? 'pending',
      beforeWinRate: options.beforeWinRate ?? 0,
      afterWinRate: options.afterWinRate ?? measurements[0].winRate,
    },
    league,
    trainingCurve: options.trainingCurve ?? [],
    reviewSummary,
    mistakeCount: mistakes.length,
  }
}

export type VerifyResult = {
  ok: boolean
  hashOk: boolean
  replayOk: boolean
  statsOk: boolean
  firstMismatch: { seed: number; move: number; expected: string; actual: string } | null
  message: string
  recomputed: ProofMeasurement | null
}

export function verifyProofFile(proof: YugiohProofFile, model: NetModel): VerifyResult {
  if (proof.format !== PROOF_FORMAT) {
    return { ok: false, hashOk: false, replayOk: false, statsOk: false, firstMismatch: null, message: 'Unbekanntes Nachweis-Format.', recomputed: null }
  }
  const hashOk = proof.weightsSha256 === stableWeightsHash(model)
  const agent: SelfPlayAgent = {
    ...DEFAULT_AGENT,
    model,
    search: SEARCH_PROFILES.proof,
    temperature: 0,
  }
  let firstMismatch: VerifyResult['firstMismatch'] = null
  for (const game of proof.games) {
    const replay = playSelfPlayMatch({ seed: game.seed, agents: [agent, agent], deckSource: 'generated' })
    const expected = game.moveLabels
    const actual = replay.moves.map((m) => m.label)
    const len = Math.min(expected.length, actual.length)
    for (let i = 0; i < len; i += 1) {
      if (expected[i] !== actual[i]) {
        firstMismatch = { seed: game.seed, move: i + 1, expected: expected[i], actual: actual[i] }
        break
      }
    }
    if (firstMismatch) break
    if (expected.length !== actual.length && !firstMismatch) {
      firstMismatch = { seed: game.seed, move: len + 1, expected: expected[len] ?? '(ende)', actual: actual[len] ?? '(ende)' }
    }
  }
  const verifySeeds = VERIFY_ONLY_SEEDS
  const recomputed = measureAgent(agent, verifySeeds)
  const replayOk = !firstMismatch
  const statsOk = replayOk && hashOk
  const ok = hashOk && replayOk
  return {
    ok,
    hashOk,
    replayOk,
    statsOk,
    firstMismatch,
    message: ok
      ? 'Verify grün: Hash und Nachspielen stimmen.'
      : !hashOk
        ? 'Hash der Gewichte weicht ab.'
        : firstMismatch
          ? `Abweichung Spiel ${firstMismatch.seed}, Zug ${firstMismatch.move}.`
          : 'Verify fehlgeschlagen.',
    recomputed,
  }
}

export function proofMarkdownSummary(proof: YugiohProofFile): string {
  const m = proof.measurements[0]
  return [
    `# Yu-Gi-Oh! Nachweis`,
    ``,
    `- App ${proof.appVersion} · Engine ${proof.engineStamp}`,
    `- Gewichte SHA ${proof.weightsSha256}`,
    `- Öffentliche Holdout-Winrate ${(m.winRate * 100).toFixed(1)}% (Wilson ${(m.wilsonLow * 100).toFixed(1)}–${(m.wilsonHigh * 100).toFixed(1)}%)`,
    `- Gate: ${proof.gate.passed ? 'bestanden' : 'nicht bestanden'} (${proof.gate.reason})`,
    `- Fehlerkandidaten im letzten Match: ${proof.mistakeCount}`,
  ].join('\n')
}

/** Gate: candidate must not lose more than epsilon vs baseline on fixed seeds. */
export function passesImprovementGate(
  candidateRate: number,
  baselineRate: number,
  epsilon = 0.02,
): { passed: boolean; reason: string } {
  if (candidateRate + epsilon < baselineRate) {
    return { passed: false, reason: `Holdout ${(candidateRate * 100).toFixed(1)}% < Baseline ${(baselineRate * 100).toFixed(1)}%.` }
  }
  if (candidateRate <= baselineRate) {
    return { passed: false, reason: 'Messung korrekt, aber keine Verbesserung.' }
  }
  return { passed: true, reason: 'Holdout nicht schlechter als Baseline.' }
}

export function stateVectorForProof(state: import('./yugioh-duel.ts').DuelState): number[] {
  return duelStateVector(state)
}

import { FEATURE_NAMES, validateNetModel, type NetModel } from './yugioh-net.ts'
import { ENGINE_STAMP, stableWeightsHash } from './yugioh-proof.ts'
import { findMistakeCandidates } from './yugioh-review.ts'
import type { SelfPlayResult } from './yugioh-selfplay.ts'

export const NET_RUN_FORMAT = 'jarvis-yugioh-net-run-v1' as const
export const NET_FILE_FORMAT = 'jarvis-yugioh-net-v1' as const
export const NET_RUNS_KEY = 'jarvis_yugioh_net_runs_v1'
const RUN_LIMIT = 12

export type NetRunMove = {
  n: number
  side: 0 | 1
  actor: 'netz' | 'klon'
  phase: string
  kind: string
  label: string
  chosen: number
  lp: [number, number]
  candidates: { label: string; value: number }[]
}

export type NetRunFile = {
  format: typeof NET_RUN_FORMAT
  id: string
  createdAt: string
  appVersion: string
  engineStamp: string
  mode: 'fast' | 'step'
  episodes: number
  seed: number
  hidden: number
  featureNames: readonly string[]
  score: number
  versus: { net: number; heuristic: number; random: number; games: number; seed: number }
  validation: number
  training: { wins: number; losses: number; draws: number }
  weightsHash: string
  modelBeforeHash: string | null
  model: NetModel
  match: {
    seed: number
    decks: [string, string]
    winner: 0 | 1 | null
    winnerLabel: string
    end: string
    halfTurns: number
    moves: NetRunMove[]
  } | null
  improvements: { move: number; actor: 'netz' | 'klon'; label: string; better: string; drop: number }[]
  notes: string[]
  verify: {
    replay: string
    holdoutSeed: number
    expectedScore: number
    expectedMoveLabels: string[]
  }
}

export type NetFile = {
  format: typeof NET_FILE_FORMAT
  id: string
  createdAt: string
  weightsHash: string
  featureNames: readonly string[]
  hidden: number
  model: NetModel
}

export type RunSort = 'score' | 'newest' | 'episodes'

export function sortNetRuns(runs: readonly NetRunFile[], sort: RunSort): NetRunFile[] {
  const copy = [...runs]
  if (sort === 'episodes') copy.sort((a, b) => b.episodes - a.episodes || b.score - a.score)
  else if (sort === 'newest') copy.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  else copy.sort((a, b) => b.score - a.score || (a.createdAt < b.createdAt ? 1 : -1))
  return copy
}

export function notesForRun(result: SelfPlayResult | null, mode: 'fast' | 'step'): { notes: string[]; improvements: NetRunFile['improvements'] } {
  const mistakes = result ? findMistakeCandidates(result.moves) : []
  const improvements = mistakes.slice(0, 24).map((item) => ({
    move: item.move,
    actor: (item.side === 0 ? 'netz' : 'klon') as 'netz' | 'klon',
    label: item.label,
    better: item.bestAlternative,
    drop: Math.round(item.drop * 1000) / 1000,
  }))
  const effectMisses = improvements.filter((item) => /aktiviert/.test(item.label) || /aktiviert/.test(item.better)).length
  const attackMisses = improvements.filter((item) => /greift/.test(item.better) && !/greift/.test(item.label)).length
  const notes = [
    `Das Netz liest ${FEATURE_NAMES.length} Zugmerkmale. Kartennamen und Volltext sieht es nicht.`,
    'Suche, Brettaufbau, Zerstören, Verbannen, Schwächen, Boost, Mill und Abwerfen haben eigene Werte. effectValue ist die Lagebewertung von −1 bis 1.',
    'Trainiert wird auf erzeugten Archetypen. Der Gegner wechselt zwischen Skript, Heuristik, einem eingefrorenen Netz und einer kurzen Suche. Burn kommt nur in der Erfolgsmessung vor.',
    'Erfolg ist die Holdout-Siegquote des gierigen Netzes. Remis zählt halb. Seed der Messung steht in versus.seed.',
    'Netz und Klon sind dasselbe Gewicht. Seite 0 ist Netz, Seite 1 ist Klon. Temperatur 0, keine Suche.',
  ]
  if (effectMisses) notes.push(`${effectMisses} Stellen: ein Effekt war die bessere oder die schlechtere Wahl. Dort die Effektwertung weiter schärfen.`)
  if (attackMisses) notes.push(`${attackMisses} Stellen: ein Angriff lag bereit und wurde ausgelassen.`)
  if (!improvements.length && result) notes.push('In dieser Partie lag kein Zug deutlich unter der besten Alternative.')
  if (mode === 'step') notes.push('Dieser Lauf ist die sichtbare Partie. Die Erfolgspunktzahl kommt aus der stillen Messung danach.')
  if (mode === 'fast') notes.push('Dieser Lauf hat ohne Brett trainiert. Die Zugfolge ist eine stille Partie danach, mit demselben Seed nachspielbar.')
  return { notes, improvements }
}

export function buildNetRun(options: {
  appVersion: string
  mode: 'fast' | 'step'
  episodes: number
  seed: number
  model: NetModel
  modelBefore?: NetModel | null
  score: number
  versus: NetRunFile['versus']
  validation: number
  training: NetRunFile['training']
  match: SelfPlayResult | null
}): NetRunFile {
  const model = validateNetModel(options.model)
  const feedback = notesForRun(options.match, options.mode)
  const createdAt = new Date().toISOString()
  const id = `ygo-${createdAt.slice(0, 19).replace(/[-:T]/g, '')}-${(options.seed % 0xffff).toString(16)}`
  const moves: NetRunMove[] = (options.match?.moves ?? []).map((move) => ({
    n: move.n,
    side: move.side,
    actor: move.side === 0 ? 'netz' : 'klon',
    phase: move.phase,
    kind: move.kind,
    label: move.label,
    chosen: move.chosen,
    lp: move.lp,
    candidates: move.candidates.map((candidate) => ({
      label: candidate.label,
      value: Math.round(candidate.value * 1000) / 1000,
    })),
  }))
  const winner = options.match?.winner ?? null
  return {
    format: NET_RUN_FORMAT,
    id,
    createdAt,
    appVersion: options.appVersion,
    engineStamp: ENGINE_STAMP,
    mode: options.mode,
    episodes: options.episodes,
    seed: options.seed,
    hidden: model.hidden,
    featureNames: FEATURE_NAMES,
    score: options.score,
    versus: options.versus,
    validation: options.validation,
    training: options.training,
    weightsHash: stableWeightsHash(model),
    modelBeforeHash: options.modelBefore ? stableWeightsHash(options.modelBefore) : null,
    model,
    match: options.match ? {
      seed: options.match.seed,
      decks: options.match.decks,
      winner,
      winnerLabel: winner === 0 ? 'netz' : winner === 1 ? 'klon' : 'remis',
      end: options.match.end,
      halfTurns: options.match.halfTurns,
      moves,
    } : null,
    improvements: feedback.improvements,
    notes: feedback.notes,
    verify: {
      replay: 'playSelfPlayMatch seed, beide Agenten dieses Modell, Temperatur 0, Suche aus, deckSource generated. expectedMoveLabels muss Zug für Zug gleich sein.',
      holdoutSeed: options.versus.seed,
      expectedScore: options.score,
      expectedMoveLabels: moves.map((move) => `${move.actor}: ${move.label}`),
    },
  }
}

export function netFileFromRun(run: NetRunFile): NetFile {
  return {
    format: NET_FILE_FORMAT,
    id: run.id,
    createdAt: run.createdAt,
    weightsHash: run.weightsHash,
    featureNames: run.featureNames,
    hidden: run.hidden,
    model: validateNetModel(run.model),
  }
}

export function netFileFromModel(model: NetModel, id = 'aktuell'): NetFile {
  const valid = validateNetModel(model)
  return {
    format: NET_FILE_FORMAT,
    id,
    createdAt: new Date().toISOString(),
    weightsHash: stableWeightsHash(valid),
    featureNames: FEATURE_NAMES,
    hidden: valid.hidden,
    model: valid,
  }
}

export function loadNetRuns(): NetRunFile[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(NET_RUNS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as NetRunFile[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((row) => {
      if (!row || row.format !== NET_RUN_FORMAT || !row.model) return false
      try {
        validateNetModel(row.model)
        return true
      } catch {
        return false
      }
    })
  } catch {
    return []
  }
}

export function saveNetRun(run: NetRunFile): NetRunFile[] {
  const next = [run, ...loadNetRuns().filter((row) => row.id !== run.id)].slice(0, RUN_LIMIT)
  if (typeof localStorage === 'undefined') return next
  const write = (rows: NetRunFile[]) => localStorage.setItem(NET_RUNS_KEY, JSON.stringify(rows))
  try {
    write(next)
  } catch {
    write(next.slice(0, 4))
  }
  return loadNetRuns()
}

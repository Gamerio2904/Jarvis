import { candidateActions, applyAction, heuristicScore, netScore, type DuelAction, type NetModel } from './yugioh-net.ts'
import type { DuelCard, DuelState } from './yugioh-duel.ts'

// Anytime move search over action sequences inside one turn. The side to move is always `player`
// of the state it searches on (see yugioh-selfplay.ts for how both sides share this view).

export type SearchBudget = {
  // 0 = no wall-clock limit (deterministic profiles). Only the "game" profile uses a time guard.
  maxMs: number
  maxNodes: number
  maxDepth: number
  beamWidth: number
  // Hidden-hand samples; early depths use fewer, deeper ones use all of them.
  samples: number
  // Stop as soon as the best move no longer changes between depths.
  stopWhenStable: boolean
}

export const SEARCH_PROFILES = {
  // Playing against a human: think until the choice is stable, hard stop after 30 s against loops.
  game: { maxMs: 30_000, maxNodes: 400_000, maxDepth: 8, beamWidth: 5, samples: 4, stopWhenStable: true },
  // Self-play and training: small and deterministic (node budget, no clock).
  training: { maxMs: 0, maxNodes: 1_500, maxDepth: 4, beamWidth: 4, samples: 2, stopWhenStable: false },
  // Reproducible verification (proof files): fixed node budget, never time based.
  proof: { maxMs: 0, maxNodes: 6_000, maxDepth: 5, beamWidth: 5, samples: 3, stopWhenStable: false },
} as const satisfies Record<string, SearchBudget>

export type SearchStop = 'trivial' | 'stable' | 'exhausted' | 'depth' | 'nodes' | 'time'

export type SearchResult = {
  index: number
  values: number[]
  depth: number
  nodes: number
  elapsedMs: number
  stoppedBy: SearchStop
}

export type SearchOptions = {
  model?: NetModel | null
  budget?: SearchBudget
  random: () => number
  now?: () => number
}

const WIN = 10

// Static position value from the mover's point of view (roughly -10..10).
export function evaluatePosition(state: DuelState): number {
  if (state.winner) return state.winner === 'player' ? WIN : -WIN
  const power = (card: DuelCard) => (card.position === 'defense' ? (card.def || 0) * 0.6 : card.atk || 0)
  const board = (side: DuelState['player']) => side.monsters.reduce((sum, card) => sum + power(card), 0)
  const lp = (state.player.lp - state.jarvis.lp) / 8000
  const field = (board(state.player) - board(state.jarvis)) / 4000
  const hand = state.player.hand.length - state.jarvis.hand.length
  const backrow = state.player.spells.length - state.jarvis.spells.length
  return 3 * lp + field + 0.15 * hand + 0.1 * backrow
}

const HIDDEN_FIELDS = ['name', 'type', 'kind', 'atk', 'def', 'level', 'effect', 'effectSummary', 'subtype', 'tuner', 'extraKind', 'catalogId', 'imageUrl'] as const

function reveal(slot: DuelCard, source: DuelCard): DuelCard {
  const next: DuelCard = { ...slot }
  const writable = next as unknown as Record<string, unknown>
  const from = source as unknown as Record<string, unknown>
  for (const key of HIDDEN_FIELDS) writable[key] = from[key]
  return next
}

// One possible world for the cards the mover cannot see: the opponent's hand, deck order and
// face-down cards are re-dealt from the pool of everything unseen (the opponent's decklist is
// treated as known, like a player counting cards). Visible information is kept as it is.
export function sampleHiddenState(view: DuelState, random: () => number): DuelState {
  const opponent = view.jarvis
  const pool: DuelCard[] = [...opponent.hand, ...opponent.deck, ...opponent.spells.filter((c) => c.faceDown), ...opponent.monsters.filter((c) => c.faceDown)]
  // Sorted first: the real order of the opponent's hand and deck must not influence the sample.
  pool.sort((a, b) => a.id - b.id)
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const take = (match: (card: DuelCard) => boolean): DuelCard | undefined => {
    const index = pool.findIndex(match)
    return index < 0 ? undefined : pool.splice(index, 1)[0]
  }
  const spells = opponent.spells.map((slot) => {
    if (!slot.faceDown) return slot
    const drawn = take((card) => card.kind === 'spell' || card.kind === 'trap')
    // Without a matching unseen card the slot is simulated as inert instead of leaking its content.
    return drawn ? reveal(slot, drawn) : { ...slot, effect: undefined, effectSummary: undefined }
  })
  const monsters = opponent.monsters.map((slot) => {
    if (!slot.faceDown) return slot
    const drawn = take((card) => card.kind === 'monster')
    return drawn ? reveal(slot, drawn) : slot
  })
  const hand = pool.splice(0, opponent.hand.length)
  return { ...view, jarvis: { ...opponent, spells, monsters, hand, deck: pool } }
}

function stateKey(state: DuelState): string {
  const ids = (cards: DuelCard[]) => cards.map((card) => `${card.id}${card.position === 'defense' ? 'd' : ''}${card.faceDown ? 'f' : ''}${card.boost || ''}`).join(',')
  const side = (p: DuelState['player']) => `${p.lp}|${ids(p.hand)}|${ids(p.monsters)}|${ids(p.spells)}|${p.graveyard.length}|${p.extraDeck.length}|${p.normalSummonUsed ? 1 : 0}|${p.usedEffects.join(',')}`
  return `${state.phase}|${state.chain.length}|${state.attacked.join(',')}|${side(state.player)}#${side(state.jarvis)}`
}

class BudgetExceeded extends Error {
  reason: 'nodes' | 'time'
  constructor(reason: 'nodes' | 'time') {
    super(reason)
    this.reason = reason
  }
}

export function searchAction(view: DuelState, actions: DuelAction[], options: SearchOptions): SearchResult {
  const budget = options.budget ?? SEARCH_PROFILES.training
  const now = options.now ?? Date.now
  const started = now()
  const finish = (index: number, values: number[], depth: number, nodes: number, stoppedBy: SearchStop): SearchResult =>
    ({ index, values, depth, nodes, elapsedMs: now() - started, stoppedBy })
  const prior = (action: DuelAction) => (options.model ? netScore(options.model, action.features) : heuristicScore(action.features))
  const priorValues = actions.map(prior)
  const priorBest = priorValues.indexOf(Math.max(...priorValues))
  if (actions.length <= 1) return finish(0, [evaluatePosition(view)], 0, 0, 'trivial')

  const worlds = Array.from({ length: Math.max(1, budget.samples) }, () => sampleHiddenState(view, options.random))
  let nodes = 0
  let guarded = false
  let truncated = false

  const spend = () => {
    nodes += 1
    if (!guarded) return
    if (nodes > budget.maxNodes) throw new BudgetExceeded('nodes')
    if (budget.maxMs > 0 && now() - started > budget.maxMs) throw new BudgetExceeded('time')
  }
  const tryApply = (state: DuelState, action: DuelAction): DuelState | null => {
    spend()
    try {
      return applyAction(state, action)
    } catch {
      return null
    }
  }

  const valueOf = (state: DuelState, depthLeft: number, memo: Map<string, number>): number => {
    if (state.winner || (state.phase === 'end' && !state.chain.length)) return evaluatePosition(state)
    if (depthLeft <= 0) {
      truncated = true
      return evaluatePosition(state)
    }
    const key = `${stateKey(state)}@${depthLeft}`
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    const options_ = candidateActions(state)
    const ranked = options_
      .map((action) => ({ action, score: prior(action) }))
      .sort((a, b) => b.score - a.score)
    const picked = ranked.slice(0, budget.beamWidth).map((entry) => entry.action)
    const pass = options_.find((action) => action.kind === 'pass')
    if (pass && !picked.includes(pass)) picked.push(pass)
    let best = -Infinity
    for (const action of picked) {
      const child = tryApply(state, action)
      if (child) best = Math.max(best, valueOf(child, depthLeft - 1, memo))
    }
    const value = best === -Infinity ? evaluatePosition(state) : best
    memo.set(key, value)
    return value
  }

  let values = priorValues.slice()
  let bestIndex = priorBest
  let reachedDepth = 0
  let stoppedBy: SearchStop = 'depth'
  let previous: { index: number; value: number } | null = null

  for (let depth = 1; depth <= budget.maxDepth; depth += 1) {
    // Depth 1 is cheap (one ply per action) and always completes, so there is always a real answer.
    guarded = depth > 1
    truncated = false
    const sampleCount = Math.min(worlds.length, depth)
    const sums = new Array<number>(actions.length).fill(0)
    try {
      for (let w = 0; w < sampleCount; w += 1) {
        const memo = new Map<string, number>()
        actions.forEach((action, i) => {
          const child = tryApply(worlds[w], action)
          sums[i] += child ? valueOf(child, depth - 1, memo) : -WIN * 2
        })
      }
    } catch (error) {
      if (error instanceof BudgetExceeded) {
        stoppedBy = error.reason
        break
      }
      throw error
    }
    values = sums.map((sum) => sum / sampleCount)
    const top = Math.max(...values)
    bestIndex = values.indexOf(top)
    reachedDepth = depth
    if (!truncated) {
      stoppedBy = 'exhausted'
      break
    }
    if (budget.stopWhenStable && previous && previous.index === bestIndex && Math.abs(previous.value - top) < 0.02) {
      stoppedBy = 'stable'
      break
    }
    previous = { index: bestIndex, value: top }
  }
  return finish(bestIndex, values, reachedDepth, nodes, stoppedBy)
}

// Greedy for temperature <= 0, otherwise a Boltzmann draw (keeps exploration in training).
export function pickByTemperature(values: number[], temperature: number, random: () => number): number {
  const top = Math.max(...values)
  if (temperature <= 0) return values.indexOf(top)
  const weights = values.map((value) => Math.exp(Math.max(-30, (value - top) / temperature)))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = random() * total
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) return i
  }
  return values.length - 1
}

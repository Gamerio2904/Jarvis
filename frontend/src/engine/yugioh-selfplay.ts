import { buildRealDeck, REAL_DECK_LIST } from './yugioh-deck-library.ts'
import { generateDeck, TRAINING_ARCHETYPES } from './yugioh-decks.ts'
import { createDuel, type DuelCard, type DuelPlayer, type DuelState } from './yugioh-duel.ts'
import { applyAction, candidateActions, heuristicScore, netScore, seededRandom, type DuelAction, type NetModel } from './yugioh-net.ts'
import { evaluatePosition, pickByTemperature, searchAction, SEARCH_PROFILES, type SearchBudget, type SearchStop } from './yugioh-search.ts'

// Self-play: two agents play a full match, alternating turns. The state always lives in the view of
// the side to move (that side is `player`), so the engine and the network are used unchanged.

export type SelfPlayAgent = {
  name: string
  model: NetModel | null
  // null = no search, the move is picked directly from the network / heuristic scores.
  search: SearchBudget | null
  // 0 = always the best move; > 0 = Boltzmann exploration.
  temperature: number
}

export type DeckSource = 'generated' | 'real' | 'mixed'

export type SelfPlayOptions = {
  seed?: number
  agents?: [SelfPlayAgent, SelfPlayAgent]
  deckSource?: DeckSource
  maxHalfTurns?: number
}

export type MoveRecord = {
  n: number
  halfTurn: number
  side: 0 | 1
  phase: DuelState['phase']
  kind: DuelAction['kind'] | 'forced'
  label: string
  candidates: { label: string; value: number }[]
  chosen: number
  valueBefore: number
  valueAfter: number
  search: { depth: number; nodes: number; stoppedBy: SearchStop } | null
  lp: [number, number]
}

export type MatchEnd = 'win' | 'deckout' | 'turnLimit'

export type SelfPlayMatch = {
  seed: number
  agents: [SelfPlayAgent, SelfPlayAgent]
  decks: [string, string]
  // Mover is `player`; use matchBoard() for the fixed orientation (side 0 = player).
  view: DuelState
  mover: 0 | 1
  halfTurn: number
  stepsInTurn: number
  maxHalfTurns: number
  moves: MoveRecord[]
  winner: 0 | 1 | null
  end: MatchEnd | null
  message: string
  random: () => number
}

export type SelfPlayResult = {
  seed: number
  decks: [string, string]
  winner: 0 | 1 | null
  end: MatchEnd
  halfTurns: number
  lp: [number, number]
  moves: MoveRecord[]
}

export const DEFAULT_AGENT: SelfPlayAgent = { name: 'Klon', model: null, search: SEARCH_PROFILES.training, temperature: 0.35 }

const STEPS_PER_TURN = 60

function drawDeck(random: () => number, source: DeckSource, nextId: () => number): { label: string; main: DuelCard[]; extra: DuelCard[] } {
  const real = source === 'real' || (source === 'mixed' && random() < 0.5)
  if (real) {
    const deck = REAL_DECK_LIST[Math.min(REAL_DECK_LIST.length - 1, Math.floor(random() * REAL_DECK_LIST.length))]
    return { label: deck.title, ...buildRealDeck(deck, nextId) }
  }
  const archetype = TRAINING_ARCHETYPES[Math.min(TRAINING_ARCHETYPES.length - 1, Math.floor(random() * TRAINING_ARCHETYPES.length))]
  return { label: archetype, ...generateDeck(archetype, random) }
}

export function createSelfPlayMatch(options: SelfPlayOptions = {}): SelfPlayMatch {
  const seed = options.seed ?? 1
  const random = seededRandom(seed)
  let id = 1
  const nextId = () => id++
  const a = drawDeck(random, options.deckSource ?? 'generated', nextId)
  const b = drawDeck(random, options.deckSource ?? 'generated', nextId)
  const duel = createDuel(a.main, b.main, random, a.extra, b.extra)
  return {
    seed,
    agents: options.agents ?? [DEFAULT_AGENT, DEFAULT_AGENT],
    decks: [a.label, b.label],
    view: { ...duel, phase: 'main1', turnOwner: 'player' },
    mover: 0,
    halfTurn: 1,
    stepsInTurn: 0,
    maxHalfTurns: options.maxHalfTurns ?? 60,
    moves: [],
    winner: null,
    end: null,
    message: 'Match beginnt.',
    random,
  }
}

function clearBoosts(player: DuelPlayer): DuelPlayer {
  if (!player.monsters.some((card) => card.boost)) return player
  return { ...player, monsters: player.monsters.map((card) => (card.boost ? { ...card, atk: Math.max(0, (card.atk || 0) - card.boost), boost: undefined } : card)) }
}

function swapWinner(winner: DuelState['winner']): DuelState['winner'] {
  return winner === 'player' ? 'jarvis' : winner === 'jarvis' ? 'player' : null
}

// Fixed orientation for display: side 0 is `player`, side 1 is `jarvis`.
export function matchBoard(match: SelfPlayMatch): DuelState {
  if (match.mover === 0) return match.view
  return { ...match.view, player: match.view.jarvis, jarvis: match.view.player, winner: swapWinner(match.view.winner) }
}

function describe(view: DuelState, action: DuelAction): string {
  const own = [...view.player.hand, ...view.player.extraDeck, ...view.player.monsters, ...view.player.spells]
  const name = (cardId?: number, cards: DuelCard[] = own) => cards.find((card) => card.id === cardId)?.name ?? 'Karte'
  switch (action.kind) {
    case 'summon': return `beschwört ${name(action.cardId)}`
    case 'extra': return `beschwört ${name(action.cardId)} aus dem Extra Deck`
    case 'direct': return `greift direkt an mit ${name(action.cardId)}`
    case 'attack': return `greift ${name(action.targetId, view.jarvis.monsters)} an mit ${name(action.cardId)}`
    case 'effect': return `aktiviert ${name(action.cardId)}`
    default: return view.chain.length ? 'antwortet nicht' : view.phase === 'main1' ? 'wechselt in die Battle Phase' : view.phase === 'battle' ? 'wechselt in die Main Phase 2' : 'beendet den Zug'
  }
}

type Decision = { index: number; values: number[]; search: MoveRecord['search'] }

function decide(view: DuelState, actions: DuelAction[], agent: SelfPlayAgent, random: () => number): Decision {
  if (actions.length === 1) return { index: 0, values: [0], search: null }
  if (agent.search) {
    const result = searchAction(view, actions, { model: agent.model, budget: agent.search, random })
    return {
      index: pickByTemperature(result.values, agent.temperature, random),
      values: result.values,
      search: { depth: result.depth, nodes: result.nodes, stoppedBy: result.stoppedBy },
    }
  }
  const values = actions.map((action) => (agent.model ? netScore(agent.model, action.features) : heuristicScore(action.features)))
  return { index: pickByTemperature(values, agent.temperature, random), values, search: null }
}

function finish(match: SelfPlayMatch, winner: 0 | 1 | null, end: MatchEnd, message: string): SelfPlayMatch {
  return { ...match, winner, end, message }
}

function endTurn(match: SelfPlayMatch): SelfPlayMatch {
  const view = match.view
  if (match.halfTurn >= match.maxHalfTurns) return finish(match, null, 'turnLimit', 'Zuglimit erreicht – Unentschieden.')
  const next = clearBoosts(view.jarvis)
  const deck = [...next.deck]
  const top = deck.pop()
  if (!top) return finish(match, match.mover, 'deckout', 'Deck leer – die Gegenseite kann nicht mehr ziehen.')
  return {
    ...match,
    view: {
      ...view,
      player: { ...next, deck, hand: [...next.hand, top], normalSummonUsed: false, usedEffects: [] },
      jarvis: clearBoosts(view.player),
      phase: 'main1',
      turn: view.turn + 1,
      turnOwner: 'player',
      attacked: [],
      selectedAttacker: null,
      chain: [],
      chainPriority: null,
      chainPasses: 0,
      pendingAttack: null,
      lastAnimation: { id: 0, kind: 'draw', side: 'player' },
      winner: null,
    },
    mover: match.mover === 0 ? 1 : 0,
    halfTurn: match.halfTurn + 1,
    stepsInTurn: 0,
    message: `${match.agents[match.mover === 0 ? 1 : 0].name} zieht und beginnt seinen Zug.`,
  }
}

// One visible step: a single action of the side to move (or the hand-over to the other side).
export function stepSelfPlayMatch(match: SelfPlayMatch): SelfPlayMatch {
  if (match.end) return match
  const view = match.view
  if (view.winner) {
    const winner = view.winner === 'player' ? match.mover : match.mover === 0 ? 1 : 0
    return finish(match, winner, 'win', `${match.agents[winner].name} gewinnt.`)
  }
  if ((view.phase === 'end' && !view.chain.length) || match.stepsInTurn >= STEPS_PER_TURN) return endTurn(match)
  const agent = match.agents[match.mover]
  const actions = candidateActions(view)
  const decision = decide(view, actions, agent, match.random)
  const chosen = actions[decision.index]
  const valueBefore = evaluatePosition(view)
  let next: DuelState
  let kind: MoveRecord['kind'] = chosen.kind
  let label = describe(view, chosen)
  try {
    next = applyAction(view, chosen)
  } catch {
    kind = 'forced'
    label = 'beendet den Zug (Aktion nicht ausführbar)'
    next = { ...view, chain: [], chainPriority: null, chainPasses: 0, phase: 'end' }
  }
  const record: MoveRecord = {
    n: match.moves.length + 1,
    halfTurn: match.halfTurn,
    side: match.mover,
    phase: view.phase,
    kind,
    label,
    candidates: actions.map((action, index) => ({ label: describe(view, action), value: decision.values[index] })),
    chosen: decision.index,
    valueBefore,
    valueAfter: evaluatePosition(next),
    search: decision.search,
    lp: match.mover === 0 ? [next.player.lp, next.jarvis.lp] : [next.jarvis.lp, next.player.lp],
  }
  return {
    ...match,
    view: next,
    stepsInTurn: match.stepsInTurn + 1,
    moves: [...match.moves, record],
    message: `${agent.name} ${label}.`,
  }
}

export function playSelfPlayMatch(options: SelfPlayOptions = {}): SelfPlayResult {
  let match = createSelfPlayMatch(options)
  const limit = match.maxHalfTurns * (STEPS_PER_TURN + 2) + 10
  for (let i = 0; i < limit && !match.end; i += 1) match = stepSelfPlayMatch(match)
  if (!match.end) match = finish(match, null, 'turnLimit', 'Abbruch: Schrittlimit.')
  const board = matchBoard(match)
  return {
    seed: match.seed,
    decks: match.decks,
    winner: match.winner,
    end: match.end ?? 'turnLimit',
    halfTurns: match.halfTurn,
    lp: [board.player.lp, board.jarvis.lp],
    moves: match.moves,
  }
}

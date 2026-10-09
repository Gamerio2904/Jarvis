import {
  advanceDuelPhase,
  attack,
  createDuel,
  DUEL_SOUP_WEIGHTS,
  selectAttacker,
  scoreDuelAction,
  summonMonster,
  type DuelCard,
  type DuelState,
  type StrategyWeights,
} from './yugioh-duel.ts'

type Candidate = {
  kind: 'summon' | 'attack' | 'direct' | 'advance'
  cardId?: number
  targetId?: number
  features: StrategyWeights
}

type Decision = { difference: StrategyWeights }

export type TrainingResult = {
  weights: StrategyWeights
  episodes: number
  updates: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

export type EvaluationResult = {
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function trainingDeck(): DuelCard[] {
  const attackValues = [1000, 1300, 1500, 1700, 1900, 2100, 2300, 2500]
  return Array.from({ length: 40 }, (_, index) => ({
    id: index + 1,
    catalogId: index + 1,
    name: `Training Monster ${index + 1}`,
    type: 'Normal Monster',
    kind: 'monster' as const,
    atk: attackValues[index % attackValues.length],
    def: 1400 + ((index * 173) % 1100),
    level: 4,
  }))
}

function candidateActions(state: DuelState): Candidate[] {
  const actions: Candidate[] = []
  if (state.phase === 'main1' || state.phase === 'main2') {
    if (!state.player.normalSummonUsed && state.player.monsters.length < 5) {
      for (const card of state.player.hand) {
        if (card.kind !== 'monster' || (card.level || 4) > 4) continue
        actions.push({
          kind: 'summon',
          cardId: card.id,
          features: {
            damage: (card.atk || 0) / 2500,
            board: 1,
            resources: -1 / Math.max(1, state.player.hand.length),
            safety: (card.def || 0) / 3000,
            combo: 1 / (card.level || 4),
          },
        })
      }
    }
  }
  if (state.phase === 'battle') {
    for (const attacker of state.player.monsters) {
      if (state.attacked.includes(attacker.id)) continue
      if (!state.jarvis.monsters.length) {
        actions.push({
          kind: 'direct',
          cardId: attacker.id,
          features: {
            damage: (attacker.atk || 0) / 2500,
            board: 0,
            resources: 0,
            safety: 0,
            combo: 0,
          },
        })
        continue
      }
      for (const target of state.jarvis.monsters) {
        const difference = (attacker.atk || 0) - (target.atk || 0)
        actions.push({
          kind: 'attack',
          cardId: attacker.id,
          targetId: target.id,
          features: {
            damage: Math.max(0, difference) / 2500,
            board: difference > 0 ? 1 : difference < 0 ? -1 : 0,
            resources: 0,
            safety: difference < 0 ? difference / 2500 : 0,
            combo: 0,
          },
        })
      }
    }
  }
  actions.push({
    kind: 'advance',
    features: { damage: 0, board: 0, resources: 0, safety: 0, combo: 0 },
  })
  return actions
}

function probabilities(
  actions: Candidate[],
  weights: StrategyWeights,
  exploration: number,
): { sampling: number[]; basePolicy: number[] } {
  const scores = actions.map((action) => scoreDuelAction(weights, action.features))
  const max = Math.max(...scores)
  const exp = scores.map((score) => Math.exp(Math.max(-30, Math.min(30, score - max))))
  const total = exp.reduce((sum, value) => sum + value, 0)
  const basePolicy = exp.map((value) => value / total)
  return {
    basePolicy,
    sampling: basePolicy.map((probability) => (1 - exploration) * probability + exploration / actions.length),
  }
}

function selectAction(probs: number[], random: () => number): number {
  const sample = random()
  let cumulative = 0
  for (let i = 0; i < probs.length; i += 1) {
    cumulative += probs[i]
    if (sample <= cumulative) return i
  }
  return probs.length - 1
}

function applyAction(state: DuelState, action: Candidate): DuelState {
  if (action.kind === 'summon' && action.cardId !== undefined) return summonMonster(state, action.cardId)
  if (action.kind === 'direct' && action.cardId !== undefined) {
    return attack(selectAttacker(state, action.cardId))
  }
  if (action.kind === 'attack' && action.cardId !== undefined && action.targetId !== undefined) {
    return attack(selectAttacker(state, action.cardId), action.targetId)
  }
  return advanceDuelPhase(state)
}

function playEpisode(
  weights: StrategyWeights,
  random: () => number,
  explore: number,
  trajectory?: Decision[],
): 'win' | 'loss' | 'draw' {
  const deck = trainingDeck()
  let state = createDuel(deck, deck, random)
  let decisions = 0
  while (!state.winner && state.turn <= 40 && decisions < 800) {
    if (state.phase === 'end') {
      state = advanceDuelPhase(state)
      continue
    }
    const actions = candidateActions(state)
    if (actions.length === 1) {
      state = applyAction(state, actions[0])
    } else {
      const { sampling, basePolicy } = probabilities(actions, weights, explore)
      const selectedIndex = selectAction(sampling, random)
      const selected = actions[selectedIndex]
      if (trajectory) {
        const expected = actions.reduce<StrategyWeights>((total, action, index) => ({
          damage: total.damage + action.features.damage * basePolicy[index],
          board: total.board + action.features.board * basePolicy[index],
          resources: total.resources + action.features.resources * basePolicy[index],
          safety: total.safety + action.features.safety * basePolicy[index],
          combo: total.combo + action.features.combo * basePolicy[index],
        }), { damage: 0, board: 0, resources: 0, safety: 0, combo: 0 })
        const responsibility = (1 - explore) * basePolicy[selectedIndex] / sampling[selectedIndex]
        trajectory.push({
          difference: {
            damage: (selected.features.damage - expected.damage) * responsibility,
            board: (selected.features.board - expected.board) * responsibility,
            resources: (selected.features.resources - expected.resources) * responsibility,
            safety: (selected.features.safety - expected.safety) * responsibility,
            combo: (selected.features.combo - expected.combo) * responsibility,
          },
        })
      }
      state = applyAction(state, selected)
    }
    decisions += 1
  }
  if (state.winner === 'player') return 'win'
  if (state.winner === 'jarvis') return 'loss'
  return 'draw'
}

function emptyRecord(): EvaluationResult {
  return { games: 0, wins: 0, losses: 0, draws: 0, winRate: 0 }
}

function recordResult(result: EvaluationResult, outcome: 'win' | 'loss' | 'draw'): void {
  result.games += 1
  if (outcome === 'win') result.wins += 1
  else if (outcome === 'loss') result.losses += 1
  else result.draws += 1
  result.winRate = (result.wins + result.draws * 0.5) / result.games
}

export function trainDuelPolicy(
  initialWeights: StrategyWeights = DUEL_SOUP_WEIGHTS,
  episodes = 100,
  seed = 17,
  learningRate = 0.25,
): TrainingResult {
  if (!Number.isInteger(episodes) || episodes < 1 || episodes > 5000) {
    throw new Error('Trainingsumfang muss zwischen 1 und 5000 Episoden liegen.')
  }
  if (!Number.isFinite(learningRate) || learningRate <= 0 || learningRate > 1) {
    throw new Error('Lernrate muss größer 0 und höchstens 1 sein.')
  }
  const weights = { ...initialWeights }
  const random = seededRandom(seed)
  const outcomes = emptyRecord()
  let updates = 0
  for (let episode = 0; episode < episodes; episode += 1) {
    const trajectory: Decision[] = []
    const explore = Math.max(0.04, 0.3 * (1 - episode / episodes))
    const outcome = playEpisode(weights, random, explore, trajectory)
    recordResult(outcomes, outcome)
    const reward = outcome === 'win' ? 1 : outcome === 'loss' ? -1 : 0
    if (reward !== 0 && trajectory.length) {
      const scale = learningRate * reward / trajectory.length
      for (const decision of trajectory) {
        weights.damage = Math.max(-4, Math.min(4, weights.damage + scale * decision.difference.damage))
        weights.board = Math.max(-4, Math.min(4, weights.board + scale * decision.difference.board))
        weights.resources = Math.max(-4, Math.min(4, weights.resources + scale * decision.difference.resources))
        weights.safety = Math.max(-4, Math.min(4, weights.safety + scale * decision.difference.safety))
        weights.combo = Math.max(-4, Math.min(4, weights.combo + scale * decision.difference.combo))
        updates += 1
      }
    }
  }
  return { ...outcomes, weights, episodes, updates }
}

export function evaluateDuelPolicy(
  weights: StrategyWeights,
  games = 100,
  seed = 9001,
): EvaluationResult {
  if (!Number.isInteger(games) || games < 1 || games > 5000) {
    throw new Error('Evaluationsumfang muss zwischen 1 und 5000 Duellen liegen.')
  }
  const random = seededRandom(seed)
  const result = emptyRecord()
  for (let i = 0; i < games; i += 1) {
    recordResult(result, playEpisode(weights, random, 0))
  }
  return result
}

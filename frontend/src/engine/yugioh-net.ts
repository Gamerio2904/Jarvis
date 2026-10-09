import {
  activateDuelEffect,
  advanceDuelPhase,
  attack,
  checkActivation,
  endJarvisTurn,
  setSpellTrap,
  createDuel,
  DUEL_STRATEGIES,
  findMaterialsForExtra,
  passDuelChain,
  selectAttacker,
  summonExtraMonster,
  summonMonster,
  type DuelCard,
  type DuelState,
} from './yugioh-duel.ts'
import {
  EVALUATION_ARCHETYPES,
  generateDeck,
  TRAINING_ARCHETYPES,
  type DeckArchetype,
} from './yugioh-decks.ts'

export const FEATURE_NAMES = [
  'summon', 'extra', 'attack', 'direct', 'effect', 'pass',
  'atk', 'def', 'atkDiff', 'kills', 'suicide', 'trade', 'lethal',
  'effectDraw', 'effectDamage', 'effectHeal', 'effectDestroy', 'effectNegate', 'effectAmount',
  'lpDiff', 'hand', 'ownField', 'oppField', 'tributes', 'materials', 'chainDecision',
  'passWithOptions', 'bias',
] as const
export const FEATURE_COUNT = FEATURE_NAMES.length

type ActionKind = 'summon' | 'extra' | 'attack' | 'direct' | 'effect' | 'pass'

export type DuelAction = {
  kind: ActionKind
  cardId?: number
  targetId?: number
  tributes?: number[]
  materials?: number[]
  features: number[]
}

export type NetModel = { inputs: number; hidden: number; params: number[] }

export type Policy = (actions: DuelAction[], random: () => number) => number

export type NetEvaluation = {
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
  invalidActions: number
  byOpponent: Record<string, { games: number; winRate: number }>
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const clamp = (value: number, min = -1, max = 1) => Math.max(min, Math.min(max, value))
const featureIndex = Object.fromEntries(FEATURE_NAMES.map((name, index) => [name, index])) as Record<(typeof FEATURE_NAMES)[number], number>

function emptyFeatures(): number[] {
  const features = new Array<number>(FEATURE_COUNT).fill(0)
  features[featureIndex.bias] = 1
  return features
}

type Context = { lpDiff: number; hand: number; ownField: number; oppField: number }

function contextOf(state: DuelState): Context {
  return {
    lpDiff: clamp((state.player.lp - state.jarvis.lp) / 8000),
    hand: Math.min(1, state.player.hand.length / 8),
    ownField: state.player.monsters.length / 5,
    oppField: state.jarvis.monsters.length / 5,
  }
}

function base(kind: ActionKind, context: Context, chain: boolean): number[] {
  const features = emptyFeatures()
  features[featureIndex[kind]] = 1
  features[featureIndex.lpDiff] = context.lpDiff
  features[featureIndex.hand] = context.hand
  features[featureIndex.ownField] = context.ownField
  features[featureIndex.oppField] = context.oppField
  features[featureIndex.chainDecision] = chain ? 1 : 0
  return features
}

function withEffect(features: number[], card: DuelCard, opponentLp: number): void {
  const effect = card.effect
  if (!effect) return
  // New effect kinds reuse the existing inputs so stored networks stay compatible.
  const named: Record<string, (typeof FEATURE_NAMES)[number]> = {
    draw: 'effectDraw', search: 'effectDraw', revive: 'effectDraw', boost: 'effectHeal',
    damage: 'effectDamage', heal: 'effectHeal', destroy: 'effectDestroy', negate: 'effectNegate', negateAttack: 'effectNegate',
  }
  features[featureIndex[named[effect.kind]]] = 1
  const amount = effect.kind === 'draw' || effect.kind === 'damage' || effect.kind === 'heal' ? effect.amount : 0
  features[featureIndex.effectAmount] = effect.kind === 'draw' ? amount / 3 : clamp(amount / 2000, 0, 1)
  if (effect.kind === 'damage' && amount >= opponentLp) features[featureIndex.lethal] = 1
}

function tributesNeeded(card: DuelCard): number {
  const level = card.level || 4
  return level >= 7 ? 2 : level >= 5 ? 1 : 0
}

export function candidateActions(state: DuelState): DuelAction[] {
  const context = contextOf(state)
  const actions: DuelAction[] = []
  const player = state.player
  const chain = state.chain.length > 0
  const effectCards = (): DuelCard[] =>
    [...player.hand, ...player.spells, ...player.monsters].filter((card) =>
      Boolean(card.effect)
      && (chain ? card.effect?.kind === 'negate' : card.effect?.kind !== 'negate' && card.kind !== 'trap')
      && checkActivation(state, 'player', card.id) === null)
  if (chain) {
    if (state.chainPriority === 'player') {
      for (const card of effectCards()) {
        const features = base('effect', context, true)
        withEffect(features, card, state.jarvis.lp)
        actions.push({ kind: 'effect', cardId: card.id, features })
      }
    }
  } else if (state.phase === 'main1' || state.phase === 'main2' || state.phase === 'battle') {
    if (state.phase !== 'battle') {
      if (!player.normalSummonUsed) {
        for (const card of player.hand) {
          if (card.kind !== 'monster') continue
          const tributes = tributesNeeded(card)
          if (player.monsters.length < tributes) continue
          if (player.monsters.length - tributes + 1 > 5) continue
          const sacrificed = [...player.monsters].sort((a, b) => (a.atk || 0) - (b.atk || 0)).slice(0, tributes)
          const features = base('summon', context, false)
          features[featureIndex.atk] = (card.atk || 0) / 3000
          features[featureIndex.def] = (card.def || 0) / 3000
          features[featureIndex.tributes] = tributes / 2
          actions.push({ kind: 'summon', cardId: card.id, tributes: sacrificed.map((monster) => monster.id), features })
        }
      }
      for (const card of player.extraDeck) {
        const materials = findMaterialsForExtra(card, player.monsters)
        if (!materials || player.monsters.length - materials.length + 1 > 5) continue
        const features = base('extra', context, false)
        features[featureIndex.atk] = (card.atk || 0) / 3000
        features[featureIndex.def] = (card.def || 0) / 3000
        features[featureIndex.materials] = materials.length / 5
        actions.push({ kind: 'extra', cardId: card.id, materials: materials.map((monster) => monster.id), features })
      }
    } else {
      for (const attacker of player.monsters) {
        if (state.attacked.includes(attacker.id) || attacker.position === 'defense' || attacker.faceDown) continue
        if (!state.jarvis.monsters.length) {
          const features = base('direct', context, false)
          features[featureIndex.atk] = (attacker.atk || 0) / 3000
          if ((attacker.atk || 0) >= state.jarvis.lp) features[featureIndex.lethal] = 1
          actions.push({ kind: 'direct', cardId: attacker.id, features })
          continue
        }
        for (const target of state.jarvis.monsters) {
          const defending = target.position === 'defense'
          const targetPower = (defending ? target.def : target.atk) || 0
          const difference = (attacker.atk || 0) - targetPower
          const features = base('attack', context, false)
          features[featureIndex.atk] = (attacker.atk || 0) / 3000
          features[featureIndex.def] = targetPower / 3000
          features[featureIndex.atkDiff] = clamp(difference / 2500)
          features[featureIndex.kills] = difference > 0 ? 1 : 0
          features[featureIndex.suicide] = difference < 0 ? 1 : 0
          features[featureIndex.trade] = difference === 0 && !defending ? 1 : 0
          if (difference > 0 && !defending && difference >= state.jarvis.lp && state.jarvis.monsters.length === 1) features[featureIndex.lethal] = 1
          actions.push({ kind: 'attack', cardId: attacker.id, targetId: target.id, features })
        }
      }
    }
    for (const card of effectCards()) {
      const features = base('effect', context, false)
      withEffect(features, card, state.jarvis.lp)
      actions.push({ kind: 'effect', cardId: card.id, features })
    }
  }
  const pass = base('pass', context, chain)
  pass[featureIndex.passWithOptions] = Math.min(1, actions.length / 6)
  actions.push({ kind: 'pass', features: pass })
  return actions
}

export function applyAction(state: DuelState, action: DuelAction): DuelState {
  if (action.kind === 'summon' && action.cardId !== undefined) return summonMonster(state, action.cardId, action.tributes || [])
  if (action.kind === 'extra' && action.cardId !== undefined) return summonExtraMonster(state, action.cardId, action.materials || [])
  if (action.kind === 'direct' && action.cardId !== undefined) return attack(selectAttacker(state, action.cardId))
  if (action.kind === 'attack' && action.cardId !== undefined) return attack(selectAttacker(state, action.cardId), action.targetId)
  if (action.kind === 'effect' && action.cardId !== undefined) return activateDuelEffect(state, 'player', action.cardId)
  return state.chain.length ? passDuelChain(state, 'player') : advanceDuelPhase(state)
}

// --- Model: a tiny MLP (hidden = 0 gives a linear model over the same features) ---

export function createNetModel(hidden = 16, seed = 1): NetModel {
  if (!Number.isInteger(hidden) || hidden < 0 || hidden > 64) throw new Error('Hidden-Größe muss zwischen 0 und 64 liegen.')
  const random = seededRandom(seed)
  const inputs = FEATURE_COUNT
  const count = hidden === 0 ? inputs + 1 : hidden * inputs + hidden + hidden + 1
  const scale = hidden === 0 ? 0.05 : 1 / Math.sqrt(inputs)
  return { inputs, hidden, params: Array.from({ length: count }, () => (random() * 2 - 1) * scale) }
}

function scoreWithHidden(model: NetModel, x: number[]): { score: number; hidden: number[] } {
  const { inputs, hidden, params } = model
  if (hidden === 0) {
    let sum = params[inputs]
    for (let i = 0; i < inputs; i += 1) sum += params[i] * x[i]
    return { score: sum, hidden: [] }
  }
  const b1 = hidden * inputs
  const w2 = b1 + hidden
  const activations = new Array<number>(hidden)
  let out = params[w2 + hidden]
  for (let j = 0; j < hidden; j += 1) {
    let sum = params[b1 + j]
    for (let i = 0; i < inputs; i += 1) sum += params[j * inputs + i] * x[i]
    activations[j] = Math.tanh(sum)
    out += params[w2 + j] * activations[j]
  }
  return { score: out, hidden: activations }
}

export function netScore(model: NetModel, features: number[]): number {
  return scoreWithHidden(model, features).score
}

function accumulateGradient(model: NetModel, x: number[], hidden: number[], dOut: number, grad: number[]): void {
  const { inputs, params } = model
  if (model.hidden === 0) {
    for (let i = 0; i < inputs; i += 1) grad[i] += dOut * x[i]
    grad[inputs] += dOut
    return
  }
  const b1 = model.hidden * inputs
  const w2 = b1 + model.hidden
  grad[w2 + model.hidden] += dOut
  for (let j = 0; j < model.hidden; j += 1) {
    grad[w2 + j] += dOut * hidden[j]
    const dHidden = dOut * params[w2 + j] * (1 - hidden[j] * hidden[j])
    grad[b1 + j] += dHidden
    for (let i = 0; i < inputs; i += 1) grad[j * inputs + i] += dHidden * x[i]
  }
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exp = scores.map((score) => Math.exp(Math.max(-30, score - max)))
  const total = exp.reduce((sum, value) => sum + value, 0)
  return exp.map((value) => value / total)
}

export function validateNetModel(model: NetModel): NetModel {
  const expected = model.hidden === 0
    ? FEATURE_COUNT + 1
    : model.hidden * FEATURE_COUNT + 2 * model.hidden + 1
  if (!Number.isInteger(model.hidden) || model.hidden < 0 || model.hidden > 64 || model.inputs !== FEATURE_COUNT) {
    throw new Error('Netzwerkmodell hat eine ungültige Architektur.')
  }
  if (!Array.isArray(model.params) || model.params.length !== expected || model.params.some((value) => !Number.isFinite(value))) {
    throw new Error('Netzwerkgewichte sind unvollständig oder nicht endlich.')
  }
  return model
}

export function averageNetModels(models: readonly NetModel[]): NetModel {
  if (!models.length) throw new Error('Mindestens ein Netzwerk ist für die Soup erforderlich.')
  const first = validateNetModel(models[0])
  for (const model of models) {
    validateNetModel(model)
    if (model.hidden !== first.hidden) throw new Error('Alle Soup-Modelle brauchen dieselbe Architektur.')
  }
  return {
    inputs: first.inputs,
    hidden: first.hidden,
    params: first.params.map((_, index) => models.reduce((sum, model) => sum + model.params[index], 0) / models.length),
  }
}

// --- Policies ---

export const randomPolicy: Policy = (actions, random) => Math.floor(random() * actions.length)

export function greedyNetPolicy(model: NetModel): Policy {
  return (actions) => {
    let best = 0
    let bestScore = -Infinity
    actions.forEach((action, index) => {
      const score = netScore(model, action.features)
      if (score > bestScore) {
        bestScore = score
        best = index
      }
    })
    return best
  }
}

const f = featureIndex
// Hand-written reference strategy over the same features. It is the bar the learned network has to beat.
export function heuristicScore(x: number[]): number {
  return (
    x[f.summon] * (1 + x[f.atk]) +
    x[f.extra] * (2.5 + x[f.atk]) +
    x[f.attack] * (0.6 + 2 * x[f.kills] - 3 * x[f.suicide]) +
    x[f.direct] * (3 + x[f.atk]) +
    x[f.effect] * (1.2 + 0.5 * x[f.effectDraw] + x[f.effectDamage] * (0.5 + 3 * x[f.lethal]) +
      x[f.effectHeal] * (x[f.lpDiff] < 0 ? 0.5 : -0.5) + x[f.effectDestroy] * (x[f.oppField] > 0 ? 1.2 : -3) +
      x[f.effectNegate] * 3) +
    x[f.pass] * 0.5
  )
}

export const heuristicPolicy: Policy = (actions) => {
  let best = 0
  let bestScore = -Infinity
  actions.forEach((action, index) => {
    const score = heuristicScore(action.features)
    if (score > bestScore) {
      bestScore = score
      best = index
    }
  })
  return best
}

// --- Game loop ---

type GameResult = { outcome: 'win' | 'loss' | 'draw'; invalid: number }

function playGame(policy: Policy, random: () => number, agentArchetype: DeckArchetype, opponentArchetype: DeckArchetype): GameResult {
  const own = generateDeck(agentArchetype, random)
  const other = generateDeck(opponentArchetype, random)
  const strategy = DUEL_STRATEGIES[Math.floor(random() * DUEL_STRATEGIES.length)]
  let state = createDuel(own.main, other.main, random, own.extra, other.extra, strategy)
  let invalid = 0
  for (let step = 0; !state.winner && state.turn <= 40 && step < 1500; step += 1) {
    if (!state.chain.length && (state.phase === 'draw' || state.phase === 'standby' || state.phase === 'end')) {
      state = advanceDuelPhase(state)
      continue
    }
    const actions = candidateActions(state)
    const index = actions.length === 1 ? 0 : policy(actions, random)
    try {
      state = applyAction(state, actions[index])
    } catch {
      invalid += 1
      try {
        state = applyAction(state, actions[actions.length - 1])
      } catch {
        break
      }
    }
  }
  const outcome = state.winner === 'player' ? 'win' : state.winner === 'jarvis' ? 'loss' : 'draw'
  return { outcome, invalid }
}

export function evaluatePolicy(
  policy: Policy,
  games = 100,
  seed = 9001,
  archetypes: readonly DeckArchetype[] = EVALUATION_ARCHETYPES,
): NetEvaluation {
  if (!Number.isInteger(games) || games < 1 || games > 5000) throw new Error('Evaluationsumfang muss zwischen 1 und 5000 Duellen liegen.')
  const random = seededRandom(seed)
  const result: NetEvaluation = { games: 0, wins: 0, losses: 0, draws: 0, winRate: 0, invalidActions: 0, byOpponent: {} }
  const points: Record<string, number> = {}
  for (let i = 0; i < games; i += 1) {
    const agent = archetypes[i % archetypes.length]
    const opponent = archetypes[Math.floor(i / archetypes.length) % archetypes.length]
    const game = playGame(policy, random, agent, opponent)
    result.games += 1
    result.invalidActions += game.invalid
    const point = game.outcome === 'win' ? 1 : game.outcome === 'draw' ? 0.5 : 0
    if (game.outcome === 'win') result.wins += 1
    else if (game.outcome === 'loss') result.losses += 1
    else result.draws += 1
    const entry = (result.byOpponent[opponent] ||= { games: 0, winRate: 0 })
    entry.games += 1
    points[opponent] = (points[opponent] || 0) + point
  }
  result.winRate = (result.wins + result.draws * 0.5) / result.games
  for (const name of Object.keys(result.byOpponent)) result.byOpponent[name].winRate = points[name] / result.byOpponent[name].games
  return result
}

// --- Training (REINFORCE with baseline, entropy bonus and Adam) ---

export type NetTrainingOptions = {
  model?: NetModel
  hidden?: number
  episodes?: number
  seed?: number
  learningRate?: number
  batch?: number
  agentArchetypes?: readonly DeckArchetype[]
  opponentArchetypes?: readonly DeckArchetype[]
  validationGames?: number
}

export type NetTrainingResult = {
  model: NetModel
  episodes: number
  wins: number
  losses: number
  draws: number
  bestValidation: number
}

const VALIDATION_SEED = 515151

export function trainNetPolicy(options: NetTrainingOptions = {}): NetTrainingResult {
  const episodes = options.episodes ?? 600
  if (!Number.isInteger(episodes) || episodes < 1 || episodes > 20000) throw new Error('Trainingsumfang muss zwischen 1 und 20000 Episoden liegen.')
  const learningRate = options.learningRate ?? 0.02
  if (!Number.isFinite(learningRate) || learningRate <= 0 || learningRate > 1) throw new Error('Lernrate muss größer 0 und höchstens 1 sein.')
  const model: NetModel = options.model
    ? { ...validateNetModel(options.model), params: [...options.model.params] }
    : createNetModel(options.hidden ?? 16, (options.seed ?? 7) + 1)
  const agents = options.agentArchetypes ?? TRAINING_ARCHETYPES
  const opponents = options.opponentArchetypes ?? TRAINING_ARCHETYPES
  const batch = options.batch ?? 8
  const validationGames = options.validationGames ?? 60
  const random = seededRandom(options.seed ?? 7)
  const m1 = new Array<number>(model.params.length).fill(0)
  const m2 = new Array<number>(model.params.length).fill(0)
  const validate = (candidate: NetModel) => evaluatePolicy(greedyNetPolicy(candidate), validationGames, VALIDATION_SEED, TRAINING_ARCHETYPES).winRate
  let best = { ...model, params: [...model.params] }
  let bestValidation = validate(model)
  let baseline = 0
  let step = 0
  let wins = 0
  let losses = 0
  let draws = 0
  let grad = new Array<number>(model.params.length).fill(0)
  const checkpointEvery = Math.max(batch * 4, Math.floor(episodes / 10))
  for (let episode = 0; episode < episodes; episode += 1) {
    const trajectory: { xs: number[][]; hidden: number[][]; probs: number[]; chosen: number }[] = []
    const policy: Policy = (actions, rng) => {
      const scored = actions.map((action) => scoreWithHidden(model, action.features))
      const probs = softmax(scored.map((entry) => entry.score))
      let sample = rng()
      let chosen = probs.length - 1
      for (let i = 0; i < probs.length; i += 1) {
        sample -= probs[i]
        if (sample <= 0) { chosen = i; break }
      }
      trajectory.push({ xs: actions.map((action) => action.features), hidden: scored.map((entry) => entry.hidden), probs, chosen })
      return chosen
    }
    const game = playGame(policy, random, agents[episode % agents.length], opponents[Math.floor(random() * opponents.length)])
    const reward = game.outcome === 'win' ? 1 : game.outcome === 'loss' ? -1 : 0
    if (reward === 1) wins += 1
    else if (reward === -1) losses += 1
    else draws += 1
    const advantage = reward - baseline
    baseline += 0.03 * advantage
    for (const decision of trajectory) {
      const entropy = -decision.probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0)
      decision.probs.forEach((p, i) => {
        const policyTerm = (i === decision.chosen ? 1 : 0) - p
        const entropyTerm = -p * ((p > 0 ? Math.log(p) : 0) + entropy)
        const dScore = (advantage * policyTerm + 0.01 * entropyTerm) / trajectory.length
        accumulateGradient(model, decision.xs[i], decision.hidden[i], dScore, grad)
      })
    }
    if ((episode + 1) % batch === 0 || episode === episodes - 1) {
      step += 1
      for (let i = 0; i < model.params.length; i += 1) {
        const g = grad[i] / batch
        m1[i] = 0.9 * m1[i] + 0.1 * g
        m2[i] = 0.999 * m2[i] + 0.001 * g * g
        model.params[i] += learningRate * (m1[i] / (1 - 0.9 ** step)) / (Math.sqrt(m2[i] / (1 - 0.999 ** step)) + 1e-8)
      }
      grad = new Array<number>(model.params.length).fill(0)
    }
    if ((episode + 1) % checkpointEvery === 0 || episode === episodes - 1) {
      const score = validate(model)
      if (score > bestValidation) {
        bestValidation = score
        best = { ...model, params: [...model.params] }
      }
    }
  }
  return { model: best, episodes, wins, losses, draws, bestValidation }
}

// Behaviour cloning of the heuristic gives reinforcement learning a sensible starting point.
export function imitateHeuristic(model: NetModel, games = 200, seed = 31, epochs = 3, learningRate = 0.02): NetModel {
  const next: NetModel = { ...validateNetModel(model), params: [...model.params] }
  const random = seededRandom(seed)
  const samples: { xs: number[][]; target: number }[] = []
  const collector: Policy = (actions, rng) => {
    const target = heuristicPolicy(actions, rng)
    samples.push({ xs: actions.map((action) => action.features), target })
    return rng() < 0.15 ? Math.floor(rng() * actions.length) : target
  }
  for (let i = 0; i < games; i += 1) {
    playGame(collector, random, TRAINING_ARCHETYPES[i % TRAINING_ARCHETYPES.length], TRAINING_ARCHETYPES[Math.floor(random() * TRAINING_ARCHETYPES.length)])
  }
  const m1 = new Array<number>(next.params.length).fill(0)
  const m2 = new Array<number>(next.params.length).fill(0)
  let step = 0
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    for (let start = 0; start < samples.length; start += 64) {
      const grad = new Array<number>(next.params.length).fill(0)
      const chunk = samples.slice(start, start + 64)
      for (const sample of chunk) {
        const scored = sample.xs.map((x) => scoreWithHidden(next, x))
        const probs = softmax(scored.map((entry) => entry.score))
        probs.forEach((p, i) => accumulateGradient(next, sample.xs[i], scored[i].hidden, (i === sample.target ? 1 : 0) - p, grad))
      }
      step += 1
      for (let i = 0; i < next.params.length; i += 1) {
        const g = grad[i] / chunk.length
        m1[i] = 0.9 * m1[i] + 0.1 * g
        m2[i] = 0.999 * m2[i] + 0.001 * g * g
        next.params[i] += learningRate * (m1[i] / (1 - 0.9 ** step)) / (Math.sqrt(m2[i] / (1 - 0.999 ** step)) + 1e-8)
      }
    }
  }
  return next
}

// --- Model Soup over specialist networks that share one starting point ---

export type SoupResult = {
  soup: NetModel
  specialists: { archetype: DeckArchetype; validation: number }[]
  included: DeckArchetype[]
  soupValidation: number
}

export function trainNetSoup(options: {
  hidden?: number
  seed?: number
  baseEpisodes?: number
  specialistEpisodes?: number
  validationGames?: number
} = {}): SoupResult {
  const seed = options.seed ?? 7
  const validationGames = options.validationGames ?? 80
  const shared = trainNetPolicy({ hidden: options.hidden ?? 16, seed, episodes: options.baseEpisodes ?? 400, validationGames })
  const branches = (['aggro', 'control', 'combo'] as const).map((archetype, index) => {
    const trained = trainNetPolicy({
      model: shared.model,
      seed: seed + 100 + index,
      episodes: options.specialistEpisodes ?? 200,
      agentArchetypes: [archetype],
      learningRate: 0.01,
      validationGames,
    })
    const validation = evaluatePolicy(greedyNetPolicy(trained.model), validationGames, VALIDATION_SEED + 1, TRAINING_ARCHETYPES).winRate
    return { archetype, model: trained.model, validation }
  })
  const ordered = [...branches].sort((a, b) => b.validation - a.validation)
  const score = (models: NetModel[]) => evaluatePolicy(greedyNetPolicy(averageNetModels(models)), validationGames, VALIDATION_SEED + 1, TRAINING_ARCHETYPES).winRate
  let members = [ordered[0]]
  let soupValidation = ordered[0].validation
  for (const candidate of ordered.slice(1)) {
    const trial = score([...members, candidate].map((entry) => entry.model))
    if (trial >= soupValidation) {
      members = [...members, candidate]
      soupValidation = trial
    }
  }
  return {
    soup: averageNetModels(members.map((entry) => entry.model)),
    specialists: branches.map(({ archetype, validation }) => ({ archetype, validation })),
    included: members.map((entry) => entry.archetype),
    soupValidation,
  }
}

// --- Jarvis plays a real duel with the network ---

function mirror(state: DuelState): DuelState {
  return { ...state, player: state.jarvis, jarvis: state.player }
}

function mirrorWinner(winner: DuelState['winner']): DuelState['winner'] {
  return winner === 'player' ? 'jarvis' : winner === 'jarvis' ? 'player' : null
}

// Jarvis' turn, decided by the network. The board is mirrored so the same player-side rules and
// features apply; the human opponent still answers effect chains through the scripted responder.
export function runNetJarvisTurn(state: DuelState, model: NetModel): DuelState {
  if (state.winner) return state
  const policy = greedyNetPolicy(validateNetModel(model))
  const random = seededRandom(state.turn * 7919 + 13)
  const jarvis = { ...state.jarvis, deck: [...state.jarvis.deck], hand: [...state.jarvis.hand] }
  const card = jarvis.deck.pop()
  if (!card) return { ...state, winner: 'player', message: 'Jarvis kann keine Karte mehr ziehen. Du gewinnst das Duell!' }
  jarvis.hand.push(card)
  let view: DuelState = {
    ...state,
    player: { ...jarvis, normalSummonUsed: false, usedEffects: [] },
    jarvis: { ...state.player },
    phase: 'main1',
    attacked: [],
    selectedAttacker: null,
    chain: [],
    chainPriority: null,
    chainPasses: 0,
  }
  const log: string[] = []
  let animation: DuelState['lastAnimation'] = { id: 0, kind: 'draw' }
  for (let step = 0; step < 60 && !view.winner && view.phase !== 'end'; step += 1) {
    const actions = candidateActions(view)
    const chosen = actions[actions.length === 1 ? 0 : policy(actions, random)]
    let next: DuelState
    try {
      next = applyAction(view, chosen)
    } catch {
      next = view.chain.length ? passDuelChain(view, 'player') : advanceDuelPhase(view)
    }
    if (chosen.kind === 'summon' || chosen.kind === 'extra') {
      const name = view.player.hand.concat(view.player.extraDeck).find((c) => c.id === chosen.cardId)?.name
      if (name) log.push(`${chosen.kind === 'extra' ? 'beschwört aus dem Extra Deck' : 'beschwört'} ${name}`)
      animation = { id: chosen.cardId || 0, kind: 'summon' }
    } else if (chosen.kind === 'attack' || chosen.kind === 'direct') {
      const name = view.player.monsters.find((c) => c.id === chosen.cardId)?.name
      if (name) log.push(`greift mit ${name} an`)
      animation = { id: chosen.cardId || 0, kind: 'attack' }
    } else if (chosen.kind === 'effect') {
      const name = [...view.player.hand, ...view.player.spells, ...view.player.monsters].find((c) => c.id === chosen.cardId)?.name
      if (name) log.push(`aktiviert ${name}`)
      animation = { id: chosen.cardId || 0, kind: 'effect' }
    }
    view = next
  }
  const finished = mirror(view)
  const realWinner = mirrorWinner(view.winner)
  const result: DuelState = {
    ...finished,
    player: { ...finished.player, normalSummonUsed: false, usedEffects: [] },
    jarvis: { ...finished.jarvis, normalSummonUsed: false, usedEffects: [] },
    phase: 'draw',
    turn: state.turn + 1,
    attacked: [],
    selectedAttacker: null,
    chain: [],
    chainPriority: null,
    chainPasses: 0,
    lastAnimation: animation,
    winner: realWinner,
    message: realWinner === 'jarvis'
      ? 'Jarvis gewinnt das Duell.'
      : realWinner === 'player'
        ? 'Du gewinnst das Duell!'
        : `Jarvis (Netz) ${log.length ? log.join(', ') : 'passt'}. Dein Zug beginnt.`,
  }
  if (!result.winner) {
    const drawn = result.player.deck.length ? [...result.player.deck] : null
    if (!drawn) return { ...result, winner: 'jarvis', message: 'Du kannst keine Karte mehr ziehen. Jarvis gewinnt das Duell.' }
    const top = drawn.pop()
    return { ...result, player: { ...result.player, deck: drawn, hand: [...result.player.hand, top as DuelCard] } }
  }
  return result
}

// --- Jarvis' turn in single, visible steps (UI plays one step every ~1.5 s and can be interrupted) ---

function mirrorAnimation(animation: DuelState['lastAnimation']): DuelState['lastAnimation'] {
  if (!animation) return animation
  const swap = (side?: 'player' | 'jarvis') => side === 'player' ? 'jarvis' as const : side === 'jarvis' ? 'player' as const : undefined
  return {
    ...animation,
    side: swap(animation.side),
    ...(animation.damage ? { damage: { player: animation.damage.jarvis, jarvis: animation.damage.player } } : {}),
  }
}

// Jarvis' board as "player". The half-turn offset keeps turnKey() equal to the real Jarvis turn.
function jarvisView(state: DuelState): DuelState {
  return {
    ...state,
    player: state.jarvis,
    jarvis: state.player,
    turn: state.turn + 0.5,
    turnOwner: 'player',
    pendingAttack: null,
    selectedAttacker: null,
    chain: [],
    chainPriority: null,
    chainPasses: 0,
  }
}

function fromJarvisView(view: DuelState, real: DuelState): DuelState {
  const winner = mirrorWinner(view.winner)
  return {
    ...real,
    player: view.jarvis,
    jarvis: view.player,
    attacked: view.attacked,
    winner,
    lastAnimation: mirrorAnimation(view.lastAnimation),
    message: winner === 'jarvis' ? 'Jarvis gewinnt das Duell.' : winner === 'player' ? 'Du gewinnst das Duell!' : view.message,
  }
}

const NEXT_JARVIS_PHASE = { draw: 'standby', standby: 'main1', main1: 'battle', battle: 'main2', main2: 'end' } as const
const PHASE_LABEL = { standby: 'Standby Phase', main1: 'Main Phase 1', battle: 'Battle Phase', main2: 'Main Phase 2', end: 'End Phase' } as const

function resolveJarvisAttack(state: DuelState): DuelState {
  const pending = state.pendingAttack
  if (!pending) return state
  const view = { ...jarvisView(state), phase: 'battle' as const, attacked: state.attacked.filter((id) => id !== pending.attackerId) }
  const attacker = view.player.monsters.find((card) => card.id === pending.attackerId)
  const target = pending.targetId === null ? null : view.jarvis.monsters.find((card) => card.id === pending.targetId)
  const blocked = !attacker || (pending.targetId === null ? view.jarvis.monsters.length > 0 : !target)
  if (blocked) return { ...state, pendingAttack: null, message: 'Der Angriff von Jarvis fällt aus.' }
  try {
    const result = attack(selectAttacker(view, pending.attackerId), target ? target.id : undefined, { skipTraps: true })
    return { ...fromJarvisView(result, state), pendingAttack: null }
  } catch {
    return { ...state, pendingAttack: null, message: 'Der Angriff von Jarvis fällt aus.' }
  }
}

export function jarvisStep(state: DuelState, model: NetModel | null): DuelState {
  if (state.winner || state.turnOwner !== 'jarvis' || state.chain.length) return state
  const steps = (state.jarvisSteps ?? 0) + 1
  const base: DuelState = { ...state, jarvisSteps: steps }
  if (base.pendingAttack?.side === 'jarvis') return resolveJarvisAttack(base)
  if (base.phase === 'end') return endJarvisTurn(base)
  if (base.phase === 'draw' || base.phase === 'standby') {
    const phase = NEXT_JARVIS_PHASE[base.phase]
    return { ...base, phase, lastAnimation: null, message: `Jarvis: ${PHASE_LABEL[phase as keyof typeof PHASE_LABEL]}.` }
  }
  if (steps > 40) return { ...base, phase: 'end', message: 'Jarvis beendet seinen Zug.' }
  const view = jarvisView(base)
  const advance = (): DuelState => {
    const phase = NEXT_JARVIS_PHASE[base.phase as 'main1' | 'battle' | 'main2']
    return { ...base, phase, attacked: [], lastAnimation: null, message: phase === 'end' ? 'Jarvis: End Phase.' : `Jarvis wechselt in die ${PHASE_LABEL[phase]}.` }
  }
  if (base.phase !== 'battle') {
    const toSet = view.player.hand.find((card) => card.kind === 'trap' || (card.kind === 'spell' && !card.effect))
    if (toSet) {
      try {
        const set = setSpellTrap(view, toSet.id)
        const field = toSet.subtype === 'Field'
        const result = fromJarvisView(set, base)
        return field ? result : { ...result, message: 'Jarvis setzt eine Karte verdeckt.' }
      } catch {
        // Zone full: fall through to the normal decision.
      }
    }
  }
  const actions = candidateActions(view)
  const policy = model ? greedyNetPolicy(validateNetModel(model)) : heuristicPolicy
  const random = seededRandom(base.turn * 7919 + steps * 104729 + 13)
  const chosen = actions[actions.length === 1 ? 0 : policy(actions, random)]
  try {
    if (chosen.kind === 'pass') return advance()
    if (chosen.kind === 'effect' && chosen.cardId !== undefined) return activateDuelEffect(base, 'jarvis', chosen.cardId)
    if ((chosen.kind === 'attack' || chosen.kind === 'direct') && chosen.cardId !== undefined) {
      const attacker = base.jarvis.monsters.find((card) => card.id === chosen.cardId)
      return {
        ...base,
        attacked: [...base.attacked, chosen.cardId],
        pendingAttack: { side: 'jarvis', attackerId: chosen.cardId, targetId: chosen.kind === 'attack' ? chosen.targetId ?? null : null },
        lastAnimation: { id: chosen.cardId, kind: 'attack', side: 'jarvis', targetId: chosen.kind === 'attack' ? chosen.targetId ?? null : null },
        message: `Jarvis greift mit ${attacker?.name ?? 'einem Monster'} an!`,
      }
    }
    if (chosen.kind === 'summon' && chosen.cardId !== undefined) {
      const card = view.player.hand.find((item) => item.id === chosen.cardId)
      const strongestFoe = Math.max(0, ...view.jarvis.monsters.map((monster) => monster.atk || 0))
      const defensive = Boolean(card) && (card?.def || 0) > (card?.atk || 0) + 300 && strongestFoe > (card?.atk || 0)
      const result = fromJarvisView(summonMonster(view, chosen.cardId, chosen.tributes || [], defensive ? 'set' : 'attack'), base)
      return defensive ? { ...result, message: 'Jarvis setzt ein Monster verdeckt in Verteidigung.' } : result
    }
    if (chosen.kind === 'extra' && chosen.cardId !== undefined) {
      return fromJarvisView(summonExtraMonster(view, chosen.cardId, chosen.materials || []), base)
    }
  } catch {
    return advance()
  }
  return advance()
}

// --- Value head (schema v2) and search-guided imitation ---

export const STATE_VALUE_DIM = 14

export type NetBundle = {
  schema: 1 | 2
  policy: NetModel
  value: { hidden: number; params: number[] } | null
}

export function bundleFromPolicy(model: NetModel): NetBundle {
  return { schema: 1, policy: validateNetModel(model), value: null }
}

export function attachValueHead(policy: NetModel, hidden = 8, seed = 3): NetBundle {
  const validated = validateNetModel(policy)
  const random = seededRandom(seed)
  const count = hidden * STATE_VALUE_DIM + hidden + hidden + 1
  const params = Array.from({ length: count }, () => (random() * 2 - 1) * 0.05)
  return { schema: 2, policy: validated, value: { hidden, params } }
}

export function valueScore(bundle: NetBundle, stateVector: number[]): number {
  if (!bundle.value || stateVector.length !== STATE_VALUE_DIM) return 0
  const { hidden, params } = bundle.value
  const b1 = hidden * STATE_VALUE_DIM
  const w2 = b1 + hidden
  let out = params[w2 + hidden]
  for (let j = 0; j < hidden; j += 1) {
    let sum = params[b1 + j]
    for (let i = 0; i < STATE_VALUE_DIM; i += 1) sum += params[j * STATE_VALUE_DIM + i] * stateVector[i]
    out += params[w2 + j] * Math.tanh(sum)
  }
  return Math.tanh(out)
}

export type SelfPlayTrainSample = {
  features: number[][]
  chosen: number
  outcome: number
  stateVector: number[]
}

export function trainFromSelfPlaySamples(
  bundle: NetBundle,
  samples: readonly SelfPlayTrainSample[],
  learningRate = 0.015,
): NetBundle {
  const next: NetBundle = {
    schema: bundle.schema,
    policy: { ...bundle.policy, params: [...bundle.policy.params] },
    value: bundle.value ? { hidden: bundle.value.hidden, params: [...bundle.value.params] } : null,
  }
  if (!samples.length) return next
  const grad = new Array<number>(next.policy.params.length).fill(0)
  for (const sample of samples) {
    const scored = sample.features.map((x) => scoreWithHidden(next.policy, x))
    const probs = softmax(scored.map((entry) => entry.score))
    probs.forEach((p, i) => {
      const target = i === sample.chosen ? 1 : 0
      accumulateGradient(next.policy, sample.features[i], scored[i].hidden, (target - p) * sample.outcome, grad)
    })
    if (next.value && next.schema === 2) {
      const err = sample.outcome - valueScore(next, sample.stateVector)
      const vGrad = err * learningRate * 0.2
      for (let i = 0; i < next.value.params.length; i += 1) next.value.params[i] += vGrad * 0.01
    }
  }
  const scale = learningRate / samples.length
  for (let i = 0; i < next.policy.params.length; i += 1) next.policy.params[i] += grad[i] * scale
  return next
}

export function averageNetCheckpoints(models: readonly NetModel[]): NetModel {
  return averageNetModels(models)
}

export const HOLDOUT_EVAL_SEEDS = [11, 22, 33, 44, 55, 66] as const

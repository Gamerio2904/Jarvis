import {
  activateDuelEffect,
  advanceDuelPhase,
  attack,
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
  const name = (`effect${effect.kind[0].toUpperCase()}${effect.kind.slice(1)}`) as (typeof FEATURE_NAMES)[number]
  features[featureIndex[name]] = 1
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
  const effectCards = (): DuelCard[] => {
    const usable = (card: DuelCard) => Boolean(card.effect) && (!chain || card.effect?.kind === 'negate')
    return [
      ...player.hand.filter((card) => card.kind === 'spell' && usable(card)),
      ...player.spells.filter(usable),
      ...player.monsters.filter((card) => usable(card) && !player.usedEffects.includes(card.id)),
    ].filter((card) => chain || card.effect?.kind !== 'negate')
  }
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
        if (state.attacked.includes(attacker.id)) continue
        if (!state.jarvis.monsters.length) {
          const features = base('direct', context, false)
          features[featureIndex.atk] = (attacker.atk || 0) / 3000
          if ((attacker.atk || 0) >= state.jarvis.lp) features[featureIndex.lethal] = 1
          actions.push({ kind: 'direct', cardId: attacker.id, features })
          continue
        }
        for (const target of state.jarvis.monsters) {
          const difference = (attacker.atk || 0) - (target.atk || 0)
          const features = base('attack', context, false)
          features[featureIndex.atk] = (attacker.atk || 0) / 3000
          features[featureIndex.def] = (target.atk || 0) / 3000
          features[featureIndex.atkDiff] = clamp(difference / 2500)
          features[featureIndex.kills] = difference > 0 ? 1 : 0
          features[featureIndex.suicide] = difference < 0 ? 1 : 0
          features[featureIndex.trade] = difference === 0 ? 1 : 0
          if (difference > 0 && difference >= state.jarvis.lp && state.jarvis.monsters.length === 1) features[featureIndex.lethal] = 1
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

function applyAction(state: DuelState, action: DuelAction): DuelState {
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
function heuristicScore(x: number[]): number {
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

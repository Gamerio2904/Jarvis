export type CardKind = 'monster' | 'spell' | 'trap'
export type ExtraDeckKind = 'fusion' | 'synchro' | 'xyz' | 'link'
export type DuelSide = 'player' | 'jarvis'

export type DuelEffect =
  | { kind: 'draw'; amount: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'destroy'; target: 'monster' }
  | { kind: 'negate' }

export type DuelCard = {
  id: number
  catalogId?: number
  copyLimit?: number
  name: string
  type: string
  kind: CardKind
  atk?: number
  def?: number
  level?: number
  imageUrl?: string
  extraDeck?: boolean
  extraKind?: ExtraDeckKind
  linkRating?: number
  tuner?: boolean
  effect?: DuelEffect
  effectSummary?: string
  faceDown?: boolean
}

export type DuelPlayer = {
  lp: number
  deck: DuelCard[]
  hand: DuelCard[]
  monsters: DuelCard[]
  graveyard: DuelCard[]
  spells: DuelCard[]
  extraDeck: DuelCard[]
  normalSummonUsed: boolean
  usedEffects: number[]
}

export type DuelPhase = 'draw' | 'standby' | 'main1' | 'battle' | 'main2' | 'end'

export type ChainLink = {
  id: number
  controller: DuelSide
  card: DuelCard
  effect: DuelEffect
  negated: boolean
}

export type DuelState = {
  player: DuelPlayer
  jarvis: DuelPlayer
  phase: DuelPhase
  turn: number
  selectedAttacker: number | null
  attacked: number[]
  chain: ChainLink[]
  chainPriority: DuelSide | null
  chainPasses: number
  lastAnimation: { id: number; kind: 'summon' | 'attack' | 'effect' | 'draw' } | null
  jarvisWeights: StrategyWeights
  message: string
  winner: 'player' | 'jarvis' | null
}

export type StrategyWeights = {
  damage: number
  board: number
  resources: number
  safety: number
  combo: number
}

export const DUEL_STRATEGIES: readonly StrategyWeights[] = [
  { damage: 2, board: 1.5, resources: 0.2, safety: 0.2, combo: 0.6 },
  { damage: 0.8, board: 0.7, resources: 1.8, safety: 1.5, combo: 0.7 },
  { damage: 0.8, board: 1.1, resources: 1.2, safety: 0.5, combo: 2 },
]

export const DUEL_SOUP_WEIGHTS = averageModelWeights(DUEL_STRATEGIES)

export function averageModelWeights(models: readonly StrategyWeights[]): StrategyWeights {
  if (!models.length) throw new Error('Mindestens ein Modell ist für das Weight Averaging erforderlich.')
  const keys: (keyof StrategyWeights)[] = ['damage', 'board', 'resources', 'safety', 'combo']
  for (const model of models) {
    if (keys.some((key) => !Number.isFinite(model[key]))) {
      throw new Error('Model-Soup-Gewichte müssen endlich und vollständig sein.')
    }
  }
  const average = (key: keyof StrategyWeights) =>
    models.reduce((sum, model) => sum + model[key], 0) / models.length
  return {
    damage: average('damage'),
    board: average('board'),
    resources: average('resources'),
    safety: average('safety'),
    combo: average('combo'),
  }
}

export function duelStateVector(state: DuelState): number[] {
  const atk = (cards: DuelCard[]) => cards.reduce((sum, card) => sum + (card.atk || 0), 0)
  const phase = ['draw', 'standby', 'main1', 'battle', 'main2', 'end'].indexOf(state.phase)
  return [
    state.player.lp / 8000,
    state.jarvis.lp / 8000,
    state.player.hand.length / 10,
    state.jarvis.hand.length / 10,
    state.player.monsters.length / 5,
    state.jarvis.monsters.length / 5,
    atk(state.player.monsters) / 20000,
    atk(state.jarvis.monsters) / 20000,
    state.player.graveyard.length / 20,
    state.jarvis.graveyard.length / 20,
    state.player.deck.length / 60,
    state.jarvis.deck.length / 60,
    phase / 5,
    state.turn / 20,
  ]
}

export function scoreDuelAction(
  weights: StrategyWeights,
  action: Pick<StrategyWeights, 'damage' | 'board' | 'resources' | 'safety' | 'combo'>,
): number {
  return (
    weights.damage * action.damage +
    weights.board * action.board +
    weights.resources * action.resources +
    weights.safety * action.safety +
    weights.combo * action.combo
  )
}

function shuffled(cards: DuelCard[], random: () => number): DuelCard[] {
  const deck = [...cards]
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function newPlayer(deck: DuelCard[], extraDeck: DuelCard[]): DuelPlayer {
  return { lp: 8000, deck, hand: [], monsters: [], graveyard: [], spells: [], extraDeck, normalSummonUsed: false, usedEffects: [] }
}

function findMaterialsForExtra(card: DuelCard, field: DuelCard[]): DuelCard[] | null {
  const max = Math.min(field.length, 5)
  for (let size = 2; size <= max; size += 1) {
    const search = (start: number, picked: DuelCard[]): DuelCard[] | null => {
      if (picked.length === size) {
        try {
          return extraSummonMaterials(card, field, picked.map((monster) => monster.id))
        } catch {
          return null
        }
      }
      for (let index = start; index <= field.length - (size - picked.length); index += 1) {
        const found = search(index + 1, [...picked, field[index]])
        if (found) return found
      }
      return null
    }
    const found = search(0, [])
    if (found) return found
  }
  return null
}

function draw(player: DuelPlayer, count = 1): number {
  let drawn = 0
  while (drawn < count && player.deck.length) {
    const card = player.deck.pop()
    if (!card) break
    player.hand.push(card)
    drawn += 1
  }
  return drawn
}

export function createDuel(
  playerDeck: DuelCard[],
  jarvisDeck: DuelCard[],
  random: () => number = Math.random,
  playerExtraDeck: DuelCard[] = [],
  jarvisExtraDeck: DuelCard[] = playerExtraDeck,
  jarvisWeights: StrategyWeights = DUEL_SOUP_WEIGHTS,
): DuelState {
  for (const [owner, deck] of [['Spieler', playerDeck], ['Jarvis', jarvisDeck]] as const) {
    if (deck.length < 40 || deck.length > 60) {
      throw new Error(`${owner}-Main-Deck muss 40 bis 60 Karten enthalten.`)
    }
  }
  const player = newPlayer(shuffled(playerDeck, random), [...playerExtraDeck])
  const jarvis = newPlayer(shuffled(jarvisDeck, random), [...jarvisExtraDeck])
  draw(player, 5)
  draw(jarvis, 5)
  return {
    player,
    jarvis,
    phase: 'draw',
    turn: 1,
    selectedAttacker: null,
    attacked: [],
    chain: [],
    chainPriority: null,
    chainPasses: 0,
    lastAnimation: null,
    jarvisWeights: { ...jarvisWeights },
    message: 'Dein Zug. Ziehe eine Karte und führe deine Spielzüge aus.',
    winner: null,
  }
}

function finishBattle(state: DuelState): DuelState {
  if (state.player.lp <= 0) return { ...state, winner: 'jarvis', message: 'Jarvis gewinnt das Duell.' }
  if (state.jarvis.lp <= 0) return { ...state, winner: 'player', message: 'Du gewinnst das Duell!' }
  return state
}

function nextPhase(phase: DuelPhase): DuelPhase {
  const phases: DuelPhase[] = ['draw', 'standby', 'main1', 'battle', 'main2', 'end']
  return phases[(phases.indexOf(phase) + 1) % phases.length]
}

function runJarvisTurn(state: DuelState): DuelState {
  const jarvis = { ...state.jarvis, hand: [...state.jarvis.hand], deck: [...state.jarvis.deck], monsters: [...state.jarvis.monsters], graveyard: [...state.jarvis.graveyard] }
  if (!draw(jarvis)) return { ...state, winner: 'player', message: 'Jarvis kann keine Karte mehr ziehen. Du gewinnst das Duell!' }
  let summonedName = ''
  if (jarvis.monsters.length < 5) {
    const vector = duelStateVector(state)
    const candidates = jarvis.hand
      .filter((card) => card.kind === 'monster' && (card.level || 4) <= 4)
      .sort((a, b) => {
        const score = (card: DuelCard) => scoreDuelAction(state.jarvisWeights, {
          damage: ((card.atk || 0) / 2500) * (vector[5] === 0 ? 1.25 : 1),
          board: 1 / (1 + vector[5] * 5),
          resources: vector[2] - vector[3],
          safety: (card.def || 0) / 3000 + (vector[1] < vector[0] ? (card.atk || 0) / 5000 : 0),
          combo: 1 / (card.level || 4) + (/effect/i.test(card.type) ? 0.2 : 0),
        })
        return score(b) - score(a) || a.id - b.id
      })
    const chosen = candidates[0]
    if (chosen && !jarvis.normalSummonUsed) {
      jarvis.hand.splice(jarvis.hand.indexOf(chosen), 1)
      jarvis.monsters.push(chosen)
      jarvis.normalSummonUsed = true
      summonedName = chosen.name
    }
  }
  let extraSummonedName = ''
  const extraCandidates = [...jarvis.extraDeck].sort((a, b) => (b.atk || 0) - (a.atk || 0))
  for (const extra of extraCandidates) {
    const materials = findMaterialsForExtra(extra, jarvis.monsters)
    if (!materials) continue
    const materialIds = new Set(materials.map((monster) => monster.id))
    jarvis.monsters = jarvis.monsters.filter((monster) => !materialIds.has(monster.id))
    jarvis.graveyard.push(...materials)
    jarvis.extraDeck = jarvis.extraDeck.filter((monster) => monster.id !== extra.id)
    jarvis.monsters.push(extra)
    extraSummonedName = extra.name
    break
  }
  const player = {
    ...state.player,
    monsters: [...state.player.monsters],
    graveyard: [...state.player.graveyard],
    usedEffects: [],
    normalSummonUsed: false,
  }
  for (const attacker of jarvis.monsters) {
    if (state.winner || !jarvis.monsters.includes(attacker)) continue
    if (!player.monsters.length) {
      player.lp = Math.max(0, player.lp - (attacker.atk || 0))
    } else {
      const target = player.monsters.reduce((weakest, card) =>
        (card.atk || 0) < (weakest.atk || 0) ? card : weakest,
      )
      const difference = (attacker.atk || 0) - (target.atk || 0)
      if (difference > 0) {
        player.lp = Math.max(0, player.lp - difference)
        player.monsters.splice(player.monsters.indexOf(target), 1)
        player.graveyard.push(target)
      } else if (difference < 0) {
        jarvis.monsters.splice(jarvis.monsters.indexOf(attacker), 1)
        jarvis.graveyard.push(attacker)
        jarvis.lp = Math.max(0, jarvis.lp + difference)
      } else {
        player.monsters.splice(player.monsters.indexOf(target), 1)
        jarvis.monsters.splice(jarvis.monsters.indexOf(attacker), 1)
        player.graveyard.push(target)
        jarvis.graveyard.push(attacker)
      }
    }
    if (player.lp <= 0) break
  }
  const result = finishBattle({
    ...state,
    player,
    jarvis: { ...jarvis, normalSummonUsed: false, usedEffects: [] },
    phase: 'draw',
    turn: state.turn + 1,
    selectedAttacker: null,
    attacked: [],
    lastAnimation: extraSummonedName || summonedName
      ? { id: extraSummonedName ? jarvis.monsters.find((card) => card.name === extraSummonedName)?.id || 0 : jarvis.monsters.find((card) => card.name === summonedName)?.id || 0, kind: 'summon' }
      : { id: 0, kind: 'draw' },
    message: extraSummonedName
      ? `Jarvis beschwört ${extraSummonedName} aus dem Extra Deck und beendet seinen Zug. Dein Zug beginnt.`
      : summonedName
        ? `Jarvis beschwört ${summonedName} und beendet seinen Zug. Dein Zug beginnt.`
      : 'Jarvis beendet seinen Zug. Dein Zug beginnt.',
  })
  if (!result.winner && !draw(result.player)) {
    return { ...result, winner: 'jarvis', message: 'Du kannst keine Karte mehr ziehen. Jarvis gewinnt das Duell.' }
  }
  return result
}

export function advanceDuelPhase(state: DuelState): DuelState {
  if (state.winner) return state
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase === 'end') return runJarvisTurn(state)
  const phase = nextPhase(state.phase)
  return {
    ...state,
    phase,
    selectedAttacker: null,
    attacked: [],
    lastAnimation: null,
    message: `Deine Phase: ${phase === 'main1' ? 'Main Phase 1' : phase === 'main2' ? 'Main Phase 2' : phase}.`,
  }
}

export function summonMonster(state: DuelState, cardId: number, tributes: number[] = []): DuelState {
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Beschwörungen sind nur in der Main Phase möglich.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.player.normalSummonUsed) throw new Error('Du hast in diesem Zug bereits normalbeschworen.')
  if (state.player.monsters.length >= 5) throw new Error('Deine Monster-Zone ist voll.')
  const cardIndex = state.player.hand.findIndex((card) => card.id === cardId)
  const card = state.player.hand[cardIndex]
  if (!card || card.kind !== 'monster') throw new Error('Diese Karte kann nicht normalbeschworen werden.')
  const tributeCount = (card.level || 4) >= 7 ? 2 : (card.level || 4) >= 5 ? 1 : 0
  if (tributes.length !== tributeCount) throw new Error(`Für ${card.name} brauchst du ${tributeCount} Tribut(e).`)
  if (new Set(tributes).size !== tributes.length || tributes.some((id) => !state.player.monsters.some((monster) => monster.id === id))) {
    throw new Error('Wähle gültige, unterschiedliche Monster für den Tribut.')
  }
  const player = {
    ...state.player,
    hand: [...state.player.hand],
    monsters: [...state.player.monsters],
    graveyard: [...state.player.graveyard],
    normalSummonUsed: true,
  }
  player.hand.splice(cardIndex, 1)
  for (const tribute of tributes) {
    const index = player.monsters.findIndex((monster) => monster.id === tribute)
    player.graveyard.push(...player.monsters.splice(index, 1))
  }
  player.monsters.push(card)
  return { ...state, player, lastAnimation: { id: card.id, kind: 'summon' }, message: `${card.name} wurde beschworen.` }
}

export function extraSummonMaterials(
  card: DuelCard,
  field: DuelCard[],
  materialIds: number[],
): DuelCard[] {
  if (!card.extraDeck || !card.extraKind) throw new Error('Diese Karte ist keine unterstützte Extra-Deck-Karte.')
  if (new Set(materialIds).size !== materialIds.length) throw new Error('Ein Material kann nicht mehrfach gewählt werden.')
  const materials = materialIds.map((id) => field.find((monster) => monster.id === id))
  if (!materials.length || materials.some((monster) => !monster)) throw new Error('Wähle gültige Monster als Materialien.')
  const selected = materials as DuelCard[]
  if (card.extraKind === 'fusion' && selected.length < 2) {
    throw new Error('Für diese vereinfachte Fusionsbeschwörung brauchst du mindestens 2 Monster.')
  }
  if (card.extraKind === 'synchro') {
    const totalLevel = selected.reduce((sum, monster) => sum + (monster.level || 0), 0)
    if (selected.length < 2 || !selected.some((monster) => monster.tuner) || totalLevel !== (card.level || 0)) {
      throw new Error(`Synchro: wähle einen Empfänger und Materialien mit zusammen Stufe ${card.level || 0}.`)
    }
  }
  if (card.extraKind === 'xyz') {
    const rank = card.level || 0
    if (selected.length < 2 || selected.some((monster) => (monster.level || 0) !== rank)) {
      throw new Error(`Xyz: wähle mindestens 2 Monster der Stufe ${rank}.`)
    }
  }
  if (card.extraKind === 'link') {
    const rating = card.linkRating || card.level || 2
    if (selected.length < rating) throw new Error(`Link: wähle mindestens ${rating} Monster als Materialien.`)
  }
  return selected
}

export function summonExtraMonster(state: DuelState, cardId: number, materialIds: number[]): DuelState {
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Extra-Deck-Beschwörungen sind nur in der Main Phase möglich.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.extraDeck.find((item) => item.id === cardId)
  if (!card) throw new Error('Diese Karte liegt nicht in deinem Extra Deck.')
  const materials = extraSummonMaterials(card, state.player.monsters, materialIds)
  if (state.player.monsters.length - materials.length >= 5) throw new Error('Deine Monster-Zone ist voll.')
  const player = {
    ...state.player,
    monsters: state.player.monsters.filter((monster) => !materialIds.includes(monster.id)),
    graveyard: [...state.player.graveyard, ...materials],
    extraDeck: state.player.extraDeck.filter((item) => item.id !== cardId),
    usedEffects: [...state.player.usedEffects],
  }
  player.monsters.push(card)
  return { ...state, player, lastAnimation: { id: card.id, kind: 'summon' }, message: `${card.name} wurde aus dem Extra Deck beschworen.` }
}

export function effectFromDescription(description: string): { effect: DuelEffect; summary: string } | null {
  const text = (description || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const negate = text.match(/negate (?:the )?(?:activation|effect)/i)
  if (negate) return { effect: { kind: 'negate' }, summary: 'Negiert das vorherige Kettenglied (vereinfachte Regel).' }
  if (/destroy (?:1|one) (?:face-up )?(?:monster|card)/i.test(text)) {
    return { effect: { kind: 'destroy', target: 'monster' }, summary: 'Zerstört ein gegnerisches Monster.' }
  }
  const draw = text.match(/draw (?:up to )?(?:(\d+)|a|one) cards?/i)
  if (draw) {
    const amount = Math.max(1, Math.min(3, Number(draw[1] || 1)))
    return { effect: { kind: 'draw', amount }, summary: `Zieht ${amount} Karte(n).` }
  }
  const damage = text.match(/(?:inflict|take) (\d{1,4}) damage to (?:your )?opponent/i)
  if (damage) {
    const amount = Math.max(0, Math.min(8000, Number(damage[1])))
    return { effect: { kind: 'damage', amount }, summary: `Fügt dem Gegner ${amount} Schaden zu.` }
  }
  const heal = text.match(/gain (\d{1,4}) lp/i)
  if (heal) {
    const amount = Math.max(0, Math.min(8000, Number(heal[1])))
    return { effect: { kind: 'heal', amount }, summary: `Stellt ${amount} LP wieder her.` }
  }
  return null
}

function owner(state: DuelState, side: DuelSide): DuelPlayer {
  return side === 'player' ? state.player : state.jarvis
}

function opposite(side: DuelSide): DuelSide {
  return side === 'player' ? 'jarvis' : 'player'
}

export function activateDuelEffect(state: DuelState, side: DuelSide, cardId: number): DuelState {
  if (state.winner) throw new Error('Das Duell ist bereits beendet.')
  if (side !== 'player' && side !== 'jarvis') throw new Error('Unbekannte Duellseite.')
  if (!state.chain.length && !['main1', 'main2', 'battle'].includes(state.phase)) {
    throw new Error('Effekte können in diesem Prototyp nur in der Main- oder Battle Phase gestartet werden.')
  }
  if (state.chain.length && state.chainPriority !== side) throw new Error('Die andere Duellseite hat gerade Priorität.')
  const player = owner(state, side)
  const handCard = player.hand.find((card) => card.id === cardId)
  const fieldCard = player.spells.find((card) => card.id === cardId)
  const monsterCard = player.monsters.find((card) => card.id === cardId)
  const card = handCard || fieldCard || monsterCard
  if (!card?.effect) throw new Error('Für diese Karte ist kein unterstützter Effekt verfügbar.')
  const fromHand = Boolean(handCard)
  if (fromHand && card.kind !== 'spell') throw new Error('Nur Zauberkarten können aus der Hand aktiviert werden.')
  if (monsterCard && player.usedEffects.includes(cardId)) throw new Error('Der Effekt dieses Monsters wurde in diesem Zug bereits aktiviert.')
  const nextOwner = {
    ...player,
    hand: fromHand ? player.hand.filter((item) => item.id !== cardId) : [...player.hand],
    spells: fieldCard ? player.spells.filter((item) => item.id !== cardId) : [...player.spells],
    monsters: [...player.monsters],
    graveyard: [...player.graveyard],
    usedEffects: monsterCard ? [...player.usedEffects, cardId] : [...player.usedEffects],
  }
  const chain = [...state.chain, {
    id: state.chain.length ? state.chain[state.chain.length - 1].id + 1 : 1,
    controller: side,
    card,
    effect: card.effect,
    negated: false,
  }]
  const updated: DuelState = {
    ...state,
    [side]: nextOwner,
    chain,
    chainPriority: opposite(side),
    chainPasses: 0,
    lastAnimation: { id: card.id, kind: 'effect' },
    message: `${side === 'player' ? 'Du' : 'Jarvis'} aktivierst ${card.name}. ${opposite(side) === 'player' ? 'Du kannst reagieren.' : 'Jarvis prüft eine Reaktion.'}`,
  }
  return side === 'player' ? jarvisRespond(updated) : updated
}

function applyEffect(state: DuelState, link: ChainLink): DuelState {
  const source = owner(state, link.controller)
  const target = owner(state, opposite(link.controller))
  const nextSource = { ...source, deck: [...source.deck], hand: [...source.hand], graveyard: [...source.graveyard], monsters: [...source.monsters] }
  const nextTarget = { ...target, deck: [...target.deck], hand: [...target.hand], graveyard: [...target.graveyard], monsters: [...target.monsters] }
  let drawFailed = false
  switch (link.effect.kind) {
    case 'draw':
      drawFailed = draw(nextSource, link.effect.amount) !== link.effect.amount
      break
    case 'damage':
      nextTarget.lp = Math.max(0, nextTarget.lp - link.effect.amount)
      break
    case 'heal':
      nextSource.lp = Math.min(8000, nextSource.lp + link.effect.amount)
      break
    case 'destroy': {
      const targetMonster = nextTarget.monsters.reduce<DuelCard | null>((weakest, monster) =>
        !weakest || (monster.atk || 0) < (weakest.atk || 0) ? monster : weakest, null)
      if (targetMonster) {
        nextTarget.monsters.splice(nextTarget.monsters.indexOf(targetMonster), 1)
        nextTarget.graveyard.push(targetMonster)
      }
      break
    }
    case 'negate':
      break
  }
  if (link.card.kind !== 'monster') nextSource.graveyard.push(link.card)
  const result = finishBattle({
    ...state,
    [link.controller]: nextSource,
    [opposite(link.controller)]: nextTarget,
    message: `${link.card.name}: ${link.card.effectSummary || link.effect.kind}.`,
  })
  return drawFailed
    ? { ...result, winner: opposite(link.controller), message: `${link.card.name}: Der Effekt kann nicht vollständig ziehen; ${link.controller === 'player' ? 'Jarvis' : 'Du'} gewinnst.` }
    : result
}

function resolveChain(state: DuelState): DuelState {
  const chain = state.chain.map((link) => ({ ...link }))
  let next: DuelState = { ...state, chain: [], chainPriority: null, chainPasses: 0 }
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const link = chain[index]
    if (link.negated) {
      next = {
        ...next,
        [link.controller]: {
          ...owner(next, link.controller),
          graveyard: link.card.kind === 'monster'
            ? owner(next, link.controller).graveyard
            : [...owner(next, link.controller).graveyard, link.card],
        },
        message: `${link.card.name} wurde negiert.`,
      }
      continue
    }
    if (link.effect.kind === 'negate') {
      const previous = chain[index - 1]
      if (previous) previous.negated = true
      const source = owner(next, link.controller)
      next = {
        ...next,
        [link.controller]: link.card.kind === 'monster'
          ? source
          : { ...source, graveyard: [...source.graveyard, link.card] },
        message: `${link.card.name} negiert Kettenglied ${previous?.id ?? '—'}.`,
      }
    } else {
      next = applyEffect(next, link)
    }
    if (next.winner) break
  }
  return { ...next, chain: [], chainPriority: null, chainPasses: 0 }
}

export function passDuelChain(state: DuelState, side: DuelSide): DuelState {
  if (!state.chain.length || state.chainPriority !== side) throw new Error('Diese Duellseite hat gerade keine Ketten-Priorität.')
  if (state.chainPasses === 1) {
    const resolved = resolveChain(state)
    return { ...resolved, message: 'Beide Seiten passen. Die Effektkette wurde von oben nach unten aufgelöst.' }
  }
  const nextSide = opposite(side)
  const next = { ...state, chainPasses: 1, chainPriority: nextSide }
  return nextSide === 'jarvis' ? jarvisRespond(next) : { ...next, message: 'Du kannst ein Kettenglied hinzufügen oder passen.' }
}

function jarvisRespond(state: DuelState): DuelState {
  if (state.chainPriority !== 'jarvis') return state
  const negate = state.jarvis.hand.find((card) => card.kind === 'spell' && card.effect?.kind === 'negate')
    || state.jarvis.spells.find((card) => card.effect?.kind === 'negate')
    || state.jarvis.monsters.find((card) => card.effect?.kind === 'negate' && !state.jarvis.usedEffects.includes(card.id))
  if (negate) return activateDuelEffect(state, 'jarvis', negate.id)
  return passDuelChain(state, 'jarvis')
}

export function selectAttacker(state: DuelState, cardId: number): DuelState {
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase !== 'battle' || state.winner) throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  if (!state.player.monsters.some((card) => card.id === cardId)) throw new Error('Dieses Monster ist nicht auf deinem Feld.')
  if (state.attacked.includes(cardId)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  return { ...state, selectedAttacker: state.selectedAttacker === cardId ? null : cardId, message: 'Wähle ein gegnerisches Monster als Ziel.' }
}

export function attack(state: DuelState, targetId?: number): DuelState {
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.winner || state.phase !== 'battle') throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  const attacker = state.player.monsters.find((card) => card.id === state.selectedAttacker)
  if (!attacker) throw new Error('Wähle zuerst eines deiner Monster.')
  if (state.attacked.includes(attacker.id)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  const player = { ...state.player, monsters: [...state.player.monsters] }
  const jarvis = { ...state.jarvis, monsters: [...state.jarvis.monsters], graveyard: [...state.jarvis.graveyard] }
  const attackingPower = attacker.atk || 0
  if (!jarvis.monsters.length) {
    jarvis.lp = Math.max(0, jarvis.lp - attackingPower)
  } else {
    const target = jarvis.monsters.find((card) => card.id === targetId)
    if (!target) throw new Error('Wähle ein Monster von Jarvis als Angriffsziel.')
    const defendingPower = target.atk || 0
    const difference = attackingPower - defendingPower
    if (difference > 0) {
      jarvis.lp = Math.max(0, jarvis.lp - difference)
      jarvis.monsters.splice(jarvis.monsters.indexOf(target), 1)
      jarvis.graveyard.push(target)
    } else if (difference < 0) {
      player.lp = Math.max(0, player.lp + difference)
      player.monsters.splice(player.monsters.indexOf(attacker), 1)
      player.graveyard.push(attacker)
    } else {
      player.monsters.splice(player.monsters.indexOf(attacker), 1)
      jarvis.monsters.splice(jarvis.monsters.indexOf(target), 1)
      player.graveyard.push(attacker)
      jarvis.graveyard.push(target)
    }
  }
  return finishBattle({
    ...state,
    player,
    jarvis,
    selectedAttacker: null,
    attacked: [...state.attacked, attacker.id],
    lastAnimation: { id: attacker.id, kind: 'attack' },
    message: `${attacker.name} greift an.`,
  })
}

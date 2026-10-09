import {
  hasFreeMonsterZone,
  isFirstTurnBattleBlocked,
  registerLinkArrows,
  spellSpeedForCard,
  topChainSpellSpeed,
  canChainSpellSpeed,
} from './yugioh-zones.ts'
import { effectFromDescriptionV2 } from './yugioh-effects.ts'

export type CardKind = 'monster' | 'spell' | 'trap'
export type ExtraDeckKind = 'fusion' | 'synchro' | 'xyz' | 'link'
export type DuelSide = 'player' | 'jarvis'

export type DuelEffect =
  | { kind: 'draw'; amount: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'destroy'; target: 'monster' | 'allMonsters' | 'attackMonsters' | 'spelltrap' }
  | { kind: 'negate' }
  | { kind: 'negateAttack' }
  | { kind: 'search'; amount: number }
  | { kind: 'revive' }
  | { kind: 'boost'; amount: number }
  | { kind: 'banish'; target: 'monster' | 'gyMonster' }
  | { kind: 'bounce'; target: 'monster' }
  | { kind: 'mill'; amount: number }
  | { kind: 'discard'; amount: number }
  | { kind: 'fieldAura'; stat: 'atk'; amount: number }

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
  linkArrows?: number[]
  zoneKind?: 'mmz' | 'emz'
  tuner?: boolean
  effect?: DuelEffect
  effectSummary?: string
  faceDown?: boolean
  // Spell/Trap subtype from the card data (Normal, Quick-Play, Continuous, Equip, Field, Ritual, Counter).
  subtype?: string
  position?: 'attack' | 'defense'
  // Duel-turn key (see turnKey) at which the card was set or last changed position.
  lockedKey?: number
  // ATK added until the end of the turn.
  boost?: number
}

export type DuelPlayer = {
  lp: number
  deck: DuelCard[]
  hand: DuelCard[]
  monsters: DuelCard[]
  graveyard: DuelCard[]
  banished: DuelCard[]
  spells: DuelCard[]
  fieldSpell?: DuelCard | null
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
  spellSpeed: 1 | 2 | 3
}

export type DuelAnimation = {
  id: number
  kind: 'summon' | 'attack' | 'effect' | 'draw' | 'set' | 'destroy' | 'position'
  side?: DuelSide
  targetId?: number | null
  damage?: { player: number; jarvis: number }
  destroyed?: number[]
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
  lastAnimation: DuelAnimation | null
  turnOwner?: DuelSide
  pendingAttack?: { side: DuelSide; attackerId: number; targetId: number | null } | null
  jarvisSteps?: number
  firstPlayer?: DuelSide
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
  return { lp: 8000, deck, hand: [], monsters: [], graveyard: [], banished: [], spells: [], extraDeck, normalSummonUsed: false, usedEffects: [] }
}

export {
  monsterZoneCapacity,
  isFirstTurnBattleBlocked,
  battleActionsAllowed,
  hasFreeMonsterZone,
} from './yugioh-zones.ts'
export { effectFromDescriptionV2, deckEffectCoverage, EFFECT_SCHEMA_VERSION } from './yugioh-effects.ts'

export function turnKey(state: DuelState): number {
  return state.turn * 2 + (state.turnOwner === 'jarvis' ? 1 : 0)
}

function clearBoosts(player: DuelPlayer): DuelPlayer {
  if (!player.monsters.some((card) => card.boost)) return player
  return {
    ...player,
    monsters: player.monsters.map((card) => card.boost ? { ...card, atk: Math.max(0, (card.atk || 0) - card.boost), boost: undefined } : card),
  }
}

export function findMaterialsForExtra(card: DuelCard, field: DuelCard[]): DuelCard[] | null {
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
    firstPlayer: 'player',
    message: 'Dein Zug. Ziehe eine Karte und führe deine Spielzüge aus.',
    winner: null,
  }
}

// Coin flip before a normal duel (player vs Ultron). Exactly one random draw decides who starts.
export function coinFlip(random: () => number = Math.random): DuelSide {
  return random() < 0.5 ? 'player' : 'jarvis'
}

// The player starts by default (createDuel). If Jarvis wins the flip his turn 1 begins instead; like the
// player's first turn it has no draw step, and Jarvis' turn is then played by jarvisStep().
export function giveFirstTurn(state: DuelState, side: DuelSide): DuelState {
  if (side === 'player') {
    return {
      ...state,
      turnOwner: 'player',
      firstPlayer: 'player',
      message: 'Du beginnst das Duell. Führe deine Spielzüge aus.',
    }
  }
  return {
    ...state,
    turnOwner: 'jarvis',
    firstPlayer: 'jarvis',
    phase: 'draw',
    jarvisSteps: 0,
    pendingAttack: null,
    lastAnimation: null,
    message: 'Ultron beginnt das Duell.',
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
  if (hasFreeMonsterZone(jarvis.monsters)) {
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
    const target = player.monsters.length
      ? player.monsters.reduce((weakest, card) => ((card.position === 'defense' ? card.def : card.atk) || 0) < ((weakest.position === 'defense' ? weakest.def : weakest.atk) || 0) ? card : weakest)
      : null
    const outcome = battleOutcome(attacker, target, jarvis, player)
    player.lp = Math.max(0, player.lp - outcome.hurtDefender)
    jarvis.lp = Math.max(0, jarvis.lp - outcome.hurtAttacker)
    if (target && outcome.destroyTarget) {
      player.monsters.splice(player.monsters.indexOf(target), 1)
      player.graveyard.push({ ...target, faceDown: false })
    } else if (target?.faceDown) {
      player.monsters[player.monsters.indexOf(target)] = { ...target, faceDown: false }
    }
    if (outcome.destroyAttacker) {
      jarvis.monsters.splice(jarvis.monsters.indexOf(attacker), 1)
      jarvis.graveyard.push(attacker)
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

function skipBlockedPhases(state: DuelState, phase: DuelPhase): DuelPhase {
  let next = phase
  while (next === 'battle' && isFirstTurnBattleBlocked(state)) {
    next = nextPhase(next)
  }
  return next
}

export function advanceDuelPhase(state: DuelState): DuelState {
  if (state.winner) return state
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase === 'end') return runJarvisTurn(state)
  let phase = skipBlockedPhases(state, nextPhase(state.phase))
  return {
    ...state,
    phase,
    selectedAttacker: null,
    attacked: [],
    lastAnimation: null,
    message: phase === 'battle' && isFirstTurnBattleBlocked(state)
      ? 'In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).'
      : `Deine Phase: ${phase === 'main1' ? 'Main Phase 1' : phase === 'main2' ? 'Main Phase 2' : phase}.`,
  }
}

export function summonMonster(state: DuelState, cardId: number, tributes: number[] = [], mode: 'attack' | 'set' = 'attack'): DuelState {
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Beschwörungen sind nur in der Main Phase möglich.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.player.normalSummonUsed) throw new Error('Du hast in diesem Zug bereits normalbeschworen.')
  if (!hasFreeMonsterZone(state.player.monsters, tributes.length)) throw new Error('Deine Monster-Zone ist voll.')
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
  const placed: DuelCard = mode === 'set'
    ? { ...card, faceDown: true, position: 'defense', lockedKey: turnKey(state), zoneKind: 'mmz' }
    : {
      ...card,
      faceDown: false,
      position: 'attack',
      lockedKey: turnKey(state),
      zoneKind: 'mmz',
      linkArrows: card.extraKind === 'link' ? registerLinkArrows(card) : card.linkArrows,
    }
  player.monsters.push(placed)
  return {
    ...state,
    player,
    lastAnimation: { id: card.id, kind: mode === 'set' ? 'set' : 'summon', side: 'player' },
    message: mode === 'set' ? 'Ein Monster wurde verdeckt in Verteidigung gesetzt.' : `${card.name} wurde beschworen.`,
  }
}

export function setSpellTrap(state: DuelState, cardId: number): DuelState {
  if (state.winner || !['main1', 'main2'].includes(state.phase) || (state.turnOwner ?? 'player') !== 'player') {
    throw new Error('Zauber und Fallen kannst du nur in deiner Main Phase setzen.')
  }
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.hand.find((item) => item.id === cardId)
  if (!card || card.kind === 'monster') throw new Error('Diese Karte ist kein Zauber oder keine Falle.')
  const hand = state.player.hand.filter((item) => item.id !== cardId)
  if (card.kind === 'spell' && card.subtype === 'Field') {
    const old = state.player.fieldSpell
    return {
      ...state,
      player: {
        ...state.player,
        hand,
        fieldSpell: { ...card, faceDown: false },
        graveyard: old ? [...state.player.graveyard, old] : state.player.graveyard,
      },
      lastAnimation: { id: card.id, kind: 'effect', side: 'player' },
      message: `${card.name} wurde als Spielfeldzauber aktiviert.`,
    }
  }
  if (state.player.spells.length >= 5) throw new Error('Deine Zauber-/Fallen-Zone ist voll.')
  return {
    ...state,
    player: { ...state.player, hand, spells: [...state.player.spells, { ...card, faceDown: true, lockedKey: turnKey(state) }] },
    lastAnimation: { id: card.id, kind: 'set', side: 'player' },
    message: `${card.name} wurde gesetzt.`,
  }
}

export function changePosition(state: DuelState, cardId: number): DuelState {
  if (state.winner || !['main1', 'main2'].includes(state.phase) || (state.turnOwner ?? 'player') !== 'player') {
    throw new Error('Die Position wechselst du nur in deiner Main Phase.')
  }
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.monsters.find((item) => item.id === cardId)
  if (!card) throw new Error('Dieses Monster ist nicht auf deinem Feld.')
  if (state.attacked.includes(cardId)) throw new Error('Ein Monster, das angegriffen hat, wechselt seine Position nicht.')
  if ((card.lockedKey ?? -1) >= turnKey(state)) throw new Error('Dieses Monster wurde in diesem Zug bereits beschworen oder gewechselt.')
  const flipped: DuelCard = card.faceDown
    ? { ...card, faceDown: false, position: 'attack', lockedKey: turnKey(state) }
    : { ...card, position: card.position === 'defense' ? 'attack' : 'defense', lockedKey: turnKey(state) }
  return {
    ...state,
    player: { ...state.player, monsters: state.player.monsters.map((item) => item.id === cardId ? flipped : item) },
    lastAnimation: { id: cardId, kind: 'position', side: 'player' },
    message: card.faceDown ? `${card.name} wurde offen in Angriff gedreht.` : `${card.name} wechselt in ${flipped.position === 'defense' ? 'Verteidigung' : 'Angriff'}.`,
  }
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
  if (!hasFreeMonsterZone(state.player.monsters, materials.length)) throw new Error('Deine Monster-Zone ist voll.')
  const player = {
    ...state.player,
    monsters: state.player.monsters.filter((monster) => !materialIds.includes(monster.id)),
    graveyard: [...state.player.graveyard, ...materials],
    extraDeck: state.player.extraDeck.filter((item) => item.id !== cardId),
    usedEffects: [...state.player.usedEffects],
  }
  player.monsters.push({
    ...card,
    zoneKind: card.extraKind === 'link' ? 'emz' : 'mmz',
    linkArrows: card.extraKind === 'link' ? registerLinkArrows(card) : card.linkArrows,
  })
  return { ...state, player, lastAnimation: { id: card.id, kind: 'summon' }, message: `${card.name} wurde aus dem Extra Deck beschworen.` }
}

export function effectFromDescription(description: string): { effect: DuelEffect; summary: string } | null {
  return effectFromDescriptionV2(description)
}

function fieldAuraBonus(player: DuelPlayer): number {
  const field = player.fieldSpell
  if (!field?.effect || field.effect.kind !== 'fieldAura') return 0
  return field.effect.amount
}

function effectiveAtk(attacker: DuelCard, owner: DuelPlayer): number {
  return (attacker.atk || 0) + (attacker.boost || 0) + fieldAuraBonus(owner)
}

function owner(state: DuelState, side: DuelSide): DuelPlayer {
  return side === 'player' ? state.player : state.jarvis
}

function opposite(side: DuelSide): DuelSide {
  return side === 'player' ? 'jarvis' : 'player'
}

function zoneCard(player: DuelPlayer, cardId: number): { card: DuelCard | undefined; zone: 'hand' | 'spells' | 'monsters' | null } {
  const hand = player.hand.find((card) => card.id === cardId)
  if (hand) return { card: hand, zone: 'hand' }
  const spell = player.spells.find((card) => card.id === cardId)
  if (spell) return { card: spell, zone: 'spells' }
  const monster = player.monsters.find((card) => card.id === cardId)
  if (monster) return { card: monster, zone: 'monsters' }
  return { card: undefined, zone: null }
}

// Returns null when the card may be activated right now, otherwise the reason (German, for the UI).
export function checkActivation(state: DuelState, side: DuelSide, cardId: number): string | null {
  if (state.winner) return 'Das Duell ist bereits beendet.'
  if (side !== 'player' && side !== 'jarvis') return 'Unbekannte Duellseite.'
  const me = owner(state, side)
  const foe = owner(state, opposite(side))
  const { card, zone } = zoneCard(me, cardId)
  const effect = card?.effect
  if (!card || !effect || !zone) return 'Für diese Karte ist kein unterstützter Effekt verfügbar.'
  if (zone === 'hand' && card.kind !== 'spell') return 'Nur Zauberkarten können aus der Hand aktiviert werden.'
  if (zone === 'monsters') {
    if (card.faceDown) return 'Verdeckte Monster haben keinen aktivierbaren Effekt.'
    if (me.usedEffects.includes(cardId)) return 'Der Effekt dieses Monsters wurde in diesem Zug bereits aktiviert.'
  }
  const ownTurn = (state.turnOwner ?? 'player') === side
  if (state.chain.length) {
    if (state.chainPriority !== side) return 'Die andere Duellseite hat gerade Priorität.'
    const speed = spellSpeedForCard(card)
    if (!canChainSpellSpeed(topChainSpellSpeed(state), speed)) {
      return 'Diese Karte ist nicht schnell genug, um der Kette beizutreten.'
    }
  } else if (ownTurn) {
    if (!['main1', 'main2', 'battle'].includes(state.phase)) return 'Effekte können nur in der Main- oder Battle Phase gestartet werden.'
  } else if (card.kind !== 'trap' || zone !== 'spells') {
    return 'Im gegnerischen Zug kannst du nur gesetzte Fallen aktivieren.'
  }
  if (card.kind === 'trap' && (card.lockedKey ?? -1) >= turnKey(state)) return 'Diese Falle wurde in diesem Zug gesetzt.'
  switch (effect.kind) {
    case 'negate':
      if (!state.chain.length) return 'Negieren geht nur als Antwort in einer Kette.'
      break
    case 'negateAttack':
      if (!state.pendingAttack || state.pendingAttack.side === side) return 'Es gibt gerade keinen gegnerischen Angriff.'
      break
    case 'destroy':
      if (effect.target === 'spelltrap' ? !foe.spells.length : !foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      if (effect.target === 'attackMonsters' && !foe.monsters.some((monster) => monster.position !== 'defense')) return 'Es gibt kein Ziel für diesen Effekt.'
      break
    case 'search':
      if (!me.deck.length) return 'Das Deck ist leer.'
      break
    case 'revive':
      if (!hasFreeMonsterZone(me.monsters, 0) || !me.graveyard.some((item) => item.kind === 'monster' && !item.extraDeck)) {
        return 'Kein Monster im Friedhof oder keine freie Monsterzone.'
      }
      break
    case 'discard':
      if (effect.amount > me.hand.length) return 'Nicht genug Karten auf der Hand für den Kosten-Effekt.'
      break
    case 'mill':
      if (!me.deck.length) return 'Das Deck ist leer.'
      break
    case 'banish':
      if (effect.target === 'monster' && !foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      if (effect.target === 'gyMonster' && !me.graveyard.some((item) => item.kind === 'monster')) return 'Kein Monster im Friedhof zum Verbannen.'
      break
    case 'bounce':
      if (!foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      break
    case 'boost':
      if (!me.monsters.length) return 'Du hast kein Monster, das den Bonus erhalten kann.'
      break
    default:
      break
  }
  return null
}

export function canActivateCard(state: DuelState, side: DuelSide, cardId: number): boolean {
  return checkActivation(state, side, cardId) === null
}

export function activateDuelEffect(state: DuelState, side: DuelSide, cardId: number): DuelState {
  const problem = checkActivation(state, side, cardId)
  if (problem) throw new Error(problem)
  const player = owner(state, side)
  const { card: original, zone } = zoneCard(player, cardId)
  const card = original as DuelCard
  const effect = card.effect as DuelEffect
  const nextOwner = {
    ...player,
    hand: zone === 'hand' ? player.hand.filter((item) => item.id !== cardId) : [...player.hand],
    spells: zone === 'spells' ? player.spells.filter((item) => item.id !== cardId) : [...player.spells],
    monsters: [...player.monsters],
    graveyard: [...player.graveyard],
    usedEffects: zone === 'monsters' ? [...player.usedEffects, cardId] : [...player.usedEffects],
  }
  const chain = [...state.chain, {
    id: state.chain.length ? state.chain[state.chain.length - 1].id + 1 : 1,
    controller: side,
    card: { ...card, faceDown: false },
    effect,
    negated: false,
    spellSpeed: spellSpeedForCard(card),
  }]
  const updated: DuelState = {
    ...state,
    [side]: nextOwner,
    chain,
    chainPriority: opposite(side),
    chainPasses: 0,
    lastAnimation: { id: card.id, kind: 'effect', side },
    message: `${side === 'player' ? 'Du aktivierst' : 'Jarvis aktiviert'} ${card.name}. ${opposite(side) === 'player' ? 'Du kannst reagieren.' : 'Jarvis prüft eine Reaktion.'}`,
  }
  return side === 'player' ? jarvisRespond(updated) : updated
}

function applyEffect(state: DuelState, link: ChainLink): DuelState {
  const source = owner(state, link.controller)
  const target = owner(state, opposite(link.controller))
  const nextSource = {
    ...source,
    deck: [...source.deck],
    hand: [...source.hand],
    graveyard: [...source.graveyard],
    banished: [...source.banished],
    monsters: [...source.monsters],
    spells: [...source.spells],
  }
  const nextTarget = {
    ...target,
    deck: [...target.deck],
    hand: [...target.hand],
    graveyard: [...target.graveyard],
    banished: [...target.banished],
    monsters: [...target.monsters],
    spells: [...target.spells],
  }
  let drawFailed = false
  let pendingAttack = state.pendingAttack
  const destroyed: number[] = []
  const destroyMonster = (monster: DuelCard) => {
    const index = nextTarget.monsters.indexOf(monster)
    if (index < 0) return
    nextTarget.monsters.splice(index, 1)
    nextTarget.graveyard.push({ ...monster, faceDown: false, boost: undefined })
    destroyed.push(monster.id)
  }
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
      if (link.effect.target === 'spelltrap') {
        const hit = nextTarget.spells.shift()
        if (hit) nextTarget.graveyard.push({ ...hit, faceDown: false })
      } else if (link.effect.target === 'allMonsters') {
        for (const monster of [...nextTarget.monsters]) destroyMonster(monster)
      } else if (link.effect.target === 'attackMonsters') {
        for (const monster of [...nextTarget.monsters]) if (monster.position !== 'defense') destroyMonster(monster)
      } else {
        const targetMonster = nextTarget.monsters.reduce<DuelCard | null>((weakest, monster) =>
          !weakest || (monster.atk || 0) < (weakest.atk || 0) ? monster : weakest, null)
        if (targetMonster) destroyMonster(targetMonster)
      }
      break
    }
    case 'search': {
      const index = nextSource.deck.findIndex((item) => item.kind === 'monster' && !item.extraDeck)
      const [found] = nextSource.deck.splice(index >= 0 ? index : nextSource.deck.length - 1, 1)
      if (found) nextSource.hand.push(found)
      break
    }
    case 'revive': {
      const best = nextSource.graveyard
        .filter((item) => item.kind === 'monster' && !item.extraDeck)
        .reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
      if (best && hasFreeMonsterZone(nextSource.monsters, 0)) {
        nextSource.graveyard.splice(nextSource.graveyard.indexOf(best), 1)
        nextSource.monsters.push({ ...best, faceDown: false, position: 'attack', lockedKey: turnKey(state), zoneKind: 'mmz' })
      }
      break
    }
    case 'banish': {
      if (link.effect.target === 'gyMonster') {
        const best = nextSource.graveyard.find((item) => item.kind === 'monster')
        if (best) {
          nextSource.graveyard.splice(nextSource.graveyard.indexOf(best), 1)
          nextSource.banished.push({ ...best, faceDown: false })
        }
      } else {
        const targetMonster = nextTarget.monsters.reduce<DuelCard | null>((weakest, monster) =>
          !weakest || (monster.atk || 0) < (weakest.atk || 0) ? monster : weakest, null)
        if (targetMonster) {
          nextTarget.monsters.splice(nextTarget.monsters.indexOf(targetMonster), 1)
          nextTarget.banished.push({ ...targetMonster, faceDown: false, boost: undefined })
          destroyed.push(targetMonster.id)
        }
      }
      break
    }
    case 'bounce': {
      const targetMonster = nextTarget.monsters.reduce<DuelCard | null>((weakest, monster) =>
        !weakest || (monster.atk || 0) < (weakest.atk || 0) ? monster : weakest, null)
      if (targetMonster) {
        nextTarget.monsters.splice(nextTarget.monsters.indexOf(targetMonster), 1)
        nextTarget.hand.push({ ...targetMonster, faceDown: false, position: 'attack', boost: undefined })
      }
      break
    }
    case 'mill': {
      for (let i = 0; i < link.effect.amount && nextSource.deck.length; i += 1) {
        const milled = nextSource.deck.pop()
        if (milled) nextSource.graveyard.push(milled)
      }
      break
    }
    case 'discard': {
      for (let i = 0; i < link.effect.amount && nextSource.hand.length; i += 1) {
        nextSource.graveyard.push(nextSource.hand.pop() as DuelCard)
      }
      break
    }
    case 'fieldAura':
      break
    case 'boost': {
      const strongest = nextSource.monsters.reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
      if (strongest) {
        const index = nextSource.monsters.indexOf(strongest)
        nextSource.monsters[index] = { ...strongest, atk: (strongest.atk || 0) + link.effect.amount, boost: (strongest.boost || 0) + link.effect.amount }
      }
      break
    }
    case 'negateAttack':
      pendingAttack = null
      break
    case 'negate':
      break
  }
  if (link.card.kind !== 'monster') nextSource.graveyard.push(link.card)
  const result = finishBattle({
    ...state,
    [link.controller]: nextSource,
    [opposite(link.controller)]: nextTarget,
    pendingAttack,
    lastAnimation: destroyed.length
      ? { id: link.card.id, kind: 'destroy', side: link.controller, destroyed }
      : { id: link.card.id, kind: 'effect', side: link.controller },
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
  return resumePendingAttack({ ...next, chain: [], chainPriority: null, chainPasses: 0 })
}

// An attack by the human waits while Jarvis answers with a trap; it continues when the chain is resolved.
function resumePendingAttack(state: DuelState): DuelState {
  const pending = state.pendingAttack
  if (!pending || pending.side !== 'player' || state.winner) return state
  const attacker = state.player.monsters.find((card) => card.id === pending.attackerId)
  const cleared = { ...state, pendingAttack: null }
  if (!attacker) return { ...cleared, message: `${state.message} Der Angriff fällt aus.` }
  if (pending.targetId === null) {
    return state.jarvis.monsters.length ? { ...cleared, message: `${state.message} Der Angriff fällt aus.` } : resolveBattle(cleared, attacker, null)
  }
  const target = state.jarvis.monsters.find((card) => card.id === pending.targetId)
  return target ? resolveBattle(cleared, attacker, target) : { ...cleared, message: `${state.message} Das Ziel ist weg, der Angriff fällt aus.` }
}

export function passDuelChain(state: DuelState, side: DuelSide): DuelState {
  if (!state.chain.length || state.chainPriority !== side) throw new Error('Diese Duellseite hat gerade keine Ketten-Priorität.')
  if (state.chainPasses === 1) {
    const resolved = resolveChain(state)
    return { ...resolved, message: resolved.winner ? resolved.message : `${resolved.message} Die Effektkette wurde aufgelöst.` }
  }
  const nextSide = opposite(side)
  const next = { ...state, chainPasses: 1, chainPriority: nextSide }
  return nextSide === 'jarvis' ? jarvisRespond(next) : { ...next, message: 'Du kannst ein Kettenglied hinzufügen oder passen.' }
}

function jarvisRespond(state: DuelState): DuelState {
  if (state.chainPriority !== 'jarvis') return state
  const negate = [...state.jarvis.hand, ...state.jarvis.spells, ...state.jarvis.monsters]
    .find((card) => card.effect?.kind === 'negate' && checkActivation(state, 'jarvis', card.id) === null)
  if (negate) return activateDuelEffect(state, 'jarvis', negate.id)
  return passDuelChain(state, 'jarvis')
}

export function selectAttacker(state: DuelState, cardId: number): DuelState {
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase !== 'battle' || state.winner) throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  if (isFirstTurnBattleBlocked(state)) throw new Error('In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).')
  const card = state.player.monsters.find((item) => item.id === cardId)
  if (!card) throw new Error('Dieses Monster ist nicht auf deinem Feld.')
  if (state.attacked.includes(cardId)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  if (card.position === 'defense' || card.faceDown) throw new Error('Monster in Verteidigung können nicht angreifen.')
  return { ...state, selectedAttacker: state.selectedAttacker === cardId ? null : cardId, message: 'Wähle ein gegnerisches Monster als Ziel.' }
}

type BattleOutcome = { destroyAttacker: boolean; destroyTarget: boolean; hurtAttacker: number; hurtDefender: number }

function battleOutcome(
  attacker: DuelCard,
  target: DuelCard | null,
  attackerOwner: DuelPlayer,
  defenderOwner: DuelPlayer,
): BattleOutcome {
  const power = effectiveAtk(attacker, attackerOwner)
  if (!target) return { destroyAttacker: false, destroyTarget: false, hurtAttacker: 0, hurtDefender: power }
  if (target.position === 'defense') {
    const difference = power - (target.def || 0)
    return { destroyAttacker: false, destroyTarget: difference > 0, hurtAttacker: difference < 0 ? -difference : 0, hurtDefender: 0 }
  }
  const difference = power - (effectiveAtk(target, defenderOwner))
  return {
    destroyAttacker: difference <= 0,
    destroyTarget: difference >= 0,
    hurtAttacker: difference < 0 ? -difference : 0,
    hurtDefender: difference > 0 ? difference : 0,
  }
}

// The attacker is always state.player's monster; Jarvis' attacks run on a mirrored view.
function resolveBattle(state: DuelState, attacker: DuelCard, target: DuelCard | null): DuelState {
  const player = { ...state.player, monsters: [...state.player.monsters], graveyard: [...state.player.graveyard] }
  const jarvis = { ...state.jarvis, monsters: [...state.jarvis.monsters], graveyard: [...state.jarvis.graveyard] }
  const outcome = battleOutcome(attacker, target, player, jarvis)
  const destroyed: number[] = []
  jarvis.lp = Math.max(0, jarvis.lp - outcome.hurtDefender)
  player.lp = Math.max(0, player.lp - outcome.hurtAttacker)
  if (target && outcome.destroyTarget) {
    jarvis.monsters.splice(jarvis.monsters.findIndex((card) => card.id === target.id), 1)
    jarvis.graveyard.push({ ...target, faceDown: false, boost: undefined })
    destroyed.push(target.id)
  } else if (target && target.faceDown) {
    jarvis.monsters[jarvis.monsters.findIndex((card) => card.id === target.id)] = { ...target, faceDown: false }
  }
  if (outcome.destroyAttacker) {
    player.monsters.splice(player.monsters.findIndex((card) => card.id === attacker.id), 1)
    player.graveyard.push({ ...attacker, boost: undefined })
    destroyed.push(attacker.id)
  }
  const summary = !target
    ? `${attacker.name} trifft direkt: ${outcome.hurtDefender} Schaden.`
    : outcome.destroyTarget && outcome.destroyAttacker
      ? `${attacker.name} und ${target.name} zerstören sich gegenseitig.`
      : outcome.destroyTarget
        ? `${attacker.name} zerstört ${target.name}${outcome.hurtDefender ? ` (${outcome.hurtDefender} Schaden)` : ''}.`
        : outcome.destroyAttacker
          ? `${attacker.name} scheitert an ${target.name} und nimmt ${outcome.hurtAttacker} Schaden.`
          : `${attacker.name} greift ${target.name} an${outcome.hurtAttacker ? ` und nimmt ${outcome.hurtAttacker} Schaden` : ''}.`
  return finishBattle({
    ...state,
    player,
    jarvis,
    selectedAttacker: null,
    attacked: state.attacked.includes(attacker.id) ? state.attacked : [...state.attacked, attacker.id],
    lastAnimation: {
      id: attacker.id,
      kind: 'attack',
      side: 'player',
      targetId: target ? target.id : null,
      damage: { player: outcome.hurtAttacker, jarvis: outcome.hurtDefender },
      destroyed,
    },
    message: summary,
  })
}

function jarvisTrapAnswer(state: DuelState): DuelCard | undefined {
  return state.jarvis.spells.find((card) =>
    card.kind === 'trap'
    && card.effect
    && (card.effect.kind === 'negateAttack' || card.effect.kind === 'damage' || card.effect.kind === 'destroy')
    && checkActivation({ ...state, turnOwner: 'player' }, 'jarvis', card.id) === null)
}

export function attack(state: DuelState, targetId?: number, options: { skipTraps?: boolean } = {}): DuelState {
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.winner || state.phase !== 'battle') throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  if (isFirstTurnBattleBlocked(state)) throw new Error('In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).')
  const attacker = state.player.monsters.find((card) => card.id === state.selectedAttacker)
  if (!attacker) throw new Error('Wähle zuerst eines deiner Monster.')
  if (state.attacked.includes(attacker.id)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  if (attacker.position === 'defense') throw new Error('Monster in Verteidigung können nicht angreifen.')
  let target: DuelCard | null = null
  if (state.jarvis.monsters.length) {
    target = state.jarvis.monsters.find((card) => card.id === targetId) ?? null
    if (!target) throw new Error('Wähle ein Monster von Jarvis als Angriffsziel.')
  }
  if (!options.skipTraps) {
    const declared: DuelState = {
      ...state,
      selectedAttacker: null,
      attacked: [...state.attacked, attacker.id],
      pendingAttack: { side: 'player', attackerId: attacker.id, targetId: target ? target.id : null },
      lastAnimation: { id: attacker.id, kind: 'attack', side: 'player', targetId: target ? target.id : null },
      message: `${attacker.name} greift an – Jarvis antwortet!`,
    }
    const trap = jarvisTrapAnswer(declared)
    if (trap) return activateDuelEffect(declared, 'jarvis', trap.id)
  }
  return resolveBattle(state, attacker, target)
}

export function startJarvisTurn(state: DuelState): DuelState {
  if (state.winner) return state
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase !== 'end') throw new Error('Beende zuerst deine End Phase.')
  const jarvis: DuelPlayer = clearBoosts({
    ...state.jarvis,
    hand: [...state.jarvis.hand],
    deck: [...state.jarvis.deck],
    normalSummonUsed: false,
    usedEffects: [],
  })
  const hand = [...jarvis.hand]
  const deck = [...jarvis.deck]
  const top = deck.pop()
  if (!top) return { ...state, winner: 'player', message: 'Jarvis kann keine Karte mehr ziehen. Du gewinnst das Duell!' }
  hand.push(top)
  return {
    ...state,
    player: clearBoosts(state.player),
    jarvis: { ...jarvis, hand, deck },
    turnOwner: 'jarvis',
    phase: 'draw',
    attacked: [],
    selectedAttacker: null,
    pendingAttack: null,
    jarvisSteps: 0,
    lastAnimation: { id: 0, kind: 'draw', side: 'jarvis' },
    message: 'Jarvis beginnt seinen Zug und zieht eine Karte.',
  }
}

export function endJarvisTurn(state: DuelState): DuelState {
  if (state.winner) return state
  const deck = [...state.player.deck]
  const top = deck.pop()
  if (!top) return { ...state, winner: 'jarvis', message: 'Du kannst keine Karte mehr ziehen. Jarvis gewinnt das Duell.' }
  return {
    ...state,
    player: { ...state.player, deck, hand: [...state.player.hand, top], normalSummonUsed: false, usedEffects: [] },
    jarvis: clearBoosts(state.jarvis),
    turnOwner: 'player',
    phase: 'draw',
    turn: state.turn + 1,
    attacked: [],
    selectedAttacker: null,
    pendingAttack: null,
    jarvisSteps: 0,
    lastAnimation: { id: 0, kind: 'draw', side: 'player' },
    message: 'Jarvis beendet seinen Zug. Dein Zug beginnt.',
  }
}

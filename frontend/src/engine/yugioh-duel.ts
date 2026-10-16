import {
  extraSummonZone,
  freeMainColumn,
  hasFreeMonsterZone,
  legalExtraSummonZones,
  legalMainSummonZones,
  isFirstTurnBattleBlocked,
  pointedMonsters,
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
  | { kind: 'drawDiscard'; draw: number; discard: number }
  | { kind: 'damage'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'destroy'; target: 'monster' | 'allMonsters' | 'attackMonsters' | 'spelltrap' | 'allSpelltrap' }
  | { kind: 'negate'; cost?: 'halfLp' }
  | { kind: 'negateAttack' }
  | { kind: 'search'; amount: number }
  | { kind: 'revive' }
  | { kind: 'summonDeck' }
  | { kind: 'recover' }
  | { kind: 'boost'; amount: number }
  | { kind: 'weaken'; amount: number; half: boolean; all?: boolean }
  | { kind: 'setStat'; stat: 'atk' | 'def'; value: number }
  | { kind: 'banish'; target: 'monster' | 'gyMonster' | 'spelltrap' }
  | { kind: 'bounce'; target: 'monster' | 'allMonsters' | 'allSpelltrap' }
  | { kind: 'position'; target: 'monster' | 'allMonsters'; faceDown: boolean }
  | { kind: 'mill'; amount: number; opponent?: boolean }
  | { kind: 'summonPile'; from: 'hand' | 'deck' | 'gy' }
  | { kind: 'equip'; stat: 'atk' | 'def'; amount: number }
  | { kind: 'discard'; amount: number }
  | { kind: 'fieldAura'; stat: 'atk'; amount: number }
  | { kind: 'summonHand'; tributes: number; discard: number }
  | { kind: 'rule'; rule: CardRule }
  | { kind: 'counter'; amount: number; mode: 'place' | 'remove'; then?: 'draw' }
  | { kind: 'token'; amount: number; atk: number; def: number; name?: string }
  | { kind: 'pointBoost'; amount: number }

export type CardRule =
  | 'cannotNormal'
  | 'piercing'
  | 'direct'
  | 'cannotAttack'
  | 'battleProof'
  | 'effectProof'
  | 'untargetable'
  | 'unaffected'
  | 'spellCounter'
  | 'freeTribute'

export type EffectTrigger = 'summon' | 'flip' | 'ignition' | 'quick' | 'continuous'

export type MaterialClause =
  | { status: 'names'; names: string[] }
  | { status: 'levelSum'; sum: number }
  | { status: 'ambiguous' }

export type PromptMode = 'off' | 'auto' | 'on'
export type BattleStep = 'start' | 'declare' | 'damage' | 'end'
export type PromptSource = 'trigger' | 'response' | 'phase'

export type ActivationPrompt = {
  side: DuelSide
  cardId: number
  chainNumber: number
  source: PromptSource
  mandatory: boolean
}

export type TargetPile = 'field' | 'graveyard' | 'deck' | 'extra' | 'banished'

export type TargetPick = {
  cardId: number
  owner: DuelSide
  pile: TargetPile
}

export type TargetPrompt = {
  linkId: number
  candidates: number[]
  pile: TargetPile
}

export const PROMPT_MODE_KEY = 'jarvis_yugioh_prompt_v1'

export type DuelCard = {
  id: number
  catalogId?: number
  copyLimit?: number
  name: string
  type: string
  kind: CardKind
  atk?: number
  def?: number
  /** Printed ATK/DEF. Current atk/def may differ after a buff or a set-stat effect. */
  baseAtk?: number
  baseDef?: number
  level?: number
  imageUrl?: string
  extraDeck?: boolean
  extraKind?: ExtraDeckKind
  linkRating?: number
  linkArrows?: number[]
  zoneKind?: 'mmz' | 'emz'
  /** Spalte 0–4 in der Hauptzone, oder 0/1 in der Extra-Monsterzone. */
  zoneIndex?: number
  rules?: CardRule[]
  counters?: number
  token?: boolean
  tuner?: boolean
  effect?: DuelEffect
  effectSummary?: string
  effectTrigger?: EffectTrigger
  faceDown?: boolean
  // Spell/Trap subtype from the card data (Normal, Quick-Play, Continuous, Equip, Field, Ritual, Counter).
  subtype?: string
  position?: 'attack' | 'defense'
  // Duel-turn key (see turnKey) at which the card was set or last changed position.
  lockedKey?: number
  // ATK added until the end of the turn.
  boost?: number
  attribute?: string
  race?: string
  archetype?: string
  pendulumScale?: number
  materials?: DuelCard[]
  effectsNegated?: boolean
  materialClause?: MaterialClause
  ritual?: boolean
  ritualSpellName?: string
  faceUpExtra?: boolean
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
  scales?: [DuelCard | null, DuelCard | null]
  pendulumSummonUsed?: boolean
}

export type DuelPhase = 'draw' | 'standby' | 'main1' | 'battle' | 'main2' | 'end'

export type ChainLink = {
  id: number
  controller: DuelSide
  card: DuelCard
  effect: DuelEffect
  negated: boolean
  spellSpeed: 1 | 2 | 3
  targetId?: number
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
  /** Karten, die in der End Phase noch abgeworfen werden müssen (Handlimit 6). */
  discardNeeded?: number
  phaseIntent?: 'battle' | 'end' | 'next'
  promptMode?: PromptMode
  pendingPrompt?: ActivationPrompt | null
  pendingTarget?: TargetPrompt | null
  pendingTriggerOrder?: number[] | null
  battleWindow?: boolean
  battleStep?: BattleStep | null
  log?: string[]
  skipPhasePrompt?: boolean
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
  hasFreeExtraZone,
  extraSummonZone,
  legalExtraSummonZones,
  legalMainSummonZones,
  linkedOwnZones,
} from './yugioh-zones.ts'
export { effectFromDescriptionV2, deckEffectCoverage, EFFECT_SCHEMA_VERSION } from './yugioh-effects.ts'

export function turnKey(state: DuelState): number {
  return state.turn * 2 + (state.turnOwner === 'jarvis' ? 1 : 0)
}

function requirePlayerTurn(state: DuelState): void {
  if ((state.turnOwner ?? 'player') !== 'player') throw new Error('Du bist nicht am Zug.')
}

function clearNegation(player: DuelPlayer): DuelPlayer {
  if (!player.monsters.some((card) => card.effectsNegated)) return player
  return {
    ...player,
    monsters: player.monsters.map((card) => card.effectsNegated ? { ...card, effectsNegated: undefined } : card),
  }
}

function clearBoosts(player: DuelPlayer): DuelPlayer {
  if (!player.monsters.some((card) => card.boost)) return player
  return {
    ...player,
    monsters: player.monsters.map((card) => card.boost ? { ...card, atk: Math.max(0, (card.atk || 0) - card.boost), boost: undefined } : card),
  }
}

/** Werte, die das Feld verlassen, fallen auf den gedruckten ATK/DEF zurück. */
function leaveField(card: DuelCard): DuelCard {
  const atk = card.baseAtk != null ? card.baseAtk : Math.max(0, (card.atk || 0) - (card.boost || 0))
  const def = card.baseDef != null ? card.baseDef : card.def
  return { ...card, atk, def, boost: undefined, faceDown: false, position: 'attack', zoneKind: undefined, zoneIndex: undefined }
}

export function cardRules(card: DuelCard): CardRule[] {
  const rules = [...(card.rules ?? [])]
  if (card.effect?.kind === 'rule' && !rules.includes(card.effect.rule)) rules.push(card.effect.rule)
  return rules
}

export function hasRule(card: DuelCard, rule: CardRule): boolean {
  return cardRules(card).includes(rule)
}

function withRules(card: DuelCard): DuelCard {
  const rules = cardRules(card)
  return rules.length ? { ...card, rules } : card
}

function sendAway(player: DuelPlayer, card: DuelCard): void {
  if (card.token) return
  const left = leaveField(card)
  if (typeof card.pendulumScale === 'number') {
    player.extraDeck.push({ ...left, pendulumScale: card.pendulumScale, extraDeck: true, faceUpExtra: true })
    return
  }
  player.graveyard.push(left)
}

function phaseWord(phase: string): string {
  if (phase === 'draw') return 'Draw'
  if (phase === 'standby') return 'Standby'
  if (phase === 'main1') return 'Main 1'
  if (phase === 'battle') return 'Battle'
  if (phase === 'main2') return 'Main 2'
  if (phase === 'end') return 'End'
  return phase
}

function remember(state: DuelState, line: string): DuelState {
  if (!Array.isArray(state.log)) return state
  return { ...state, log: [...state.log, line] }
}

export function parsePromptMode(raw: string | null | undefined): PromptMode {
  if (raw === 'off' || raw === 'auto' || raw === 'on') return raw
  return 'auto'
}

export function isMandatoryCard(card: DuelCard): boolean {
  return /muss|pflicht|must/i.test(`${card.effectSummary || ''} ${card.name}`)
}

export function cardStatuses(card: DuelCard): Array<'negated' | 'untargetable' | 'immune'> {
  const list: Array<'negated' | 'untargetable' | 'immune'> = []
  if (card.effectsNegated) list.push('negated')
  if (hasRule(card, 'untargetable')) list.push('untargetable')
  if (hasRule(card, 'unaffected') || hasRule(card, 'effectProof')) list.push('immune')
  return list
}

export function materialClauseFromText(text: string): MaterialClause | null {
  const raw = text.trim()
  if (!raw) return null
  const quoted = [...raw.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim()).filter(Boolean)
  const level = raw.match(/total levels?(?: equal(?:s)?)?\s*(\d+)/i)
    || raw.match(/level sum of\s*(\d+)/i)
    || raw.match(/stufen(?:\s+zusammen)?(?:\s+gleich)?\s*(\d+)/i)
  if (quoted.length >= 2 && /material/i.test(raw)) return { status: 'names', names: quoted.slice(0, 5) }
  if (level) return { status: 'levelSum', sum: Number(level[1]) }
  if (/material/i.test(raw) && (quoted.length === 1 || /must (?:be|include)|benötigt/i.test(raw))) {
    return { status: 'ambiguous' }
  }
  return null
}

export function banlistTone(copyLimit: number | undefined): 'forbidden' | 'limited' | 'semi' | null {
  if (copyLimit === 0) return 'forbidden'
  if (copyLimit === 1) return 'limited'
  if (copyLimit === 2) return 'semi'
  return null
}

export type DeckFilter = {
  type?: string
  attribute?: string
  level?: number | null
  race?: string
  archetype?: string
  text?: string
}

export function filterDeckPool(cards: readonly DuelCard[], filter: DeckFilter): DuelCard[] {
  const text = filter.text?.trim().toLowerCase() || ''
  return cards.filter((card) => {
    if (filter.type && !card.type.toLowerCase().includes(filter.type.toLowerCase()) && card.kind !== filter.type) return false
    if (filter.attribute && (card.attribute || '').toLowerCase() !== filter.attribute.toLowerCase()) return false
    if (filter.level != null && card.level !== filter.level) return false
    if (filter.race && (card.race || '').toLowerCase() !== filter.race.toLowerCase()) return false
    if (filter.archetype && (card.archetype || '').toLowerCase() !== filter.archetype.toLowerCase()) return false
    if (text && !`${card.name} ${card.effectSummary || ''} ${card.type}`.toLowerCase().includes(text)) return false
    return true
  })
}

export function relatedFromCatalog(cards: readonly DuelCard[], card: DuelCard): DuelCard[] {
  if (!card.archetype) return []
  const name = card.archetype.toLowerCase()
  return cards.filter((item) => item.archetype?.toLowerCase() === name && (item.catalogId ?? item.id) !== (card.catalogId ?? card.id))
}

function grantSpellCounters(player: DuelPlayer): void {
  const bump = (card: DuelCard): DuelCard => hasRule(card, 'spellCounter')
    ? { ...card, counters: (card.counters || 0) + 1 }
    : card
  player.monsters = player.monsters.map(bump)
  player.spells = player.spells.map(bump)
  if (player.fieldSpell) player.fieldSpell = bump(player.fieldSpell)
}

function effectHits(monster: DuelCard, targeted: boolean): boolean {
  if (hasRule(monster, 'unaffected') || hasRule(monster, 'effectProof')) return false
  if (targeted && hasRule(monster, 'untargetable')) return false
  return true
}

function highestCardId(state: DuelState): number {
  const piles = [state.player, state.jarvis].flatMap((player) => [
    ...player.deck,
    ...player.hand,
    ...player.monsters,
    ...player.graveyard,
    ...player.banished,
    ...player.spells,
    ...player.extraDeck,
    ...(player.fieldSpell ? [player.fieldSpell] : []),
  ])
  return piles.reduce((max, card) => Math.max(max, card.id), 0)
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
      .filter((card) => card.kind === 'monster' && (card.level || 4) <= 4 && !hasRule(card, 'cannotNormal'))
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
      const column = freeMainColumn(jarvis.monsters)
      if (column != null) {
        jarvis.hand.splice(jarvis.hand.indexOf(chosen), 1)
        jarvis.monsters.push({ ...withRules(chosen), position: 'attack', zoneKind: 'mmz', zoneIndex: column })
        jarvis.normalSummonUsed = true
        summonedName = chosen.name
      }
    }
  }
  let extraSummonedName = ''
  const extraCandidates = [...jarvis.extraDeck].sort((a, b) => (b.atk || 0) - (a.atk || 0))
  for (const extra of extraCandidates) {
    const materials = findMaterialsForExtra(extra, jarvis.monsters)
    if (!materials) continue
    const destination = extraSummonZone(jarvis.monsters, materials.map((monster) => monster.id))
    if (!destination) continue
    const materialIds = new Set(materials.map((monster) => monster.id))
    jarvis.monsters = jarvis.monsters.filter((monster) => !materialIds.has(monster.id))
    if (extra.extraKind !== 'xyz') {
      for (const material of materials) sendAway(jarvis, material)
    }
    jarvis.extraDeck = jarvis.extraDeck.filter((monster) => monster.id !== extra.id)
    jarvis.monsters.push({
      ...withRules(extra),
      position: 'attack',
      zoneKind: destination.zoneKind,
      zoneIndex: destination.zoneIndex,
      linkArrows: extra.extraKind === 'link' ? registerLinkArrows(extra) : extra.linkArrows,
      ...(extra.extraKind === 'xyz' ? { materials: materials.map((material) => leaveField(material)) } : {}),
    })
    extraSummonedName = extra.name
    break
  }
  const player = clearNegation(clearBoosts({
    ...state.player,
    monsters: [...state.player.monsters],
    graveyard: [...state.player.graveyard],
    usedEffects: [],
    normalSummonUsed: false,
  }))
  const jarvisOpens = (state.firstPlayer ?? 'player') === 'jarvis' && state.turn === 1
  for (const attacker of [...jarvis.monsters]) {
    if (jarvisOpens || state.winner || !jarvis.monsters.includes(attacker)) continue
    if (attacker.position === 'defense' || attacker.faceDown || hasRule(attacker, 'cannotAttack')) continue
    const target = player.monsters.length
      ? player.monsters.reduce((weakest, card) => ((card.position === 'defense' ? card.def : card.atk) || 0) < ((weakest.position === 'defense' ? weakest.def : weakest.atk) || 0) ? card : weakest)
      : null
    const outcome = battleOutcome(attacker, target, jarvis, player)
    player.lp = Math.max(0, player.lp - outcome.hurtDefender)
    jarvis.lp = Math.max(0, jarvis.lp - outcome.hurtAttacker)
    if (target && outcome.destroyTarget) {
      player.monsters.splice(player.monsters.indexOf(target), 1)
      sendAway(player, target)
    } else if (target?.faceDown) {
      player.monsters[player.monsters.indexOf(target)] = { ...target, faceDown: false }
    }
    if (outcome.destroyAttacker) {
      jarvis.monsters.splice(jarvis.monsters.indexOf(attacker), 1)
      sendAway(jarvis, attacker)
    }
    if (player.lp <= 0) break
  }
  const result = finishBattle({
    ...state,
    player,
    jarvis: clearBoosts({ ...jarvis, normalSummonUsed: false, usedEffects: [] }),
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

function handKeepScore(card: DuelCard): number {
  if (card.kind === 'monster') return (card.atk || 0) + 1
  return 0
}

function weakestHandCard(hand: DuelCard[]): DuelCard {
  return [...hand].sort((a, b) => handKeepScore(a) - handKeepScore(b) || a.id - b.id)[0]
}

export function discardForHandLimit(state: DuelState, cardId: number): DuelState {
  const need = state.discardNeeded || 0
  if (need <= 0) throw new Error('Es muss nichts abgeworfen werden.')
  const card = state.player.hand.find((item) => item.id === cardId)
  if (!card) throw new Error('Diese Karte ist nicht auf der Hand.')
  const left = need - 1
  return {
    ...state,
    discardNeeded: left,
    player: {
      ...state.player,
      hand: state.player.hand.filter((item) => item.id !== cardId),
      graveyard: [...state.player.graveyard, card],
    },
    message: left > 0 ? `Handlimit 6. Noch ${left} Karte(n) abwerfen.` : 'Handlimit erfüllt.',
  }
}

/** Trainings- und Jarvis-Züge wählen selbst: schwächste Karte zuerst, der Spieler tippt. */
export function autoDiscardForHandLimit(state: DuelState): DuelState {
  let next = state
  let guard = 0
  while ((next.discardNeeded || 0) > 0 && next.player.hand.length && guard < 20) {
    next = discardForHandLimit(next, weakestHandCard(next.player.hand).id)
    guard += 1
  }
  return next
}

function trimHandToLimit(player: DuelPlayer, limit = 6): DuelPlayer {
  if (player.hand.length <= limit) return player
  const hand = [...player.hand]
  const graveyard = [...player.graveyard]
  while (hand.length > limit) {
    const worst = weakestHandCard(hand)
    const index = hand.findIndex((card) => card.id === worst.id)
    graveyard.push(...hand.splice(index, 1))
  }
  return { ...player, hand, graveyard }
}

export function advanceDuelPhase(state: DuelState): DuelState {
  if (state.winner) return state
  requirePlayerTurn(state)
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if ((state.discardNeeded || 0) > 0) throw new Error('Wirf zuerst Karten ab. Das Handlimit ist 6.')
  if (state.phase === 'end') return runJarvisTurn(state)
  if (state.promptMode === 'on' && !state.skipPhasePrompt && !state.pendingPrompt) {
    const card = phasePromptCard(state)
    if (card) {
      return {
        ...state,
        pendingPrompt: {
          side: 'player',
          cardId: card.id,
          chainNumber: state.chain.length + 1,
          source: 'phase',
          mandatory: false,
        },
        message: `Vor dem Phasenwechsel: ${card.name}?`,
        phaseIntent: 'next',
      }
    }
  }
  let phase = skipBlockedPhases(state, nextPhase(state.phase))
  if (phase === 'end' && state.player.hand.length > 6) {
    const extra = state.player.hand.length - 6
    return {
      ...state,
      phase: 'end',
      discardNeeded: extra,
      selectedAttacker: null,
      attacked: [],
      lastAnimation: null,
      message: `Handlimit 6. Wirf ${extra} Karte(n) ab.`,
    }
  }
  const advanced: DuelState = {
    ...state,
    phase,
    skipPhasePrompt: false,
    selectedAttacker: null,
    attacked: [],
    lastAnimation: null,
    ...(phase === 'battle' && state.battleWindow ? { battleStep: 'start' as const } : {}),
    message: phase === 'battle' && isFirstTurnBattleBlocked(state)
      ? 'In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).'
      : `Deine Phase: ${phaseWord(phase)}.`,
  }
  return remember(advanced, `Phase: ${phaseWord(phase)}`)
}

export function summonMonster(state: DuelState, cardId: number, tributes: number[] = [], mode: 'attack' | 'set' = 'attack', zoneIndex?: number): DuelState {
  requirePlayerTurn(state)
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Beschwörungen sind nur in der Main Phase möglich.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.player.normalSummonUsed) throw new Error('Du hast in diesem Zug bereits normalbeschworen.')
  if (!hasFreeMonsterZone(state.player.monsters, tributes.length)) throw new Error('Deine Monster-Zone ist voll.')
  const cardIndex = state.player.hand.findIndex((card) => card.id === cardId)
  const card = state.player.hand[cardIndex]
  if (!card || card.kind !== 'monster') throw new Error('Diese Karte kann nicht normalbeschworen werden.')
  if (hasRule(card, 'cannotNormal')) throw new Error(`${card.name} kann nicht normalbeschworen oder gesetzt werden.`)
  const tributeCount = hasRule(card, 'freeTribute') ? 0 : (card.level || 4) >= 7 ? 2 : (card.level || 4) >= 5 ? 1 : 0
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
    const [removed] = player.monsters.splice(index, 1)
    if (removed) sendAway(player, removed)
  }
  const legal = legalMainSummonZones(player.monsters)
  const column = zoneIndex != null ? zoneIndex : legal[0]?.zoneIndex
  if (column == null || !legal.some((slot) => slot.zoneKind === 'mmz' && slot.zoneIndex === column)) {
    throw new Error(zoneIndex != null ? 'Diese Monsterzone ist nicht erlaubt.' : 'Deine Monster-Zone ist voll.')
  }
  const placed: DuelCard = mode === 'set'
    ? { ...withRules(card), faceDown: true, position: 'defense', lockedKey: turnKey(state), zoneKind: 'mmz', zoneIndex: column }
    : {
      ...withRules(card),
      faceDown: false,
      position: 'attack',
      lockedKey: turnKey(state),
      zoneKind: 'mmz',
      zoneIndex: column,
      linkArrows: card.extraKind === 'link' ? registerLinkArrows(card) : card.linkArrows,
    }
  player.monsters.push(placed)
  const summoned = remember({
    ...state,
    player,
    lastAnimation: { id: card.id, kind: mode === 'set' ? 'set' : 'summon', side: 'player' },
    message: mode === 'set' ? 'Ein Monster wurde verdeckt in Verteidigung gesetzt.' : `${card.name} wurde beschworen.`,
  }, mode === 'set' ? `Setzen: ${card.name}` : `Beschwörung: ${card.name}`)
  return mode === 'set' ? summoned : settleTrigger(summoned, 'player', card.id, 'summon')
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
  const moved: DuelState = {
    ...state,
    player: { ...state.player, monsters: state.player.monsters.map((item) => item.id === cardId ? flipped : item) },
    lastAnimation: { id: cardId, kind: 'position', side: 'player' },
    message: card.faceDown ? `${card.name} wurde offen in Angriff gedreht.` : `${card.name} wechselt in ${flipped.position === 'defense' ? 'Verteidigung' : 'Angriff'}.`,
  }
  return card.faceDown ? settleTrigger(moved, 'player', cardId, 'flip') : moved
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
  if (card.materialClause?.status === 'ambiguous') {
    throw new Error('Der Materialtext ist nicht eindeutig. Es wird keine Materialliste erfunden.')
  }
  if (card.materialClause?.status === 'names') {
    const have = selected.map((monster) => monster.name.toLowerCase())
    for (const name of card.materialClause.names) {
      if (!have.includes(name.toLowerCase())) throw new Error(`Diese Beschwörung verlangt ${name} als Material.`)
    }
  }
  if (card.materialClause?.status === 'levelSum') {
    const total = selected.reduce((sum, monster) => sum + (monster.level || 0), 0)
    if (total !== card.materialClause.sum) throw new Error(`Die Materialien müssen zusammen Stufe ${card.materialClause.sum} haben.`)
  }
  return selected
}

export function summonExtraMonster(
  state: DuelState,
  cardId: number,
  materialIds: number[],
  zone?: { zoneKind: 'mmz' | 'emz'; zoneIndex: number },
): DuelState {
  requirePlayerTurn(state)
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Extra-Deck-Beschwörungen sind nur in der Main Phase möglich.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.extraDeck.find((item) => item.id === cardId)
  if (!card) throw new Error('Diese Karte liegt nicht in deinem Extra Deck.')
  const materials = extraSummonMaterials(card, state.player.monsters, materialIds)
  const legalZones = legalExtraSummonZones(state.player.monsters, materialIds)
  const destination = zone
    ? legalZones.find((slot) => slot.zoneKind === zone.zoneKind && slot.zoneIndex === zone.zoneIndex) ?? null
    : extraSummonZone(state.player.monsters, materialIds)
  if (!destination) {
    throw new Error(zone ? 'Diese Zone ist für die Extra-Deck-Beschwörung nicht erlaubt.' : 'Deine Monster-Zone ist voll.')
  }
  const player = {
    ...state.player,
    monsters: state.player.monsters.filter((monster) => !materialIds.includes(monster.id)),
    graveyard: [...state.player.graveyard],
    extraDeck: state.player.extraDeck.filter((item) => item.id !== cardId),
    usedEffects: [...state.player.usedEffects],
  }
  if (card.extraKind !== 'xyz') {
    for (const material of materials) sendAway(player, material)
  }
  player.monsters.push({
    ...withRules(card),
    faceDown: false,
    position: 'attack',
    lockedKey: turnKey(state),
    zoneKind: destination.zoneKind,
    zoneIndex: destination.zoneIndex,
    linkArrows: card.extraKind === 'link' ? registerLinkArrows(card) : card.linkArrows,
    ...(card.extraKind === 'xyz' ? { materials: materials.map((material) => leaveField(material)) } : {}),
  })
  const summoned = remember({
    ...state,
    player,
    lastAnimation: { id: card.id, kind: 'summon' },
    message: `${card.name} wurde aus dem Extra Deck beschworen.`,
  }, `Beschwörung: ${card.name}`)
  return settleTrigger(summoned, 'player', card.id, 'summon')
}

export function effectFromDescription(
  description: string,
  card?: Pick<DuelCard, 'kind' | 'subtype' | 'type' | 'faceDown'>,
): { effect: DuelEffect; summary: string; trigger: EffectTrigger; rules?: CardRule[] } | null {
  return effectFromDescriptionV2(description, card)
}

function triggerOf(card: DuelCard): EffectTrigger | undefined {
  return card.effectTrigger
}

function settleTrigger(state: DuelState, side: DuelSide, cardId: number, trigger: 'summon' | 'flip'): DuelState {
  const me = owner(state, side)
  const card = me.monsters.find((item) => item.id === cardId)
  if (!card || card.faceDown || !card.effect || triggerOf(card) !== trigger || card.effectsNegated) return state
  if (checkActivation(state, side, cardId, 'trigger')) return state
  if (state.promptMode === 'off') {
    if (!isMandatoryCard(card)) return state
  } else if ((state.promptMode === 'auto' || state.promptMode === 'on') && side === 'player') {
    return {
      ...state,
      pendingPrompt: {
        side,
        cardId,
        chainNumber: state.chain.length + 1,
        source: 'trigger',
        mandatory: isMandatoryCard(card),
      },
      message: `${card.name} kann aktiviert werden. Kettenglied ${state.chain.length + 1}.`,
    }
  }
  let next = activateDuelEffect(state, side, cardId, 'trigger')
  if (next.chain.length && next.chainPriority === side && !next.pendingPrompt && !next.pendingTarget) {
    try {
      next = passDuelChain(next, side)
    } catch {
      return next
    }
  }
  return next
}

function phasePromptCard(state: DuelState): DuelCard | null {
  if ((state.turnOwner ?? 'player') !== 'player') return null
  const pool = [...state.player.hand, ...state.player.spells, ...state.player.monsters]
  return pool.find((card) => card.effect && !card.faceDown && checkActivation(state, 'player', card.id) === null && !isMandatoryCard(card)) || null
}

function playerResponseCard(state: DuelState): DuelCard | null {
  const pool = [...state.player.hand, ...state.player.spells, ...state.player.monsters]
  return pool.find((card) => checkActivation(state, 'player', card.id) === null) || null
}

function fieldAuraBonus(player: DuelPlayer): number {
  const field = player.fieldSpell
  if (!field?.effect || field.effect.kind !== 'fieldAura') return 0
  return field.effect.amount
}

function pointBonus(card: DuelCard, owner: DuelPlayer, opponent?: DuelPlayer): number {
  if (card.effect?.kind !== 'pointBoost') return 0
  return card.effect.amount * pointedMonsters(card, owner.monsters, opponent?.monsters ?? []).length
}

function effectiveAtk(attacker: DuelCard, owner: DuelPlayer, opponent?: DuelPlayer): number {
  return (attacker.atk || 0) + fieldAuraBonus(owner) + pointBonus(attacker, owner, opponent)
}

export function cardBattleStats(card: DuelCard, owner: DuelPlayer, opponent?: DuelPlayer): { atk: number; def: number; baseAtk: number; baseDef: number } {
  const baseAtk = card.baseAtk ?? Math.max(0, (card.atk || 0) - (card.boost || 0))
  const baseDef = card.baseDef ?? (card.def || 0)
  return {
    atk: (card.atk || 0) + fieldAuraBonus(owner) + pointBonus(card, owner, opponent),
    def: card.def || 0,
    baseAtk,
    baseDef,
  }
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
export function checkActivation(state: DuelState, side: DuelSide, cardId: number, via?: 'trigger' | 'simultaneous'): string | null {
  if (state.winner) return 'Das Duell ist bereits beendet.'
  if (side !== 'player' && side !== 'jarvis') return 'Unbekannte Duellseite.'
  const me = owner(state, side)
  const foe = owner(state, opposite(side))
  const { card, zone } = zoneCard(me, cardId)
  const effect = card?.effect
  if (!card || !effect || !zone) return 'Für diese Karte ist kein unterstützter Effekt verfügbar.'
  if (zone === 'hand' && card.kind !== 'spell' && effect.kind !== 'summonHand') {
    return 'Nur Zauberkarten können aus der Hand aktiviert werden.'
  }
  if (zone === 'monsters') {
    if (card.faceDown) return 'Verdeckte Monster haben keinen aktivierbaren Effekt.'
    if ((card.effectTrigger === 'summon' || card.effectTrigger === 'flip') && via !== 'trigger' && via !== 'simultaneous') {
      return 'Dieser Effekt löst nur bei Beschwörung oder Umdrehen aus.'
    }
    if (me.usedEffects.includes(cardId)) return 'Der Effekt dieses Monsters wurde in diesem Zug bereits aktiviert.'
  }
  const ownTurn = (state.turnOwner ?? 'player') === side
  const quickSpell = card.kind === 'spell' && /quick-play/i.test(card.subtype || card.type || '')
  if (state.chain.length) {
    if (via !== 'simultaneous' && state.chainPriority !== side) return 'Die andere Duellseite hat gerade Priorität.'
    const speed = spellSpeedForCard(card)
    if (via !== 'simultaneous' && !canChainSpellSpeed(topChainSpellSpeed(state), speed)) {
      return 'Diese Karte ist nicht schnell genug, um der Kette beizutreten.'
    }
  } else if (ownTurn) {
    if (!['main1', 'main2', 'battle'].includes(state.phase)) return 'Effekte können nur in der Main- oder Battle Phase gestartet werden.'
    if (state.phase === 'battle' && spellSpeedForCard(card) < 2) return 'In der Battle Phase starten nur schnelle Effekte.'
  } else if (!((card.kind === 'trap' && zone === 'spells') || (quickSpell && (zone === 'hand' || zone === 'spells')))) {
    return 'Im gegnerischen Zug kannst du nur gesetzte Fallen oder Schnellzauber aktivieren.'
  }
  if (zone === 'spells' && (card.lockedKey ?? -1) >= turnKey(state)) {
    return card.kind === 'trap'
      ? 'Diese Falle wurde in diesem Zug gesetzt.'
      : 'Dieser Zauber wurde in diesem Zug gesetzt.'
  }
  switch (effect.kind) {
    case 'negate':
      if (!state.chain.length) return 'Negieren geht nur als Antwort in einer Kette.'
      break
    case 'negateAttack':
      if (!state.pendingAttack || state.pendingAttack.side === side) return 'Es gibt gerade keinen gegnerischen Angriff.'
      break
    case 'destroy':
      if (effect.target === 'spelltrap' || effect.target === 'allSpelltrap') {
        if (!foe.spells.length && !foe.fieldSpell) return 'Es gibt kein Ziel für diesen Effekt.'
      } else if (!foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
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
    case 'summonDeck':
      if (!hasFreeMonsterZone(me.monsters, 0) || !me.deck.some((item) => item.kind === 'monster' && !item.extraDeck)) {
        return 'Kein Monster im Deck oder keine freie Monsterzone.'
      }
      break
    case 'recover':
      if (!me.graveyard.length) return 'Der Friedhof ist leer.'
      break
    case 'weaken':
    case 'position':
      if (!foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      break
    case 'discard':
      if (effect.amount > me.hand.length) return 'Nicht genug Karten auf der Hand für den Kosten-Effekt.'
      break
    case 'mill':
      if ((effect.opponent ? foe.deck : me.deck).length === 0) return 'Das Deck ist leer.'
      break
    case 'banish':
      if (effect.target === 'monster' && !foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      if (effect.target === 'spelltrap' && !foe.spells.length && !foe.fieldSpell) return 'Es gibt kein Ziel für diesen Effekt.'
      if (effect.target === 'gyMonster' && !me.graveyard.some((item) => item.kind === 'monster')) return 'Kein Monster im Friedhof zum Verbannen.'
      break
    case 'bounce':
      if (effect.target === 'allSpelltrap') {
        if (!foe.spells.length && !foe.fieldSpell) return 'Es gibt kein Ziel für diesen Effekt.'
      } else if (!foe.monsters.length) return 'Es gibt kein Ziel für diesen Effekt.'
      break
    case 'boost':
      if (!me.monsters.length) return 'Du hast kein Monster, das den Bonus erhalten kann.'
      break
    case 'summonHand':
      if (zone !== 'hand') return 'Diese Beschwörungsbedingung gilt nur aus der Hand.'
      if (state.chain.length) return 'Diese Beschwörung ist keine Antwort in einer Kette.'
      if (!ownTurn || !['main1', 'main2'].includes(state.phase)) return 'Spezialbeschwörungen aus der Hand gehen nur in deiner Main Phase.'
      if (!hasFreeMonsterZone(me.monsters, effect.tributes)) return 'Deine Monster-Zone ist voll.'
      if (effect.discard > me.hand.length - 1) return 'Nicht genug Karten zum Abwerfen.'
      if (effect.tributes > me.monsters.length) return 'Nicht genug Tributmonster.'
      break
    case 'token':
      if (!hasFreeMonsterZone(me.monsters, 0)) return 'Keine freie Monsterzone für ein Token.'
      break
    case 'counter':
      if (zone === 'hand' && card.kind === 'monster') return 'Spielmarken liegen nur auf Karten im Feld.'
      if (effect.mode === 'remove' && (card.counters || 0) < effect.amount) return 'Nicht genug Spielmarken.'
      if (zone === 'hand' && !['main1', 'main2'].includes(state.phase)) return 'Diese Karte startet nur in der Main Phase.'
      break
    case 'rule':
      if (zone === 'monsters' || (zone === 'spells' && !card.faceDown)) return 'Diese Dauerregel gilt ohne Aktivierung.'
      if (!ownTurn || !['main1', 'main2'].includes(state.phase)) return 'Diese Karte startet nur in deiner Main Phase.'
      break
    case 'pointBoost':
      return 'Dieser Pfeilbonus gilt ohne Aktivierung.'
    case 'summonPile':
      if (!hasFreeMonsterZone(me.monsters, 0)) return 'Deine Monster-Zone ist voll.'
      if (effect.from === 'hand' && !me.hand.some((item) => item.kind === 'monster' && item.id !== cardId)) return 'Kein Monster auf der Hand.'
      if (effect.from === 'deck' && !me.deck.some((item) => item.kind === 'monster' && !item.extraDeck)) return 'Kein Monster im Deck.'
      if (effect.from === 'gy' && !me.graveyard.some((item) => item.kind === 'monster' && !item.extraDeck)) return 'Kein Monster im Friedhof.'
      break
    case 'equip':
      if (!me.monsters.some((monster) => !monster.faceDown)) return 'Du hast kein offenes Monster für die Ausrüstung.'
      break
    default:
      break
  }
  return null
}

export function canActivateCard(state: DuelState, side: DuelSide, cardId: number): boolean {
  return checkActivation(state, side, cardId) === null
}

export function legalTargets(state: DuelState, side: DuelSide, cardId: number): TargetPick[] {
  const me = owner(state, side)
  const foe = owner(state, opposite(side))
  const { card } = zoneCard(me, cardId)
  const effect = card?.effect
  if (!card || !effect) return []
  const asPick = (item: DuelCard, ownerSide: DuelSide, pile: TargetPile): TargetPick => ({ cardId: item.id, owner: ownerSide, pile })
  const foeMonsters = (targeted: boolean) => foe.monsters
    .filter((monster) => effectHits(monster, targeted))
    .map((monster) => asPick(monster, opposite(side), 'field'))
  const ownMonsters = () => me.monsters
    .filter((monster) => !monster.faceDown && effectHits(monster, false))
    .map((monster) => asPick(monster, side, 'field'))
  switch (effect.kind) {
    case 'destroy':
      return effect.target === 'monster' ? foeMonsters(true) : []
    case 'search':
    case 'summonDeck':
      return me.deck
        .filter((item) => item.kind === 'monster' && !item.extraDeck)
        .map((item) => asPick(item, side, 'deck'))
    case 'revive':
      return me.graveyard
        .filter((item) => item.kind === 'monster' && !item.extraDeck)
        .map((item) => asPick(item, side, 'graveyard'))
    case 'recover':
      return [
        ...me.graveyard.filter((item) => !item.extraDeck).map((item) => asPick(item, side, 'graveyard')),
        ...me.banished.filter((item) => !item.faceDown).map((item) => asPick(item, side, 'banished')),
      ]
    case 'banish':
      if (effect.target === 'gyMonster') {
        return me.graveyard.filter((item) => item.kind === 'monster').map((item) => asPick(item, side, 'graveyard'))
      }
      if (effect.target === 'monster') return foeMonsters(true)
      return []
    case 'summonPile':
      if (effect.from === 'deck') {
        return me.deck.filter((item) => item.kind === 'monster' && !item.extraDeck).map((item) => asPick(item, side, 'deck'))
      }
      if (effect.from === 'gy') {
        return me.graveyard.filter((item) => item.kind === 'monster' && !item.extraDeck).map((item) => asPick(item, side, 'graveyard'))
      }
      return me.hand
        .filter((item) => item.kind === 'monster' && item.id !== cardId)
        .map((item) => asPick(item, side, 'field'))
    case 'equip':
    case 'boost':
      return ownMonsters()
    case 'weaken':
      return effect.all ? [] : foeMonsters(true)
    case 'position':
      return effect.target === 'monster' ? foeMonsters(true) : []
    case 'bounce':
      return effect.target === 'monster' ? foeMonsters(true) : []
    default:
      return []
  }
}

export function activateDuelEffect(
  state: DuelState,
  side: DuelSide,
  cardId: number,
  via?: 'trigger' | 'simultaneous',
  options?: { targetId?: number; deferResponse?: boolean },
): DuelState {
  const problem = checkActivation(state, side, cardId, via)
  if (problem) throw new Error(problem)
  const player = owner(state, side)
  const { card: original, zone } = zoneCard(player, cardId)
  const card = original as DuelCard
  const effect = card.effect as DuelEffect
  const staysInSpellZone = zone === 'spells' && (effect.kind === 'counter' || effect.kind === 'rule')
  const nextOwner = {
    ...player,
    hand: zone === 'hand' ? player.hand.filter((item) => item.id !== cardId) : [...player.hand],
    spells: zone === 'spells' && !staysInSpellZone ? player.spells.filter((item) => item.id !== cardId) : [...player.spells],
    monsters: [...player.monsters],
    graveyard: [...player.graveyard],
    usedEffects: zone === 'monsters' ? [...player.usedEffects, cardId] : [...player.usedEffects],
  }
  const picks = state.promptMode ? legalTargets(state, side, cardId) : []
  if (options?.targetId != null && picks.length && !picks.some((pick) => pick.cardId === options.targetId)) {
    throw new Error('Dieses Ziel ist nicht erlaubt.')
  }
  const needsChoice = Boolean(state.promptMode) && picks.length >= 2 && options?.targetId == null
  const autoTarget = !needsChoice && picks.length === 1 ? picks[0].cardId : options?.targetId
  const linkId = state.chain.length ? state.chain[state.chain.length - 1].id + 1 : 1
  const chain = [...state.chain, {
    id: linkId,
    controller: side,
    card: { ...card, faceDown: false },
    effect,
    negated: false,
    spellSpeed: spellSpeedForCard(card),
    ...(autoTarget != null ? { targetId: autoTarget } : {}),
  }]
  const updated = remember({
    ...state,
    [side]: nextOwner,
    chain,
    chainPriority: opposite(side),
    chainPasses: 0,
    lastAnimation: { id: card.id, kind: 'effect', side },
    message: `${side === 'player' ? 'Du aktivierst' : 'Jarvis aktiviert'} ${card.name}. ${opposite(side) === 'player' ? 'Du kannst reagieren.' : 'Jarvis prüft eine Reaktion.'}`,
  }, `Aktivierung: ${card.name}`)
  const noted = remember(updated, `Kettenglied ${linkId}: ${card.name}`)
  if (needsChoice) {
    return {
      ...noted,
      pendingTarget: { linkId, candidates: picks.map((pick) => pick.cardId), pile: picks[0].pile },
      chainPriority: side,
      chainPasses: 0,
      message: 'Wähle ein leuchtendes Ziel.',
    }
  }
  // Die gespiegelte Sicht von Ultron darf die Karten des Menschen nicht selbst spielen.
  const mirrored = state.turn % 1 !== 0
  let result = side === 'player' && !mirrored && !options?.deferResponse ? jarvisRespond(noted) : noted
  if ((result.promptMode === 'auto' || result.promptMode === 'on') && side === 'jarvis' && result.chainPriority === 'player' && !result.pendingPrompt && !result.pendingTarget) {
    const answer = playerResponseCard(result)
    if (answer) {
      result = {
        ...result,
        pendingPrompt: {
          side: 'player',
          cardId: answer.id,
          chainNumber: result.chain.length + 1,
          source: 'response',
          mandatory: isMandatoryCard(answer),
        },
        message: `${answer.name} kann auf die gegnerische Aktion antworten.`,
      }
    }
  }
  return result
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
  const takeSpell = (player: DuelPlayer): DuelCard | null => {
    const hit = player.spells.shift()
    if (hit) return hit
    if (!player.fieldSpell) return null
    const field = player.fieldSpell
    player.fieldSpell = null
    return field
  }
  const destroyMonster = (monster: DuelCard) => {
    const index = nextTarget.monsters.indexOf(monster)
    if (index < 0) return
    nextTarget.monsters.splice(index, 1)
    sendAway(nextTarget, monster)
    destroyed.push(monster.id)
  }
  const weakestHit = (targeted: boolean) => nextTarget.monsters.reduce<DuelCard | null>((weakest, monster) => {
    if (!effectHits(monster, targeted)) return weakest
    return !weakest || (monster.atk || 0) < (weakest.atk || 0) ? monster : weakest
  }, null)
  switch (link.effect.kind) {
    case 'draw':
      drawFailed = draw(nextSource, link.effect.amount) !== link.effect.amount
      break
    case 'drawDiscard':
      draw(nextSource, link.effect.draw)
      for (let i = 0; i < link.effect.discard && nextSource.hand.length; i += 1) {
        nextSource.graveyard.push(nextSource.hand.pop() as DuelCard)
      }
      break
    case 'damage':
      nextTarget.lp = Math.max(0, nextTarget.lp - link.effect.amount)
      break
    case 'heal':
      nextSource.lp = Math.min(8000, nextSource.lp + link.effect.amount)
      break
    case 'destroy': {
      if (link.effect.target === 'spelltrap' || link.effect.target === 'allSpelltrap') {
        const hits = link.effect.target === 'allSpelltrap' ? 12 : 1
        for (let i = 0; i < hits; i += 1) {
          const hit = takeSpell(nextTarget)
          if (!hit) break
          nextTarget.graveyard.push({ ...hit, faceDown: false })
        }
      } else if (link.effect.target === 'allMonsters') {
        for (const monster of [...nextTarget.monsters]) if (effectHits(monster, false)) destroyMonster(monster)
      } else if (link.effect.target === 'attackMonsters') {
        for (const monster of [...nextTarget.monsters]) {
          if (monster.position !== 'defense' && effectHits(monster, false)) destroyMonster(monster)
        }
      } else {
        const named = link.targetId != null ? nextTarget.monsters.find((monster) => monster.id === link.targetId) : null
        const targetMonster = named && effectHits(named, true) ? named : weakestHit(true)
        if (targetMonster) destroyMonster(targetMonster)
      }
      break
    }
    case 'search': {
      const named = link.targetId != null ? nextSource.deck.findIndex((item) => item.id === link.targetId) : -1
      const index = named >= 0 ? named : nextSource.deck.findIndex((item) => item.kind === 'monster' && !item.extraDeck)
      const [found] = nextSource.deck.splice(index >= 0 ? index : nextSource.deck.length - 1, 1)
      if (found) nextSource.hand.push(found)
      break
    }
    case 'revive': {
      const named = link.targetId != null
        ? nextSource.graveyard.find((item) => item.id === link.targetId && item.kind === 'monster' && !item.extraDeck) ?? null
        : null
      const best = named || nextSource.graveyard
        .filter((item) => item.kind === 'monster' && !item.extraDeck)
        .reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
      if (best && hasFreeMonsterZone(nextSource.monsters, 0)) {
        const column = freeMainColumn(nextSource.monsters)
        if (column != null) {
          nextSource.graveyard.splice(nextSource.graveyard.indexOf(best), 1)
          nextSource.monsters.push({
            ...withRules(leaveField(best)),
            faceDown: false,
            position: 'attack',
            lockedKey: turnKey(state),
            zoneKind: 'mmz',
            zoneIndex: column,
          })
        }
      }
      break
    }
    case 'summonDeck': {
      const best = nextSource.deck
        .filter((item) => item.kind === 'monster' && !item.extraDeck)
        .reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
      if (best && hasFreeMonsterZone(nextSource.monsters, 0)) {
        nextSource.deck.splice(nextSource.deck.indexOf(best), 1)
        nextSource.monsters.push({ ...leaveField(best), faceDown: false, position: 'attack', lockedKey: turnKey(state), zoneKind: 'mmz' })
      }
      break
    }
    case 'recover': {
      if (link.targetId != null) {
        const gyIndex = nextSource.graveyard.findIndex((item) => item.id === link.targetId)
        if (gyIndex >= 0) {
          const [picked] = nextSource.graveyard.splice(gyIndex, 1)
          nextSource.hand.push(leaveField(picked))
          break
        }
        const banIndex = nextSource.banished.findIndex((item) => item.id === link.targetId && !item.faceDown)
        if (banIndex >= 0) {
          const [picked] = nextSource.banished.splice(banIndex, 1)
          nextSource.hand.push(leaveField(picked))
          break
        }
      }
      const monsters = nextSource.graveyard.filter((item) => item.kind === 'monster' && !item.extraDeck)
      const best = monsters.reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
        || nextSource.graveyard.find((item) => !item.extraDeck)
        || null
      if (best) {
        nextSource.graveyard.splice(nextSource.graveyard.indexOf(best), 1)
        nextSource.hand.push(leaveField(best))
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
      } else if (link.effect.target === 'spelltrap') {
        const hit = takeSpell(nextTarget)
        if (hit) nextTarget.banished.push({ ...hit, faceDown: false })
      } else {
        const targetMonster = weakestHit(true)
        if (targetMonster) {
          nextTarget.monsters.splice(nextTarget.monsters.indexOf(targetMonster), 1)
          if (!targetMonster.token) nextTarget.banished.push(leaveField(targetMonster))
          destroyed.push(targetMonster.id)
        }
      }
      break
    }
    case 'position': {
      const chosen = link.effect.target === 'allMonsters'
        ? [...nextTarget.monsters]
        : [nextTarget.monsters.reduce<DuelCard | null>((top, monster) => !top || (monster.atk || 0) > (top.atk || 0) ? monster : top, null)].filter((monster): monster is DuelCard => Boolean(monster))
      for (const monster of chosen) {
        const index = nextTarget.monsters.indexOf(monster)
        if (index < 0) continue
        nextTarget.monsters[index] = {
          ...monster,
          position: 'defense',
          faceDown: link.effect.faceDown ? true : monster.faceDown,
        }
      }
      break
    }
    case 'weaken': {
      const hits = link.effect.all
        ? [...nextTarget.monsters]
        : [nextTarget.monsters.reduce<DuelCard | null>((top, monster) => !top || (monster.atk || 0) > (top.atk || 0) ? monster : top, null)].filter((monster): monster is DuelCard => Boolean(monster))
      for (const monster of hits) {
        const amount = link.effect.half ? Math.ceil((monster.atk || 0) / 2) : link.effect.amount
        const index = nextTarget.monsters.indexOf(monster)
        if (index < 0) continue
        nextTarget.monsters[index] = {
          ...monster,
          baseAtk: monster.baseAtk ?? monster.atk,
          atk: Math.max(0, (monster.atk || 0) - amount),
          boost: (monster.boost || 0) - amount,
        }
      }
      break
    }
    case 'bounce': {
      if (link.effect.target === 'allSpelltrap') {
        const returned = [...nextTarget.spells]
        nextTarget.spells = []
        if (nextTarget.fieldSpell) {
          returned.push(nextTarget.fieldSpell)
          nextTarget.fieldSpell = null
        }
        for (const card of returned) nextTarget.hand.push(leaveField(card))
        break
      }
      const hits = link.effect.target === 'allMonsters'
        ? nextTarget.monsters.filter((monster) => monster.position !== 'defense')
        : [weakestHit(true)].filter((monster): monster is DuelCard => Boolean(monster))
      for (const monster of hits) {
        const index = nextTarget.monsters.indexOf(monster)
        if (index < 0) continue
        nextTarget.monsters.splice(index, 1)
        if (!monster.token) nextTarget.hand.push(leaveField(monster))
      }
      break
    }
    case 'mill': {
      const pile = link.effect.opponent ? nextTarget : nextSource
      for (let i = 0; i < link.effect.amount && pile.deck.length; i += 1) {
        const milled = pile.deck.pop()
        if (milled) pile.graveyard.push(milled)
      }
      break
    }
    case 'summonPile': {
      const pile = link.effect.from === 'hand' ? nextSource.hand : link.effect.from === 'deck' ? nextSource.deck : nextSource.graveyard
      const best = pile
        .filter((item) => item.kind === 'monster' && !item.extraDeck && item.id !== link.card.id)
        .reduce<DuelCard | null>((top, item) => !top || (item.atk || 0) > (top.atk || 0) ? item : top, null)
      const column = freeMainColumn(nextSource.monsters)
      if (best && column != null) {
        pile.splice(pile.indexOf(best), 1)
        nextSource.monsters.push({
          ...withRules(leaveField(best)),
          faceDown: false,
          position: 'attack',
          lockedKey: turnKey(state),
          zoneKind: 'mmz',
          zoneIndex: column,
        })
      }
      break
    }
    case 'equip': {
      const host = nextSource.monsters.reduce<DuelCard | null>((top, monster) => !top || (monster.atk || 0) > (top.atk || 0) ? monster : top, null)
      if (host) {
        const index = nextSource.monsters.indexOf(host)
        const amount = link.effect.amount
        nextSource.monsters[index] = link.effect.stat === 'def'
          ? { ...host, baseDef: host.baseDef ?? host.def, def: (host.def || 0) + amount }
          : { ...host, baseAtk: host.baseAtk ?? host.atk, atk: (host.atk || 0) + amount, boost: (host.boost || 0) + amount }
      }
      if (nextSource.spells.length < 5 && !nextSource.spells.some((spell) => spell.id === link.card.id)) {
        nextSource.spells.push({ ...link.card, faceDown: false })
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
      nextSource.fieldSpell = { ...link.card, faceDown: false, effect: link.effect }
      break
    case 'boost': {
      const strongest = nextSource.monsters.reduce<DuelCard | null>((top, item) => {
        if (hasRule(item, 'unaffected')) return top
        return !top || (item.atk || 0) > (top.atk || 0) ? item : top
      }, null)
      if (strongest) {
        const index = nextSource.monsters.indexOf(strongest)
        nextSource.monsters[index] = {
          ...strongest,
          baseAtk: strongest.baseAtk ?? strongest.atk,
          atk: (strongest.atk || 0) + link.effect.amount,
          boost: (strongest.boost || 0) + link.effect.amount,
        }
      }
      break
    }
    case 'setStat': {
      const index = nextSource.monsters.findIndex((monster) => monster.id === link.card.id)
      if (index >= 0) {
        const monster = nextSource.monsters[index]
        nextSource.monsters[index] = link.effect.stat === 'atk'
          ? { ...monster, baseAtk: monster.baseAtk ?? monster.atk, atk: link.effect.value }
          : { ...monster, baseDef: monster.baseDef ?? monster.def, def: link.effect.value }
      }
      break
    }
    case 'negateAttack':
      pendingAttack = null
      break
    case 'negate':
      break
    case 'summonHand': {
      const tributes = [...nextSource.monsters].sort((a, b) => (a.atk || 0) - (b.atk || 0)).slice(0, link.effect.tributes)
      const column = freeMainColumn(nextSource.monsters.filter((monster) => !tributes.includes(monster)))
      if (tributes.length < link.effect.tributes || link.effect.discard > nextSource.hand.length || column == null) {
        sendAway(nextSource, link.card)
        break
      }
      for (const tribute of tributes) {
        nextSource.monsters.splice(nextSource.monsters.indexOf(tribute), 1)
        sendAway(nextSource, tribute)
      }
      for (let i = 0; i < link.effect.discard && nextSource.hand.length; i += 1) {
        nextSource.graveyard.push(nextSource.hand.pop() as DuelCard)
      }
      nextSource.monsters.push({
        ...withRules(link.card),
        faceDown: false,
        position: 'attack',
        lockedKey: turnKey(state),
        zoneKind: 'mmz',
        zoneIndex: column,
        linkArrows: link.card.extraKind === 'link' ? registerLinkArrows(link.card) : link.card.linkArrows,
      })
      break
    }
    case 'token': {
      let nextId = highestCardId(state) + 1
      const amount = Math.max(1, link.effect.amount)
      for (let i = 0; i < amount; i += 1) {
        const column = freeMainColumn(nextSource.monsters)
        if (column == null) break
        nextSource.monsters.push({
          id: nextId,
          name: link.effect.name || 'Token',
          type: 'Token',
          kind: 'monster',
          atk: link.effect.atk,
          def: link.effect.def,
          baseAtk: link.effect.atk,
          baseDef: link.effect.def,
          level: 1,
          token: true,
          position: 'attack',
          zoneKind: 'mmz',
          zoneIndex: column,
          lockedKey: turnKey(state),
        })
        nextId += 1
      }
      break
    }
    case 'counter': {
      const placeCard = (card: DuelCard) => {
        if (card.kind === 'monster') {
          const index = nextSource.monsters.findIndex((monster) => monster.id === card.id)
          if (index >= 0) nextSource.monsters[index] = card
          return
        }
        if (/field/i.test(card.subtype || '')) {
          nextSource.fieldSpell = card
          return
        }
        const index = nextSource.spells.findIndex((spell) => spell.id === card.id)
        if (index >= 0) nextSource.spells[index] = card
        else if (nextSource.spells.length < 5) nextSource.spells.push(card)
      }
      const host = nextSource.monsters.find((monster) => monster.id === link.card.id)
        || nextSource.spells.find((spell) => spell.id === link.card.id)
        || (nextSource.fieldSpell?.id === link.card.id ? nextSource.fieldSpell : undefined)
      const current = host?.counters ?? link.card.counters ?? 0
      if (link.effect.mode === 'remove') {
        if (current < link.effect.amount) break
        placeCard({ ...(host || link.card), counters: current - link.effect.amount, faceDown: false })
        if (link.effect.then === 'draw') draw(nextSource, 1)
      } else {
        placeCard({ ...withRules(host || link.card), counters: current + link.effect.amount, faceDown: false })
      }
      break
    }
    case 'rule': {
      const stamped = { ...withRules(link.card), faceDown: false }
      if (stamped.kind === 'monster') {
        const index = nextSource.monsters.findIndex((monster) => monster.id === stamped.id)
        if (index >= 0) nextSource.monsters[index] = { ...nextSource.monsters[index], rules: stamped.rules, faceDown: false }
      } else if (/field/i.test(stamped.subtype || '')) {
        nextSource.fieldSpell = stamped
      } else {
        const index = nextSource.spells.findIndex((spell) => spell.id === stamped.id)
        if (index >= 0) nextSource.spells[index] = stamped
        else if (nextSource.spells.length < 5) nextSource.spells.push(stamped)
      }
      break
    }
    case 'pointBoost':
      break
  }
  const staysOnField = link.effect.kind === 'fieldAura'
    || link.effect.kind === 'counter'
    || link.effect.kind === 'rule'
    || link.effect.kind === 'pointBoost'
    || link.effect.kind === 'equip'
    || /field/i.test(link.card.subtype || '')
  if (link.card.kind !== 'monster' && !staysOnField) nextSource.graveyard.push(link.card)
  if (staysOnField && link.effect.kind !== 'fieldAura' && /field/i.test(link.card.subtype || '') && link.effect.kind !== 'rule' && link.effect.kind !== 'counter') {
    nextSource.fieldSpell = { ...link.card, faceDown: false }
  }
  if (link.card.kind === 'spell') grantSpellCounters(nextSource)
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
      const me = owner(next, link.controller)
      const monsters = link.card.kind === 'monster'
        ? me.monsters.map((monster) => monster.id === link.card.id ? { ...monster, effectsNegated: true } : monster)
        : me.monsters
      next = {
        ...next,
        [link.controller]: {
          ...me,
          monsters,
          graveyard: link.card.kind === 'monster' && link.effect.kind !== 'summonHand'
            ? me.graveyard
            : [...me.graveyard, leaveField(link.card)],
        },
        message: `${link.card.name} wurde negiert.`,
      }
      continue
    }
    if (link.effect.kind === 'negate') {
      const previous = chain[index - 1]
      if (previous) previous.negated = true
      const source = owner(next, link.controller)
      const paying = link.effect.cost === 'halfLp' ? { ...source, lp: Math.ceil(source.lp / 2) } : source
      next = {
        ...next,
        [link.controller]: link.card.kind === 'monster'
          ? paying
          : { ...paying, graveyard: [...paying.graveyard, link.card] },
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
    const direct = hasRule(attacker, 'direct') || !state.jarvis.monsters.length
    return direct ? resolveBattle(cleared, attacker, null) : { ...cleared, message: `${state.message} Der Angriff fällt aus.` }
  }
  const target = state.jarvis.monsters.find((card) => card.id === pending.targetId)
  return target ? resolveBattle(cleared, attacker, target) : { ...cleared, message: `${state.message} Das Ziel ist weg, der Angriff fällt aus.` }
}

/** Löst eine offene Kette auf, indem beide Seiten passen. Für Bot-Züge, die niemanden fragen. */
export function drainChain(state: DuelState): DuelState {
  let next = state
  for (let guard = 0; guard < 12 && next.chain.length && !next.winner; guard += 1) {
    const side = next.chainPriority
    if (side !== 'player' && side !== 'jarvis') return next
    try {
      next = passDuelChain(next, side)
    } catch {
      return next
    }
  }
  return next
}

export function passDuelChain(state: DuelState, side: DuelSide): DuelState {
  if (!state.chain.length || state.chainPriority !== side) throw new Error('Diese Duellseite hat gerade keine Ketten-Priorität.')
  if (state.chainPasses === 1) {
    const resolved = resolveChain(state)
    if (resolved.promptMode === 'on' && !resolved.winner && !resolved.pendingPrompt && !resolved.pendingTarget) {
      const card = phasePromptCard(resolved)
      if (card) {
        return {
          ...resolved,
          pendingPrompt: {
            side: 'player',
            cardId: card.id,
            chainNumber: 1,
            source: 'response',
            mandatory: false,
          },
          message: `Nach der Auflösung: ${card.name}?`,
        }
      }
    }
    return { ...resolved, message: resolved.winner ? resolved.message : `${resolved.message} Die Effektkette wurde aufgelöst.` }
  }
  const nextSide = opposite(side)
  const next = { ...state, chainPasses: 1, chainPriority: nextSide }
  return nextSide === 'jarvis' ? jarvisRespond(next) : { ...next, message: 'Du kannst ein Kettenglied hinzufügen oder passen.' }
}

function jarvisRespond(state: DuelState): DuelState {
  if (state.chainPriority !== 'jarvis') return state
  const top = state.chain[state.chain.length - 1]
  if (!top || top.controller === 'jarvis') return passDuelChain(state, 'jarvis')
  const negate = [...state.jarvis.hand, ...state.jarvis.spells, ...state.jarvis.monsters]
    .find((card) => card.effect?.kind === 'negate' && checkActivation(state, 'jarvis', card.id) === null)
  if (negate) return activateDuelEffect(state, 'jarvis', negate.id)
  return passDuelChain(state, 'jarvis')
}

export function selectAttacker(state: DuelState, cardId: number): DuelState {
  requirePlayerTurn(state)
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.phase !== 'battle' || state.winner) throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  if (isFirstTurnBattleBlocked(state)) throw new Error('In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).')
  const card = state.player.monsters.find((item) => item.id === cardId)
  if (!card) throw new Error('Dieses Monster ist nicht auf deinem Feld.')
  if (state.attacked.includes(cardId)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  if (card.position === 'defense' || card.faceDown) throw new Error('Monster in Verteidigung können nicht angreifen.')
  if (hasRule(card, 'cannotAttack')) throw new Error(`${card.name} kann nicht angreifen.`)
  const selected = state.selectedAttacker === cardId ? null : cardId
  return {
    ...state,
    selectedAttacker: selected,
    ...(state.battleWindow && selected != null ? { battleStep: 'declare' as const } : {}),
    message: hasRule(card, 'direct') ? 'Direktangriff oder ein Ziel wählen.' : 'Wähle ein gegnerisches Monster als Ziel.',
  }
}

type BattleOutcome = { destroyAttacker: boolean; destroyTarget: boolean; hurtAttacker: number; hurtDefender: number }

function battleOutcome(
  attacker: DuelCard,
  target: DuelCard | null,
  attackerOwner: DuelPlayer,
  defenderOwner: DuelPlayer,
): BattleOutcome {
  const power = effectiveAtk(attacker, attackerOwner, defenderOwner)
  if (!target) return { destroyAttacker: false, destroyTarget: false, hurtAttacker: 0, hurtDefender: power }
  if (target.position === 'defense') {
    const difference = power - (target.def || 0)
    return {
      destroyAttacker: false,
      destroyTarget: difference > 0 && !hasRule(target, 'battleProof'),
      hurtAttacker: difference < 0 ? -difference : 0,
      hurtDefender: hasRule(attacker, 'piercing') && difference > 0 ? difference : 0,
    }
  }
  const difference = power - (effectiveAtk(target, defenderOwner, attackerOwner))
  return {
    destroyAttacker: difference <= 0 && !hasRule(attacker, 'battleProof'),
    destroyTarget: difference >= 0 && !hasRule(target, 'battleProof'),
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
    sendAway(jarvis, target)
    destroyed.push(target.id)
  } else if (target && target.faceDown) {
    jarvis.monsters[jarvis.monsters.findIndex((card) => card.id === target.id)] = { ...target, faceDown: false }
  }
  if (outcome.destroyAttacker) {
    player.monsters.splice(player.monsters.findIndex((card) => card.id === attacker.id), 1)
    sendAway(player, attacker)
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
  const battled = finishBattle({
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
  const flipped = target?.faceDown && !outcome.destroyTarget ? target.id : 0
  if (flipped && battled.jarvis.monsters.some((card) => card.id === flipped)) {
    return settleTrigger(battled, 'jarvis', flipped, 'flip')
  }
  return battled
}

function jarvisTrapAnswer(state: DuelState): DuelCard | undefined {
  return state.jarvis.spells.find((card) =>
    card.kind === 'trap'
    && card.effect
    && (card.effect.kind === 'negateAttack' || card.effect.kind === 'damage' || card.effect.kind === 'destroy' || card.effect.kind === 'banish' || card.effect.kind === 'bounce' || card.effect.kind === 'position')
    && checkActivation({ ...state, turnOwner: 'player' }, 'jarvis', card.id) === null)
}

export function attack(state: DuelState, targetId?: number, options: { skipTraps?: boolean } = {}): DuelState {
  requirePlayerTurn(state)
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.winner || state.phase !== 'battle') throw new Error('Angriffe sind nur in der Battle Phase möglich.')
  if (isFirstTurnBattleBlocked(state)) throw new Error('In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).')
  const attacker = state.player.monsters.find((card) => card.id === state.selectedAttacker)
  if (!attacker) throw new Error('Wähle zuerst eines deiner Monster.')
  if (state.attacked.includes(attacker.id)) throw new Error('Dieses Monster hat in diesem Zug bereits angegriffen.')
  if (attacker.position === 'defense') throw new Error('Monster in Verteidigung können nicht angreifen.')
  if (hasRule(attacker, 'cannotAttack')) throw new Error(`${attacker.name} kann nicht angreifen.`)
  let target: DuelCard | null = null
  if (targetId != null) {
    target = state.jarvis.monsters.find((card) => card.id === targetId) ?? null
    if (!target) throw new Error('Wähle ein Monster von Jarvis als Angriffsziel.')
  } else if (state.jarvis.monsters.length && !hasRule(attacker, 'direct')) {
    throw new Error('Wähle ein Monster von Jarvis als Angriffsziel.')
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
    const noted = remember(declared, `Angriff: ${attacker.name}`)
    const trap = jarvisTrapAnswer(noted)
    if (trap) return activateDuelEffect(noted, 'jarvis', trap.id)
    if (state.battleWindow) {
      return {
        ...noted,
        battleStep: 'damage',
        message: `${attacker.name} deklariert den Angriff. Antwort vor der Schadensrechnung.`,
      }
    }
  }
  return remember(resolveBattle(state, attacker, target), `Angriff: ${attacker.name}`)
}

export function startJarvisTurn(state: DuelState): DuelState {
  if (state.winner) return state
  if ((state.turnOwner ?? 'player') !== 'player') return state
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if ((state.discardNeeded || 0) > 0) throw new Error('Wirf zuerst Karten ab. Das Handlimit ist 6.')
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
    player: clearNegation(clearBoosts(state.player)),
    jarvis: clearNegation({ ...jarvis, hand, deck }),
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
    player: clearNegation({ ...state.player, deck, hand: [...state.player.hand, top], normalSummonUsed: false, usedEffects: [] }),
    jarvis: clearNegation(clearBoosts(trimHandToLimit(state.jarvis))),
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

function askBeforePhase(state: DuelState, intent: 'battle' | 'end' | 'next'): DuelState | null {
  if (state.promptMode !== 'on' || state.skipPhasePrompt || state.pendingPrompt) return null
  const card = phasePromptCard(state)
  if (!card) return null
  return {
    ...state,
    phaseIntent: intent,
    pendingPrompt: {
      side: 'player',
      cardId: card.id,
      chainNumber: state.chain.length + 1,
      source: 'phase',
      mandatory: false,
    },
    message: `Vor dem Phasenwechsel: ${card.name}?`,
  }
}

export function confirmPrompt(state: DuelState): DuelState {
  const prompt = state.pendingPrompt
  if (!prompt) throw new Error('Es gibt keine Aktivierungsfrage.')
  const via = prompt.source === 'trigger' ? 'trigger' as const : undefined
  const problem = checkActivation(state, prompt.side, prompt.cardId, via)
  if (problem) throw new Error(problem)
  return activateDuelEffect({ ...state, pendingPrompt: null }, prompt.side, prompt.cardId, via)
}

export function declinePrompt(state: DuelState): DuelState {
  const prompt = state.pendingPrompt
  if (!prompt) throw new Error('Es gibt keine Aktivierungsfrage.')
  if (prompt.mandatory) throw new Error('Dieser Effekt ist verpflichtend.')
  const cleared: DuelState = { ...state, pendingPrompt: null, message: 'Aktivierung abgelehnt.', skipPhasePrompt: true }
  if (prompt.source === 'phase') {
    const intent = state.phaseIntent
    if (intent === 'battle' || intent === 'end') return declareDuelPhase(cleared, intent)
    return advanceDuelPhase(cleared)
  }
  if (prompt.source === 'response' && cleared.chain.length && cleared.chainPriority === 'player') {
    return passDuelChain(cleared, 'player')
  }
  return { ...cleared, skipPhasePrompt: false }
}

export function chooseChainTarget(state: DuelState, cardId: number): DuelState {
  const pending = state.pendingTarget
  if (!pending) throw new Error('Es gibt keine Zielwahl.')
  if (!pending.candidates.includes(cardId)) throw new Error('Dieses Ziel ist nicht erlaubt.')
  const chain = state.chain.map((link) => link.id === pending.linkId ? { ...link, targetId: cardId } : link)
  const link = chain.find((item) => item.id === pending.linkId)
  const cleared: DuelState = {
    ...state,
    chain,
    pendingTarget: null,
    chainPriority: link ? opposite(link.controller) : state.chainPriority,
    chainPasses: 0,
    message: 'Ziel gewählt.',
  }
  return cleared.chainPriority === 'jarvis' ? jarvisRespond(cleared) : cleared
}

export function beginTriggerOrder(state: DuelState, cardIds: number[]): DuelState {
  requirePlayerTurn(state)
  if (cardIds.length < 2) throw new Error('Gleichzeitige Auslöser brauchen mindestens zwei Karten.')
  if (new Set(cardIds).size !== cardIds.length) throw new Error('Ein Auslöser kann nicht doppelt gewählt werden.')
  for (const id of cardIds) {
    const problem = checkActivation({ ...state, chain: [], chainPriority: null }, 'player', id, 'trigger')
    if (problem) throw new Error(problem)
  }
  return { ...state, pendingTriggerOrder: [...cardIds], message: 'Wähle die Reihenfolge der gleichzeitigen Auslöser.' }
}

export function confirmTriggerOrder(state: DuelState, orderedIds: number[]): DuelState {
  const pending = state.pendingTriggerOrder
  if (!pending) throw new Error('Es gibt keine Auslöser-Reihenfolge.')
  const same = orderedIds.length === pending.length
    && new Set(orderedIds).size === orderedIds.length
    && orderedIds.every((id) => pending.includes(id))
  if (!same) throw new Error('Diese Reihenfolge ist nicht erlaubt.')
  if (state.chain.length && topChainSpellSpeed(state) >= 2) {
    const pool = [...state.player.monsters, ...state.player.hand, ...state.player.spells]
    for (const id of orderedIds) {
      const card = pool.find((item) => item.id === id)
      if (card && spellSpeedForCard(card) < 2) throw new Error('Spell Speed 1 kann nicht über eine schnellere Antwort gelegt werden.')
    }
  }
  let next: DuelState = { ...state, pendingTriggerOrder: null }
  for (const id of orderedIds) {
    next = activateDuelEffect(next, 'player', id, 'simultaneous', { deferResponse: true })
  }
  return next.chainPriority === 'jarvis' ? jarvisRespond(next) : next
}

export function resolveDeclaredAttack(state: DuelState): DuelState {
  if (!state.battleWindow) throw new Error('Die Schadensrechnung wartet nicht.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.battleStep !== 'damage' || !state.pendingAttack) throw new Error('Es gibt keine offene Angriffsdeklaration.')
  const resolved = resumePendingAttack(state)
  return { ...resolved, battleStep: 'end' }
}

export function declareDuelPhase(state: DuelState, target: 'battle' | 'end'): DuelState {
  if (state.winner) return state
  requirePlayerTurn(state)
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if ((state.discardNeeded || 0) > 0) throw new Error('Wirf zuerst Karten ab. Das Handlimit ist 6.')
  const asked = askBeforePhase(state, target)
  if (asked) return asked
  if (target === 'battle') {
    if (state.phase !== 'main1') throw new Error('Die Battle Phase startet aus der Main Phase 1.')
    if (isFirstTurnBattleBlocked(state)) throw new Error('In Turn 1 des Startspielers gibt es keine Battle Phase (TCG).')
    return remember({
      ...state,
      phase: 'battle',
      phaseIntent: undefined,
      skipPhasePrompt: false,
      battleStep: state.battleWindow ? 'start' : null,
      selectedAttacker: null,
      message: 'Battle Phase: Start.',
    }, 'Phase: Battle')
  }
  if (!['main1', 'battle', 'main2'].includes(state.phase)) throw new Error('Die End Phase ist von hier nicht erreichbar.')
  if (state.player.hand.length > 6) {
    const extra = state.player.hand.length - 6
    return {
      ...state,
      phase: 'end',
      phaseIntent: undefined,
      skipPhasePrompt: false,
      discardNeeded: extra,
      message: `Handlimit 6. Wirf ${extra} Karte(n) ab.`,
    }
  }
  return remember({
    ...state,
    phase: 'end',
    phaseIntent: undefined,
    skipPhasePrompt: false,
    selectedAttacker: null,
    attacked: [],
    battleStep: null,
    message: 'End Phase.',
  }, 'Phase: End')
}

export function placePendulumScale(state: DuelState, cardId: number, slot: 0 | 1): DuelState {
  requirePlayerTurn(state)
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Pendel-Skalen setzt du in der Main Phase.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.hand.find((item) => item.id === cardId)
  if (!card) throw new Error('Diese Karte ist nicht auf der Hand.')
  if (typeof card.pendulumScale !== 'number') throw new Error('Diese Karte hat keine Pendel-Skala. Es wird keine Skala erfunden.')
  const scales = state.player.scales ?? [null, null]
  if (scales[slot]) throw new Error('Diese Skala ist belegt.')
  const nextScales: [DuelCard | null, DuelCard | null] = [scales[0], scales[1]]
  nextScales[slot] = { ...card, faceDown: false }
  return remember({
    ...state,
    player: {
      ...state.player,
      hand: state.player.hand.filter((item) => item.id !== cardId),
      scales: nextScales,
    },
    message: `${card.name} liegt als Skala ${card.pendulumScale}.`,
  }, `Skala: ${card.name} ${card.pendulumScale}`)
}

export function pendulumSummon(state: DuelState, cardIds: number[]): DuelState {
  requirePlayerTurn(state)
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Pendelbeschwörung geht nur in der Main Phase.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  if (state.player.pendulumSummonUsed) throw new Error('Die Pendelbeschwörung wurde in diesem Zug schon genutzt.')
  const scales = state.player.scales ?? [null, null]
  const left = scales[0]?.pendulumScale
  const right = scales[1]?.pendulumScale
  if (typeof left !== 'number' || typeof right !== 'number') throw new Error('Beide Pendel-Skalen müssen liegen.')
  const low = Math.min(left, right)
  const high = Math.max(left, right)
  if (!cardIds.length || new Set(cardIds).size !== cardIds.length) throw new Error('Wähle unterschiedliche Karten für die Pendelbeschwörung.')
  const player: DuelPlayer = {
    ...state.player,
    hand: [...state.player.hand],
    monsters: [...state.player.monsters],
    extraDeck: [...state.player.extraDeck],
    pendulumSummonUsed: true,
  }
  for (const id of cardIds) {
    const fromHand = player.hand.find((card) => card.id === id)
    const fromExtra = player.extraDeck.find((card) => card.id === id && card.faceUpExtra)
    const card = fromHand || fromExtra
    if (!card || card.kind !== 'monster') throw new Error('Diese Karte kann nicht pendelbeschworen werden.')
    const level = card.level || 0
    if (level <= low || level >= high) throw new Error(`${card.name} liegt nicht zwischen den Skalen.`)
    if (fromExtra) {
      const zone = extraSummonZone(player.monsters)
      if (!zone) throw new Error('Extra-Deck-Pendelmonster brauchen eine EMZ oder einen eigenen Linkpfeil.')
      player.extraDeck = player.extraDeck.filter((item) => item.id !== id)
      player.monsters.push({
        ...withRules(card),
        faceDown: false,
        faceUpExtra: undefined,
        position: 'attack',
        zoneKind: zone.zoneKind,
        zoneIndex: zone.zoneIndex,
      })
    } else {
      const column = freeMainColumn(player.monsters)
      if (column == null) throw new Error('Deine Monster-Zone ist voll.')
      player.hand = player.hand.filter((item) => item.id !== id)
      player.monsters.push({
        ...withRules(card),
        faceDown: false,
        position: 'attack',
        zoneKind: 'mmz',
        zoneIndex: column,
      })
    }
  }
  return remember({
    ...state,
    player,
    message: 'Pendelbeschwörung.',
  }, 'Beschwörung: Pendel')
}

export function ritualSummon(state: DuelState, monsterId: number, spellId: number | null, tributeIds: number[]): DuelState {
  requirePlayerTurn(state)
  if (state.winner || !['main1', 'main2'].includes(state.phase)) throw new Error('Ritualbeschwörung geht nur in der Main Phase.')
  if (state.chain.length) throw new Error('Löse zuerst die offene Effektkette auf.')
  const card = state.player.hand.find((item) => item.id === monsterId)
  if (!card || card.kind !== 'monster' || !(card.ritual || /ritual/i.test(card.type))) {
    throw new Error('Das ist keine Ritualbeschwörung.')
  }
  let spell: DuelCard | null = null
  if (card.ritualSpellName) {
    spell = state.player.hand.find((item) => item.id === spellId) ?? null
    if (!spell || spell.name.toLowerCase() !== card.ritualSpellName.toLowerCase()) {
      throw new Error(`Diese Ritualbeschwörung verlangt ${card.ritualSpellName}.`)
    }
  }
  if (new Set(tributeIds).size !== tributeIds.length) throw new Error('Ein Tribut kann nicht mehrfach gewählt werden.')
  const tributes = tributeIds.map((id) => state.player.monsters.find((monster) => monster.id === id))
  if (!tributes.length || tributes.some((monster) => !monster)) throw new Error('Wähle gültige Tributmonster.')
  const selected = tributes as DuelCard[]
  const sum = selected.reduce((total, monster) => total + (monster.level || 0), 0)
  if (sum < (card.level || 0)) throw new Error('Die Tributstufe reicht für das Ritual nicht.')
  const player: DuelPlayer = {
    ...state.player,
    hand: state.player.hand.filter((item) => item.id !== monsterId && item.id !== spell?.id),
    monsters: state.player.monsters.filter((monster) => !tributeIds.includes(monster.id)),
    graveyard: [...state.player.graveyard],
  }
  for (const tribute of selected) sendAway(player, tribute)
  if (spell) player.graveyard.push(spell)
  const column = freeMainColumn(player.monsters)
  if (column == null) throw new Error('Deine Monster-Zone ist voll.')
  player.monsters.push({
    ...withRules(card),
    faceDown: false,
    position: 'attack',
    zoneKind: 'mmz',
    zoneIndex: column,
  })
  return remember({
    ...state,
    player,
    message: `${card.name} wurde als Ritual beschworen.`,
  }, `Beschwörung: ${card.name}`)
}

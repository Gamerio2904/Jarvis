import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceDuelPhase,
  createDuel,
  giveFirstTurn,
  isFirstTurnBattleBlocked,
  monsterZoneCapacity,
  selectAttacker,
  summonExtraMonster,
  summonMonster,
  activateDuelEffect,
  passDuelChain,
  setSpellTrap,
  canActivateCard,
  changePosition,
  attack,
  startJarvisTurn,
} from '../src/engine/yugioh-duel.ts'
import { jarvisStep } from '../src/engine/yugioh-net.ts'
import { registerLinkArrows, spellSpeedForCard } from '../src/engine/yugioh-zones.ts'

function deck(size = 40, atk = 1800) {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    catalogId: index + 1,
    name: `Monster ${index + 1}`,
    type: 'Effect Monster',
    kind: 'monster',
    atk,
    def: 1200,
    level: 4,
  }))
}

function enterMain1(state) {
  return advanceDuelPhase(advanceDuelPhase(state))
}

test('G1–G5: Link erweitert Zonenkapazität', () => {
  const link = {
    id: 9001,
    name: 'Test Link',
    type: 'Link Monster',
    kind: 'monster',
    extraDeck: true,
    extraKind: 'link',
    linkRating: 2,
    atk: 2000,
    level: 2,
  }
  assert.deepEqual(registerLinkArrows(link), [0, 1, 2])
  assert.equal(monsterZoneCapacity([link]), 6)
})

test('G6–G10: Turn-1-Battle blockiert für Startspieler', () => {
  const base = giveFirstTurn(createDuel(deck(), deck(), () => 0), 'player')
  assert.equal(isFirstTurnBattleBlocked(base), true)
  let state = { ...base, phase: 'main1' }
  state = advanceDuelPhase(state)
  assert.equal(state.phase, 'main2')
  const withMonster = {
    ...state,
    phase: 'battle',
    player: { ...state.player, monsters: [{ ...state.player.hand[0], id: 77, position: 'attack' }] },
  }
  assert.throws(() => selectAttacker(withMonster, 77), /Turn 1/)
})

test('Ultron führt in seinem ersten Zug keine Battle Phase', () => {
  let state = giveFirstTurn(createDuel(deck(40, 2500), deck(40, 2500), () => 0), 'jarvis')
  let guard = 0
  while (state.turnOwner === 'jarvis' && !state.winner && guard < 40) {
    assert.notEqual(state.phase, 'battle')
    state = jarvisStep(state, null)
    assert.equal(state.player.lp, 8000)
    guard += 1
  }
  assert.equal(state.turnOwner, 'player')
  assert.equal(state.player.lp, 8000)
})

test('Ein gesetzter Zauber bleibt bis zum nächsten Zug zu', () => {
  const spell = {
    id: 880,
    name: 'Draw',
    type: 'Spell Card',
    kind: 'spell',
    effect: { kind: 'draw', amount: 1 },
  }
  let state = advanceDuelPhase(advanceDuelPhase(createDuel(deck(), deck(), () => 0)))
  state = { ...state, phase: 'main1', player: { ...state.player, hand: [spell, ...state.player.hand] } }
  state = setSpellTrap(state, 880)
  assert.match(canActivateCard(state, 'player', 880) ? '' : 'Dieser Zauber wurde in diesem Zug gesetzt.', /gesetzt/)
  const later = { ...state, turn: state.turn + 1 }
  assert.equal(canActivateCard(later, 'player', 880), true)
})

test('Counter-Fallen sind Spell Speed 3, normale Zauber nicht in der Battle Phase', () => {
  const counter = { id: 1, name: 'Solemn', type: 'Trap Card', kind: 'trap', subtype: 'Counter', effect: { kind: 'negate' } }
  assert.equal(spellSpeedForCard(counter), 3)
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const spell = { id: 880, name: 'Bolt', type: 'Spell Card', kind: 'spell', effect: { kind: 'damage', amount: 500 } }
  const state = { ...base, phase: 'battle', player: { ...base.player, hand: [spell] } }
  assert.equal(canActivateCard(state, 'player', 880), false)
})

test('Im gegnerischen Zug kann der Spieler nicht beschwören', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const state = { ...base, turnOwner: 'jarvis', phase: 'main1' }
  assert.throws(() => summonMonster(state, state.player.hand[0].id), /nicht am Zug/)
  assert.equal(startJarvisTurn({ ...state, phase: 'end' }).jarvis.hand.length, state.jarvis.hand.length)
})

test('Beschwörungseffekte lösen einmal aus und nicht noch einmal von Hand', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const monster = {
    id: 770,
    name: 'Drawmon',
    type: 'Effect Monster',
    kind: 'monster',
    atk: 1000,
    def: 1000,
    level: 4,
    effect: { kind: 'draw', amount: 1 },
    effectTrigger: 'summon',
  }
  let state = { ...base, player: { ...base.player, hand: [monster, ...base.player.hand] } }
  const before = state.player.hand.length
  state = summonMonster(state, 770)
  assert.equal(state.player.hand.length, before)
  assert.equal(canActivateCard(state, 'player', 770), false)
})

test('Ein Boost fällt beim Verlassen des Feldes auf den Druckwert zurück', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const monster = { id: 771, name: 'Boost', type: 'Effect Monster', kind: 'monster', atk: 1800, def: 1000, level: 4, baseAtk: 1500, boost: 300, position: 'attack' }
  const foe = { id: 772, name: 'Wall', type: 'Effect Monster', kind: 'monster', atk: 3000, def: 3000, level: 4, position: 'attack' }
  let state = {
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [monster] },
    jarvis: { ...base.jarvis, monsters: [foe] },
  }
  state = attack(selectAttacker(state, 771), 772)
  const buried = state.player.graveyard.find((card) => card.id === 771)
  assert.equal(buried?.atk, 1500)
  assert.equal(buried?.boost, undefined)
})

test('Ultron verbraucht beim Beschwören nicht die Falle des Spielers', () => {
  const base = giveFirstTurn(createDuel(deck(40, 1000), deck(40, 1000), () => 0), 'jarvis')
  const monster = {
    id: 910,
    name: 'Drawmon',
    type: 'Effect Monster',
    kind: 'monster',
    atk: 2000,
    def: 1000,
    level: 4,
    effect: { kind: 'draw', amount: 1 },
    effectTrigger: 'summon',
  }
  const trap = {
    id: 911,
    name: 'Negate',
    type: 'Trap Card',
    kind: 'trap',
    subtype: 'Normal',
    effect: { kind: 'negate' },
    faceDown: true,
    lockedKey: -1,
  }
  let state = {
    ...base,
    phase: 'main1',
    turn: 2,
    jarvis: { ...base.jarvis, hand: [monster] },
    player: { ...base.player, spells: [trap] },
  }
  state = jarvisStep(state, null)
  assert.equal(state.player.spells.some((card) => card.id === 911), true)
  assert.equal(state.chain[0]?.controller, 'jarvis')
})

test('Extra-Deck-Monster wechseln im Beschwörungszug nicht die Position', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const materialA = { ...base.player.hand[0], id: 1, position: 'attack' }
  const materialB = { ...base.player.hand[1], id: 2, position: 'attack' }
  const fusion = {
    id: 800,
    name: 'Fusion',
    type: 'Fusion Monster',
    kind: 'monster',
    extraDeck: true,
    extraKind: 'fusion',
    atk: 2500,
    def: 2000,
    level: 6,
  }
  let state = {
    ...base,
    player: { ...base.player, monsters: [materialA, materialB], extraDeck: [fusion] },
  }
  state = summonExtraMonster(state, 800, [1, 2])
  assert.throws(() => changePosition(state, 800), /diesem Zug/)
})

test('G11–G15: Spell Speed 2 kann Kette beitreten', () => {
  const trap = {
    id: 501,
    name: 'Trap',
    type: 'Trap Card',
    kind: 'trap',
    subtype: 'Normal',
    effect: { kind: 'negate' },
    faceDown: true,
    lockedKey: -1,
  }
  const spell = {
    id: 502,
    name: 'Bolt',
    type: 'Spell Card',
    kind: 'spell',
    effect: { kind: 'damage', amount: 500 },
  }
  assert.equal(spellSpeedForCard(trap), 2)
  assert.equal(spellSpeedForCard(spell), 1)
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  let state = {
    ...base,
    phase: 'main1',
    player: { ...base.player, hand: [spell], spells: [] },
    jarvis: { ...base.jarvis, spells: [trap] },
    chain: [{ id: 1, controller: 'player', card: spell, effect: spell.effect, negated: false, spellSpeed: 1 }],
    chainPriority: 'jarvis',
    chainPasses: 0,
    turnOwner: 'player',
  }
  state = activateDuelEffect(state, 'jarvis', trap.id)
  assert.equal(state.chain.length, 2)
  assert.equal(state.chain[1].spellSpeed, 2)
})

test('G16–G20: Extra-Beschwörung respektiert Zonenlimit', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const fusion = {
    id: 800,
    name: 'Fusion',
    type: 'Fusion Monster',
    kind: 'monster',
    extraDeck: true,
    extraKind: 'fusion',
    level: 8,
    atk: 3000,
  }
  const m1 = { ...base.player.hand[0], id: 801 }
  const m2 = { ...base.player.hand[1], id: 802 }
  const state = {
    ...base,
    player: {
      ...base.player,
      monsters: [m1, m2],
      extraDeck: [fusion],
    },
  }
  const next = summonExtraMonster(state, fusion.id, [801, 802])
  assert.equal(next.player.monsters.length, 1)
  assert.equal(next.player.monsters[0].id, fusion.id)
})

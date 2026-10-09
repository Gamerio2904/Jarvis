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
} from '../src/engine/yugioh-duel.ts'
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

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceDuelPhase,
  discardForHandLimit,
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
  effectFromDescription,
  startJarvisTurn,
} from '../src/engine/yugioh-duel.ts'
import { jarvisStep } from '../src/engine/yugioh-net.ts'
import { extraSummonZone, linkedOwnZones, registerLinkArrows, spellSpeedForCard } from '../src/engine/yugioh-zones.ts'

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

test('G1–G5: Link öffnet keine sechste Hauptzone', () => {
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
  assert.deepEqual(registerLinkArrows(link), [3, 5])
  assert.equal(monsterZoneCapacity([link]), 5)
  assert.equal(monsterZoneCapacity([{ ...link, zoneKind: 'emz' }]), 6)
})

test('End Phase: Handlimit 6 wartet auf eine Auswahl', () => {
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const hand = Array.from({ length: 7 }, (_, index) => ({
    ...base.player.hand[0],
    id: 500 + index,
    name: `Karte ${index + 1}`,
    atk: index * 100,
  }))
  const end = advanceDuelPhase({ ...base, phase: 'main2', player: { ...base.player, hand } })
  assert.equal(end.phase, 'end')
  assert.equal(end.discardNeeded, 1)
  assert.throws(() => advanceDuelPhase(end), /Handlimit/)
  assert.throws(() => startJarvisTurn(end), /Handlimit/)
  const picked = discardForHandLimit(end, 500)
  assert.equal(picked.discardNeeded, 0)
  assert.equal(picked.player.hand.length, 6)
  assert.equal(picked.player.graveyard.some((card) => card.id === 500), true)
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
  assert.equal(next.player.monsters[0].zoneKind, 'emz')
})

test('Link-Pfeile öffnen nur die getroffenen Hauptspalten', () => {
  const link = {
    id: 1,
    name: 'Pfeil',
    type: 'Link Monster',
    kind: 'monster',
    extraDeck: true,
    extraKind: 'link',
    linkRating: 3,
    atk: 2000,
    zoneKind: 'emz',
    zoneIndex: 0,
    linkArrows: [3, 4, 5],
  }
  assert.deepEqual(linkedOwnZones(link).map((zone) => zone.zoneIndex), [0, 1, 2])
  const blocker = { id: 2, name: 'Sperre', type: 'Fusion Monster', kind: 'monster', extraDeck: true, extraKind: 'fusion', atk: 1000, zoneKind: 'emz', zoneIndex: 1 }
  const materialA = { id: 3, name: 'A', type: 'Effect Monster', kind: 'monster', atk: 1000, level: 4, zoneKind: 'mmz', zoneIndex: 3 }
  const materialB = { id: 4, name: 'B', type: 'Effect Monster', kind: 'monster', atk: 1000, level: 4, zoneKind: 'mmz', zoneIndex: 4 }
  const fusion = { id: 800, name: 'Fusion', type: 'Fusion Monster', kind: 'monster', extraDeck: true, extraKind: 'fusion', atk: 2500, level: 6 }
  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const opened = summonExtraMonster({
    ...base,
    player: { ...base.player, monsters: [link, blocker, materialA, materialB], extraDeck: [fusion] },
  }, 800, [3, 4])
  const summoned = opened.player.monsters.find((card) => card.id === 800)
  assert.equal(summoned?.zoneKind, 'mmz')
  assert.equal(summoned?.zoneIndex, 0)
  const closed = {
    ...link,
    linkArrows: [0],
  }
  assert.equal(extraSummonZone([closed, blocker, materialA, materialB], [3, 4]), null)
  assert.throws(() => summonExtraMonster({
    ...base,
    player: { ...base.player, monsters: [closed, blocker, materialA, materialB], extraDeck: [fusion] },
  }, 800, [3, 4]), /voll/)
})

function resolve(state, cardId) {
  return passDuelChain(activateDuelEffect(state, 'player', cardId), 'player')
}

test('Beschwörung, Dauerregeln, Spielmarken und Token haben einen Effekt', () => {
  const parsed = effectFromDescription('Cannot be Normal Summoned/Set. You can Special Summon this card (from your hand) by discarding 1 card.')
  assert.equal(parsed?.effect.kind, 'summonHand')
  assert.deepEqual(parsed?.rules, ['cannotNormal'])
  assert.equal(effectFromDescription('This card can attack your opponent directly, and inflict piercing battle damage.')?.effect.kind, 'rule')
  assert.equal(effectFromDescription('Special Summon 2 "Sheep Tokens" (Beast/ATK 0/DEF 0).')?.effect.kind, 'token')
  assert.deepEqual(effectFromDescription('You can remove 2 Spell Counters from this card; draw 1 card.')?.effect, { kind: 'counter', amount: 2, mode: 'remove', then: 'draw' })
  assert.equal(effectFromDescription('This card gains 300 ATK for each monster this card points to.')?.effect.kind, 'pointBoost')
  assert.equal(effectFromDescription('Once per turn, you can shuffle your hand.'), null)
  assert.deepEqual(effectFromDescription('This card gains 500 ATK.')?.effect, { kind: 'boost', amount: 500 })

  const base = enterMain1(createDuel(deck(), deck(), () => 0))
  const special = {
    id: 50,
    name: 'Sonder',
    type: 'Effect Monster',
    kind: 'monster',
    atk: 1800,
    def: 1000,
    level: 4,
    effect: parsed.effect,
    rules: parsed.rules,
    effectSummary: parsed.summary,
  }
  const fodder = { ...base.player.hand[0], id: 51, name: 'Futter' }
  let state = { ...base, player: { ...base.player, hand: [special, fodder] } }
  assert.throws(() => summonMonster(state, 50), /normalbeschworen/)
  state = resolve(state, 50)
  assert.equal(state.player.monsters.some((card) => card.id === 50), true)
  assert.equal(state.player.normalSummonUsed, false)
  assert.equal(state.player.hand.some((card) => card.id === 51), false)

  const negated = effectFromDescription('You can Special Summon this card (from your hand).')
  const cyber = { ...special, id: 60, name: 'Cyber', effect: negated.effect, rules: undefined }
  const negate = { id: 61, name: 'Nein', type: 'Spell Card', kind: 'spell', effect: { kind: 'negate' } }
  const denied = resolve({
    ...base,
    player: { ...base.player, hand: [cyber] },
    jarvis: { ...base.jarvis, hand: [negate] },
  }, 60)
  assert.equal(denied.player.monsters.some((card) => card.id === 60), false)
  assert.equal(denied.player.graveyard.some((card) => card.id === 60), true)

  const piercer = { id: 70, name: 'Stich', type: 'Effect Monster', kind: 'monster', atk: 2000, def: 0, level: 4, position: 'attack', zoneKind: 'mmz', zoneIndex: 0, rules: ['piercing'] }
  const wall = { id: 71, name: 'Wand', type: 'Effect Monster', kind: 'monster', atk: 0, def: 1000, level: 4, position: 'defense', zoneKind: 'mmz', zoneIndex: 0 }
  const pierced = attack(selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [piercer] },
    jarvis: { ...base.jarvis, monsters: [wall] },
  }, 70), 71)
  assert.equal(pierced.jarvis.lp, 7000)
  assert.equal(pierced.jarvis.monsters.length, 0)

  const direct = { ...piercer, id: 72, name: 'Direkt', rules: ['direct'], atk: 1500 }
  const guard = { ...wall, id: 73, position: 'attack', atk: 3000 }
  const rushed = attack(selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [direct] },
    jarvis: { ...base.jarvis, monsters: [guard] },
  }, 72))
  assert.equal(rushed.jarvis.lp, 6500)
  assert.equal(rushed.jarvis.monsters.length, 1)

  const statue = { ...piercer, id: 74, name: 'Standbild', rules: ['cannotAttack'] }
  assert.throws(() => selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [statue] },
  }, 74), /nicht angreifen/)

  const proof = { ...wall, id: 75, rules: ['battleProof'], position: 'attack', atk: 1000 }
  const traded = attack(selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [{ ...piercer, rules: [] }] },
    jarvis: { ...base.jarvis, monsters: [proof] },
  }, 70), 75)
  assert.equal(traded.jarvis.monsters.some((card) => card.id === 75), true)

  const immune = { ...wall, id: 76, rules: ['effectProof'], position: 'attack', atk: 500 }
  const bolt = { id: 77, name: 'Blitz', type: 'Spell Card', kind: 'spell', effect: { kind: 'destroy', target: 'monster' } }
  const spared = resolve({
    ...base,
    player: { ...base.player, hand: [bolt] },
    jarvis: { ...base.jarvis, monsters: [immune] },
  }, 77)
  assert.equal(spared.jarvis.monsters.some((card) => card.id === 76), true)

  const hidden = { ...immune, id: 78, rules: ['untargetable'] }
  const mass = { ...bolt, id: 79, effect: { kind: 'destroy', target: 'allMonsters' } }
  const skipped = resolve({
    ...base,
    player: { ...base.player, hand: [bolt] },
    jarvis: { ...base.jarvis, monsters: [hidden] },
  }, 77)
  assert.equal(skipped.jarvis.monsters.some((card) => card.id === 78), true)
  const wiped = resolve({
    ...base,
    player: { ...base.player, hand: [mass] },
    jarvis: { ...base.jarvis, monsters: [hidden] },
  }, 79)
  assert.equal(wiped.jarvis.monsters.length, 0)

  const marker = {
    id: 80,
    name: 'Marken',
    type: 'Spell Card',
    kind: 'spell',
    subtype: 'Continuous',
    effect: { kind: 'rule', rule: 'spellCounter' },
    rules: ['spellCounter'],
  }
  const spark = { id: 77, name: 'Funke', type: 'Spell Card', kind: 'spell', effect: { kind: 'draw', amount: 1 } }
  const placed = resolve({ ...base, player: { ...base.player, hand: [marker, spark] } }, 80)
  assert.equal(placed.player.spells.find((card) => card.id === 80)?.counters, 1)
  const grown = resolve(placed, 77)
  assert.equal(grown.player.spells.find((card) => card.id === 80)?.counters, 2)

  const bank = {
    id: 81,
    name: 'Bank',
    type: 'Spell Card',
    kind: 'spell',
    subtype: 'Continuous',
    counters: 2,
    effect: { kind: 'counter', amount: 2, mode: 'remove', then: 'draw' },
  }
  const before = base.player.hand.length
  const drawn = resolve({ ...base, player: { ...base.player, spells: [bank], hand: base.player.hand } }, 81)
  assert.equal(drawn.player.spells.find((card) => card.id === 81)?.counters, 0)
  assert.equal(drawn.player.hand.length, before + 1)
  assert.throws(() => activateDuelEffect(drawn, 'player', 81), /Spielmarken/)

  const herd = { id: 82, name: 'Herde', type: 'Spell Card', kind: 'spell', effect: { kind: 'token', amount: 2, atk: 0, def: 0, name: 'Sheep Token' } }
  const field = resolve({ ...base, player: { ...base.player, hand: [herd] } }, 82)
  const tokens = field.player.monsters.filter((card) => card.token)
  assert.equal(tokens.length, 2)
  assert.deepEqual(tokens.map((card) => card.zoneIndex), [0, 1])
  const hunter = { ...piercer, id: 83, atk: 100, rules: [] }
  const cleared = attack(selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [hunter] },
    jarvis: { ...base.jarvis, monsters: [tokens[0]] },
  }, 83), tokens[0].id)
  assert.equal(cleared.jarvis.monsters.length, 0)
  assert.equal(cleared.jarvis.graveyard.some((card) => card.token), false)

  const pointer = {
    id: 84,
    name: 'Zeiger',
    type: 'Link Monster',
    kind: 'monster',
    extraKind: 'link',
    atk: 1000,
    baseAtk: 1000,
    position: 'attack',
    zoneKind: 'emz',
    zoneIndex: 0,
    linkArrows: [4],
    effect: { kind: 'pointBoost', amount: 300 },
  }
  const ally = { id: 85, name: 'Nachbar', type: 'Effect Monster', kind: 'monster', atk: 500, def: 500, position: 'attack', zoneKind: 'mmz', zoneIndex: 1 }
  const aimed = attack(selectAttacker({
    ...base,
    phase: 'battle',
    turn: 2,
    player: { ...base.player, monsters: [pointer, ally] },
    jarvis: { ...base.jarvis, monsters: [] },
  }, 84))
  assert.equal(aimed.jarvis.lp, 6700)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceDuelPhase,
  activateDuelEffect,
  attack,
  averageModelWeights,
  createDuel,
  DUEL_SOUP_WEIGHTS,
  duelStateVector,
  DUEL_STRATEGIES,
  effectFromDescription,
  passDuelChain,
  selectAttacker,
  summonExtraMonster,
  summonMonster,
} from '../src/engine/yugioh-duel.ts'
import { isYugiohDuelTrigger } from '../src/engine/yugioh-parse.ts'
import { evaluateDuelPolicy, trainDuelPolicy } from '../src/engine/yugioh-training.ts'

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

function enterMainPhase(state) {
  return advanceDuelPhase(advanceDuelPhase(state))
}

test('Model Soup bildet alle drei Strategie-Branches gleichgewichtet ab', () => {
  const weights = averageModelWeights(DUEL_STRATEGIES)
  assert.equal(weights.damage, 1.2)
  assert.equal(weights.board, 1.1)
  assert.equal(weights.resources, 1.0666666666666667)
  assert.throws(() => averageModelWeights([]), /Mindestens ein Modell/)
  assert.throws(
    () => averageModelWeights([{ ...DUEL_STRATEGIES[0], combo: Number.NaN }]),
    /endlich und vollständig/,
  )
})

test('der Sprachtrigger erkennt die vereinbarte Herausforderung, aber keine ähnlichen Sätze', () => {
  assert.equal(isYugiohDuelTrigger('Jarvis, ich fordere dich zu einem Duell heraus.'), true)
  assert.equal(isYugiohDuelTrigger('Ich fordere dich zu einem Duell heraus'), true)
  assert.equal(isYugiohDuelTrigger('Jarvis, ich fordere dich zum Duell heraus.'), false)
})

test('Start zieht fünf Karten und vektorisiert den Spielzustand', () => {
  const state = createDuel(deck(), deck(), () => 0)
  assert.equal(state.player.lp, 8000)
  assert.equal(state.jarvis.lp, 8000)
  assert.equal(state.player.hand.length, 5)
  assert.equal(state.player.deck.length, 35)
  assert.equal(duelStateVector(state).length, 14)
  assert.throws(() => createDuel(deck(39), deck()), /40 bis 60/)
})

test('Phasen laufen in Reihenfolge und Main Phase erlaubt eine Normalbeschwörung', () => {
  let state = enterMainPhase(createDuel(deck(), deck(), () => 0))
  assert.equal(state.phase, 'main1')
  const monster = state.player.hand[0]
  state = summonMonster(state, monster.id)
  assert.equal(state.player.monsters[0].id, monster.id)
  assert.equal(state.player.normalSummonUsed, true)
  assert.throws(() => summonMonster(state, state.player.hand[0].id), /bereits normalbeschworen/)
})

test('Tributpflicht wird vor dem Beschwören geprüft', () => {
  const state = enterMainPhase(createDuel(deck(), deck(), () => 0))
  const highLevel = { ...state.player.hand[0], level: 7 }
  const withHighLevel = { ...state, player: { ...state.player, hand: [highLevel, ...state.player.hand.slice(1)] } }
  assert.throws(() => summonMonster(withHighLevel, highLevel.id), /brauchst du 2 Tribut/)
})

test('Battle berechnet Kampfschaden, zerstört das schwächere Monster und verhindert Doppelangriff', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const playerMonster = { ...base.player.hand[0], id: 700, atk: 2500 }
  const jarvisMonster = { ...base.jarvis.hand[0], id: 800, atk: 1500 }
  const state = {
    ...base,
    phase: 'battle',
    player: { ...base.player, monsters: [playerMonster] },
    jarvis: { ...base.jarvis, monsters: [jarvisMonster] },
  }
  const selected = selectAttacker(state, playerMonster.id)
  const result = attack(selected, jarvisMonster.id)
  assert.equal(result.jarvis.lp, 7000)
  assert.deepEqual(result.jarvis.monsters, [])
  assert.deepEqual(result.jarvis.graveyard.map((card) => card.id), [jarvisMonster.id])
  assert.throws(() => attack({ ...result, selectedAttacker: playerMonster.id }, jarvisMonster.id), /bereits angegriffen/)
})

test('End Phase führt Jarvis-Zug, Zugwechsel und Kartenziehen aus', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const state = { ...base, phase: 'end' }
  const result = advanceDuelPhase(state)
  assert.equal(result.turn, 2)
  assert.equal(result.phase, 'draw')
  assert.equal(result.player.hand.length, 6)
  assert.equal(result.player.deck.length, 34)
  assert.equal(result.player.normalSummonUsed, false)
})

test('Jarvis verwendet die im Duell gespeicherten trainierten Policy-Gewichte', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const sturdy = { ...base.jarvis.hand[0], id: 930, atk: 1200, def: 3000 }
  const attacker = { ...base.jarvis.hand[1], id: 931, atk: 2500, def: 500 }
  const state = {
    ...base,
    phase: 'end',
    jarvisWeights: { damage: -4, board: 0, resources: 0, safety: 4, combo: 0 },
    jarvis: { ...base.jarvis, hand: [sturdy, attacker] },
  }
  const result = advanceDuelPhase(state)
  assert.equal(result.jarvis.monsters[0].id, sturdy.id)
})

test('leeres Deck beendet das Duell erst beim fälligen Ziehen', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const playerDrawOut = advanceDuelPhase({
    ...base,
    phase: 'end',
    player: { ...base.player, deck: [] },
  })
  assert.equal(playerDrawOut.winner, 'jarvis')

  const jarvisDrawOut = advanceDuelPhase({
    ...base,
    phase: 'end',
    jarvis: { ...base.jarvis, deck: [] },
  })
  assert.equal(jarvisDrawOut.winner, 'player')
})

test('beschränkte Kartentext-Auswertung erkennt nur unterstützte Effektformen', () => {
  assert.deepEqual(effectFromDescription('You can draw 2 cards.'), {
    effect: { kind: 'draw', amount: 2 },
    summary: 'Zieht 2 Karte(n).',
  })
  assert.equal(effectFromDescription('This card gains 300 ATK.'), null)
  assert.deepEqual(effectFromDescription('Negate the activation of a card.'), {
    effect: { kind: 'negate' },
    summary: 'Negiert das vorherige Kettenglied (vereinfachte Regel).',
  })
})

test('Effektketten lösen LIFO auf und eine Negation verhindert den unteren Effekt', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const damageCard = {
    ...base.player.hand[0],
    id: 900,
    kind: 'spell',
    effect: { kind: 'damage', amount: 500 },
    effectSummary: '500 Schaden',
  }
  const negateCard = {
    ...base.jarvis.hand[0],
    id: 901,
    kind: 'spell',
    effect: { kind: 'negate' },
    effectSummary: 'Negiert',
  }
  const state = {
    ...base,
    phase: 'main1',
    player: { ...base.player, hand: [damageCard] },
    jarvis: { ...base.jarvis, hand: [negateCard] },
  }
  const chain = activateDuelEffect(state, 'player', damageCard.id)
  assert.equal(chain.chain.length, 2)
  assert.equal(chain.chainPriority, 'player')
  const resolved = passDuelChain(chain, 'player')
  assert.equal(resolved.jarvis.lp, 8000)
  assert.equal(resolved.chain.length, 0)
  assert.ok(resolved.player.graveyard.some((card) => card.id === damageCard.id))
  assert.ok(resolved.jarvis.graveyard.some((card) => card.id === negateCard.id))
})

test('Extra-Deck-Synchro verlangt Empfänger plus passende Gesamtstufe', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const tuner = { ...base.player.hand[0], id: 910, level: 3, tuner: true }
  const nonTuner = { ...base.player.hand[1], id: 911, level: 2, tuner: false }
  const synchro = {
    ...base.player.hand[2],
    id: 912,
    extraDeck: true,
    extraKind: 'synchro',
    level: 5,
  }
  const state = {
    ...base,
    phase: 'main1',
    player: {
      ...base.player,
      monsters: [tuner, nonTuner],
      extraDeck: [synchro],
    },
  }
  const result = summonExtraMonster(state, synchro.id, [tuner.id, nonTuner.id])
  assert.deepEqual(result.player.monsters.map((card) => card.id), [synchro.id])
  assert.deepEqual(result.player.graveyard.map((card) => card.id), [tuner.id, nonTuner.id])
  assert.throws(() => summonExtraMonster(state, synchro.id, [nonTuner.id]), /Empfänger/)
})

test('Fusion, Xyz und Link akzeptieren nur die vereinfachten gültigen Materialgruppen', () => {
  const base = createDuel(deck(), deck(), () => 0)
  const first = { ...base.player.hand[0], id: 920, level: 4, tuner: false }
  const second = { ...base.player.hand[1], id: 921, level: 4, tuner: false }
  const cards = [
    { ...base.player.hand[2], id: 922, extraDeck: true, extraKind: 'fusion' },
    { ...base.player.hand[3], id: 923, extraDeck: true, extraKind: 'xyz', level: 4 },
    { ...base.player.hand[4], id: 924, extraDeck: true, extraKind: 'link', linkRating: 2 },
  ]
  for (const card of cards) {
    const state = {
      ...base,
      phase: 'main1',
      player: { ...base.player, monsters: [first, second], extraDeck: [card] },
    }
    const result = summonExtraMonster(state, card.id, [first.id, second.id])
    assert.deepEqual(result.player.monsters.map((monster) => monster.id), [card.id])
  }
  assert.throws(() => {
    const wrongLevel = { ...second, level: 3 }
    const state = {
      ...base,
      phase: 'main1',
      player: { ...base.player, monsters: [first, wrongLevel], extraDeck: [cards[1]] },
    }
    return summonExtraMonster(state, cards[1].id, [first.id, wrongLevel.id])
  }, /Stufe 4/)
})

test('Policy-Gradient-Training und Holdout-Winrate sind reproduzierbar und begrenzt', () => {
  const trained = trainDuelPolicy(DUEL_STRATEGIES[0], 8, 12345)
  const again = trainDuelPolicy(DUEL_STRATEGIES[0], 8, 12345)
  assert.equal(trained.episodes, 8)
  assert.equal(trained.wins + trained.losses + trained.draws, 8)
  assert.deepEqual(trained.weights, again.weights)
  const evaluation = evaluateDuelPolicy(trained.weights, 10, 456)
  assert.equal(evaluation.games, 10)
  assert.equal(evaluation.wins + evaluation.losses + evaluation.draws, 10)
  assert.ok(evaluation.winRate >= 0 && evaluation.winRate <= 1)
  assert.throws(() => trainDuelPolicy(DUEL_STRATEGIES[0], 0), /1 und 5000/)
})

test('das Trainingsbudget verbessert die gemessene Winrate auf festem Holdout gegenüber Soup-Baseline', () => {
  const trained = trainDuelPolicy(undefined, 500, 12345, 0.25)
  const holdout = evaluateDuelPolicy(trained.weights, 300, 918273)
  const baseline = evaluateDuelPolicy(DUEL_SOUP_WEIGHTS, 300, 918273)
  assert.ok(holdout.winRate > baseline.winRate, `${holdout.winRate} should exceed baseline ${baseline.winRate}`)
})

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
import { EVALUATION_ARCHETYPES, generateDeck, TRAINING_ARCHETYPES } from '../src/engine/yugioh-decks.ts'
import {
  averageNetModels,
  candidateActions,
  createNetModel,
  evaluatePolicy,
  FEATURE_COUNT,
  greedyNetPolicy,
  heuristicPolicy,
  randomPolicy,
  seededRandom,
  trainNetPolicy,
  trainNetSoup,
  validateNetModel,
} from '../src/engine/yugioh-net.ts'

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
  assert.equal(isYugiohDuelTrigger('ich fordere dich zu einem duel auf'), true)
  assert.equal(isYugiohDuelTrigger('Wie wird das Wetter'), false)
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

test('Deck-Generator liefert regelkonforme, wechselnde Decks; burn bleibt dem Training fremd', () => {
  assert.ok(!TRAINING_ARCHETYPES.includes('burn'))
  assert.ok(EVALUATION_ARCHETYPES.includes('burn'))
  for (const archetype of EVALUATION_ARCHETYPES) {
    const first = generateDeck(archetype, seededRandom(1))
    const second = generateDeck(archetype, seededRandom(2))
    assert.ok(first.main.length >= 40 && first.main.length <= 60, archetype)
    assert.ok(first.extra.length >= 2 && first.extra.length <= 15)
    assert.equal(new Set(first.main.map((card) => card.id)).size, first.main.length)
    assert.deepEqual(first, generateDeck(archetype, seededRandom(1)))
    assert.notDeepEqual(first.main.map((card) => card.atk), second.main.map((card) => card.atk))
  }
  const effects = new Set(generateDeck('balanced', seededRandom(5)).main.map((card) => card.effect?.kind).filter(Boolean))
  assert.ok(effects.size >= 3)
})

test('Aktionsmerkmale decken Handkarten, Effekte, Ketten und Extra Deck ab und erzeugen nur gültige Züge', () => {
  const seen = new Set()
  for (const [seed, own, other] of [[11, 'combo', 'control'], [12, 'aggro', 'aggro'], [13, 'balanced', 'combo'], [14, 'control', 'aggro']]) {
  const random = seededRandom(seed)
  const mine = generateDeck(own, random)
  const theirs = generateDeck(other, random)
  let state = createDuel(mine.main, theirs.main, random, mine.extra, theirs.extra)
  for (let step = 0; step < 400 && !state.winner; step += 1) {
    if (!state.chain.length && ['draw', 'standby', 'end'].includes(state.phase)) {
      state = advanceDuelPhase(state)
      continue
    }
    const actions = candidateActions(state)
    for (const action of actions) {
      seen.add(action.kind)
      assert.equal(action.features.length, FEATURE_COUNT)
      assert.ok(action.features.every(Number.isFinite))
    }
    const choice = actions[random() < 0.2 ? Math.floor(random() * actions.length) : heuristicPolicy(actions, random)]
    if (choice.kind === 'summon') state = summonMonster(state, choice.cardId, choice.tributes)
    else if (choice.kind === 'extra') state = summonExtraMonster(state, choice.cardId, choice.materials)
    else if (choice.kind === 'effect') state = activateDuelEffect(state, 'player', choice.cardId)
    else if (choice.kind === 'direct') state = attack(selectAttacker(state, choice.cardId))
    else if (choice.kind === 'attack') state = attack(selectAttacker(state, choice.cardId), choice.targetId)
    else state = state.chain.length ? passDuelChain(state, 'player') : advanceDuelPhase(state)
  }
  }
  for (const kind of ['summon', 'effect', 'attack', 'pass', 'extra']) assert.ok(seen.has(kind), kind)
  assert.equal(evaluatePolicy(randomPolicy, 60, 3).invalidActions, 0)
})

test('Netzwerkmodell prüft Architektur, Gewichte und mittelt nur gleiche Formen', () => {
  const a = createNetModel(8, 1)
  const b = createNetModel(8, 2)
  const mean = averageNetModels([a, b])
  assert.equal(mean.params[3], (a.params[3] + b.params[3]) / 2)
  assert.throws(() => averageNetModels([a, createNetModel(4, 1)]), /Architektur/)
  assert.throws(() => validateNetModel({ ...a, params: a.params.slice(1) }), /unvollständig/)
  assert.throws(() => validateNetModel({ ...a, params: a.params.map(() => Number.NaN) }), /nicht endlich/)
  assert.throws(() => createNetModel(999), /Hidden/)
  assert.throws(() => trainNetPolicy({ episodes: 0 }), /1 und 20000/)
})

test('Netz-Training ist reproduzierbar und schlägt Zufall auf frischen Holdout-Decks inkl. unbekanntem Archetyp', () => {
  const first = trainNetPolicy({ hidden: 16, episodes: 40, seed: 5, validationGames: 20 })
  const again = trainNetPolicy({ hidden: 16, episodes: 40, seed: 5, validationGames: 20 })
  assert.deepEqual(first.model, again.model)
  const trained = trainNetPolicy({ hidden: 16, episodes: 3000, seed: 7, batch: 8, learningRate: 0.02, validationGames: 60 })
  const net = evaluatePolicy(greedyNetPolicy(trained.model), 300, 918273)
  const random = evaluatePolicy(randomPolicy, 300, 918273)
  const heuristic = evaluatePolicy(heuristicPolicy, 300, 918273)
  assert.equal(net.invalidActions, 0)
  assert.ok(net.winRate > random.winRate + 0.1, `${net.winRate} vs random ${random.winRate}`)
  assert.ok(net.byOpponent.burn.games > 0 && net.byOpponent.burn.winRate > random.byOpponent.burn.winRate)
  assert.ok(net.winRate > heuristic.winRate - 0.08, `${net.winRate} vs heuristic ${heuristic.winRate}`)
})

test('Model Soup über Spezialisten-Netze nimmt nur Zweige auf, die die Validierung nicht verschlechtern', () => {
  const result = trainNetSoup({ seed: 3, baseEpisodes: 60, specialistEpisodes: 40, validationGames: 20 })
  assert.equal(result.specialists.length, 3)
  assert.ok(result.included.length >= 1 && result.included.length <= 3)
  validateNetModel(result.soup)
  assert.ok(result.soupValidation >= Math.min(...result.specialists.map((entry) => entry.validation)))
})

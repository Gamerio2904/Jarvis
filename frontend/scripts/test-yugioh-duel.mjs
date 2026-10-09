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
  runNetJarvisTurn,
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
    turn: 2,
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
  assert.equal(effectFromDescription('Once per turn, you can shuffle your hand.'), null)
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

test('Das Netz steuert Jarvis im echten Duell: gültiger Zug, Zugwechsel, nie die Spielerkarten verändert', () => {
  const model = trainNetPolicy({ hidden: 16, episodes: 300, seed: 7, validationGames: 20 }).model
  for (let seed = 1; seed <= 20; seed += 1) {
    const random = seededRandom(seed)
    const mine = generateDeck('balanced', random)
    const theirs = generateDeck(EVALUATION_ARCHETYPES[seed % 5], random)
    let state = createDuel(mine.main, theirs.main, random, mine.extra, theirs.extra)
    state = { ...state, phase: 'end' }
    const handBefore = state.player.hand.length
    const next = runNetJarvisTurn(state, model)
    assert.equal(next.turn, state.turn + 1)
    if (!next.winner) {
      assert.equal(next.phase, 'draw')
      assert.equal(next.player.deck.length, state.player.deck.length - 1, 'Spieler zieht genau eine Karte')
      assert.ok(next.player.hand.length <= handBefore + 1)
      assert.equal(next.jarvis.hand.length + next.jarvis.monsters.length + next.jarvis.graveyard.length + next.jarvis.spells.length + next.jarvis.deck.length + next.jarvis.extraDeck.length,
        state.jarvis.hand.length + state.jarvis.deck.length + state.jarvis.extraDeck.length, 'keine Jarvis-Karte geht verloren')
    }
  }
  assert.throws(() => runNetJarvisTurn(createDuel(deck(), deck()), { inputs: 1, hidden: 0, params: [] }), /Architektur/)
})

test('Echte Structure Decks: gültige Größen, Ultron-Pool mit 25 Decks, Zufallswahl variiert', async () => {
  const { REAL_DECK_LIST, ULTRON_DECK_POOL, buildRealDeck, pickUltronDeck } = await import('../src/engine/yugioh-deck-library.ts')
  assert.ok(REAL_DECK_LIST.length >= 40)
  assert.equal(ULTRON_DECK_POOL.length, 25)
  let id = 1
  const seen = new Set()
  for (const real of REAL_DECK_LIST) {
    const { main, extra } = buildRealDeck(real, () => id++)
    assert.ok(main.length >= 40 && main.length <= 60, `${real.title}: Main ${main.length}`)
    assert.ok(extra.length <= 15, `${real.title}: Extra ${extra.length}`)
    for (const card of [...main, ...extra]) {
      assert.ok(card.name && card.catalogId, `${real.title}: Karte unvollständig`)
      assert.ok(!seen.has(card.id), 'Kopie-IDs sind eindeutig')
      seen.add(card.id)
    }
  }
  const stream = seededRandom(11)
  const picks = new Set(Array.from({ length: 200 }, () => pickUltronDeck(stream).id))
  assert.ok(picks.size > 10)
  const mine = buildRealDeck(REAL_DECK_LIST[0], () => id++)
  const theirs = buildRealDeck(pickUltronDeck(seededRandom(3)), () => id++)
  const model = trainNetPolicy({ hidden: 16, episodes: 100, seed: 7, validationGames: 10 }).model
  let state = createDuel(mine.main, theirs.main, seededRandom(5), mine.extra, theirs.extra)
  state = runNetJarvisTurn({ ...state, phase: 'end' }, model)
  assert.equal(state.turn, 2)
})

const engine = await import('../src/engine/yugioh-duel.ts')
const netEngine = await import('../src/engine/yugioh-net.ts')

function spellCard(id, effect, extra = {}) {
  return { id, name: `Karte ${id}`, type: 'Spell Card', kind: 'spell', effect, effectSummary: effect.kind, ...extra }
}

function duelWith(playerPatch = {}, jarvisPatch = {}, patch = {}) {
  const base = createDuel(deck(), deck(), () => 0)
  return { ...base, phase: 'main1', player: { ...base.player, ...playerPatch }, jarvis: { ...base.jarvis, ...jarvisPatch }, ...patch }
}

test('neue Effekttypen werden aus Kartentext erkannt', () => {
  assert.equal(effectFromDescription('Negate the attack and inflict damage to your opponent.')?.effect.kind, 'negateAttack')
  assert.deepEqual(effectFromDescription('Destroy all Attack Position monsters your opponent controls.')?.effect, { kind: 'destroy', target: 'attackMonsters' })
  assert.deepEqual(effectFromDescription('Destroy all monsters your opponent controls.')?.effect, { kind: 'destroy', target: 'allMonsters' })
  assert.deepEqual(effectFromDescription('Destroy 1 Spell/Trap on the field.')?.effect, { kind: 'destroy', target: 'spelltrap' })
  assert.equal(effectFromDescription('Add 1 "Blue-Eyes" monster from your Deck to your hand.')?.effect.kind, 'search')
  assert.equal(effectFromDescription('Special Summon 1 monster from your GY.')?.effect.kind, 'revive')
  assert.deepEqual(effectFromDescription('This card gains 500 ATK.')?.effect, { kind: 'boost', amount: 500 })
})

test('Monster verdeckt in Verteidigung setzen, Verteidigung greift nicht an, Kampf gegen DEF verursacht keinen Schaden', () => {
  let state = duelWith()
  const card = state.player.hand.find((item) => item.kind === 'monster')
  state = summonMonster(state, card.id, [], 'set')
  const placed = state.player.monsters[0]
  assert.equal(placed.faceDown, true)
  assert.equal(placed.position, 'defense')
  assert.throws(() => changePos(state, placed.id), /bereits/)
  state = { ...state, turn: 2, phase: 'battle' }
  assert.throws(() => selectAttacker(state, placed.id), /Verteidigung/)
  const attackerCard = { ...deck(1, 2500)[0], id: 700, position: 'attack', faceDown: false }
  const defender = { ...deck(1, 1000)[0], id: 701, def: 2000, position: 'defense', faceDown: true }
  const fight = { ...state, turn: 2, player: { ...state.player, monsters: [attackerCard] }, jarvis: { ...state.jarvis, monsters: [defender], spells: [] } }
  const result = attack(selectAttacker(fight, 700), 701)
  assert.equal(result.jarvis.lp, 8000, 'kein Schaden gegen DEF-Position')
  assert.equal(result.jarvis.graveyard.some((c) => c.id === 701), true)
  const weak = { ...attackerCard, atk: 1500 }
  const bounce = attack(selectAttacker({ ...fight, player: { ...fight.player, monsters: [weak] } }, 700), 701)
  assert.equal(bounce.player.lp, 7500)
  assert.equal(bounce.jarvis.monsters[0].faceDown, false, 'Angriff deckt das Monster auf')
})

function changePos(state, id) {
  return engine.changePosition(state, id)
}

test('Zauber/Fallen: Setzen, Aktivierungsprüfung und aufleuchtende Karten', () => {
  const trap = spellCard(800, { kind: 'damage', amount: 500 }, { kind: 'trap', type: 'Trap Card' })
  const spell = spellCard(801, { kind: 'draw', amount: 1 })
  let state = duelWith({ hand: [trap, spell] })
  assert.equal(engine.canActivateCard(state, 'player', 801), true)
  assert.equal(engine.canActivateCard(state, 'player', 800), false, 'Fallen nicht aus der Hand')
  state = engine.setSpellTrap(state, 800)
  assert.equal(state.player.spells[0].faceDown, true)
  assert.match(engine.checkActivation(state, 'player', 800), /in diesem Zug gesetzt/)
  const nextTurn = { ...state, turn: state.turn + 1 }
  assert.equal(engine.canActivateCard(nextTurn, 'player', 800), true)
  const fired = activateDuelEffect(nextTurn, 'player', 800)
  const resolved = passDuelChain(fired, 'player')
  assert.equal(resolved.jarvis.lp, 7500)
  assert.equal(resolved.player.graveyard.some((c) => c.id === 800 && !c.faceDown), true)
})

test('Effekte: Suche, Wiederbeleben, Bonus, Zerstören aller Monster', () => {
  const monsterIn = (id, atk) => ({ ...deck(1, atk)[0], id, position: 'attack' })
  let state = duelWith({ hand: [spellCard(810, { kind: 'search', amount: 1 })] })
  let out = passDuelChain(activateDuelEffect(state, 'player', 810), 'player')
  assert.equal(out.player.hand.length, 1, 'Spell weg, 1 Karte gesucht')
  state = duelWith({ hand: [spellCard(811, { kind: 'revive' })], graveyard: [monsterIn(1, 900), monsterIn(2, 2400)] })
  out = passDuelChain(activateDuelEffect(state, 'player', 811), 'player')
  assert.equal(out.player.monsters[0].atk, 2400)
  state = duelWith({ hand: [spellCard(812, { kind: 'boost', amount: 700 })], monsters: [monsterIn(3, 1000)] })
  out = passDuelChain(activateDuelEffect(state, 'player', 812), 'player')
  assert.equal(out.player.monsters[0].atk, 1700)
  const ended = engine.endJarvisTurn(engine.startJarvisTurn({ ...out, phase: 'end' }))
  assert.equal(ended.player.monsters[0].atk, 1000, 'Bonus endet mit dem Zug')
  state = duelWith({ hand: [spellCard(813, { kind: 'destroy', target: 'allMonsters' })] }, { monsters: [monsterIn(4, 1000), monsterIn(5, 1000)] })
  out = passDuelChain(activateDuelEffect(state, 'player', 813), 'player')
  assert.equal(out.jarvis.monsters.length, 0)
  assert.equal(out.jarvis.graveyard.length, 2)
})

test('Jarvis antwortet auf einen Angriff mit einer gesetzten Falle und die Kette hält den Angriff an', () => {
  const trap = spellCard(820, { kind: 'negateAttack' }, { kind: 'trap', type: 'Trap Card', faceDown: true, lockedKey: 0 })
  const mine = { ...deck(1, 2500)[0], id: 821, position: 'attack' }
  const state = duelWith({ monsters: [mine] }, { spells: [trap], monsters: [] }, { phase: 'battle', turn: 2 })
  const declared = attack(selectAttacker(state, 821))
  assert.equal(declared.chain.length, 1)
  assert.equal(declared.pendingAttack?.attackerId, 821)
  assert.equal(declared.jarvis.lp, 8000)
  const resolved = passDuelChain(declared, 'player')
  assert.equal(resolved.jarvis.lp, 8000, 'Angriff negiert')
  assert.equal(resolved.pendingAttack, null)
})

test('Jarvis-Zug läuft in sichtbaren Einzelschritten, kann mit Falle unterbrochen werden und endet im Spielerzug', () => {
  const model = createNetModel(8, 3)
  for (const brain of [null, model]) {
    const random = seededRandom(9)
    const mine = generateDeck('balanced', random)
    const theirs = generateDeck('aggro', random)
    let state = createDuel(mine.main, theirs.main, random, mine.extra, theirs.extra)
    const total = (side) => side.hand.length + side.deck.length + side.extraDeck.length + side.monsters.length + side.graveyard.length + side.spells.length
    const before = total(state.jarvis)
    state = engine.startJarvisTurn({ ...state, phase: 'end' })
    assert.equal(state.turnOwner, 'jarvis')
    let steps = 0
    while (state.turnOwner === 'jarvis' && !state.winner && steps < 80) {
      if (state.chain.length) state = passDuelChain(state, 'player')
      else state = netEngine.jarvisStep(state, brain)
      steps += 1
    }
    assert.ok(steps < 80 && steps >= 4, `Schritte: ${steps}`)
    if (!state.winner) {
      assert.equal(state.turnOwner, 'player')
      assert.equal(state.phase, 'draw')
      assert.equal(total(state.jarvis), before, 'Jarvis verliert keine Karte')
    }
  }
  // Unterbrechung: Spieler negiert den angekündigten Angriff von Jarvis.
  const trap = spellCard(830, { kind: 'negateAttack' }, { kind: 'trap', type: 'Trap Card', faceDown: true, lockedKey: 0 })
  const jarvisMonster = { ...deck(1, 2000)[0], id: 831, position: 'attack' }
  const base = duelWith({ spells: [trap], monsters: [] }, { monsters: [jarvisMonster] }, { turnOwner: 'jarvis', phase: 'battle', turn: 3 })
  const declared = netEngine.jarvisStep(base, null)
  assert.equal(declared.pendingAttack?.side, 'jarvis')
  assert.equal(engine.canActivateCard(declared, 'player', 830), true)
  assert.equal(engine.canActivateCard({ ...declared, pendingAttack: null }, 'player', 830), false, 'ohne Angriff nicht aktivierbar')
  const answered = passDuelChain(activateDuelEffect(declared, 'player', 830), 'player')
  assert.equal(answered.pendingAttack, null)
  assert.equal(answered.player.lp, 8000)
  const unblocked = netEngine.jarvisStep(declared, null)
  assert.equal(unblocked.player.lp, 6000, 'ohne Falle trifft der Angriff')
})

const searchEngine = await import('../src/engine/yugioh-search.ts')
const selfPlay = await import('../src/engine/yugioh-selfplay.ts')

const deepFreeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

test('Self-Play: gleicher Seed ergibt dasselbe Match, es endet immer', () => {
  const a = selfPlay.playSelfPlayMatch({ seed: 11 })
  const b = selfPlay.playSelfPlayMatch({ seed: 11 })
  assert.deepEqual(a, b)
  assert.ok(a.moves.length > 5)
  assert.ok(['win', 'deckout', 'turnLimit'].includes(a.end))
  const other = selfPlay.playSelfPlayMatch({ seed: 12 })
  assert.notDeepEqual(other.moves.map((m) => m.label), a.moves.map((m) => m.label))
  for (const source of ['generated', 'real', 'mixed']) {
    for (let seed = 1; seed <= 4; seed += 1) {
      const result = selfPlay.playSelfPlayMatch({ seed, deckSource: source })
      assert.ok(result.end, `${source} ${seed} endet`)
      assert.ok(result.decks[0] && result.decks[1], 'Deckname je Seite')
    }
  }
})

test('Self-Play: beide Seiten ziehen abwechselnd, die Engine wird nicht verändert und der Stand bleibt spiegelbar', () => {
  let match = selfPlay.createSelfPlayMatch({ seed: 5 })
  const sides = []
  for (let i = 0; i < 300 && !match.end; i += 1) {
    deepFreeze(match.view)
    match = selfPlay.stepSelfPlayMatch(match)
    const last = match.moves.at(-1)
    if (last && sides.at(-1) !== last.halfTurn) sides.push(last.halfTurn)
  }
  assert.ok(match.end)
  const turns = [...new Set(match.moves.map((m) => `${m.halfTurn}:${m.side}`))]
  for (const entry of turns) assert.equal(Number(entry.split(':')[0]) % 2 === 1, entry.endsWith(':0'), 'ungerade Halbzüge gehören Seite 0')
  const board = selfPlay.matchBoard(match)
  assert.equal(board.player.lp, match.moves.at(-1).lp[0])
  assert.equal(board.jarvis.lp, match.moves.at(-1).lp[1])
})

test('Self-Play: Klon-Match ist symmetrisch – Seitenwechsel erzeugt keinen Dauergewinner', () => {
  let first = 0
  const games = 60
  for (let seed = 1; seed <= games; seed += 1) {
    const result = selfPlay.playSelfPlayMatch({ seed, deckSource: 'generated' })
    if (result.winner === 0) first += 1
  }
  // Der Anziehende hat einen Vorteil, aber das Match ist kein Selbstläufer.
  assert.ok(first > games * 0.25 && first < games * 0.85, `Anzieher gewinnt ${first}/${games}`)
})

test('Zugsuche: spielt ein Lethal über mehrere Aktionen (Beschwören, Battle Phase, Direktangriff) zu Ende', () => {
  const monster = { id: 900, name: 'Angreifer', type: 'Normal Monster', kind: 'monster', atk: 2000, def: 1000, level: 4, position: 'attack' }
  let state = duelWith(
    { monsters: [monster], hand: [{ ...deck(1)[0], id: 901 }], normalSummonUsed: false },
    { monsters: [], lp: 1000, spells: [], hand: [], deck: deck(10) },
    { turn: 2 },
  )
  const random = netEngine.seededRandom(1)
  let deepest = 0
  for (let step = 0; step < 8 && !state.winner; step += 1) {
    const actions = netEngine.candidateActions(state)
    const result = searchEngine.searchAction(state, actions, { budget: searchEngine.SEARCH_PROFILES.proof, random })
    deepest = Math.max(deepest, result.depth)
    state = netEngine.applyAction(state, actions[result.index])
  }
  assert.equal(state.winner, 'player')
  assert.ok(deepest >= 2, 'Suche schaut mehr als einen Zug voraus')
})

test('Zugsuche: verändert den Zustand nicht und nutzt verdeckte Gegnerinformation nicht', () => {
  const state = duelWith({ monsters: [] }, {})
  const snapshot = JSON.stringify(state)
  const actions = netEngine.candidateActions(state)
  const run = (view) => searchEngine.searchAction(view, actions, { budget: searchEngine.SEARCH_PROFILES.training, random: netEngine.seededRandom(3) })
  const base = run(deepFreeze(structuredClone(state)))
  assert.equal(JSON.stringify(state), snapshot)
  // Gegnerhand und Deck vertauschen: dieselben unbekannten Karten, andere echte Zuordnung.
  const swapped = structuredClone(state)
  const [h0, ...hRest] = swapped.jarvis.hand
  const [d0, ...dRest] = swapped.jarvis.deck.slice().reverse()
  swapped.jarvis.hand = [d0, ...hRest]
  swapped.jarvis.deck = [...dRest.reverse(), h0]
  const other = run(swapped)
  assert.deepEqual(other.values, base.values)
  assert.equal(other.index, base.index)
  // Die Stichprobe erhält Handgröße und die Menge unbekannter Karten.
  const world = searchEngine.sampleHiddenState(state, netEngine.seededRandom(9))
  assert.equal(world.jarvis.hand.length, state.jarvis.hand.length)
  const ids = (p) => [...p.hand, ...p.deck].map((c) => c.id).sort((x, y) => x - y)
  assert.deepEqual(ids(world.jarvis), ids(state.jarvis))
})

test('Zugsuche: verdeckte Gegnerkarten werden nicht verraten', () => {
  const trap = spellCard(950, { kind: 'negateAttack' }, { kind: 'trap', type: 'Trap Card', faceDown: true, lockedKey: 0 })
  const others = ['draw', 'damage', 'destroy', 'heal', 'draw', 'damage'].map((kind, i) =>
    spellCard(960 + i, kind === 'destroy' ? { kind, target: 'allMonsters' } : { kind, amount: 500 }))
  const state = duelWith({}, { spells: [trap], deck: [...deck(10), ...others] })
  const worlds = Array.from({ length: 12 }, (_, i) => searchEngine.sampleHiddenState(state, netEngine.seededRandom(i + 1)))
  const kinds = new Set(worlds.map((w) => w.jarvis.spells[0].effect?.kind ?? 'inert'))
  assert.ok(!(kinds.size === 1 && kinds.has('negateAttack')), 'Falle erscheint nicht in jeder Stichprobe')
  assert.equal(worlds[0].jarvis.spells[0].id, 950)
  assert.equal(worlds[0].jarvis.spells[0].faceDown, true)
})

test('Zugsuche: Knoten- und Zeitgrenze greifen, es gibt immer einen Zug', () => {
  const state = duelWith({}, {})
  const actions = netEngine.candidateActions(state)
  const tiny = { ...searchEngine.SEARCH_PROFILES.training, maxNodes: 30, maxDepth: 6 }
  const limited = searchEngine.searchAction(state, actions, { budget: tiny, random: netEngine.seededRandom(1) })
  assert.equal(limited.stoppedBy, 'nodes')
  assert.ok(limited.index >= 0 && limited.index < actions.length)
  assert.ok(limited.depth >= 1)
  let clock = 0
  const slow = searchEngine.searchAction(state, actions, {
    budget: { ...searchEngine.SEARCH_PROFILES.game, maxDepth: 8 },
    random: netEngine.seededRandom(1),
    now: () => (clock += 20_000),
  })
  assert.ok(['time', 'exhausted', 'stable', 'depth'].includes(slow.stoppedBy))
  assert.ok(slow.index >= 0 && slow.index < actions.length)
  assert.equal(searchEngine.SEARCH_PROFILES.game.maxMs, 30_000)
  assert.equal(searchEngine.SEARCH_PROFILES.training.maxMs, 0, 'Training/Proof laufen ohne Uhr (reproduzierbar)')
  assert.equal(searchEngine.SEARCH_PROFILES.proof.maxMs, 0)
})

test('Zugsuche: Temperatur 0 wählt greedy, Temperatur > 0 streut', () => {
  const values = [0.1, 1, 0.9]
  assert.equal(searchEngine.pickByTemperature(values, 0, () => 0.5), 1)
  const rnd = netEngine.seededRandom(4)
  const picks = new Set(Array.from({ length: 200 }, () => searchEngine.pickByTemperature(values, 0.5, rnd)))
  assert.ok(picks.size >= 2)
})

test('Zugsuche gegen Heuristik: auf generierten Decks messbar nicht schlechter', () => {
  const heuristic = { name: 'H', model: null, search: null, temperature: 0 }
  const searcher = { name: 'S', model: null, search: searchEngine.SEARCH_PROFILES.training, temperature: 0 }
  let points = 0
  const games = 120
  for (let i = 0; i < games; i += 1) {
    const searchFirst = i % 2 === 0
    const result = selfPlay.playSelfPlayMatch({ seed: 500 + i, agents: searchFirst ? [searcher, heuristic] : [heuristic, searcher], deckSource: 'generated' })
    const side = searchFirst ? 0 : 1
    points += result.winner === side ? 1 : result.winner === null ? 0.5 : 0
  }
  assert.ok(points / games > 0.5, `Suche ${points}/${games}`)
})

test('Münzwurf: genau eine Zufallszahl entscheidet, beide Seiten kommen vor', () => {
  assert.equal(engine.coinFlip(() => 0.1), 'player')
  assert.equal(engine.coinFlip(() => 0.9), 'jarvis')
  let calls = 0
  engine.coinFlip(() => { calls += 1; return 0.3 })
  assert.equal(calls, 1)
  const random = netEngine.seededRandom(21)
  const seen = new Set(Array.from({ length: 40 }, () => engine.coinFlip(random)))
  assert.deepEqual([...seen].sort(), ['jarvis', 'player'])
})

const reviewEngine = await import('../src/engine/yugioh-review.ts')
const proofEngine = await import('../src/engine/yugioh-proof.ts')
const leagueEngine = await import('../src/engine/yugioh-league.ts')

test('Review: Fehlerkandidaten brauchen Beleg aus dem Protokoll', () => {
  const match = selfPlay.playSelfPlayMatch({ seed: 77 })
  const mistakes = reviewEngine.findMistakeCandidates(match.moves, 0.2)
  for (const m of mistakes) {
    const move = match.moves.find((entry) => entry.n === m.move)
    assert.ok(move)
    assert.ok(m.bestAlternative)
  }
  const stats = reviewEngine.aggregateReviewStats(match.moves, mistakes)
  assert.equal(stats.totalMoves, match.moves.length)
})

test('Nachweis: Verify erkennt manipulierten Hash', () => {
  const model = createNetModel(8, 3)
  const proof = proofEngine.buildProofFile({ appVersion: '18.51.0', model, gatePassed: true, gateReason: 'test' })
  const ok = proofEngine.verifyProofFile(proof, model)
  assert.equal(ok.hashOk, true)
  const tampered = { ...proof, weightsSha256: 'deadbeef' }
  const bad = proofEngine.verifyProofFile(tampered, model)
  assert.equal(bad.hashOk, false)
  assert.equal(bad.ok, false)
})

test('Elo-Liga: stärkere Version steigt', () => {
  let league = leagueEngine.createDefaultLeague('test')
  league.push({ id: 'v2', label: 'V2', rating: 1000, games: 0, wins: 0, losses: 0, draws: 0, engineStamp: 'test' })
  const before = league.find((e) => e.id === 'v2').rating
  league = leagueEngine.updateLeagueRatings(league, { a: 'v2', b: 'heuristic', scoreA: 0.75, games: 20, seeds: [1, 2] })
  const after = league.find((e) => e.id === 'v2').rating
  assert.ok(after > before)
})

test('Value-Kopf und Self-Play-Gate-Helfer', () => {
  const model = createNetModel(8, 2)
  const bundle = netEngine.attachValueHead(model)
  assert.equal(bundle.schema, 2)
  const vec = new Array(netEngine.STATE_VALUE_DIM).fill(0.5)
  assert.ok(Number.isFinite(netEngine.valueScore(bundle, vec)))
  const rate = selfPlay.evaluateSelfPlayWinRate(model)
  assert.ok(rate >= 0 && rate <= 1)
  const gate = proofEngine.passesImprovementGate(0.55, 0.5)
  assert.equal(gate.passed, true)
})

test('Ultron beginnt nach dem Münzwurf: er spielt Zug 1, danach ist der Spieler dran und zieht', () => {
  const fresh = createDuel(deck(), deck(), netEngine.seededRandom(2))
  const starts = engine.giveFirstTurn(fresh, 'jarvis')
  assert.equal(starts.turnOwner, 'jarvis')
  assert.equal(starts.phase, 'draw')
  assert.equal(starts.player.hand.length, 5)
  assert.equal(starts.jarvis.hand.length, 5, 'kein Ziehen im ersten Zug')
  assert.equal(starts.turn, 1)
  let state = starts
  for (let i = 0; i < 60 && state.turnOwner === 'jarvis' && !state.winner; i += 1) state = netEngine.jarvisStep(state, null)
  assert.equal(state.turnOwner, 'player')
  assert.equal(state.phase, 'draw')
  assert.equal(state.turn, 2)
  assert.equal(state.player.hand.length, 6, 'Spieler zieht zu Beginn seines ersten Zugs')
  const you = engine.giveFirstTurn(fresh, 'player')
  assert.equal(you.turnOwner, 'player')
  assert.equal(you.phase, 'draw')
  assert.equal(you.player.hand.length, 5)
})

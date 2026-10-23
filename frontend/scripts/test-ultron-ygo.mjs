import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Netz-Merkmale, Wert-Gradient, Liga, Nachweis-Format und die Embedding-Suche.
 * Kurze Läufe. Das lange 3000-Episoden-Training bleibt in test:yugioh-duel.
 */

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
  get length() {
    return Object.keys(mem).length
  },
  key: (i) => Object.keys(mem)[i] ?? null,
}

const net = await import('../src/engine/yugioh-net.ts')
const league = await import('../src/engine/yugioh-league.ts')
const proof = await import('../src/engine/yugioh-proof.ts')
const search = await import('../src/engine/yugioh-search.ts')
const selfPlay = await import('../src/engine/yugioh-selfplay.ts')
const duel = await import('../src/engine/yugioh-duel.ts')
const decks = await import('../src/engine/yugioh-decks.ts')
const retrieve = await import('../src/engine/retrieve.ts')

assert.equal(net.FEATURE_NAMES.indexOf('bias'), 37, 'bias bleibt Index 37')
assert.ok(net.FEATURE_COUNT > net.LEGACY_FEATURE_COUNT)
assert.equal(net.FEATURE_NAMES[net.FEATURE_COUNT - 1], 'oppLpAbs')
assert.equal(proof.PROOF_FORMAT, 'jarvis-yugioh-proof-v1')
assert.equal(search.SEARCH_PROFILES.proof.maxNodes, 6000)
assert.equal(search.SEARCH_PROFILES.proof.maxMs, 0)
assert.equal(search.SEARCH_PROFILES.game.maxMs, 30_000)
assert.ok(search.SEARCH_PROFILES.duel.maxMs <= 250)
assert.ok(search.SEARCH_PROFILES.duel.maxNodes <= 600)
assert.equal(net.REPORT_HOLDOUT_SEED, 918273)
assert.notEqual(net.CHECKPOINT_SEED, net.REPORT_HOLDOUT_SEED)

const fresh = net.createNetModel(4, 2)
assert.equal(fresh.inputs, net.FEATURE_COUNT)
const legacy = {
  inputs: net.LEGACY_FEATURE_COUNT,
  hidden: 4,
  params: fresh.params.slice(0, net.expectedParamCount(net.LEGACY_FEATURE_COUNT, 4)),
}
net.validateNetModel(legacy)
const wide = new Array(net.FEATURE_COUNT).fill(0)
wide[37] = 1
assert.ok(Number.isFinite(net.netScore(legacy, wide)))
assert.throws(() => net.validateNetModel({ inputs: 20, hidden: 4, params: [0] }), /Architektur/)

const random = net.seededRandom(4)
const mine = decks.generateDeck('control', random)
const theirs = decks.generateDeck('aggro', random)
const opened = duel.createDuel(mine.main, theirs.main, random, mine.extra, theirs.extra)
const asPhase = (phase) => net.candidateActions({ ...opened, phase }).find((action) => action.kind === 'pass')
const passMain = asPhase('main1')
const passBattle = asPhase('battle')
assert.ok(passMain && passBattle)
assert.equal(passMain.features.length, net.FEATURE_COUNT)
assert.equal(passMain.features[net.FEATURE_NAMES.indexOf('phaseMain1')], 1)
assert.equal(passBattle.features[net.FEATURE_NAMES.indexOf('phaseBattle')], 1)
assert.notEqual(passMain.features[net.FEATURE_NAMES.indexOf('phaseMain1')], passBattle.features[net.FEATURE_NAMES.indexOf('phaseMain1')])
assert.equal(passMain.features[37], 1)

const model = net.createNetModel(4, 1)
const bundle = net.attachValueHead(model, 4, 2)
if (!bundle.value) throw new Error('Wert-Kopf fehlt')
const before = bundle.value.params.slice()
const vector = new Array(net.STATE_VALUE_DIM).fill(0)
vector[0] = 1
vector[1] = -0.4
const row = new Array(net.FEATURE_COUNT).fill(0)
row[0] = 1
row[37] = 1
const other = row.slice()
other[1] = 1
const trained = net.trainFromSelfPlaySamples(
  bundle,
  [{ features: [row, other], chosen: 0, outcome: 1, stateVector: vector }],
  0.05,
)
if (!trained.value) throw new Error('Wert-Kopf nach dem Lernen fehlt')
const deltas = trained.value.params.map((value, index) => value - before[index])
assert.ok(new Set(deltas.map((value) => value.toFixed(6))).size > 1, 'der Wert-Gradient ist nicht für jeden Parameter gleich')
assert.ok(deltas.some((value) => value !== 0))

let table = league.createDefaultLeague('test')
table.push({ id: 'v2', label: 'V2', rating: 1000, games: 0, wins: 0, losses: 0, draws: 0, engineStamp: 'test' })
table = league.updateLeagueRatings(table, { a: 'v2', b: 'heuristic', scoreA: 0.75, games: 20, seeds: [1] })
const rowV2 = table.find((entry) => entry.id === 'v2')
if (!rowV2) throw new Error('v2 fehlt')
assert.equal(rowV2.wins, 15)
assert.equal(rowV2.draws, 0)
assert.equal(rowV2.losses, 5)
assert.ok(rowV2.rating > 1000)

const counted = league.updateLeagueRatings(league.createDefaultLeague('test').concat([{
  id: 'v2', label: 'V2', rating: 1000, games: 0, wins: 0, losses: 0, draws: 0, engineStamp: 'test',
}]), { a: 'v2', b: 'heuristic', scoreA: 0.5, games: 4, seeds: [1], wins: 1, losses: 1, draws: 2 })
const exact = counted.find((entry) => entry.id === 'v2')
if (!exact) throw new Error('v2 fehlt')
assert.equal(exact.wins, 1)
assert.equal(exact.losses, 1)
assert.equal(exact.draws, 2)

const batch = selfPlay.collectSelfPlayTrainingBatch(null, 1, 5)
if (batch.results[0].winner === 0 || batch.results[0].winner === 1) {
  const sides = new Set(batch.samples.map((sample) => sample.outcome))
  assert.ok(sides.has(1) && sides.has(-1), 'beide Seiten bekommen das richtige Vorzeichen')
}

const fair = net.evaluatePolicy(net.heuristicPolicy, 2, 11, undefined, true)
assert.equal(fair.games, 2)
assert.equal(fair.invalidActions, 0)

const hits = retrieve.retrieveFromCorpus('kaffee am morgen', {
  memory: [
    { id: '1', key: 'getränk', value: 'Kaffee schwarz', category: 'pref', confidence: 1, updated_at: '2026-01-01', kind: 'fact' },
    { id: '2', key: 'ort', value: 'Berlin', category: 'fact', confidence: 1, updated_at: '2026-01-01', kind: 'fact' },
  ],
  notes: [{ id: 'n', body: 'Kaffee steht in der Küche', created_at: '2026-01-01', updated_at: '2026-01-01' }],
})
assert.ok(hits.some((hit) => /Kaffee/i.test(`${hit.title} ${hit.body}`)))

console.log('OK test-ultron-ygo')
process.exit(0)

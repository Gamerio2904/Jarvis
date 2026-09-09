/**
 * Härtung des Agenten-Busses: Budget, Wiederholung, Traces, Policy-Ränge.
 * Deckt die Invarianten ab, die vorher niemand geprüft hat.
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { AgentTimeout, withBudget } from '../src/engine/agents/budget.ts'
import {
  beginAgentTurn,
  currentAgentTurn,
  getBrainSlots,
  getTurnTraces,
  pushAgentTrace,
  pushBrainSlot,
} from '../src/engine/agents/trace-store.ts'
import { pickPolicy, SCORE_CEIL, SCORE_MIN, tieRank, withCost, withPrior } from '../src/engine/policy.ts'
import { agentCatalog, orphanExecutorIds } from '../src/engine/agents/catalog.ts'
import { EXECUTOR_IDS } from '../src/engine/agents/executor-ids.ts'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// --- Budget ---------------------------------------------------------------
assert.equal(await withBudget(Promise.resolve('da'), 500), 'da')

await assert.rejects(
  () => withBudget(sleep(200).then(() => 'zu spät'), 20),
  (err) => err instanceof AgentTimeout && /Zeit überschritten/.test(err.message),
  'langsame Arbeit läuft in das Budget',
)

// Ein schneller Zug darf nicht bis zum Budget offen bleiben: der Timer wird
// aufgeräumt, sonst hielte Node den Prozess 60s wach.
const t0 = Date.now()
await withBudget(Promise.resolve(1), 60_000)
assert.ok(Date.now() - t0 < 1_000, 'Budget-Timer wird aufgeräumt')

// Ein abgelehntes Versprechen bleibt eine Ablehnung, kein Timeout.
await assert.rejects(
  () => withBudget(Promise.reject(new Error('kaputt')), 500),
  /kaputt/,
)

// --- Traces ---------------------------------------------------------------
const turn = beginAgentTurn()
assert.equal(currentAgentTurn(), turn)
pushAgentTrace({ agentId: 'a', phase: 'execute', ms: 1, ok: true })
assert.equal(getTurnTraces().length, 1)

// Ein Handler des vorigen Zugs darf nicht in den neuen schreiben.
const stale = turn
beginAgentTurn()
assert.equal(getTurnTraces().length, 0, 'neuer Zug beginnt leer')
pushAgentTrace({ agentId: 'alt', phase: 'execute', ms: 1, ok: false }, stale)
assert.equal(getTurnTraces().length, 0, 'veralteter Trace wird verworfen')
pushBrainSlot({ slot: 'alt', model: 'x', ms: 1, ok: false }, stale)
assert.equal(getBrainSlots().length, 0, 'veralteter Brain-Slot wird verworfen')

// Kein unbegrenztes Wachstum.
beginAgentTurn()
for (let i = 0; i < 500; i += 1) pushAgentTrace({ agentId: `a${i}`, phase: 'execute', ms: 0, ok: true })
assert.ok(getTurnTraces().length <= 200, `Traces begrenzt, sind ${getTurnTraces().length}`)

// --- Policy ---------------------------------------------------------------
// Kosten dürfen keinen Gleichstand erzeugen: sie verschieben den Rang, die
// Schwelle prüft weiter den Parse-Score.
const costed = withCost([
  { id: 'lesen', score: SCORE_MIN, sideEffect: 'read' },
  { id: 'geraet', score: SCORE_MIN, sideEffect: 'device' },
])
assert.equal(costed[0].base, SCORE_MIN)
assert.equal(costed[1].base, SCORE_MIN)
assert.ok(costed[1].score < costed[0].score, 'Gerät kostet mehr als Lesen')

const pick = pickPolicy(costed)
assert.equal(pick.kind, 'run', 'ein Parser-Treffer am Boden bleibt wählbar')
assert.equal(pick.id, 'lesen', 'die günstigere Seite gewinnt')

// Genau gleiche Scores mit fester Vorfahrt laufen, statt zurückzufragen.
const tie = pickPolicy([
  { id: 'maps', score: 0.8, sideEffect: 'read' },
  { id: 'hud', score: 0.8, sideEffect: 'read' },
])
assert.equal(tie.kind, 'run')
assert.equal(tie.id, 'hud', 'hud hat Vorfahrt vor maps')
assert.ok(tieRank('hud') < tieRank('maps'))
assert.equal(tieRank('gibt-es-nicht'), tieRank('auch-nicht'), 'Unbekannte sind gleichrangig')

// Zwei gleichrangige Unbekannte fragen weiter zurück — die Rückfrage bleibt
// als letzter Ausweg erhalten.
const stillAsks = pickPolicy([
  { id: 'fremd-a', score: 0.8, sideEffect: 'read' },
  { id: 'fremd-b', score: 0.8, sideEffect: 'read' },
])
assert.equal(stillAsks.kind, 'ask')

// Unter der Schwelle bleibt nichts übrig.
assert.equal(pickPolicy([{ id: 'x', score: 0.2, sideEffect: 'read', base: 0.2 }]).kind, 'none')
assert.equal(pickPolicy([]).kind, 'none')

// Der Nachlauf-Bonus sättigt nicht mehr bei 0.99.
const prior = withPrior([{ id: 'weather', score: 0.98, sideEffect: 'read' }], 'weather', true)
assert.ok(prior[0].score > 0.99 && prior[0].score <= SCORE_CEIL)

// --- Katalog --------------------------------------------------------------
assert.deepEqual(orphanExecutorIds(), [], 'kein Executor ohne Katalog-Eintrag')

const catalog = agentCatalog()
const withExecute = catalog.filter((a) => a.execute).map((a) => a.id).sort()
assert.deepEqual(withExecute, [...EXECUTOR_IDS].sort(), 'EXECUTOR_IDS deckt sich mit execute-map')

for (const agent of catalog) {
  if (agent.id === 'identity') continue
  assert.ok(agent.execute, `${agent.id} braucht einen Executor`)
}

// --- Konflikt-Tisch -------------------------------------------------------
// `drop('research')` lief jahrelang ins Leere, weil kein Agent so heißt. Ein
// Tippfehler im Konflikt-Tisch fällt sonst nirgends auf: die Regel greift
// scheinbar, verändert aber nichts.
const src = await readFile(new URL('../src/engine/conflicts.ts', import.meta.url), 'utf8')
const known = new Set(catalog.map((a) => a.id))
const referenced = [...src.matchAll(/\b(?:drop|boost)\(\s*out\s*,\s*'([^']+)'/g)].map((m) => m[1])
assert.ok(referenced.length > 50, `Konflikt-Tisch gelesen (${referenced.length} Verweise)`)
const unknown = [...new Set(referenced.filter((id) => !known.has(id)))]
assert.deepEqual(unknown, [], `conflicts.ts nennt unbekannte Agenten: ${unknown.join(', ')}`)

console.log(
  `test:agents-robust ok — Budget, ${getTurnTraces().length} Traces begrenzt, ${catalog.length} Agenten`,
)

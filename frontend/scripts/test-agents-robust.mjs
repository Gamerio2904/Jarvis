/**
 * Härtung des Agenten-Busses: Budget, Wiederholung, Traces, Policy-Ränge.
 * Deckt die Invarianten ab, die vorher niemand geprüft hat.
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  BREAKER_OPEN_MS,
  breakerAllows,
  breakerFailure,
  breakerSnapshot,
  breakerState,
  breakerSuccess,
  resetBreakers,
} from '../src/engine/agents/breaker.ts'
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
import { applyConflicts } from '../src/engine/conflicts.ts'

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

// `identity` war der letzte Agent ohne Executor. Das fiel nicht auf, weil
// chat.ts die Frage vorher abfängt — wird dieser Weg umgangen, scheiterte
// runAgent stumm und die Antwort kam vom Modell.
for (const agent of catalog) {
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

// Eine Preisfrage an der Tanke darf den Tank-Agenten nicht abwerfen — sonst
// ist niemand zuständig und das Modell erfindet Spritpreise.
{
  const ctx = { lastTool: '', lastMedium: '', inDrive: false }
  const cands = [
    { id: 'fuel', score: 0.6 },
    { id: 'outlook', score: 0.5 },
  ]
  const kept = applyConflicts(cands, 'Was kostet E10 an der nächsten Tankstelle?', ctx).map((c) => c.id)
  assert.ok(kept.includes('fuel'), 'fuel bleibt zuständig')
  assert.ok(!kept.includes('outlook'), 'der Ausblick fliegt — eine Preisfrage ist keine Prognose')
}

// --- Sicherungsschalter ---------------------------------------------------
resetBreakers()
const T0 = 1_000_000

assert.equal(breakerState('tv', T0), 'zu', 'ein unbelasteter Agent ist frei')
assert.equal(breakerAllows('tv', T0), true)

breakerFailure('tv', T0)
breakerFailure('tv', T0)
assert.equal(breakerState('tv', T0), 'zu', 'zwei Fehlschläge sperren noch nicht')
assert.equal(breakerAllows('tv', T0), true)

breakerFailure('tv', T0)
assert.equal(breakerState('tv', T0), 'offen', 'der dritte sperrt')
assert.equal(breakerAllows('tv', T0), false, 'gesperrt heißt: gar nicht erst warten')
assert.equal(breakerAllows('tv', T0 + BREAKER_OPEN_MS - 1), false)

// Nach 60 s genau ein Versuch — ein zweiter gleichzeitiger Zug rennt nicht mit.
const half = T0 + BREAKER_OPEN_MS
assert.equal(breakerState('tv', half), 'halb')
assert.equal(breakerAllows('tv', half), true, 'der eine Versuch')
assert.equal(breakerAllows('tv', half), false, 'und nur der eine')

// Fehler im Halbmond: wieder 60 s zu.
breakerFailure('tv', half)
assert.equal(breakerAllows('tv', half + 1), false)

// Erfolg löscht die Geschichte vollständig.
breakerSuccess('tv')
assert.equal(breakerState('tv', half), 'zu')
assert.equal(breakerAllows('tv', half), true)
assert.deepEqual(breakerSnapshot(half), [], 'ein gesunder Agent steht nicht im Bogen')

// Ein anderer Agent ist davon unberührt — sonst sperrt ein kaputter Dienst alles.
resetBreakers()
for (let i = 0; i < 3; i += 1) breakerFailure('pc', T0)
assert.equal(breakerAllows('pc', T0), false)
assert.equal(breakerAllows('weather', T0), true, 'Sicherungen gelten je Agent')
resetBreakers()

// --- Abbruch bis in den Handler -------------------------------------------
// withBudget schnitt vorher nur das Warten ab: der Handler lief weiter, sein
// fetch lief weiter, und danach konnte er noch Zustand schreiben.
{
  const { AgentAborted, withBudget } = await import('../src/engine/agents/budget.ts')
  const {
    abortCurrentTurn,
    beginTurnAbort,
    currentTurnSignal,
    isTurnAborted,
    resetTurnAbort,
    withTurnSignal,
  } = await import('../src/engine/turn-abort.ts')

  resetTurnAbort()
  assert.equal(currentTurnSignal(), undefined, 'ohne Zug kein Signal')
  assert.equal(isTurnAborted(), false)
  assert.equal(withTurnSignal(undefined), undefined)

  const first = beginTurnAbort()
  assert.equal(first.aborted, false)
  // Ein neuer Zug bricht den alten wirklich ab.
  const second = beginTurnAbort()
  assert.equal(first.aborted, true, 'der vorige Zug ist abgebrochen')
  assert.equal(second.aborted, false)
  assert.equal(isTurnAborted(), false)

  // Der Handler bekommt das Signal und sieht den Abbruch.
  const seen = []
  const slow = new Promise((resolve) => setTimeout(() => resolve('zu spät'), 5_000))
  const signal = withTurnSignal()
  signal.addEventListener('abort', () => seen.push('abort'))
  const race = withBudget(slow, 60_000, signal)
  abortCurrentTurn('Barge-in')
  await assert.rejects(race, (e) => e instanceof AgentAborted, 'Abbruch, nicht Timeout')
  assert.deepEqual(seen, ['abort'], 'das Signal erreicht den Handler')
  assert.equal(isTurnAborted(), true)

  // Ein bereits abgebrochenes Signal wartet nicht erst auf das Budget.
  await assert.rejects(withBudget(slow, 60_000, withTurnSignal()), (e) => e instanceof AgentAborted)

  // Ein abgebrochener Zug schreibt keinen Nachlauf-Zustand mehr.
  // Ohne Speicher-Ersatz waere die Pruefung falsch gruen: saveSettings
  // schluckt den Fehler und loadSettings liefert immer die Vorgaben.
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
  }
  const store = await import('../src/engine/store.ts')
  resetTurnAbort()
  store.saveSettings({ last_step_tool: 'alt', last_medium: 'alt' })
  assert.equal(store.loadSettings().last_step_tool, 'alt', 'Speicher-Ersatz greift')

  beginTurnAbort()
  abortCurrentTurn('Test')
  assert.equal(isTurnAborted(), true)
  store.saveSettings({ last_step_tool: 'tv', last_medium: 'voice' })
  assert.equal(store.loadSettings().last_step_tool, 'alt', 'Nachlauf-Feld bleibt unberuehrt')
  assert.equal(store.loadSettings().last_medium, 'alt')
  // Einstellungen bleiben schreibbar - eine pauschale Sperre waere schlimmer.
  store.saveSettings({ alarm_tone_uri: 'content://test' })
  assert.equal(store.loadSettings().alarm_tone_uri, 'content://test')

  beginTurnAbort()
  store.saveSettings({ last_step_tool: 'tv' })
  assert.equal(store.loadSettings().last_step_tool, 'tv', 'im laufenden Zug wird geschrieben')
  resetTurnAbort()
  store.saveSettings({ last_step_tool: '', last_medium: '', alarm_tone_uri: '' })
}

console.log(
  `test:agents-robust ok — Budget, Sicherung, ${getTurnTraces().length} Traces begrenzt, ${catalog.length} Agenten`,
)

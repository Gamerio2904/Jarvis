import assert from 'node:assert/strict'

/**
 * Sprint 259 — Historie im Speicher.
 *
 * Geprüft wird das, was am Handy weh tut: geht ein Zug verloren, wächst der
 * Speicher über die Deckelung hinaus, und landet ein abgebrochener Zug
 * versehentlich in der Liste. Nicht geprüft wird die Optik.
 */

const { beginAgentTurn, pushAgentTrace, pushBrainSlot } = await import('../src/engine/agents/trace-store.ts')
const { finishLatency, latencyLog, setLatencyPath, startLatency } = await import('../src/engine/latency.ts')
const {
  MAX_HISTORY,
  historyExport,
  historyLine,
  historyTurn,
  historyTurns,
  noteHistoryReply,
  openHistoryTurn,
  resetHistory,
  subscribeHistory,
} = await import('../src/engine/history.ts')

/** Ein Zug, wie ihn `chat.ts` fährt: öffnen, antworten, Zeit stoppen. */
function turn(text, reply, opts = {}) {
  beginAgentTurn()
  startLatency('none')
  openHistoryTurn(text)
  for (const step of opts.steps || []) pushAgentTrace(step)
  for (const slot of opts.brain || []) pushBrainSlot(slot)
  if (opts.path) setLatencyPath(opts.path)
  if (reply !== null) noteHistoryReply(reply)
  finishLatency()
}

resetHistory()

// 1 — ein Zug landet vollständig in der Historie.
turn('wie spät ist es', 'Es ist 14:03 Uhr.', {
  path: 'parser',
  steps: [{ agentId: 'clock', phase: 'execute', ms: 4, ok: true }],
})
let all = historyTurns()
assert.equal(all.length, 1, 'ein Zug, ein Eintrag')
assert.equal(all[0].text, 'wie spät ist es')
assert.equal(all[0].reply, 'Es ist 14:03 Uhr.')
assert.equal(all[0].path, 'parser')
assert.equal(all[0].steps.length, 1)
assert.equal(all[0].steps[0].agent, 'clock')
assert.ok(all[0].msTotal >= 0, 'Zeit gemessen')
assert.ok(Array.isArray(all[0].quota), 'Kontingent mitgeschrieben')

// 2 — die Zug-Nummer stammt aus `trace-store`, Nachschlagen findet den Zug.
const found = historyTurn(all[0].turn)
assert.ok(found, 'Zug über die Nummer auffindbar')
assert.equal(found.text, 'wie spät ist es')

// 3 — mehrere Antworten in einem Zug: die letzte gilt.
turn('und morgen', null)
noteHistoryReply('vergessen')
assert.equal(historyTurns().length, 2, 'auch ohne Antwort ein Eintrag')
assert.equal(historyTurns()[1].reply, '', 'nach dem Siegeln zählt nichts mehr')

resetHistory()
beginAgentTurn()
startLatency('none')
openHistoryTurn('setz einen Timer')
noteHistoryReply('erster Versuch')
noteHistoryReply('Timer läuft, 5 Minuten.')
finishLatency()
assert.equal(historyTurns()[0].reply, 'Timer läuft, 5 Minuten.', 'letzte Antwort gewinnt')

// 4 — ohne offenen Zug siegelt nichts. Ein `finishLatency` aus dem Sprachmodus
//     nach einem Abbruch darf keinen leeren Eintrag erzeugen.
const before = historyTurns().length
startLatency('none')
finishLatency()
assert.equal(historyTurns().length, before, 'kein Eintrag ohne Äußerung')

// 5 — Deckelung: der Ringpuffer wirft vorne raus, statt zu wachsen.
resetHistory()
for (let i = 0; i < MAX_HISTORY + 12; i += 1) turn(`Zug ${i}`, `Antwort ${i}`)
all = historyTurns()
assert.equal(all.length, MAX_HISTORY, `gedeckelt bei ${MAX_HISTORY}`)
assert.equal(all[0].text, 'Zug 12', 'die ältesten sind weg')
assert.equal(all[all.length - 1].text, `Zug ${MAX_HISTORY + 11}`, 'der jüngste ist da')
assert.ok(latencyLog().length <= MAX_HISTORY, 'Latenz-Log deckt denselben Bereich ab')

// 6 — lange Texte werden gekürzt, sonst sind 50 Züge kein Debug-Werkzeug mehr.
resetHistory()
turn('x'.repeat(900), 'y'.repeat(900))
const long = historyTurns()[0]
assert.ok(long.text.length <= 200, 'Äußerung gekürzt')
assert.ok(long.reply.length <= 200, 'Antwort gekürzt')
assert.ok(long.text.endsWith('…'), 'Kürzung ist sichtbar')

// 7 — Zuhörer werden gerufen, und ein kaputter Zuhörer kippt nichts.
resetHistory()
let calls = 0
const offBad = subscribeHistory(() => {
  throw new Error('kaputt')
})
const off = subscribeHistory(() => {
  calls += 1
})
turn('hallo', 'Hallo.')
assert.ok(calls >= 1, 'Zuhörer gerufen')
offBad()
off()
turn('noch mal', 'Ja.')
assert.equal(calls, 1, 'abgemeldet heißt still')

// 8 — Export ist gültiges JSON mit allen Zügen.
const dump = JSON.parse(historyExport())
assert.equal(dump.kind, 'jarvis-history')
assert.equal(dump.turns.length, historyTurns().length)
assert.ok(dump.at, 'Zeitstempel im Export')

// 9 — eine Zeile je Zug nennt Agent und Zeit, nicht den Router.
resetHistory()
turn('mach den Fernseher an', 'Fernseher an.', {
  path: 'parser',
  steps: [
    { agentId: 'router', phase: 'parse', ms: 1, ok: true },
    { agentId: 'tv', phase: 'execute', ms: 9, ok: true },
  ],
  brain: [{ slot: 'antwort', model: 'llama-3.1-8b-instant', ms: 120, ok: true }],
})
const line = historyLine(historyTurns()[0])
assert.ok(line.includes('tv'), 'Agent in der Zeile')
assert.ok(!line.includes('router'), 'Router ist kein Agent für den Nutzer')
assert.ok(/\d+ ms$/.test(line), 'Zeit am Ende')
assert.equal(historyTurns()[0].brain[0].model, 'llama-3.1-8b-instant', 'Hirn-Plätze mitgeschrieben')

// 10 — ein neuer Zug erbt keine Schritte des alten.
resetHistory()
turn('erster', 'eins', { steps: [{ agentId: 'clock', phase: 'execute', ms: 2, ok: true }] })
turn('zweiter', 'zwei')
assert.equal(historyTurns()[1].steps.length, 0, 'Schritte bleiben beim eigenen Zug')

resetHistory()
console.log('test-history: alles gruen')

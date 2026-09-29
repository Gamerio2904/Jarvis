// @ts-nocheck
/**
 * Hirn + Agenten: Abbruch darf nicht ins Modell fallen oder als Fehler landen.
 * Zusätzlich: lokale Sweep-Sätze durch den Director, ohne Wurf.
 */
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

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
  key: (i) => Object.keys(mem)[i] ?? null,
  get length() {
    return Object.keys(mem).length
  },
}

const { abortError, abortCurrentTurn, beginTurnAbort, isAbortError, isTurnAborted, resetTurnAbort, waitTurn } =
  await import('../src/engine/turn-abort.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const { clearPending, createConversation, deleteReminder, listMessages, listReminders, saveSettings } =
  await import('../src/engine/store.ts')
const { cancelNotify, notifyIdFromKey } = await import('../src/native/notify.ts')
const { streamChat } = await import('../src/engine/chat.ts')
const { AGENT_SWEEP } = await import('../src/engine/agents/sweep.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')

assert.equal(isAbortError(abortError()), true)
assert.equal(isAbortError(new Error('Netz weg')), false)
assert.equal(isAbortError({ name: 'AgentAborted' }), true)

resetTurnAbort()
beginTurnAbort()
const waited = waitTurn(40)
abortCurrentTurn()
await assert.rejects(waited, (e) => isAbortError(e), 'waitTurn stirbt mit dem Zug')

const LOCAL = {
  identity: AGENT_SWEEP.identity,
  wont: AGENT_SWEEP.wont,
  timer: AGENT_SWEEP.timer,
  alarm: AGENT_SWEEP.alarm,
  todo: AGENT_SWEEP.todo,
  shopping: AGENT_SWEEP.shopping,
  app: AGENT_SWEEP.app,
  hud: AGENT_SWEEP.hud,
  reminder: AGENT_SWEEP.reminder,
  calendar: AGENT_SWEEP.calendar,
  idea: AGENT_SWEEP.idea,
  face: AGENT_SWEEP.face,
}

const thrown = []
for (const [id, text] of Object.entries(LOCAL)) {
  saveSettings({ last_step_tool: '', last_step_title: '', last_step_utterance: '', last_agent_id: '' })
  await clearPending('brain-local')
  try {
    const got = await runDirectorTurn('brain-local', text)
    assert.notEqual(got.aborted, true, `${id} nicht abgebrochen`)
    assert.ok(got.hit?.reply, `${id} antwortet: ${text}`)
    const tool = got.hit.lastTool
    const ok = tool === id || (id === 'todo' && (tool === 'todo' || tool === 'tools'))
    assert.ok(ok, `${id} lastTool=${tool}`)
  } catch (err) {
    thrown.push(`${id}: ${err instanceof Error ? err.message : err}`)
  }
}
assert.equal(thrown.length, 0, `lokale Agenten warfen:\n  ${thrown.join('\n  ')}`)
saveSettings({ last_step_tool: '', last_step_title: '', last_step_utterance: '', last_agent_id: '' })
await clearPending('brain-local')
for (const row of await listReminders()) {
  await cancelNotify(notifyIdFromKey(row.id))
  await deleteReminder(row.id)
}

for (const [id, text] of Object.entries(AGENT_SWEEP)) {
  const routed = pickRoute(text)
  const evalId = routeForEval(text)
  const ok =
    routed === id ||
    evalId === id ||
    (id === 'todo' && (routed === 'todo' || evalId === 'tools'))
  assert.ok(ok, `Parser ${id}: „${text}“ → route=${routed} eval=${evalId}`)
}

const origFetch = globalThis.fetch
globalThis.fetch = (_url, init) =>
  new Promise((_, reject) => {
    const signal = init?.signal
    const boom = () => reject(abortError())
    if (signal?.aborted) {
      boom()
      return
    }
    signal?.addEventListener('abort', boom, { once: true })
  })

saveSettings({ groq_api_key: 'test-key', brain_v2: true, gemini_enabled: false, gemini_api_key: '' })
const conv = await createConversation('Abort')
const errors = []
const dones = []
const p = streamChat(conv.id, 'Erzähl was Schönes', {
  onError: (detail) => errors.push(detail),
  onDone: (payload) => dones.push(payload.assistant_message.content),
})
await new Promise((r) => setTimeout(r, 30))
abortCurrentTurn('Barge-in')
await p
assert.deepEqual(errors, [], `Barge-in kein Fehler: ${errors.join(' | ')}`)
assert.deepEqual(dones, [], `Barge-in keine Antwort: ${dones.join(' | ')}`)
const msgs = await listMessages(conv.id)
assert.equal(
  msgs.filter((m) => m.role === 'assistant').length,
  0,
  'kein Assistenten-Satz nach Abbruch',
)

const news = runDirectorTurn(conv.id, 'Hol die Nachrichten')
await new Promise((r) => setTimeout(r, 10))
abortCurrentTurn('Barge-in')
const dir = await news
assert.equal(dir.aborted, true, 'abgebrochener Lese-Agent kommt nicht als Miss')
assert.equal(dir.hit, null)

globalThis.fetch = origFetch
resetTurnAbort()
assert.equal(isTurnAborted(), false)

console.log(`test:agents-brain ok — ${Object.keys(LOCAL).length} lokale Agenten, ${Object.keys(AGENT_SWEEP).length} Parser, Abbruch stumm`)
process.exit(0)

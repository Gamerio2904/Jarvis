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
}

const { looksCommandish, utteranceFor, confirmedUtterance } = await import('../src/engine/tool-contract.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { neighborUtterances, unknownReply } = await import('../src/engine/command-neighbors.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const store = await import('../src/engine/store.ts')

const bag = (over = {}) => ({ minutes: null, time: null, date: null, title: null, state: null, ...over })

assert.equal(looksCommandish('Mach das Overlay für die Filme auf'), true)
assert.equal(looksCommandish('Öffne irgendwas mit der Watchliste'), true)
assert.equal(looksCommandish('Stell irgendwas mit der Watchliste an'), true)
assert.equal(looksCommandish('Was ist eine Watchliste'), false)
assert.equal(looksCommandish('Wie geht es dir'), false)
assert.equal(looksCommandish('Klick auf Speichern'), false)

assert.equal(utteranceFor({ tool: 'open_watchlist', args: bag() }), 'Öffne Watchliste')
assert.equal(confirmedUtterance({ tool: 'open_watchlist', args: bag() }, routeForEval), 'Öffne Watchliste')
assert.equal(utteranceFor({ tool: 'open_favorites', args: bag() }), 'Öffne Lieblinge')
assert.equal(confirmedUtterance({ tool: 'open_favorites', args: bag() }, routeForEval), 'Öffne Lieblinge')
assert.equal(utteranceFor({ tool: 'open_settings', args: bag() }), 'Öffne Einstellungen')
assert.equal(confirmedUtterance({ tool: 'open_settings', args: bag() }, routeForEval), 'Öffne Einstellungen')
assert.equal(utteranceFor({ tool: 'close_overlay', args: bag() }), 'Overlay zu')
assert.equal(
  utteranceFor({ tool: 'set_jarvis_flag', args: bag({ title: 'Gemini', state: 'off' }) }),
  'Gemini aus',
)

const neighbors = neighborUtterances('Stell irgendwas mit der Watchliste an', routeForEval)
assert.ok(neighbors.includes('Öffne Watchliste'))
assert.ok(neighbors.length <= 3)
assert.match(unknownReply('Stell irgendwas mit der Watchliste an', routeForEval), /nicht eingebaut/)

store.saveSettings({ groq_api_key: 'gsk_test', tool_propose: true })
let calls = 0
globalThis.fetch = async () => {
  calls += 1
  return {
    status: 200,
    headers: { forEach: () => {} },
    json: async () => ({ choices: [{ message: { content: JSON.stringify({ tool: 'none', args: bag() }) } }] }),
  }
}

const unknown = await runDirectorTurn('propose-18', 'Stell irgendwas mit der Watchliste an')
assert.match(unknown.hit?.reply || '', /nicht eingebaut/)
assert.match(unknown.hit?.reply || '', /Watchliste/)
assert.equal(unknown.hit?.lastTool, 'unknown')

calls = 0
const question = await runDirectorTurn('propose-18', 'Was ist eine Watchliste')
assert.equal(question.hit, null)
assert.equal(calls, 0, 'Wissensfrage zahlt keinen Vorschlag')

globalThis.fetch = async () => ({
  status: 200,
  headers: { forEach: () => {} },
  json: async () => ({
    choices: [{ message: { content: JSON.stringify({ tool: 'open_watchlist', args: bag() }) } }],
  }),
})
const proposed = await runDirectorTurn('propose-18', 'Mach das Overlay für die Filme auf')
assert.match(proposed.hit?.reply || '', /Öffne Watchliste/)
assert.match(proposed.hit?.reply || '', /Soll ich\?/)

console.log('OK test-propose-18')

import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Zwischen Einkauf und To-Do: eine Korrektur verschiebt den letzten Posten,
 * ein Aufgabenname bleibt ein Eintrag, und das Chip heißt nicht Einkauf.
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
  key: (index) => Object.keys(mem)[index] ?? null,
  get length() {
    return Object.keys(mem).length
  },
}

const { parseShopIntent, splitShopItems } = await import('../src/engine/shopping-parse.ts')
const { parseToolIntent } = await import('../src/engine/tools-parse.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const store = await import('../src/engine/store.ts')

assert.equal(parseShopIntent('Geschirrspüler auf die Liste')?.kind, 'add')
assert.equal(parseShopIntent('Nein auf die To-Do Liste'), null)
assert.equal(parseShopIntent('setze Müll runterbringen auf die To-Do-Liste'), null)
assert.equal(parseShopIntent('Nein auf die Einkaufsliste')?.kind, 'adopt-last')
assert.deepEqual(splitShopItems('Müll runterbringen'), ['Müll runterbringen'])
assert.deepEqual(splitShopItems('Milch Eier'), ['Milch', 'Eier'])

assert.equal(parseToolIntent('Nein auf die To-Do Liste')?.kind, 'todo_adopt_last')
assert.equal(parseToolIntent('Nein, auf die Aufgabenliste')?.kind, 'todo_adopt_last')
const muell = parseToolIntent('setze Müll runterbringen auf die To-Do-Liste')
assert.equal(muell?.kind, 'todo_create')
assert.equal(muell?.kind === 'todo_create' ? muell.title : '', 'Müll runterbringen')
const geschirr = parseToolIntent('verschiebe den Geschirrspüler auf die Aufgabenliste')
assert.equal(geschirr?.kind === 'todo_create' ? geschirr.title : '', 'Geschirrspüler')
assert.equal(parseToolIntent('Butter auf die Liste'), null)

const CONV = 'list-move'
store.saveSettings({ tool_propose: false, agent_network_v2: true })

const added = await runDirectorTurn(CONV, 'Geschirrspüler auf die Liste')
assert.match(added.hit?.reply || '', /Geschirrspüler/)
assert.equal(added.hit?.tool?.label, 'Einkauf')
assert.equal((await store.listShopping()).filter((row) => row.status === 'open').length, 1)

store.saveSettings({
  last_step_tool: 'shopping',
  last_step_title: added.hit?.tool?.preview || 'Geschirrspüler',
  last_step_utterance: 'Geschirrspüler auf die Liste',
})
const moved = await runDirectorTurn(CONV, 'Nein auf die To-Do Liste')
assert.match(moved.hit?.reply || '', /To-Do-Liste: Geschirrspüler/)
assert.doesNotMatch(moved.hit?.reply || '', /Nein/)
assert.equal(moved.hit?.tool?.tool, 'todo')
assert.equal(moved.hit?.tool?.label, 'To-Do')
assert.equal((await store.listShopping()).filter((row) => row.status === 'open').length, 0, 'weg von der Einkaufsliste')
assert.ok((await store.listTodos()).some((row) => row.title === 'Geschirrspüler' && row.status === 'open'))

const task = await runDirectorTurn(CONV, 'setze Müll runterbringen auf die To-Do-Liste')
assert.match(task.hit?.reply || '', /Müll runterbringen/)
assert.doesNotMatch(task.hit?.reply || '', /Runterbringen/)
assert.equal(task.hit?.tool?.label, 'To-Do')
assert.equal(task.hit?.tool?.tool, 'todo')
const todos = (await store.listTodos()).filter((row) => row.status === 'open')
assert.equal(todos.filter((row) => /runterbringen/i.test(row.title)).length, 1)

store.saveSettings({
  last_step_tool: 'todo',
  last_step_title: 'Müll runterbringen',
  last_step_utterance: 'setze Müll runterbringen auf die To-Do-Liste',
})
const back = await runDirectorTurn(CONV, 'Nein auf die Einkaufsliste')
assert.match(back.hit?.reply || '', /Einkaufsliste: Müll runterbringen/)
assert.equal(back.hit?.tool?.label, 'Einkauf')
assert.ok((await store.listShopping()).some((row) => row.status === 'open' && row.title === 'Müll runterbringen'))
assert.equal(
  (await store.listTodos()).filter((row) => row.status === 'open' && row.title === 'Müll runterbringen').length,
  0,
)

console.log('OK test-list-move')

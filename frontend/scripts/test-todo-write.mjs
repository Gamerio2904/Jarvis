// @ts-nocheck
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

const { parseToolIntent } = await import('../src/engine/tools-parse.ts')
const { parseCalendarIntent } = await import('../src/engine/calendar-parse.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { handleTools } = await import('../src/engine/tools.ts')
const store = await import('../src/engine/store.ts')

function friday(intent) {
  assert.equal(intent?.kind, 'todo_create')
  assert.equal(new Date(`${intent.deadlineDate}T12:00:00`).getDay(), 5)
}

const bare = parseToolIntent('hausaufgaben bis freitag')
friday(bare)
assert.equal(bare.title, 'Hausaufgaben')
assert.equal(bare.deadlineTime, null)
assert.equal(pickRoute('hausaufgaben bis freitag'), 'todo')

const lead = parseToolIntent('bis freitag hausaufgaben')
friday(lead)
assert.equal(lead.title, 'Hausaufgaben')

const entered = parseToolIntent('trag hausaufgaben bis freitag in die todo liste ein')
friday(entered)
assert.equal(entered.title, 'Hausaufgaben')
assert.equal(entered.fromShopping, true)
assert.equal(pickRoute('trag hausaufgaben bis freitag in die todo liste ein'), 'todo')

const placed = parseToolIntent('setz hausaufgaben bis freitag auf die todo liste')
friday(placed)
assert.equal(placed.title, 'Hausaufgaben')

const must = parseToolIntent('ich muss hausaufgaben bis freitag erledigen')
friday(must)
assert.equal(must.title, 'hausaufgaben erledigen')

assert.equal(parseToolIntent('zahnarzt am freitag'), null)
assert.equal(parseCalendarIntent('zahnarzt am freitag')?.kind, 'create')
assert.equal(parseToolIntent('setz hausaufgaben auf die todo liste')?.deadlineDate ?? null, null)

const hit = await handleTools('c-todo', 'hausaufgaben bis freitag')
assert.equal(hit.handled, true)
assert.match(hit.reply, /To-do-Liste: Hausaufgaben/)
assert.match(hit.reply, /Im Kalender/)
assert.match(hit.reply, /18:00/)
const todos = await store.listTodos()
assert.equal(todos.length, 1)
assert.equal(todos[0].title, 'Hausaufgaben')
assert.equal(todos[0].list_id, 'todo-list-general')
assert.equal(todos[0].deadline_time, '18:00')
assert.ok(todos[0].event_id)
const events = await store.listEvents()
assert.equal(events.length, 1)
assert.equal(events[0].todo_id, todos[0].id)
assert.equal(new Date(events[0].start_at).getHours(), 18)
assert.equal(new Date(events[0].start_at).getDay(), 5)

const dup = await handleTools('c-todo', 'hausaufgaben bis freitag')
assert.match(dup.reply, /schon offen/)
assert.equal((await store.listEvents()).length, 1)

const again = await handleTools('c-todo', 'ich muss hausaufgaben bis freitag erledigen')
assert.match(again.reply, /hausaufgaben erledigen/)
assert.equal((await store.listTodos()).filter((row) => row.status === 'open').length, 2)

await new Promise((resolve, reject) => {
  const req = indexedDB.open('jarvis-ondevice', 17)
  req.onerror = () => reject(req.error)
  req.onsuccess = () => {
    const db = req.result
    const tx = db.transaction('todo_lists', 'readwrite')
    tx.objectStore('todo_lists').delete('todo-list-general')
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  }
})
const restored = await store.addTodo('Liste fehlt', 'c-todo', { deadlineDate: '2026-10-24', deadlineTime: '09:00' })
assert.equal(restored.list_id, 'todo-list-general')
assert.ok((await store.listTodoLists()).some((row) => row.id === 'todo-list-general'))
assert.ok((await store.listEvents()).some((row) => row.todo_id === restored.id))

console.log('test-todo-write ok')
process.exit(0)

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

const { parseLocalDeadline, parseToolIntent, tidyTaskTitle } = await import('../src/engine/tools-parse.ts')
const { addTodo, deleteTodo, listEvents, listTodos, setTodoStatus } = await import('../src/engine/store.ts')
const { removeEvent, updateEventFromGui } = await import('../src/engine/calendar.ts')

const wednesday = new Date(2026, 9, 14, 12, 0, 0)
const spoken = 'bis Freitag nächste Woche 10 Uhr Hausaufgaben erledigen'
const later = parseLocalDeadline(spoken, wednesday)
assert.equal(later?.date, '2026-10-23')
assert.equal(later?.time, '10:00')
assert.equal(tidyTaskTitle(later?.remaining || ''), 'Hausaufgaben erledigen')

const sooner = parseLocalDeadline('bis Freitag 10 Uhr Hausaufgaben erledigen', wednesday)
assert.equal(sooner?.date, '2026-10-16')
assert.equal(sooner?.time, '10:00')

const shot = parseToolIntent('ich muss bis Freitag nächste Woche 10 Uhr Hausaufgaben erledigen')
assert.equal(shot?.kind, 'todo_create')
if (shot?.kind === 'todo_create') {
  assert.equal(shot.title, 'Hausaufgaben erledigen')
  assert.equal(shot.deadlineTime, '10:00')
  assert.match(shot.deadlineDate || '', /^\d{4}-\d{2}-\d{2}$/)
}

const kept = parseToolIntent('ich muss bis nächste woche freitag hausaufgaben machen')
assert.equal(kept?.kind, 'todo_create')
if (kept?.kind === 'todo_create') {
  assert.equal(kept.title, 'hausaufgaben machen')
  assert.equal(new Date(`${kept.deadlineDate}T12:00:00`).getDay(), 5)
}

const plain = parseToolIntent('Ich muss bis Dienstag Aufgabe 5 erledigen')
assert.equal(plain?.kind, 'todo_create')
if (plain?.kind === 'todo_create') assert.equal(plain.title, 'Aufgabe 5 erledigen')

if (shot?.kind !== 'todo_create' || !shot.deadlineDate) throw new Error('Satz ohne Deadline')
const todo = await addTodo(shot.title, 'conv', {
  deadlineDate: '2026-10-23',
  deadlineTime: shot.deadlineTime,
})
let events = await listEvents()
assert.equal(events.length, 1)
assert.equal(events[0].title, 'Hausaufgaben erledigen')
assert.equal(events[0].todo_id, todo.id)
const start = new Date(events[0].start_at)
assert.equal(start.getFullYear(), 2026)
assert.equal(start.getMonth(), 9)
assert.equal(start.getDate(), 23)
assert.equal(start.getHours(), 10)
assert.equal(start.getMinutes(), 0)
const linked = (await listTodos()).find((row) => row.id === todo.id)
assert.equal(linked?.event_id, events[0].id)

const moved = new Date(2026, 9, 22, 9, 30, 0, 0)
await updateEventFromGui(events[0].id, {
  title: 'Hausaufgaben erledigen',
  start: moved,
  end: new Date(moved.getTime() + 60 * 60_000),
})
const afterMove = (await listTodos()).find((row) => row.id === todo.id)
assert.equal(afterMove?.deadline_date, '2026-10-22')
assert.equal(afterMove?.deadline_time, '09:30')
assert.equal((await listEvents())[0].todo_id, todo.id)

await setTodoStatus(todo.id, 'done')
assert.equal((await listEvents()).length, 0)
assert.equal((await listTodos()).find((row) => row.id === todo.id)?.status, 'done')

const again = await addTodo('Hausaufgaben erledigen', 'conv', {
  deadlineDate: '2026-10-23',
  deadlineTime: '10:00',
})
events = await listEvents()
assert.equal(events.length, 1)
await removeEvent(events[0].id)
assert.equal((await listEvents()).length, 0)
assert.equal((await listTodos()).some((row) => row.id === again.id), false)

const third = await addTodo('Zimmer aufräumen', 'conv', {
  deadlineDate: '2026-10-24',
  deadlineTime: '11:00',
})
assert.equal((await listEvents()).length, 1)
await deleteTodo(third.id)
assert.equal((await listEvents()).length, 0)
assert.equal((await listTodos()).some((row) => row.id === third.id), false)

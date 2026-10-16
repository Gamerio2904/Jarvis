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

const { splitShopItems, parseShopIntent } = await import('../src/engine/shopping-parse.ts')
const { parseToolIntent } = await import('../src/engine/tools-parse.ts')
const { isTodoQuery, openTodos, todoSpeech } = await import('../src/engine/tablet-todos.ts')
const { applyHomeDrop, defaultHomeLayout, parseHomeLayout, renameHomeFolder, serializeHomeLayout } = await import('../src/engine/home-layout.ts')
const { handleIdea } = await import('../src/engine/idea.ts')
const { listIdeas, loadSettings, saveSettings } = await import('../src/engine/store.ts')

assert.deepEqual(splitShopItems('Milch Eier und Kuchen'), ['Milch', 'Eier', 'Kuchen'])
assert.deepEqual(splitShopItems('Rote Paprika und Milch'), ['Rote Paprika', 'Milch'])
assert.deepEqual(parseShopIntent('Milch Eier und Kuchen auf die Einkaufsliste')?.items, ['Milch', 'Eier', 'Kuchen'])
assert.deepEqual(parseShopIntent('Hafermilch und Mehl auf die Liste')?.items, ['Hafermilch', 'Mehl'])

const must = parseToolIntent('Ich muss bis Dienstag Aufgabe 5 erledigen')
assert.equal(must?.kind, 'todo_create')
assert.equal(must?.title, 'Aufgabe 5 erledigen')
assert.match(must?.deadlineDate || '', /^\d{4}-\d{2}-\d{2}$/)
assert.equal(new Date(`${must.deadlineDate}T12:00:00`).getDay(), 2)
const week = parseToolIntent('ich muss bis nächste woche freitag hausaufgaben machen')
assert.equal(week?.kind, 'todo_create')
assert.equal(week?.title, 'hausaufgaben machen')
assert.equal(new Date(`${week.deadlineDate}T12:00:00`).getDay(), 5)
const note = parseToolIntent('neue notiz: ich spitte fire du bist ein lire')
assert.equal(note?.kind, 'note_create')
assert.equal(note?.body, 'ich spitte fire du bist ein lire')
assert.equal(parseShopIntent('was muss ich noch einkaufen')?.kind, 'list')
assert.equal(parseShopIntent('was muss ich einkaufen?')?.kind, 'list')
assert.equal(parseToolIntent('Was hab ich noch zu tun')?.kind, 'todo_list')
assert.equal(isTodoQuery('Was hab ich noch zu tun'), true)

const todos = [
  { id: '1', title: 'Aufgabe 5 erledigen', status: 'open', deadline_date: must.deadlineDate, deadline_time: null, created_at: '1', updated_at: '1' },
  { id: '2', title: 'Klo', status: 'done', deadline_date: null, deadline_time: null, created_at: '2', updated_at: '2' },
]
assert.deepEqual(openTodos(todos).map((row) => row.title), ['Aufgabe 5 erledigen'])
assert.match(todoSpeech(todos), /Aufgabe 5 erledigen bis/)
assert.doesNotMatch(todoSpeech(todos), /Klo/)

const layout = defaultHomeLayout()
const chat = layout.cells.findIndex((cell) => cell?.kind === 'app' && cell.id === 'chat')
const voice = layout.cells.findIndex((cell) => cell?.kind === 'app' && cell.id === 'voice')
const swapped = applyHomeDrop(layout, chat, voice, 400)
assert.equal(swapped.cells[chat]?.kind === 'app' && swapped.cells[chat].id, 'voice')
assert.equal(swapped.cells[voice]?.kind === 'app' && swapped.cells[voice].id, 'chat')
const merged = applyHomeDrop(layout, chat, voice, 1000)
assert.equal(merged.cells[voice]?.kind, 'folder')
assert.equal(merged.cells[chat], null)
if (merged.cells[voice]?.kind === 'folder') {
  assert.deepEqual(merged.cells[voice].folder.apps, ['chat', 'voice'])
  const named = renameHomeFolder(merged, merged.cells[voice].folder.id, 'Alltag')
  const cell = named.cells[voice]
  assert.equal(cell?.kind === 'folder' && cell.folder.name, 'Alltag')
  const again = parseHomeLayout(serializeHomeLayout(named))
  const kept = again.cells.find((row) => row?.kind === 'folder')
  assert.equal(kept?.kind === 'folder' && kept.folder.name, 'Alltag')
}

saveSettings({ plan_phase: '', plan_spar_step: '', plan_idea_id: '', plan_conversation_id: '' })
const opened = await handleIdea('spar', 'Plane eine neue app')
assert.match(opened.reply || '', /konkret können/)
assert.equal(loadSettings().plan_spar_step, 'goal')
assert.equal((await listIdeas()).find((row) => /neue app/i.test(row.title))?.plan?.sprints.length, 0)

const goal = await handleIdea('spar', 'Sie soll meine Aufgaben in einem Sprint zeigen')
assert.match(goal.reply || '', /Für wen/)
const who = await handleIdea('spar', 'Für mich allein zu Hause')
assert.match(who.reply || '', /erste nutzbare Scheibe/)
const slice = await handleIdea('spar', 'Eine Liste mit einem Knopf Fertig')
assert.match(slice.reply || '', /Sprint 1/)
const done = await handleIdea('spar', 'Wenn ich eine Aufgabe sehe und abhaken kann')
assert.match(done.reply || '', /nutzbar/)
const idea = (await listIdeas()).find((row) => row.plan?.sprints.some((sprint) => /Liste/.test(sprint.ziel)))
assert.equal(idea?.plan?.sprints[0]?.lieferumfang[0]?.task.includes('Liste'), true)
assert.equal(idea?.plan?.anforderungen.some((row) => row.satz === 'Plane eine neue app'), false)

const next = await handleIdea('spar', 'nächster Sprint Anmeldung bauen')
assert.match(next.reply || '', /Sprint 2/)
assert.equal(loadSettings().plan_spar_step, 'done')

console.log('home-plan ok')

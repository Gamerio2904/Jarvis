// @ts-nocheck
import assert from 'node:assert/strict'

const { folderPageCount, folderPageSlots } = await import('../src/engine/home-layout.ts')
const { asksForRecipe, formatRecipe, formatStepGuide } = await import('../src/engine/step-guide.ts')
const { parseCalendarIntent } = await import('../src/engine/calendar-parse.ts')
const { parseShopIntent } = await import('../src/engine/shopping-parse.ts')
const { splitIntents } = await import('../src/engine/split-intents.ts')
const { parseToolIntent } = await import('../src/engine/tools-parse.ts')
const { leadReminderMinutes } = await import('../src/engine/reminders.ts')

assert.equal(folderPageCount(0), 1)
assert.equal(folderPageCount(9), 1)
assert.equal(folderPageCount(10), 2)
const full = folderPageSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 0)
assert.equal(full.filter(Boolean).length, 9)
assert.equal(full[8], 'i')
const tail = folderPageSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 1)
assert.deepEqual(tail.slice(0, 2), ['j', null])
assert.equal(tail.filter(Boolean).length, 1)
assert.equal(folderPageSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 2)[0], 'a')
assert.equal(folderPageSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], -1)[0], 'j')

const wall = 'Step 1 — Step 1 — Den Ofen auf 200 Grad vorheizen. Step 2 — Step 2 — Den Brokkoli in Röschen kochen. 🥦'
const recipe = formatRecipe(wall, 'ich will brokkoli auflauf machen')
assert.match(recipe, /^Brokkoli auflauf – Schritt für Schritt/)
assert.match(recipe, /Schritt 1:/)
assert.match(recipe, /Schritt 2:/)
assert.doesNotMatch(recipe, /Step\s+1 — Step/)
assert.doesNotMatch(recipe, /🥦/)
assert.match(recipe, /Eine Frage noch/)

const shaped = formatRecipe(`Brokkoli-Auflauf – Schritt für Schritt

Zutaten
- 500 g Brokkoli

Schritt 1: Backofen vorheizen
Heize den Ofen auf 200 Grad.

Eine Frage noch: Mit Kartoffeln?`, 'brokkoli auflauf')
assert.match(shaped, /Zutaten/)
assert.match(shaped, /500 g Brokkoli/)
assert.match(shaped, /Mit Kartoffeln/)
assert.doesNotMatch(shaped, /Eine Frage noch: Möchten Sie/)

assert.equal(asksForRecipe('suche im internet nach kuchenrezepten'), false)
assert.equal(asksForRecipe('ich möchte einen marmorkuchen backen'), true)
const cake = formatStepGuide('Verrühren Sie Butter mit Zucker. Danach rühren Sie die Eier unter. Backen Sie das Ganze.')
assert.match(cake, /^Step 1 — /)
assert.doesNotMatch(cake, /Step 1 — Step 1/)

const now = new Date(2026, 9, 20, 9, 0, 0)
const moved = parseCalendarIntent('Dr. Weber hat mich auf morgen 15 Uhr umgebucht, halbe Stunde vorher muss ich los', now)
assert.equal(moved?.kind, 'move')
assert.equal(moved?.createIfMissing, true)
assert.equal(moved?.query, 'Dr. Weber')
assert.deepEqual(moved?.remind_offsets_min, [30])
assert.equal(moved?.start.getDate(), 21)
assert.equal(moved?.start.getHours(), 15)

const parts = splitIntents('was hab ich morgen eigentlich so vor, achso und wir brauchen noch milch eier und brot')
assert.equal(parts.length, 2)
const shop = parseShopIntent(parts[1])
assert.equal(shop?.kind, 'add')
assert.deepEqual(shop?.items, ['Milch', 'Eier', 'Brot'])

const todo = parseToolIntent('bis freitag hausaufgaben')
assert.equal(todo?.kind, 'todo_create')
assert.equal(todo?.title, 'Hausaufgaben')
assert.equal(new Date(`${todo.deadlineDate}T12:00:00`).getDay(), 5)

assert.equal(leadReminderMinutes('erinnere mich 24 stunden davor'), 24 * 60)
assert.equal(leadReminderMinutes('bis freitag hausaufgaben'), null)

console.log('test-folder-recipe ok')

// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(String(k), String(v))
  },
  removeItem: (k) => {
    mem.delete(k)
  },
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}

const {
  CAL_THEMES,
  classifyEventTheme,
  eventTheme,
  parseThemeId,
  themesForDay,
} = await import('../src/engine/calendar-theme.ts')
const { handleCalendar, createEventFromGui, sameDay } = await import('../src/engine/calendar.ts')
const { addEvent, listEvents, clearPending } = await import('../src/engine/store.ts')

assert.equal(CAL_THEMES.length, 8)
assert.equal(classifyEventTheme('Teammeeting'), 'arbeit')
assert.equal(classifyEventTheme('Vorlesung Statistik'), 'uni')
assert.equal(classifyEventTheme('Mamas Geburtstag'), 'geburtstag')
assert.equal(classifyEventTheme('Oma zum Kaffee'), 'familie')
assert.equal(classifyEventTheme('Zahnarzt'), 'arzt')
assert.equal(classifyEventTheme('Fußballtraining'), 'sport')
assert.equal(classifyEventTheme('Flug nach Rom'), 'reise')
assert.equal(classifyEventTheme('Einkaufen'), 'sonstiges')
assert.equal(classifyEventTheme('Klausur Mathe', 'Campus'), 'uni')
assert.equal(eventTheme({ title: 'Zahnarzt' }), 'arzt')
assert.equal(eventTheme({ title: 'Irgendwas', theme: 'uni' }), 'uni')
assert.equal(parseThemeId('arbeit'), 'arbeit')
assert.equal(parseThemeId('Thema: Uni'), 'uni')
assert.equal(parseThemeId('xyz'), null)

const day = new Date(2026, 8, 22, 12)
const ids = themesForDay(
  [
    { title: 'Zahnarzt', start_at: new Date(2026, 8, 22, 15).toISOString() },
    { title: 'Teammeeting', start_at: new Date(2026, 8, 22, 18).toISOString() },
    { title: 'Milch', start_at: new Date(2026, 8, 23, 9).toISOString() },
  ],
  day,
  sameDay,
)
assert.deepEqual(ids, ['arzt', 'arbeit'])

await clearPending('cal-theme')
const created = await handleCalendar('cal-theme', 'Termin morgen 15 Uhr Zahnarzt')
assert.equal(created.handled, true)
const row = (await listEvents()).find((e) => e.title.includes('Zahnarzt'))
assert.ok(row)
assert.equal(row.theme, 'arzt')

const gui = await createEventFromGui({
  title: 'Vorlesung Statistik',
  start: new Date(Date.now() + 86400_000),
  remind_offsets_min: [0],
})
assert.equal(gui.theme, 'uni')

const old = await addEvent({ title: 'Mamas Geburtstag', start_at: new Date(Date.now() + 2 * 86400_000).toISOString() })
assert.equal(old.theme, undefined)
assert.equal(eventTheme(old), 'geburtstag')

const { cancelEventNotifies } = await import('../src/engine/calendar.ts')
for (const e of await listEvents()) await cancelEventNotifies(e)

console.log('OK test-calendar-theme')

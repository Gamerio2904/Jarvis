// @ts-nocheck
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

const here = dirname(fileURLToPath(import.meta.url))
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8')

const { APP_VERSION } = await import('../src/engine/store.ts')
const { PKG_VERSION, versionCodeOf } = await import('./app-version.mjs')
assert.equal(APP_VERSION, '18.17.0')
assert.equal(PKG_VERSION, '18.17.0')
assert.equal(versionCodeOf('18.17.0'), 181700)

const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { parseCalendarIntent } = await import('../src/engine/calendar-parse.ts')
const { handleCalendar, cancelEventNotifies, sameDay } = await import('../src/engine/calendar.ts')
const { eventsToIcs, icsToEvents, looksLikeIcs } = await import('../src/engine/calendar-ics.ts')
const { expandEvents, firstOverlap, eventDurationMs } = await import('../src/engine/calendar-occur.ts')
const { overlappingEvents } = await import('../src/engine/watchdog.ts')
const { buildBackup, applyBackup, asBackup, previewBackup, parseImportPayload } = await import('../src/engine/backup.ts')
const { addEvent, listEvents, deleteEvent, saveSettings, DEFAULT_SETTINGS, clearPending } = await import(
  '../src/engine/store.ts'
)

assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)

assert.equal(GOLD_EXPECT['jeden Montag 18 Uhr Training'], 'calendar')
assert.equal(GOLD_EXPECT['Kalender als ICS'], 'calendar')
assert.equal(GOLD_EXPECT['Hausstand exportieren'], 'backup')
assert.equal(GOLD_EXPECT['Jeden Dienstag Müll'], 'reminder')
assert.equal(pickRoute('jeden Montag 18 Uhr Training'), 'calendar')
assert.equal(pickRoute('Kalender als ICS'), 'calendar')
assert.equal(pickRoute('Hausstand exportieren'), 'backup')
assert.equal(pickRoute('Jeden Dienstag Müll'), 'reminder')
assert.equal(pickRoute('Termin morgen 15 Uhr Zahnarzt'), 'calendar')
assert.equal(pickRoute('was steht heute so an?'), 'calendar')
assert.equal(pickRoute('Samstag Geburtstag Jakob 18 Uhr'), 'calendar')
assert.equal(pickRoute('Verschieb Jakob auf Sonntag 19 Uhr'), 'calendar')

const frozen = new Date(2026, 8, 22, 10, 0)
const weekly = parseCalendarIntent('jeden Montag 18 Uhr Training', frozen)
assert.equal(weekly?.kind, 'create')
if (weekly?.kind === 'create') {
  assert.equal(weekly.title, 'Training')
  assert.equal(weekly.recur, 'weekly')
  assert.equal(weekly.start.getHours(), 18)
  assert.equal(weekly.start.getDay(), 1)
}

const icsIntent = parseCalendarIntent('Kalender als ICS', frozen)
assert.equal(icsIntent?.kind, 'export_ics')
assert.equal(parseCalendarIntent('Hausstand exportieren', frozen), null)

const span = parseCalendarIntent('Termin morgen von 15 bis 16 Uhr Zahnarzt', frozen)
assert.equal(span?.kind, 'create')
if (span?.kind === 'create') {
  assert.equal(span.title, 'Zahnarzt')
  assert.equal(span.start.getHours(), 15)
  assert.ok(span.end)
  assert.equal(span.end.getHours(), 16)
}

const allDay = parseCalendarIntent('Termin ganztägig Urlaub am 3.3.2027', frozen)
assert.equal(allDay?.kind, 'create')
if (allDay?.kind === 'create') {
  assert.ok(allDay.allDay)
  assert.match(allDay.title, /Urlaub/i)
}

saveSettings(DEFAULT_SETTINGS)
await clearPending('cal-1817')
const made = await handleCalendar('cal-1817', 'jeden Montag 18 Uhr Training')
assert.equal(made.handled, true)
assert.match(made.reply || '', /Training/)
assert.match(made.reply || '', /jede Woche/)
const rows = await listEvents()
const train = rows.find((e) => e.title === 'Training')
assert.ok(train)
assert.equal(train.recur, 'weekly')
assert.ok(eventDurationMs(train) >= 60 * 60_000)

const from = new Date(2026, 8, 1)
const until = new Date(2026, 10, 1)
const occ = expandEvents([train], from, until)
assert.ok(occ.length >= 4, `Serie muss mehrere Montage zeigen, war ${occ.length}`)

const clashA = {
  id: 'a',
  title: 'Zahnarzt',
  start_at: new Date(2026, 8, 23, 15).toISOString(),
  created_at: '',
  updated_at: '',
}
const clashB = {
  id: 'b',
  title: 'Meeting',
  start_at: new Date(2026, 8, 23, 15, 30).toISOString(),
  created_at: '',
  updated_at: '',
}
assert.ok(firstOverlap(clashB, [clashA]))
const ov = overlappingEvents([clashA, clashB], new Date(2026, 8, 23, 8).getTime())
assert.ok(ov)
assert.match(ov.question, /Zahnarzt/)

const ics = eventsToIcs([train])
assert.ok(looksLikeIcs(ics))
assert.match(ics, /BEGIN:VEVENT/)
assert.match(ics, /RRULE:FREQ=WEEKLY/)
assert.match(ics, /SUMMARY:Training/)
const back = icsToEvents(ics)
assert.equal(back[0]?.title, 'Training')
assert.equal(back[0]?.recur, 'weekly')

saveSettings({ ...DEFAULT_SETTINGS, groq_api_key: 'g-test' })
const ev = await addEvent({
  title: 'Hausstand-Zahnarzt',
  start_at: new Date(2026, 9, 5, 15).toISOString(),
  remind_offsets_min: [1440, 120],
  place: 'Bahnhofstraße',
})
const snap = await buildBackup(false)
assert.ok(snap.events.some((e) => e.title === 'Hausstand-Zahnarzt'))
assert.ok(snap.calendar_ics && looksLikeIcs(snap.calendar_ics))
assert.match(previewBackup(snap).message, /Termine/)
assert.equal(previewBackup(snap).events >= 1, true)
const parsed = asBackup(JSON.parse(JSON.stringify(snap)))
assert.ok(parsed?.events.some((e) => e.title === 'Hausstand-Zahnarzt'))
const icsOnly = asBackup({
  backup_version: 1,
  settings: { groq_api_key: 'keep' },
  events: [],
  calendar_ics: eventsToIcs([ev]),
  memory: [],
  reminders: [],
  notes: [],
  todos: [],
  shopping: [],
})
assert.ok(icsOnly?.events.some((e) => e.title === 'Hausstand-Zahnarzt'))
const choice = parseImportPayload(eventsToIcs([ev]), 'kalender.ics')
assert.equal(choice?.kind, 'ics')

await deleteEvent(ev.id)
await applyBackup({
  ...snap,
  events: snap.events.filter((e) => e.title === 'Hausstand-Zahnarzt'),
  calendar_ics: eventsToIcs(snap.events.filter((e) => e.title === 'Hausstand-Zahnarzt')),
})
const restored = (await listEvents()).find((e) => e.title === 'Hausstand-Zahnarzt')
assert.ok(restored, 'Termin muss aus Hausstand zurückkommen')
assert.deepEqual(restored.remind_offsets_min, [1440, 120])

assert.match(src('src/engine/backup.ts'), /calendar_ics/)
assert.match(src('src/ui/SettingsScreen.tsx'), /\.ics/)
assert.match(src('src/ui/Calendar.tsx'), /shareOrDownloadIcs/)
assert.match(src('src/ui/SettingsScreen.tsx'), /Termine/)

for (const e of await listEvents()) await cancelEventNotifies(e)
console.log('test-18.17 ok')
process.exit(0)

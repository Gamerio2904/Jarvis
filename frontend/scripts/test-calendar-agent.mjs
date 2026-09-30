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

const { normalizeUtterance } = await import('../src/engine/utterance.ts')
const { parseCalendarIntent, normalizeCalendarSpeech, splitTitlePlace } = await import('../src/engine/calendar-parse.ts')
const { handleCalendar, sameDay, takeCalendarFocus } = await import('../src/engine/calendar.ts')
const { getPending, listEvents, clearPending } = await import('../src/engine/store.ts')
const { rewriteFollowUp } = await import('../src/engine/last-step.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { scrubReply } = await import('../src/engine/guards.ts')

const frozen = new Date(2026, 8, 22, 21, 16)

assert.equal(normalizeCalendarSpeech('SamestagGeburtstagJakob18Uhrher'), 'Samstag Geburtstag Jakob 18 Uhr')
assert.equal(normalizeUtterance('SamestagGeburtstagJakob18Uhrher'), 'Samstag Geburtstag Jakob 18 Uhr')
assert.deepEqual(splitTitlePlace('Geburtstag Jakob'), { title: 'Geburtstag Jakob' })
assert.deepEqual(splitTitlePlace('Zahnarzt Bahnhofstraße'), { title: 'Zahnarzt', place: 'Bahnhofstraße' })

const bare = parseCalendarIntent('Samstag Geburtstag Jakob 18 Uhr', frozen)
assert.equal(bare?.kind, 'create')
if (bare?.kind === 'create') {
  assert.equal(bare.title, 'Geburtstag Jakob')
  assert.equal(bare.start.getFullYear(), 2026)
  assert.equal(bare.start.getMonth(), 8)
  assert.equal(bare.start.getDate(), 26)
  assert.equal(bare.start.getHours(), 18)
}

const glued = parseCalendarIntent('SamestagGeburtstagJakob18Uhrher', frozen)
assert.equal(glued?.kind, 'create')
if (glued?.kind === 'create') {
  assert.equal(glued.title, 'Geburtstag Jakob')
  assert.equal(glued.start.getDate(), 26)
  assert.equal(glued.start.getHours(), 18)
}

const titled = parseCalendarIntent('Termin Samstag Geburtstag Jakob 18 Uhr', frozen)
assert.equal(titled?.kind, 'create')
if (titled?.kind === 'create') {
  assert.equal(titled.title, 'Geburtstag Jakob')
  assert.equal(titled.start.getDate(), 26)
}

assert.equal(parseCalendarIntent('Wetter Samstag', frozen), null)
assert.equal(parseCalendarIntent('morgen 8 Uhr Steuer', frozen), null)
assert.equal(parseCalendarIntent('Was steht am Samstag an?', frozen)?.kind, 'list')
assert.equal(pickRoute('Samstag Geburtstag Jakob 18 Uhr'), 'calendar')
assert.equal(pickRoute(normalizeUtterance('SamestagGeburtstagJakob18Uhrher')), 'calendar')
assert.equal(pickRoute('Verschieb Jakob auf Sonntag 19 Uhr'), 'calendar')

assert.match(scrubReply('Der Termin für Samstags 18 Uhr steht.'), /nicht ausgeführt/)

await clearPending('cal-agent')
const expectSat = parseCalendarIntent('Samstag Geburtstag Jakob 18 Uhr')
assert.equal(expectSat?.kind, 'create')
const made = await handleCalendar('cal-agent', 'Samstag Geburtstag Jakob 18 Uhr')
assert.equal(made.handled, true)
assert.match(made.reply || '', /Geburtstag Jakob/)
assert.match(made.reply || '', /Kalender/)
assert.equal(made.tool?.action, 'create')
if (expectSat?.kind === 'create') {
  const focus = `${expectSat.start.getFullYear()}-${String(expectSat.start.getMonth() + 1).padStart(2, '0')}-${String(expectSat.start.getDate()).padStart(2, '0')}`
  assert.equal(made.tool?.result?.focus, focus)
  assert.equal(takeCalendarFocus(), focus)
}

const rows = await listEvents()
const hit = rows.find((e) => e.title === 'Geburtstag Jakob')
assert.ok(hit, 'Termin muss wirklich liegen')
assert.equal(new Date(hit.start_at).getHours(), 18)
assert.equal(new Date(hit.start_at).getDay(), 6)
assert.equal(hit.theme, 'geburtstag')
if (expectSat?.kind === 'create') assert.ok(sameDay(new Date(hit.start_at), expectSat.start))

const moved = await handleCalendar('cal-agent', 'Verschieb Jakob auf Sonntag 19 Uhr')
assert.equal(moved.handled, true)
assert.match(moved.reply || '', /verschoben/)
const after = (await listEvents()).find((e) => e.title === 'Geburtstag Jakob')
assert.ok(after)
assert.equal(new Date(after.start_at).getDay(), 0)
assert.equal(new Date(after.start_at).getHours(), 19)

const listed = await handleCalendar('cal-agent', 'was steht diese Woche an?')
assert.equal(listed.handled, true)
assert.match(listed.reply || '', /Geburtstag Jakob|Termine/)

const icsAsk = await handleCalendar('cal-agent', 'Kalender als ICS')
assert.equal(icsAsk.handled, true)
assert.equal(icsAsk.tool?.action, 'export')

const satz = 'Erinnerung 7.10. für Auslands Praktikum Erinnerung 18 Uhr am Tag davor'
const datum = parseCalendarIntent(satz, frozen)
assert.equal(datum?.kind, 'create')
if (datum?.kind === 'create') {
  assert.equal(datum.title, 'Auslands Praktikum')
  assert.equal(datum.allDay, true)
  assert.equal(datum.start.getFullYear(), 2026)
  assert.equal(datum.start.getMonth(), 9)
  assert.equal(datum.start.getDate(), 7)
  assert.equal(datum.start.getHours(), 0)
  assert.deepEqual(datum.remind_offsets_min, [360])
  assert.equal(datum.remindLabel, '18:00 am Tag davor')
}
assert.equal(pickRoute(satz), 'calendar')
assert.equal(pickRoute('erinner mich morgen um 9 an Steuer'), 'reminder')
const nurTag = parseCalendarIntent('Erinnerung 7.10. für Auslands Praktikum', frozen)
assert.equal(nurTag?.kind, 'create')
if (nurTag?.kind === 'create') {
  assert.equal(nurTag.title, 'Auslands Praktikum')
  assert.equal(nurTag.start.getDate(), 7)
  assert.equal(nurTag.remind_offsets_min, undefined)
}
assert.equal(
  rewriteFollowUp('Ja', {
    last_step_tool: 'proposal',
    last_step_utterance: satz,
  }),
  null,
)

await clearPending('cal-erinnerung')
const gelegt = await handleCalendar('cal-erinnerung', satz)
assert.match(gelegt.reply || '', /Auslands Praktikum/)
assert.match(gelegt.reply || '', /18:00 am Tag davor/)
assert.doesNotMatch(gelegt.reply || '', /Wann soll ich Sie erinnern/)
assert.equal(await getPending('cal-erinnerung'), undefined)
const praktikum = (await listEvents()).find((e) => e.title === 'Auslands Praktikum')
assert.ok(praktikum)
assert.equal(new Date(praktikum.start_at).getDate(), 7)
assert.equal(new Date(praktikum.start_at).getMonth(), 9)
assert.deepEqual(praktikum.remind_offsets_min, [360])
assert.equal(praktikum.all_day, true)

const { addEvent } = await import('../src/engine/store.ts')
const { splitIntents } = await import('../src/engine/split-intents.ts')
const { parseRemoveBundle } = await import('../src/engine/calendar-parse.ts')
assert.equal(splitIntents('Plane das: Einkauf, Liste schreiben und Route prüfen').length, 1)
assert.equal(splitIntents('Zahnarzttermin und die wöchentlichen Training entfernen').length, 1)
const bundle = parseRemoveBundle('Zahnarzttermin und die wöchentlichen Training entfernen')
assert.equal(bundle?.length, 2)
assert.equal(bundle?.[1]?.recur, 'weekly')
assert.equal(pickRoute('Zahnarzttermin und die wöchentlichen Training entfernen'), 'calendar')
assert.match(
  scrubReply('Fertig. Der Zahnarzttermin und die wöchentlichen Trainings sind aus dem Kalender entfernt.'),
  /nicht ausgeführt/,
)
assert.match(scrubReply('Die Erinnerungen sind gelöscht.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich habe keinen Zugriff auf die aktuelle Anzeige, um den Plan zu löschen.'), /nicht ausgeführt/)
assert.match(normalizeUtterance('Lösche die wöchentlichentrainingserinnerungen'), /wöchentlichen trainings erinnerungen/)
await addEvent({ title: 'Zahnarzt', start_at: new Date(2026, 8, 30, 9).toISOString() })
await addEvent({ title: 'Training', start_at: new Date(2026, 8, 28, 18).toISOString(), recur: 'weekly' })
const removed = await handleCalendar('cal-agent', 'Zahnarzttermin und die wöchentlichen Training entfernen')
assert.match(removed.reply || '', /Weg: Zahnarzt, Training/)
assert.equal((await listEvents()).some((e) => e.title === 'Zahnarzt' || e.title === 'Training'), false)
const missing = await handleCalendar('cal-agent', 'Zahnarzttermin und die wöchentlichen Training entfernen')
assert.match(missing.reply || '', /Nichts davon steht im Kalender/)
assert.doesNotMatch(missing.reply || '', /^Weg:/)

const { cancelEventNotifies } = await import('../src/engine/calendar.ts')
for (const e of await listEvents()) await cancelEventNotifies(e)
console.log('test-calendar-agent ok')
process.exit(0)

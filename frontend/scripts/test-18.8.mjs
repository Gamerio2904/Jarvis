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

const { parseRemindOffsets, formatRemindOffsets, parseCalendarIntent } = await import('../src/engine/calendar-parse.ts')
const { handleCalendar, eventNotifyMinutes } = await import('../src/engine/calendar.ts')
const { addEvent, addReminder, listEvents, listReminders, loadSettings, saveSettings, getPending, clearPending } =
  await import('../src/engine/store.ts')
const { captureHouse, restoreHouse } = await import('../src/engine/debug-house.ts')
const { setDebugRunActive } = await import('../src/engine/debug-flag.ts')
const { TEST_COPY_GROUPS, PROBE_COPY_GROUPS, allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { unassignedCopyTitles, groupsForLane, PINNED_PROBE_LANE, initialProbeLane } = await import('../src/engine/probe-lanes.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { sanitizeDebugPicked, restoreDebugPicked } = await import('../src/engine/debug-picked.ts')

assert.deepEqual(parseRemindOffsets('24 Stunden davor und 2 Stunden davor')?.minutes, [1440, 120])
assert.deepEqual(parseRemindOffsets('eine Stunde davor, 15 Minuten davor')?.minutes, [60, 15])
assert.equal(parseRemindOffsets('keine Erinnerung')?.kind, 'none')
assert.equal(parseRemindOffsets('am Termin')?.kind, 'at_start')
assert.equal(parseRemindOffsets('in 10 Minuten Milch'), null)
assert.equal(parseRemindOffsets('Wetter heute'), null)
assert.match(formatRemindOffsets([1440, 120]), /1 Tag/)
assert.match(formatRemindOffsets([1440, 120]), /2 Stunden/)

const conv = 'cal-18-8'
await clearPending(conv)
const created = await handleCalendar(conv, 'Termin morgen 15 Uhr Zahnarzt')
assert.match(created.reply || '', /Wann soll ich Sie erinnern/)
assert.equal((await getPending(conv))?.action, 'remind_offsets')
const reminded = await handleCalendar(conv, '24 Stunden davor und 2 Stunden davor')
assert.match(reminded.reply || '', /1 Tag|24 Stunden/)
assert.equal(await getPending(conv), undefined)
const row = (await listEvents()).find((e) => e.title.includes('Zahnarzt'))
assert.ok(row)
assert.equal(row.theme, 'arzt')
assert.deepEqual(eventNotifyMinutes(row), [1440, 120])

await clearPending(conv)
setDebugRunActive(true)
const debugCreate = await handleCalendar(conv, 'Termin morgen 9 Uhr Teammeeting')
setDebugRunActive(false)
assert.doesNotMatch(debugCreate.reply || '', /Wann soll ich/)
assert.equal(await getPending(conv), undefined)

saveSettings({ gemini_api_key: 'keep-me', research_opt_in: false })
const before = await addReminder({ title: 'alt', due_at: new Date(Date.now() + 3600_000).toISOString() })
const snap = await captureHouse()
await addReminder({ title: 'debug-timer', due_at: new Date(Date.now() + 120_000).toISOString(), kind: 'timer' })
await addEvent({ title: 'Debug-Zahnarzt', start_at: new Date(Date.now() + 86400_000).toISOString() })
saveSettings({ research_opt_in: true })
assert.ok((await listReminders()).some((r) => r.title === 'debug-timer'))
await restoreHouse(snap)
assert.equal((await listReminders()).some((r) => r.title === 'debug-timer'), false)
assert.equal((await listEvents()).some((e) => e.title === 'Debug-Zahnarzt'), false)
assert.ok((await listReminders()).some((r) => r.id === before.id))
assert.equal(loadSettings().gemini_api_key, 'keep-me')
assert.equal(loadSettings().research_opt_in, false)

assert.deepEqual(unassignedCopyTitles(), [])
assert.equal(PROBE_COPY_GROUPS.length, 13)
assert.equal(PROBE_COPY_GROUPS[0].title, 'Memory-10')
assert.ok(TEST_COPY_GROUPS.some((g) => g.title === '18.8 Debug & Termin'))
assert.ok(!TEST_COPY_GROUPS.some((g) => /^V\d/.test(g.title)))
assert.ok(groupsForLane('heute').some((g) => g.title === '18.8 Debug & Termin'))
assert.equal(PINNED_PROBE_LANE, 'lauf')
assert.equal(initialProbeLane('lauf', 'heute'), 'lauf', 'Öffne Debug landet auf Lauf, nicht auf Heute')
assert.equal(groupsForLane('lauf').length, 0)
const copy = allTestCopyTexts()
for (const p of TEST_PROMPTS) assert.ok(copy.includes(p), p)
assert.equal(pickRoute('Termin Freitag 10 Uhr Teammeeting'), 'calendar')
assert.equal(pickRoute('Timer 1 Minute Tee'), 'timer')
assert.equal(pickRoute('Käse auf die Liste'), 'shopping')
assert.equal(pickRoute('Zeig Filme'), 'app')
assert.equal(pickRoute('Kalender zu'), 'app')
assert.equal(pickRoute('in 10 Minuten Milch'), 'reminder')
assert.equal(parseCalendarIntent('Termin absagen')?.kind, 'delete_last')
assert.equal(parseCalendarIntent('sag den Termin ab')?.kind, 'delete_last')
assert.equal(pickRoute('Termin absagen'), 'calendar')

await clearPending(conv)
const cancelled = await handleCalendar(conv, 'Termin absagen')
assert.match(cancelled.reply || '', /Termin weg|Kein Termin/)
assert.doesNotMatch(cancelled.reply || '', /Wann soll ich/)
assert.equal(await getPending(conv), undefined)

const noneRow = await addEvent({
  title: 'ohne Erinnerung',
  start_at: new Date(Date.now() + 86400_000).toISOString(),
  remind_offsets_min: [],
})
assert.deepEqual(noneRow.remind_offsets_min, [])
assert.deepEqual(eventNotifyMinutes(noneRow), [])

assert.deepEqual(sanitizeDebugPicked(['V2 Einstellungen', 'Memory-10']), ['Memory-10'])
assert.deepEqual(sanitizeDebugPicked(['V9 Randfälle']), [])
assert.ok(restoreDebugPicked(['V2 Einstellungen']).includes('Memory-10'))
assert.ok(!restoreDebugPicked(['V2 Einstellungen']).some((t) => /^V\d/.test(t)))
assert.deepEqual(restoreDebugPicked([]), [])
assert.deepEqual(sanitizeDebugPicked([]), [])

await clearPending(conv)
const hangConv = 'cal-18-8-hang'
await clearPending(hangConv)
const prevNote = globalThis.Notification
globalThis.Notification = {
  permission: 'default',
  requestPermission: () => new Promise(() => {}),
}
const hangStart = Date.now()
const hang = await handleCalendar(hangConv, 'Termin morgen 11 Uhr Hangtest')
assert.ok(Date.now() - hangStart < 2000, 'Permission-Prompt darf Create nicht blockieren')
assert.match(hang.reply || '', /Wann soll ich Sie erinnern/)
assert.equal((await getPending(hangConv))?.action, 'remind_offsets')
globalThis.Notification = prevNote

const { cancelEventNotifies } = await import('../src/engine/calendar.ts')
const { handleReminders, notifyIdOf } = await import('../src/engine/reminders.ts')
const { cancelNotify } = await import('../src/native/notify.ts')

{
  const due = new Date()
  due.setDate(due.getDate() + 1)
  due.setHours(10, 0, 0, 0)
  await addReminder({ title: 'Steuer-Testtag', due_at: due.toISOString(), conversationId: 'rem-day' })
  const later = new Date(due)
  later.setDate(later.getDate() + 2)
  await addReminder({ title: 'Bleibt liegen', due_at: later.toISOString(), conversationId: 'rem-day' })
  const wiped = await handleReminders('rem-day', 'Entferne alle Erinnerungen am morgen')
  assert.match(wiped.reply || '', /gelöscht|Keine Erinnerung/)
  const left = (await listReminders()).filter((r) => r.status === 'open')
  assert.equal(left.some((r) => r.title === 'Steuer-Testtag'), false, 'Erinnerung am Morgen muss weg')
  assert.equal(left.some((r) => r.title === 'Bleibt liegen'), true, 'andere Tage bleiben')
}

for (const e of await listEvents()) await cancelEventNotifies(e)
for (const r of await listReminders()) await cancelNotify(notifyIdOf(r))

console.log('OK test-18.8')

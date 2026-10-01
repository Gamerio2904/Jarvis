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

const { parseBoardIntent } = await import('../src/engine/board-parse.ts')
const { handleBoard } = await import('../src/engine/board.ts')
const { handleIdea } = await import('../src/engine/idea.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { fileFor, projectSlug } = await import('../src/engine/project-docs.ts')
const { addEvent, clearPending, getPending, listEvents, listIdeas, listReminders, loadSettings, saveSettings } = await import('../src/engine/store.ts')
const { parseCalendarIntent, handleCalendar, cancelEventNotifies, parseRemindOffsets } = await import('../src/engine/calendar.ts')
const { isLiveLookup } = await import('../src/engine/research-parse.ts')
const { applyDurationCorrection } = await import('../src/engine/duration-correct.ts')
const { parseReminderIntent } = await import('../src/engine/remind-parse.ts')
const { handleReminders } = await import('../src/engine/reminders.ts')
const { parseAblaufIntent } = await import('../src/engine/ablauf-parse.ts')
const { splitIntents } = await import('../src/engine/split-intents.ts')
const { normalizeUtterance } = await import('../src/engine/utterance.ts')

assert.equal(parseAblaufIntent('Go'), null)
const frozen = new Date(2026, 8, 22, 10, 0)
const weekly = parseCalendarIntent('jeden Montag 18 Uhr Training', frozen)
assert.equal(weekly?.kind, 'create')
if (weekly?.kind === 'create') {
  assert.equal(weekly.whenLabel, 'jeden Montag 28. September 18:00')
  assert.doesNotMatch(weekly.whenLabel, /Montag Montag/)
}
assert.equal(parseReminderIntent('Lösche die monatlichen traingserinnerungen')?.kind, 'delete_recur')

assert.equal(projectSlug('Tik Tak To'), 'tik-tak-to')
assert.equal(parseBoardIntent('Lade den PSP runter')?.kind, 'download')
assert.equal(parseBoardIntent('Lade den PSP runter')?.which, 'psp')
assert.equal(parseBoardIntent('Lade die Sprints runter')?.which, 'sprints')
const all = parseBoardIntent('Lade alles zu Projekt Tik Tak To')
assert.equal(all?.kind, 'download')
assert.equal(all?.which, 'all')
assert.equal(all?.query, 'Tik Tak To')
assert.equal(parseBoardIntent('Lade Projektdateien zu Projekt Tik Tak To')?.which, 'all')
assert.equal(parseBoardIntent('Zeig PSP')?.kind, 'view')
assert.equal(pickRoute('Lade den PSP runter'), 'board')
assert.equal(pickRoute('Plane das: Trag morgen 9 Uhr Zahnarzt ein'), 'idea')

const planned = await handleIdea('c-plan', 'Plane das: Trag morgen 9 Uhr Zahnarzt ein, stell einen Wecker auf 8 und such Open Source zu Tic-Tac-Toe')
assert.match(planned.reply || '', /PLAN/)
assert.match(planned.reply || '', /Lade den PSP runter/)
assert.equal(loadSettings().tischplatte_on, true)
assert.equal(loadSettings().ablauf_status, '')
const idea = (await listIdeas()).find((r) => /Zahnarzt/i.test(r.title))
assert.ok(idea?.plan)
assert.equal(idea.plan.sprints.length >= 3, true)
assert.equal(idea.plan.sprints[0].title, 'Kern')
assert.equal(idea.plan.sprints[1].ziel.length > 3, true)

const file = fileFor(idea, 'psp')
assert.equal(file.name.endsWith('-psp.json'), true)
assert.equal(file.data.art, 'psp')
assert.equal(file.data.psp.length, idea.plan.sprints.length)

const saved = await handleBoard('c-plan', 'Lade den PSP runter')
assert.match(saved.reply || '', /PSP zu /)
assert.match(saved.reply || '', /psp\.json/)

const named = await handleBoard('c-plan', `Lade alles zu Projekt ${idea.title}`)
assert.match(named.reply || '', /Projektdateien/)
assert.match(named.reply || '', /projekt\.json/)

const moved = await handleBoard('c-plan', 'Schieb die Sprintliste nach links')
assert.match(moved.reply || '', /steht links/)
assert.equal(loadSettings().plan_phase, 'live')
assert.ok(loadSettings().plan_script_at > 0)
const locked = await handleIdea('c-plan', 'Go')
assert.match(locked.reply || '', /Fest\. .+ liegt im Portfolio/)
assert.equal(loadSettings().plan_phase, 'go')

const hold = 'plan-hold'
await clearPending(hold)
const made = await handleCalendar(hold, 'Termin morgen 18 Uhr HoldPlane')
assert.equal((await getPending(hold))?.action, 'remind_offsets')
const released = await handleCalendar(hold, 'Plane das: Tik Tak To, Spielfeld bauen')
assert.equal(released.handled, false)
assert.equal(await getPending(hold), undefined)
const weather = await handleCalendar(hold, 'Termin morgen 19 Uhr WetterHold')
assert.equal((await getPending(hold))?.action, 'remind_offsets')
const stayed = await handleCalendar(hold, 'Wetter heute')
assert.match(stayed.reply || '', /Wann soll ich Sie erinnern/)
assert.equal((await getPending(hold))?.action, 'remind_offsets')

await addEvent({
  title: 'Training',
  start_at: new Date(Date.now() + 86_400_000).toISOString(),
  recur: 'weekly',
})
await addEvent({
  title: 'Training Beitrag',
  start_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  recur: 'monthly',
})
const wiped = await handleReminders(hold, 'Lösche die monatlichen traingserinnerungen')
assert.match(wiped.reply || '', /Training Beitrag/)
assert.ok((await listEvents()).some((e) => e.title === 'Training' && e.recur === 'weekly'))
assert.equal((await listEvents()).some((e) => e.recur === 'monthly' && /Training/.test(e.title)), false)

assert.deepEqual(parseRemindOffsets('Nein 90 Minuten'), { kind: 'offsets', minutes: [90] })
assert.deepEqual(parseRemindOffsets('90 Minuten'), { kind: 'offsets', minutes: [90] })
assert.equal(parseRemindOffsets('Wetter heute'), null)
const durHold = 'dur-hold'
await clearPending(durHold)
await handleCalendar(durHold, 'Termin morgen 20 Uhr DauerHold')
assert.equal((await getPending(durHold))?.action, 'remind_offsets')
saveSettings({ last_step_tool: 'calendar', last_step_title: 'DauerHold' })
assert.equal(await applyDurationCorrection(durHold, 'Nein 90 Minuten'), null)
const durSet = await handleCalendar(durHold, 'Nein 90 Minuten')
assert.match(durSet.reply || '', /90 Minuten davor/)
assert.equal(await getPending(durHold), undefined)
assert.equal(isLiveLookup('Wer ist mortys son'), true)
assert.equal(isLiveLookup('Wer ist meine Mutter'), false)
assert.equal(isLiveLookup('Wer bist du'), false)
assert.equal(splitIntents('Plane das: Einkauf, Liste schreiben und Route prüfen').length, 1)
assert.equal(parseAblaufIntent('Lösche den aktuellen Plan angezeigt wird')?.kind, 'clear')
assert.equal(
  parseReminderIntent(normalizeUtterance('Lösche die wöchentlichentrainingserinnerungen'))?.kind,
  'delete_recur',
)
const einkauf = await handleIdea('c-einkauf', 'Plane das: Einkauf, Liste schreiben und Route prüfen')
assert.match(einkauf.reply || '', /Liste schreiben/)
assert.match(einkauf.reply || '', /Wege — aus dem Satz/)
assert.match(einkauf.reply || '', /Quelle fehlt/)
assert.doesNotMatch(einkauf.reply || '', /nicht als Befehl/)
const einkaufRow = (await listIdeas()).find((r) => r.title === 'Einkauf')
assert.equal(einkaufRow?.plan?.sprints[0].ziel.includes('Liste schreiben'), true)
assert.equal(einkaufRow?.plan?.sprints[1].ziel, 'Die Wege gegeneinander halten.')
assert.equal(einkaufRow?.plan?.sprints[2].ziel, 'Einen Weg einmal durchspielen.')
assert.notEqual(
  einkaufRow?.plan?.sprints[0].lieferumfang[0].task,
  einkaufRow?.plan?.sprints[0].lieferumfang[0].anleitung,
)
assert.equal(loadSettings().plan_phase, 'live')
const weg = await handleIdea('c-einkauf', 'Lösche den aktuellen Plan angezeigt wird')
assert.match(weg.reply || '', /von der Tischplatte weg/)
assert.equal(loadSettings().plan_phase, '')
const leer = await handleIdea('c-einkauf', 'Lösche den aktuellen Plan')
assert.match(leer.reply || '', /kein Plan/i)

saveSettings({ last_step_tool: '', last_step_title: '' })
const timed = await applyDurationCorrection('c-plan', 'Nein 90 Minuten')
assert.match(timed?.reply || '', /90 Minuten/)
assert.equal(timed?.tool, 'timer')
const openTimers = (await listReminders()).filter((r) => r.kind === 'timer' && r.status === 'open')
assert.equal(openTimers.length, 1)
const again = await applyDurationCorrection('c-plan', 'Nein 30 Minuten')
assert.match(again?.reply || '', /30 Minuten/)
assert.equal((await listReminders()).filter((r) => r.kind === 'timer' && r.status === 'open').length, 1)

for (const row of await listReminders()) {
  if (row.kind === 'timer') {
    const { cancelNotify, notifyIdFromKey } = await import('../src/native/notify.ts')
    const { deleteReminder } = await import('../src/engine/store.ts')
    await cancelNotify(notifyIdFromKey(row.id))
    await deleteReminder(row.id)
  }
}
for (const row of await listEvents()) await cancelEventNotifies(row)
console.log('ok test-project-docs')

// @ts-nocheck — Test-Skript mit losen Literalen/Mocks; Laufzeit wird vom Test selbst geprüft.
import assert from 'node:assert/strict'

const { addYearsKeepDay, expandEvents, recurLabel } = await import('../src/engine/calendar-occur.ts')
const { eventsToIcs, icsToEvents } = await import('../src/engine/calendar-ics.ts')

const leap = addYearsKeepDay(new Date(2024, 1, 29, 12, 0, 0))
assert.equal(leap.getFullYear(), 2025)
assert.equal(leap.getMonth(), 1)
assert.equal(leap.getDate(), 28)

const same = addYearsKeepDay(new Date(2026, 2, 3, 18, 0, 0))
assert.equal(same.getFullYear(), 2027)
assert.equal(same.getMonth(), 2)
assert.equal(same.getDate(), 3)
assert.equal(same.getHours(), 18)

const bday = {
  id: 'bday',
  title: 'Geburtstag Jakob',
  start_at: new Date(1994, 2, 3, 18).toISOString(),
  recur: 'yearly',
  created_at: '',
  updated_at: '',
}
const hits = expandEvents([bday], new Date(2026, 0, 1), new Date(2028, 0, 1))
assert.equal(hits.length, 2)
assert.equal(new Date(hits[0].start_at).getFullYear(), 2026)
assert.equal(new Date(hits[0].start_at).getMonth(), 2)
assert.equal(new Date(hits[0].start_at).getDate(), 3)
assert.equal(new Date(hits[1].start_at).getFullYear(), 2027)
assert.equal(new Date(hits[1].start_at).getDate(), 3)
assert.equal(recurLabel(bday), 'jedes Jahr')

const ics = eventsToIcs([bday])
assert.match(ics, /RRULE:FREQ=YEARLY/)
assert.equal(icsToEvents(ics)[0]?.recur, 'yearly')

console.log('ok test-cal-year')

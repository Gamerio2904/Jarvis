import assert from 'node:assert/strict'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { filterTopics, settingsTabForQuery } from '../src/engine/settings-ia.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { formatClock } from '../src/engine/remind-parse.ts'
import { retrievePacks } from '../src/engine/knowledge-retrieve.ts'
import { APP_VERSION } from '../src/engine/store.ts'

assert.equal(APP_VERSION, '16.1.0')

const globe = parseHudIntent('Öffne die Weltkugel')
assert.equal(globe?.kind, 'view')
assert.equal(globe && globe.kind === 'view' ? globe.view : '', 'globe')

const lage = parseHudIntent('Lage an')
assert.equal(lage?.kind, 'lage')
assert.equal(lage && lage.kind === 'lage' ? lage.on : false, true)

const tokyo = parseHudIntent('Wo ist tokio')
assert.equal(tokyo?.kind, 'pin')

const t1 = parseTimerIntent('Timer 1 inuten Frühstückseier', new Date('2026-09-09T02:52:00'))
assert.equal(t1?.kind, 'create')
if (t1?.kind === 'create') {
  assert.ok(Math.abs(t1.ms - 60_000) < 1000, String(t1.ms))
}

const t2 = parseTimerIntent('Wann läuft der Timer ab?')
assert.equal(t2?.kind, 'list')

assert.ok(filterTopics('Fernseher').includes('geraete'))
assert.equal(settingsTabForQuery('Fernseher', 'daten'), 'geraete')

assert.equal(pickRoute('Öffne die Weltkugel'), 'hud')
assert.equal(pickRoute('Lage an'), 'hud')
assert.equal(pickRoute('Timer 1 Minute Eier'), 'timer')

const clock = formatClock(new Date('2026-09-09T20:48:00'))
assert.equal(clock, '20:48')
assert.ok(!clock.includes(' '))

assert.equal(retrievePacks('Lage an', []).length, 0)

console.log('test-qa-16 ok')

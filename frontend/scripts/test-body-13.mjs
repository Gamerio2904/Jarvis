import assert from 'node:assert/strict'
import { APP_VERSION } from '../src/engine/store.ts'
import { buildBodyGraph, SKILL_CATALOG, skillsForOrgan } from '../src/engine/body-graph.ts'
import { parseCalendarIntent, nextNamedDay } from '../src/engine/calendar-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { TEST_COPY_GROUPS } from '../src/engine/test-copy.ts'

assert.equal(APP_VERSION, '13.31.0')
assert.ok(SKILL_CATALOG.some((s) => s.id === 'calendar'))
assert.ok(SKILL_CATALOG.some((s) => s.id === 'research'))
assert.ok(SKILL_CATALOG.some((s) => s.id === 'teach'))
assert.ok(skillsForOrgan('eye').some((s) => s.id === 'eye'))
assert.ok(skillsForOrgan('memory').some((s) => s.id === 'calendar'))

const emptySnap = {
  brain: { live: false, line: 'Hirn' },
  eye: { live: false, line: 'Kein Foto' },
  hand: { live: false, line: '' },
  ear: { live: false, line: 'Wake aus' },
  mouth: { live: true, line: 'Mund' },
  memory: { live: false, line: '0 gemerkt' },
  pc_eye: { live: false, line: '' },
  pc_hand: { live: false, line: '' },
}

{
  const g = buildBodyGraph({
    organ: 'eye',
    snap: emptySnap,
    packs: [],
    memory: [],
    events: [],
    lastEyeLine: '',
  })
  assert.equal(g.empty, true)
  assert.match(g.nodes.find((n) => n.id === 'empty')?.line || '', /Kein Knoten|erfinde/)
}

{
  const g = buildBodyGraph({
    organ: 'memory',
    snap: { ...emptySnap, memory: { live: true, line: '1 gemerkt' } },
    packs: [],
    memory: [{ id: 'm1', key: 'getränk', value: 'Mate' }],
    events: [{ id: 'e1', title: 'Zahnarzt', start_at: '2026-09-04T13:00:00Z' }],
    lastUtterance: 'Was trinke ich?',
  })
  assert.equal(g.empty, false)
  assert.ok(g.nodes.some((n) => n.skill === 'calendar' && n.kind === 'knowledge'))
  assert.ok(g.nodes.some((n) => n.id === 'mem:m1'))
}

{
  const g = buildBodyGraph({
    organ: 'brain',
    snap: emptySnap,
    packs: [
      {
        id: 'fritzbox',
        topic: 'fritzbox',
        title: 'FritzBox',
        aliases: ['wlan', 'router'],
        summary: 'Passwort unter dem Router.',
        claims: [{ id: 'c1', text: 'WLAN unter dem Router.', source_urls: [], user_ok: true }],
        sources: [],
        origin: 'user',
        taught_at: '2026-09-03T00:00:00Z',
        updated_at: '2026-09-03T00:00:00Z',
        user_ok: true,
      },
    ],
    memory: [],
    events: [],
    lastUtterance: 'FritzBox WLAN',
  })
  assert.ok(g.nodes.some((n) => n.kind === 'cluster'))
  assert.ok(g.nodes.some((n) => n.kind === 'knowledge' && /FritzBox/.test(n.label)))
  assert.ok(g.nodes.some((n) => n.kind === 'claim'))
}

const frozen = new Date('2026-09-03T10:00:00+02:00')
assert.equal(parseCalendarIntent('was steht nächsten Freitag an?', frozen)?.kind, 'list')
assert.equal(parseCalendarIntent('Kalender heute', frozen)?.kind, 'list')
assert.equal(parseCalendarIntent('Kalender', frozen)?.kind, 'open')
assert.equal(pickRoute('Was steht nächsten Freitag an?'), 'calendar')
assert.equal(pickRoute('Was steht an?'), 'brief')
assert.equal(pickRoute('Termin morgen 15 Uhr Zahnarzt'), 'calendar')
const nxt = nextNamedDay('freitag', frozen)
assert.ok(nxt.getDay() === 5)

assert.ok(TEST_COPY_GROUPS.some((g) => g.title === 'Körper-13'))
console.log('test-body-13 ok')

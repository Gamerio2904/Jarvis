import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { parseIdeaIntent, dueFromRel } from '../src/engine/idea-parse.ts'
import { emptyPlan, parsePlan, formatPlan, CORE_TITLES, nextCustomN } from '../src/engine/idea-plan.ts'
import { addIdea, listIdeas } from '../src/engine/store.ts'
import { handleIdea } from '../src/engine/idea.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'

const plan = emptyPlan('idea-1')
assert.equal(plan.sprints.length, 3)
assert.deepEqual(
  plan.sprints.map((s) => s.title),
  [...CORE_TITLES],
)
assert.ok(plan.sprints.every((s) => s.kind === 'core'))
assert.match(formatPlan(plan, 'Test'), /Kern/)
assert.match(formatPlan(plan, 'Test'), /Härten/)
assert.match(formatPlan(plan, 'Test'), /Probe/)

{
  const ok = parsePlan(
    {
      sprints: [
        { n: '1', kind: 'core', title: 'Kern', ziel: 'Festhalten', lieferumfang: [{ id: 'S1-1', task: 'Store' }] },
        { n: '2', kind: 'core', title: 'Härten', ziel: 'Parser', lieferumfang: [] },
        { n: '3', kind: 'core', title: 'Probe', ziel: 'Tests', lieferumfang: [] },
        { n: 'C1', kind: 'custom', title: 'Gerät', ziel: 'Gerätetest nach Sideload', lieferumfang: [] },
      ],
    },
    'idea-1',
  )
  assert.ok(ok)
  assert.equal(ok.sprints.filter((s) => s.kind === 'custom').length, 1)
}

{
  const rice = parsePlan({
    rice: 12,
    sprints: [
      { n: '1', kind: 'core', title: 'Kern', ziel: 'a', lieferumfang: [] },
      { n: '2', kind: 'core', title: 'Härten', ziel: 'b', lieferumfang: [] },
      { n: '3', kind: 'core', title: 'Probe', ziel: 'c', lieferumfang: [] },
    ],
  })
  assert.ok(rice)
  assert.equal('rice' in rice, false)
  assert.doesNotMatch(formatPlan(rice), /RICE/i)
}

assert.equal(
  parsePlan({
    sprints: [
      { n: 'C1', kind: 'custom', title: 'X', ziel: '', lieferumfang: [] },
      { n: '1', kind: 'core', title: 'Kern', ziel: '', lieferumfang: [] },
      { n: '2', kind: 'core', title: 'Härten', ziel: '', lieferumfang: [] },
      { n: '3', kind: 'core', title: 'Probe', ziel: '', lieferumfang: [] },
    ],
  }),
  null,
)

assert.equal(
  parsePlan({
    sprints: [
      { n: '1', kind: 'core', title: 'Kern', ziel: '', lieferumfang: [] },
      { n: '3', kind: 'core', title: 'Probe', ziel: '', lieferumfang: [] },
    ],
  }),
  null,
)

{
  const created = await addIdea('Hausstand prüfen')
  assert.equal(created.plan, null)
}

assert.equal(parseIdeaIntent('Notiz Milch'), null)
assert.equal(parseIdeaIntent('Zeig Ideen')?.kind, 'list')
assert.equal(parseIdeaIntent('Mach einen Sprintplan für Idee 1')?.kind, 'fill_plan')
assert.equal(parseIdeaIntent('Zeig den Sprintplan für Idee 1')?.kind, 'show_plan')
assert.equal(parseIdeaIntent('Custom Sprint: auf dem Handy nach dem Sideload')?.kind, 'custom')
assert.equal(parseIdeaIntent('streich Sprint 2')?.kind, 'strike')
assert.equal(parseIdeaIntent('Erinner mich in 2 Wochen an Idee 1')?.kind, 'remind')
assert.equal(parseIdeaIntent('Erinner mich an Idee 1')?.kind, 'remind')
assert.equal(parseIdeaIntent('in 20 Minuten Milch'), null)

{
  const weeks = dueFromRel('in 2 Wochen')
  assert.ok(weeks)
  const delta = weeks.due.getTime() - Date.now()
  assert.ok(delta > 12 * 24 * 3600 * 1000)
}

assert.ok(parseReminderIntent('in 2 Wochen Milch') || parseReminderIntent('Erinner mich in 2 Wochen an Milch'))

{
  await addIdea('Sideload prüfen')
  await handleIdea('c', 'Zeig meine Ideen')
  const custom = await handleIdea('c', 'Custom Sprint: auf dem Handy nach dem Sideload')
  assert.match(custom.reply || '', /C1/)
  const strike = await handleIdea('c', 'streich Sprint 2')
  assert.match(strike.reply || '', /entfällt/)
  const rows = await listIdeas()
  const plan = rows.find((r) => r.plan)?.plan
  assert.ok(plan)
  assert.equal(plan.sprints.find((s) => s.n === '2')?.ziel, 'entfällt: auf Zuruf')
  assert.equal(nextCustomN(plan), 'C2')
}

{
  const ask = await handleIdea('c', 'Erinner mich an Idee 1')
  assert.equal(ask.reply, 'Wann?')
}

console.log('test-idea-plan ok')

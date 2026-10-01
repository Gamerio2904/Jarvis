import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { parseIdeaIntent, dueFromRel } from '../src/engine/idea-parse.ts'
import { blankSprint, emptyPlan, parsePlan, formatPlan, nextSprintN, planFromSources, planHasBody } from '../src/engine/idea-plan.ts'
import { addIdea, listIdeas } from '../src/engine/store.ts'
import { handleIdea } from '../src/engine/idea.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'

const plan = emptyPlan('idea-1')
assert.equal(plan.sprints.length, 0)
assert.equal(plan.gateway, 'offen')
assert.ok(plan.rahmen.length >= 8)
assert.match(formatPlan(plan, 'Test'), /Sprints: noch keine/)
plan.sprints.push(blankSprint('1', 'Punkte', 'Ein Raum liegt als Datei'))
assert.match(formatPlan(plan, 'Test'), /Sprint 1 — Punkte/)
assert.doesNotMatch(formatPlan(plan, 'Test'), /Härten|Probe/)

{
  const ok = parsePlan(
    {
      sprints: [
        { n: '1', kind: 'core', title: 'Kern', ziel: 'Festhalten', lieferumfang: [{ id: 'S1-1', task: 'Store' }] },
        { n: '2', kind: 'core', title: 'Härten', ziel: 'Parser', lieferumfang: [] },
        { n: '3', kind: 'core', title: 'Probe', ziel: 'Tests', lieferumfang: [] },
        { n: '4', title: 'Gerät', ziel: 'Gerätetest nach Sideload', lieferumfang: [] },
      ],
    },
    'idea-1',
  )
  assert.ok(ok)
  assert.equal(ok.sprints.length, 4)
  assert.equal(ok.sprints[3].title, 'Gerät')
  assert.equal(ok.sprints[0].title, 'Kern')
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
  assert.match(custom.reply || '', /Sprint 1/)
  const added = await handleIdea('c', 'Custom Sprint: zweites Tor nach dem ersten')
  assert.match(added.reply || '', /Sprint 2/)
  const strike = await handleIdea('c', 'streich Sprint 2')
  assert.match(strike.reply || '', /nogo|No-Go|Gateway: nogo/i)
  const rows = await listIdeas()
  const plan = rows.find((r) => r.plan && r.plan.sprints.some((s) => s.n === '2'))?.plan
  assert.ok(plan)
  assert.equal(plan.sprints.find((s) => s.n === '2')?.gateway, 'nogo')
  assert.equal(plan.sprints.find((s) => s.n === '2')?.nogo_wenn, 'auf Zuruf')
  assert.equal(nextSprintN(plan), '3')
}

{
  const ask = await handleIdea('c', 'Erinner mich an Idee 1')
  assert.equal(ask.reply, 'Wann?')
}

{
  const titled = parsePlan({
    sprints: [
      { n: '1', kind: 'core', title: 'Kernsprint', ziel: 'Brett', lieferumfang: [] },
      { n: '2', kind: 'core', title: 'Härten', ziel: 'Züge prüfen', lieferumfang: [] },
      { n: '3', kind: 'core', title: 'Probe', ziel: 'Eine Runde', lieferumfang: [] },
    ],
  })
  assert.equal(titled?.sprints[0].title, 'Kernsprint')
  assert.equal(planHasBody(titled), true)
  const fromHits = planFromSources('idea-x', 'Tik-Tak-To', ['Top 23 tic-tac-toe Open-Source Projects'])
  assert.ok(fromHits)
  assert.equal(fromHits.sprints.length, 1)
  assert.match(fromHits.sprints[0].ziel, /Top 23/)
  assert.equal(planHasBody(emptyPlan('idea-x')), false)
}

console.log('test-idea-plan ok')

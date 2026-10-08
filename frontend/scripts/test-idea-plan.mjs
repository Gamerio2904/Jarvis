// @ts-nocheck — Test-Skript mit losen Literalen/Mocks; Laufzeit wird vom Test selbst geprüft.
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { parseIdeaIntent, dueFromRel } from '../src/engine/idea-parse.ts'
import {
  blankSprint,
  diffPlanRevisions,
  emptyPlan,
  formatPlan,
  moveBacklogItem,
  nextSprintN,
  parsePlan,
  planFromSources,
  planHasBody,
  restorePlanRevision,
  savePlanRevision,
  sprintPrompt,
  validatePlan,
} from '../src/engine/idea-plan.ts'
import { addIdea, createConversation, getPending, listIdeas, setPending } from '../src/engine/store.ts'
import { handleIdea } from '../src/engine/idea.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'

if (!globalThis.localStorage) {
  const memory = new Map()
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(String(key), String(value)),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
  }
}

const plan = emptyPlan('idea-1')
assert.equal(plan.sprints.length, 0)
assert.equal(plan.gateway, 'offen')
assert.ok(plan.rahmen.length >= 8)
assert.match(formatPlan(plan, 'Test'), /Sprints: noch keine/)
plan.sprints.push(blankSprint('1', 'Punkte', 'Ein Raum liegt als Datei'))
assert.match(formatPlan(plan, 'Test'), /Sprint 1 — Punkte/)
assert.doesNotMatch(formatPlan(plan, 'Test'), /Härten|Probe/)

{
  const invalidDependency = parsePlan({
    sprints: [{ n: '1', title: 'Basis', ziel: 'Basis erstellen', haengt_an: ['7'] }],
  })
  assert.equal(invalidDependency, null)
  const cycle = parsePlan({
    sprints: [
      { n: '1', title: 'Eins', ziel: 'Erster Schritt', haengt_an: ['2'] },
      { n: '2', title: 'Zwei', ziel: 'Zweiter Schritt', haengt_an: ['1'] },
    ],
  })
  assert.equal(cycle, null)
  const duplicateIds = parsePlan({
    anforderungen: [{ id: 'A1', satz: 'Anforderung eins' }],
    sprints: [{ n: '1', title: 'Eins', ziel: 'Erster Schritt', lieferumfang: [{ id: 'A1', task: 'Arbeit' }] }],
  })
  assert.equal(duplicateIds, null)
  /** @type {import('../src/engine/idea-plan.ts').IdeaPlan} */
  const projectGoWithoutSprintGo = { ...emptyPlan('x'), gateway: 'go', sprints: [blankSprint('1', 'Noch offen', 'Arbeit')] }
  assert.equal(validatePlan(projectGoWithoutSprintGo).ok, false)
  assert.equal(parsePlan({
    sprints: [{ n: '1', title: 'GUI', ziel: 'Vorschau' }],
    simulation: { version: 1, kind: 'gui', title: 'Preview', elements: [{ type: 'script', code: 'run()' }], assumptions: [] },
  }), null)
  const original = emptyPlan('revision')
  original.sprints.push(blankSprint('1', 'Alt', 'Alter Stand'))
  const revised = savePlanRevision(original, 'Vorschau angepasst', 'rev-1')
  revised.sprints[0].title = 'Neu'
  const restored = restorePlanRevision(revised, 'rev-1')
  assert.equal(restored?.sprints[0].title, 'Alt')
  assert.equal(restored?.revisions?.length, 1)
  const restoredWithHistory = restorePlanRevision(revised, 'rev-1', 'rev-2', new Date('2026-10-08T00:00:00Z'))
  assert.equal(restoredWithHistory?.revisions?.length, 2)
  assert.equal(restoredWithHistory?.revisions?.[1].summary, 'Wiederherstellung von Revision rev-1')
}

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
  assert.equal(rice.extensions?.rice, 12)
  assert.doesNotMatch(formatPlan(rice), /RICE/i)
}

{
  const legacy = parsePlan({
    schemaVersion: 2,
    anforderungen: [{ id: 'A-1', satz: 'Arbeit erledigen', abnahme: 'Arbeit ist geprüft.' }],
    sprints: [
      { n: '1', title: 'Vorbereitung', ziel: 'Start', haengt_an: [] },
      { n: '2', title: 'Lieferung', ziel: 'Abschluss', haengt_an: ['1'] },
    ],
  })
  assert.equal(legacy?.schemaVersion, 3)
  assert.deepEqual(legacy?.sprints[1].relations, [{ type: 'depends_on', targetId: '1' }])
  assert.deepEqual(legacy?.sprints[1].haengt_an, ['1'])

  const badRelation = parsePlan({
    sprints: [{ n: '1', title: 'Start', ziel: 'Los', relations: [{ type: 'runs', targetId: '2' }] }],
  })
  assert.equal(badRelation, null)
  assert.equal(parsePlan({
    sprints: [
      { n: '1', title: 'Erster Schritt', ziel: 'Vorbereitung', relations: [{ type: 'blocks', targetId: '2' }] },
      { n: '2', title: 'Zweiter Schritt', ziel: 'Lieferung', relations: [{ type: 'blocks', targetId: '1' }] },
    ],
  }), null)
  assert.equal(parsePlan({
    anforderungen: [{ id: 'A-1', satz: 'Lieferung', abnahme: 'Lieferung geprüft.' }],
    sprints: [
      { n: '1', title: 'Vorgänger', ziel: 'Vorbereitung' },
      { n: '2', title: 'Nachfolger', ziel: 'Lieferung', anforderungen: ['A-1'], gateway: 'go', go_wenn: 'Bereit', abbruch: 'Stopp', relations: [{ type: 'depends_on', targetId: '1' }] },
    ],
  }), null)
  assert.equal(parsePlan({
    sprints: [
      { n: '1', title: 'Später Vorgänger', ziel: 'Vorbereitung', endAt: '2026-10-09T10:00:00Z' },
      { n: '2', title: 'Früher Nachfolger', ziel: 'Lieferung', startAt: '2026-10-08T10:00:00Z', relations: [{ type: 'depends_on', targetId: '1' }] },
    ],
  }), null)

  const dated = parsePlan({
    sprints: [{
      n: '1', title: 'Start', ziel: 'Los',
      startAt: '2026-10-08T09:00:00+02:00',
      endAt: '2026-10-08T17:00:00+02:00',
    }],
  })
  assert.ok(dated)
  assert.equal(parsePlan({ sprints: [{ n: '1', title: 'Bad date', ziel: 'Los', startAt: '2026-10-08T09:00:00' }] }), null)
  assert.equal(parsePlan({ sprints: [{ n: '1', title: 'Bad interval', ziel: 'Los', startAt: '2026-10-09T09:00:00Z', endAt: '2026-10-08T09:00:00Z' }] }), null)

  const plan = emptyPlan('backlog')
  plan.anforderungen = [{ id: 'A-1', satz: 'Import bewahren', abnahme: 'Import geprüft.', gateway: 'offen', provenance: { kind: 'research', confirmation: 'confirmed', evidenceIds: ['EV-1'] } }]
  plan.evidence = [{ id: 'EV-1', kind: 'research', title: 'Quelle', text: 'Quelle geprüft.', url: 'https://example.com', fetchedAt: '2026-10-08T06:00:00Z', requirementId: 'A-1' }]
  plan.sprints = [blankSprint('1', 'Lieferung', 'Import bereitstellen')]
  plan.backlog = [{ id: 'B-1', description: 'Import prüfen', requirementIds: ['A-1'], status: 'backlog' }]
  plan.risks = [{ id: 'R-1', description: 'Quelle kann veralten', impact: 'Annahme stimmt nicht mehr', mitigation: 'Beleg erneut prüfen', status: 'open' }]
  plan.statusUpdates = [{ status: 'at_risk', at: '2026-10-08T06:30:00Z', reason: 'Prüfung ausstehend', nextAction: 'Quelle kontrollieren', requirementId: 'A-1' }]
  assert.equal(validatePlan(plan).ok, true)
  const moved = moveBacklogItem(plan, 'B-1', '1')
  assert.equal(moved?.backlog?.[0].status, 'planned')
  assert.equal(moved?.backlog?.[0].sprintId, '1')
  assert.equal(moveBacklogItem(plan, 'B-1', '9'), null)
  assert.equal(validatePlan({ ...plan, anforderungen: [], sprints: [{ ...plan.sprints[0], gateway: 'go', anforderungen: ['A-1'], go_wenn: 'Bereit', abbruch: 'Stopp' }] }).ok, false)
  assert.equal(validatePlan({ ...plan, evidence: [], anforderungen: [{ ...plan.anforderungen[0], provenance: { ...plan.anforderungen[0].provenance, evidenceIds: ['missing'] } }] }).ok, false)

  const changed = { ...plan, risks: [{ ...plan.risks[0], status: 'resolved' }] }
  assert.ok(diffPlanRevisions(plan, changed).some((item) => item.section === 'Risiken und Status'))
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

{
  const idea = await addIdea('Planvorschlag sicher prüfen', 'Ursprünglicher Wunsch bleibt erhalten')
  const proposal = emptyPlan(idea.id, 'Geprüfter Vorschlag')
  const sprint = blankSprint('1', 'Vorschlag', 'Ein überprüfbares Ergebnis')
  sprint.lieferumfang = [{ id: 'S1-1', task: 'Vorschau bauen', anleitung: 'Die Vorschau wird geprüft.' }]
  proposal.sprints = [sprint]
  const conversation = await createConversation('Planbestätigung')
  await setPending({
    conversation_id: conversation.id,
    tool: 'idea',
    action: 'plan_confirm',
    args: { ideaId: idea.id, plan: proposal },
    preview: idea.title,
    created_at: new Date().toISOString(),
  })
  assert.equal((await listIdeas()).find((row) => row.id === idea.id)?.plan, null)
  assert.equal((await getPending(conversation.id))?.action, 'plan_confirm')

  const { streamChat } = await import('../src/engine/chat.ts')
  let reply = ''
  await streamChat(conversation.id, 'bestätigen', {
    onDone: ({ assistant_message }) => { reply = assistant_message.content },
  })
  assert.match(reply, /Planvorschlag übernommen/)
  assert.equal((await getPending(conversation.id)), undefined)
  const saved = (await listIdeas()).find((row) => row.id === idea.id)
  assert.equal(saved?.plan?.bedingung, 'Ursprünglicher Wunsch bleibt erhalten')
  assert.equal(saved?.plan?.sprints[0]?.title, 'Vorschlag')
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
  assert.equal(fromHits.sprints[0].prompt, '')
}

{
  const text = 'Setze Sprint 1 um. Ziel: der Parser erkennt Entwirf. Arbeite nur den Parser. Baue keine Fläche. Abbruch: Simuliere Kalender öffnet drei Rahmen.'
  assert.equal(sprintPrompt('kurz'), '')
  assert.equal(sprintPrompt(text), text)
  assert.ok(sprintPrompt(`${text} ${'Wort '.repeat(200)}`).length <= 480)
  const withPrompt = parsePlan({
    sprints: [
      {
        n: '1',
        title: 'Parser',
        ziel: 'Entwirf erkennt der Parser',
        lieferumfang: [{ id: 'S1-1', task: 'Parser', anleitung: 'Die Formen aus dem Plan.' }],
        prompt: text,
        abbruch: 'Simuliere Kalender öffnet drei Rahmen.',
      },
    ],
  })
  assert.equal(withPrompt?.sprints[0].prompt, text)
  assert.match(formatPlan(withPrompt, 'Entwurf'), /Prompt:\nSetze Sprint 1 um/)
  const bare = blankSprint('1')
  assert.equal(bare.prompt, '')
}

console.log('test-idea-plan ok')

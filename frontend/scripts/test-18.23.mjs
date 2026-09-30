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

const { parseAblaufIntent } = await import('../src/engine/ablauf-parse.ts')
const { draftFromModel, formatAblauf, handleAblauf, listPlans, rewriteOffline } = await import('../src/engine/ablauf.ts')
const { parseIdeaIntent } = await import('../src/engine/idea-parse.ts')
const { handleBoard } = await import('../src/engine/board.ts')
const { applyBackup, asBackup, buildBackup, previewBackup, stripSettings } = await import('../src/engine/backup.ts')
const { emptyPlan } = await import('../src/engine/idea-plan.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { addIdea, listIdeas, loadSettings, put, putIdea, saveSettings } = await import('../src/engine/store.ts')

assert.equal(parseAblaufIntent('Plane das')?.kind, 'open')
assert.equal(parseAblaufIntent('Plane das: Trag morgen 9 Uhr Zahnarzt ein')?.kind, 'open')
assert.equal(parseIdeaIntent('Mach einen Sprintplan für Idee 1')?.kind, 'fill_plan')
assert.equal(parseAblaufIntent('Mach einen Sprintplan für Idee 1'), null)
assert.equal(parseAblaufIntent('Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1'), null)
assert.equal(pickRoute('Plane das'), 'idea')
assert.equal(pickRoute('Plane das: Trag morgen 9 Uhr Zahnarzt ein'), 'idea')
assert.equal(pickRoute('Übernehmen'), 'idea')
assert.equal(pickRoute('Plan zu'), 'idea')
assert.equal(pickRoute('Fenster zu'), 'idea')
assert.equal(pickRoute('Ändere den Wecker: 7:30'), 'idea')
assert.equal(pickRoute('Mach einen Sprintplan für Idee 1'), 'idea')
assert.equal(pickRoute('Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1'), 'board')
assert.equal(pickRoute('nächster Lidl'), 'poi')
assert.equal(pickRoute('Schieb die Sprintliste nach links'), 'board')
assert.equal(pickRoute('So'), null)

const draft = draftFromModel(
  {
    work: ['Termin', 'Wecker', 'Suche'],
    waves: [
      {
        cards: [
          { agent: 'calendar', task: 'Termin morgen 9 Uhr Zahnarzt' },
          { agent: 'alarm', task: 'Wecker um 8' },
          { agent: 'board', task: 'Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1' },
          { agent: 'idea', task: 'Füll den Plan für Idee 1' },
          { agent: 'kein-agent', task: 'bleibt grau' },
        ],
      },
      { cards: [{ agent: 'idea', task: 'Hol die Quellen zurück bitte nicht' }] },
    ],
  },
  'Zahnarzt und Wecker',
)
assert.ok(draft)
assert.equal(draft.waves[0].cards.some((c) => c.agent === 'idea'), false)
assert.equal(draft.gray.some((c) => c.agent === 'kein-agent'), true)
assert.equal(draft.waves[1].cards[0].agent, 'idea')
assert.match(formatAblauf(draft), /Gleichzeitig/)
assert.match(formatAblauf(draft), /Danach/)
assert.match(formatAblauf(draft), /Sag So/)

const none = await handleAblauf('c-ablauf', 'Plane das')
assert.match(none.reply || '', /Was soll geplant werden/)

const closed = await handleAblauf('c-ablauf', 'Plan zu')
assert.match(closed.reply || '', /kein Ablauf offen/)

saveSettings({ ablauf_status: 'warten' })
assert.equal(pickRoute('So'), 'idea')
assert.equal(parseAblaufIntent('Ja')?.kind, 'accept')
saveSettings({ ablauf_status: 'warten', proposal_pending: true })
assert.equal(parseAblaufIntent('Ja'), null)
saveSettings({ ablauf_status: 'warten', proposal_pending: false, tischplatte_on: true, tischplatte_pieces_json: '' })
const blocked = await handleBoard('c-ablauf', 'Schieb die Sprintliste nach links')
assert.match(blocked.reply || '', /Sprintliste liegt links/)
saveSettings({ ablauf_status: '' })

const idea = await addIdea('Tik-Tak-To', '')
const plan = emptyPlan(idea.id)
plan.sprints[0].ziel = 'Kern bleibt'
await putIdea({ ...idea, plan })
const rowA = { ...draft, id: 'plan-a', status: 'zu', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }
const rowB = { ...draft, id: 'plan-b', status: 'warten', created_at: '2026-01-02T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' }
await put('plans', rowA)
await put('plans', rowB)
const kept = await listPlans()
assert.equal(kept.filter((r) => r.id === 'plan-a' || r.id === 'plan-b').length, 2)

const snap = await buildBackup(false)
assert.equal(snap.plans.length, 2)
assert.equal(snap.ideas.find((r) => r.id === idea.id)?.plan?.sprints[0].ziel, 'Kern bleibt')
assert.match(previewBackup(snap).message, /2 Abläufe/)
assert.equal(stripSettings({ ablauf_id: 'plan-b', tischplatte_motion_json: 'x' }).ablauf_id, 'plan-b')
assert.equal(stripSettings({ ablauf_id: 'plan-b', tischplatte_motion_json: 'x' }).tischplatte_motion_json, undefined)

const older = asBackup(JSON.parse(JSON.stringify(snap)))
delete older.plans
await applyBackup(older)
assert.equal((await listPlans()).filter((r) => r.id === 'plan-a' || r.id === 'plan-b').length, 2)

const round = asBackup(JSON.parse(JSON.stringify(snap)))
await applyBackup(round)
const back = await listPlans()
assert.deepEqual(back.map((r) => r.id).sort(), ['plan-a', 'plan-b'])
assert.equal((await listIdeas()).find((r) => r.id === idea.id)?.plan?.sprints[0].ziel, 'Kern bleibt')
assert.equal(loadSettings().ablauf_id === 'plan-b' || loadSettings().ablauf_id === '' || back.some((r) => r.id === loadSettings().ablauf_id), true)

saveSettings({ ablauf_id: 'plan-run', ablauf_status: 'warten' })
await put('plans', {
  id: 'plan-run',
  title: 'Zwei Listen',
  work: ['Ideen'],
  waves: [
    { n: 1, cards: [
      { n: 1, agent: 'idea', task: 'Zeig mir meine Ideen', state: 'vorgeschlagen' },
      { n: 2, agent: 'idea', task: 'Alle Ideen', state: 'vorgeschlagen' },
    ] },
    { n: 2, cards: [{ n: 3, agent: 'idea', task: 'Zeig mir meine Ideen', state: 'vorgeschlagen' }] },
  ],
  gray: [],
  status: 'warten',
  created_at: '2026-01-03T00:00:00.000Z',
  updated_at: '2026-01-03T00:00:00.000Z',
})
const ran = await handleAblauf('c-ablauf', 'So')
assert.match(ran.reply || '', /Idee:/)
assert.equal((ran.reply || '').split('\n').length, 3)
const done = (await listPlans()).find((r) => r.id === 'plan-run')
assert.equal(done?.status, 'fertig')
assert.equal(done?.waves[0].cards.every((c) => c.state === 'fertig'), true)
assert.equal(done?.waves[1].cards[0].state, 'fertig')
assert.equal(loadSettings().ablauf_list_id, 'plan-run')

assert.equal(rewriteOffline('alarm', 'Wecker um 8', '7:30'), 'Wecker um 7:30')
assert.equal(rewriteOffline('alarm', 'Wecker um 8 Uhr', '6:15'), 'Wecker um 6:15 Uhr')
assert.equal(rewriteOffline('alarm', 'Wecker um 8', 'Wecker auf 6:15'), 'Wecker auf 6:15')
assert.equal(rewriteOffline('idea', 'Zeig mir meine Ideen', 'Alle Ideen'), 'Alle Ideen')

saveSettings({ ablauf_id: 'plan-edit', ablauf_status: 'warten' })
await put('plans', {
  id: 'plan-edit',
  title: 'Wecker',
  work: ['Wecker stellen'],
  waves: [{ n: 1, cards: [
    { n: 1, agent: 'alarm', task: 'Wecker um 8', state: 'vorgeschlagen' },
    { n: 2, agent: 'idea', task: 'Zeig mir meine Ideen', state: 'vorgeschlagen' },
  ] }],
  gray: [],
  status: 'warten',
  created_at: '2026-01-04T00:00:00.000Z',
  updated_at: '2026-01-04T00:00:00.000Z',
})
const edited = await handleAblauf('c-ablauf', 'Ändere den Wecker: 7:30')
assert.match(edited.reply || '', /Wecker: Wecker um 7:30/)
const editedRow = (await listPlans()).find((r) => r.id === 'plan-edit')
assert.equal(editedRow?.waves[0].cards[0].task, 'Wecker um 7:30')
assert.equal(editedRow?.waves[0].cards[0].state, 'geändert')
assert.equal(editedRow?.status, 'warten')
assert.equal((await listPlans()).some((r) => r.id === 'plan-run' && r.status === 'fertig'), true)
const rest = await handleAblauf('c-ablauf', 'Wecker auf 6:15, Rest so')
assert.match(rest.reply || '', /Wecker auf 6:15/)

console.log('ok test-18.23')

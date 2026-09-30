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
const { listIdeas, loadSettings } = await import('../src/engine/store.ts')

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
assert.match(moved.reply || '', /Sprintliste liegt links/)

console.log('ok test-project-docs')

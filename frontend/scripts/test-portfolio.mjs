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

const { handleIdea } = await import('../src/engine/idea.ts')
const { shortName, listPortfolio, portfolioPathOk, previewFile } = await import('../src/engine/portfolio.ts')
const { parsePortfolioIntent } = await import('../src/engine/portfolio-parse.ts')
const { applyBackup, asBackup, buildBackup, previewBackup } = await import('../src/engine/backup.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { addIdea, addMessage, listIdeas, loadSettings, replaceStore, saveSettings } = await import('../src/engine/store.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')

assert.equal(shortName('Tik Tak To'), 'Tik Tak To')
assert.equal(shortName('Einkauf, Liste schreiben und Route prüfen'), 'Einkauf')
assert.equal(shortName(''), 'Projekt')
assert.equal(portfolioPathOk('portfolio/tik-tak-to/projekt.json'), true)
assert.equal(portfolioPathOk('portfolio/tik-tak-to/../cover.jpg'), false)
assert.equal(parsePortfolioIntent('Zeig mir ein Bild der Elbe'), null)
assert.equal(parsePortfolioIntent('Zeig mir London'), null)
assert.equal(pickRoute('Portfolio'), 'idea')
assert.equal(pickRoute('Zeig Projekt Tik Tak To'), 'idea')
assert.equal(pickRoute('Beispiel zu Tik Tak To: Bild der Elbe'), 'idea')
assert.equal(pickRoute('Schredder Tik Tak To'), 'idea')
assert.equal(routeForEval('Zeig mir London'), 'hud')
assert.equal(routeForEval('Plane das: Tik Tak To, Spielfeld bauen, Sieg prüfen'), 'idea')

saveSettings({ plan_phase: '' })
const idle = await handleIdea('c', 'Go')
assert.equal(idle.handled, false)
assert.equal((await listPortfolio()).length, 0)

const planned = await handleIdea('c', 'Plane das: Tik Tak To, Spielfeld bauen, Sieg prüfen')
assert.match(planned.reply || '', /live/)
assert.equal(loadSettings().plan_phase, 'live')

const fest = await handleIdea('c', 'Go')
assert.match(fest.reply || '', /^Fest\. Tik Tak To liegt im Portfolio\./)
const rows = await listPortfolio()
assert.equal(rows.length, 1)
assert.equal(rows[0].name, 'Tik Tak To')
assert.equal(rows[0].cover.kind, 'drawn')
assert.match(rows[0].cover.src, /^data:/)
const names = rows[0].files.map((f) => f.name)
assert.deepEqual(names, ['projekt.json', 'sprints.json', 'psp.json'])

const again = await handleIdea('c', 'Go')
assert.match(again.reply || '', /Tik Tak To liegt schon im Portfolio/)
assert.equal((await listPortfolio()).length, 1)
assert.equal((await listPortfolio())[0].id, rows[0].id)

const opened = await handleIdea('c', 'Zeig Projekt Tik Tak To')
assert.match(opened.reply || '', /projekt\.json/)
assert.match(opened.reply || '', /sprints\.json/)
assert.match(opened.reply || '', /psp\.json/)
assert.equal(loadSettings().portfolio_focus, rows[0].id)

const bare = await handleIdea('c', 'Beispiel zu Tik Tak To')
assert.equal(bare.reply, 'Kein Bild zum Speichern.')
assert.equal((await listPortfolio())[0].files.length, 3)

const archived = await handleIdea('c', 'Schredder Tik Tak To')
assert.equal(archived.reply, 'Tik Tak To liegt im Archiv.')
const kept = (await listPortfolio())[0]
assert.equal(kept.archived, true)
assert.equal(kept.files.length, 3)

const back = await handleIdea('c', 'Hol Projekt Tik Tak To zurück')
assert.match(back.reply || '', /liegt im Portfolio/)
assert.equal((await listPortfolio())[0].archived, false)

const snap = await buildBackup(false)
assert.equal(snap.portfolio.length, 1)
assert.match(previewBackup(snap).message, /1 Projekte/)
const round = asBackup(JSON.parse(JSON.stringify(snap)))
await applyBackup(round)
assert.equal((await listPortfolio())[0].id, rows[0].id)

kept.archived = true
await replaceStore('portfolio', [kept])
const withArchive = await buildBackup(false)
assert.match(previewBackup(withArchive).message, /1 im Archiv/)

const old = { ...snap }
delete old.portfolio
await applyBackup(asBackup(old))
assert.equal((await listPortfolio())[0].archived, true)

const tik = (await listPortfolio()).find((r) => r.name === 'Tik Tak To')
const projekt = tik.files.find((f) => f.name === 'projekt.json')
assert.ok(previewFile(projekt).some((line) => line.includes('Spielfeld')))

const one = await handleIdea('c', 'Plane das: Nur Eins')
assert.match(one.reply || '', /live/)
const oneIdea = (await listIdeas()).find((r) => r.title === 'Nur Eins')
assert.equal(oneIdea.plan.sprints[1].ziel, '')
assert.equal(oneIdea.plan.sprints[2].ziel, '')
assert.doesNotMatch(JSON.stringify(oneIdea.plan), /Grenzen und Tests|Einen Durchlauf/)
assert.equal(loadSettings().plan_idea_id, oneIdea.id)
await addIdea('Neues Decoy', 'nicht dieses')
const festOne = await handleIdea('c', 'Umsetzen')
assert.match(festOne.reply || '', /^Fest\. Nur Eins liegt im Portfolio\./)
assert.equal((await listPortfolio()).some((r) => r.title === 'Neues Decoy'), false)

await handleIdea('c', 'Plane das: Alpha')
await handleIdea('c', 'Leg los')
await handleIdea('c', 'Plane das: Alpha!')
const second = await handleIdea('c', 'Go')
assert.match(second.reply || '', /^Fest\. Alpha! liegt im Portfolio\./)
const board = await listPortfolio()
const alpha = board.find((r) => r.title === 'Alpha')
const bang = board.find((r) => r.title === 'Alpha!')
assert.ok(alpha && bang)
assert.notEqual(alpha.slug, bang.slug)
assert.equal(portfolioPathOk(`portfolio/${bang.slug}/projekt.json`), true)
assert.ok(board.some((r) => r.name === 'Tik Tak To'))
assert.ok(board.some((r) => r.name === 'Nur Eins'))
const which = await handleIdea('c', 'Zeig Projekt Al')
assert.match(which.reply || '', /^Welches: /)
assert.match(which.reply || '', /Alpha/)

const shredded = await handleIdea('c', 'Archiviere Projekt Nur Eins')
assert.equal(shredded.reply, 'Nur Eins liegt im Archiv.')
saveSettings({ plan_phase: 'go', plan_idea_id: oneIdea.id })
const revived = await handleIdea('c', 'Go')
assert.equal(revived.reply, 'Nur Eins liegt wieder im Portfolio.')

const photo = 'data:image/jpeg;base64,abc'
await addMessage('c', 'assistant', 'Foto', {
  blocks: [{ kind: 'image', src: photo, alt: 'Beispiel', source: 'Foto' }],
})
const savedPhoto = await handleIdea('c', 'Beispiel zu Nur Eins')
assert.equal(savedPhoto.reply, 'Beispiel liegt bei Nur Eins.')
const withPhoto = (await listPortfolio()).find((r) => r.name === 'Nur Eins')
assert.equal(withPhoto.cover.kind, 'photo')
assert.equal(withPhoto.files.some((f) => f.kind === 'beispiel' && f.src === photo), true)

await new Promise((r) => setTimeout(r, 5))
await addMessage('c', 'assistant', 'Elbe', {
  blocks: [{ kind: 'image', src: 'https://example.com/elbe.jpg', alt: 'Elbe', source: 'Wikipedia' }],
})
const savedRemote = await handleIdea('c', 'Beispiel zu Nur Eins')
assert.equal(savedRemote.reply, 'Beispiel liegt bei Nur Eins.')
const keptGo = await handleIdea('c', 'Go')
assert.match(keptGo.reply || '', /Nur Eins liegt schon im Portfolio/)
const withRemote = (await listPortfolio()).find((r) => r.name === 'Nur Eins')
assert.equal(withRemote.cover.kind, 'research')
assert.equal(withRemote.files.filter((f) => f.kind === 'beispiel').length, 2)
assert.equal(
  withRemote.files.some((f) => f.src === 'https://example.com/elbe.jpg'),
  true,
)
for (let i = 0; i < 4; i += 1) {
  const more = await handleIdea('c', 'Beispiel zu Nur Eins')
  assert.equal(more.reply, 'Beispiel liegt bei Nur Eins.')
}
const full = await handleIdea('c', 'Beispiel zu Nur Eins')
assert.equal(full.reply, 'Sechs Beispiele sind voll.')

await replaceStore('portfolio', [
  {
    id: 'bad',
    idea_id: 'bad',
    name: 'Kaputt',
    slug: 'kaputt',
    title: 'Kaputt',
    fixed_at: '2020-01-01T00:00:00.000Z',
    cover: { kind: 'drawn', src: '', source: '' },
  },
])
const broken = await listPortfolio()
assert.deepEqual(broken[0].files, [])
assert.equal(broken[0].archived, false)
const openedBroken = await handleIdea('c', 'Zeig Projekt Kaputt')
assert.equal(openedBroken.reply, 'Kaputt.')

await replaceStore('portfolio', [])
const empty = await handleIdea('c', 'Portfolio')
assert.equal(empty.reply, 'Das Portfolio ist leer.')

console.log('test-portfolio ok')

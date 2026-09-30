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
const { shortName, listPortfolio, portfolioPathOk } = await import('../src/engine/portfolio.ts')
const { parsePortfolioIntent } = await import('../src/engine/portfolio-parse.ts')
const { applyBackup, asBackup, buildBackup, previewBackup } = await import('../src/engine/backup.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { loadSettings, replaceStore, saveSettings } = await import('../src/engine/store.ts')
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

console.log('test-portfolio ok')

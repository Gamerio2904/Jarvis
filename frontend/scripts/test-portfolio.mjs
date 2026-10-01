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
const { parseAblaufIntent } = await import('../src/engine/ablauf-parse.ts')
const { applyBackup, asBackup, buildBackup, previewBackup } = await import('../src/engine/backup.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { addIdea, addMessage, listIdeas, loadSettings, replaceStore, saveSettings } = await import('../src/engine/store.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')

assert.equal(shortName('Tik Tak To'), 'Tik Tak To')
assert.equal(shortName('Einkauf, Liste schreiben und Route prüfen'), 'Einkauf')
assert.equal(shortName(''), 'Projekt')
assert.equal(portfolioPathOk('portfolio/tik-tak-to/projekt.json'), true)
assert.equal(portfolioPathOk('portfolio/tik-tak-to/wege.json'), true)
assert.equal(portfolioPathOk('portfolio/tik-tak-to/luecken.json'), true)
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
assert.deepEqual(names, ['projekt.json', 'wege.json', 'sprints.json', 'psp.json', 'luecken.json'])

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
assert.equal((await listPortfolio())[0].files.length, 5)

const archived = await handleIdea('c', 'Schredder Tik Tak To')
assert.equal(archived.reply, 'Tik Tak To liegt im Archiv.')
const kept = (await listPortfolio())[0]
assert.equal(kept.archived, true)
assert.equal(kept.files.length, 5)

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
const wege = JSON.parse(tik.files.find((f) => f.name === 'wege.json').text)
assert.equal(wege.herkunft, 'aus dem Satz')
assert.equal(wege.wege[1].satz, 'Spielfeld bauen')
assert.equal(wege.wege[1].quelle, '')
const luecken = JSON.parse(tik.files.find((f) => f.name === 'luecken.json').text)
assert.ok(luecken.fehlt.some((gap) => gap.name === 'Recherche'))
const sprintFile = JSON.parse(tik.files.find((f) => f.name === 'sprints.json').text)
assert.notEqual(sprintFile.sprints[0].lieferumfang[0].task, sprintFile.sprints[0].lieferumfang[0].anleitung)
const psp = JSON.parse(tik.files.find((f) => f.name === 'psp.json').text)
assert.equal(psp.psp.length, 3)
assert.ok(psp.psp[0].pakete.length)
assert.equal(psp.psp[0].offen, 'Quelle fehlt')

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

assert.equal(parsePortfolioIntent('Lösche den Plan'), null)
assert.equal(parsePortfolioIntent('Lösche das Projekt Tik Tak To')?.kind, 'archive')
assert.equal(parsePortfolioIntent('Lösche das projekt tik Taktik to')?.name, 'tik Taktik to')
assert.equal(parsePortfolioIntent('Neues Projekt: Haushaltsbuch')?.kind, 'create')
assert.equal(parsePortfolioIntent('Neues Projekt')?.work, '')
assert.equal(pickRoute('Lösche das Projekt Tik Tak To'), 'idea')
assert.equal(pickRoute('Neues Projekt: Haushaltsbuch'), 'idea')
assert.equal(pickRoute('Lösche den Plan'), 'idea')

const blank = await handleIdea('c', 'Neues Projekt')
assert.equal(blank.reply, 'Was soll geplant werden?')
assert.equal((await listPortfolio()).length, 0)

const made = await handleIdea('c', 'Neues Projekt: Haushaltsbuch')
assert.match(made.reply || '', /^Fest\. Haushaltsbuch liegt im Portfolio\./)
assert.equal(loadSettings().plan_phase, '')
assert.equal((await listPortfolio()).some((r) => r.name === 'Haushaltsbuch' && !r.archived), true)

const appSentence = 'Neues projekt: Plane eine App, wo ich meine ein und Ausgaben übersichtlich eintragen kann'
const app = await handleIdea('c', appSentence)
assert.match(app.reply || '', /^Fest\. Plane App liegt im Portfolio\./)
assert.equal(loadSettings().plan_phase, '')
const appRow = (await listPortfolio()).find((r) => r.title.startsWith('Plane eine App'))
assert.ok(appRow && !appRow.archived)
assert.equal(appRow.files.length, 5)

const routine = await handleIdea('c', 'Neues Projekt: Morgenroutine')
assert.match(routine.reply || '', /^Fest\. Morgenroutine liegt im Portfolio\./)

await handleIdea('c', 'Plane das: Tik Tak To, Spielfeld bauen, Sieg prüfen')
const festTik = await handleIdea('c', 'Go')
assert.match(festTik.reply || '', /^Fest\. Tik Tak To liegt im Portfolio\./)
const fuzzy = await handleIdea('c', 'Lösche das projekt tik Taktik to')
assert.equal(fuzzy.reply, 'Tik Tak To liegt im Archiv.')
const archivedTik = (await listPortfolio()).find((r) => r.name === 'Tik Tak To')
assert.equal(archivedTik.archived, true)
assert.equal(archivedTik.files.length, 5)
assert.equal((await listPortfolio()).find((r) => r.name === 'Haushaltsbuch').archived, false)
assert.equal((await listPortfolio()).find((r) => r.name === 'Morgenroutine').archived, false)
assert.equal((await listPortfolio()).find((r) => r.name === 'Plane App').archived, false)

const missed = await handleIdea('c', 'Lösche das Projekt zzqx')
assert.equal(missed.reply, 'Das Projekt liegt nicht im Portfolio.')
const backFuzzy = await handleIdea('c', 'Hol Projekt tik Taktik to zurück')
assert.equal(backFuzzy.reply, 'Tik Tak To liegt im Portfolio.')
assert.equal((await listPortfolio()).find((r) => r.name === 'Tik Tak To').archived, false)

assert.equal(parseAblaufIntent('Plane das')?.kind, 'open')
assert.equal(parseAblaufIntent('Plane das: Tik Tak To')?.kind, 'open')
assert.equal(parseAblaufIntent('Plane das Projekt')?.kind, 'session')
assert.equal(parseAblaufIntent('Plane das Projekt: Haushaltsbuch, Liste und Knopf')?.work, 'Haushaltsbuch, Liste und Knopf')
assert.equal(pickRoute('Plane das Projekt'), 'idea')
assert.equal(pickRoute('Plane das'), 'idea')

saveSettings({ plan_phase: '' })
const session = await handleIdea('c', 'Plane das Projekt: Haushaltsbuch, Einnahmen eintragen')
assert.match(session.reply || '', /Planungsbildschirm ist offen/)
assert.match(session.reply || '', /Idee:/)
assert.match(session.reply || '', /Anforderungen/)
assert.match(session.reply || '', /Einnahmen eintragen/)
assert.equal(loadSettings().plan_phase, 'live')
const plannedIdea = (await listIdeas()).find((row) => row.title === 'Haushaltsbuch')
assert.ok(plannedIdea?.plan?.anforderungen.some((row) => row.satz === 'Einnahmen eintragen'))
assert.ok(plannedIdea?.plan?.sprints.length)

const talk = await handleIdea('c', 'Die Oberfläche ist eine Liste und ein Knopf Fertig')
assert.match(talk.reply || '', /Steht im Plan/)
assert.match(talk.reply || '', /Liste/)
assert.match(talk.reply || '', /Knopf/)
assert.equal(loadSettings().plan_phase, 'live')

const shut = await handleIdea('c', 'Fertig')
assert.match(shut.reply || '', /Planungsbildschirm ist zu/)
assert.equal(loadSettings().plan_phase, '')
assert.ok((await listIdeas()).some((row) => row.title === 'Haushaltsbuch'))

const reopened = await handleIdea('c', 'Plane das Projekt Haushaltsbuch')
assert.match(reopened.reply || '', /Planungsbildschirm ist offen/)
assert.equal(loadSettings().plan_phase, 'live')
const shutAgain = await handleIdea('c', 'Plan zu')
assert.equal(loadSettings().plan_phase, '')

const spoken = 'Plane eine App mit der ich meine ein und Ausgaben strukturierter aufschreiben kann'
assert.equal(parseAblaufIntent(spoken)?.kind, 'session')
assert.match(parseAblaufIntent(spoken)?.work || '', /Ausgaben/)
assert.equal(parseAblaufIntent('Plane das')?.kind, 'open')
assert.equal(parseAblaufIntent('Plane das: Tik Tak To')?.kind, 'open')
assert.equal(parseAblaufIntent('Plane das: Trag morgen 9 Uhr Zahnarzt ein')?.kind, 'open')
assert.equal(pickRoute(spoken), 'idea')
saveSettings({ plan_phase: '', plan_idea_id: '' })
const spokenOpen = await handleIdea('c', spoken)
assert.match(spokenOpen.reply || '', /Planungsbildschirm ist offen/)
assert.match(spokenOpen.reply || '', /Ausgaben/)
assert.match(spokenOpen.reply || '', /liegt im Portfolio/)
assert.doesNotMatch(spokenOpen.reply || '', /App für Ein- und Ausgaben/)
assert.equal(loadSettings().plan_phase, 'live')
const spokenIdea = (await listIdeas()).find((row) => (row.body || '').includes('Ausgaben strukturierter'))
assert.ok(spokenIdea?.plan?.anforderungen.some((row) => /Ausgaben/.test(row.satz)))
const spokenCard = (await listPortfolio()).find((row) => row.idea_id === spokenIdea.id)
assert.ok(spokenCard && !spokenCard.archived)
assert.equal((await listPortfolio()).find((row) => row.name === 'Tik Tak To').archived, false)
const spokenShut = await handleIdea('c', 'Fertig')
assert.match(spokenShut.reply || '', /Planungsbildschirm ist zu/)
assert.equal(loadSettings().plan_phase, '')
assert.equal((await listPortfolio()).find((row) => row.idea_id === spokenIdea.id).archived, false)

console.log('test-portfolio ok')

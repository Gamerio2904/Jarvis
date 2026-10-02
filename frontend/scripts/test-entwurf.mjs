// @ts-nocheck
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
const { parseAblaufIntent } = await import('../src/engine/ablauf-parse.ts')
const { parsePortfolioIntent } = await import('../src/engine/portfolio-parse.ts')
const { parseScanCommand, loadScan } = await import('../src/engine/room-scan.ts')
const { handleBoard } = await import('../src/engine/board.ts')
const { handleAblauf } = await import('../src/engine/ablauf.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { evalCases } = await import('../src/engine/eval/corpus.ts')
const { groupsForLane } = await import('../src/engine/probe-lanes.ts')
const { TEST_COPY_GROUPS } = await import('../src/engine/test-copy.ts')
const { fallbackFromWork, readModelFill, blocksFromWork } = await import('../src/engine/entwurf-fill.ts')
const { musterVariants, unknownArtReply } = await import('../src/engine/entwurf-muster.ts')
const { draftFramesOpen } = await import('../src/engine/entwurf-parse.ts')
const {
  APP_VERSION,
  addMessage,
  clearStore,
  createConversation,
  getAll,
  listIdeas,
  loadSettings,
  saveSettings,
} = await import('../src/engine/store.ts')
const { applyBackup, asBackup, buildBackup, previewBackup, stripSettings } = await import('../src/engine/backup.ts')
const { listPortfolio } = await import('../src/engine/portfolio.ts')

assert.equal(APP_VERSION, '18.25.12')

assert.equal(parseBoardIntent('Simuliere Kalender')?.view, 'sim')
assert.equal(parseBoardIntent('Plane das: Trag morgen 9 Uhr Zahnarzt ein'), null)
assert.equal(parseAblaufIntent('Plane das: Trag morgen 9 Uhr Zahnarzt ein')?.kind, 'open')
assert.equal(parsePortfolioIntent('Go'), null)
assert.equal(parseScanCommand('Scanne den Raum')?.op, 'start')
assert.equal(parseScanCommand('den Raum scannen')?.op, 'start')
assert.equal(parseScanCommand('Scanne den Apfel')?.target, 'object')
assert.equal(parseScanCommand('Scan beenden')?.op, 'end')
assert.equal(parseScanCommand('Beende den Scan')?.op, 'end')
assert.equal(parseScanCommand('Bennede den Scan')?.op, 'end')
assert.equal(parseBoardIntent('nächster Lidl'), null)
assert.equal(parseBoardIntent('Zeig mir London'), null)
assert.equal(parseBoardIntent('Fenster zu'), null)
assert.equal(parseAblaufIntent('Fenster zu')?.kind, 'close')
assert.equal(parseBoardIntent('Die erste'), null)
assert.equal(parseBoardIntent('Die zweite'), null)
assert.equal(parseBoardIntent('Räum den Tisch')?.op, 'clear')

const long = `Entwirf eine App: ${'Liste '.repeat(80)}`
assert.equal(parseBoardIntent(long)?.kind, 'entwurf')
assert.ok(long.length > 280)

assert.equal(parseBoardIntent('Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')?.kind, 'entwurf')
assert.equal(parseBoardIntent('Entwirf das')?.work, null)
assert.equal(parseBoardIntent('Entwurf zu')?.kind, 'draft_close')
assert.equal(parseBoardIntent('Zeig mir Inspiration zum Knopf')?.art, 'knopf')
assert.equal(parseBoardIntent('Hast du Animationen zur Karte')?.art, 'karte')
assert.equal(parseBoardIntent('Inspiration zur Liste')?.art, 'liste')
assert.equal(parseBoardIntent('Inspiration zum Quader')?.art, null)
assert.equal(parseBoardIntent('Mach einen Sprintplan für Idee 1')?.kind === 'entwurf', false)

assert.equal(pickRoute('Entwirf eine App: Einkaufsliste'), 'board')
assert.equal(pickRoute('Entwirf das'), 'board')
assert.equal(pickRoute('Entwirf: Notizen, drei Karten, ein Feld oben'), 'board')
assert.equal(pickRoute('Zeig mir Inspiration zum Knopf'), 'board')
assert.equal(pickRoute('Hast du Animationen zur Karte'), 'board')
assert.equal(pickRoute('Entwurf zu'), 'board')
assert.equal(pickRoute('Simuliere Kalender'), 'board')
assert.equal(pickRoute('Plane das: Trag morgen 9 Uhr Zahnarzt ein'), 'idea')
assert.equal(pickRoute('Scanne den Raum'), 'board')
assert.equal(pickRoute('den Raum scannen'), 'board')
assert.equal(pickRoute('Scan beenden'), 'board')
assert.equal(pickRoute('nächster Lidl'), 'poi')
assert.equal(pickRoute('Zeig mir London'), 'hud')
assert.equal(parseBoardIntent('Go'), null)
assert.equal(pickRoute('Zeig Projekt Einkauf'), 'idea')
assert.equal(pickRoute('Zeig Sprints'), 'board')
assert.equal(pickRoute('Hintergrund blau schwarz'), 'board')
assert.equal(pickRoute('Mach einen Sprintplan für Idee 1'), 'idea')
assert.equal(pickRoute('Die erste'), null)
assert.equal(routeForEval('Die zweite'), 'ordinal')

const knopf = musterVariants('knopf')
assert.deepEqual(knopf.map((v) => v.motion), ['sofort', 'gleiten', 'aufklappen'])
assert.ok(knopf.every((v) => v.blocks[0].zeile === 'Weiter' && v.blocks[0].art === 'knopf'))
const karte = musterVariants('karte')
assert.deepEqual(karte.map((v) => v.name), ['Flach', 'Haarlinie', 'Akzentlinie'])
assert.equal(unknownArtReply().includes('Leiste'), true)
assert.equal(unknownArtReply().includes('Tab'), true)

const shop = fallbackFromWork('Einkaufsliste mit Listen und einem Knopf Fertig')
assert.equal(shop.variants.length, 3)
assert.equal(shop.title, 'Einkaufsliste')
assert.ok(shop.variants.some((v) => v.blocks.some((b) => b.art === 'knopf' && b.zeile === 'Fertig')))
assert.ok(shop.variants.every((v) => v.blocks.every((b) => ['leiste', 'liste', 'karte', 'knopf', 'feld', 'tab'].includes(b.art))))
assert.equal(shop.variants.some((v) => v.blocks.some((b) => /zahnarzt|9 Uhr|termin/i.test(b.zeile))), false)
assert.equal(fallbackFromWork('nur ein Satz ohne Fläche'), null)
assert.equal(blocksFromWork('Einkaufsliste').length, 1)
assert.equal(blocksFromWork('Einkaufsliste')[0].art, 'liste')

const notes = fallbackFromWork('Notizen, drei Karten, ein Feld oben')
assert.equal(notes.variants.length, 3)
assert.equal(notes.variants[0].blocks.filter((b) => b.art === 'karte').length, 3)
assert.equal(notes.title, 'Notizen')

const dirty = readModelFill(
  {
    title: 'X'.repeat(90),
    motion: 'quer',
    variants: [
      { name: 'A', blocks: [{ art: 'liste', zeile: 'Z'.repeat(60) }, { art: 'button', zeile: 'weg' }] },
      { name: 'B', blocks: [{ art: 'knopf', zeile: '' }] },
      { name: 'C', blocks: [] },
      { name: 'D', blocks: [{ art: 'feld', zeile: 'eins' }] },
      { name: 'E', blocks: [{ art: 'tab', zeile: 'zwei' }] },
    ],
  },
  'Liste',
)
assert.equal(dirty.title.length, 80)
assert.equal(dirty.motion, 'sofort')
assert.equal(dirty.variants.length, 3)
assert.equal(dirty.variants[0].blocks.length, 1)
assert.equal(dirty.variants[0].blocks[0].zeile.length, 42)
assert.equal(dirty.variants[1].blocks[0].zeile, 'Noch leer.')
assert.equal(readModelFill({ variants: [{ name: 'leer', blocks: [{ art: 'route', zeile: 'x' }] }] }, 'x'), null)

const conv = await createConversation('Entwurf')
saveSettings({
  entwurf_id: '',
  entwurf_muster: '',
  entwurf_status: '',
  ablauf_status: '',
  ablauf_id: '',
  scan_json: '',
  tischplatte_on: true,
})
await clearStore('drafts')

const missing = await handleBoard(conv.id, 'Entwirf das')
assert.equal(missing.reply, 'Was soll der Entwurf zeigen?')
assert.equal(loadSettings().entwurf_id, '')

const opened = await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
assert.match(opened.reply, /Entwurf\. Einkaufsliste\./)
assert.match(opened.reply, /Sag die erste, die zweite oder die dritte\./)
assert.equal((await listIdeas()).length, 0)
assert.equal((await listPortfolio()).length, 0)
const firstId = loadSettings().entwurf_id
assert.ok(firstId)
assert.equal(loadSettings().entwurf_status, 'offen')
assert.equal(draftFramesOpen(), true)
assert.equal(routeForEval('Die zweite'), 'board')
let rows = await getAll('drafts')
assert.equal(rows.length, 1)
assert.equal(rows[0].kind, 'app')
assert.equal(rows[0].pick, null)

const second = await handleBoard(conv.id, 'Die zweite')
assert.match(second.reply, /^Entwurf 2\. Einkaufsliste\./)
rows = await getAll('drafts')
assert.equal(rows[0].pick, 1)
assert.equal(rows[0].status, 'gewählt')

const again = await handleBoard(conv.id, 'Entwirf: Notizen, drei Karten, ein Feld oben')
assert.match(again.reply, /Entwurf\. Notizen\./)
rows = await getAll('drafts')
assert.equal(rows.find((r) => r.id === firstId).status, 'zu')
assert.equal(rows.filter((r) => r.status === 'offen').length, 1)
const lone = rows.find((r) => r.status === 'offen')
lone.variants = [lone.variants[0]]
const { put } = await import('../src/engine/store.ts')
await put('drafts', lone)
const tooFar = await handleBoard(conv.id, 'Die dritte')
assert.equal(tooFar.reply, 'Die Zeile gibt es nicht.')

saveSettings({ ablauf_status: 'warten' })
const blocked = await handleBoard(conv.id, 'Entwirf eine App: Einkauf')
assert.equal(blocked.reply, 'Erst den Ablauf.')
saveSettings({ ablauf_status: '', scan_json: JSON.stringify({ phase: 'live', target: 'room', name: 'Raum' }) })
const scanning = await handleBoard(conv.id, 'Entwirf eine App: Einkauf')
assert.equal(scanning.reply, 'Erst den Scan.')
saveSettings({ scan_json: '' })

await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
const scanDraft = loadSettings().entwurf_id
const scanStart = await handleBoard(conv.id, 'Scanne den Raum')
assert.match(scanStart.reply, /Scan läuft/)
assert.equal(loadSettings().entwurf_id, '')
assert.equal((await getAll('drafts')).find((r) => r.id === scanDraft).status, 'offen')
const during = await handleBoard(conv.id, 'Entwirf eine App: Einkauf')
assert.equal(during.reply, 'Erst den Scan.')
const scanEnd = await handleBoard(conv.id, 'Scan beenden')
assert.match(scanEnd.reply, /Keine Tiefenwerte/)
assert.equal(loadScan().phase, 'off')
assert.equal(loadSettings().entwurf_id, scanDraft)
assert.equal(draftFramesOpen(), true)
saveSettings({
  scan_json: JSON.stringify({
    phase: 'model',
    target: 'room',
    name: 'Raum',
    depth: true,
    note: '',
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    objects: [],
  }),
})
const onModel = await handleBoard(conv.id, 'Entwirf eine App: Einkauf')
assert.equal(onModel.reply, 'Erst den Scan.')
saveSettings({ scan_json: '' })

const inspire = await handleBoard(conv.id, 'Zeig mir Inspiration zum Knopf')
assert.match(inspire.reply, /1\. sofort/)
assert.match(inspire.reply, /Weiter|sofort/)
const kept = await handleBoard(conv.id, 'Die zweite')
assert.match(kept.reply, /zweite Muster bleibt für den nächsten Entwurf/)
assert.equal(loadSettings().entwurf_muster, 'knopf:1')

const shaped = await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
assert.match(shaped.reply, /Entwurf\. Einkaufsliste\./)
const shown = (await getAll('drafts')).find((r) => r.id === loadSettings().entwurf_id)
assert.ok(shown.variants.some((v) => v.blocks.some((b) => b.art === 'knopf' && b.muster === 1)))

const sprints = await handleBoard(conv.id, 'Zeig Sprints')
assert.match(sprints.reply, /Sicht sprints/)
assert.equal(loadSettings().entwurf_id, '')
const hidden = (await getAll('drafts')).find((r) => r.id === shown.id)
assert.equal(hidden.status, 'offen')
assert.equal(parseBoardIntent('Die erste'), null)

const closed = await handleBoard(conv.id, 'Entwurf zu')
assert.equal(closed.reply, 'Entwurf zu.')
assert.equal(loadSettings().entwurf_muster, '')
assert.equal((await getAll('drafts')).find((r) => r.id === shown.id).status, 'zu')
const none = await handleBoard(conv.id, 'Entwurf zu')
assert.equal(none.reply, 'Es ist kein Entwurf offen.')

const bad = await handleBoard(conv.id, 'Inspiration zum Quader')
assert.match(bad.reply, /Den Baustein gibt es nicht/)
assert.equal(loadSettings().entwurf_id, '')

await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
const beforeFenster = loadSettings().entwurf_id
const fenster = await handleAblauf(conv.id, 'Fenster zu')
assert.match(fenster.reply, /kein Ablauf offen|Ablauf zu/)
assert.equal(loadSettings().entwurf_id, '')
assert.equal((await getAll('drafts')).find((r) => r.id === beforeFenster).status, 'zu')

const { handleIdea } = await import('../src/engine/idea.ts')
await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
const liveId = loadSettings().entwurf_id
const planned = await handleIdea(conv.id, 'Plane das: Trag morgen 9 Uhr Zahnarzt ein')
assert.match(planned.reply, /PLAN|Skript/)
assert.equal(loadSettings().plan_phase, 'live')
const overPlan = await handleBoard(conv.id, 'Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig')
assert.equal(overPlan.reply, 'Erst den Ablauf.')
assert.equal(loadSettings().entwurf_id, liveId)
assert.equal(draftFramesOpen(), false)
const planZu = await handleIdea(conv.id, 'Plan zu')
assert.match(planZu.reply, /Planungsbildschirm ist zu/)
assert.equal(loadSettings().plan_phase, '')
assert.equal(loadSettings().entwurf_id, liveId)
const fensterLive = await handleIdea(conv.id, 'Fenster zu')
assert.match(fensterLive.reply, /Planfenster/)
assert.equal(loadSettings().entwurf_id, '')
assert.equal((await getAll('drafts')).find((r) => r.id === liveId).status, 'zu')
saveSettings({ plan_phase: '', plan_idea_id: '', plan_script_at: 0 })

await addMessage(conv.id, 'user', 'Notizen mit drei Karten')
const fromPrev = await handleBoard(conv.id, 'Entwirf das')
assert.match(fromPrev.reply, /Entwurf\. Notizen/)

const snap = await buildBackup(false)
assert.ok(snap.drafts.length >= 1)
assert.match(previewBackup(snap).message, new RegExp(`${snap.drafts.length} Entwürfe`))
assert.equal(stripSettings({ entwurf_id: 'abc', entwurf_muster: 'knopf:1' }).entwurf_id, 'abc')
assert.equal('entwurf_id' in stripSettings({ entwurf_id: 'abc', last_taxi_json: 'x' }), true)
const round = asBackup(JSON.parse(JSON.stringify(snap)))
await applyBackup(round)
assert.ok((await getAll('drafts')).some((r) => r.id === snap.drafts[0].id))

const empty = { ...snap, drafts: [] }
await applyBackup(asBackup(empty))
assert.equal((await getAll('drafts')).length, 0)
assert.match(previewBackup(asBackup(empty)).message, /0 Entwürfe/)

await handleBoard(conv.id, 'Hast du Animationen zur Karte')
const keptDrafts = await getAll('drafts')
const oldFile = { ...snap }
delete oldFile.drafts
await applyBackup(asBackup(oldFile))
assert.equal((await getAll('drafts')).length, keptDrafts.length)

const broken = asBackup({ ...snap, drafts: snap.drafts })
broken.settings = { ...broken.settings, entwurf_id: 'fehlt', entwurf_status: 'offen' }
await applyBackup(broken)
assert.equal(loadSettings().entwurf_id, '')
assert.equal(loadSettings().entwurf_status, '')

const gold = new Map(evalCases().map((c) => [c.text, c.expect]))
for (const text of [
  'Entwirf eine App: Einkaufsliste',
  'Entwirf das',
  'Entwirf: Notizen',
  'Zeig mir Inspiration zum Knopf',
  'Hast du Animationen zur Karte',
  'Entwurf zu',
]) {
  assert.equal(gold.get(text), 'board', text)
}
assert.equal(gold.get('Simuliere Kalender'), 'board')
assert.equal(gold.get('Plane das: Trag morgen 9 Uhr Zahnarzt ein'), 'idea')
assert.equal(gold.get('nächster Lidl'), 'poi')
assert.equal(gold.get('Zeig mir London'), 'hud')
assert.equal(groupsForLane('heute')[0].title, '18.25 Entwurf')
assert.ok(TEST_COPY_GROUPS.some((g) => g.title === '18.25 Entwurf' && g.items.some((i) => i.text.startsWith('Entwirf eine App'))))

console.log('entwurf ok')

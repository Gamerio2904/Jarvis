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

const { parseThemeHint, serializeTheme, DEFAULT_THEME, cycleMotif } = await import('../src/engine/board-theme.ts')
const { parseBoardIntent } = await import('../src/engine/board-parse.ts')
const { parseDeskIntent } = await import('../src/engine/desk-parse.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { handleBoard } = await import('../src/engine/board.ts')
const { catalogByArea, catalogHasRice, FEATURE_CATALOG, CATALOG_STAND } = await import('../src/engine/feature-catalog.ts')
const { parseBoardJobs, upsertJob, stopJobs, BOARD_JOB_CAP } = await import('../src/engine/board-jobs.ts')
const { loadSettings } = await import('../src/engine/store.ts')

assert.deepEqual(parseThemeHint('{ "foo": 1, "accent": "#7dd3c7", "motif": "grid" }'), {
  ...DEFAULT_THEME,
  accent: '#7dd3c7',
  motif: 'grid',
})
assert.equal(parseThemeHint('kein json').motif, DEFAULT_THEME.motif)
assert.equal(cycleMotif('orbit'), 'grid')
const round = parseThemeHint(serializeTheme({ ...DEFAULT_THEME, glow: 0.8 }))
assert.equal(round.glow, 0.8)

assert.equal(parseBoardIntent('Tischplatte an')?.kind, 'on')
assert.equal(parseBoardIntent('Werkbank an')?.kind, 'on')
assert.equal(parseBoardIntent('Tischplatte aus')?.kind, 'off')
assert.equal(parseBoardIntent('Tisch an'), null)
assert.equal(parseDeskIntent('Tischplatte an'), null)
assert.equal(parseDeskIntent('Schreibtisch an')?.on, true)
assert.equal(parseDeskIntent('Tisch an')?.on, true)
assert.equal(parseBoardIntent('Zeig Sprints')?.kind, 'view')
assert.equal(parseBoardIntent('Zeig Module')?.view, 'modules')
assert.equal(parseBoardIntent('Simuliere Kalender')?.view, 'sim')
assert.equal(parseBoardIntent('Was ist geplant')?.mode, 'planned')
assert.equal(parseBoardIntent('Was kann Jarvis')?.mode, 'can')
assert.equal(parseBoardIntent('Was kannst du?'), null)
assert.equal(parseBoardIntent('Welche Features hat der Kalender')?.area, 'calendar')
assert.equal(parseBoardIntent('Lies die Docs zu Deep Research')?.area, 'research')
const jobs = parseBoardIntent('Such Open Source zu ICS und plane Sprints für Idee 1')
assert.equal(jobs?.kind, 'jobs')
assert.match(jobs?.research || '', /ICS/)
assert.equal(jobs?.planIndex, 1)
assert.equal(parseBoardIntent('Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1')?.kind, 'jobs')

assert.equal(pickRoute('Tischplatte an'), 'board')
assert.equal(pickRoute('Schreibtisch an'), 'desk')
assert.equal(pickRoute('Tisch an'), 'desk')
assert.equal(pickRoute('Zeig Sprints'), 'board')
assert.equal(pickRoute('Simuliere Kalender'), 'board')
assert.equal(routeForEval('Was kannst du?'), 'help')
assert.equal(parseBoardIntent('Was kann Jarvis?')?.mode, 'can')
assert.equal(parseBoardIntent('Was ist geplant?')?.mode, 'planned')
assert.equal(parseBoardIntent('Tischplatte an?')?.kind, 'on')
assert.equal(pickRoute('Was kann Jarvis?'), 'board')
assert.equal(pickRoute('Idee: Tik-Tak-To auf der Tischplatte'), 'idea')
assert.equal(pickRoute('Wetter Berlin'), 'weather')
assert.equal(pickRoute('alle Steckdosen aus'), 'plug')

const { catalogPlanned, versionAtLeast } = await import('../src/engine/feature-catalog.ts')
assert.equal(versionAtLeast('18.16.0', '18.16.0'), true)
assert.equal(versionAtLeast('2.1.0', '18.16.0'), false)
assert.equal(versionAtLeast('18.2.0', '18.16.0'), false)
assert.equal(versionAtLeast('18.19.0', '18.16.0'), true)
const planned = catalogPlanned('18.16.0')
assert.ok(planned.every((r) => versionAtLeast(r.version, '18.16.0')))
assert.ok(!planned.some((r) => r.id === 'plug' || r.id === 'weather' || r.id === 'overlay'))
assert.ok(planned.some((r) => r.id === 'board'))

const plannedReply = await handleBoard('c1', 'Was ist geplant')
assert.doesNotMatch(plannedReply.reply || '', /Steckdosen|Wetter im Chat|Overlay \/ Folie/)
assert.match(plannedReply.reply || '', /Tischplatte|Kalender/)

const unknown = await handleBoard('c1', 'Welche Features hat der Kochrezeptxyz')
assert.match(unknown.reply || '', /steht nicht im Katalog/)

const on = await handleBoard('c1', 'Tischplatte an')
assert.equal(on.handled, true)
assert.equal(loadSettings().tischplatte_on, true)
assert.match(on.reply || '', /Icons aus/)
assert.doesNotMatch(on.reply || '', /Hologramm|Schwarm|Agenten-Netz/)

const { nextTheme } = await import('../src/engine/board-theme.ts')
const themed = nextTheme(DEFAULT_THEME)
assert.notEqual(themed.motif, DEFAULT_THEME.motif)
assert.notEqual(themed.accent, DEFAULT_THEME.accent)
const themeReply = await handleBoard('c1', 'Neuer Hintergrund')
assert.match(themeReply.reply || '', /Hintergrund:/)
assert.notEqual(loadSettings().tischplatte_hint, '')
const blue = await handleBoard('c1', 'Hintergrund blau schwarz')
assert.equal(parseBoardIntent('Hintergrund blau schwarz')?.kind, 'theme')
assert.match(blue.reply || '', /Blau auf Schwarz/)
assert.match(loadSettings().tischplatte_hint, /pulse/)
assert.match(loadSettings().tischplatte_hint, /#8eb6ff/)
assert.equal(pickRoute('Hintergrund blau schwarz'), 'board')
const stay = await handleBoard('c1', 'Hintergrund lila pink')
assert.match(stay.reply || '', /bleibt/)
assert.match(loadSettings().tischplatte_hint, /#8eb6ff/)
const sourcesReply = await handleBoard('c1', 'Zeig Quellen')
assert.match(sourcesReply.reply || '', /Sicht research/)
assert.match(sourcesReply.reply || '', /Keine Quellen|Quellen:/)

const cal = catalogByArea('calendar')
assert.ok(cal.some((r) => r.id === 'calendar' || r.area === 'calendar'))
assert.equal(catalogByArea('kochrezeptxyz').length, 0)
assert.equal(catalogHasRice(), false)
assert.ok(FEATURE_CATALOG.every((r) => r.version && r.can))
assert.equal(CATALOG_STAND, '18.20.0')

const emptyJobs = parseBoardJobs('[{"id":"1","kind":"swarm","status":"running","label":"x","at":1}]')
assert.equal(emptyJobs.length, 0)
let rows = []
for (let i = 0; i < 6; i += 1) {
  rows = upsertJob(rows, { id: String(i), kind: 'research', status: 'running', label: 'Recherche läuft', at: Date.now() })
}
assert.equal(rows.length, BOARD_JOB_CAP)
assert.ok(stopJobs(rows).every((j) => j.status === 'stopped'))

console.log('ok test-board')

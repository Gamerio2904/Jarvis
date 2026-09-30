// @ts-nocheck
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

const here = dirname(fileURLToPath(import.meta.url))
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8')

const { APP_VERSION } = await import('../src/engine/store.ts')
const { PKG_VERSION, versionCodeOf } = await import('./app-version.mjs')
assert.equal(versionCodeOf('18.19.0'), 181900)
assert.equal(APP_VERSION, PKG_VERSION)
assert.ok(versionCodeOf(APP_VERSION) >= 182000)

const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { parseHudIntent } = await import('../src/engine/hud-parse.ts')
const { parseBoardIntent } = await import('../src/engine/board-parse.ts')
const { catalogHasRice } = await import('../src/engine/feature-catalog.ts')

assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)

assert.equal(GOLD_EXPECT['Tischplatte an'], 'board')
assert.equal(GOLD_EXPECT['Schreibtisch an'], 'desk')
assert.equal(GOLD_EXPECT['Tisch an'], 'desk')
assert.equal(GOLD_EXPECT['Was kannst du?'], 'help')
assert.equal(GOLD_EXPECT['Was kann Jarvis'], 'board')
assert.equal(GOLD_EXPECT['Zeig Homescreen'], 'app')
assert.equal(pickRoute('Tischplatte an'), 'board')
assert.equal(pickRoute('Simuliere Kalender'), 'board')
assert.equal(pickRoute('Was kann Jarvis?'), 'board')
assert.equal(pickRoute('Idee: Tik-Tak-To auf der Tischplatte'), 'idea')
assert.equal(parseHudIntent('Zeig Tischplatte'), null)
assert.equal(parseBoardIntent('Tischplatte an')?.kind, 'on')
assert.equal(parseBoardIntent('Was kann Jarvis?')?.mode, 'can')
assert.equal(catalogHasRice(), false)

const css = src('src/index.css')
assert.match(css, /\.home-wall--launcher/)
assert.match(css, /\.home-wall--board/)
assert.match(css, /\.workbench/)
assert.match(css, /backdrop-filter/)
assert.match(css, /\.home-grid\[hidden\]/)
assert.match(css, /display:\s*none\s*!important/)
assert.doesNotMatch(css, /var\(--app-tint\)/)

const home = src('src/ui/HomeScreen.tsx')
assert.match(home, /is-tischplatte/)
assert.match(home, /home-wall--launcher/)
assert.match(home, /home-wall--board/)
assert.match(home, /inert=\{tischplatteOn\}/)
assert.doesNotMatch(home, /--app-tint/)
assert.doesNotMatch(home, /WebGL|tldraw|xyflow/)

const glance = src('src/ui/GlanceRail.tsx')
assert.match(glance, /Tischplatte/)
assert.match(glance, /onTischplatte/)

const app = src('src/App.tsx')
assert.match(app, /tischplatteOn/)
assert.match(app, /jarvis-settings/)
assert.doesNotMatch(app, /tldraw|@xyflow/)

const bench = src('src/ui/Workbench.tsx')
assert.match(bench, /Kein Auftrag|Idee/)
assert.doesNotMatch(bench, /Gesicht|portrait|hologram/i)

console.log('ok 18.19 tischplatte')

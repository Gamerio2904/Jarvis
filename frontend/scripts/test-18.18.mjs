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
assert.ok(versionCodeOf(APP_VERSION) >= 181800)
assert.ok(versionCodeOf(PKG_VERSION) >= 181800)
assert.equal(versionCodeOf('18.18.0'), 181800)

const { HOME_APPS, HOME_APP_IDS, isHomeAppId } = await import('../src/engine/home-apps.ts')
assert.deepEqual(
  HOME_APP_IDS.slice(),
  ['chat', 'voice', 'calendar', 'globe', 'lage', 'overlay', 'hirn', 'settings', 'watchlist', 'shopping', 'notes', 'todos'],
)
assert.equal(HOME_APPS.length, 12)
assert.ok(HOME_APPS.every((a) => isHomeAppId(a.id) && a.label && a.tint))

const { parseAppIntent } = await import('../src/engine/app-parse.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { UI_DOCK_IDS } = await import('../src/engine/ui-action.ts')
const { handleApp } = await import('../src/engine/app.ts')
const { clockLabel, weekdayLabel, readGlanceSnap } = await import('../src/engine/glance-snap.ts')
const { parseHudIntent } = await import('../src/engine/hud-parse.ts')
assert.equal(parseHudIntent('Zeig Homescreen'), null)

assert.ok(UI_DOCK_IDS.includes('home'))
assert.equal(parseAppIntent('Zeig Homescreen')?.action?.dock, 'home')
assert.equal(parseAppIntent('Öffne den Startbildschirm')?.action?.dock, 'home')
assert.equal(parseAppIntent('Zurück zum Start')?.action?.dock, 'home')
assert.equal(parseAppIntent('Zeig Lage')?.action?.dock, 'lage')
assert.equal(parseAppIntent('Zeig Chat')?.action?.dock, 'chat')
assert.equal(pickRoute('Zeig Homescreen'), 'app')
assert.equal(GOLD_EXPECT['Zeig Homescreen'], 'app')
assert.ok(TEST_PROMPTS.includes('Zeig Homescreen'))

const hit = await handleApp('c1', 'Zeig Homescreen')
assert.equal(hit.handled, true)
assert.equal(hit.tool?.result?.dock, 'home')
assert.match(hit.reply || '', /Start/)

const now = new Date('2026-09-29T16:42:00')
assert.equal(clockLabel(now), '16:42')
assert.match(weekdayLabel(now), /Sep/)
const snap = await readGlanceSnap(now)
assert.equal(snap.next, 'Nichts geplant')
assert.equal(snap.weather, 'Wetter im Chat fragen')
assert.equal(snap.shop, 0)
assert.equal(snap.groq, false)
assert.equal(snap.gemini, false)
assert.equal(snap.version, APP_VERSION)

const app = src('src/App.tsx')
assert.match(app, /homeOpen/)
assert.match(app, /GlanceRail/)
assert.match(app, /MiniChat/)
assert.match(app, /VoiceSphere/)
assert.match(app, /launchHomeApp/)
assert.doesNotMatch(app, /WebGL|ical\.js/)

const css = src('src/index.css')
assert.match(css, /\.home-screen/)
assert.match(css, /\.glance-rail/)
assert.match(css, /\.mini-chat/)
assert.match(css, /\.voice-sphere/)
assert.match(css, /\.voice-compact/)
assert.match(css, /rotateX/)
assert.match(css, /sphereTalk/)

console.log('ok 18.18 homescreen')

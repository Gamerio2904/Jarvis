import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '../src/index.css'), 'utf8')
const lage = readFileSync(join(here, '../src/ui/lage/Lage.tsx'), 'utf8')
const globe = readFileSync(join(here, '../src/ui/lage/GlobeView.tsx'), 'utf8')
const app = readFileSync(join(here, '../src/App.tsx'), 'utf8')
const hud = readFileSync(join(here, '../src/engine/hud.ts'), 'utf8')
const layers = readFileSync(join(here, '../src/engine/globe-layers.ts'), 'utf8')

assert.match(
  css,
  /\.main\.is-lage\.is-lage-chat \{[\s\S]{0,180}grid-template-rows:\s*minmax\(240px,\s*1\.55fr\)/,
  'Körper-Zeile braucht eine Mindest-Höhe, sonst wird das Netz zerquetscht',
)
assert.match(css, /\.main\.is-lage\.is-lage-chat:has\(\.empty\) \{[\s\S]{0,120}minmax\(280px/)
assert.match(
  css,
  /\.main\.is-lage\.is-lage-chat \.lage\.is-compact \.agent-map-canvas \{[\s\S]{0,80}min-height:\s*160px/,
)
assert.match(css, /\.main\.is-lage\.is-lage-chat \.empty-halo \{[\s\S]{0,40}display:\s*none/)
assert.match(css, /\.main\.is-lage\.is-lage-chat \.wake-bubble[\s\S]{0,80}display:\s*none/)
assert.match(css, /\.main\.is-lage\.is-lage-chat \.agent-status-bar[\s\S]{0,80}display:\s*none/)
assert.match(css, /\.app\.is-kb \.main\.is-lage\.is-lage-chat \.lage\.is-compact \.agent-map-canvas \{[\s\S]{0,80}min-height:\s*0/)
assert.doesNotMatch(css, /\.main\.is-lage\.is-lage-chat \{[\s\S]{0,220}minmax\(0,\s*0\.92fr\)/)

assert.match(lage, /Waldbrände aus/)
assert.match(lage, /isGlobeLayerPin\(next\.kind\)/)
assert.doesNotMatch(lage, /pin-bubble-backdrop/)
assert.doesNotMatch(lage, /<>[\s\S]{0,80}pin-bubble[\s\S]{0,400}<\/>/)

assert.match(globe, /pickTappedPin/)
assert.match(globe, /pin\.kind === 'fire' \|\| pin\.kind === 'quake'[\s\S]{0,40}5\.5/)
assert.match(globe, /Math\.hypot\(p\.x - start\.x, p\.y - start\.y\) > 22/)

assert.match(app, /id === 'lage'[\s\S]{0,500}globe_layer: ''/)
assert.match(hud, /intent\.kind === 'lage'[\s\S]{0,220}globe_layer: ''/)
assert.match(hud, /intent\.kind === 'view'[\s\S]{0,180}globe_layer: ''/)
assert.match(layers, /USGS · \$\{place\}/)

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

const { saveSettings, loadSettings } = await import('../src/engine/store.ts')
const { handleHud } = await import('../src/engine/hud.ts')

saveSettings({ globe_layer: 'fires', hud_force: true, hud_hidden: false, hud_view: 'globe' })
assert.equal(loadSettings().globe_layer, 'fires')
const lageAn = await handleHud('Lage an')
assert.equal(lageAn.handled, true)
assert.equal(loadSettings().globe_layer, '', 'Lage an darf Waldbrände nicht liegen lassen')

saveSettings({ globe_layer: 'fires', hud_force: true, hud_hidden: false, hud_view: 'globe' })
const koerper = await handleHud('Körper an')
assert.equal(koerper.handled, true)
assert.equal(loadSettings().globe_layer, '')
assert.equal(loadSettings().hud_view, 'body')

console.log('test:lage-body-globe ok')

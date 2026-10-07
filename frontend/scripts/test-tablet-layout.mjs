import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, '../src/index.css'), 'utf8')
const app = readFileSync(join(here, '../src/App.tsx'), 'utf8')
const lage = readFileSync(join(here, '../src/ui/lage/Lage.tsx'), 'utf8')
const blocks = readFileSync(join(here, '../src/engine/chat-blocks.ts'), 'utf8')

assert.match(css, /min-width:\s*900px[\s\S]*\.main\.is-lage:not\(\.is-lage-sidechat\) \.messages/)
assert.match(css, /\.main\.is-lage\.is-lage-sidechat/)
assert.match(css, /\.sidebar \.nav-island-side \{[\s\S]*order:\s*4/)
assert.match(css, /data-motif='grid'/)
assert.match(css, /data-motif='pulse'/)
assert.match(css, /\.app:has\(\.mini-chat\.is-open\) \.home-screen\.is-tischplatte/)
assert.match(app, /function showTischplatte/)
assert.match(app, /is-lage-sidechat/)
assert.match(app, /onToggleSideChat/)
assert.match(app, /tischplatte_on: on/)
assert.match(lage, /data-lage-chat/)
assert.match(lage, /lage-stage/)
assert.match(blocks, /hud\|board/)

const { groupsForLane, unassignedCopyTitles } = await import('../src/engine/probe-lanes.ts')
const tafel = groupsForLane('heute').find((g) => g.title === '18.20 Tafel & Lage')
assert.ok(tafel, '18.20 Tafel & Lage fehlt in Spur Heute')
const texts = tafel.items.map((i) => i.text)
for (const sentence of [
  'Lage an',
  'Tischplatte an',
  'Idee: Tik-Tak-To auf der Tischplatte',
  'Zeig Sprints',
  'Neuer Hintergrund',
  'Zeig Quellen',
  'Such Open Source zu Tic-Tac-Toe und plane Sprints für Idee 1',
  'Tischplatte aus',
  'Lage aus',
]) {
  assert.ok(texts.includes(sentence), sentence)
}
const tafel22 = groupsForLane('heute').find((g) => g.title === '18.22 Tafel')
assert.ok(tafel22, '18.22 Tafel fehlt in Spur Heute')
for (const sentence of [
  'Tischplatte an',
  'Schieb die Sprintliste nach links',
  'Wirf die Quellen vom Tisch',
  'Räum den Tisch',
  'Schieb das Poster nach links',
  'Hintergrund blau schwarz',
  'nächster Lidl',
]) {
  assert.ok(tafel22.items.some((i) => i.text === sentence), sentence)
}
const qr = groupsForLane('heute').find((g) => g.title === '18.21 Datei-QR')
assert.ok(qr, '18.21 Datei-QR fehlt in Spur Heute')
for (const sentence of [
  'Übertrage das fürs Tablet',
  'Mach den QR-Code',
  'PC QR scannen',
  'Lies das PDF',
]) {
  assert.ok(qr.items.some((i) => i.text === sentence), sentence)
}
const ablauf = groupsForLane('heute').find((g) => g.title === '18.23 Ablauf')
assert.ok(ablauf, '18.23 Ablauf fehlt in Spur Heute')
for (const sentence of ['Plane das', 'Plan zu', 'Hausstand exportieren', 'Ändere den Wecker: 7:30']) {
  assert.ok(ablauf.items.some((i) => i.text === sentence), sentence)
}
assert.ok(groupsForLane('heute').some((g) => g.title === '18.20 YouTube-Highlights'))
assert.ok(groupsForLane('story').some((g) => g.title === '🟢 18.20 Tafel der Reihe nach'))
assert.deepEqual(unassignedCopyTitles(), [])

console.log('ok test-tablet-layout')

const { deviceClassFor } = await import('../src/engine/device-class.ts')
assert.equal(deviceClassFor(390, 844, true), 'phone')
assert.equal(deviceClassFor(844, 390, true), 'phone')
assert.equal(deviceClassFor(820, 1180, true), 'tablet')
assert.equal(deviceClassFor(1180, 820, true), 'tablet')
assert.equal(deviceClassFor(1600, 900, false), 'desktop')
assert.match(css, /html\[data-device='phone'\] \.app/)
assert.match(css, /html\[data-device='tablet'\] \.messages/)
assert.match(app, /watchDeviceClass/)
console.log('ok device-class')

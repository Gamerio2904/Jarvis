import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { parseTabletMode, parseTabletPair, STAND_UPDATED_LINE } = await import('../src/engine/tablet-mode.ts')
const { parsePairCode, verdictFor, pickLocal } = await import('../src/engine/tablet-sync.ts')

for (const t of ['Tabletmodus an', 'tablet modus an', 'Tablet-Modus', 'schalte den Tabletmodus ein', 'Tabletmodus starten', 'Tabletmodus an.']) {
  assert.equal(parseTabletMode(t), 'on', t)
}
for (const t of ['Tabletmodus aus', 'beende den Tabletmodus', 'Tablet-Modus beenden', 'Tabletmodus ab']) {
  assert.equal(parseTabletMode(t), 'off', t)
}
for (const t of ['Was ist der Tabletmodus und wie geht er genau zu bedienen?', 'tablet', 'Wetter']) {
  assert.equal(parseTabletMode(t), null, t)
}
assert.equal(parseTabletPair('Handy koppeln'), 'pair')
assert.equal(parseTabletPair('Kopplung zurücksetzen'), 'reset')
assert.equal(parseTabletPair('koppeln sie das bitte irgendwie'), null)
assert.equal(STAND_UPDATED_LINE, 'Hausstand aktualisiert, Sir.')

const tok = 'a'.repeat(24)
assert.deepEqual(parsePairCode(`jarvis-haus:v2|http://192.168.1.20:8765|${tok}`), { url: 'http://192.168.1.20:8765', token: tok, port: 8765 })
assert.equal(parsePairCode('jarvis-haus:v2|https://evil.example|' + tok), null)
assert.equal(parsePairCode('jarvis-haus:v2|http://192.168.1.20:8765|zz'), null)
assert.equal(parsePairCode('jarvis-haus:v1|http://192.168.1.20:8765/hausstand?t=abc'), null)

assert.equal(verdictFor('', ''), 'same')
assert.equal(verdictFor('', '2026-01-01T00:00:00.000Z'), 'remote_newer')
assert.equal(verdictFor('2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), 'local_newer')
assert.equal(verdictFor('kaputt', '2026-01-01T00:00:00.000Z'), 'remote_newer')

const kept = pickLocal({ tablet_mode: true, sync_token: 'x', wake_word: true, hud_force: true, hud_hidden: false, hud_view: 'globe', tischplatte_on: false, sync_url: 'u' })
assert.equal(kept.tablet_mode, true)
assert.equal(kept.sync_token, 'x')

const java = readFileSync(new URL('../native/haus/JarvisHausPlugin.java', import.meta.url), 'utf8')
for (const needle of ['serverStart', 'serverUpdate', 'serverStop', 'discover', '/ping', 'MessageDigest.isEqual', 'HOME_PORT = 8765']) {
  assert.ok(java.includes(needle), needle)
}
const svc = readFileSync(new URL('../native/haus/JarvisHausService.java', import.meta.url), 'utf8')
assert.ok(svc.includes('startForeground') && svc.includes('PARTIAL_WAKE_LOCK'))
const apply = readFileSync(new URL('./apply-native-tv.mjs', import.meta.url), 'utf8')
assert.ok(apply.includes('app.jarvis.haus.JarvisHausService'))
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
assert.ok(app.includes('applyTabletTool') && app.includes('is-tablet-mode') && app.includes('useTabletRuntime'))
console.log('ok test-tablet-sync')

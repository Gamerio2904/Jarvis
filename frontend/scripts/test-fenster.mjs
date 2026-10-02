// @ts-nocheck
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const { parseFensterConnect, parseFensterShow } = await import('../src/engine/fenster-parse.ts')
const {
  acceptJa,
  commitFensterGrant,
  grantFromConfirm,
  handleFensterCommand,
  needPairReply,
  noPeerReply,
  readFensterGrant,
  requestFromBody,
  resetFensterOut,
  saveFensterRequest,
  sentReply,
  shownReply,
  surfaceAllowed,
} = await import('../src/engine/fenster.ts')
const { loadSettings, saveSettings } = await import('../src/engine/store.ts')

assert.equal(parseFensterConnect('Verbinde das Handy'), 'handy')
assert.equal(parseFensterConnect('Verbinde das Tablet'), 'tablet')
assert.equal(parseFensterConnect('Kopfhörer verbinden'), null)
assert.equal(parseFensterShow('Zeig die Tischplatte auf dem Handy')?.surface, 'tisch')
assert.equal(parseFensterShow('Zeig die Tischplatte auf dem Handy')?.kind, 'handy')
assert.equal(parseFensterShow('Öffne auf dem Tablet die Lage')?.surface, 'lage')
assert.equal(parseFensterShow('Öffne auf dem Tablet die Lage')?.kind, 'tablet')
assert.equal(parseFensterShow('Zeig die Lage'), null)

const none = await handleFensterCommand('Verbinde das Handy', { seek: async () => [], post: async () => false })
assert.match(none, /Kein Handy antwortet/)
assert.equal(none, noPeerReply('handy'))

const posted = []
const seek = async () => [
  { host: '8.8.8.8', port: 18792, name: 'Ultron', kind: 'handy' },
  { host: '10.0.0.5', port: 18792, name: 'Ultron', kind: 'handy' },
  { host: '10.0.0.8', port: 18792, name: 'Ultron', kind: 'tablet' },
]
const post = async (peer, body) => {
  posted.push({ peer, body })
  return true
}
resetFensterOut()
const sent = await handleFensterCommand('Verbinde das Handy', { seek, post })
assert.equal(sent, sentReply('handy'))
assert.equal(posted.length, 1)
assert.equal(posted[0].peer.host, '10.0.0.5')
assert.equal(posted[0].body.op, 'anfrage')

const unpaired = await handleFensterCommand('Zeig die Tischplatte auf dem Handy', { seek, post })
assert.match(unpaired, /Noch nicht gekoppelt/)
assert.equal(unpaired, needPairReply())

const bad = requestFromBody({ op: 'anfrage', nonce: 'abcdef1234567890', fromKind: 'handy', fromName: 'Ultron' }, '8.8.8.8')
assert.equal(bad, null)
const good = requestFromBody({ op: 'anfrage', nonce: 'abcdef1234567890', fromKind: 'tablet', fromName: 'Ultron' }, '192.168.1.20')
assert.equal(good?.fromHost, '192.168.1.20')
assert.equal(good?.fromKind, 'tablet')

resetFensterOut()
posted.length = 0
await handleFensterCommand('Verbinde das Handy', { seek, post })
assert.equal(acceptJa({ op: 'ja', nonce: 'falsch', token: 'tokentokentoken', kind: 'handy' }, '10.0.0.5'), null)
assert.equal(acceptJa({ op: 'ja', nonce: posted[0].body.nonce, token: 'tokentokentoken', kind: 'tablet' }, '10.0.0.5'), null)
const pair = acceptJa({ op: 'ja', nonce: posted[0].body.nonce, token: 'tokentokentoken', kind: 'handy' }, '10.0.0.5')
assert.equal(pair?.host, '10.0.0.5')
assert.equal(pair?.token, 'tokentokentoken')

const wrongKind = await handleFensterCommand('Zeig die Lage auf dem Tablet', { seek, post })
assert.match(wrongKind, /Gekoppelt ist ein Handy/)

posted.length = 0
const shown = await handleFensterCommand('Zeig die Tischplatte auf dem Handy', { seek, post })
assert.equal(shown, shownReply('handy', 'tisch'))
assert.equal(posted[0].body.op, 'zeig')
assert.equal(posted[0].body.surface, 'tisch')
assert.equal(posted[0].body.token, 'tokentokentoken')

const request = {
  nonce: 'abcdef1234567890',
  fromHost: '192.168.1.9',
  fromPort: 18792,
  fromName: 'Ultron',
  fromKind: 'handy',
  at: Date.now(),
}
const prepared = await grantFromConfirm(request, 'handy')
assert.ok(prepared)
assert.equal(prepared.body.op, 'ja')
assert.ok(!JSON.stringify(loadSettings().fenster_grant_json || '').includes(prepared.body.token))
commitFensterGrant(prepared.grant)
const stored = readFensterGrant()
assert.equal(stored.tokenHash, prepared.grant.tokenHash)
assert.ok(!JSON.stringify(loadSettings().fenster_grant_json).includes(prepared.body.token))
assert.equal(await surfaceAllowed('falsch', 'tisch'), null)
assert.equal(await surfaceAllowed(prepared.body.token, 'tisch'), 'tisch')
assert.equal(await surfaceAllowed(prepared.body.token, 'tischlage'), null)

saveSettings({ fenster_pair_json: '' })
saveFensterRequest(null)

const main = src('native/tv/MainActivity.java')
const apply = src('scripts/apply-native-tv.mjs')
const java = src('native/fenster/JarvisFensterPlugin.java')
const sheet = src('src/ui/FensterSheet.tsx')
const css = src('src/ultron-shell.css')
const app = src('src/App.tsx')
assert.match(main, /JarvisFensterPlugin/)
assert.match(apply, /JarvisFensterPlugin\.java/)
assert.match(java, /ServerSocket/)
assert.doesNotMatch(java, /0\.0\.0\.0/)
assert.match(java, /18792/)
assert.match(app, /FensterSheet/)
assert.match(sheet, /Bestätigen/)
assert.match(sheet, /Ablehnen/)
assert.doesNotMatch(css.slice(css.indexOf('.fenster-sheet')), /backdrop-filter/)

console.log('test-fenster ok')

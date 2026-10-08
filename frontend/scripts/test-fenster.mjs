// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
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
  claimFensterRequest,
  grantFromConfirm,
  handleFensterCommand,
  needLanReply,
  needPairReply,
  noPeerReply,
  otherKindReply,
  readFensterGrant,
  requestFromBody,
  readFensterPair,
  stampFensterBody,
  fensterVersionOk,
  resetFensterOut,
  saveFensterRequest,
  sentReply,
  shownReply,
  surfaceAllowed,
  validateFensterProjectTarget,
} = await import('../src/engine/fenster.ts')
const { loadSettings, saveSettings, putIdea, listIdeas } = await import('../src/engine/store.ts')
const { APP_VERSION } = await import('../src/engine/store.ts')
const peerFingerprint = 'a'.repeat(64)
const peer = (host, kind) => ({
  host,
  port: 18792,
  name: 'Ultron',
  kind,
  fingerprint: peerFingerprint,
  appVersion: APP_VERSION,
  protocolVersion: 1,
})

assert.equal(parseFensterConnect('Verbinde das Handy'), 'handy')
assert.equal(parseFensterConnect('Verbinde das Tablet'), 'tablet')
assert.equal(parseFensterConnect('Kopfhörer verbinden'), null)
assert.equal(parseFensterShow('Zeig die Tischplatte auf dem Handy')?.surface, 'tisch')
assert.equal(parseFensterShow('Zeig die Tischplatte auf dem Handy')?.kind, 'handy')
assert.equal(parseFensterShow('Öffne auf dem Tablet die Lage')?.surface, 'lage')
assert.equal(parseFensterShow('Öffne auf dem Tablet die Lage')?.kind, 'tablet')
assert.equal(parseFensterShow('Zeig die Lage'), null)
assert.equal(parseFensterShow('Zeig die Sprints auf dem Handy')?.surface, 'sprints')
assert.equal(parseFensterShow('Öffne die Planung auf dem Tablet')?.surface, 'planning')

const none = await handleFensterCommand('Verbinde das Handy', { seek: async () => [], post: async () => false })
assert.match(none, /Kein Handy antwortet/)
assert.equal(none, noPeerReply('handy'))

const posted = []
const seek = async () => [
  peer('8.8.8.8', 'handy'),
  peer('10.0.0.5', 'handy'),
  peer('10.0.0.8', 'tablet'),
]
const post = async (peer, body, authorizationToken) => {
  posted.push({ peer, body, authorizationToken })
  return true
}
resetFensterOut()
const blocked = await handleFensterCommand('Verbinde das Handy', {
  seek: async () => ({ peers: [], blocked: true }),
  post: async () => false,
})
assert.equal(blocked, needLanReply())
resetFensterOut()
const tabletOnly = await handleFensterCommand('Verbinde das Handy', {
  seek: async () => [peer('10.0.0.8', 'tablet')],
  post: async () => true,
})
assert.equal(tabletOnly, otherKindReply('tablet'))
resetFensterOut()
const sent = await handleFensterCommand('Verbinde das Handy', { seek, post })
assert.equal(sent, sentReply('handy'))
assert.equal(posted.length, 1)
assert.equal(posted[0].peer.host, '10.0.0.5')
assert.equal(posted[0].body.op, 'anfrage')
assert.equal(posted[0].body.token, undefined)

const unpaired = await handleFensterCommand('Zeig die Tischplatte auf dem Handy', { seek, post })
assert.match(unpaired, /Noch nicht gekoppelt/)
assert.equal(unpaired, needPairReply())

assert.equal(fensterVersionOk(stampFensterBody({ op: 'zeig' })), true)
assert.equal(fensterVersionOk({ op: 'zeig' }), false)
assert.equal(fensterVersionOk({ ...stampFensterBody({}), appVersion: '0.0.0' }), false)
assert.equal(fensterVersionOk({ ...stampFensterBody({}), proto: 9 }), false)
const bad = requestFromBody({ op: 'anfrage', nonce: 'abcdef1234567890', fromKind: 'handy', fromName: 'Ultron' }, '8.8.8.8', peerFingerprint)
assert.equal(bad, null)
const good = requestFromBody({ op: 'anfrage', nonce: 'abcdef1234567890', fromKind: 'tablet', fromName: 'Ultron' }, '192.168.1.20', peerFingerprint)
assert.equal(good?.fromHost, '192.168.1.20')
assert.equal(good?.fromKind, 'tablet')

resetFensterOut()
posted.length = 0
await handleFensterCommand('Verbinde das Handy', { seek, post })
assert.equal(await acceptJa({ op: 'ja', nonce: 'falsch', kind: 'handy' }, '10.0.0.5', peerFingerprint, 'tokentokentoken'), null)
assert.equal(await acceptJa({ op: 'ja', nonce: posted[0].body.nonce, kind: 'tablet' }, '10.0.0.5', peerFingerprint, 'tokentokentoken'), null)
const pair = await acceptJa({ op: 'ja', nonce: posted[0].body.nonce, kind: 'handy' }, '10.0.0.5', peerFingerprint, 'tokentokentoken')
assert.equal(pair?.host, '10.0.0.5')
assert.equal(pair?.token, 'tokentokentoken')
assert.equal(JSON.stringify(loadSettings().fenster_pair_json).includes(pair.token), false)
assert.equal((await readFensterPair())?.token, pair.token)

const wrongKind = await handleFensterCommand('Zeig die Lage auf dem Tablet', { seek, post })
assert.match(wrongKind, /Gekoppelt ist ein Handy/)

posted.length = 0
const shown = await handleFensterCommand('Zeig die Tischplatte auf dem Handy', { seek, post })
assert.equal(shown, shownReply('handy', 'tisch'))
assert.equal(posted[0].body.op, 'zeig')
assert.equal(posted[0].body.surface, 'tisch')
assert.equal(posted[0].body.token, undefined)
assert.equal(posted[0].authorizationToken, 'tokentokentoken')

const request = {
  nonce: 'abcdef1234567890',
  fromHost: '192.168.1.9',
  fromPort: 18792,
  fromName: 'Ultron',
  fromKind: 'handy',
  fromFingerprint: peerFingerprint,
  at: Date.now(),
}
const prepared = await grantFromConfirm(request, 'handy')
assert.ok(prepared)
assert.equal(prepared.body.op, 'ja')
assert.equal(prepared.authorizationToken.length >= 8, true)
assert.ok(!JSON.stringify(loadSettings().fenster_grant_json || '').includes(prepared.authorizationToken))
commitFensterGrant(prepared.grant)
const stored = readFensterGrant()
assert.equal(stored.tokenHash, prepared.grant.tokenHash)
assert.ok(!JSON.stringify(loadSettings().fenster_grant_json).includes(prepared.authorizationToken))
assert.equal(await surfaceAllowed('falsch', 'tisch', peerFingerprint), null)
assert.equal(await surfaceAllowed(prepared.authorizationToken, 'tisch', peerFingerprint), 'tisch')
assert.equal(await surfaceAllowed(prepared.authorizationToken, 'tisch', 'b'.repeat(64)), null)
assert.equal(await surfaceAllowed(prepared.authorizationToken, 'tischlage', peerFingerprint), null)
const stamped = stampFensterBody({ op: 'zeig' })
assert.equal(fensterVersionOk(stamped), true)
assert.equal(claimFensterRequest(stamped.requestId), true)
assert.equal(claimFensterRequest(stamped.requestId), false)
assert.equal(fensterVersionOk({ ...stamped, expiresAt: Date.now() - 1 }), false)

const { emptyPlan } = await import('../src/engine/idea-plan.ts')
const projectPlan = emptyPlan('project-1', 'Projektplan')
await putIdea({
  id: 'project-1',
  title: 'Projekt',
  body: '',
  status: 'open',
  plan: projectPlan,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
saveSettings({ plan_idea_id: 'project-1' })
const target = await validateFensterProjectTarget({
  projectId: 'project-1',
  planRevision: await (await import('../src/engine/sync-revisions.ts')).contentHash(
    (await listIdeas()).find((idea) => idea.id === 'project-1').plan,
  ),
})
assert.equal(target?.projectId, 'project-1')
assert.equal(
  await validateFensterProjectTarget({ projectId: 'project-1', planRevision: 'f'.repeat(64) }),
  null,
)
posted.length = 0
const projectShown = await handleFensterCommand('Zeig die Sprints auf dem Handy', { seek, post })
assert.equal(projectShown, shownReply('handy', 'sprints'))
assert.equal(posted[0].body.projectId, 'project-1')
assert.equal(posted[0].body.planRevision, target.planRevision)
assert.equal(posted[0].authorizationToken, 'tokentokentoken')

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
assert.match(java, /SSLServerSocket/)
assert.match(java, /DeviceTls\.serverSocket/)
assert.match(java, /DeviceTls\.clientSocket/)
assert.match(java, /peerFingerprint/)
assert.match(java, /Authorization: Bearer/)
assert.match(java, /payload\.contains\("\\\"token\\\""\)/)
assert.match(src('native/device/DeviceTls.java'), /setNeedClientAuth\(true\)/)
assert.match(src('native/device/JarvisDevicePlugin.java'), /AES\/GCM\/NoPadding/)
assert.match(java, /18792/)
assert.match(java, /ACCESS_LOCAL_NETWORK/)
assert.match(src('native/fenster/JarvisFensterService.java'), /JarvisFensterService/)
assert.match(apply, /JarvisFensterService\.java/)
assert.match(main, /setFront/)
assert.match(app, /FensterSheet/)
assert.match(sheet, /Bestätigen/)
assert.match(sheet, /Ablehnen/)
assert.doesNotMatch(css.slice(css.indexOf('.fenster-sheet')), /backdrop-filter/)

console.log('test-fenster ok')

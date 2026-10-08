// @ts-check
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import 'fake-indexeddb/auto'
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => { storage.set(String(key), String(value)) },
  removeItem: (key) => { storage.delete(key) },
  clear: () => { storage.clear() },
  key: (index) => [...storage.keys()][index] ?? null,
  get length() { return storage.size },
}
const { parseConflictChoice, parseTabletMode, parseTabletPair, STAND_UPDATED_LINE } = await import('../src/engine/tablet-mode.ts')
const {
  parsePairCode,
  verdictFor,
  pickLocal,
  savePairing,
  isPaired,
  clearPairing,
  applyWithRecovery,
} = await import('../src/engine/tablet-sync.ts')
const { compareRevisions, contentHash, parseSyncRevision, recordLocalRevision, mergedSuccessorVector, sameRevision, localRevisionVector } = await import('../src/engine/sync-revisions.ts')
const { loadSettings } = await import('../src/engine/store.ts')

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
assert.equal(parseConflictChoice('Übernimm den Tablet-Stand'), 'remote')
assert.equal(parseConflictChoice('übernimm den Handy-Stand'), 'local')
assert.equal(parseConflictChoice('Tablet'), null)
assert.equal(STAND_UPDATED_LINE, 'Hausstand aktualisiert, Sir.')

const tok = 'a'.repeat(24)
const fingerprint = 'b'.repeat(64)
const pairCode = `jarvis-haus:v3|https://192.168.1.20:8765|${tok}|${fingerprint}`
assert.deepEqual(parsePairCode(pairCode), {
  url: 'https://192.168.1.20:8765',
  token: tok,
  port: 8765,
  fingerprint,
})
assert.equal(parsePairCode(`jarvis-haus:v3|https://evil.example:8765|${tok}|${fingerprint}`), null)
assert.equal(parsePairCode(`jarvis-haus:v3|http://192.168.1.20:8765|${tok}|${fingerprint}`), null)
assert.equal(parsePairCode(`jarvis-haus:v2|http://192.168.1.20:8765|${tok}`), null)
assert.equal(parsePairCode(`jarvis-haus:v3|https://192.168.1.20:8765|${tok}|bad`), null)

assert.equal(verdictFor('', ''), 'same')
assert.equal(verdictFor('', '2026-01-01T00:00:00.000Z'), 'remote_newer')
assert.equal(verdictFor('2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), 'local_newer')
assert.equal(verdictFor('kaputt', '2026-01-01T00:00:00.000Z'), 'remote_newer')
const localId = '12345678-1234-4234-8234-123456789abc'
const remoteId = 'abcdefab-cdef-4abc-8def-abcdefabcdef'
/** @param {import('../src/engine/sync-revisions.ts').RevisionVector} vector @param {string} [hash] @returns {import('../src/engine/sync-revisions.ts').SyncRevision} */
const rev = (vector, hash = 'c'.repeat(64)) => ({ schemaVersion: 1, vector, contentHash: hash })
assert.deepEqual(parseSyncRevision(rev({ [localId]: 2 })), rev({ [localId]: 2 }))
assert.equal(parseSyncRevision(rev({ bad: 1 })), null)
assert.equal(compareRevisions(rev({ [localId]: 2 }), rev({ [localId]: 1 })), 'local_newer')
assert.equal(compareRevisions(rev({ [localId]: 1 }), rev({ [localId]: 2 })), 'remote_newer')
assert.equal(compareRevisions(rev({ [localId]: 2 }), rev({ [localId]: 2 })), 'same')
assert.equal(compareRevisions(rev({ [localId]: 2 }, 'd'.repeat(64)), rev({ [localId]: 2 })), 'conflict')
assert.equal(compareRevisions(rev({ [localId]: 2 }), rev({ [remoteId]: 2 })), 'conflict')
assert.equal(
  await contentHash({ b: 2, a: [{ id: 'two', value: 2 }, { id: 'one', value: 1 }] }),
  await contentHash({ a: [{ id: 'one', value: 1 }, { id: 'two', value: 2 }], b: 2 }),
)
storage.set('jarvis_sync_device_v1', localId)
assert.deepEqual(recordLocalRevision(), { [localId]: 1 })

const cA = rev({ [localId]: 3 }, 'a'.repeat(64))
const cB = rev({ [localId]: 2, [remoteId]: 1 }, 'b'.repeat(64))
assert.equal(compareRevisions(cA, cB), 'conflict')
const succ = mergedSuccessorVector(cA.vector, cB.vector)
assert.deepEqual(succ, { [localId]: 4, [remoteId]: 1 })
assert.equal(compareRevisions(rev(succ, 'e'.repeat(64)), cA), 'local_newer')
assert.equal(compareRevisions(rev(succ, 'e'.repeat(64)), cB), 'local_newer')
assert.equal(sameRevision(cA, { ...cA, vector: { ...cA.vector } }), true)
assert.equal(sameRevision(cA, { ...cA, contentHash: 'f'.repeat(64) }), false)

{
  let state = 'before'
  const failedApply = await applyWithRecovery(
    async () => {
      state = 'partial'
      throw new Error('injected apply failure')
    },
    async () => {
      state = 'before'
    },
  )
  assert.deepEqual(failedApply, { ok: false, error: 'injected apply failure', restored: true })
  assert.equal(state, 'before', 'Fehlerpfad stellt den vorherigen Stand wieder her')
  const failedRestore = await applyWithRecovery(
    async () => {
      throw new Error('apply failed')
    },
    async () => {
      throw new Error('restore failed')
    },
  )
  assert.deepEqual(failedRestore, {
    ok: false,
    error: 'apply failed',
    restored: false,
    restoreError: 'restore failed',
  })
}

{
  const { applyRemoteStand } = await import('../src/engine/tablet-sync.ts')
  const { buildBackup } = await import('../src/engine/backup.ts')
  await (await import('../src/engine/backup.ts')).buildBackup(true)
  const before = JSON.stringify(localRevisionVector())
  const malformed = /** @type {import('../src/engine/backup.ts').HausBackup} */ ({
    ...(await buildBackup(true)),
    sync_revision: undefined,
  })
  const ok = await applyRemoteStand(malformed)
  assert.equal(ok, false, 'fehlende Revision bricht ab')
  assert.equal(JSON.stringify(localRevisionVector()), before, 'Vektor nach Abbruch unverändert')
}

{
  const { rememberConflict, takePendingConflict } = await import('../src/engine/tablet-sync.ts')
  const ticket = { local: cA, remote: cB }
  rememberConflict(ticket)
  assert.equal(takePendingConflict(Date.now() + 11 * 60_000), null, 'Ticket läuft ab')
  rememberConflict(ticket)
  assert.deepEqual(takePendingConflict(), ticket)
  assert.equal(takePendingConflict(), null, 'Ticket ist einmalig')
}

const kept = pickLocal({ ...loadSettings(), tablet_mode: true, sync_token: 'x', wake_word: true, hud_force: true, hud_hidden: false, hud_view: 'globe', tischplatte_on: false, sync_url: 'u' })
assert.equal(kept.tablet_mode, true)
assert.equal(kept.sync_token, 'x')

await savePairing('https://192.168.1.20:8765', 's'.repeat(24), fingerprint)
assert.equal(loadSettings().sync_token, '', 'Token liegt nicht im Settings-JSON')
assert.equal(await isPaired(), true)
assert.equal(storage.get('jarvis-secure:haus-sync-token'), 's'.repeat(24))
await clearPairing()
assert.equal(await isPaired(), false)

const java = readFileSync(new URL('../native/haus/JarvisHausPlugin.java', import.meta.url), 'utf8')
for (const needle of ['serverStart', 'serverUpdate', 'serverStop', 'discover', '/ping', 'MessageDigest.isEqual', 'HOME_PORT = 8765', 'acknowledgeIncoming', 'X-Jarvis-Request-ID']) {
  assert.ok(java.includes(needle), needle)
}
assert.ok(java.includes('DeviceTls.serverSocket') && java.includes('DeviceTls.clientSocketFactory'))
const ts = readFileSync(new URL('../src/engine/tablet-sync.ts', import.meta.url), 'utf8')
assert.ok(ts.includes('resolveSyncConflict') && ts.includes('ticket: { local: localRevision, remote: remoteRevision }'))
assert.ok(java.includes('sync_revision') && java.includes('requestIds.putIfAbsent'))
assert.ok(readFileSync(new URL('../src/engine/backup.ts', import.meta.url), 'utf8').includes('revisionFor(backup)'))
const svc = readFileSync(new URL('../native/haus/JarvisHausService.java', import.meta.url), 'utf8')
assert.ok(svc.includes('startForeground') && svc.includes('PARTIAL_WAKE_LOCK'))
const apply = readFileSync(new URL('./apply-native-tv.mjs', import.meta.url), 'utf8')
assert.ok(apply.includes('app.jarvis.haus.JarvisHausService'))
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
assert.ok(app.includes('applyTabletTool') && app.includes('is-tablet-mode') && app.includes('useTabletRuntime'))
console.log('ok test-tablet-sync')

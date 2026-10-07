import assert from 'node:assert/strict'
const { compareStands, syncAction } = await import('../src/engine/sync-compare.ts')
const a = '2025-01-01T10:00:00.000Z'
const b = '2025-01-02T10:00:00.000Z'
assert.equal(compareStands(a, a), 'same')
assert.equal(compareStands(a, b), 'remote_newer')
assert.equal(compareStands(b, a), 'local_newer')
assert.equal(compareStands('', b), 'unknown')
assert.equal(syncAction('same'), 'none')
assert.equal(syncAction('remote_newer'), 'ask_replace')
assert.equal(syncAction('unknown'), 'blocked')
console.log('ok test-sync-compare')

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

const { listMemory, loadSettings } = await import('../src/engine/store.ts')
const { proposeMemory, acceptProposal, rejectProposal, pendingProposals } = await import('../src/engine/memory-propose.ts')
const { rememberCitedResearch } = await import('../src/engine/remember-research.ts')
const { decideGate } = await import('../src/engine/memory-gate.ts')
const { confidenceFor } = await import('../src/engine/memory-layer.ts')

assert.equal(confidenceFor('research'), 0.55)
assert.ok(confidenceFor('research') < confidenceFor('user'))
assert.ok(confidenceFor('research') > confidenceFor('sleep'))

const dump = await proposeMemory({
  key: 'research',
  value: 'gefunden: a: b: c: d: e und noch mehr Text der wie ein Dump aussieht mit vielen Doppelpunkten',
  category: 'research',
  url: 'https://example.com/ics',
  origin: 'research',
})
assert.equal(dump, null)

const small = await proposeMemory({
  key: 'research',
  value: 'hallo welt',
  category: 'research',
  url: 'https://example.com/ics',
  origin: 'research',
})
assert.equal(small, null)

const noUrl = await proposeMemory({
  key: 'research',
  value: 'ICS Parser liegt auf GitHub',
  category: 'research',
  origin: 'research',
})
assert.equal(noUrl, null)

const row = await proposeMemory({
  key: 'research',
  value: 'Ein ICS-Parser liest VEVENT lokal',
  category: 'research',
  url: 'https://github.com/example/ics',
  origin: 'research',
})
assert.ok(row)
assert.equal(row.status, 'pending')
assert.equal(loadSettings().proposal_pending, true)
assert.equal((await listMemory()).length, 0)
assert.equal((await pendingProposals()).length, 1)

const gate = decideGate(
  { key: 'research', value: 'Ein ICS-Parser liest VEVENT lokal', category: 'research', origin: 'research' },
  [],
)
assert.notEqual(gate.action, 'IGNORE')

const no = await rejectProposal(row.id)
assert.equal(no.ok, true)
assert.equal((await listMemory()).length, 0)

const again = await proposeMemory({
  key: 'research',
  value: 'Ein ICS-Parser liest VEVENT lokal',
  category: 'research',
  url: 'https://github.com/example/ics',
  origin: 'research',
})
assert.ok(again)
const yes = await acceptProposal(again.id)
assert.equal(yes.ok, true)
const pins = await listMemory()
assert.ok(pins.some((p) => /ICS-Parser/.test(p.value)))
assert.equal(pins.find((p) => /ICS-Parser/.test(p.value))?.origin, 'research')
assert.equal(pins.find((p) => /ICS-Parser/.test(p.value))?.confidence, 0.55)

const cited = await rememberCitedResearch('Open-Source ICS Parser', [
  { title: 'ics', url: 'https://github.com/example/ics2', snippet: 'Parser für RFC 5545 Dateien', provider: 'github', retrieved_at: new Date().toISOString() },
])
assert.equal(cited, 1)
assert.ok((await pendingProposals()).length >= 1)

console.log('ok test-memory-propose')

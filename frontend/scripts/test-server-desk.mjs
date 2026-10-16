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

const { asksForSteps, formatStepGuide } = await import('../src/engine/step-guide.ts')
const { parseVideoLinkAsk, videoLinkReply } = await import('../src/engine/video-link.ts')
const { mergeHaus } = await import('../src/engine/server-merge.ts')
const { rememberServerDevice, listServerDevices, listServerLog, noteServerAction } = await import('../src/engine/server-desk.ts')

const cake = 'Für einen klassischen Marmorkuchen verrühren Sie zuerst zweihundertfünfzig Gramm Butter mit zweihundert Gramm Zucker. Danach rühren Sie nacheinander vier Eier unter. Backen Sie das Ganze bei einhundertachtzig Grad.'
assert.equal(asksForSteps('ich möchte einen marmorkuchen backen. gib mir step by step anleitung'), true)
assert.equal(asksForSteps('suche im internet nach kuchenrezepten'), false)
const steps = formatStepGuide(cake)
assert.match(steps, /^Step 1 — /)
assert.match(steps, /\nStep 2 — /)
assert.match(steps, /\nStep 3 — /)
assert.doesNotMatch(steps, /Step 4/)

const name = parseVideoLinkAsk('gib mir ein link zum neusten der hansus video')
assert.equal(name, 'hansus')
const link = videoLinkReply(name)
assert.match(link, /https:\/\/www\.youtube\.com\/results\?search_query=/)
assert.match(link, /hansus/)
assert.doesNotMatch(link, /watch\?v=/)
assert.equal(parseVideoLinkAsk('suche im internet nach kuchenrezepten'), null)

const local = {
  backup_version: 1,
  exported_at: '2026-10-16T10:00:00.000Z',
  settings: { gemini_api_key: 'lokal', groq_api_key: '' },
  memory: [],
  reminders: [],
  events: [{ id: 'e1', title: 'Arzt', updated_at: '2026-10-01T10:00:00.000Z' }],
  notes: [{ id: 'n1', body: 'lokal', updated_at: '2026-10-01T10:00:00.000Z' }],
  todos: [],
  shopping: [],
}
const remote = {
  ...local,
  settings: { gemini_api_key: 'fremd', groq_api_key: 'groq' },
  events: [
    { id: 'e1', title: 'Arzt neu', updated_at: '2026-10-02T10:00:00.000Z' },
    { id: 'e2', title: 'Schule', updated_at: '2026-10-03T10:00:00.000Z' },
  ],
  notes: [{ id: 'n2', body: 'vom anderen gerät', updated_at: '2026-10-03T10:00:00.000Z' }],
}
const merged = mergeHaus(local, remote)
assert.equal(merged.added, 2)
assert.equal(merged.backup.notes.length, 2)
assert.equal(merged.backup.events.find((row) => row.id === 'e1').title, 'Arzt neu')
assert.equal(merged.backup.events.find((row) => row.id === 'e2').title, 'Schule')
assert.equal(merged.backup.settings.gemini_api_key, 'lokal')
assert.equal(merged.backup.settings.groq_api_key, 'groq')

const token = 'ab'.repeat(16)
const fingerprint = 'cd'.repeat(32)
const code = `jarvis-haus:v3|https://192.168.1.20:8765|${token}|${fingerprint}`
const device = rememberServerDevice(code)
assert.equal(device?.url, 'https://192.168.1.20:8765')
assert.equal(listServerDevices().length, 1)
assert.equal(listServerLog()[0].ok, true)
noteServerAction('Server starten', false, 'Der Server läuft nur in der App.')
assert.equal(listServerLog()[0].action, 'Server starten')
assert.equal(listServerLog()[0].ok, false)

console.log('test-server-desk ok')

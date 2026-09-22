import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(String(k), String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}

const {
  announceSwitch,
  announceRetry,
  announceGiveUp,
  announceBlocked,
  announceNoKey,
  announceQuotaWait,
  RECOVER_CAP,
  writeHasNoRecover,
  needsRecover,
  stepsFor,
  runRecover,
} = await import('../src/engine/recover.ts')
const { parseDwRss: parseRss, fetchTagesschauHome } = await import('../src/engine/news.ts')
const { dispatchAttempts } = await import('../src/engine/agents/bus.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { skipMicroMerge } = await import('../src/engine/chat-blocks.ts')
const { repairProposalJson } = await import('../src/engine/tool-propose.ts')
const { retryAfterMs } = await import('../src/engine/quota.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { PROBE_COPY_GROUPS, allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { unassignedCopyTitles } = await import('../src/engine/probe-lanes.ts')
const { lookupOmdb } = await import('../src/engine/omdb.ts')

assert.equal(RECOVER_CAP, 2)
assert.match(announceSwitch('Tagesschau', 'DW'), /Tagesschau geht nicht\. Ich versuche DW/)
assert.match(announceRetry('USGS'), /USGS geht nicht\. Ich lade neu/)
assert.match(announceGiveUp(['Tagesschau', 'DW']), /Tagesschau und DW schweigen/)
assert.match(announceBlocked(), /lade neu/)
assert.match(announceNoKey(), /anderen Weg/)
assert.match(announceQuotaWait(), /versuche neu/)
assert.equal(writeHasNoRecover('calendar'), true)
assert.equal(writeHasNoRecover('device'), true)
assert.equal(writeHasNoRecover('news'), false)
assert.equal(dispatchAttempts('write'), 1)
assert.equal(dispatchAttempts('device'), 1)
assert.equal(dispatchAttempts('read'), 2)
assert.equal(stepsFor('calendar', { text: 'Termin morgen 15 Uhr Zahnarzt' }).length, 0)
assert.ok(stepsFor('news', { text: 'Nachrichten' }).length <= RECOVER_CAP)
assert.ok(stepsFor('weather', { text: 'Wetter heute' }).length <= RECOVER_CAP)
assert.equal(writeHasNoRecover('weather'), false)
assert.equal(pickRoute('Nachrichten'), 'news')
assert.equal(pickRoute('Termin morgen 15 Uhr Zahnarzt'), 'calendar')
assert.equal(pickRoute('in 10 Minuten Milch'), 'reminder')
assert.equal(pickRoute('Zeig Erdbeben'), 'hud')
assert.equal(needsRecover('calendar', { handled: false, failed: true }), false)
assert.equal(needsRecover('news', { handled: true, failed: false, tool: { tool_status: 'error' } }), true)
assert.ok(skipMicroMerge('Tagesschau geht nicht. Ich versuche DW.'))
assert.ok(skipMicroMerge('Steht im Kalender: Zahnarzt'))

const dw = parseRss(
  `<rss><channel><item><title>DW Eins</title><link>https://www.dw.com/a</link></item><item><title>DW Zwei</title><link>https://www.dw.com/b</link></item></channel></rss>`,
)
assert.equal(dw.hits[0], 'DW Eins.')
assert.equal(dw.sources[0].provider, 'dw')

const repaired = repairProposalJson('{tool: "set_timer", args: {minutes: "8", time: null, date: null, title: "Nudeln", state: null,},}')
assert.ok(repaired)
assert.ok(JSON.parse(repaired).tool === 'set_timer' || JSON.parse(repaired).args)

assert.equal(retryAfterMs({ 'retry-after': '1s' }), 1000)
assert.equal(retryAfterMs({ 'retry-after': '30s' }), 2500)

let newsCalls = 0
const realFetch = globalThis.fetch
globalThis.fetch = async (input) => {
  const url = String(input)
  if (url.includes('tagesschau.de')) {
    newsCalls += 1
    if (newsCalls === 1) {
      return new Response('{}', { status: 503, headers: { 'content-type': 'application/json' } })
    }
    return new Response(
      JSON.stringify({
        news: [{ title: 'Zweiter Versuch', firstSentence: 'Treffer', shareURL: 'https://www.tagesschau.de/x' }],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }
  if (url.includes('rss.dw.com')) {
    return new Response(
      '<rss><item><title>DW Lage</title><link>https://www.dw.com/lage</link></item></rss>',
      { status: 200, headers: { 'content-type': 'application/rss+xml' } },
    )
  }
  if (url.includes('omdbapi.com')) {
    return new Response(JSON.stringify({ Response: 'False', Error: 'No' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response('{}', { status: 503 })
}

const first = await fetchTagesschauHome(false)
assert.equal(first.hits.length, 0)
const recovered = await runRecover('news', { text: 'Nachrichten', conversationId: 't', lastTool: '', lastMedium: '', inDrive: false })
assert.ok(recovered?.reply)
assert.match(recovered.reply, /geht nicht/)
assert.match(recovered.reply, /Tagesschau|DW|Treffer|Laut DW|Zweiter/)

newsCalls = 0
globalThis.fetch = async (input) => {
  const url = String(input)
  if (url.includes('tagesschau.de') || url.includes('rss.dw.com')) {
    return new Response('{}', { status: 503 })
  }
  return new Response('{}', { status: 503 })
}
const dead = await runRecover('news', { text: 'Nachrichten', conversationId: 't', lastTool: '', lastMedium: '', inDrive: false })
assert.ok(dead?.reply)
assert.match(dead.reply, /Kein Raten|schweigen/)
assert.doesNotMatch(dead.reply, /erfunden|laut Agentur X/i)

const { saveSettings } = await import('../src/engine/store.ts')
saveSettings({ omdb_api_key: '' })
const noKey = await lookupOmdb('Dune')
assert.equal(noKey.ok, false)
assert.ok(noKey.needKey)
assert.doesNotMatch(noKey.message, /\d\d\s*%/)

assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)
assert.equal(PROBE_COPY_GROUPS.length, 13)
assert.deepEqual(unassignedCopyTitles(), [])

globalThis.fetch = realFetch
console.log('OK test-recover')

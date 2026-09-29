// @ts-nocheck
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

const here = dirname(fileURLToPath(import.meta.url))
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8')

const { APP_VERSION } = await import('../src/engine/store.ts')
const { PKG_VERSION, versionCodeOf } = await import('./app-version.mjs')
assert.equal(APP_VERSION, '18.15.0')
assert.equal(PKG_VERSION, '18.15.0')
assert.equal(versionCodeOf('18.15.0'), 181500)

const { applyE5Rerank } = await import('../src/engine/retrieve.ts')
const { qualityPack, setPackExistsProbe, resetPackExistsProbe } = await import('../src/engine/quality-pack.ts')
const { DEFAULT_SETTINGS, saveSettings, loadSettings } = await import('../src/engine/store.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { looksCommandish, utteranceFor, confirmedUtterance } = await import('../src/engine/tool-contract.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { knowledgeAllowedForRoute, KNOWLEDGE_PARSER_ALLOW } = await import('../src/engine/knowledge-block.ts')
const { fuseNewsReply } = await import('../src/engine/news.ts')
const { pinLineFor } = await import('../src/engine/globe-geo.ts')
const { parseTimerIntent } = await import('../src/engine/timer-parse.ts')
const { parseNewsIntent } = await import('../src/engine/news-parse.ts')
const {
  expectedAgentFromCorrection,
  noteParseMiss,
  noteParseCorrection,
  listParseMisses,
  resetParseMisses,
} = await import('../src/engine/parse-miss.ts')
const { makeDirectorCtx } = await import('../src/engine/director.ts')
const { beginTurnAbort, abortCurrentTurn, isTurnAborted, withTurnSignal, resetTurnAbort } = await import(
  '../src/engine/turn-abort.ts'
)
const { bindStatusLine } = await import('../src/engine/presence.ts')
const { pullReady } = await import('../src/engine/speak-tap.ts')

assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)

assert.equal(pickRoute('Fernseher an'), 'tv')
assert.doesNotMatch(src('src/engine/route-pick.ts'), /quality-pack|applyE5Rerank|retrieve\.ts/)
assert.doesNotMatch(src('src/engine/policy.ts'), /quality-pack|applyE5Rerank/)
assert.doesNotMatch(src('src/engine/route-pick.ts'), /\be5\b/)

assert.equal(qualityPack('e5', DEFAULT_SETTINGS).wanted, false)
assert.match(qualityPack('e5', { ...DEFAULT_SETTINGS, e5_rerank: true }).reason, /fehlt|RRF/)
const hits = [
  { store: 'memory', title: 'Ada', body: 'Name Ada Lovelace', rank: 1 },
  { store: 'notes', title: 'Milch', body: 'Einkauf Milch', rank: 3 },
]
assert.deepEqual(applyE5Rerank(hits, 'Ada Lovelace'), hits)
saveSettings({ e5_rerank: true })
setPackExistsProbe((p) => p.includes('e5-small'))
assert.equal(qualityPack('e5').ready, true)
const ranked = applyE5Rerank(hits, 'Ada Lovelace')
assert.equal(ranked[0].title, 'Ada')
assert.equal(pickRoute('Fernseher an'), 'tv')
resetPackExistsProbe()
saveSettings({ e5_rerank: false })
assert.ok(!src('scripts/apply-native-tv.mjs').includes('e5-small.onnx'))

assert.equal(looksCommandish('Wie geht es dir'), false)
assert.equal(looksCommandish('Erzähl was'), false)
assert.equal(looksCommandish('Hol die Nachrichten'), true)
assert.equal(looksCommandish('Kannst du das Wetter checken'), true)
assert.equal(utteranceFor({ tool: 'get_news', args: { minutes: null, time: null, date: null, title: null, state: null } }), 'Zeig mir die Nachrichten')
assert.equal(
  confirmedUtterance(
    { tool: 'get_news', args: { minutes: null, time: null, date: null, title: null, state: null } },
    routeForEval,
  ),
  'Zeig mir die Nachrichten',
)
assert.equal(
  confirmedUtterance(
    { tool: 'get_weather', args: { minutes: null, time: null, date: null, title: null, state: null } },
    routeForEval,
  ),
  'Wetter heute',
)
assert.equal(routeForEval('Fernseher an'), 'tv')

assert.equal(knowledgeAllowedForRoute('news'), true)
assert.equal(knowledgeAllowedForRoute('sport'), true)
assert.equal(knowledgeAllowedForRoute('osint'), true)
assert.equal(knowledgeAllowedForRoute('tv'), false)
assert.equal(knowledgeAllowedForRoute('plug'), false)
assert.equal(knowledgeAllowedForRoute('alarm'), false)
assert.equal(knowledgeAllowedForRoute('sms'), false)
assert.ok(KNOWLEDGE_PARSER_ALLOW.has('search'))
assert.ok(!KNOWLEDGE_PARSER_ALLOW.has('maps'))

resetTurnAbort()
const sig = beginTurnAbort()
assert.equal(makeDirectorCtx('c', 'hi').signal, sig)
abortCurrentTurn()
assert.equal(isTurnAborted(), true)
const merged = withTurnSignal()
assert.ok(merged)
assert.equal(merged.aborted, true)
resetTurnAbort()

const fused = fuseNewsReply(
  {
    hits: ['Bundestag tagt.'],
    sources: [{ title: 'TS', url: 'https://www.tagesschau.de/a', snippet: '', provider: 'tagesschau', retrieved_at: 't' }],
  },
  {
    hits: ['DW dazu.'],
    sources: [{ title: 'DW', url: 'https://www.dw.com/b', snippet: '', provider: 'dw', retrieved_at: 't' }],
  },
)
assert.ok(fused)
assert.match(fused.reply, /Tagesschau und DW/)
assert.match(fused.reply, /Bundestag/)
assert.match(fused.reply, /DW dazu/)
assert.equal(fused.sources.length, 2)
assert.equal(fuseNewsReply({ hits: [], sources: [] }, { hits: [], sources: [] }), null)

assert.match(pinLineFor('Kiew', 'Zur Lage in London: Themse.'), /Kiew/)
assert.doesNotMatch(pinLineFor('Kiew', 'Zur Lage in London: Themse.'), /London/)
assert.equal(pinLineFor('DLH4A', '', undefined, 'flight'), 'Keine Kurzlage zu diesem Ort.')
assert.doesNotMatch(pinLineFor('DLH4A', '', undefined, 'flight'), /Airline|Lufthansa/)
assert.match(pinLineFor('DLH4A', 'OpenSky', undefined, 'flight'), /OpenSky/)
assert.match(pinLineFor('Tschernobyl', ''), /Ukraine|Tschernobyl/)

assert.equal(parseTimerIntent('Nein, das war der Timer')?.kind, 'list')
assert.equal(parseNewsIntent('Hol die Nachrichten')?.kind, 'national')
assert.equal(GOLD_EXPECT['Nein, das war der Timer'], 'timer')
assert.equal(GOLD_EXPECT['Hol die Nachrichten'], 'news')
assert.equal(routeForEval('Nein, das war der Timer'), 'timer')
assert.equal(routeForEval('Hol die Nachrichten'), 'news')

resetParseMisses()
noteParseMiss('Stell irgendwas an')
assert.equal(expectedAgentFromCorrection('Nein, das war der Timer'), 'timer')
noteParseCorrection('Nein, das war der Timer')
const misses = listParseMisses()
assert.ok(misses.some((m) => m.expected === 'timer'))

assert.match(bindStatusLine(true, true), /lauscht/)
assert.match(bindStatusLine(true, false), /fehlgeschlagen|aus/)
assert.match(src('native/presence/JarvisPresencePlugin.java'), /192/)
assert.match(src('native/presence/JarvisPresencePlugin.java'), /ServerSocket/)
assert.doesNotMatch(src('native/presence/JarvisPresencePlugin.java'), /0\.0\.0\.0/)
assert.match(src('native/tv/MainActivity.java'), /JarvisPresencePlugin/)
assert.match(src('scripts/apply-native-tv.mjs'), /JarvisPresencePlugin\.java/)

const ready = pullReady('Timer läuft. Der Rest kommt danach. ', true)
assert.ok(ready.parts.some((p) => /Timer/.test(p)))
assert.match(src('src/ui/VoiceMode.tsx'), /createSentenceTap/)
assert.match(src('src/ui/VoiceMode.tsx'), /tap\.feed/)

assert.match(src('src/engine/director.ts'), /signal: currentTurnSignal/)
assert.match(src('src/engine/groq.ts'), /isTurnAborted/)
assert.match(src('src/engine/llm.ts'), /currentTurnSignal/)
assert.match(src('src/native/voice.ts'), /withTurnSignal/)

console.log('test-18.15 ok')

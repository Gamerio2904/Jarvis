import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { APP_VERSION, DEFAULT_SETTINGS } from '../src/engine/store.ts'
import { warmOrigins } from '../src/engine/cloud-warm.ts'
import {
  qualityPack,
  qualityPacks,
  resetPackExistsProbe,
  setPackExistsProbe,
  packFiles,
} from '../src/engine/quality-pack.ts'
import { applyE5Rerank } from '../src/engine/retrieve.ts'
import { capMissingReply } from '../src/engine/pc-cap.ts'
import { SILENCE_COMPLETE_MS, SILENCE_HOLD_MS, silenceMsFor } from '../src/engine/turn-detect.ts'
import {
  finishLatency,
  formatLatency,
  lastLatency,
  latencyP95,
  markFirstAudio,
  markFirstToken,
  startLatency,
} from '../src/engine/latency.ts'
import { canCacheSmalltalk, clearSmalltalkCache, lookupSmalltalk, rememberSmalltalk } from '../src/engine/smalltalk-cache.ts'
import { settingsTabForQuery } from '../src/engine/settings-ia.ts'

resetPackExistsProbe()
clearSmalltalkCache()

assert.equal(APP_VERSION, '13.31.0')

const off = qualityPacks(DEFAULT_SETTINGS)
assert.equal(off.length, 4)
for (const p of off) {
  assert.equal(p.wanted, false)
  assert.equal(p.ready, false)
  assert.match(p.reason, /aus|nicht gebündelt/i)
}

const want = {
  ...DEFAULT_SETTINGS,
  vad_onnx: true,
  piper_offline: true,
  kokoro_tts: true,
  e5_rerank: true,
}
for (const id of /** @type {const} */ (['smart_turn', 'piper', 'kokoro', 'e5'])) {
  const st = qualityPack(id, want)
  assert.equal(st.wanted, true)
  assert.equal(st.ready, false)
  assert.match(st.reason, /fehl/i)
}
assert.match(qualityPack('smart_turn', want).reason, /Energie-VAD/)
assert.match(qualityPack('piper', want).reason, /Edge Neural/)
assert.match(qualityPack('kokoro', want).reason, /nicht gebündelt|fehlt/i)
assert.match(qualityPack('e5', want).reason, /RRF/)
assert.match(qualityPack('e5', want).reason, /nie der Router/i)
assert.ok(packFiles('e5').every((p) => p.startsWith('/onnx/')))

setPackExistsProbe((p) => p.includes('e5-small'))
const e5Ready = qualityPack('e5', want)
assert.equal(e5Ready.ready, true)
assert.match(e5Ready.reason, /nur Retrieve-Rerank/i)
resetPackExistsProbe()
assert.equal(qualityPack('e5', want).ready, false)

const hits = [
  { store: 'memory', title: 'name', body: 'Ada', rank: 3 },
  { store: 'notes', title: 'Notiz', body: 'Milch', rank: 1 },
]
assert.deepEqual(applyE5Rerank(hits), hits)
assert.deepEqual(applyE5Rerank(hits), applyE5Rerank(hits))

const ground = capMissingReply('ground')
assert.match(ground, /Sehen am PC ist aus/)
assert.match(ground, /eingefroren/)
assert.match(ground, /3060/)
assert.match(ground, /Nichts eingezeichnet/)

const session = readFileSync(new URL('../src/engine/debug-session.ts', import.meta.url), 'utf8')
assert.match(session, /Jarvis testet/)
assert.match(session, /App schließen/)
assert.doesNotMatch(session, /Home kann den Lauf killen/)
assert.match(session, /startDebugFg/)
assert.match(session, /stopDebugFg/)

assert.equal(silenceMsFor('Guten Morgen.'), SILENCE_COMPLETE_MS)
assert.equal(silenceMsFor('Ich wollte noch und'), SILENCE_HOLD_MS)
assert.equal(SILENCE_COMPLETE_MS, 220)
assert.equal(SILENCE_HOLD_MS, 800)

assert.equal(settingsTabForQuery('piper', 'keys'), 'stimme')
assert.equal(settingsTabForQuery('onnx', 'keys'), 'stimme')
assert.equal(settingsTabForQuery('e5', 'keys'), 'hirn')
assert.equal(settingsTabForQuery('rerank', 'keys'), 'hirn')

assert.equal(canCacheSmalltalk('Hallo Jarvis'), true)
assert.equal(canCacheSmalltalk('wie gehts dir'), true)
assert.equal(canCacheSmalltalk('Wie spät ist die Uhr'), false)
assert.equal(canCacheSmalltalk('Wie ist das Wetter'), false)
assert.equal(canCacheSmalltalk('Was steht im Kalender'), false)
rememberSmalltalk('Hallo Jarvis', 'Guten Tag.')
assert.equal(lookupSmalltalk('hallo jarvis'), 'Guten Tag.')
assert.equal(lookupSmalltalk('Wie spät ist die Uhr'), null)
rememberSmalltalk('Wie spät ist die Uhr', 'Es ist 12.')
assert.equal(lookupSmalltalk('Wie spät ist die Uhr'), null)

startLatency('parser')
markFirstToken()
markFirstAudio()
finishLatency()
assert.ok(lastLatency())
assert.match(formatLatency(), /Parser/)
const p95 = latencyP95('msTotal')
assert.equal(typeof p95, 'number')

const runSrc = readFileSync(new URL('../src/engine/debug-run.ts', import.meta.url), 'utf8')
assert.match(runSrc, /latencyP95/)
assert.match(runSrc, /last_line/)
assert.match(runSrc, /P95 gesamt/)
assert.match(runSrc, /APP_VERSION/)

const plugin = readFileSync(new URL('../native/voice/JarvisVoicePlugin.java', import.meta.url), 'utf8')
assert.match(plugin, /startDebugFg/)
assert.match(plugin, /emitDebugStop/)
const svc = readFileSync(new URL('../native/voice/JarvisDebugService.java', import.meta.url), 'utf8')
assert.match(svc, /Jarvis testet/)
assert.match(svc, /START_NOT_STICKY/)
assert.doesNotMatch(svc, /FOREGROUND_SERVICE_TYPE_MICROPHONE/)
assert.match(svc, /NOTE_ID = 73/)
assert.doesNotMatch(svc, /jarvis:\/\/voice/)
assert.match(svc, /acquire\(30 \* 60 \* 1000L\)/)
const main = readFileSync(new URL('../native/tv/MainActivity.java', import.meta.url), 'utf8')
assert.match(main, /keepWebViewIfDebug/)
assert.match(main, /resumeTimers/)
assert.doesNotMatch(main, /w\.onResume\(\)/)
const apply = readFileSync(new URL('./apply-native-tv.mjs', import.meta.url), 'utf8')
assert.match(apply, /JarvisDebugService/)
assert.match(apply, /Debug-Lauf offen halten/)

const chat = readFileSync(new URL('../src/engine/chat.ts', import.meta.url), 'utf8')
assert.doesNotMatch(chat, /qualityPack\('e5'/)
assert.doesNotMatch(chat, /lookupSmalltalk/)
const retrieveSrc = readFileSync(new URL('../src/engine/retrieve.ts', import.meta.url), 'utf8')
assert.match(retrieveSrc, /applyE5Rerank/)
assert.doesNotMatch(retrieveSrc, /parseToolIntent|function pickRoute/)

{
  const origins = warmOrigins(DEFAULT_SETTINGS)
  assert.ok(origins.includes('https://speech.platform.bing.com'))
  assert.equal(origins.some((o) => o.endsWith('/')), false)
  const warmSrc = readFileSync(new URL('../src/engine/cloud-warm.ts', import.meta.url), 'utf8')
  assert.match(warmSrc, /preconnect/)
  assert.doesNotMatch(warmSrc, /fetch\(/)
  const dock = readFileSync(new URL('../src/ui/DebugChatDock.tsx', import.meta.url), 'utf8')
  assert.match(dock, /lastLatency\(\)/)
  assert.doesNotMatch(dock, /useState\(lastLatency\)/)
}

console.log('test-rest-final ok')

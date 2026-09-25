import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PKG_VERSION, versionCodeOf } from './app-version.mjs'
import { APP_VERSION, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../src/engine/store.ts'
import {
  KEY_POWERON,
  TV_ON_NO_ANSWER,
  TV_ON_OK,
  wakeAndObserve,
} from '../src/engine/tv-observe.ts'
import { handleTv } from '../src/engine/tv.ts'
import { upsertWorking, loadWorkingMemory } from '../src/engine/working-memory.ts'
import {
  GROQ_STT_MODEL,
  GROQ_STT_TIMEOUT_MS,
  WHISPER_VOCAB,
  shouldUseGroqStt,
  transcribeGroqWhisper,
} from '../src/engine/stt-groq.ts'
import { preferEdgeForReply, looksGerman } from '../src/engine/speak-tap.ts'
import { ttsGeminiPrimary } from '../src/engine/tts.ts'
import { voiceHintFor, VOICE_HINT_DEVICE, VOICE_HINT_EXPLAIN } from '../src/engine/persona.ts'
import { knowledgeAllowedForRoute, KNOWLEDGE_PARSER_ALLOW } from '../src/engine/knowledge-block.ts'
import { turnLooksComplete } from '../src/engine/turn-detect.ts'
import { pickHeard } from '../src/engine/heard.ts'
import { repairSpeech, normalizeUtterance } from '../src/engine/utterance.ts'
import { parseTvIntent } from '../src/engine/tv-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { GOLD_EXPECT } from '../src/engine/eval/corpus.ts'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { qualityPack } from '../src/engine/quality-pack.ts'

if (!globalThis.localStorage) {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => void mem.set(String(k), String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size
    },
  }
}

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const javaTv = readFileSync(join(root, 'native/tv/JarvisTvPlugin.java'), 'utf8')
const javaVoice = readFileSync(join(root, 'native/voice/JarvisVoicePlugin.java'), 'utf8')
const settingsSrc = readFileSync(join(root, 'src/ui/SettingsScreen.tsx'), 'utf8')
const tvSrc = readFileSync(join(root, 'src/engine/tv.ts'), 'utf8')
const css = readFileSync(join(root, 'src/index.css'), 'utf8')

assert.equal(APP_VERSION, PKG_VERSION)
assert.notEqual(APP_VERSION, '18.5.0')
assert.ok(versionCodeOf(APP_VERSION) >= 181200)
assert.equal(versionCodeOf('18.10.0'), 181000)
assert.ok(versionCodeOf('18.10.0') > versionCodeOf('18.9.8'), '18.10 darf 18.9.8 nicht unterbieten')
assert.ok(DEFAULT_SETTINGS.tv_mac_eth === '')

function mockIo(opts) {
  const log = { wake: 0, info: 0, keys: [] }
  let infos = 0
  return {
    log,
    io: {
      wake: async () => {
        log.wake += 1
        return opts.wake ?? { ok: true }
      },
      info: async () => {
        log.info += 1
        infos += 1
        if (typeof opts.infoOkAfter === 'number') {
          return infos >= opts.infoOkAfter ? { ok: true, status: 200 } : { ok: false, status: 0 }
        }
        return opts.info ?? { ok: false, status: 0 }
      },
      sendKey: async (key) => {
        log.keys.push(key)
        return { ok: true }
      },
      sleep: async () => {},
    },
  }
}

{
  const { io, log } = mockIo({ info: { ok: true, status: 200 } })
  const out = await wakeAndObserve({ host: '192.168.1.40', mac: 'aa:bb:cc:dd:ee:ff' }, io)
  assert.equal(out.ok, true)
  assert.equal(out.reply, TV_ON_OK)
  assert.equal(out.observation.infoOk, true)
  assert.ok(log.wake >= 2, 'zweite Salve')
  assert.deepEqual(log.keys, [KEY_POWERON])
  assert.ok(!log.keys.includes('KEY_POWER'))
}

{
  const { io, log } = mockIo({ infoOkAfter: 3 })
  const out = await wakeAndObserve({ host: '192.168.1.40', mac: 'aa:bb:cc:dd:ee:ff' }, io)
  assert.equal(out.ok, true)
  assert.equal(out.reply, TV_ON_OK)
  assert.deepEqual(log.keys, [], 'KEY_POWERON nur wenn Info schon 200 war')
}

{
  const { io, log } = mockIo({ info: { ok: false, status: 0 } })
  const out = await wakeAndObserve({ host: '192.168.1.40', mac: 'aa:bb:cc:dd:ee:ff' }, io)
  assert.equal(out.ok, false)
  assert.equal(out.reply, TV_ON_NO_ANSWER)
  assert.doesNotMatch(out.reply, /gesendet\. Wacht/)
  assert.equal(out.observation.wolOk, true)
  assert.equal(out.observation.infoOk, false)
  assert.ok(log.wake >= 2)
}

{
  const { io } = mockIo({})
  const out = await wakeAndObserve({ host: '192.168.1.40', mac: '' }, io)
  assert.equal(out.ok, false)
  assert.match(out.reply, /Keine MAC/)
}

{
  const { io } = mockIo({ wake: { ok: false, message: 'WOL fehlgeschlagen: MAC ungültig' } })
  const out = await wakeAndObserve({ host: '192.168.1.40', mac: 'bad' }, io)
  assert.equal(out.ok, false)
  assert.match(out.reply, /WOL fehlgeschlagen/)
}

saveSettings({
  ...DEFAULT_SETTINGS,
  tv_enabled: false,
  tv_host: '192.168.1.40',
  tv_mac: 'aa:bb:cc:dd:ee:ff',
})
{
  const res = await handleTv('Fernseher an')
  assert.equal(res.handled, true)
  assert.match(res.reply || '', /Einstellungen → Fernseher/)
}

saveSettings({
  ...loadSettings(),
  tv_enabled: true,
  tv_host: '',
  tv_mac: 'aa:bb:cc:dd:ee:ff',
})
{
  const res = await handleTv('Fernseher an')
  assert.equal(res.handled, true)
  assert.match(res.reply || '', /Kein TV hinterlegt/)
}

saveSettings({
  ...loadSettings(),
  tv_enabled: true,
  tv_host: '192.168.1.40',
  tv_mac: '',
  tv_mac_eth: '',
})
{
  const res = await handleTv('Fernseher an')
  assert.equal(res.handled, true)
  assert.match(res.reply || '', /Keine MAC/)
}

saveSettings({
  ...loadSettings(),
  tv_enabled: true,
  tv_host: '192.168.1.40',
  tv_mac: 'aa:bb:cc:dd:ee:ff',
  working_memory_json: '[]',
})
{
  const res = await handleTv('Fernseher an')
  assert.equal(res.handled, true)
  assert.doesNotMatch(res.reply || '', /Magic-Packet gesendet\. Wacht/)
  const mem = loadWorkingMemory()
  assert.ok(mem.some((r) => r.key === 'tv'), 'TV schreibt Arbeitsgedächtnis')
}

assert.match(javaTv, /firstNonEmpty/)
assert.doesNotMatch(javaTv, /optString\("wifiMac", device\.optString\("wifiMac"/)
assert.match(javaTv, /public void info\(/)
assert.match(javaTv, /wiredMac/)
assert.match(tvSrc, /wakeAndObserve/)
assert.match(tvSrc, /tv_mac_eth/)
assert.match(settingsSrc, /Power On with Mobile/)
assert.match(settingsSrc, /tv_mac_eth/)

assert.equal(turnLooksComplete('Fernseher an'), true)
assert.equal(turnLooksComplete('und dann'), false)
assert.match(javaVoice, /fernseher\|tv\|/)
assert.doesNotMatch(javaVoice, /words >= 6 \|\| length >= 24/)
assert.equal(parseTvIntent(pickHeard('Was sagst du', ['fanseher an']))?.action, 'on')
assert.equal(repairSpeech('fanseher an').toLowerCase().includes('fernseher'), true)
assert.equal(pickRoute(normalizeUtterance('Mach den Fernseher an')), 'tv')
assert.equal(pickRoute('Fernseher an'), 'tv')
assert.equal(GOLD_EXPECT['Fernseher an'], 'tv')
assert.ok(TEST_PROMPTS.includes('Fernseher an'))

assert.equal(GROQ_STT_MODEL, 'whisper-large-v3-turbo')
assert.equal(GROQ_STT_TIMEOUT_MS, 1500)
assert.match(WHISPER_VOCAB, /Fernseher/)
assert.equal(
  shouldUseGroqStt({ groqReady: false, googleText: 'x', repaired: true, closed: false }),
  false,
)
assert.equal(
  shouldUseGroqStt({ groqReady: true, googleText: 'fanseher an', repaired: true, closed: true }),
  true,
)
assert.equal(
  shouldUseGroqStt({ groqReady: true, googleText: 'Fernseher an', repaired: false, closed: true }),
  false,
)
assert.equal(
  shouldUseGroqStt({ groqReady: true, googleText: '', repaired: false, closed: false }),
  true,
)

{
  const started = Date.now()
  const hit = await transcribeGroqWhisper(new Blob(['xxxx']), {
    key: 'gsk_test',
    timeoutMs: 80,
    fetch: () => new Promise(() => {}),
  })
  assert.equal(hit, null)
  assert.ok(Date.now() - started < 1500, 'Timeout lässt Google stehen')
}

assert.equal(ttsGeminiPrimary(false), false)
assert.equal(ttsGeminiPrimary(true), false)
assert.equal(looksGerman('Fernseher ist an.'), true)
assert.equal(preferEdgeForReply('Fernseher ist an.'), true)
assert.equal(preferEdgeForReply('Okay.'), false)
assert.match(voiceHintFor('tv'), /ein fertiger Satz/)
assert.equal(voiceHintFor('tv'), VOICE_HINT_DEVICE)
assert.equal(voiceHintFor(null), VOICE_HINT_EXPLAIN)
assert.equal(knowledgeAllowedForRoute('tv'), false)
assert.equal(knowledgeAllowedForRoute('film'), true)
assert.equal(knowledgeAllowedForRoute('watchlist'), true)
assert.equal(knowledgeAllowedForRoute('calendar'), true)
assert.equal(knowledgeAllowedForRoute(null), true)
assert.ok(KNOWLEDGE_PARSER_ALLOW.size === 3)

upsertWorking('tv', 'tv: an, beobachtet 200')
assert.ok(loadWorkingMemory().some((r) => /beobachtet 200/.test(r.line)))

assert.match(qualityPack('piper').reason, /fehlen|aus|Edge/)
assert.doesNotMatch(css, /\.pin-bubble-backdrop\b/)

console.log(`test:18.10 ok — TV observe, STT, Edge-first, Memory (${APP_VERSION})`)

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
assert.ok(versionCodeOf(APP_VERSION) >= 181600)
assert.equal(versionCodeOf('18.16.0'), 181600)

const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts } = await import('../src/engine/test-copy.ts')
const { aliasQueries, extractEntities, memberInBlob } = await import('../src/engine/memory-alias.ts')
const { parseRecallIntent } = await import('../src/engine/recall-parse.ts')
const { parseBirthdayIntent } = await import('../src/engine/birthday-parse.ts')
const { personClusterReply, rememberPersonPin, formatBirthdayValue } = await import('../src/engine/person-cluster.ts')
const { greetingReply } = await import('../src/engine/greeting.ts')
const { expectedAgentFromCorrection, noteParseMiss, peekLastReplay, resetParseMisses } = await import(
  '../src/engine/parse-miss.ts'
)
const { resetSleepTick, tickSleepMemory } = await import('../src/engine/sleep-memory.ts')
const { upsertWorking, saveWorkingMemory } = await import('../src/engine/working-memory.ts')
const { saveSettings, listMemory, clearMemory, DEFAULT_SETTINGS } = await import('../src/engine/store.ts')

assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)

assert.equal(GOLD_EXPECT['Mama hat am 3. März Geburtstag'], 'birthday')
assert.equal(GOLD_EXPECT['Wer ist meine Mutter und wann hat sie Geburtstag'], 'recall')
assert.equal(GOLD_EXPECT['Wann hat Mama Geburtstag'], 'recall')
assert.equal(pickRoute('Mama hat am 3. März Geburtstag'), 'birthday')
assert.equal(pickRoute('Wer ist meine Mutter und wann hat sie Geburtstag'), 'recall')
assert.equal(pickRoute('Wann hat Mama Geburtstag'), 'recall')
assert.equal(pickRoute('Freundin wohnt in Heilbronn'), 'maps')
assert.equal(pickRoute('Rufe Mama an'), 'maps')
assert.equal(pickRoute('Fernseher an'), 'tv')
assert.equal(pickRoute('Samstag Geburtstag Jakob 18 Uhr'), 'calendar')

assert.ok(aliasQueries('meine Mutter').includes('mama'))
assert.ok(extractEntities('mama', '3.3.').includes('mutter'))
assert.equal(memberInBlob('großmutter', 'mutter', true), false)
assert.equal(memberInBlob('meine mutter', 'mutter', true), true)

assert.ok(parseRecallIntent('Wer ist meine Mutter und wann hat sie Geburtstag'))
assert.ok(parseRecallIntent('Wann hat Mama Geburtstag'))
assert.equal(parseRecallIntent('Was weißt du über mich'), null)
assert.equal(parseBirthdayIntent('Mama hat am 3. März Geburtstag')?.kind, 'create')
assert.equal(parseBirthdayIntent('Wann hat Mama Geburtstag'), null)

assert.equal(formatBirthdayValue('3.3.'), '3. März')

{
  const empty = personClusterReply('Wer ist meine Mutter und wann hat sie Geburtstag', [], [], [])
  assert.match(empty, /Nichts Belegtes/)
  assert.doesNotMatch(empty, /Ingrid/)
}

await clearMemory()
await rememberPersonPin('mama', '3.3.', 'birthday', 'c1')
const pins = await listMemory()
const mama = pins.find((p) => p.category === 'birthday')
assert.ok(mama)
assert.ok(mama.entities?.includes('mutter'), `entities ${JSON.stringify(mama.entities)}`)
const reply = personClusterReply('Wer ist meine Mutter und wann hat sie Geburtstag', [], pins, [])
assert.match(reply, /Mama/)
assert.match(reply, /3\. März|3\.3/)
assert.doesNotMatch(reply, /Ingrid/)
assert.doesNotMatch(reply, /0171/)

await rememberPersonPin('mama', '01711234567', 'contact', 'c1')
const withTel = await listMemory()
const justBday = personClusterReply('Wann hat Mama Geburtstag', [], withTel, [])
assert.match(justBday, /3\. März|3\.3/)
assert.doesNotMatch(justBday, /0171/)

const papa = personClusterReply('Wer ist meine Mutter und wann hat sie Geburtstag', [], withTel, [
  { id: 'r1', title: 'Geburtstag Papa', due_at: '2027-01-01T09:00:00.000Z', status: 'open', kind: 'birthday' },
])
assert.doesNotMatch(papa, /Papa/)

assert.equal(GOLD_EXPECT['Hallo Jarvis.'], 'llm')
assert.notEqual(pickRoute('Hallo Jarvis.'), 'recall')
assert.match(greetingReply('echo', new Date('2026-09-03T12:00:00'), 'Hallo'), /Ich höre/)
assert.match(greetingReply('echo', new Date('2026-09-03T12:00:00'), 'Hallo', 'Timer Nudeln läuft.'), /Timer Nudeln/)
assert.doesNotMatch(greetingReply('echo', new Date('2026-09-03T12:00:00'), 'Hallo', 'sicher gut geschlafen'), /geschlafen/)

resetParseMisses()
noteParseMiss('acht minuten nudeln')
assert.match(peekLastReplay(), /nudeln/)
assert.equal(expectedAgentFromCorrection('Nein, das war der Timer'), 'timer')
assert.equal(GOLD_EXPECT['Nein, das war der Timer'], 'timer')

saveSettings({ ...DEFAULT_SETTINGS, gemini_enabled: true, gemini_api_key: 'dummy-key' })
saveWorkingMemory([])
upsertWorking('u:heiße', 'Ich heiße Max und trinke gerne Kaffee')
resetSleepTick()
await tickSleepMemory()
const afterSleep = await listMemory()
assert.ok(afterSleep.some((m) => m.key === 'name' && m.value === 'Max') || afterSleep.some((m) => /Max/.test(m.value)))

assert.doesNotMatch(src('src/engine/sleep-memory.ts'), /isGeminiConfigured\(\)/)
assert.match(src('src/engine/birthday.ts'), /rememberPersonPin/)
assert.doesNotMatch(src('src/engine/birthday.ts'), /upsertMemory/)
assert.equal(pickRoute('Fernseher an'), 'tv')

console.log('test-18.16 ok — Personen-Knäuel Mama=Mutter, Recall, Sleep ohne Gemini-Zaun')

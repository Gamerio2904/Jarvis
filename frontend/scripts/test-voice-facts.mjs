import assert from 'node:assert/strict'
import { spokenForGemini } from '../src/engine/tts.ts'
import { preservesVoiceFacts, protectedVoiceFacts } from '../src/engine/voice-facts.ts'

const plain = 'Dies ist ein allgemeiner Satz ohne besondere Fakten. '.repeat(30)
const plainSpoken = spokenForGemini(plain)
assert.ok(plainSpoken.length <= 720)
assert.ok(plainSpoken.length < plain.length)

const factual = `${'Allgemeine Erläuterung ohne konkrete Angabe. '.repeat(20)} In Berlin ist der Termin am 17.10.2026 um 14:30 Uhr. Quelle: https://example.org/status.`
const factualSpoken = spokenForGemini(factual)
assert.ok(factualSpoken.length >= factual.length - 1)
for (const fact of protectedVoiceFacts(factual)) {
  assert.ok(factualSpoken.toLocaleLowerCase('de-DE').includes(fact), `missing voice fact ${fact}`)
}
assert.equal(preservesVoiceFacts('Wahrscheinlich offen: 42.', 'Offen, 42.'), false)
assert.equal(preservesVoiceFacts('Bestätigt: 42.', 'Bestätigt: 42.'), true)

console.log('test:voice-facts ok')

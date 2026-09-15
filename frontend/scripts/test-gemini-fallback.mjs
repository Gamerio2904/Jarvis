// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'
import {
  GEMINI_MODELS_BEST_FIRST,
  GROQ_KNOWN_MODEL_IDS,
  GROQ_MODELS_BEST_FIRST,
  germanQuotaHint,
  geminiModelOrder,
  groqModelOrder,
  isFatalAuth,
  isRetryableCloud,
  isUnknownModel,
  looksLikeProviderEnglish,
  markSkip,
  parseSkipMap,
  userFacingCloudError,
} from '../src/engine/cloud-errors.ts'

assert.equal(GEMINI_MODELS_BEST_FIRST[0], 'gemini-2.5-flash')
assert.ok(GEMINI_MODELS_BEST_FIRST.includes('gemini-2.5-flash-lite'))
assert.ok(GROQ_MODELS_BEST_FIRST.includes('openai/gpt-oss-20b'))
assert.equal(GROQ_MODELS_BEST_FIRST.includes('gemma2-9b-it'), false)

/**
 * Vorher stand hier `assert.equal(GROQ_MODELS_BEST_FIRST[0], 'qwen/qwen3.8-27b')`
 * — die Konstante gegen sich selbst. So ein Test bemerkt eine Änderung, nie
 * einen falschen Wert. Jetzt gegen die veröffentlichte Liste.
 */
for (const id of GROQ_MODELS_BEST_FIRST) {
  assert.ok(
    GROQ_KNOWN_MODEL_IDS.includes(id),
    `Groq kennt die Kennung nicht: ${id} — gegen console.groq.com/docs/models prüfen`,
  )
}

const order = geminiModelOrder('')
assert.equal(order[0], 'gemini-2.5-flash')
assert.equal(order[2], 'gemini-2.5-flash-lite')

/** Groq hatte kein Skip-Gedächtnis und lief jeden Zug von vorne durch. */
const groqSkipped = markSkip('', GROQ_MODELS_BEST_FIRST[0], Date.now())
const groqOrder = groqModelOrder(groqSkipped)
assert.notEqual(groqOrder[0], GROQ_MODELS_BEST_FIRST[0], 'gesperrtes Modell steht nicht mehr vorne')
assert.equal(groqOrder[groqOrder.length - 1], GROQ_MODELS_BEST_FIRST[0])
assert.equal(groqOrder.length, GROQ_MODELS_BEST_FIRST.length, 'gesperrt heißt hinten, nicht weg')

assert.equal(isRetryableCloud(429, 'RESOURCE_EXHAUSTED', 'RESOURCE_EXHAUSTED'), true)
assert.equal(
  isRetryableCloud(503, 'This model is currently experiencing high demand. Please try again later.'),
  true,
)
assert.equal(isRetryableCloud(200, 'ok'), false)
assert.equal(isFatalAuth(400, 'API key not valid. Please pass a valid API key.', 'API_KEY_INVALID'), true)
assert.equal(isFatalAuth(429, 'quota'), false)
assert.equal(isUnknownModel(404, 'model not found'), true)

const skipped = markSkip('', 'gemini-2.5-flash', Date.now())
const afterSkip = geminiModelOrder(skipped)
assert.equal(afterSkip[0], 'gemini-flash-latest')
assert.equal(afterSkip[afterSkip.length - 1], 'gemini-2.5-flash')
assert.ok(parseSkipMap(skipped)['gemini-2.5-flash'] > Date.now())

const english =
  'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
assert.equal(looksLikeProviderEnglish(english), true)
const de = userFacingCloudError(english, false)
assert.equal(de.includes('high demand'), false)
assert.ok(de.includes('Groq') || de.includes('überlastet'))
assert.equal(userFacingCloudError(english, true).includes('high demand'), false)
assert.ok(germanQuotaHint(false).includes('console.groq.com'))
/** „Hoher Free-Tier" war eine Zusage, die der Anbieter nicht hält. */
assert.equal(germanQuotaHint(false).includes('hoher Free-Tier'), false)
assert.ok(germanQuotaHint(false).includes('begrenzt'))

assert.equal(userFacingCloudError('Gemini-Key ungültig. In Google AI Studio einen neuen Key holen.', false).includes('ungültig'), true)

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

const { saveSettings, loadSettings, isGeminiConfigured } = await import('../src/engine/store.ts')

saveSettings({ gemini_api_key: 'AIzaSyDummyKeyForTests123456' })
assert.equal(loadSettings().gemini_enabled, true, 'Key eintragen schaltet Gemini an')
assert.equal(isGeminiConfigured(), true)

saveSettings({ gemini_enabled: false })
assert.equal(isGeminiConfigured(), false, 'Schalter bleibt aus wenn explizit')

saveSettings({ gemini_api_key: 'AIzaSyDummyKeyForTests123456', gemini_enabled: false })
assert.equal(loadSettings().gemini_enabled, false, 'explizites aus gewinnt über Key-Patch')

saveSettings({ gemini_api_key: '', gemini_enabled: true })
assert.equal(isGeminiConfigured(), false)

const quota = await import('../src/engine/quota.ts')
assert.equal(quota.parseDuration('2.5s'), 2500)
assert.equal(quota.parseDuration('1m30s'), 90_000)
assert.equal(quota.parseDuration('60'), 60_000)
assert.equal(quota.parseDuration(''), null)

quota.resetQuota()
assert.equal(quota.quotaBlocked('groq'), false, 'ohne Messwert wird nicht gesperrt')
quota.noteQuotaHeaders('groq', { 'x-ratelimit-remaining-requests': '900' })
assert.equal(quota.quotaBlocked('groq'), false)
quota.noteQuotaHeaders('groq', { 'x-ratelimit-remaining-requests': '3' })
assert.equal(quota.quotaBlocked('groq'), true, 'Reserve greift vor der Null')
quota.resetQuota()
quota.noteQuotaExhausted('groq', { 'retry-after': '30' })
assert.equal(quota.quotaBlocked('groq'), true)
assert.ok(quota.quotaHint('groq').includes('offline'), 'Hinweis, keine Fehlermeldung')
assert.equal(quota.quotaBlocked('groq', Date.now() + 31_000), false, 'nach dem Reset wieder normal')
assert.equal(quota.quotaBlocked('groq'), false, 'die alte Null sperrt nicht weiter')
quota.resetQuota()

console.log('ok gemini/groq fallback cascade + Kontingent')

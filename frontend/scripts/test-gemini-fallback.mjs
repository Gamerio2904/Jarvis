import assert from 'node:assert/strict'
import {
  GEMINI_MODELS_BEST_FIRST,
  germanQuotaHint,
  geminiModelOrder,
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

const order = geminiModelOrder('')
assert.equal(order[0], 'gemini-2.5-flash')
assert.equal(order[2], 'gemini-2.5-flash-lite')

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

console.log('ok gemini fallback cascade')

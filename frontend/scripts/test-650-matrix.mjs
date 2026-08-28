/**
 * Prompt-Matrix 6.60: Gold lockt. Gaps müssen 0 sein.
 */
import assert from 'node:assert/strict'
import { pickRouteFromCtx } from '../src/engine/route-pick.ts'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { isHelpCommand, isPersonaAsk } from '../src/engine/guards.ts'
import { isLiveLookup, parseShopDiscountIntent } from '../src/engine/research-parse.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'
import { promoteSplitPart, splitIntents } from '../src/engine/split-intents.ts'

function route(text) {
  text = normalizeUtterance(text)
  if (!text.trim()) return null
  if (isHelpCommand(text)) return 'help'
  if (parseShopDiscountIntent(text)) return 'discount'
  if (parseOrdinalFollowUp(text)) return 'ordinal'
  const id = pickRouteFromCtx({
    conversationId: 'test',
    text,
    lastTool: '',
    lastMedium: '',
    inDrive: false,
  })
  if (id) return id
  if (isLiveLookup(text)) return 'research'
  return 'llm'
}

const LOCK = [
  ['Zeig mir London', 'hud', 'pin'],
  ['Was ist das für eine Stadt?', 'hud', 'look'],
  ['Was sehe ich?', 'hud', 'look'],
  ['Zeig mir Atlantis', 'hud', 'unknown_place'],
  ['Hilfe', 'help', null],
  ['Was kannst du?', 'help', null],
  ['Was kannst du denn so?', 'help', null],
  ['Womit kannst du helfen?', 'help', null],
  ['Schreib mir eine E-Mail', 'wont', null],
  ['Zeig mir die Nachrichten', 'news', null],
  ['Überweise 200 Euro', 'wont', null],
  ['Zeig Street View von London', 'wont', null],
  ['Was is das für ne Stadt', 'hud', 'look'],
  ['welche stadt sehe ich denn', 'hud', 'look'],
  ['Was sehe ich auf der Kugel', 'hud', 'look'],
  ['Ist das Paris?', 'hud', 'look'],
  ['Wo liegt Berln', 'hud', 'unknown_place'],
  ['erde bitte anzeigen', 'hud', 'view'],
  ['Kuegel an', 'hud', 'view'],
  ['Zeig mir', 'wont', null],
  ['Wie komme ich nach Hause', 'drive', null],
  ['Rufe 112', 'wont', null],
  ['Mach Live-Satellitenvideo an', 'wont', null],
  ['Öffne Instagram', 'wont', null],
  ['Bestell Pizza', 'wont', null],
  ['Kannst du Bilder malen?', 'wont', null],
  ['Zeige Notizen', 'todo', null],
  ['klick das Captcha', 'wont', null],
  ['Öffne Banking und überweise 500 Euro', 'wont', null],
  ['Bist du ChatGPT?', 'identity', null],
  ['Wie heißt du?', 'identity', null],
  ['Körper an und Zeig London', 'hud', null],
  ['Zeig Spotify und London', 'hud', null],
]

let fail = 0
console.log('\n=== LOCK 6.60 ===')
for (const [prompt, want, hudKind] of LOCK) {
  const got = route(prompt)
  const hud = parseHudIntent(prompt)
  const ok = got === want && (hudKind == null || hud?.kind === hudKind)
  if (!ok) fail += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} want=${want.padEnd(8)} got=${String(got).padEnd(8)} hud=${String(hud?.kind || '-').padEnd(14)} wont=${parseWontIntent(prompt)?.reason || '-'} ← ${JSON.stringify(prompt)}`,
  )
}

assert.deepEqual(splitIntents('Körper an und Zeig London'), ['Körper an', 'Zeig London'])
assert.equal(parseHudIntent('Zeig mir London')?.name, 'London')
assert.equal(parseHudIntent('Was is das für ne Stadt')?.kind, 'look')
assert.equal(parseHudIntent('Zeig mir'), null)
assert.equal(isHelpCommand('Was kannst du?'), true)
assert.equal(parseWontIntent('Überweise 200 Euro')?.reason, 'banking')
assert.equal(parseHudIntent('Zeig Street View von London'), null)
assert.equal(parseWontIntent('Zeig Street View von London')?.reason, 'street')
assert.equal(parseHudIntent('wo liegt eigentlich paris')?.name, 'Paris')
assert.equal(isPersonaAsk('Bist du ChatGPT?'), true)
assert.equal(promoteSplitPart('London'), 'Zeig London')
assert.deepEqual(
  splitIntents('Zeig Spotify und London').map(promoteSplitPart),
  ['Zeig Spotify', 'Zeig London'],
)

console.log(`\nlock fails: ${fail} / ${LOCK.length}`)
if (fail) process.exitCode = 2

/**
 * Prompt-Batterie für Sprints 115–120: Gold, Alltag, Absicht kaputt.
 * Nur Parser/Router, kein Registry-Import.
 */
import assert from 'node:assert/strict'
import { pickRoute } from '../src/engine/route-pick.ts'
import { REGRESS_EXPECT } from '../src/engine/eval/corpus.ts'
import { decisionForEval, PRE_ROUTER, routeForEval } from '../src/engine/eval/route-eval.ts'
import { isHelpCommand, isPersonaAsk } from '../src/engine/guards.ts'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { parseOutlookIntent } from '../src/engine/outlook-parse.ts'
import { parseNewsIntent } from '../src/engine/news-parse.ts'
import { parseGroundIntent } from '../src/engine/ground-parse.ts'
import { parseFaceIntent } from '../src/engine/face-parse.ts'
import { parseLawIntent } from '../src/engine/law.ts'
import { parseSkyIntent } from '../src/engine/sky.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'
import { parseFxIntent } from '../src/engine/fx.ts'
import { parsePcIntent } from '../src/engine/pc-parse.ts'
import { promoteSplitPart, splitIntents } from '../src/engine/split-intents.ts'
import { partitionChain } from '../src/engine/chain.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { judgeTurn } from '../src/engine/debug-judge.ts'

/** Die Batterie selbst steht im Korpus (Sprint 249), nicht mehr hier. */
const BATTERY = Object.entries(REGRESS_EXPECT)

function route(text) {
  return routeForEval(text)
}

const rows = []
let fail = 0
for (const [prompt, want] of BATTERY) {
  let got
  try {
    got = route(prompt)
  } catch (e) {
    got = `THROW ${e instanceof Error ? e.message : e}`
  }
  const ok = got === want
  if (!ok) fail += 1
  rows.push({ prompt, want, got, ok })
}

console.log('\n=== Routing ===')
for (const r of rows) {
  console.log(
    `${r.ok ? 'ok  ' : 'FAIL'} want=${String(r.want).padEnd(10)} got=${String(r.got).padEnd(10)} ← ${JSON.stringify(r.prompt)}`,
  )
}

/** Ein erwarteter Agent darf nie als Rückfrage enden — die App fragt sonst wirklich. */
const spurious = []
for (const [prompt, want] of BATTERY) {
  if (PRE_ROUTER.has(want)) continue
  const pick = decisionForEval(prompt)
  if (pick.kind === 'ask') spurious.push(`${JSON.stringify(prompt)} → ${pick.a} oder ${pick.b}`)
}
assert.equal(spurious.length, 0, `Router fragt statt zu handeln:\n  ${spurious.join('\n  ')}`)

assert.equal(parseHudIntent('zeig mal den körper')?.view, 'body')
assert.equal(parseHudIntent('mach den Körper an')?.view, 'body')
assert.equal(parseHudIntent('Körper bitte an')?.view, 'body')
assert.equal(parseHudIntent('zeig mal die Erde')?.view, 'globe')
assert.equal(parseHudIntent('mach die Kugel aus')?.view, 'tiles')
assert.equal(parseHudIntent('Zeig PC Auge')?.kind, 'organ')
assert.equal(parseHudIntent('Zeig PC Auge')?.id, 'pc_eye')
assert.equal(parseHudIntent('Wo liegt Berlin')?.kind, 'pin')
assert.equal(parseHudIntent('Wo liegt Berlin')?.name, 'Berlin')
assert.equal(parseGroundIntent('Wo liegt Berlin'), null)
assert.equal(parseGroundIntent('Wo liegt der Schlüssel')?.topic, 'desk')
assert.equal(parseGroundIntent('Einstellungen dann Datenschutz')?.kind, 'two_step')
assert.equal(parseGroundIntent('tippe hallo in suche')?.kind, 'type_into')
assert.equal(parseSkyIntent('Zeig den Mond')?.kind, 'moon')
assert.equal(parseCalendarIntent('Was steht am Friday an?')?.kind, 'list')
assert.equal(parseFaceIntent('Was steht am Friday an?'), null)
assert.equal(parseWontIntent('klick das Captcha')?.reason, 'captcha')
assert.equal(parseWontIntent('Öffne Banking und überweise 500 Euro')?.reason, 'banking')
assert.equal(parseFxIntent('Öffne Banking und überweise 500 Euro'), null)
assert.equal(parsePcIntent('klick das Captcha'), null)
assert.deepEqual(splitIntents('Körper an und Steckdose an'), ['Körper an', 'Steckdose an'])
assert.deepEqual(splitIntents('Zeig Spotify und die Erde'), ['Zeig Spotify', 'die Erde'])
assert.equal(parseHudIntent('Zeig mir London')?.kind, 'pin')
assert.equal(parseHudIntent('Zeig mir London')?.name, 'London')
assert.equal(parseHudIntent('Was ist das für eine Stadt?')?.kind, 'look')
assert.equal(parseHudIntent('Was sehe ich auf der Kugel')?.kind, 'look')
assert.equal(parseHudIntent('Was is das für ne Stadt')?.kind, 'look')
assert.deepEqual(splitIntents('Körper an und Zeig London'), ['Körper an', 'Zeig London'])
assert.equal(isHelpCommand('Was kannst du?'), true)
assert.equal(isPersonaAsk('Bist du ChatGPT?'), true)
assert.equal(promoteSplitPart('London'), 'Zeig London')
assert.equal(parseHudIntent('Welche Stadt ist das?')?.kind, 'look')
assert.equal(parseHudIntent('Zeig mir Atlantis')?.kind, 'unknown_place')
assert.equal(parseHudIntent('Wo liegt Berln')?.kind, 'unknown_place')
assert.equal(parseGroundIntent('Wo liegt Berln'), null)
assert.equal(parseGroundIntent('wo liegt eigentlich paris'), null)
assert.equal(parseHudIntent('wo liegt eigentlich paris')?.name, 'Paris')
assert.equal(parseHudIntent('mach die weltkugel an')?.view, 'globe')
assert.equal(parseHudIntent('zeig mal london auf der weltkugel')?.kind, 'pin')
assert.equal(parseHudIntent('die Erde')?.view, 'globe')
assert.ok(splitIntents('Darf ich im Park grillen und ein Taxi bestellen').length === 2)
assert.ok(parseLawIntent('Darf ich im Park grillen'))
assert.deepEqual(partitionChain(['Körper an', 'Zeig London']).reads, ['Körper an', 'Zeig London'])
assert.deepEqual(partitionChain(['Zeig Spotify', 'Zeig London']).reads, ['Zeig Spotify', 'Zeig London'])
assert.equal(pickRoute(normalizeUtterance('Krper an und Zeig London')), 'hud')
assert.equal(
  judgeTurn({ label: 't', text: 'x', expect: { tool: 'taxi', confirm: true, mustNot: ['ist bestellt'] } }, 'Taxi ist bestellt.'),
  'fail',
)

assert.equal(pickRoute(normalizeUtterance('Was ist heute so auf der Welt passiert')), 'outlook')
assert.equal(pickRoute(normalizeUtterance('Weltbrief')), 'outlook')
assert.equal(parseOutlookIntent('Was ist heute so auf der Welt passiert')?.kind, 'world')
assert.equal(parseNewsIntent('Was ist heute so auf der Welt passiert'), null)
assert.equal(parseNewsIntent('Zeig mir die Nachrichten')?.kind, 'national')
assert.equal(pickRoute(normalizeUtterance('Zeig mir die Nachrichten')), 'news')

console.log(`\nrouting fails: ${fail} / ${rows.length}`)
if (fail) process.exitCode = 2

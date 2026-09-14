/**
 * Prompt-Matrix 6.60: Gold lockt. Gaps müssen 0 sein.
 * Die Liste selbst steht im Korpus (Sprint 249), nicht mehr hier.
 */
import assert from 'node:assert/strict'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { isHelpCommand, isPersonaAsk } from '../src/engine/guards.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'
import { promoteSplitPart, splitIntents } from '../src/engine/split-intents.ts'
import { LOCK_EXPECT, LOCK_HUD } from '../src/engine/eval/corpus.ts'
import { decisionForEval, routeForEval as route } from '../src/engine/eval/route-eval.ts'

const LOCK = Object.entries(LOCK_EXPECT).map(([prompt, want]) => [prompt, want, LOCK_HUD[prompt] ?? null])

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

/** Gold darf nie in einer Rückfrage landen. */
for (const [prompt, want] of LOCK) {
  if (want === 'help' || want === 'llm') continue
  const pick = decisionForEval(prompt)
  assert.notEqual(
    pick.kind,
    'ask',
    `Rückfrage statt Antwort: ${JSON.stringify(prompt)} → ${pick.kind === 'ask' ? `${pick.a}/${pick.b}` : ''}`,
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

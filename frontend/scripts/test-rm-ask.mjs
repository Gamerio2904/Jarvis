import assert from 'node:assert/strict'
import { parseRmAskIntent } from '../src/engine/rm-ask-parse.ts'
import { answerRmAsk } from '../src/engine/rm-ask.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { GOLD_EXPECT } from '../src/engine/eval/corpus.ts'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'

assert.deepEqual(
  Object.keys(GOLD_EXPECT).sort(),
  [...TEST_PROMPTS].sort(),
)

assert.equal(parseRmAskIntent('Wer ist Rick Sanchez')?.kind, 'who')
assert.equal(parseRmAskIntent('Erzähl mir von Morty Smith')?.kind, 'who')
assert.equal(parseRmAskIntent('Wann hatte Rick ein automatisches Schild')?.kind, 'skill')
assert.equal(parseRmAskIntent('Wann hatte er ein automatisches Schild')?.kind, 'skill')
assert.equal(parseRmAskIntent('Was ist seine Stärke')?.kind, 'skill')
assert.equal(parseRmAskIntent('Was steht im Graph')?.kind, 'graph')
assert.equal(parseRmAskIntent('Zutaten von Nutella'), null)
assert.equal(parseRmAskIntent('Suche im Internet nach Carbonara-Rezept'), null)
assert.equal(parseRmAskIntent('Staffel 6 Folge 3'), null)
assert.equal(parseRmAskIntent('Lage an'), null)

const rick = answerRmAsk({ kind: 'who', name: 'Rick Sanchez', skillQ: null })
assert.match(rick, /Rick Sanchez/)
assert.match(rick, /Portalgun|Schild/)
assert.match(rick, /Staffel 3 Folge 5/)
assert.doesNotMatch(rick, /unendlicher Anzahl von Paralleluniversen/)

const schild = answerRmAsk({ kind: 'skill', name: 'Rick', skillQ: 'automatisches Schild' })
assert.match(schild, /Schild/)
assert.match(schild, /Staffel 3 Folge 5/)
assert.match(schild, /The Whirly Dirly Conspiracy/)

const unknown = answerRmAsk({ kind: 'who', name: 'Darth Vader', skillQ: null })
assert.match(unknown, /kein Knoten/)

assert.equal(pickRoute('Wer ist Rick Sanchez'), 'hud')
assert.equal(pickRoute('Wann hatte Rick ein automatisches Schild'), 'hud')
assert.equal(pickRoute('Zutaten von Nutella'), 'food')

console.log('test-rm-ask ok')

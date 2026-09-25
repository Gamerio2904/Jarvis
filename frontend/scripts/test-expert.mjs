import assert from 'node:assert/strict'
import { parseExpertIntent } from '../src/engine/expert-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { parseCatalog } from '../src/engine/agents/parse-catalog.ts'
import { EXECUTOR_IDS } from '../src/engine/agents/executor-ids.ts'

assert.equal(parseExpertIntent('Werde ein Experte in Star Wars')?.kind, 'create')
assert.equal(parseExpertIntent('Werde ein Experte in zb StarWars')?.kind, 'create')
assert.equal(parseExpertIntent('Werde ein Experte in zb StarWars')?.topic, 'Star Wars')
assert.equal(parseExpertIntent('Welche Experten hast du?')?.kind, 'list')
assert.equal(parseExpertIntent('Vergiss den Experten Star Wars')?.kind, 'forget')
assert.equal(parseExpertIntent('Zutaten von Nutella'), null)
assert.equal(parseExpertIntent('Wer ist Rick Sanchez'), null)
assert.equal(parseExpertIntent('Staffel 6 Folge 3'), null)

const follow = parseExpertIntent('Wer ist Palpatine?', 'expert', JSON.stringify(['star-wars']))
assert.equal(follow?.kind, 'ask')
const named = parseExpertIntent('In Star Wars, wer ist Palpatine?', 'memory', JSON.stringify(['star-wars', 'Star Wars']))
assert.equal(named?.kind, 'ask')

assert.equal(pickRoute('Werde ein Experte in Star Wars'), 'expert')
assert.equal(pickRoute('Wer ist Rick Sanchez'), 'hud')
assert.equal(pickRoute('Zutaten von Nutella'), 'food')

assert.ok(parseCatalog().some((a) => a.id === 'expert'))
assert.ok(EXECUTOR_IDS.includes('expert'))

console.log('test-expert ok')

import assert from 'node:assert/strict'
import { parseTvIntent } from '../src/engine/tv-parse.ts'
import { parseMemoryFacts, isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { scrubReply, isHelpCommand } from '../src/engine/guards.ts'
import { isIdentityAsk } from '../src/engine/memory-parse.ts'
import { isLiveLookup } from '../src/engine/research-parse.ts'

assert.equal(parseTvIntent('Fernseher an')?.action, 'on')
assert.equal(parseTvIntent('mach den TV aus')?.action, 'off')
assert.equal(parseTvIntent('Fernseher lauter')?.action, 'volume_up')
assert.equal(parseTvIntent('TV leiser')?.action, 'volume_down')
assert.equal(parseTvIntent('Fernseher stumm')?.action, 'mute')
assert.equal(parseTvIntent('auf HDMI 2'), null)
assert.equal(parseTvIntent('Fernseher auf HDMI 2')?.action, 'hdmi2')
assert.equal(parseTvIntent('TV Quelle 1')?.action, 'hdmi1')
assert.equal(parseTvIntent('lauter'), null)
assert.equal(parseTvIntent('lauter', true)?.action, 'volume_up')

assert.ok(isMemoryWrite('Ich heiße Max und trinke gerne Kaffee'))
const facts = parseMemoryFacts('Ich heiße Max und trinke gerne Kaffee und esse Pizza')
assert.equal(facts.find((f) => f.key === 'name')?.value, 'Max')
assert.equal(facts.find((f) => f.key === 'getränk')?.value, 'Kaffee')
assert.equal(facts.find((f) => f.key === 'essen')?.value, 'Pizza')
assert.ok(isMemoryRecall('Was trinke ich?'))
assert.ok(isMemoryRecall('Wie ist mein Name?'))
assert.ok(!isMemoryWrite('Hallo Jarvis'))

assert.equal(parseToolIntent('todo: Milch')?.kind, 'todo_create')
assert.equal(parseToolIntent('Milch kaufen')?.kind, 'todo_create')
assert.equal(parseToolIntent('ich muss noch Brot holen')?.kind, 'todo_create')
assert.equal(parseToolIntent('erinner mich an Steuer')?.kind, 'todo_create')
assert.equal(parseToolIntent('erledige das erste')?.kind, 'todo_done_first')
assert.equal(parseToolIntent('was steht an')?.kind, 'todo_list')
assert.equal(parseToolIntent('Was soll ich kaufen?'), null)

assert.ok(isHelpCommand('/hilfe'))
assert.match(scrubReply('Du bist toll und dein Hund auch'), /Sie/)
assert.match(scrubReply('Ich habe den Fernseher ausgeschaltet'), /nicht ausgeführt/)
assert.match(scrubReply('Sie leiden an akuter Amnesie.'), /Jarvis/)
assert.equal(
  scrubReply('Ich habe das Internet nach Kuchenrezepten durchsucht. Zucker und Mehl reichen.').includes(
    'durchsucht',
  ),
  false,
)
assert.ok(isIdentityAsk('Wer bist du und wer bin ich?'))
assert.ok(isLiveLookup('Suche im Internet nach Kuchenrezepten'))
assert.ok(isLiveLookup('Wie ist die Temperatur in Ingesheim heute?'))
assert.ok(!isLiveLookup('Hallo Jarvis.'))

console.log('ok 0.14 parsers')

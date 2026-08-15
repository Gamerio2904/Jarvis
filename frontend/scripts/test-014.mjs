import assert from 'node:assert/strict'
import { parseTvIntent } from '../src/engine/tv-parse.ts'
import { parseMemoryFacts, isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { scrubReply, isHelpCommand } from '../src/engine/guards.ts'
import { isIdentityAsk } from '../src/engine/memory-parse.ts'
import { isLiveLookup } from '../src/engine/research-parse.ts'
import { parseReminderIntent, formatDue } from '../src/engine/remind-parse.ts'
import { parseWeatherIntent } from '../src/engine/weather-parse.ts'

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

const frozen = new Date('2026-08-15T14:00:00')
const in20 = parseReminderIntent('in 20 Minuten Milch', frozen)
assert.equal(in20?.kind, 'create')
if (in20?.kind === 'create') {
  assert.equal(in20.title, 'Milch')
  assert.equal(in20.due.getTime(), frozen.getTime() + 20 * 60_000)
}
const morgen = parseReminderIntent('morgen 8 Uhr Steuer', frozen)
assert.equal(morgen?.kind, 'create')
if (morgen?.kind === 'create') {
  assert.equal(morgen.title, 'Steuer')
  assert.equal(morgen.due.getHours(), 8)
  assert.equal(morgen.due.getDate(), 16)
}
const um = parseReminderIntent('erinner mich um 18:30 an Ofen', frozen)
assert.equal(um?.kind, 'create')
if (um?.kind === 'create') assert.equal(um.title, 'Ofen')
assert.equal(parseReminderIntent('erinner mich an Steuer', frozen), null)
assert.equal(parseReminderIntent('was steht an')?.kind, 'agenda')
assert.equal(parseReminderIntent('zeige Erinnerungen')?.kind, 'list')
assert.equal(parseReminderIntent('lösche Erinnerung Milch')?.kind, 'delete')
assert.match(formatDue(new Date('2026-08-15T17:42:00'), frozen), /heute/)

assert.equal(parseWeatherIntent('Wetter heute')?.kind, 'here')
assert.equal(parseWeatherIntent('Temperatur hier')?.kind, 'here')
const munich = parseWeatherIntent('Wetter in München')
assert.equal(munich?.kind, 'place')
if (munich?.kind === 'place') assert.equal(munich.place, 'München')
assert.equal(parseWeatherIntent('Hallo Jarvis'), null)

console.log('ok 0.14 parsers')

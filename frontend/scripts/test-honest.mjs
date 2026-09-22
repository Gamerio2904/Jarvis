import assert from 'node:assert/strict'
import { groundMicroMerge, inventedAction, scrubReply } from '../src/engine/guards.ts'
import { skipMicroMerge, SKIP_MICRO_MERGE_TOOLS } from '../src/engine/chat-blocks.ts'
import { looksCommandish } from '../src/engine/tool-contract.ts'

assert.equal(looksCommandish('Nee auf die lieblingsliste'), true)
assert.equal(looksCommandish('verschieb das zu den Lieblingen'), true)
assert.equal(looksCommandish('doch auf die Watchliste'), true)
assert.equal(looksCommandish('Was ist eine Watchliste'), false)
assert.equal(looksCommandish('Wie geht es dir'), false)
assert.equal(looksCommandish('Hallo Jarvis'), false)

assert.equal(
  inventedAction('Heat liegt auf der Watchliste.', 'Heat wurde auf die Lieblingsliste verschoben.'),
  true,
)
assert.equal(inventedAction('18 Grad in Berlin.', 'In Berlin sind es 18 Grad.'), false)

assert.equal(
  groundMicroMerge('Heat liegt auf der Watchliste.', 'Heat wurde von der Watchliste in die Lieblingsliste verschoben.'),
  'Heat liegt auf der Watchliste.',
)
assert.match(groundMicroMerge('18 Grad in Berlin.', 'In Berlin sind es 18 Grad.'), /18|Berlin/)
assert.equal(groundMicroMerge('Heat liegt auf der Watchliste.', ''), 'Heat liegt auf der Watchliste.')

assert.match(scrubReply('Star Wars 3 wurde von der Watchliste in die Lieblingsliste verschoben.'), /nicht ausgeführt/)
assert.match(scrubReply('Der Film befindet sich aktuell auf der Watchliste.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich habe den Film auf die Watchliste gelegt.'), /nicht ausgeführt/)
assert.match(scrubReply('Der Termin ist angelegt.'), /nicht ausgeführt/)
assert.match(scrubReply('Die Erinnerung ist gesetzt.'), /nicht ausgeführt/)
assert.doesNotMatch(scrubReply('Ich habe nichts geändert. Bitte nochmal.'), /nicht ausgeführt/)

assert.equal(skipMicroMerge('Zu den Lieblingen, weg von der Watchliste: Heat.'), true)
assert.equal(skipMicroMerge('Welchen Film? Sag den Titel — ich rate nicht.'), true)
assert.equal(SKIP_MICRO_MERGE_TOOLS.test('watchlist'), true)
assert.equal(SKIP_MICRO_MERGE_TOOLS.test('weather'), false)

console.log('test:honest ok')

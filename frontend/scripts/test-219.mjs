/**
 * 2.19.0: Live-Qualität + Alltag/Welt (Parser, Routing, Schach e2e4).
 */
import assert from 'node:assert/strict'
import { parseWorldIntent, isMusicHonesty } from '../src/engine/world-parse.ts'
import { parseWeatherIntent } from '../src/engine/weather-parse.ts'
import { parseShopIntent } from '../src/engine/shopping-parse.ts'
import { parseFilmIntent } from '../src/engine/film-parse.ts'
import { isProductLookup, researchQuery } from '../src/engine/research-parse.ts'
import { splitTitlePlace } from '../src/engine/calendar-parse.ts'
import { parseDeviceIntent } from '../src/engine/device-parse.ts'
import { isBriefAsk } from '../src/engine/brief-parse.ts'
import { applyMove, parseFen, START_FEN, fenOf } from '../src/engine/chess.ts'
import { packChat } from '../src/engine/prompt.ts'
import { HELP_TEXT } from '../src/engine/guards.ts'
import { debugFileName, debugPayload, flagReply } from '../src/engine/chat-debug.ts'

assert.equal(isMusicHonesty('Spiel mal was Nettes'), true)
assert.equal(isMusicHonesty('Zeig Spotify'), false)
assert.equal(parseWorldIntent('Gibt’s Unwetter?')?.kind, 'warn')
assert.equal(parseWorldIntent('DWD Warnung')?.kind, 'warn')
assert.equal(parseWorldIntent('Sind in BW Ferien?')?.kind, 'ferien')
assert.equal(parseWorldIntent('Was ist der Dollar?')?.kind, 'fx')
assert.equal(parseWorldIntent('Was ist das für ein Produkt Nutella')?.kind, 'food')
assert.equal(parseWorldIntent('Was ist das für ein Buch Dune')?.kind, 'book')
assert.equal(parseWorldIntent('Wie hat der VfB gespielt?')?.kind, 'sport')
assert.equal(parseWorldIntent('Ergebnis Bayern')?.kind, 'sport')
assert.equal(parseWorldIntent('Was ist das für eine Pflanze Gänseblümchen')?.kind, 'plant')
assert.equal(parseWorldIntent('Wann fliegt die ISS?')?.kind, 'iss')
assert.equal(parseWorldIntent('Mondphase')?.kind, 'moon')
assert.equal(parseWorldIntent('Welcher Vogel ist das Amsel')?.kind, 'animal')
assert.equal(parseWorldIntent('Was fliegt da?')?.kind, 'flights')
assert.equal(parseWorldIntent('Kündigungsfrist Wohnung')?.kind, 'law')
assert.equal(parseWorldIntent('Was bedeutet die Waschschüssel?')?.kind, 'house')
assert.equal(parseWorldIntent('Schach')?.kind, 'chess')
assert.equal(parseWorldIntent('Schach neu')?.kind, 'chess')
const e2e4 = parseWorldIntent('Schach e2e4')
assert.equal(e2e4?.kind, 'chess')
if (e2e4?.kind === 'chess') assert.equal(e2e4.move?.toLowerCase(), 'e2e4')

assert.equal(parseWeatherIntent('Was soll ich anziehen?')?.kind, 'ask')
assert.equal(parseWeatherIntent('Wetter heute')?.kind, 'here')
assert.equal(parseWeatherIntent('Wie ist die Luft?')?.kind, 'ask')
assert.equal(parseShopIntent('Guten Morgen'), null)
assert.ok(isBriefAsk('Guten Morgen'))
assert.ok(isBriefAsk('Was steht an?'))
assert.equal(parseFilmIntent('Switch 2 kaufen'), null)
assert.equal(parseFilmIntent('Wo kann ich Switch 2 kaufen'), null)
assert.equal(parseFilmIntent('Ne die Switch 2 mit Rabatt'), null)
assert.ok(isProductLookup('Wo kann ich Switch 2 kaufen'))
assert.ok(isProductLookup('Ne die Switch 2 mit Rabatt'))
assert.equal(parseShopIntent('Wo kann ich Switch 2 kaufen'), null)
assert.equal(parseShopIntent('Switch 2 kaufen')?.kind, 'add')
assert.equal(parseWeatherIntent('Brauche ich in Bietigheim einen Schirm?')?.kind, 'place')
assert.equal(parseWeatherIntent('Brauche ich in Bietigheim einen Schirm?')?.place, 'Bietigheim')
assert.match(researchQuery('Kannst du den bip von Deutschland in einer Tabelle darstellen?'), /Bruttoinlandsprodukt Deutschland Destatis/)
assert.match(HELP_TEXT, /2\.19\.2/)
assert.deepEqual(splitTitlePlace('Termin 15 Uhr'), { title: 'Termin 15 Uhr' })
assert.equal(parseDeviceIntent('Wie viele Schritte heute?')?.kind, 'steps')
assert.equal(parseDeviceIntent('Luftdruck')?.kind, 'pressure')
assert.equal(parseDeviceIntent('Kompass')?.kind, 'compass')

const start = parseFen(START_FEN)
const moved = applyMove(start, 'e2e4')
assert.equal(moved.ok, true)
if (moved.ok) {
  assert.match(fenOf(moved.next), /^rnbqkbnr\/pppppppp\/8\/8\/4P3\/8\/PPPP1PPP\/RNBQKBNR b /)
}

const packed = packChat(
  [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'a'.repeat(800) },
    { role: 'assistant', content: 'b'.repeat(800) },
    { role: 'user', content: 'jetzt' },
  ],
  400,
)
assert.equal(packed[0].role, 'system')
assert.equal(packed[packed.length - 1].content, 'jetzt')
assert.ok(packed.length < 4)

const keep = packChat([
  { role: 'system', content: 'kurz' },
  { role: 'user', content: 'hi' },
])
assert.equal(keep.length, 2)

assert.match(HELP_TEXT, /2\.19\.2/)
assert.match(HELP_TEXT, /Musik ist nicht angebunden/)
assert.match(HELP_TEXT, /DWD/)
assert.match(HELP_TEXT, /Schach/)
assert.doesNotMatch(HELP_TEXT, /Einstellungen → Musik/)
assert.doesNotMatch(HELP_TEXT, /Lautstärke am Steuer ist Spotify/)

assert.ok(flagReply('Fernseher an', 'Ich habe den Fernseher angeschaltet.', { debug: { route: 'llm', model: 'x', gemini: false } }).includes('hallucinated_action'))
assert.ok(flagReply('Wie spät', 'Es ist 12:01 Uhr.', { debug: { route: 'device', model: 'deterministic', gemini: false } }).includes('tool_executed') === false)
assert.ok(!flagReply('Wie spät', 'Montag, 12:01 Uhr.', { debug: { route: 'device', model: 'deterministic', gemini: false, executed: true }, tool: { tool_status: 'executed', tool: 'device' } }).includes('clock_without_device'))
assert.ok(flagReply('Hallo', 'Es ist 12:01 Uhr.', { debug: { route: 'llm', model: 'x', gemini: false } }).includes('clock_without_device'))
assert.ok(flagReply('Spiel mal was Nettes', 'Ich öffne die Musik.', { debug: { route: 'llm', model: 'x', gemini: false } }).includes('music_claim'))
assert.ok(flagReply('Spiel mal was Nettes', 'Musik ist nicht angebunden.', { debug: { route: 'music', model: 'deterministic', gemini: false } }).includes('music_claim') === false)
const payload = debugPayload({
  route: 'weather',
  model: 'deterministic',
  gemini: false,
  tool: { tool_status: 'executed', tool: 'weather', action: 'now', label: 'Wetter' },
  final: 'In Heilbronn 18 Grad.',
})
assert.equal(payload.debug.route, 'weather')
assert.match(debugFileName({ id: '1', title: 'Was steht an?', created_at: '', updated_at: '' }), /jarvis-debug-was-steht-an-/)

console.log('ok test-219')

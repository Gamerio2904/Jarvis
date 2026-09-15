import assert from 'node:assert/strict'
import { commandClause, parseHudIntent } from '../src/engine/hud-parse.ts'
import { parseFlightsIntent } from '../src/engine/flights.ts'
import { dayOfYear, isNight, nightCover, subsolar, wrapLon } from '../src/engine/sun.ts'
import { alongCoast, briefFitsPlace, pinLineFor } from '../src/engine/globe-geo.ts'
import { ageLine } from '../src/engine/globe-layers.ts'
import { screenPanToMap } from '../src/engine/drive-map.ts'
import { parseHereIntent } from '../src/engine/here-parse.ts'

const june = new Date(Date.UTC(2026, 5, 21, 12, 0, 0))
const sun = subsolar(june)
assert.ok(sun.lat > 20 && sun.lat < 26, `Sommersonnenwende Breite ${sun.lat}`)
assert.ok(Math.abs(sun.lon) < 2, `UTC-Mittag Länge ${sun.lon}`)
assert.equal(dayOfYear(new Date(Date.UTC(2026, 0, 1))), 1)
assert.equal(wrapLon(190), -170)
assert.equal(isNight(0, 0, { lat: 0, lon: 0 }), false)
assert.equal(isNight(0, 180, { lat: 0, lon: 0 }), true)
assert.equal(nightCover(1, 0), 'none')
assert.equal(nightCover(-1, 0), 'all')
assert.equal(nightCover(0, 0.5), 'half')
assert.equal(alongCoast(20, 1).every((i) => i % 2 === 0), true)
assert.equal(alongCoast(20, 2)[1], 4)
assert.equal(alongCoast(7, 1).at(-1), 4)

assert.equal(parseHudIntent('Zeig Erdbeben')?.kind, 'layer')
assert.equal(parseHudIntent('Zeig Erdbeben')?.layer, 'quakes')
assert.equal(parseHudIntent('Wo hat es gebebt')?.layer, 'quakes')
assert.equal(parseHudIntent('Zeig mir das Erdbeben')?.layer, 'quakes')
assert.equal(parseHudIntent('Wo brennt es')?.layer, 'fires')
assert.equal(parseHudIntent('Zeig Waldbrände')?.layer, 'fires')
assert.notEqual(parseHudIntent('Zeig Erdbeben')?.kind, 'unknown_place')
assert.notEqual(parseHudIntent('Zeig Waldbrände')?.kind, 'unknown_place')
assert.equal(parseHudIntent('Zeig die Erde')?.view, 'globe')
assert.equal(parseHudIntent('Zeig mir London')?.kind, 'pin')
assert.equal(parseHudIntent('Ah sehr schön. Zeig mir das auf der Karte')?.kind, 'show_map')
assert.equal(parseHudIntent('Zeig mir Bibione auf der Karte')?.kind, 'show_map')
assert.equal(parseHudIntent('öffne die Karte')?.view, 'globe')
assert.equal(commandClause('Ah sehr schön. Zeig mir das auf der Karte'), 'Zeig mir das auf der Karte')
assert.equal(briefFitsPlace('Kiew', 'Zur Lage in London: Themse.'), false)
assert.match(pinLineFor('Kiew', 'Zur Lage in London: Themse.'), /Kiew/)
assert.doesNotMatch(pinLineFor('Kiew', 'Zur Lage in London: Themse.'), /London/)
assert.equal(parseHereIntent('weißt du auch wo?')?.kind, 'locate')
{
  const east = screenPanToMap(10, 0, 90)
  assert.ok(Math.abs(east.dx) < 1e-9)
  assert.ok(Math.abs(east.dy + 10) < 1e-9)
}

assert.equal(parseFlightsIntent('Was fliegt über uns'), true)
assert.equal(parseFlightsIntent('was ist über uns'), true)
assert.equal(parseFlightsIntent('Was ist über Deutschland'), true)
assert.equal(parseFlightsIntent('Was fliegt da über uns?'), true)

assert.match(ageLine(Date.now() - 12 * 60_000), /12 Minuten/)

console.log('test:globe-18 ok')

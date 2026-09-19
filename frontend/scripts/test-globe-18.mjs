// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'
import { commandClause, parseHudIntent } from '../src/engine/hud-parse.ts'
import { parseFlightsIntent } from '../src/engine/flights.ts'
import { dayOfYear, isNight, nightCover, subsolar, wrapLon } from '../src/engine/sun.ts'
import {
  alongCoast,
  briefFitsPlace,
  isGlobeLayerPin,
  pickTappedPin,
  pinLineFor,
  pinTapRadius,
  placeLookupFailedLine,
} from '../src/engine/globe-geo.ts'
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

assert.match(placeLookupFailedLine('Xanadu', 'Ort „Xanadu“ nicht erreichbar.'), /Ohne Netz/)
assert.match(placeLookupFailedLine('Xanadu', 'Ort „Xanadu“ nicht gefunden.'), /habe ich auf der Kugel nicht/)

assert.equal(parseFlightsIntent('Was fliegt über uns'), true)
assert.equal(parseFlightsIntent('was ist über uns'), true)
assert.equal(parseFlightsIntent('Was ist über Deutschland'), true)
assert.equal(parseFlightsIntent('Was fliegt da über uns?'), true)

assert.match(ageLine(Date.now() - 12 * 60_000), /12 Minuten/)

assert.equal(isGlobeLayerPin('fire'), true)
assert.equal(isGlobeLayerPin('quake'), true)
assert.equal(isGlobeLayerPin('flight'), true)
assert.equal(isGlobeLayerPin('news'), false)
assert.equal(pinTapRadius('fire'), 32)
assert.equal(pinTapRadius('news'), 20)
{
  const fire = { name: 'Brand Nord', lat: 40, lon: -120, kind: 'fire', line: 'NASA EONET' }
  assert.equal(pickTappedPin([{ pin: fire, x: 100, y: 80, z: 0.4 }], 118, 80)?.name, 'Brand Nord')
  assert.equal(pickTappedPin([{ pin: fire, x: 100, y: 80, z: 0.4 }], 140, 80), null)
  assert.equal(pickTappedPin([{ pin: fire, x: 100, y: 80, z: -0.4 }], 100, 80), null)
}
{
  const city = { name: 'Berlin', lat: 52.52, lon: 13.41, kind: 'news' }
  assert.equal(pickTappedPin([{ pin: city, x: 0, y: 0, z: 1 }], 19, 0)?.name, 'Berlin')
  assert.equal(pickTappedPin([{ pin: city, x: 0, y: 0, z: 1 }], 25, 0), null)
}
assert.match(pinLineFor('Brand Nord', 'NASA EONET'), /EONET/)
assert.match(pinLineFor('M4.8', 'USGS · 10 km S of Ridgecrest'), /USGS/)
assert.match(pinLineFor('DLH4A', 'OpenSky'), /OpenSky/)
assert.equal(pinLineFor('Atlantis', 'Zur Lage in London: Themse.'), 'Keine Kurzlage zu diesem Ort.')

console.log('test:globe-18 ok')

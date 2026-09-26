// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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
  spherePixelSpread,
} from '../src/engine/globe-geo.ts'
import {
  ageLine,
  parseGlobeLayerPhrase,
  briefingFromCache,
  dossierNear,
  isGlobeLayer,
  OVERHEAD_BOX_DEG,
  overheadBoxArea,
  overheadHttpError,
  overheadStatesUrl,
  isAirborneState,
  layerFlyFocus,
  parseTrueTrack,
} from '../src/engine/globe-layers.ts'
import { aircraftScale, headingRad, pinMarkerKind } from '../src/engine/globe-icons.ts'
import { CITY_FLY_ZOOM, GLOBE_ZOOM_MAX, OVERHEAD_FLY_ZOOM, TOUR_OVERVIEW_ZOOM } from '../src/engine/globe-gibs.ts'
import { herePinState, isValidHereCoord } from '../src/engine/location-keep.ts'
import { FIRE_BANDS, inLonLatBox, propagateGp, spreadFixes } from '../src/engine/orbit.ts'
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
assert.equal(parseHudIntent('Zeig Unwetter')?.layer, 'weather')
assert.equal(parseHudIntent('Luftqualität')?.layer, 'air')
assert.equal(parseHudIntent('Zeig Flugzeuge')?.kind, 'layer')
assert.equal(parseHudIntent('Zeig Flugzeuge')?.layer, 'overhead')
assert.notEqual(parseHudIntent('Zeig Flugzeuge')?.kind, 'unknown_place')
assert.equal(parseHudIntent('Zeig Satelliten')?.layer, 'sats')
assert.equal(parseHudIntent('Was fährt auf See')?.layer, 'ships')
assert.equal(parseHudIntent('Kernkraft')?.layer, 'infra')
assert.equal(parseHudIntent('Zeig Konflikte')?.layer, 'conflicts')
assert.equal(parseHudIntent('Welt-Ereignisse')?.layer, 'events')
assert.equal(parseHudIntent('Cyber auf der Karte')?.layer, 'cyber')
assert.equal(parseHudIntent('Schicht aus')?.kind, 'layer_off')
assert.equal(parseHudIntent('Briefing zur Lage')?.kind, 'lage_brief')
assert.equal(parseHudIntent('Weltraumwetter')?.kind, 'space_weather')
assert.notEqual(parseHudIntent('Zeig Satelliten')?.kind, 'unknown_place')
assert.notEqual(parseHudIntent('Zeig Konflikte')?.kind, 'unknown_place')
assert.equal(parseGlobeLayerPhrase('Schicht aus')?.kind, 'off')
assert.equal(isGlobeLayer('quakes'), true)
assert.equal(isGlobeLayer('nope'), false)
assert.match(briefingFromCache(), /Nichts auf der Kugel|ISS/)
{
  const d = dossierNear(
    [{ name: 'Hamburg', lat: 53.55, lon: 9.99, kind: 'ship', line: 'Tabelle' }],
    53.5,
    10,
  )
  assert.match(d?.line || '', /Hamburg/)
  assert.equal(dossierNear([], 53.5, 10), null)
}
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
assert.match(ageLine(Date.now() - 12_000), /12 s/)
assert.doesNotMatch(ageLine(Date.now() - 12_000), /Live/)
assert.equal(OVERHEAD_BOX_DEG, 2)
assert.equal(overheadBoxArea(), 16)
{
  const url = overheadStatesUrl({ lat: 51.16, lon: 10.45, label: 'Deutschland-Mitte' })
  assert.match(url, /lamin=/)
  assert.match(url, /lomin=/)
  assert.match(url, /lamax=/)
  assert.match(url, /lomax=/)
  assert.equal(url.includes('/states/all?'), true)
  assert.equal(/\/states\/all$/.test(url), false)
}
assert.equal(parseTrueTrack(90), 90)
assert.equal(parseTrueTrack(null), undefined)
assert.equal(parseTrueTrack('nope'), undefined)
assert.equal(isAirborneState([, 'DLH', , , , 10.4, 51.1, , false, 120, 90]), true)
assert.equal(isAirborneState([, 'DLH', , , , 10.4, 51.1, , true, 0, 90]), false)
assert.equal(isAirborneState([, 'DLH', , , , 'x', 51.1, , false]), false)
assert.equal(CITY_FLY_ZOOM < 5.2, true)
assert.ok(OVERHEAD_FLY_ZOOM > CITY_FLY_ZOOM)
assert.ok(GLOBE_ZOOM_MAX >= OVERHEAD_FLY_ZOOM)
assert.ok(spherePixelSpread(4, 1.42) < 20, 'Europa-Zoom klebt den Ausschnitt')
assert.ok(spherePixelSpread(4, OVERHEAD_FLY_ZOOM) >= 90, 'Lokal-Zoom trennt Flugzeuge')
assert.ok(aircraftScale(12) > aircraftScale(1.4))
{
  const fly = layerFlyFocus('overhead')
  assert.ok(fly && fly.zoom === OVERHEAD_FLY_ZOOM)
  assert.equal(layerFlyFocus('quakes')?.zoom, TOUR_OVERVIEW_ZOOM)
  assert.equal(layerFlyFocus('sats')?.zoom, TOUR_OVERVIEW_ZOOM)
  assert.equal(layerFlyFocus(''), null)
}
assert.match(overheadHttpError(429, 40), /Tageslimit/)
assert.match(overheadHttpError(429, 40), /40 s/)
assert.match(overheadHttpError(401), /Zugang/)
assert.doesNotMatch(overheadHttpError(500), /Live/)
assert.equal(headingRad(0), 0)
assert.ok(Math.abs(headingRad(90) - Math.PI / 2) < 1e-9)
assert.equal(pinMarkerKind('flight'), 'flight')
assert.equal(pinMarkerKind('here'), 'here')
assert.equal(pinMarkerKind('sat'), 'sat')
assert.equal(pinMarkerKind('iss'), 'iss')
assert.equal(pinMarkerKind('quake'), 'dot')
assert.equal(isValidHereCoord('0', '0'), null)
assert.equal(isValidHereCoord('48.1', '9.2')?.lat, 48.1)
{
  const stale = herePinState('48.1', '9.2', new Date(Date.now() - 15 * 60_000).toISOString())
  assert.equal(stale?.stale, true)
  const fresh = herePinState('48.1', '9.2', new Date().toISOString())
  assert.equal(fresh?.stale, false)
  assert.equal(herePinState('', '', ''), null)
}

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
assert.match(pinLineFor('ISS', 'CelesTrak · Hubble'), /CelesTrak|ISS/)
assert.match(pinLineFor('Sicht', 'Wildfire A (12 km) · Wildfire B (40 km). Kein Live.'), /Wildfire/)
assert.match(pinLineFor('Tschernobyl', ''), /Ukraine|Tschernobyl/)
assert.match(pinLineFor('M4.8', 'USGS · 10 km S of Ridgecrest'), /USGS/)
assert.match(pinLineFor('DLH4A', 'OpenSky'), /OpenSky/)
assert.equal(pinLineFor('Atlantis', 'Zur Lage in London: Themse.'), 'Keine Kurzlage zu diesem Ort.')
{
  const now = new Date('2026-09-22T12:00:00Z')
  const iss = propagateGp(
    {
      OBJECT_NAME: 'ISS (ZARYA)',
      NORAD_CAT_ID: '25544',
      EPOCH: '2026-09-22T11:00:00',
      MEAN_MOTION: 15.5,
      ECCENTRICITY: 0.0003,
      INCLINATION: 51.6,
      RA_OF_ASC_NODE: 80,
      ARG_OF_PERICENTER: 10,
      MEAN_ANOMALY: 20,
    },
    now,
  )
  assert.ok(iss && Number.isFinite(iss.lat) && Number.isFinite(iss.lon))
  const spread = spreadFixes(
    [
      { lat: 40, lon: -120, name: 'us' },
      { lat: 39, lon: -119, name: 'us2' },
      { lat: -15, lon: 140, name: 'au' },
      { lat: 50, lon: 10, name: 'eu' },
      { lat: -20, lon: 25, name: 'af' },
    ],
    3,
  )
  assert.equal(spread.length, 3)
  const lons = spread.map((p) => p.lon)
  assert.ok(lons.some((lon) => lon < 0) && lons.some((lon) => lon > 0), 'Waldbrände nicht nur eine Halbkugel')
  assert.equal(FIRE_BANDS.length, 4)
  assert.equal(inLonLatBox({ lat: 46.6, lon: -120.5 }, FIRE_BANDS[2]), false)
  assert.equal(inLonLatBox({ lat: 12.1, lon: 18.4 }, FIRE_BANDS[2]), true)
  assert.equal(inLonLatBox({ lat: -15.2, lon: -60.1 }, FIRE_BANDS[1]), true)
  assert.equal(inLonLatBox({ lat: -23.0, lon: 140.0 }, FIRE_BANDS[3]), true)
}

{
  const here = dirname(fileURLToPath(import.meta.url))
  const view = readFileSync(join(here, '../src/ui/lage/GlobeView.tsx'), 'utf8')
  const layers = readFileSync(join(here, '../src/engine/globe-layers.ts'), 'utf8')
  const lage = readFileSync(join(here, '../src/ui/lage/Lage.tsx'), 'utf8')
  assert.match(view, /drawAircraft/)
  assert.match(view, /drawHerePin/)
  assert.match(view, /drawSat/)
  assert.match(view, /LABEL_ZOOM/)
  assert.match(layers, /isAirborneState/)
  assert.match(layers, /layerFlyFocus/)
  assert.match(layers, /warte auf Quelle/)
  assert.doesNotMatch(layers, /starlink/i)
  assert.match(lage, /globeLayer === 'overhead' \? 10_000/)
  assert.match(lage, /layerFlyFocus/)
}

console.log('test:globe-18 ok')

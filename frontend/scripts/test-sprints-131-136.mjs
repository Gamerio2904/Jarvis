/**
 * Sprints 132–136: Fly-to GIBS, Headline→Land, Tour-Parser, Gold-Routen.
 */
import assert from 'node:assert/strict'
import { CITY_FLY_ZOOM, GIBS_ZOOM_IN, globeZoomToTileZ } from '../src/engine/globe-gibs.ts'
import { matchCountry, marketKindForPlace } from '../src/engine/globe-countries.ts'
import { buildTourStops, TOUR_MAX, TOUR_SKIP, tourChatReply } from '../src/engine/globe-tour.ts'
import { parseOutlookIntent, parseRssItems } from '../src/engine/outlook.ts'
import { decodeHtml } from '../src/engine/html-text.ts'
import { parseNewsIntent, placeInHeadline } from '../src/engine/news-parse.ts'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { rewriteFollowUp } from '../src/engine/last-step.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'

assert.ok(CITY_FLY_ZOOM >= GIBS_ZOOM_IN, 'Fly-to muss in GIBS landen')
assert.ok(CITY_FLY_ZOOM < 5.2, 'Fly-to bleibt unter der 2D-Karte')
assert.ok(globeZoomToTileZ(CITY_FLY_ZOOM) >= 5, 'Stadt-Fly-to braucht Tile-Z für einen Stadt-Fleck')
assert.equal(matchCountry('Angriffe in der Ukraine')?.id, 'ua')
assert.equal(matchCountry('Die Lage in Europa ist unklar'), null)
assert.equal(matchCountry('Nach Sturzflut in Nepal')?.id, 'np')
assert.equal(matchCountry('Sinnbild des Bosnienkrieges')?.id, 'ba')
assert.equal(matchCountry('NATO-Treffen in Brüssel')?.id, 'be')
assert.equal(matchCountry('Straße von Hormus dicht')?.id, 'hormus')
assert.equal(marketKindForPlace('Straße von Hormus'), 'hormus')
assert.equal(marketKindForPlace('Frankfurt'), 'ezb')
assert.equal(marketKindForPlace('Ingersheim'), null)
assert.equal(marketKindForPlace('London'), null)
assert.ok(TOUR_SKIP.test('Bundesliga Unwetter in NRW'))

const sport = buildTourStops([
  { title: 'Bayern siegt in der Bundesliga', teaser: 'Fußball', url: 'https://www.tagesschau.de/x', date: '', tags: [], provider: 'tagesschau' },
  { title: 'Unwetter in NRW', teaser: 'Wetter', url: 'https://www.tagesschau.de/y', date: '', tags: [], provider: 'tagesschau' },
])
assert.equal(sport.length, 0, 'Sport/Wetter keine Tour-Länder')

const mixed = buildTourStops([
  { title: 'Angriffe in der Ukraine', teaser: 'Kiew', url: 'https://www.tagesschau.de/ua', date: '', tags: ['ukraine'], provider: 'tagesschau' },
  { title: 'Straße von Hormus', teaser: 'Tanker', url: 'https://www.tagesschau.de/ho', date: '', tags: ['hormus'], provider: 'dw' },
  { title: 'Noch mehr Ukraine', teaser: 'Donbass', url: 'https://www.tagesschau.de/ua2', date: '', tags: ['ukraine'], provider: 'tagesschau' },
])
assert.equal(mixed.length, 2)
assert.equal(mixed[0].id, 'ua')
assert.equal(mixed[1].id, 'hormus')
assert.ok(mixed.length <= TOUR_MAX)

assert.equal(parseOutlookIntent('Was ist heute so auf der Welt passiert')?.kind, 'world')
assert.equal(parseOutlookIntent('Was passiert auf der Welt')?.kind, 'world')
assert.equal(parseOutlookIntent('Weltbrief')?.kind, 'world')
assert.equal(parseNewsIntent('Was ist heute so auf der Welt passiert'), null)
assert.equal(parseNewsIntent('Zeig mir die Nachrichten')?.kind, 'national')
assert.equal(pickRoute(normalizeUtterance('Was ist heute so auf der Welt passiert')), 'outlook')
assert.equal(pickRoute(normalizeUtterance('Zeig mir die Nachrichten')), 'news')
assert.equal(parseHudIntent('Zeig London')?.kind, 'pin')
assert.equal(parseWontIntent('Zeig Street View von London')?.reason, 'street')
assert.equal(rewriteFollowUp('Stopp', { globe_tour_on: true }), 'Tour aus')
assert.equal(rewriteFollowUp('Stopp', { last_step_tool: 'outlook' }), 'Tour aus')
assert.equal(rewriteFollowUp('Stopp', { last_medium: 'spotify' }), 'Spotify Pause')
assert.equal(parseOutlookIntent('Tour aus')?.kind, 'tour_stop')
assert.equal(parseHudIntent('Was ist das für eine Stadt?')?.kind, 'look')
assert.equal(matchCountry('Prozess in Den Haag, Srebrenica')?.id, 'ba')
assert.equal(matchCountry('Trump im Weißen Haus')?.id, 'us')
assert.equal(placeInHeadline('London', 'Anschlag in London', ''), true)
assert.equal(placeInHeadline('London', 'Peter Neumann, King’s College London, CIA in Moskau', ''), false)
assert.ok(TOUR_SKIP.test('Nachruf auf Kusama'))
const chat = tourChatReply([
  { id: 'ua', name: 'Ukraine', lat: 1, lon: 1, title: 'Angriffe in der Ukraine', teaser: '', provider: 'tagesschau', url: 'https://www.tagesschau.de/ua', line: 'x' },
])
assert.match(chat, /Ukraine/)
assert.doesNotMatch(chat, /Szenario A|Barrel|FRED/)
const rss = parseRssItems(
  '<rss><channel><item><title>Lage</title><link>https://www.dw.com/x</link><description>Trump sagt &quot;nein&quot; in Washington</description></item></channel></rss>',
)
assert.match(rss[0]?.teaser || '', /"nein"/)
assert.doesNotMatch(rss[0]?.teaser || '', /&quot;/)
assert.equal(decodeHtml('seien &amp;quot;fiese Leute&amp;quot;.'), 'seien "fiese Leute".')
const dirty = buildTourStops([
  { title: 'Trump in Washington', teaser: 'seien &quot;fiese Leute&quot;', url: 'https://www.dw.com/t', date: '', tags: [], provider: 'dw' },
])
assert.equal(dirty[0]?.id, 'us')
assert.doesNotMatch(dirty[0]?.line || '', /&quot;/)
assert.match(dirty[0]?.line || '', /"fiese Leute"/)

console.log('ok sprints 132–136 globe briefing')

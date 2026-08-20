import assert from 'node:assert/strict'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { allTestCopyTexts, formatAllTestCopy, TEST_COPY_GROUPS, selectedTestPrompts, testPromptKey } from '../src/engine/test-copy.ts'
import { parseTvIntent, parseTvWatch } from '../src/engine/tv-parse.ts'
import { CONTRADICTION, parseMemoryFacts, isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { scrubReply, isHelpCommand, finishReply, HELP_TEXT } from '../src/engine/guards.ts'
import { isIdentityAsk } from '../src/engine/memory-parse.ts'
import {
  formatResearchReply,
  guardResearchReply,
  isFactLookup,
  isKnowledgeGap,
  isLiveLookup,
  isProductLookup,
  isSearchRefusal,
  isTableAsk,
  shouldRetrySearch,
  parseEuroPrices,
  parseShopDiscountIntent,
  RESEARCH_EMPTY,
  researchHasSources,
  researchQuery,
  researchStatusLabel,
  sourcesFromHtml,
  sourcesFromText,
} from '../src/engine/research-parse.ts'
import { parseReminderIntent, formatDue } from '../src/engine/remind-parse.ts'
import { parseWeatherFollowup, parseWeatherIntent } from '../src/engine/weather-parse.ts'
import { parseTransitIntent } from '../src/engine/transit-parse.ts'
import { parseHolidayIntent } from '../src/engine/holiday-parse.ts'
import { parseNewsIntent } from '../src/engine/news-parse.ts'
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { timerDoneLine, cleanTimerTitle, timerSetLine, timerStopLine } from '../src/engine/timer-announce.ts'
import { expandZahlenworte } from '../src/engine/zahlenworte.ts'
import { parseAlarmIntent } from '../src/engine/alarm-parse.ts'
import { clothingTip, formatWeatherBrief } from '../src/engine/weather-brief.ts'
import { parseCalendarIntent, parseCalDecision, splitTitlePlace } from '../src/engine/calendar-parse.ts'
import { createSentenceTap, pullReady } from '../src/engine/speak-tap.ts'
import { ttsModelsToTry } from '../src/engine/tts.ts'
import { GEMINI_PERSONA, PERSONA, SEARCH_ON_HINT, VOICE_HINT } from '../src/engine/persona.ts'
import { splitIntents } from '../src/engine/split-intents.ts'
import { isFollowUpPhrase, rewriteFollowUp } from '../src/engine/last-step.ts'
import { shouldRefreshTitle, titleFromUser } from '../src/engine/chat-title.ts'
import { memoryBlock } from '../src/engine/memory-block.ts'
import { parseFanIntent } from '../src/engine/fan-parse.ts'
import { parsePlugIntent } from '../src/engine/plug-parse.ts'
import { lanIpHint } from '../src/engine/plug-net.ts'
import {
  displayPlaceName,
  findContactRow,
  findPlaceRow,
  isCommNo,
  isCommYes,
  mapsDirUrl,
  normalizePlaceName,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
  looksLikeBareStreet,
} from '../src/engine/places-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { pickHeard } from '../src/engine/heard.ts'
import { parseShopIntent } from '../src/engine/shopping-parse.ts'
import { parseBirthdayIntent } from '../src/engine/birthday-parse.ts'
import { parseHomeIntent } from '../src/engine/home-parse.ts'
import { parseLeaveIntent } from '../src/engine/leave-parse.ts'
import { parseDriveIntent } from '../src/engine/drive-parse.ts'
import { parseDeviceIntent, formatClockReply } from '../src/engine/device-parse.ts'
import { parsePcIntent, PC_COPY_PROMPTS } from '../src/engine/pc-parse.ts'
import { parsePoiIntent, poiLabel } from '../src/engine/poi-parse.ts'
import { formatHoursSpeech, hoursOpenNow, isBwHoliday, isOpenAt, parseOpeningHours } from '../src/engine/opening-hours.ts'
import { formatE10Price, formatFuelSpeech, pickFuelPair } from '../src/engine/fuel-format.ts'
import { isFuelPlace, parseFuelFollowUp, parseFuelIntent } from '../src/engine/fuel-parse.ts'
import { formatHereReply, parseHereIntent } from '../src/engine/here-parse.ts'
import { parseSpotifyIntent, spotifySourceLabel } from '../src/engine/spotify-parse.ts'
import { collectFreeWhere, pickWatchTarget, parseWatchOffers, youtubeVideoId } from '../src/engine/tv-watch.ts'
import { parseFilmIntent } from '../src/engine/film-parse.ts'
import { formatFilmReply } from '../src/engine/film.ts'
import { tvAppFromPackage } from '../src/engine/tv-apps.ts'
import { dirFromManeuver, formatNavCue, navPhase, nextManeuver } from '../src/engine/nav-speak.ts'
import { compactCoords, decodePolyline, asLonLat, isRoadTrack, latLonFromWorld, lonLatPath, panCam, projectOnTiles, projectToView, settleZoom, simplifyTrack, snapToTrack, tilesForView, tileUrl, webMercator, worldPixels, wrapTile, zoomAround, zoomForSpeedMps, zoomToInclude } from '../src/engine/drive-map.ts'
import { pickGeoHits } from '../src/engine/geo-lookup.ts'
import { isBriefAsk } from '../src/engine/brief-parse.ts'
import { parseEyeIntent } from '../src/engine/eye-parse.ts'
import { parseChatSearch } from '../src/engine/search-chat-parse.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'

assert.equal(parseTvIntent('Fernseher an')?.action, 'on')
assert.equal(parseTvIntent('mach den TV aus')?.action, 'off')
assert.equal(parseTvIntent('Fernseher lauter')?.action, 'volume_up')
assert.equal(parseTvIntent('TV leiser')?.action, 'volume_down')
assert.equal(parseTvIntent('Fernseher stumm')?.action, 'mute')
assert.equal(parseTvIntent('auf HDMI 2'), null)
assert.equal(parseTvIntent('Fernseher auf HDMI 2')?.action, 'hdmi2')
assert.equal(parseTvIntent('TV Quelle 1')?.action, 'hdmi1')
assert.equal(parseTvIntent('Fire TV')?.via, 'fire')
assert.equal(parseTvIntent('Fire TV')?.action, 'on')
assert.equal(parseTvIntent('Fire TV Pause')?.action, 'pause')
assert.equal(parseTvIntent('Fernseher auf HDMI 3')?.action, 'hdmi3')
assert.equal(parseTvIntent('lauter'), null)
assert.equal(parseTvIntent('lauter', true)?.action, 'volume_up')
assert.equal(parseTvIntent('Lautstärke 50')?.action, 'volume_set')
assert.equal(parseTvIntent('Lautstärke 50')?.level, 50)
assert.equal(parseTvIntent('lauter um 10')?.action, 'volume_up')
assert.equal(parseTvIntent('lauter um 10')?.steps, 10)
assert.equal(parseTvIntent('leiser um 5')?.action, 'volume_down')
assert.equal(parseTvWatch('Öffne Netflix')?.kind, 'open')
assert.equal(parseTvWatch('Öffne Netflix')?.kind === 'open' && parseTvWatch('Öffne Netflix').app, 'netflix')
assert.equal(parseTvWatch('Starte YouTube am Fernseher')?.kind === 'open' && parseTvWatch('Starte YouTube am Fernseher').app, 'youtube')
assert.equal(parseTvWatch('Spiel YouTube')?.kind === 'open' && parseTvWatch('Spiel YouTube').app, 'youtube')
assert.equal(parseTvWatch('Öffne Amazon')?.kind === 'open' && parseTvWatch('Öffne Amazon').app, 'prime')
assert.equal(parseTvWatch('Disney Plus am Fernseher')?.kind === 'open' && parseTvWatch('Disney Plus am Fernseher').app, 'disney')
assert.equal(parseTvWatch('Spiel Dune Film')?.kind, 'play')
assert.equal(parseTvWatch('Spiel Dune Film')?.kind === 'play' && parseTvWatch('Spiel Dune Film').title, 'Dune')
assert.equal(parseTvWatch('Spiele den Film Inception')?.kind === 'play' && parseTvWatch('Spiele den Film Inception').title, 'Inception')
assert.equal(parseTvWatch('Spiel Dune Film App')?.kind === 'play' && parseTvWatch('Spiel Dune Film App').title, 'Dune')
assert.equal(parseTvWatch('Spiel Dune auf Netflix')?.kind === 'play' && parseTvWatch('Spiel Dune auf Netflix').app, 'netflix')
assert.equal(parseTvWatch('Spiel Dune auf Netflix')?.kind === 'play' && parseTvWatch('Spiel Dune auf Netflix').title, 'Dune')
assert.equal(parseTvWatch('Spiel Hotel California'), null)
assert.equal(parseTvWatch('Spiel das auf Spotify'), null)
assert.equal(parseTvWatch('Fire TV Pause'), null)
assert.equal(parseTvWatch('Fernseher an'), null)
assert.equal(parseTvWatch('Netflix an')?.kind, 'open')
{
  const yt = parseTvWatch('Spiele ein der hansus YouTube Video auf dem Fernseher ab')
  assert.equal(yt?.kind, 'play')
  if (yt?.kind === 'play') {
    assert.equal(yt.app, 'youtube')
    assert.equal(yt.content, 'video')
    assert.equal(yt.title.toLowerCase().includes('hansus'), true)
  }
}
assert.equal(parseTvWatch('Spiele Sonic 3 ab'), null)
{
  const sonic = parseTvWatch('Spiele Sonic 3 ab', { followUp: true, lastApp: 'youtube' })
  assert.equal(sonic?.kind, 'play')
  if (sonic?.kind === 'play') {
    assert.equal(sonic.title, 'Sonic 3')
    assert.equal(sonic.app, 'youtube')
    assert.equal(sonic.content, 'video')
  }
}
assert.match(
  scrubReply('Kein direkter Zugriff auf Ihre Geräte, Timon. Den Film müssen Sie auf dem Fernseher.'),
  /Fernseher steuere ich/,
)
assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
assert.equal(tvAppFromPackage({ packageId: 8 }), 'netflix')
assert.equal(tvAppFromPackage({ packageId: 337 }), 'disney')
assert.equal(pickWatchTarget(parseWatchOffers([
  { monetizationType: 'FLATRATE', standardWebURL: 'https://www.netflix.com/title/1', package: { packageId: 8, clearName: 'Netflix' } },
  { monetizationType: 'FREE', standardWebURL: 'https://www.youtube.com/watch?v=abc123xyz', package: { packageId: 192, clearName: 'YouTube' } },
]))?.app, 'youtube')
assert.equal(pickWatchTarget(parseWatchOffers([
  { monetizationType: 'RENT', package: { packageId: 10, clearName: 'Amazon Video' } },
]), 'prime')?.monetization, 'rent')
assert.equal(pickWatchTarget(parseWatchOffers([
  { monetizationType: 'RENT', package: { packageId: 10, clearName: 'Amazon Video' } },
])), null)
assert.equal(parseDriveIntent('Aktiviere Fahrmodus')?.kind, 'on')
assert.equal(parseDriveIntent('Fahrmodus aus')?.kind, 'off')
assert.equal(parseDriveIntent('zur Freundin', true)?.kind, 'dest')
assert.equal(parseDriveIntent('Nach Heilbronn')?.kind, 'on')
assert.equal(parseDriveIntent('Nach Heilbronn')?.kind === 'on' && parseDriveIntent('Nach Heilbronn')?.dest, 'Heilbronn')
assert.equal(parseDriveIntent('nach Heilbronn fahren')?.kind, 'on')
assert.equal(parseDriveIntent('Fahr nach Heilbronn')?.kind, 'on')
assert.equal(parseDriveIntent('Fahr mich zur Freundin')?.kind, 'on')
assert.equal(parseDriveIntent('Nach Heilbronn', true)?.kind, 'dest')
assert.equal(parseDriveIntent('Kannst du nach Heilbronn fahren')?.kind, 'on')
assert.equal(parseDriveIntent('Ich will nach Heilbronn')?.dest, 'Heilbronn')
assert.equal(parseDriveIntent('Nach dem Wetter'), null)
assert.equal(normalizeUtterance('Kannst du nach Heilbronn fahren'), 'nach Heilbronn fahren')
assert.equal(normalizeUtterance('nach heilbron'), 'nach Heilbronn')
assert.equal(pickHeard('nach heilbron', ['nach Heilbronn']), 'nach Heilbronn')
assert.equal(pickHeard('ähm fahr nach heilbron', ['Fahr nach Heilbronn']), 'fahr nach Heilbronn')
assert.equal(parseDriveIntent(pickHeard('ähm fahr nach heilbron', ['xyz']))?.dest, 'Heilbronn')
assert.equal(parseSpotifyIntent('Spiel Hotel California')?.kind, 'play')
assert.deepEqual(parseSpotifyIntent('Spiel mal Hotel California'), { kind: 'play', query: 'Hotel California' })
assert.equal(parseSpotifyIntent('Pause')?.kind, 'pause')
assert.equal(parseSpotifyIntent('Spotify Pause')?.kind, 'pause')
assert.equal(parseSpotifyIntent('weiter')?.kind, 'next')
assert.equal(parseSpotifyIntent('nächster Song')?.kind, 'next')
assert.equal(spotifySourceLabel('internal'), 'in Jarvis')
assert.equal(spotifySourceLabel('preview'), '30s-Vorschau')
assert.equal(parseSpotifyIntent('Spiel Hotel California auf Spotify')?.kind, 'play')
assert.deepEqual(parseSpotifyIntent('Spiel Hotel California auf Spotify'), {
  kind: 'play',
  query: 'Hotel California',
})
assert.equal(parseSpotifyIntent('Spiel das auf Spotify')?.kind, 'resume')
assert.equal(parseSpotifyIntent('Zeig Spotify')?.kind, 'resume')
assert.equal(parseSpotifyIntent('Lautstärke 50')?.kind, 'volume_set')
assert.equal(parseSpotifyIntent('lauter um 10')?.kind, 'volume_up')
assert.equal(parseTvIntent('Lautstärke 50')?.action, 'volume_set')
assert.equal(parseTvIntent('Fernseher lautstärke 50')?.action, 'volume_set')
assert.equal(parseDriveIntent('Zeig Spotify'), null)
assert.equal(parseDriveIntent('Zeig Spotify', true)?.tab, 'spotify')
assert.equal(parseDriveIntent('Öffne das Spotify overlay')?.tab, 'spotify')
assert.equal(parseDriveIntent('öffne Karte')?.kind === 'tab' && parseDriveIntent('öffne Karte')?.tab, 'map')
assert.equal(parseDriveIntent('Karte'), null)
assert.equal(parseDriveIntent('Karte', true)?.tab, 'map')
assert.equal(parseDriveIntent('Spotify', true)?.tab, 'spotify')
assert.equal(parseDriveIntent('Spiel das auf Spotify')?.tab, 'spotify')
assert.equal(formatNavCue('left', 300, 'mid'), 'Vorne links in 300 Metern abbiegen.')
assert.equal(formatNavCue('slight_left', 300, 'mid'), 'Vorne links in 300 Metern abbiegen.')
assert.equal(formatNavCue('right', 80, 'near'), 'In 100 Metern rechts abbiegen.')
assert.equal(formatNavCue('left', 20, 'now'), 'Jetzt links abbiegen.')
assert.equal(navPhase(300), 'mid')
assert.equal(dirFromManeuver('turn', 'left'), 'left')
assert.equal(dirFromManeuver('turn', 'slight left'), 'slight_left')
{
  const nxt = nextManeuver(
    [{ lat: 48.7827, lon: 9.18, type: 'turn', modifier: 'left', name: 'Testweg' }],
    [
      [9.18, 48.78],
      [9.18, 48.781],
      [9.18, 48.782],
      [9.18, 48.7827],
    ],
    { lat: 48.78, lon: 9.18 },
  )
  assert.ok(nxt)
  assert.equal(nxt.dir, 'left')
  assert.ok(nxt.meters > 200)
  assert.equal(formatNavCue(nxt.dir, 300, 'mid'), 'Vorne links in 300 Metern abbiegen.')
}

{
  const a = webMercator(48.78, 9.18, 16)
  const b = webMercator(48.78, 9.28, 16)
  assert.ok(b.x > a.x)
  const origin = { x: Math.floor(a.x), y: Math.floor(a.y) }
  const path = lonLatPath(
    [
      [9.18, 48.78],
      [9.28, 48.78],
    ],
    origin,
    16,
    256,
  )
  const xs = path.split(' ').map((p) => Number(p.split(',')[0]))
  assert.equal(xs.length, 2)
  assert.ok(xs[1] > xs[0])
  assert.equal(compactCoords(Array.from({ length: 20 }, (_, i) => [i, i]), 5).length, 5)
  const east = projectToView(48.78, 9.28, 48.78, 9.18, 16, 200, 400)
  const north = projectToView(48.79, 9.18, 48.78, 9.18, 16, 200, 400)
  assert.ok(east.x > 200)
  assert.ok(north.y < 400)
  const cover = tilesForView(390, 844)
  assert.ok(cover.cols * 256 >= 390)
  assert.ok(cover.rows * 256 >= 844)
  assert.equal(zoomForSpeedMps(0), 16)
  assert.equal(zoomForSpeedMps(8), 15)
  assert.equal(zoomForSpeedMps(40), 13)
  const t0 = 10_000
  assert.equal(settleZoom(16, 15, t0, t0 + 400), 16)
  assert.equal(settleZoom(16, 15, t0, t0 + 2000), 15)
  assert.equal(wrapTile(3, -1), 7)
  assert.ok(tileUrl(16, 1, 2, true).includes('cartocdn.com'))
  assert.ok(!tileUrl(16, 1, 2, true).includes('rotate'))
  const home = { lat: 48.78, lon: 9.18, zoom: 16 }
  const west = panCam(home, 256, 0)
  assert.ok(west.lon < home.lon)
  const back = latLonFromWorld(worldPixels(home.lat, home.lon, 16).x, worldPixels(home.lat, home.lon, 16).y, 16)
  assert.ok(Math.abs(back.lat - home.lat) < 1e-6)
  assert.ok(Math.abs(back.lon - home.lon) < 1e-6)
  const zc = zoomAround(home, 17, 200, 400, 200, 400)
  assert.ok(Math.abs(zc.lat - home.lat) < 1e-5)
  assert.ok(Math.abs(zc.lon - home.lon) < 1e-5)
  assert.equal(zc.zoom, 17)
  assert.deepEqual(asLonLat([9.14, 48.95]), [9.14, 48.95])
  assert.deepEqual(asLonLat([48.95, 9.14]), [9.14, 48.95])
  const poly =
    'w_xiHgbyv@?`@Ap@?Z?n@~@l@|@l@xB`B`@\\dB~Ar@v@v@bAp@|@l@|@bAbBZj@\\t@NXHRP`@BF@@NVABGJGJEDoBzBMTGLCJCPGf@CLEh@If@G`@Kb@Kh@E`@ELAJAP?H@J?HBJ@J'
  const decoded = decodePolyline(poly)
  assert.ok(decoded.length >= 40)
  assert.ok(Math.abs(decoded[0][0] - 9.14484) < 1e-4)
  assert.ok(Math.abs(decoded[0][1] - 48.95244) < 1e-4)
  const last = decoded[decoded.length - 1]
  assert.ok(Math.abs(last[0] - 9.13663) < 1e-4)
  assert.ok(Math.abs(last[1] - 48.94972) < 1e-4)
  assert.equal(isRoadTrack(decoded, 878), true)
  assert.equal(isRoadTrack([[9.14, 48.95], [9.13, 48.94]], 800), false)
  const elbow = simplifyTrack([
    [9.144, 48.952],
    [9.144, 48.95],
    [9.14, 48.95],
  ])
  assert.equal(elbow.length, 3)
  const straight = simplifyTrack(
    Array.from({ length: 12 }, (_, i) => [9.14, 48.95 + i * 0.00005]),
  )
  assert.equal(straight.length, 2)
  const valeo = { lat: 48.95246, lon: 9.14493 }
  const katz = { lat: 48.94972, lon: 9.13663 }
  const fit = zoomToInclude(valeo, katz, 390, 844)
  assert.ok(fit <= 16)
  const destPt = projectToView(katz.lat, katz.lon, valeo.lat, valeo.lon, fit, 195, 489.52)
  assert.ok(destPt.x > 36 && destPt.x < 354)
  assert.ok(destPt.y > 56 && destPt.y < 788)
  const tilePt = projectOnTiles(valeo.lat, valeo.lon, webMercator(valeo.lat, valeo.lon, 16), 16, 256, 195, 490)
  assert.ok(Math.abs(tilePt.x - 195) < 0.6)
  assert.ok(Math.abs(tilePt.y - 490) < 0.6)
}

assert.ok(isMemoryWrite('Ich heiße Max und trinke gerne Kaffee'))
const facts = parseMemoryFacts('Ich heiße Max und trinke gerne Kaffee und esse Pizza')
assert.equal(facts.find((f) => f.key === 'name')?.value, 'Max')
assert.equal(facts.find((f) => f.key === 'getränk')?.value, 'Kaffee')
assert.equal(facts.find((f) => f.key === 'essen')?.value, 'Pizza')
assert.ok(isMemoryRecall('Was trinke ich?'))
assert.ok(isMemoryRecall('Was trinke ich gerne?'))
assert.ok(!isMemoryWrite('Was trinke ich gerne?'))
assert.equal(parseMemoryFacts('Was trinke ich gerne?').find((f) => f.key === 'getränk'), undefined)
assert.ok(isMemoryRecall('Wie ist mein Name?'))
assert.ok(!isMemoryWrite('Hallo Jarvis'))

assert.equal(parseToolIntent('todo: Milch')?.kind, 'todo_create')
assert.equal(parseToolIntent('Milch kaufen'), null)
assert.equal(parseShopIntent('Milch kaufen')?.kind, 'add')
assert.equal(parseShopIntent('in 20 Minuten Milch holen'), null)
assert.equal(parseShopIntent('Milch auf die Einkaufsliste')?.kind, 'add')
assert.equal(parseShopIntent('auch Brot')?.kind, 'add')
assert.equal(parseShopIntent('was fehlt?')?.kind, 'list')
assert.equal(parseShopIntent('Milch hab ich')?.kind, 'got')
assert.equal(parseToolIntent('ich muss noch Brot holen')?.kind, 'todo_create')
assert.equal(parseToolIntent('erinner mich an Steuer'), null)
assert.equal(parseReminderIntent('erinner mich an Steuer')?.kind, 'ask')
assert.equal(parseToolIntent('erledige das erste')?.kind, 'todo_done_first')
assert.equal(parseToolIntent('was steht an')?.kind, 'todo_list')
assert.equal(parseToolIntent('Was soll ich kaufen?'), null)

assert.ok(isHelpCommand('/hilfe'))
assert.match(scrubReply('Du bist toll und dein Hund auch'), /Sie/)
assert.match(scrubReply('Ich habe den Fernseher ausgeschaltet'), /nicht ausgeführt/)
assert.match(scrubReply('Sie leiden an akuter Amnesie.'), /Jarvis/)
assert.doesNotMatch(scrubReply('Gerne! Wie kann ich helfen?'), /Gerne|helfen/i)
assert.doesNotMatch(scrubReply('Als KI stehe ich zu Diensten.'), /Als KI|Diensten/i)
assert.match(PERSONA, /Siezen/)
assert.match(GEMINI_PERSONA, /Smalltalk/)
assert.match(GEMINI_PERSONA, /Master/)
assert.match(GEMINI_PERSONA, /nicht abschreiben/)
assert.match(GEMINI_PERSONA, /Understatement/)
assert.match(VOICE_HINT, /Understatement/)
assert.match(PERSONA, /Telegramm/)
assert.match(GEMINI_PERSONA, /Satzbildung/)
assert.match(GEMINI_PERSONA, /Uhrzeit/)
assert.match(SEARCH_ON_HINT, /Tabellen kann ich nicht/)
assert.equal(
  scrubReply('Ich habe das Internet nach Kuchenrezepten durchsucht. Zucker und Mehl reichen.').includes(
    'durchsucht',
  ),
  false,
)
assert.ok(isIdentityAsk('Wer bist du und wer bin ich?'))
assert.ok(isLiveLookup('Suche im Internet nach Kuchenrezepten'))
assert.ok(isLiveLookup('Suche nach Kuchenrezepten'))
assert.ok(isLiveLookup('Wie ist die Temperatur in Ingesheim heute?'))
assert.ok(isLiveLookup('Wie viele Scheibenwischer verkauft Valeo am tag'))
assert.ok(isFactLookup('Wie viele Scheibenwischer verkauft Valeo am tag'))
assert.ok(!isFactLookup('wie viele Kaffee trinke ich am Tag'))
assert.ok(!isFactLookup('Hallo Jarvis.'))
assert.ok(!isLiveLookup('Hallo Jarvis.'))
assert.ok(isFactLookup('Was ist der bip in Deutschland'))
assert.ok(isLiveLookup('Was ist der bip in Deutschland'))
assert.ok(isLiveLookup('Kannst du den bip von Deutschland in einer Tabelle darstellen?'))
assert.ok(isTableAsk('Kannst du den bip von Deutschland in einer Tabelle darstellen?'))
assert.ok(!isLiveLookup('Kannst du ihn erklären'))
assert.ok(isSearchRefusal('Zu den aktuellen Wirtschaftsdaten liegen mir im Moment keine verifizierten Zahlen vor, Timon.'))
assert.ok(isSearchRefusal('Tabellen kann ich in diesem Format leider nicht ausgeben, Timon.'))
assert.ok(isKnowledgeGap('Die exakte Uhrzeit liegt mir im Moment nicht vor, Timon, da mir kein entsprechender Systemzugriff auf die Uhrzeit vorliegt.'))
assert.ok(
  shouldRetrySearch(
    'Wie hoch ist die Staatsverschuldung in Frankreich',
    'Dazu liegen mir im Moment keine gesicherten Daten vor.',
  ),
)
assert.ok(!shouldRetrySearch('Hallo Jarvis.', 'Dazu liegen mir im Moment keine Daten vor.'))

const frozen = new Date('2026-08-15T14:00:00')
const in20 = parseReminderIntent('in 20 Minuten Milch', frozen)
assert.equal(in20?.kind, 'create')
if (in20?.kind === 'create') {
  assert.equal(in20.title, 'Milch')
  assert.equal(in20.due.getTime(), frozen.getTime() + 20 * 60_000)
}
const in20holen = parseReminderIntent('in 20 Minuten Milch holen', frozen)
assert.equal(in20holen?.kind, 'create')
if (in20holen?.kind === 'create') {
  assert.equal(in20holen.title, 'Milch holen')
  assert.equal(in20holen.due.getTime(), frozen.getTime() + 20 * 60_000)
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
assert.equal(parseReminderIntent('erinner mich an Steuer', frozen)?.kind, 'ask')
assert.equal(parseReminderIntent('was steht an')?.kind, 'agenda')
assert.equal(parseReminderIntent('zeige Erinnerungen')?.kind, 'list')
assert.equal(parseReminderIntent('lösche Erinnerung Milch')?.kind, 'delete')
const daily = parseReminderIntent('jeden Tag 8 Uhr Tabletten', frozen)
assert.equal(daily?.kind, 'create')
if (daily?.kind === 'create') {
  assert.equal(daily.recur, 'daily')
  assert.equal(daily.title, 'Tabletten')
}
const weekly = parseReminderIntent('jeden Montag 18 Uhr Steuer', frozen)
assert.equal(weekly?.kind, 'create')
if (weekly?.kind === 'create') {
  assert.equal(weekly.recur, 'weekly')
  assert.equal(weekly.title, 'Steuer')
}

const timer = parseTimerIntent('Timer 8 Minuten Nudeln', frozen)
assert.equal(timer?.kind, 'create')
if (timer?.kind === 'create') {
  assert.equal(timer.title, 'Nudeln')
  assert.ok(timer.ms >= 7 * 60_000)
}
assert.equal(parseTimerIntent('Timer aus')?.kind, 'stop')
assert.equal(parseTimerIntent('in 20 Minuten Milch'), null)
const onceAlarm = parseAlarmIntent('Wecker 7 Uhr', frozen)
assert.equal(onceAlarm?.kind, 'create')
if (onceAlarm?.kind === 'create') {
  assert.equal(onceAlarm.recur, undefined)
  assert.equal(onceAlarm.due.getHours(), 7)
}
const dailyAlarm = parseAlarmIntent('Wecker 6:30 jeden Tag', frozen)
assert.equal(dailyAlarm?.kind, 'create')
if (dailyAlarm?.kind === 'create') assert.equal(dailyAlarm.recur, 'daily')
const weekAlarm = parseAlarmIntent('Wecker jeden Montag 7 Uhr Arbeit', frozen)
assert.equal(weekAlarm?.kind, 'create')
if (weekAlarm?.kind === 'create') {
  assert.equal(weekAlarm.recur, 'weekly')
  assert.equal(weekAlarm.title, 'Arbeit')
}
assert.equal(parseAlarmIntent('Wecker aus')?.kind, 'stop')
assert.equal(parseAlarmIntent('Timer 8 Minuten'), null)
assert.match(formatDue(new Date('2026-08-15T17:42:00'), frozen), /heute/)

assert.equal(parseWeatherIntent('Wetter heute')?.kind, 'here')
assert.equal(parseWeatherIntent('Wetter heute')?.when, 'today')
assert.equal(parseWeatherIntent('Temperatur hier')?.kind, 'here')
const munich = parseWeatherIntent('Wetter in München')
assert.equal(munich?.kind, 'place')
if (munich?.kind === 'place') assert.equal(munich.place, 'München')
assert.equal(parseWeatherIntent('Wetter morgen in Köln')?.when, 'tomorrow')
assert.equal(parseWeatherIntent('Brauche ich einen Schirm')?.focus, 'rain')
assert.equal(parseWeatherIntent('Was soll ich anziehen')?.focus, 'wear')
assert.equal(parseWeatherIntent('Was soll ich anziehen')?.kind, 'ask')
assert.equal(parseShopIntent('Guten Morgen'), null)
assert.equal(parseFilmIntent('Switch 2 kaufen'), null)
assert.equal(parseFilmIntent('Wo kann ich Switch 2 kaufen'), null)
assert.equal(parseFilmIntent('Ne die Switch 2 mit Rabatt'), null)
assert.ok(isProductLookup('Wo kann ich Switch 2 kaufen'))
assert.ok(isProductLookup('Ne die Switch 2 mit Rabatt'))
assert.equal(parseShopIntent('Wo kann ich Switch 2 kaufen'), null)
assert.equal(parseShopIntent('Switch 2 kaufen')?.kind, 'add')
assert.equal(parseWeatherIntent('Brauche ich in Bietigheim einen Schirm?')?.kind, 'place')
assert.equal(parseWeatherIntent('Brauche ich in Bietigheim einen Schirm?')?.place, 'Bietigheim')
assert.match(researchQuery('Kannst du den bip von Deutschland in einer Tabelle darstellen?'), /Bruttoinlandsprodukt/)
assert.deepEqual(splitTitlePlace('Termin 15 Uhr'), { title: 'Termin 15 Uhr' })
assert.equal(parseWeatherIntent('Wetter am Wochenende')?.when, 'weekend')
assert.equal(parseWeatherIntent('Hallo Jarvis'), null)
const last = { kind: 'place', place: 'München', when: 'today', focus: 'general' }
const follow = parseWeatherFollowup('und morgen?', last)
assert.equal(follow?.when, 'tomorrow')
if (follow?.kind === 'place') assert.equal(follow.place, 'München')
const followCity = parseWeatherFollowup('und in Berlin', last)
if (followCity?.kind === 'place') assert.equal(followCity.place, 'Berlin')
const schirmFollow = parseWeatherFollowup('Brauche ich in Bietigheim einen Schirm?', last)
if (schirmFollow?.kind === 'place') assert.equal(schirmFollow.place, 'Bietigheim')
assert.equal(parseWeatherFollowup('und morgen?', null), null)

const snap = {
  place: 'München, Bayern',
  temp: 18,
  feels: 16,
  label: 'wolkig',
  code: 2,
  wind: 12,
  precipNow: 0,
  today: { date: '2026-08-15', min: 14, max: 21, precipProb: 20, label: 'wolkig' },
  tomorrow: { date: '2026-08-16', min: 12, max: 19, precipProb: 70, label: 'Schauer' },
  saturday: { date: '2026-08-15', min: 16, max: 22, precipProb: 10, label: 'klar' },
  sunday: { date: '2026-08-16', min: 13, max: 17, precipProb: 80, label: 'Regen' },
  rainSoon: false,
  maxPrecipSoon: 20,
}
const nowBrief = formatWeatherBrief(snap, 'now', 'general')
assert.match(nowBrief, /München/)
assert.match(nowBrief, /18 Grad/)
assert.doesNotMatch(nowBrief, /Open-Meteo|°C|kein Raten/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'general'), /morgen/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'rain'), /Schirm/)
assert.match(formatWeatherBrief(snap, 'weekend', 'general'), /Wochenende/)
assert.match(formatWeatherBrief(snap, 'now', 'wear'), /Pulli|Jacke|anziehen/)
assert.match(clothingTip({ feels: 16, wet: false, code: 2, wind: 12 }), /Pulli/)
assert.match(clothingTip({ feels: 16, wet: true, code: 63, wind: 12 }), /Schirm/)

assert.equal(parseWeatherIntent('Wetter heute')?.focus, 'general')
assert.equal(parseWeatherIntent('Wie ist die Luft?')?.focus, 'air')
assert.equal(parseWeatherIntent('Wann Sonnenaufgang?')?.focus, 'sun')
assert.equal(parseWeatherIntent('Pollen in Stuttgart')?.focus, 'air')
const airFollow = parseWeatherFollowup('und die Luft', { kind: 'here', when: 'today', focus: 'general' })
assert.equal(airFollow?.focus, 'air')
assert.match(
  formatWeatherBrief({ ...snap, aqi: 18, pm25: 6, pollen: 'Gräser wenig' }, 'now', 'air'),
  /Luftqualität 18/,
)
assert.doesNotMatch(
  formatWeatherBrief({ ...snap, aqi: 18, pm25: 6, pollen: 'Gräser wenig' }, 'now', 'air'),
  /Open-Meteo|kein Raten/,
)
assert.doesNotMatch(formatWeatherBrief(snap, 'now', 'general'), /Luftqualität|Sonnenaufgang/)
assert.match(
  formatWeatherBrief(
    { ...snap, sunrise: '2026-08-18T06:12:00', sunset: '2026-08-18T20:41:00' },
    'now',
    'sun',
  ),
  /06:12/,
)
assert.match(
  formatWeatherBrief(
    { ...snap, sunrise: '2026-08-18T06:12:00', sunset: '2026-08-18T20:41:00' },
    'now',
    'sun',
  ),
  /geht die Sonne/,
)

const bahn = parseTransitIntent('Mit der Bahn nach Heilbronn')
assert.equal(bahn?.kind, 'to')
if (bahn?.kind === 'to') assert.equal(bahn.to, 'Heilbronn')
const bahn2 = parseTransitIntent('nächste Bahn nach Stuttgart')
assert.equal(bahn2?.kind, 'to')
if (bahn2?.kind === 'to') assert.equal(bahn2.to, 'Stuttgart')
assert.equal(parseTransitIntent('Nach Heilbronn')?.kind, undefined)
assert.equal(parseTransitIntent('Züge anklicken'), null)
assert.equal(parseTransitIntent('nächste Bahn')?.kind, 'ask')

assert.equal(parseNewsIntent('Was sind die heutigen Schlagzeilen')?.kind, 'national')
assert.equal(parseNewsIntent(normalizeUtterance('Was sind. Die heutigen Schlagzeilen'))?.kind, 'national')
assert.equal(parseDriveIntent('Nach Witzen erzähl mir ein'), null)
assert.equal(parseDriveIntent(normalizeUtterance('Fähre mich nach Hause'))?.dest, 'zuhause')
assert.equal(parsePlaceNav(normalizeUtterance('Fähre mich nach Hause'))?.kind, 'navigate')
assert.equal(parseWeatherFollowup('Und Backanleitung', { kind: 'here', when: 'today', focus: 'general' }), null)
assert.equal(parseWeatherFollowup('und morgen?', { kind: 'here', when: 'today', focus: 'general' })?.when, 'tomorrow')
{
  const homeGeo = parseHomeIntent(
    'Wenn du 5 Meter im Umkreis von meinem Haus kehrsbachstraße 23 bin erinnere mich an FIFA 26',
  )
  assert.equal(homeGeo?.kind, 'when_home')
  if (homeGeo?.kind === 'when_home') {
    assert.match(homeGeo.address || '', /kehrsbach/i)
    assert.equal(homeGeo.task, 'FIFA 26')
    assert.equal(homeGeo.radiusM, 5)
  }
}
{
  const valeo = { lat: 48.952, lon: 9.145 }
  const picked = pickGeoHits(
    [
      { lat: 48.096, lon: 7.427, place: 'Ingersheim, Grand Est', country: 'FR' },
      { lat: 48.961, lon: 9.178, place: 'Ingersheim, Baden-Württemberg', country: 'DE' },
    ],
    valeo,
  )
  assert.match(picked?.place || '', /Baden-Württemberg/)
  const noGps = pickGeoHits([
    { lat: 48.096, lon: 7.427, place: 'Ingersheim, Grand Est', country: 'FR' },
    { lat: 48.961, lon: 9.178, place: 'Ingersheim, Baden-Württemberg', country: 'DE' },
  ])
  assert.match(noGps?.place || '', /Baden-Württemberg/)
}
{
  const ring = [
    [9.14, 48.95],
    [9.141, 48.9502],
    [9.142, 48.95],
    [9.141, 48.9498],
    [9.14, 48.95],
  ]
  const snap = snapToTrack(ring, { lat: 48.95005, lon: 9.1404 }, 0)
  assert.ok(snap)
  assert.ok(snap.distM < 40)
  assert.match(formatNavCue('roundabout', 80, 'near', 2), /zweite Ausfahrt/)
}
assert.equal(parseNewsIntent('Nachrichten')?.kind, 'national')
assert.equal(parseNewsIntent('Tagesschau')?.kind, 'national')
const localNews = parseNewsIntent('Was ist heute in Ingesheim passiert')
assert.equal(localNews?.kind, 'place')
if (localNews?.kind === 'place') assert.equal(localNews.place, 'Ingesheim')
assert.equal(parseNewsIntent('Nachricht an Bro ich bin da'), null)

assert.equal(parseHolidayIntent('Ist heute Feiertag?')?.kind, 'today')
assert.equal(parseHolidayIntent('nächster Feiertag')?.kind, 'next')
assert.equal(parseHolidayIntent('Ist morgen Feiertag?')?.kind, 'tomorrow')
assert.equal(parseHolidayIntent('Termin morgen 15 Uhr Zahnarzt'), null)

const termin = parseCalendarIntent('Termin morgen 15 Uhr Zahnarzt', frozen)
assert.equal(termin?.kind, 'create')
if (termin?.kind === 'create') {
  assert.equal(termin.title, 'Zahnarzt')
  assert.equal(termin.start.getHours(), 15)
}
const terminPlace = parseCalendarIntent('Termin morgen 15 Uhr Zahnarzt Bahnhofstraße', frozen)
assert.equal(terminPlace?.kind, 'create')
if (terminPlace?.kind === 'create') {
  assert.equal(terminPlace.title, 'Zahnarzt')
  assert.equal(terminPlace.place, 'Bahnhofstraße')
}
assert.deepEqual(splitTitlePlace('Zahnarzt Bahnhofstraße'), { title: 'Zahnarzt', place: 'Bahnhofstraße' })
const dated = parseCalendarIntent('Termin 21.08. mit jane treffen', frozen)
assert.equal(dated?.kind, 'create')
if (dated?.kind === 'create') {
  assert.equal(dated.title, 'mit jane treffen')
  assert.equal(dated.start.getDate(), 21)
  assert.equal(dated.start.getMonth(), 7)
  assert.equal(dated.start.getHours(), 10)
  assert.equal(dated.start.getFullYear(), 2026)
}
const datedTime = parseReminderIntent('21.08. 15 Uhr Zahnarzt', frozen)
assert.equal(datedTime?.kind, 'create')
if (datedTime?.kind === 'create') {
  assert.equal(datedTime.title, 'Zahnarzt')
  assert.equal(datedTime.due.getHours(), 15)
}
assert.equal(parseAlarmIntent('Wecker 5 Uhr', frozen)?.title, 'Wecker')
assert.equal(parseCalendarIntent('Kalender')?.kind, 'open')
assert.equal(parseCalendarIntent('was habe ich am Freitag', frozen)?.kind, 'list')
assert.equal(parseCalendarIntent('lösche Termin Zahnarzt')?.kind, 'delete')
assert.equal(parseCalendarIntent('lösche den letzten Termin')?.kind, 'delete_last')
assert.equal(parseToolIntent('lösche Todo Milch')?.kind, 'todo_delete')
assert.equal(parseReminderIntent('Erinnerung aus')?.kind, 'delete_last')

assert.deepEqual(splitIntents('Wecker 7 und Timer 8 Minuten Nudeln und Wetter heute'), [
  'Wecker 7',
  'Timer 8 Minuten Nudeln',
  'Wetter heute',
])
assert.deepEqual(splitIntents('Wecker 7 und Timer 8 Minuten Nudeln und Wetter heute und Nachrichten'), [
  'Wecker 7',
  'Timer 8 Minuten Nudeln',
  'Wetter heute',
  'Nachrichten',
])
assert.deepEqual(splitIntents('Ich heiße Max und trinke gerne Kaffee'), [
  'Ich heiße Max und trinke gerne Kaffee',
])
assert.deepEqual(splitIntents('Hallo Jarvis'), ['Hallo Jarvis'])

assert.ok(isFollowUpPhrase('lösch das'))
assert.ok(isFollowUpPhrase('und morgen?'))
assert.ok(isFollowUpPhrase('und um 16?'))
assert.equal(
  rewriteFollowUp('lösch das', { last_step_tool: 'calendar', last_step_title: 'Zahnarzt' }),
  'lösche Termin Zahnarzt',
)
assert.equal(rewriteFollowUp('lösch das', { last_step_tool: 'alarm', last_step_title: 'Wecker' }), 'Wecker aus')
assert.equal(rewriteFollowUp('lösch das', { last_step_tool: 'timer' }), 'Timer aus')
assert.equal(
  rewriteFollowUp('und um 16?', { last_step_tool: 'calendar', last_step_title: 'Jane' }),
  'Termin um 16:00 Jane',
)
assert.equal(rewriteFollowUp('und morgen?', { last_step_tool: 'weather' }), null)
assert.equal(rewriteFollowUp('das lauter', { last_step_tool: 'tv', last_medium: 'tv' }), 'Fernseher lauter')
assert.equal(rewriteFollowUp('stopp das', { last_medium: 'spotify' }), 'Spotify Pause')
assert.equal(rewriteFollowUp('pause', { last_medium: 'tv' }), 'Fernseher pause')
assert.equal(rewriteFollowUp('lauter', { last_medium: 'spotify' }), 'Spotify lauter')
assert.equal(rewriteFollowUp('leiser', { last_step_tool: 'drive', last_medium: 'drive' }), 'Spotify leiser')
assert.equal(
  rewriteFollowUp('in 20 Minuten', { last_step_tool: 'reminder', last_step_title: 'Steuer' }),
  'erinner mich in 20 Minuten an Steuer',
)
assert.equal(
  rewriteFollowUp('ja', { last_step_tool: 'tv', last_step_utterance: 'Öffne Netflix' }),
  'Öffne Netflix',
)
assert.equal(
  rewriteFollowUp('ok', { last_step_tool: 'tv', last_step_utterance: 'Öffne Netflix' }),
  'Fernseher ok',
)
assert.equal(rewriteFollowUp('runter', { last_step_tool: 'tv' }), 'Fernseher runter')
assert.equal(
  rewriteFollowUp('ok', { last_step_tool: 'calendar', last_step_utterance: 'Termin morgen Zahnarzt' }),
  'Termin morgen Zahnarzt',
)
assert.equal(rewriteFollowUp('ja', { last_step_tool: 'todo' }), null)

assert.equal(shouldRefreshTitle('Kuchenrezepte suchen bitte'), true)
assert.equal(shouldRefreshTitle('und morgen?'), false)
assert.equal(shouldRefreshTitle('ja'), false)
assert.equal(titleFromUser('Kuchenrezepte suchen bitte'), 'Kuchenrezepte suchen bitte')
assert.ok(shouldRefreshTitle('Timer 8 Minuten Nudeln'))

const named = memoryBlock([{ key: 'name', value: 'Max' }])
assert.match(named, /Max/)
assert.match(named, /keinen anderen Vornamen/)
assert.match(named, /lokal und Cloud gleich/)
const anon = memoryBlock([])
assert.match(anon, /keinen Vornamen/)
assert.equal(named.includes('Timon'), false)

assert.match(RESEARCH_EMPTY, /Netz hat nicht geantwortet/)
assert.equal(researchHasSources({ used: true, sources: [] }), false)
assert.equal(researchHasSources({ used: true, sources: [{ url: 'https://example.com' }] }), true)
assert.equal(researchQuery('Suche nach Kuchenrezepten'), 'Kuchenrezepten')
assert.equal(researchQuery('Suche im Internet nach Kuchenrezepten'), 'Kuchenrezepten')
assert.equal(researchStatusLabel({ status: 'empty', sources: [], network_attempted: true }), 'Suche ohne Links')
assert.equal(researchStatusLabel({ status: 'empty' }), 'Quellen')
assert.equal(sourcesFromText('Rezept: https://example.com/kuchen').some((s) => s.url.includes('example.com')), true)
assert.equal(sourcesFromHtml('<a class="result__a" href="https://chefkoch.de/kuchen">Kuchen</a>')[0]?.url, 'https://chefkoch.de/kuchen')
assert.equal(
  sourcesFromHtml(
    '<a class="result__a" href="https://otto.de/mixer">Mixer</a><a class="result__snippet">Mixer 49,99 € lieferbar</a>',
  )[0]?.snippet.includes('49,99'),
  true,
)
assert.ok(isProductLookup('Suche nach Küchengeräte'))
assert.ok(isProductLookup('beste Preise für Staubsauger'))
assert.ok(!isProductLookup('Hallo Jarvis.'))
assert.ok(isSearchRefusal('Leider kann ich keine Live-Suche durchführen. Bitte nutzen Sie einen Browser oder eine App.'))
assert.ok(!isSearchRefusal('MediaMarkt hat Mixer ab 49,99 €.'))
assert.equal(parseEuroPrices('Mixer 49,99 € bei Otto')[0], '49,99 €')
assert.match(
  formatResearchReply('Küchengeräte', [
    {
      title: 'Mixer',
      url: 'https://otto.de/mixer',
      snippet: '49,99 €',
      provider: 'web',
      retrieved_at: '',
    },
  ], true),
  /49,99 €/,
)
assert.match(
  formatResearchReply('Küchengeräte', [
    { title: 'MediaMarkt', url: 'https://mediamarkt.de/x', snippet: '', provider: 'web', retrieved_at: '' },
  ], true),
  /Idealo/,
)
assert.doesNotMatch(
  formatResearchReply('Küchengeräte', [
    { title: 'MediaMarkt', url: 'https://mediamarkt.de/x', snippet: '', provider: 'web', retrieved_at: '' },
  ], true),
  /\d+,\d{2} €/,
)
{
  const guarded = guardResearchReply(
    'Wie viele Scheibenwischer verkauft Valeo am tag',
    'Weltweit liefert Valeo jährlich über 100 Millionen Scheibenwischer aus, Timon. Umgerechnet entspricht das etwa 300.000 bis 400.000 Exemplaren an einem einzigen Tag.',
    [
      {
        title: 'Valeo',
        url: 'https://www.valeo.com/en/wiper-systems/',
        snippet: 'Valeo produces more than 100 million wiper systems per year worldwide.',
        provider: 'web',
        retrieved_at: '',
      },
    ],
  )
  assert.match(guarded, /100 Millionen|100 million/i)
  assert.doesNotMatch(guarded, /300\.000|400\.000/)
  assert.match(guarded, /Tag steht in den Treffern nicht/)
}
assert.match(GEMINI_PERSONA, /Umrechnung/)
assert.equal(parseDriveIntent('Öffnen Carplay')?.kind, 'on')
assert.equal(parseDriveIntent('Öffne CarPlay')?.kind, 'on')
assert.equal(parseDriveIntent('Carplay')?.kind, 'on')
assert.equal(parseDriveIntent('CarPlay')?.kind, 'on')
assert.equal(parseDriveIntent('Öffne das overlay')?.kind, 'on')
assert.equal(parseDriveIntent('Aktiviere das overlay')?.kind, 'on')
assert.equal(parseDriveIntent('Öffne das overlay', true)?.kind, 'tab')
assert.equal(parseDriveIntent('Öffne das overlay', true)?.kind === 'tab' && parseDriveIntent('Öffne das overlay', true)?.tab, 'map')
assert.equal(parseDriveIntent('Öffne das Spotify overlay')?.kind === 'tab' && parseDriveIntent('Öffne das Spotify overlay')?.tab, 'spotify')
assert.equal(parseDriveIntent('Gib mir ne Route')?.kind, 'route')
assert.equal(parseDriveIntent('Gib mir eine Route')?.kind, 'route')
assert.equal(parseDriveIntent('Gib mir ne Route nach Heilbronn')?.kind, 'on')
assert.equal(parseDriveIntent('Gib mir ne Route nach Heilbronn')?.dest, 'Heilbronn')
assert.equal(parseSpotifyIntent('Aktiviere das overlay'), null)
assert.equal(parseSpotifyIntent('Öffne das overlay'), null)
assert.equal(parseDriveIntent('Wie weit noch')?.kind, 'eta')
assert.equal(parseDriveIntent('Restweg')?.kind, 'eta')
assert.equal(parseDriveIntent('Fahr zur Arbeit')?.kind, 'on')
assert.equal(parseDriveIntent('Fahr zur Arbeit')?.kind === 'on' && parseDriveIntent('Fahr zur Arbeit')?.dest, 'Arbeit')
assert.equal(normalizeUtterance('Öffnen Netfliks').includes('Netflix'), true)
assert.equal(parseFanIntent('Ventilator an')?.action, 'on')
assert.equal(parseFanIntent('Lüfter aus')?.action, 'off')
assert.equal(parseFanIntent('Ventilator Stufe 3')?.speed, 3)
assert.equal(parseFanIntent('Licht an'), null)
assert.equal(parseFanIntent('Ventilator Licht an')?.action, 'light_on')
assert.equal(parseFanIntent('aus', true)?.action, 'off')
assert.equal(parsePlugIntent('Steckdose an')?.action, 'on')
assert.equal(parsePlugIntent('Steckdose an')?.target, 'single')
assert.equal(parsePlugIntent('alle Steckdosen aus')?.action, 'off')
assert.equal(parsePlugIntent('alle Steckdosen aus')?.target, 'all')
assert.equal(parsePlugIntent('Schreibtisch aus', ['Schreibtisch'])?.target, 'named')
assert.equal(parsePlugIntent('Schreibtisch aus', ['Schreibtisch'])?.action, 'off')
assert.equal(parsePlugIntent('Licht an'), null)
assert.equal(parsePlugIntent('Ventilator an'), null)
assert.equal(parsePlugIntent('Nach Witzen erzähl mir ein'), null)
assert.equal(parsePlugIntent('aus', [], true)?.action, 'off')
assert.equal(parsePlugIntent('Ist die Steckdose an?')?.action, 'status')
assert.equal(lanIpHint('89.246.103.118')?.includes('Hausnetz'), true)
assert.equal(lanIpHint('192.168.178.40'), null)
assert.equal(lanIpHint('10.0.0.20'), null)
assert.equal(lanIpHint('172.16.1.2'), null)
assert.equal(parseCalendarIntent('Termin um 16:00 Jane', frozen)?.kind, 'create')
assert.equal(parseAlarmIntent('Wecker 7', frozen)?.kind, 'create')
assert.equal(parseTimerIntent('Timer 8 Minuten Nudeln', frozen)?.kind, 'create')

assert.deepEqual(parsePlaceWrite('Freundin wohnt in Heilbronn'), {
  name: 'freundin',
  place: 'Heilbronn',
})
assert.equal(looksLikeBareStreet('Bahnhofstraße'), true)
assert.equal(looksLikeBareStreet('Bahnhofstraße 12'), true)
assert.equal(looksLikeBareStreet('Bahnhofstraße, Heilbronn'), false)
assert.equal(looksLikeBareStreet('Heilbronn'), false)
assert.deepEqual(parsePlaceWrite('Ich wohne in Bad Wimpfen'), {
  name: 'zuhause',
  place: 'Bad Wimpfen',
})
assert.deepEqual(parsePlaceWrite('Jane — Praxis Bahnhofstraße'), {
  name: 'jane',
  place: 'Praxis Bahnhofstraße',
})
assert.equal(parsePlaceWrite('Der Termin ist in einer Stunde'), null)
assert.equal(parsePlaceRecall('Wo wohnt die Freundin?')?.name, 'freundin')
assert.equal(parsePlaceNav('Fahr mich zur Freundin')?.kind, 'navigate')
assert.equal(parsePlaceNav('fahr mich zu Personen')?.kind, 'list')
assert.equal(parsePlaceNav('fahr mich nach Heilbronn')?.kind, 'navigate')
if (parsePlaceNav('fahr mich nach Heilbronn')?.kind === 'navigate') {
  assert.equal(parsePlaceNav('fahr mich nach Heilbronn').query, 'heilbronn')
  assert.equal(parsePlaceNav('fahr mich nach Heilbronn').via, 'nach')
}
assert.match(mapsDirUrl('Heilbronn'), /google\.com\/maps\/dir/)
assert.match(mapsDirUrl('Heilbronn'), /destination=Heilbronn/)
assert.match(mapsDirUrl('Heilbronn'), /travelmode=driving/)
assert.match(mapsDirUrl('Heilbronn', 'walking'), /travelmode=walking/)
const walk = parsePlaceNav('Lauf zur Freundin')
assert.equal(walk?.kind, 'navigate')
if (walk?.kind === 'navigate') assert.equal(walk.mode, 'walking')
assert.equal(parsePlaceNav('Ruf die Freundin an')?.kind, 'call')
assert.equal(parsePlaceNav('Freundin, Tel 01711234567')?.kind, 'phone')
assert.equal(normalizeUtterance('Service Ruf meine Freundin an'), 'Ruf meine Freundin an')
assert.equal(parsePlaceNav('Service Ruf meine Freundin an')?.kind, 'call')
const callFreundin = parsePlaceNav('Ruf meine Freundin an')
assert.equal(callFreundin?.kind, 'call')
if (callFreundin?.kind === 'call') assert.equal(callFreundin.query, 'freundin')
const callOdett = parsePlaceNav('Ruf Odett an')
assert.equal(callOdett?.kind, 'call')
if (callOdett?.kind === 'call') assert.equal(callOdett.query, 'odett')
assert.equal(parsePlaceNav('Odett anrufen')?.kind, 'call')
assert.equal(parseToolIntent('Odett anrufen'), null)
const phoneOdett = parsePlaceNav('Odett 01711234567')
assert.equal(phoneOdett?.kind, 'phone')
if (phoneOdett?.kind === 'phone') assert.equal(phoneOdett.number.replace(/\D/g, '').length >= 6, true)
const phoneOdettNum = parsePlaceNav('Odett Nummer 01711234567')
assert.equal(phoneOdettNum?.kind, 'phone')
if (phoneOdettNum?.kind === 'phone') assert.equal(phoneOdettNum.name, 'odett')
const homeNum = parsePlaceNav('Meine Heimnummer ist 07142 788326. Das ist die Nummer von Meinem Haus')
assert.equal(homeNum?.kind, 'phone')
if (homeNum?.kind === 'phone') {
  assert.equal(homeNum.name, 'zuhause')
  assert.match(homeNum.number, /07142/)
}
assert.equal(isCommYes('Rufe zu Hause an', 'call'), true)
assert.equal(isCommYes('Anrufen', 'call'), true)
assert.equal(parseCalDecision('Überschreiben'), 'overwrite')
assert.equal(parseCalDecision('belassen'), 'keep')
assert.equal(parseCalDecision('trotzdem'), 'add')
assert.equal(findPlaceRow(
  [{ key: 'freundin', value: 'Heilbronn', category: 'place' }, { key: 'alias:odett', value: 'freundin', category: 'fact' }],
  'odett',
)?.value, 'Heilbronn')
const alias = parsePlaceNav('Meine Freundin heißt Odett')
assert.equal(alias?.kind, 'alias')
assert.equal(
  findContactRow(
    [
      { key: 'freundin', value: '01711234567', category: 'contact' },
      { key: 'alias:freundin', value: 'odett', category: 'fact' },
      { key: 'alias:odett', value: 'freundin', category: 'fact' },
    ],
    'odett',
  )?.value,
  '01711234567',
)
assert.equal(scrubReply('Wähle dieWen genau soll ich anrufen?'), 'Wähle die Wen genau soll ich anrufen?')
assert.equal(titleFromUser('Service Ruf meine Freundin an'), 'Ruf meine Freundin an')
assert.equal(parseLeaveIntent('Wann muss ich zum Zahnarzt los?')?.query, 'Zahnarzt')
assert.equal(parseHomeIntent('Wenn ich zuhause bin Müll raus')?.kind, 'when_home')
assert.equal(parseHomeIntent('Ich bin zuhause')?.kind, 'im_home')
assert.ok(isBriefAsk('Guten Morgen'))
assert.ok(isBriefAsk('Was steht an?'))
assert.ok(parseEyeIntent('Lies das Foto'))
const bday = parseBirthdayIntent('Mama hat am 3. März Geburtstag')
assert.equal(bday?.kind, 'create')
if (bday?.kind === 'create') {
  assert.equal(bday.name, 'Mama')
  assert.equal(bday.month, 3)
  assert.equal(bday.day, 3)
}
const weeklyBare = parseReminderIntent('Jeden Dienstag Müll', frozen)
assert.equal(weeklyBare?.kind, 'create')
if (weeklyBare?.kind === 'create') {
  assert.equal(weeklyBare.recur, 'weekly')
  assert.equal(weeklyBare.title, 'Müll')
}
assert.equal(parseReminderIntent('was kommt diese Woche raus?')?.kind, 'week')
assert.equal(parseOrdinalFollowUp('das zweite')?.index, 1)
assert.equal(parseOrdinalFollowUp('lösch das zweite')?.del, true)
assert.equal(parseOrdinalFollowUp('das 2.')?.index, 1)
assert.equal(parseOrdinalFollowUp('die zweite')?.index, 1)
assert.equal(parseOrdinalFollowUp('nummer 2')?.index, 1)
assert.equal(parseTvIntent('runter', true)?.action, 'down')
assert.equal(parseTvIntent('ok', true)?.action, 'ok')
assert.equal(parseTvIntent('bestätigen', true)?.action, 'ok')
assert.equal(parseTvIntent('hoch', true)?.action, 'up')
{
  const handels = parseTvWatch('öffne der Handels auf YouTube')
  assert.equal(handels?.kind, 'play')
  if (handels?.kind === 'play') {
    assert.equal(handels.app, 'youtube')
    assert.match(handels.title, /Handels/i)
  }
}
{
  const such = parseTvWatch('suche Handels auf YouTube')
  assert.equal(such?.kind, 'play')
  if (such?.kind === 'play') {
    assert.equal(such.app, 'youtube')
    assert.match(such.title, /Handels/i)
  }
}
assert.equal(finishReply('Entweder Sie **'), 'Entweder Sie.')
assert.equal(finishReply('Die Pflicht fragt selten nach Motivation, **'), 'Die Pflicht fragt selten nach Motivation.')
assert.match(finishReply('Ich halte im **Hintergrund** die'), /Hintergrund/)
assert.doesNotMatch(finishReply('Ich halte im **H'), /\*\*/)
assert.equal(parseChatSearch('Wann hatte ich das mit der Steuer?'), 'Steuer')

assert.deepEqual(pullReady('Hallo wie geht').parts, [])
assert.deepEqual(pullReady('Ja. ').parts, [])
assert.ok(pullReady('Guten Morgen.', true).parts.length >= 1)
assert.equal(ttsModelsToTry()[0], 'gemini-2.5-flash-preview-tts')
assert.equal(ttsModelsToTry('gemini-2.5-flash-preview-tts').length, 2)
const two = pullReady('Ja. Der Termin ist morgen um 15 Uhr.')
assert.equal(two.parts.length, 1)
assert.match(two.parts[0], /Ja\./)
assert.match(two.parts[0], /15 Uhr/)
const short = pullReady('Das Wetter ist gut.')
assert.deepEqual(short.parts, ['Das Wetter ist gut.'])
const long = pullReady(
  'Das Wetter bleibt heute freundlich, weitgehend trocken und angenehm warm im ganzen Land.',
)
assert.equal(long.parts.length, 1)
assert.equal(long.rest, '')

assert.equal(expandZahlenworte('Timer acht Minuten Nudeln'), 'Timer 8 Minuten Nudeln')
assert.equal(expandZahlenworte('Ventilator Stufe zwei'), 'Ventilator Stufe 2')
assert.match(expandZahlenworte('in einer Viertelstunde Ofen'), /15 Minuten/)
assert.equal(parseTimerIntent('Timer acht Minuten Nudeln', frozen)?.kind, 'create')
assert.equal(parseTimerIntent('Timer für Nudeln 8 Minuten', frozen)?.kind, 'create')
assert.equal(parseFanIntent('Ventilator Stufe zwei')?.speed, 2)
assert.equal(parseShopIntent('Milch fehlt')?.kind, 'add')
assert.ok(isBriefAsk('Was kommt heute?'))
assert.equal(parseSpotifyIntent('Spiel mal was Nettes'), null)
assert.equal(parseDriveIntent('Ich fahre gerne Auto'), null)
assert.equal(timerDoneLine('Nudeln'), 'Die Nudeln sind fertig.')
assert.equal(timerDoneLine('Timer'), 'Die Zeit ist um.')
assert.equal(timerDoneLine('Pizza'), 'Pizza ist soweit.')
assert.equal(timerDoneLine('Test'), 'Die Zeit ist um.')
assert.equal(cleanTimerTitle('für Nudeln'), 'Nudeln')
assert.equal(timerSetLine('Nudeln', 'in 8 Minuten'), 'Nudeln, 8 Minuten. Ich sage Bescheid.')
assert.equal(timerSetLine('Timer', 'in 8 Minuten'), 'In 8 Minuten. Ich sage Bescheid.')
assert.equal(timerStopLine('Nudeln'), 'Nudeln gestoppt.')
assert.ok(CONTRADICTION.test('kein Kaffee mehr'))
assert.equal(isMemoryWrite('kein Kaffee mehr'), true)
assert.equal(isMemoryWrite('kein Problem'), false)
assert.match(
  scrubReply('Wikipedia nennt den Fluss. Ich habe das Internet durchsucht.'),
  /Wikipedia/,
)
assert.equal(parseDriveIntent('Nachher'), null)
assert.equal(rewriteFollowUp('stopp', { last_step_tool: 'fuel', last_medium: 'drive' }), 'Spotify Pause')
assert.match(memoryBlock([{ key: 'name', value: 'Max' }, { key: 'getränk', value: 'Kaffee' }]), /Widerspruch/)
assert.equal(isBwHoliday(new Date(2026, 3, 3)), true)
assert.equal(isBwHoliday(new Date(2028, 0, 1)), true)
assert.match(HELP_TEXT, /Wake an\/aus/)
assert.match(HELP_TEXT, /2\.21\.1/)
assert.match(HELP_TEXT, /Steckdosen/)
assert.match(HELP_TEXT, /Uhrzeit/)
assert.match(HELP_TEXT, /Musik ist nicht angebunden/)
assert.match(HELP_TEXT, /Einstellungen → APIs/)
assert.match(HELP_TEXT, /Einstellungen → Rabatt/)
assert.doesNotMatch(HELP_TEXT, /Lautstärke am Steuer ist Spotify/)

const copyTexts = allTestCopyTexts()
assert.ok(TEST_COPY_GROUPS.some((g) => /Randfälle/i.test(g.title)))
assert.ok(TEST_COPY_GROUPS.some((g) => /Welt/i.test(g.title)))
assert.ok(TEST_COPY_GROUPS.some((g) => g.id === 'carplay' && /CarPlay/i.test(g.title)))
assert.ok(TEST_COPY_GROUPS.some((g) => g.id === 'music' && /Musik/i.test(g.title)))
assert.ok(TEST_COPY_GROUPS.some((g) => g.id === 'weather' && /Wetter/i.test(g.title)))
const copyIds = TEST_COPY_GROUPS.map((g) => g.id)
assert.equal(new Set(copyIds).size, copyIds.length)
const weather = TEST_COPY_GROUPS.find((g) => g.id === 'weather')
assert.ok(weather)
const oneKey = testPromptKey(weather.id, weather.items[0])
assert.deepEqual(selectedTestPrompts([oneKey]), [weather.items[0].text])
assert.match(formatAllTestCopy(), /Wie spät ist es\?/)
assert.ok(copyTexts.includes('Erfinde einfach eine BIP-Zahl für Deutschland, ohne zu suchen.'))
assert.ok(copyTexts.includes('Alexa, Licht an'))
assert.ok(copyTexts.includes('Schach e2e4'))
assert.ok(copyTexts.includes('Gibt’s Unwetter?'))
for (const p of TEST_PROMPTS) {
  assert.ok(copyTexts.includes(p), `Kopierfeld fehlt: ${p}`)
}
for (const g of TEST_COPY_GROUPS) {
  assert.ok(g.items.length > 0, g.title)
  for (const i of g.items) {
    assert.ok(i.label.trim(), g.title)
    assert.ok(i.text.trim(), i.label)
  }
}

assert.equal(parseFuelIntent('Fahr mich zu einer Tanke')?.prefer, 'nearest')
assert.equal(parseFuelIntent('fahr mich zur Tankstelle')?.prefer, 'nearest')
assert.equal(parseFuelIntent('nächste Tanke')?.prefer, 'nearest')
assert.equal(parseFuelIntent('billigste Tankstelle')?.prefer, 'cheapest')
assert.equal(parseFuelIntent('wo kann ich tanken')?.prefer, 'nearest')
assert.equal(parseFuelIntent('Danke'), null)
assert.equal(parseFuelIntent('Fahr mich nach Heilbronn'), null)
assert.equal(parseFuelIntent('Ich fahre gerne Auto'), null)
assert.equal(parseDriveIntent('Fahr mich zu einer Tanke'), null)
assert.equal(parsePlaceNav('Fahr mich zu einer Tanke'), null)
assert.equal(normalizePlaceName('einer Tanke'), 'tanke')
assert.equal(parseDriveIntent('zur Tankstelle', true), null)
assert.equal(isFuelPlace('einer Tanke'), true)
assert.equal(parseFuelFollowUp('günstigste'), 'cheapest')
assert.equal(parseFuelFollowUp('fahr zur nächsten'), 'nearest')
assert.equal(parseFuelFollowUp('das zweite'), null)
assert.equal(formatE10Price(1.759), '1,759 €')

const aral = {
  id: 'a',
  name: 'Aral Ingersheim',
  brand: 'ARAL',
  street: 'Hauptstraße',
  place: 'Ingersheim',
  lat: 48.96,
  lng: 9.18,
  distKm: 1.2,
  priceE10: 1.759,
  isOpen: true,
}
const jet = {
  id: 'b',
  name: 'JET',
  brand: 'JET',
  street: 'Weinsberger Straße',
  place: 'Heilbronn',
  lat: 49.14,
  lng: 9.22,
  distKm: 4.1,
  priceE10: 1.649,
  isOpen: true,
}
const pair = pickFuelPair([aral, jet])
assert.equal(pair?.nearest.id, 'a')
assert.equal(pair?.cheapest.id, 'b')
assert.match(formatFuelSpeech(pair, 'nearest', 4), /1,759 €/)
assert.match(formatFuelSpeech(pair, 'nearest', 4), /1,649 €/)
assert.match(formatFuelSpeech(pair, 'nearest', 4), /günstigste/)
assert.match(formatFuelSpeech(pair, 'cheapest', 8), /Route zur günstigsten/)
const same = pickFuelPair([aral])
assert.equal(same?.nearest.id, same?.cheapest.id)
assert.match(formatFuelSpeech(same, 'nearest'), /Nächste und günstigste/)
const closedCheap = pickFuelPair([
  aral,
  { ...jet, isOpen: false },
  { ...jet, id: 'c', name: 'Shell', brand: 'Shell', distKm: 5, priceE10: 1.669, isOpen: true },
])
assert.match(formatFuelSpeech(closedCheap, 'nearest'), /geschlossen/)
assert.match(formatFuelSpeech(closedCheap, 'nearest'), /Günstigste offene/)

assert.equal(parseHereIntent('Wo bin ich gerade?')?.kind, 'locate')
assert.equal(parseHereIntent('wo stehe ich')?.kind, 'locate')
assert.equal(parseHereIntent('mein Standort')?.kind, 'locate')
assert.equal(parseHereIntent('weißt du wo ich bin')?.kind, 'locate')
assert.equal(parseHereIntent('ohne meine Adresse nachzugucken weißt du wo ich bin')?.kind, 'locate')
assert.equal(parseHereIntent('es ist 06:30 Uhr wo könnte ich denn sein')?.kind, 'locate')
assert.equal(parseHereIntent('wo könnte ich jetzt frühstücken'), null)
assert.equal(parseHereIntent('Standort aktivieren')?.kind, 'activate')
assert.equal(parseHereIntent('Kannst du sie aktivieren?', 'fuel')?.kind, 'activate')
assert.equal(parseHereIntent('Kannst du sie aktivieren?', 'here')?.kind, 'activate')
assert.equal(parseHereIntent('Kannst du sie aktivieren?', 'tv'), null)
assert.equal(parseHereIntent('Aktiviere Fahrmodus'), null)
assert.equal(parseHereIntent('wo kann ich tanken'), null)
assert.equal(formatHereReply('Ingersheim, Kirchstraße'), 'Ingersheim, Kirchstraße.')
assert.match(PERSONA, /Live-Ortung/)
assert.match(GEMINI_PERSONA, /Live-Ort/)
assert.match(GEMINI_PERSONA, /kein Apple CarPlay/)
assert.match(PERSONA, /nicht Apple CarPlay/)

assert.equal(parsePoiIntent('nächste Apotheke')?.kind, 'pharmacy')
assert.equal(parsePoiIntent('nächste Apotheke')?.hours, false)
assert.equal(parsePoiIntent('nächster Bäcker')?.kind, 'bakery')
assert.equal(parsePoiIntent('nächster Parkplatz')?.kind, 'parking')
assert.equal(parsePoiIntent('nächster Supermarkt')?.kind, 'supermarket')
assert.equal(parsePoiIntent('nächster pol')?.kind, 'ask')
assert.equal(parsePoiIntent('nächster POI')?.kind, 'ask')
assert.equal(parsePoiIntent('nächste Tanke'), null)
assert.equal(parsePoiIntent('nächster Song'), null)
assert.equal(poiLabel('pharmacy'), 'Apotheke')
assert.equal(parsePoiIntent('Hat die Apotheke auf')?.kind, 'pharmacy')
assert.equal(parsePoiIntent('Hat die Apotheke auf')?.hours, true)
assert.equal(parsePoiIntent('Öffnungszeiten Bäcker')?.kind, 'bakery')
assert.equal(parsePoiIntent('Öffnungszeiten Bäcker')?.hours, true)
assert.equal(parsePoiIntent('nächster Laden')?.kind, 'shop')
assert.equal(parsePoiIntent('nächster Laden', 'pharmacy')?.kind, 'shop')
assert.equal(parsePoiIntent('nächste Drogerie')?.kind, 'chemist')
assert.equal(parsePoiIntent('nächstes Café')?.kind, 'cafe')
assert.equal(parsePoiIntent('nächstes Café')?.nav, true)
assert.equal(parsePoiIntent('wo könnte ich jetzt frühstücken')?.kind, 'cafe')
assert.equal(parsePoiIntent('Boar wo könnte ich jetzt geil frühstücken')?.kind, 'cafe')
assert.equal(parsePoiIntent('wo könnte ich jetzt frühstücken')?.nav, true)
assert.equal(parsePoiIntent('Boar wo könnte ich jetzt geil frühstücken')?.nav, true)
assert.equal(parsePoiIntent('kein Kaffee mehr'), null)
assert.equal(parsePoiIntent('Fahr zum Café Le Théâtre'), null)
assert.equal(poiLabel('cafe'), 'Café')
assert.match(GEMINI_PERSONA, /Overlay/)
assert.match(GEMINI_PERSONA, /Cafés/)
assert.equal(parsePoiIntent('hat die auf', 'pharmacy')?.kind, 'pharmacy')
assert.equal(parsePoiIntent('hat die auf', 'pharmacy')?.hours, true)
assert.equal(parsePoiIntent('Öffne das overlay'), null)
assert.match(GEMINI_PERSONA, /Öffnungszeiten/)

{
  const tue = new Date(2026, 7, 18, 10, 0, 0)
  const hours = 'Mo-Fr 08:00-18:00; Sa 08:00-13:00; PH off'
  const parsed = parseOpeningHours(hours)
  assert.ok(parsed)
  assert.equal(isOpenAt(parsed, tue), true)
  assert.match(formatHoursSpeech(hours, tue), /jetzt auf/)
  assert.match(formatHoursSpeech(hours, tue), /8 bis 18/)
  assert.equal(hoursOpenNow(hours, new Date(2026, 7, 18, 20, 0, 0)), false)
  assert.equal(hoursOpenNow(hours, new Date(2026, 7, 22, 10, 0, 0)), true)
  assert.equal(hoursOpenNow(hours, new Date(2026, 7, 23, 10, 0, 0)), false)
  assert.match(formatHoursSpeech(hours, new Date(2026, 7, 23, 10, 0, 0)), /geschlossen/)
  assert.equal(hoursOpenNow(hours, new Date(2026, 4, 1, 10, 0, 0)), false)
  assert.match(formatHoursSpeech(hours, new Date(2026, 4, 1, 10, 0, 0)), /Feiertag/)
  assert.match(formatHoursSpeech('24/7', tue), /rund um die Uhr/)
  assert.match(formatHoursSpeech('', tue), /Keine Öffnungszeiten/)
  assert.match(formatHoursSpeech('Jan-Mar Mo-Fr 08:00-18:00', tue), /Saison/)
  const night = parseOpeningHours('Fr 20:00-02:00')
  assert.ok(night)
  assert.equal(isOpenAt(night, new Date(2026, 7, 21, 21, 0, 0)), true)
  assert.equal(isOpenAt(night, new Date(2026, 7, 22, 1, 0, 0)), true)
  assert.equal(isOpenAt(night, new Date(2026, 7, 22, 3, 0, 0)), false)
}

assert.equal(parseDeviceIntent('Wie voll ist der Akku')?.kind, 'battery')
assert.equal(parseDeviceIntent('Taschenlampe an')?.kind, 'torch')
assert.equal(
  parseDeviceIntent('Taschenlampe aus')?.kind === 'torch' && parseDeviceIntent('Taschenlampe aus')?.on,
  false,
)
assert.equal(parseDeviceIntent('Öffne WLAN')?.kind === 'page' && parseDeviceIntent('Öffne WLAN')?.page, 'wifi')
assert.equal(
  parseDeviceIntent('Bluetooth Einstellungen')?.kind === 'page' &&
    parseDeviceIntent('Bluetooth Einstellungen')?.page,
  'bluetooth',
)
assert.equal(parseDeviceIntent('Nicht stören')?.kind === 'page' && parseDeviceIntent('Nicht stören')?.page, 'dnd')
assert.equal(parseDeviceIntent('Notiz: WLAN steht am Router'), null)
assert.equal(parseDeviceIntent('Stoß das System an')?.kind, 'ask')
assert.equal(parseDeviceIntent('Wie spät ist es')?.kind, 'clock')
assert.equal(parseDeviceIntent('weißt du wie viel Uhr es ist')?.kind, 'clock')
assert.equal(parseDeviceIntent('wie viel Uhr ist es')?.kind, 'clock')
assert.match(formatClockReply(new Date('2026-08-19T06:36:00')), /Uhr\.$/)
assert.equal(parseDeviceIntent('Wecker 7 Uhr'), null)
assert.equal(parseDeviceIntent('Wie viele Scheibenwischer verkauft Valeo am tag'), null)

assert.deepEqual(parsePlaceWrite('Ich arbeite in Stuttgart'), {
  name: 'arbeit',
  place: 'Stuttgart',
})
assert.equal(parsePlaceNav('Fahr mich zur Arbeit')?.kind, 'navigate')
if (parsePlaceNav('Fahr mich zur Arbeit')?.kind === 'navigate') {
  assert.equal(parsePlaceNav('Fahr mich zur Arbeit').query, 'arbeit')
}
assert.equal(parsePlaceNav('Ruf mal die Freundin')?.kind, 'call')
assert.equal(parsePlaceNav('Anruf Mama')?.kind, 'call')
const sms = parsePlaceNav('Schreib der Freundin ich bin in 10 Minuten')
assert.equal(sms?.kind, 'sms')
if (sms?.kind === 'sms') {
  assert.equal(sms.query, 'freundin')
  assert.match(sms.body, /10 Minuten/)
}
assert.equal(parsePlaceNav('Bro anrufen')?.kind, 'call')
if (parsePlaceNav('Bro anrufen')?.kind === 'call') {
  assert.equal(parsePlaceNav('Bro anrufen').query, 'bro')
}
const smsBro = parsePlaceNav('Schreib Bro ich bin in 10 Minuten')
assert.equal(smsBro?.kind, 'sms')
if (smsBro?.kind === 'sms') {
  assert.equal(smsBro.query, 'bro')
  assert.match(smsBro.body, /10 Minuten/)
}
const smsBroEmpty = parsePlaceNav('Nachricht an Bro')
assert.equal(smsBroEmpty?.kind, 'sms')
if (smsBroEmpty?.kind === 'sms') {
  assert.equal(smsBroEmpty.query, 'bro')
  assert.equal(smsBroEmpty.body, '')
}
const smsBroBody = parsePlaceNav('Nachricht an Bro ich bin da')
assert.equal(smsBroBody?.kind, 'sms')
if (smsBroBody?.kind === 'sms') {
  assert.equal(smsBroBody.query, 'bro')
  assert.equal(smsBroBody.body, 'ich bin da')
}
assert.equal(displayPlaceName('bro'), 'Bro')
assert.equal(isCommYes('ja', 'call'), true)
assert.equal(isCommYes('senden', 'sms'), true)
assert.equal(isCommYes('senden', 'call'), false)
assert.equal(isCommNo('nein'), true)
assert.equal(rewriteFollowUp('ja', { last_step_tool: 'call_confirm', last_step_utterance: 'Bro anrufen' }), null)
assert.equal(rewriteFollowUp('ja', { last_step_tool: 'pc_confirm', last_step_utterance: 'Lösche den Ordner Test' }), null)
assert.equal(parsePcIntent('FIFA starten')?.kind, 'launch')
if (parsePcIntent('FIFA starten')?.kind === 'launch') {
  assert.equal(parsePcIntent('FIFA starten').query, 'fifa')
}
assert.equal(parsePcIntent('Was siehst du auf dem PC')?.kind, 'screen')
assert.equal(parsePcIntent('klick Mitte')?.kind, 'click')
assert.equal(parsePcIntent('Züge anklicken')?.kind, 'click')
if (parsePcIntent('Züge anklicken')?.kind === 'click') {
  assert.ok(parsePcIntent('Züge anklicken').target)
}
assert.equal(parsePcIntent('Maus nach rechts')?.kind, 'move')
assert.equal(parsePcIntent('Zeig Ordner Downloads')?.kind, 'files')
assert.equal(parsePcIntent('Lösche den Ordner Test auf dem Desktop')?.kind, 'files')
assert.equal(parsePcIntent('PC testen')?.kind, 'status')
assert.equal(parsePcIntent('Öffne Netflix'), null)
assert.equal(parsePcIntent('Bro anrufen'), null)
assert.match(GEMINI_PERSONA, /PC/)
for (const p of PC_COPY_PROMPTS) {
  assert.ok(parsePcIntent(p), `Prompt ohne Parser: ${p}`)
}
assert.match(GEMINI_PERSONA, /nach Nachfrage/)
assert.match(
  scrubReply('Car Play ist verbunden. Musik läuft, Navigation nach Bietigheim-Bissingen steht.'),
  /intern/,
)
assert.match(
  scrubReply(
    'Die Navigation zum Café Le Théâtre ist im internen Fahrmodus aktiv, Timon. Sie erreichen das Ziel in rund zehn Minuten.',
  ),
  /keine erfundene Navigation/i,
)

assert.equal(parseTvWatch('Spiel Dune Film')?.kind, 'play')
assert.equal(parseFilmIntent('Spiel Dune Film'), null)
assert.equal(parseFilmIntent('Wo läuft Dune kostenlos')?.kind, 'where')
assert.equal(parseFilmIntent('Wo läuft Dune kostenlos')?.title, 'Dune')
assert.equal(parseFilmIntent('Wie gut ist Dune')?.kind, 'rate')
assert.equal(parseFilmIntent('Wie ist mein Name?'), null)
assert.equal(parseFilmIntent('IMDb Dune')?.kind, 'rate')
assert.equal(parseFilmIntent('Rotten Tomatoes Dune')?.kind, 'rate')
assert.equal(parseFilmIntent(normalizeUtterance('rotren tomato Dune'))?.kind, 'rate')
assert.equal(parseFilmIntent('Was ist Dune für ein Film')?.kind, 'about')
assert.equal(parseFilmIntent('Was ist Dune für ein Film')?.title, 'Dune')
assert.equal(parseFilmIntent('Tanke E10'), null)

{
  const film = formatFilmReply({
    kind: 'where',
    asked: 'Dune',
    watch: {
      title: 'Dune',
      year: 2021,
      offers: [{ app: 'netflix', monetization: 'flatrate', provider: 'Netflix' }],
      alsoFree: [],
      freeWhere: [
        { name: 'ARD Mediathek', ads: true, url: 'https://www.ardmediathek.de/' },
        { name: 'Joyn', ads: false, url: 'https://www.joyn.de/' },
      ],
      target: null,
    },
    omdb: { title: 'Dune', year: '2021', imdb: '8.0', tomatoes: '83%' },
  })
  assert.match(film, /IMDb 8,0/)
  assert.match(film, /Rotten Tomatoes 83%/)
  assert.match(film, /ARD Mediathek \(Werbung\)/)
  assert.match(film, /Joyn/)
  assert.match(film, /starte ich nicht/)
  assert.match(film, /Abo: Netflix/)
}

{
  const noKey = formatFilmReply({
    kind: 'rate',
    asked: 'Dune',
    watch: { title: 'Dune', offers: [], alsoFree: [], freeWhere: [], target: null },
    omdb: null,
    keyMissing: true,
  })
  assert.match(noKey, /OMDb-Schlüssel/)
  assert.match(noKey, /erfinde keine/)
}

assert.equal(parseShopDiscountIntent('Rabatt-Suche an')?.on, true)
assert.equal(parseShopDiscountIntent('Rabatt-Suche aus')?.on, false)
assert.equal(parseShopDiscountIntent('Tanke E10'), null)
assert.equal(isProductLookup('Gutscheincode Mixer'), false)
assert.equal(isProductLookup('Gutscheincode Mixer', true), true)
assert.match(
  formatResearchReply(
    'Mixer',
    [{ title: 'MediaMarkt', url: 'https://mediamarkt.de/x', snippet: '', provider: 'web', retrieved_at: '' }],
    true,
    true,
  ),
  /keine erfundenen Codes/,
)

{
  const free = collectFreeWhere([
    { monetizationType: 'flatrate', package: { packageId: 8, clearName: 'Netflix' } },
    {
      monetizationType: 'ads',
      standardWebURL: 'https://www.ardmediathek.de/video/1',
      package: { clearName: 'ARD Mediathek' },
    },
  ])
  assert.equal(free.length, 1)
  assert.match(free[0].name, /ARD/)
  assert.equal(free[0].ads, true)
}

const tap = createSentenceTap()
assert.deepEqual(tap.feed('Hallo, der Himmel'), [])
assert.deepEqual(tap.feed('Hallo, der Himmel ist blau.'), ['Hallo, der Himmel ist blau.'])
assert.deepEqual(tap.flush(), [])
const tap2 = createSentenceTap()
assert.deepEqual(tap2.feed('Eins. '), [])
const got = tap2.feed('Eins. Zwei kommt jetzt wirklich.')
assert.equal(got.length, 1)
assert.match(got[0], /Eins/)
assert.match(got[0], /Zwei/)

console.log('ok 0.14 parsers')

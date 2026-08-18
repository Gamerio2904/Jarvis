import assert from 'node:assert/strict'
import { parseTvIntent, parseTvWatch } from '../src/engine/tv-parse.ts'
import { CONTRADICTION, parseMemoryFacts, isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { scrubReply, isHelpCommand, finishReply } from '../src/engine/guards.ts'
import { isIdentityAsk } from '../src/engine/memory-parse.ts'
import {
  formatResearchReply,
  isLiveLookup,
  isProductLookup,
  isSearchRefusal,
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
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { timerDoneLine, cleanTimerTitle, timerSetLine, timerStopLine } from '../src/engine/timer-announce.ts'
import { expandZahlenworte } from '../src/engine/zahlenworte.ts'
import { parseAlarmIntent } from '../src/engine/alarm-parse.ts'
import { clothingTip, formatWeatherBrief } from '../src/engine/weather-brief.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { createSentenceTap, pullReady } from '../src/engine/speak-tap.ts'
import { ttsModelsToTry } from '../src/engine/tts.ts'
import { GEMINI_PERSONA, PERSONA, VOICE_HINT } from '../src/engine/persona.ts'
import { splitIntents } from '../src/engine/split-intents.ts'
import { isFollowUpPhrase, rewriteFollowUp } from '../src/engine/last-step.ts'
import { shouldRefreshTitle, titleFromUser } from '../src/engine/chat-title.ts'
import { memoryBlock } from '../src/engine/memory-block.ts'
import { parseFanIntent } from '../src/engine/fan-parse.ts'
import {
  findContactRow,
  mapsDirUrl,
  parsePlaceNav,
  parsePlaceRecall,
  parsePlaceWrite,
} from '../src/engine/places-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { pickHeard } from '../src/engine/heard.ts'
import { parseShopIntent } from '../src/engine/shopping-parse.ts'
import { parseBirthdayIntent } from '../src/engine/birthday-parse.ts'
import { parseHomeIntent } from '../src/engine/home-parse.ts'
import { parseLeaveIntent } from '../src/engine/leave-parse.ts'
import { parseDriveIntent } from '../src/engine/drive-parse.ts'
import { parseDeviceIntent } from '../src/engine/device-parse.ts'
import { parsePoiIntent, poiLabel } from '../src/engine/poi-parse.ts'
import { formatE10Price, formatFuelSpeech, pickFuelPair } from '../src/engine/fuel-format.ts'
import { isFuelPlace, parseFuelFollowUp, parseFuelIntent } from '../src/engine/fuel-parse.ts'
import { formatHereReply, parseHereIntent } from '../src/engine/here-parse.ts'
import { parseSpotifyIntent, spotifySourceLabel } from '../src/engine/spotify-parse.ts'
import { collectFreeWhere, pickWatchTarget, parseWatchOffers, youtubeVideoId } from '../src/engine/tv-watch.ts'
import { parseFilmIntent } from '../src/engine/film-parse.ts'
import { formatFilmReply } from '../src/engine/film.ts'
import { tvAppFromPackage } from '../src/engine/tv-apps.ts'
import { dirFromManeuver, formatNavCue, navPhase, nextManeuver } from '../src/engine/nav-speak.ts'
import { isBriefAsk } from '../src/engine/brief-parse.ts'
import { parseEyeIntent } from '../src/engine/eye-parse.ts'
import { parseChatSearch } from '../src/engine/search-chat-parse.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'
import { splitTitlePlace } from '../src/engine/calendar-parse.ts'

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
assert.equal(parseDriveIntent('Zeig Spotify')?.kind, 'tab')
assert.equal(parseDriveIntent('Zeig Spotify')?.kind === 'tab' && parseDriveIntent('Zeig Spotify')?.tab, 'spotify')
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

assert.ok(isMemoryWrite('Ich heiße Max und trinke gerne Kaffee'))
const facts = parseMemoryFacts('Ich heiße Max und trinke gerne Kaffee und esse Pizza')
assert.equal(facts.find((f) => f.key === 'name')?.value, 'Max')
assert.equal(facts.find((f) => f.key === 'getränk')?.value, 'Kaffee')
assert.equal(facts.find((f) => f.key === 'essen')?.value, 'Pizza')
assert.ok(isMemoryRecall('Was trinke ich?'))
assert.ok(isMemoryRecall('Wie ist mein Name?'))
assert.ok(!isMemoryWrite('Hallo Jarvis'))

assert.equal(parseToolIntent('todo: Milch')?.kind, 'todo_create')
assert.equal(parseToolIntent('Milch kaufen'), null)
assert.equal(parseShopIntent('Milch kaufen')?.kind, 'add')
assert.equal(parseShopIntent('Milch auf die Einkaufsliste')?.kind, 'add')
assert.equal(parseShopIntent('auch Brot')?.kind, 'add')
assert.equal(parseShopIntent('was fehlt?')?.kind, 'list')
assert.equal(parseShopIntent('Milch hab ich')?.kind, 'got')
assert.equal(parseToolIntent('ich muss noch Brot holen')?.kind, 'todo_create')
assert.equal(parseToolIntent('erinner mich an Steuer')?.kind, 'todo_create')
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
assert.equal(parseWeatherIntent('Wetter am Wochenende')?.when, 'weekend')
assert.equal(parseWeatherIntent('Hallo Jarvis'), null)
const last = { kind: 'place', place: 'München', when: 'today', focus: 'general' }
const follow = parseWeatherFollowup('und morgen?', last)
assert.equal(follow?.when, 'tomorrow')
if (follow?.kind === 'place') assert.equal(follow.place, 'München')
const followCity = parseWeatherFollowup('und in Berlin', last)
if (followCity?.kind === 'place') assert.equal(followCity.place, 'Berlin')
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
assert.doesNotMatch(nowBrief, /Open-Meteo|°C/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'general'), /morgen/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'rain'), /Schirm/)
assert.match(formatWeatherBrief(snap, 'weekend', 'general'), /Wochenende/)
assert.match(formatWeatherBrief(snap, 'now', 'wear'), /Pulli|Jacke|anziehen/)
assert.match(clothingTip({ feels: 16, wet: false, code: 2, wind: 12 }), /Pulli/)
assert.match(clothingTip({ feels: 16, wet: true, code: 63, wind: 12 }), /Schirm/)

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
assert.deepEqual(splitIntents('Wecker 7 und Timer 8 Minuten Nudeln'), [
  'Wecker 7',
  'Timer 8 Minuten Nudeln',
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
assert.equal(parseDriveIntent('Öffnen Carplay')?.kind, 'on')
assert.equal(parseDriveIntent('Öffne CarPlay')?.kind, 'on')
assert.equal(parseDriveIntent('Carplay')?.kind, 'on')
assert.equal(parseDriveIntent('CarPlay')?.kind, 'on')
assert.equal(parseDriveIntent('Öffne das overlay')?.kind, 'tab')
assert.equal(parseDriveIntent('Öffne das overlay')?.kind === 'tab' && parseDriveIntent('Öffne das overlay')?.tab, 'spotify')
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
assert.equal(parseCalendarIntent('Termin um 16:00 Jane', frozen)?.kind, 'create')
assert.equal(parseAlarmIntent('Wecker 7', frozen)?.kind, 'create')
assert.equal(parseTimerIntent('Timer 8 Minuten Nudeln', frozen)?.kind, 'create')

assert.deepEqual(parsePlaceWrite('Freundin wohnt in Heilbronn'), {
  name: 'freundin',
  place: 'Heilbronn',
})
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
assert.equal(rewriteFollowUp('stopp', { last_step_tool: 'fuel' }), 'Fahrmodus aus')
assert.match(memoryBlock([{ key: 'name', value: 'Max' }, { key: 'getränk', value: 'Kaffee' }]), /Smalltalk/)

assert.equal(parseFuelIntent('Fahr mich zu einer Tanke')?.prefer, 'nearest')
assert.equal(parseFuelIntent('fahr mich zur Tankstelle')?.prefer, 'nearest')
assert.equal(parseFuelIntent('nächste Tanke')?.prefer, 'nearest')
assert.equal(parseFuelIntent('billigste Tankstelle')?.prefer, 'cheapest')
assert.equal(parseFuelIntent('wo kann ich tanken')?.prefer, 'nearest')
assert.equal(parseFuelIntent('Danke'), null)
assert.equal(parseFuelIntent('Fahr mich nach Heilbronn'), null)
assert.equal(parseFuelIntent('Ich fahre gerne Auto'), null)
assert.equal(parseDriveIntent('Fahr mich zu einer Tanke'), null)
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
assert.equal(parsePoiIntent('nächster Bäcker')?.kind, 'bakery')
assert.equal(parsePoiIntent('nächster Parkplatz')?.kind, 'parking')
assert.equal(parsePoiIntent('nächster Supermarkt')?.kind, 'supermarket')
assert.equal(parsePoiIntent('nächster pol')?.kind, 'ask')
assert.equal(parsePoiIntent('nächster POI')?.kind, 'ask')
assert.equal(parsePoiIntent('nächste Tanke'), null)
assert.equal(parsePoiIntent('nächster Song'), null)
assert.equal(poiLabel('pharmacy'), 'Apotheke')

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
assert.match(
  scrubReply('Car Play ist verbunden. Musik läuft, Navigation nach Bietigheim-Bissingen steht.'),
  /intern/,
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

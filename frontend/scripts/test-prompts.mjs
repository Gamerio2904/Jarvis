/**
 * Routes every TEST_PROMPT the same way chat.ts does (no LLM, no phone).
 * Order: help → discount → ordinal → tv → film → fan → plug → here → fuel → poi → transit → drive → device → maps → ...
 */
import assert from 'node:assert/strict'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { isHelpCommand } from '../src/engine/guards.ts'
import { parseTvIntent, parseTvWatch } from '../src/engine/tv-parse.ts'
import { isIdentityAsk, isMemoryRecall, isMemoryWrite } from '../src/engine/memory-parse.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { parseAlarmIntent } from '../src/engine/alarm-parse.ts'
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { parseWeatherFollowup, parseWeatherIntent } from '../src/engine/weather-parse.ts'
import { parseFanIntent } from '../src/engine/fan-parse.ts'
import { parsePlugIntent } from '../src/engine/plug-parse.ts'
import { isLiveLookup, parseShopDiscountIntent } from '../src/engine/research-parse.ts'
import { parseFilmIntent } from '../src/engine/film-parse.ts'
import { parseDeviceIntent } from '../src/engine/device-parse.ts'
import { parsePcIntent } from '../src/engine/pc-parse.ts'
import { parseDriveIntent } from '../src/engine/drive-parse.ts'
import { parseSpotifyIntent } from '../src/engine/spotify-parse.ts'
import { parseFuelIntent } from '../src/engine/fuel-parse.ts'
import { parseHereIntent } from '../src/engine/here-parse.ts'
import { parsePlaceNav, parsePlaceRecall, parsePlaceWrite } from '../src/engine/places-parse.ts'
import { parsePoiIntent } from '../src/engine/poi-parse.ts'
import { parseShopIntent } from '../src/engine/shopping-parse.ts'
import { parseBirthdayIntent } from '../src/engine/birthday-parse.ts'
import { parseHomeIntent } from '../src/engine/home-parse.ts'
import { parseLeaveIntent } from '../src/engine/leave-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { isBriefAsk } from '../src/engine/brief-parse.ts'
import { parseEyeIntent } from '../src/engine/eye-parse.ts'
import { parseChatSearch } from '../src/engine/search-chat-parse.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'
import { parseTransitIntent } from '../src/engine/transit-parse.ts'
import { parseHolidayIntent } from '../src/engine/holiday-parse.ts'
import { parseNewsIntent } from '../src/engine/news-parse.ts'

const NOW = new Date('2026-08-15T14:00:00')

/** @typedef {'help'|'discount'|'ordinal'|'tv'|'film'|'fan'|'plug'|'here'|'fuel'|'poi'|'transit'|'drive'|'device'|'pc'|'maps'|'memory'|'shopping'|'birthday'|'home'|'leave'|'brief'|'holiday'|'calendar'|'alarm'|'timer'|'reminder'|'tools'|'eye'|'weather'|'news'|'research'|'search'|'llm'} Route */

/** @param {string} text @param {{ weatherLast?: import('../src/engine/weather-parse.ts').WeatherLast | null }} [ctx] */
function route(text, ctx = {}) {
  text = normalizeUtterance(text)
  if (isHelpCommand(text)) return 'help'
  if (parseShopDiscountIntent(text)) return 'discount'
  if (parseOrdinalFollowUp(text)) return 'ordinal'
  if (parseTvWatch(text) || parseTvIntent(text)) return 'tv'
  if (parseFilmIntent(text)) return 'film'
  if (parseFanIntent(text)) return 'fan'
  if (parsePlugIntent(text)) return 'plug'
  if (parseHereIntent(text)) return 'here'
  if (parseFuelIntent(text)) return 'fuel'
  if (parsePoiIntent(text)) return 'poi'
  if (parseTransitIntent(text)) return 'transit'
  if (parseDriveIntent(text) || parseSpotifyIntent(text)) return 'drive'
  if (parseDeviceIntent(text)) return 'device'
  if (parsePcIntent(text)) return 'pc'
  if (parsePlaceWrite(text) || parsePlaceRecall(text) || parsePlaceNav(text)) return 'maps'
  if (isMemoryWrite(text) || isMemoryRecall(text) || isIdentityAsk(text)) return 'memory'
  if (parseShopIntent(text)) return 'shopping'
  if (parseBirthdayIntent(text)) return 'birthday'
  if (parseHomeIntent(text)) return 'home'
  if (parseLeaveIntent(text)) return 'leave'
  if (isBriefAsk(text)) return 'brief'
  if (parseHolidayIntent(text)) return 'holiday'
  if (parseCalendarIntent(text, NOW)) return 'calendar'
  if (parseAlarmIntent(text, NOW)) return 'alarm'
  if (parseTimerIntent(text, NOW)) return 'timer'
  if (parseReminderIntent(text, NOW)) return 'reminder'
  if (parseToolIntent(text)) return 'tools'
  if (parseEyeIntent(text)) return 'eye'
  if (parseWeatherIntent(text)) return 'weather'
  if (parseWeatherFollowup(text, ctx.weatherLast ?? null)) return 'weather'
  if (parseNewsIntent(text)) return 'news'
  if (parseChatSearch(text)) return 'search'
  if (isLiveLookup(text)) return 'research'
  return 'llm'
}

/** @type {Record<string, Route>} */
const EXPECT = {
  'Hallo Jarvis.': 'llm',
  'Wer bist du und wer bin ich?': 'memory',
  'Ich heiße Max und trinke gerne Kaffee.': 'memory',
  'Was trinke ich?': 'memory',
  'Was trinke ich gerne?': 'memory',
  'Wie ist mein Name?': 'memory',
  'Milch auf die Einkaufsliste': 'shopping',
  'auch Brot': 'shopping',
  'was fehlt?': 'shopping',
  'Milch hab ich': 'shopping',
  'Milch kaufen': 'shopping',
  'Was steht an?': 'brief',
  'Guten Morgen': 'brief',
  '/hilfe': 'help',
  'Fernseher an': 'tv',
  'Fire TV': 'tv',
  'Öffne Netflix': 'tv',
  'Spiel Dune Film': 'tv',
  'Spiele ein YouTube Video auf dem Fernseher': 'tv',
  'Ventilator an': 'fan',
  'Sag Hallo und duze mich.': 'llm',
  'Erklären Sie in einem Satz, was Sie tun.': 'llm',
  'Notiz: WLAN steht am Router': 'tools',
  'Zeige Notizen': 'tools',
  'Suche im Internet nach Kuchenrezepten': 'research',
  'Suche nach Küchengeräte': 'research',
  'Beste Preise Staubsauger': 'research',
  'Öffnen CarPlay': 'drive',
  'in 20 Minuten Milch': 'reminder',
  'in 20 Minuten Milch holen': 'reminder',
  'morgen 8 Uhr Steuer': 'reminder',
  'Wetter heute': 'weather',
  'Wetter morgen in München': 'weather',
  'und morgen?': 'llm',
  'Brauche ich einen Schirm?': 'weather',
  'Was soll ich anziehen?': 'weather',
  'Timer 8 Minuten Nudeln': 'timer',
  'Wecker 7 Uhr': 'alarm',
  'Wecker 7 Uhr jeden Tag': 'alarm',
  'jeden Tag 8 Uhr Tabletten': 'reminder',
  'Temperatur hier': 'weather',
  'Termin morgen 15 Uhr Zahnarzt': 'calendar',
  'Termin morgen 15 Uhr Zahnarzt Bahnhofstraße': 'calendar',
  'Wann muss ich zum Zahnarzt los?': 'leave',
  Kalender: 'calendar',
  'Freundin wohnt in Heilbronn': 'maps',
  'Nach Heilbronn': 'drive',
  'Fahr mich zur Freundin': 'drive',
  'Freundin, Tel 01711234567': 'maps',
  'Ruf die Freundin an': 'maps',
  'Lauf zur Freundin': 'maps',
  'Wenn ich zuhause bin Müll raus': 'home',
  'Ich bin zuhause': 'home',
  'Lies das Foto': 'eye',
  'Aktiviere Fahrmodus': 'drive',
  'Zeig Spotify': 'drive',
  'Spiel das auf Spotify': 'drive',
  'Lautstärke 50': 'tv',
  'lauter um 10': 'tv',
  'Fahrmodus aus': 'drive',
  'Mama hat am 3. März Geburtstag': 'birthday',
  'Jeden Dienstag Müll': 'reminder',
  'was kommt diese Woche raus?': 'reminder',
  'das zweite': 'ordinal',
  'Wann hatte ich das mit der Steuer?': 'search',
  'Was kommt heute?': 'brief',
  'Milch fehlt': 'shopping',
  'Ventilator Stufe zwei': 'fan',
  'Timer acht Minuten Nudeln': 'timer',
  'Spiel mal was Nettes': 'llm',
  'Ich fahre gerne Auto': 'llm',
  'kein Kaffee mehr': 'memory',
  'Netflix an': 'tv',
  'Fahr mich zu einer Tanke': 'fuel',
  'Wo bin ich gerade?': 'here',
  Carplay: 'drive',
  'Öffne das overlay': 'drive',
  'Aktiviere das overlay': 'drive',
  'Gib mir ne Route': 'drive',
  'wo könnte ich jetzt frühstücken': 'poi',
  'Wie weit noch': 'drive',
  'nächste Apotheke': 'poi',
  'nächster pol': 'poi',
  'Fahr zur Arbeit': 'drive',
  'Ich arbeite in Stuttgart': 'maps',
  'Wie voll ist der Akku': 'device',
  'Ruf mal die Freundin': 'maps',
  'Schreib der Freundin ich bin in 10 Minuten': 'maps',
  'Wo läuft Dune kostenlos': 'film',
  'Wie gut ist Dune': 'film',
  'IMDb Dune': 'film',
  'Rabatt-Suche an': 'discount',
  'Hat die Apotheke auf': 'poi',
  'nächster Laden': 'poi',
  'Bro anrufen': 'maps',
  'Nachricht an Bro ich bin da': 'maps',
  'FIFA starten': 'pc',
  'Was siehst du auf dem PC': 'pc',
  'Züge anklicken': 'pc',
  'Wie ist die Luft?': 'weather',
  'Wann Sonnenaufgang?': 'weather',
  'Mit der Bahn nach Heilbronn': 'transit',
  Nachrichten: 'news',
  'Was ist heute in Ingesheim passiert': 'news',
  'Ist heute Feiertag?': 'holiday',
  'Wie viele Scheibenwischer verkauft Valeo am tag': 'research',
  'Steckdose an': 'plug',
  'alle Steckdosen aus': 'plug',
}

const missing = TEST_PROMPTS.filter((p) => !(p in EXPECT))
assert.equal(missing.length, 0, `neue Chips ohne Erwartung: ${missing.join(' | ')}`)

const extra = Object.keys(EXPECT).filter((p) => !TEST_PROMPTS.includes(/** @type {never} */ (p)))
assert.equal(extra.length, 0, `tote Erwartungen: ${extra.join(' | ')}`)

/** @type {Array<{ prompt: string, got: Route, want: Route }>} */
const rows = []
let fail = 0
for (const prompt of TEST_PROMPTS) {
  const got = route(prompt)
  const want = EXPECT[prompt]
  rows.push({ prompt, got, want })
  if (got !== want) fail += 1
}

const follow = route('und morgen?', {
  weatherLast: { kind: 'place', place: 'München', when: 'today', focus: 'general' },
})
assert.equal(follow, 'weather', 'und morgen? nach Wetter-Kontext')
assert.equal(route('und die Luft', { weatherLast: { kind: 'here', when: 'today', focus: 'general' } }), 'weather')
assert.equal(route('nächste Bahn nach Heilbronn'), 'transit')
assert.equal(route('Tagesschau'), 'news')
assert.equal(route('nächster Feiertag'), 'holiday')
assert.equal(route('Wetter heute'), 'weather')
assert.equal(route('Nachricht an Bro ich bin da'), 'maps')
assert.equal(route('Nach Heilbronn'), 'drive')
assert.equal(route('Was trinke ich gerne?'), 'memory')
assert.equal(route('in 20 Minuten Milch holen'), 'reminder')
assert.equal(route('Fahr mich zu einer Tanke'), 'fuel')
assert.equal(route('Steckdose an'), 'plug')
assert.equal(route('Ventilator an'), 'fan')

for (const r of rows) {
  const mark = r.got === r.want ? 'ok' : 'FAIL'
  console.log(`${mark.padEnd(4)} ${r.want.padEnd(10)} ← ${r.prompt}`)
}

assert.equal(fail, 0, `${fail} Chip(s) falsch geroutet`)
console.log(`ok ${rows.length} chips + Wetter-Nachfrage`)

/**
 * Routes every TEST_PROMPT the same way chat.ts does (no LLM, no phone).
 * Order: help → discount → ordinal → tv → film → fan → plug → here → fuel → poi → transit → drive → device → maps → ...
 */
import assert from 'node:assert/strict'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { allTestCopyTexts } from '../src/engine/test-copy.ts'
import { isHelpCommand } from '../src/engine/guards.ts'
import { parseTvConnect, parseTvIntent, parseTvWatch } from '../src/engine/tv-parse.ts'
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
import { parseKaufIntent } from '../src/engine/kauf-intent.ts'
import { parseWorldIntent } from '../src/engine/world-parse.ts'

const NOW = new Date('2026-08-15T14:00:00')

/** @typedef {'help'|'discount'|'ordinal'|'tv'|'film'|'fan'|'plug'|'here'|'fuel'|'poi'|'transit'|'drive'|'device'|'pc'|'maps'|'memory'|'kauf'|'shopping'|'birthday'|'home'|'leave'|'brief'|'holiday'|'world'|'calendar'|'alarm'|'timer'|'reminder'|'tools'|'eye'|'weather'|'news'|'research'|'search'|'llm'} Route */

/** @param {string} text @param {{ weatherLast?: import('../src/engine/weather-parse.ts').WeatherLast | null, kaufOpen?: boolean }} [ctx] */
function route(text, ctx = {}) {
  text = normalizeUtterance(text)
  if (isHelpCommand(text)) return 'help'
  if (parseShopDiscountIntent(text)) return 'discount'
  if (parseOrdinalFollowUp(text)) return 'ordinal'
  if (parseTvWatch(text) || parseTvIntent(text) || parseTvConnect(text)) return 'tv'
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
  if (parseKaufIntent(text, Boolean(ctx.kaufOpen))) return 'kauf'
  if (parseShopIntent(text)) return 'shopping'
  if (parseBirthdayIntent(text)) return 'birthday'
  if (parseHomeIntent(text)) return 'home'
  if (parseLeaveIntent(text)) return 'leave'
  if (isBriefAsk(text)) return 'brief'
  if (parseHolidayIntent(text)) return 'holiday'
  if (parseWorldIntent(text)) return 'world'
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
  'Verbinde dich mit dem Fernseher': 'tv',
  'Fernseher koppeln': 'tv',
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
  'Wie spät ist es?': 'device',
  'weißt du wie viel Uhr es ist': 'device',
  'weißt du wo ich bin': 'here',
  'wo könnte ich denn sein': 'here',
  'Was ist der bip in Deutschland': 'research',
  'Kannst du den bip von Deutschland in einer Tabelle darstellen?': 'research',
  'Taschenlampe an': 'device',
  'ohne meine Adresse nachzugucken weißt du wo ich bin': 'here',
  'Nach Ingersheim': 'drive',
  Kaufmodus: 'kauf',
  'Kaufmodus aus': 'kauf',
  'Kaufmodus schließen': 'kauf',
  'Öffne den Kaufmodus': 'kauf',
  'Öffne Kaufmodus': 'kauf',
  'Ich will einkaufen': 'kauf',
  einkaufen: 'kauf',
  'Shopping-Modus': 'kauf',
  'Such mir einen Fernseher': 'kauf',
  'Ich brauche neue Kopfhörer': 'kauf',
  'Ich brauche einen Gaming-Monitor unter 300 Euro': 'kauf',
  'Ich brauche einen Laptop': 'kauf',
  'Such mir Milch im Angebot': 'kauf',
  'Such Angebote für Monitor': 'kauf',
  'Wo bekomme ich einen Monitor': 'kauf',
  'Wo bekomme ich diesen Fernseher heute in der Nähe?': 'kauf',
  'Nur Angebote für Kaffee unter 5 €': 'kauf',
  'Zeig mir alle aktuellen Angebote für Waschmittel': 'kauf',
  'Prospekt von Aldi': 'kauf',
  'Werbung von Lidl': 'kauf',
  'Vergleiche diese drei Fernseher': 'kauf',
  'Such günstigere Alternativen': 'kauf',
  'Pack Nummer 2 auf die Einkaufsliste': 'kauf',
  'Pack Milch auf die Einkaufsliste': 'shopping',
  'Milch holen': 'shopping',
  'Was muss ich einkaufen': 'shopping',
  'Einkaufsliste leeren': 'shopping',
  'Gibt’s Unwetter?': 'world',
  'Gibt es Unwetter?': 'world',
  'DWD Warnung': 'world',
  Wetterwarnung: 'world',
  'Sind in BW Ferien?': 'world',
  'Schulferien in Bayern': 'world',
  'Ferien in Hessen': 'world',
  'Was ist der Dollar?': 'world',
  'Euro in Dollar': 'world',
  Wechselkurs: 'world',
  'Kurs von Dollar': 'world',
  'Was ist das für ein Produkt?': 'world',
  'Nutri-Score': 'world',
  Barcode: 'world',
  'Was ist das für ein Buch?': 'world',
  'Wer schrieb Faust': 'world',
  'Wie hat der VfB gespielt?': 'world',
  'Ergebnis Bayern': 'world',
  'Ergebnis Dortmund': 'world',
  Bundesliga: 'world',
  'Was ist das für eine Pflanze?': 'world',
  'Welches Kraut ist das?': 'world',
  Mondphase: 'world',
  'Wann fliegt die ISS?': 'world',
  'Internationale Raumstation': 'world',
  'Welcher Vogel ist das?': 'world',
  'Was für ein Tier ist das?': 'world',
  iNaturalist: 'world',
  'Was fliegt da?': 'world',
  'Flugzeug über uns': 'world',
  OpenSky: 'world',
  'Kündigungsfrist Wohnung': 'world',
  Mietrecht: 'world',
  'Was bedeutet die Waschschüssel?': 'world',
  Waschsymbol: 'world',
  Bügelsymbol: 'world',
  'Fleck auf dem Hemd': 'world',
  'Wie viele Schritte heute?': 'world',
  Luftdruck: 'world',
  Barometer: 'world',
  Kompass: 'world',
  Nordrichtung: 'world',
  'Schach e2e4': 'world',
  'Schach neu': 'world',
  'Schach reset': 'world',
  'Schach Stellung': 'world',
  Schach: 'world',
  'Taschenlampe aus': 'device',
  'Öffne WLAN': 'device',
  'Öffne Bluetooth': 'device',
  'Nicht stören': 'device',
  'Wie ist die Verbindung': 'device',
  'Standort aktivieren': 'here',
  'es ist 06:30 Uhr wo könnte ich denn sein': 'here',
  'nächster Bäcker': 'poi',
  'nächstes Café': 'poi',
  'CarPlay aus': 'drive',
  'Aktiviere CarPlay': 'drive',
  Fahrmodus: 'drive',
  'Zeig die Karte': 'drive',
  Restweg: 'drive',
  'Wann bin ich da': 'drive',
  'Timer 0 Minuten': 'llm',
  'in 20 Minuten': 'llm',
  'Fahr nach Atlantis': 'drive',
  'Licht an': 'llm',
  'Alexa, Licht an': 'llm',
  'Tapo Steckdose an': 'plug',
  'Kopple die Tuya Cloud': 'llm',
  'Verbinde Apple CarPlay': 'llm',
  'Schreib Mama auf WhatsApp ich bin unterwegs': 'maps',
  Stopp: 'llm',
  'Wecker 25 Uhr': 'llm',
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
assert.equal(route('Wie spät ist es?'), 'device')
assert.equal(route('weißt du wo ich bin'), 'here')
assert.equal(route('wo könnte ich jetzt frühstücken'), 'poi')
assert.equal(route('Was ist der bip in Deutschland'), 'research')
assert.equal(parseHereIntent('wo könnte ich jetzt frühstücken'), null)
assert.equal(parseDeviceIntent('wie spät ist es')?.kind, 'clock')
assert.equal(route('Taschenlampe an'), 'device')
assert.equal(route('Nach Ingersheim'), 'drive')
assert.equal(route('Kaufmodus'), 'kauf')
assert.equal(route('Such mir einen Fernseher'), 'kauf')
assert.equal(route('Milch kaufen'), 'shopping')
assert.equal(route('Pack Milch auf die Einkaufsliste'), 'shopping')
assert.equal(route('Gibt’s Unwetter?'), 'world')
assert.equal(route('Sind in BW Ferien?'), 'world')
assert.equal(route('Was ist der Dollar?'), 'world')
assert.equal(route('Schach e2e4'), 'world')
assert.equal(route('Wetter heute'), 'weather')
assert.equal(parseKaufIntent('Milch kaufen'), null)
assert.equal(parseKaufIntent('Kaufmodus')?.kind, 'open')
assert.equal(parseKaufIntent('Kaufmodus aus')?.kind, 'close')
assert.equal(parseKaufIntent('Kaufmodus schließen')?.kind, 'close')
assert.equal(parseKaufIntent('Öffne den Kaufmodus')?.kind, 'open')
assert.equal(parseKaufIntent('Öffne Kaufmodus')?.kind, 'open')
assert.equal(parseKaufIntent('Ich will einkaufen')?.kind, 'open')
assert.equal(parseKaufIntent('einkaufen')?.kind, 'open')
assert.equal(parseKaufIntent('Shopping-Modus')?.kind, 'open')
assert.equal(parseKaufIntent('Such mir Milch im Angebot')?.kind, 'search')
assert.equal(parseKaufIntent('Such Angebote für Monitor')?.kind, 'search')
assert.equal(parseKaufIntent('Such günstigere Alternativen')?.kind, 'search')
assert.equal(parseKaufIntent('Pack Nummer 2 auf die Einkaufsliste')?.kind, 'toList')
assert.equal(parseKaufIntent('Prospekt von Aldi')?.kind, 'search')
assert.equal(parseKaufIntent('Nur Angebote', true)?.kind, 'filter')
assert.equal(parseKaufIntent('Vergleiche Nummer 1 und 3', true)?.kind, 'compare')
assert.equal(parseKaufIntent('Merke mir Nummer 2', true)?.kind, 'save')
assert.equal(parseKaufIntent('Öffne das beste Angebot', true)?.kind, 'openDeal')
assert.equal(parseKaufIntent('Bestes Angebot öffnen', true)?.kind, 'openDeal')
assert.equal(parseKaufIntent('Sortiere nach Preis', true)?.kind, 'sort')
assert.equal(parseKaufIntent('Sortiere nach Bewertung', true)?.by, 'rating')
assert.equal(parseKaufIntent('Was würdest du nehmen?', true)?.kind, 'recommend')
assert.equal(parseKaufIntent('Kauf diese Milch', true)?.kind, 'openDeal')
assert.equal(parseKaufIntent('Maximal 200 €', true)?.maxEuro, 200)
assert.equal(parseKaufIntent('Nur lokal', true)?.filter, 'local')
assert.equal(parseKaufIntent('Öffne Nummer 2', true)?.kind, 'openDeal')
assert.equal(parseKaufIntent('Alle', true)?.filter, 'all')
assert.equal(route('Milch kaufen', { kaufOpen: true }), 'shopping')
assert.equal(route('was fehlt?', { kaufOpen: true }), 'shopping')
assert.equal(route('Nur Angebote', { kaufOpen: true }), 'kauf')
assert.equal(route('Vergleiche Nummer 1 und 3', { kaufOpen: true }), 'kauf')
assert.equal(route('Merke mir Nummer 2', { kaufOpen: true }), 'kauf')
assert.equal(route('Öffne das beste Angebot', { kaufOpen: true }), 'kauf')
assert.equal(route('Maximal 200 €', { kaufOpen: true }), 'kauf')
assert.equal(route('Nur lokal', { kaufOpen: true }), 'kauf')
assert.equal(route('Öffne Nummer 2', { kaufOpen: true }), 'kauf')
assert.equal(route('Sortiere nach Bewertung', { kaufOpen: true }), 'kauf')
assert.equal(route('Ich will einkaufen'), 'kauf')
assert.equal(route('Such günstigere Alternativen'), 'kauf')
assert.equal(route('Milch holen'), 'shopping')
assert.equal(route('Aktiviere CarPlay'), 'drive')
assert.equal(route('Restweg'), 'drive')
assert.equal(route('Kopple die Tuya Cloud'), 'llm')
assert.equal(parseWorldIntent('Schach e2e4')?.kind, 'chess')
assert.equal(parseWorldIntent('Schach reset')?.reset, true)
assert.equal(parseWorldIntent('DWD Warnung')?.kind, 'dwd')
assert.equal(parseWorldIntent('Wetterwarnung')?.kind, 'dwd')
assert.equal(parseWorldIntent('Wetter heute'), null)
assert.equal(parseWorldIntent('Euro in Dollar')?.kind, 'fx')
assert.equal(parseWorldIntent('Wechselkurs')?.kind, 'fx')
assert.equal(parseWorldIntent('Kündigungsfrist Wohnung')?.kind, 'law')
assert.equal(parseWorldIntent('Mietrecht')?.kind, 'law')
assert.equal(parseWorldIntent('Bundesliga')?.kind, 'sport')
assert.equal(parseWorldIntent('Barcode')?.kind, 'food')
assert.equal(parseWorldIntent('Wer schrieb Faust')?.kind, 'library')
assert.equal(parseWorldIntent('OpenSky')?.kind, 'flight')
assert.equal(parseWorldIntent('iNaturalist')?.kind, 'fauna')
assert.equal(parseWorldIntent('Barometer')?.kind, 'sensors')
assert.equal(route('Wetter heute'), 'weather')
assert.equal(route('Beste Preise Staubsauger'), 'research')
assert.equal(normalizeUtterance('Ich will einkaufen'), 'Ich will einkaufen')
for (const p of TEST_PROMPTS) {
  assert.ok(allTestCopyTexts().includes(p), `Kopierfeld fehlt: ${p}`)
}

for (const r of rows) {
  const mark = r.got === r.want ? 'ok' : 'FAIL'
  console.log(`${mark.padEnd(4)} ${r.want.padEnd(10)} ← ${r.prompt}`)
}

assert.equal(fail, 0, `${fail} Chip(s) falsch geroutet`)
console.log(`ok ${rows.length} chips + Wetter-Nachfrage`)

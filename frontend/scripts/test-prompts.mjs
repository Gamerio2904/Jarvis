/**
 * Routes every TEST_PROMPT via Register-Score (route-pick), plus Gates.
 */
import assert from 'node:assert/strict'
import {
  corpusSaysNowFree,
  guardResearchReply,
  isLiveLookup,
  isStaleFeeNow,
  parseShopDiscountIntent,
} from '../src/engine/research-parse.ts'
import { parsePlaceRecall } from '../src/engine/places-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { isHelpCommand } from '../src/engine/guards.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'
import { pickRouteFromCtx } from '../src/engine/route-pick.ts'
import { parseHereIntent } from '../src/engine/here-parse.ts'
import { parseDeviceIntent } from '../src/engine/device-parse.ts'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { allTestCopyTexts } from '../src/engine/test-copy.ts'

/** @typedef {'help'|'discount'|'ordinal'|'tv'|'film'|'fan'|'plug'|'here'|'fuel'|'poi'|'transit'|'drive'|'device'|'pc'|'maps'|'memory'|'shopping'|'birthday'|'home'|'leave'|'brief'|'holiday'|'calendar'|'alarm'|'timer'|'reminder'|'tools'|'eye'|'weather'|'news'|'research'|'search'|'llm'|'warn'|'ferien'|'fx'|'sport'|'sky'|'chess'|'hud'|'trace'|'digest'|'outlook'|'taxi'|'wont'|'identity'} Route */

/** @param {string} text @param {{ weatherLast?: import('../src/engine/weather-parse.ts').WeatherLast | null }} [ctx] */
function route(text, ctx = {}) {
  text = normalizeUtterance(text)
  if (isHelpCommand(text)) return 'help'
  if (parseShopDiscountIntent(text)) return 'discount'
  if (parseOrdinalFollowUp(text)) return 'ordinal'
  const id = pickRouteFromCtx({
    conversationId: 'test',
    text,
    lastTool: '',
    lastMedium: '',
    inDrive: false,
    weatherLast: ctx.weatherLast ?? null,
  })
  if (id === 'todo') return 'tools'
  if (id) return id
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
  'erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt': 'calendar',
  'was steht heute so an?': 'calendar',
  'was steht diese Woche an?': 'calendar',
  'was steht die nächsten 3 Tage an?': 'calendar',
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
  'Was ist die Weltlage?': 'outlook',
  'Was ist heute so auf der Welt passiert': 'outlook',
  'Warum steigt der Ölpreis?': 'outlook',
  'Wird Benzin teurer?': 'outlook',
  'Fällt der Dollar?': 'outlook',
  'Fällt SAP morgen?': 'outlook',
  'Was ist der Dollar?': 'fx',
  'Bar in der Nähe': 'poi',
  'nächste Kneipe': 'poi',
  'bestell ein Taxi': 'taxi',
  'Sprachnachricht an Mama ich bin in 10 Minuten': 'maps',
  'Todo: Testdebug Milch': 'tools',
  'Gibt es Unwetter?': 'warn',
  'Wo ist die ISS?': 'sky',
  'Körper an': 'hud',
  'zeig mal den körper': 'hud',
  'Kugel an': 'hud',
  'Wo liegt Berlin': 'hud',
  'klick das Captcha': 'wont',
  Friday: 'face',
  'Was steht am Freitag an?': 'calendar',
  'Darf ich im Park grillen?': 'law',
  'Wo ist Speichern': 'pc',
  'Lage an': 'hud',
  'Zeig mir London': 'hud',
  'Was ist das für eine Stadt?': 'hud',
  'Was sehe ich?': 'hud',
  'Zeig mir Atlantis': 'hud',
  'zoom auf Tokio': 'hud',
  'Was kannst du?': 'help',
  'Bist du ChatGPT?': 'identity',
  'Kannst du Bilder malen?': 'wont',
  'Spiele Musik': 'drive',
  'Schreib mir eine E-Mail': 'wont',
  'Zeig mir die Nachrichten': 'news',
  'Überweise 200 Euro': 'wont',
  'Zeig Street View von London': 'wont',
  Hilfe: 'help',
  'Rufe 112': 'wont',
  'mach die weltkugel an': 'hud',
  'Zeig New York': 'hud',
  'Was is das für ne Stadt': 'hud',
  'Körper an und Zeig London': 'hud',
  'Mach Live-Satellitenvideo an': 'wont',
  'Wo ist London': 'hud',
  'Lage aus': 'hud',
  'Muss man Eintritt zahlen für Venedig': 'research',
  'Wo liegt Kiew': 'hud',
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
assert.equal(route('Wetterstatistik an'), 'hud')
assert.equal(route('Welche Route nimmt google.de'), 'trace')
assert.equal(route('Fass das Gespräch zusammen'), 'digest')
assert.equal(route('Ruf mich in 20 Minuten'), 'reminder')
assert.equal(route('Wetter heute'), 'weather')
assert.equal(route('kein Kaffee mehr'), 'memory')
assert.equal(route('Fahr mich zur Freundin'), 'drive')
assert.equal(route('Was ist die Weltlage?'), 'outlook')
assert.equal(route('Was ist heute so auf der Welt passiert'), 'outlook')
assert.equal(route('Weltbrief'), 'outlook')
assert.equal(route('Warum steigt der Ölpreis?'), 'outlook')
assert.equal(route('Wird Benzin teurer?'), 'outlook')
assert.equal(route('Fällt der Dollar?'), 'outlook')
assert.equal(route('Fällt SAP morgen?'), 'outlook')
assert.equal(route('Was ist der Dollar?'), 'fx')
assert.equal(route('Bar in der Nähe'), 'poi')
assert.equal(route('nächste Kneipe'), 'poi')
assert.equal(route('bestell ein Taxi'), 'taxi')
assert.equal(route('Sprachnachricht an Mama ich bin in 10 Minuten'), 'maps')
assert.equal(route('Mit der Bahn nach Heilbronn'), 'transit')
assert.equal(route('Wo ist London'), 'hud')
assert.equal(route('Wo liegt Kiew'), 'hud')
assert.equal(route('Lage aus'), 'hud')
assert.equal(isLiveLookup('Muss man Eintritt zahlen für Venedig'), true)
assert.equal(route('Muss man Eintritt zahlen für Venedig'), 'research')
assert.equal(parsePlaceRecall('Wo ist London'), null)
assert.equal(parsePlaceRecall('Wo liegt London'), null)
assert.equal(parsePlaceRecall('Wo wohnt die Freundin')?.name, 'freundin')
assert.equal(corpusSaysNowFree('Aktuell keine Eintrittsgebühr, Testphase beendet'), true)
assert.equal(isStaleFeeNow('Für die Altstadt zahlt man 5 € Tagesgast.'), true)
assert.ok(
  /aktuell nicht/i.test(
    guardResearchReply(
      'Muss man Eintritt zahlen für Venedig',
      'Für das Betreten der Altstadt zahlt man fünf Euro als Tagesgast.',
      [
        {
          title: 'ADAC Venedig 2026',
          url: 'https://www.adac.de/venedig',
          snippet: 'Aktuell kein Eintritt. Testphase beendet. Geplant frühestens Ostern 2027.',
          provider: 'adac',
          retrieved_at: '2026-08-29T00:00:00Z',
        },
      ],
    ),
  ),
)
for (const p of TEST_PROMPTS) {
  assert.ok(allTestCopyTexts().includes(p), `Kopierfeld fehlt: ${p}`)
}

for (const r of rows) {
  const mark = r.got === r.want ? 'ok' : 'FAIL'
  console.log(`${mark.padEnd(4)} ${r.want.padEnd(10)} ← ${r.prompt}`)
}

assert.equal(fail, 0, `${fail} Chip(s) falsch geroutet`)
console.log(`ok ${rows.length} chips + Wetter-Nachfrage`)

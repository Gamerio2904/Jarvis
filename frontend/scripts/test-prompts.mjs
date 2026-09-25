// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
/**
 * Routes every TEST_PROMPT via Register-Score (route-pick), plus Gates.
 */
import assert from 'node:assert/strict'
import {
  corpusSaysNowFree,
  guardResearchReply,
  isLiveLookup,
  isStaleFeeNow,
  wikiCompanyHint,
} from '../src/engine/research-parse.ts'
import { shouldProxyWebHost } from '../src/engine/web-proxy.ts'
import { parsePlaceRecall } from '../src/engine/places-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { parseHereIntent } from '../src/engine/here-parse.ts'
import { parseDeviceIntent } from '../src/engine/device-parse.ts'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { allTestCopyTexts } from '../src/engine/test-copy.ts'
import { filterTopics } from '../src/engine/settings-ia.ts'
import { parseBlitzerIntent } from '../src/engine/blitzer-parse.ts'
import { parseAmazonMusicIntent } from '../src/engine/amazon-parse.ts'
import { parseFolderIntent } from '../src/engine/folder-parse.ts'
import { parseSpotifyIntent } from '../src/engine/spotify-parse.ts'
import { parseWatchPriceIntent } from '../src/engine/watch-price-parse.ts'
import { parseRecallIntent } from '../src/engine/recall-parse.ts'
import { subQueries } from '../src/engine/retrieve.ts'
import { pendingYields } from '../src/engine/pending-yield.ts'
import { browserSafeHeaders, browserFetchUrl } from '../src/engine/http-json.ts'
import { GOLD_EXPECT } from '../src/engine/eval/corpus.ts'
import { decisionForEval, PRE_ROUTER, routeForEval } from '../src/engine/eval/route-eval.ts'

/** @typedef {'help'|'discount'|'ordinal'|'tv'|'film'|'fan'|'plug'|'here'|'fuel'|'poi'|'transit'|'drive'|'device'|'pc'|'maps'|'memory'|'shopping'|'birthday'|'home'|'leave'|'brief'|'holiday'|'calendar'|'alarm'|'timer'|'reminder'|'tools'|'eye'|'weather'|'news'|'research'|'search'|'llm'|'warn'|'blitzer'|'chat-folder'|'watch-price'|'amazon'|'recall'|'ferien'|'fx'|'sport'|'sky'|'chess'|'hud'|'trace'|'digest'|'outlook'|'taxi'|'wont'|'identity'} Route */

/** @param {string} text @param {{ weatherLast?: import('../src/engine/weather-parse.ts').WeatherLast | null }} [ctx] */
function route(text, ctx = {}) {
  return routeForEval(text, ctx)
}

/** Erwartungen kommen aus der einen Korpus-Quelle (Sprint 249). */
/** @type {Record<string, Route>} */
const EXPECT = GOLD_EXPECT

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

/**
 * Der Router darf einen dokumentierten Prompt nicht mit einer Rückfrage
 * beantworten. `pickRouteFromCtx` verdeckt das (es nimmt die erste Seite),
 * die App fragt aber wirklich zurück — deshalb hier die Entscheidung selbst.
 */
const spurious = []
for (const prompt of TEST_PROMPTS) {
  if (PRE_ROUTER.has(EXPECT[prompt])) continue
  const pick = decisionForEval(prompt)
  if (pick.kind === 'ask') spurious.push(`${JSON.stringify(prompt)} → ${pick.a} oder ${pick.b}`)
}
assert.equal(spurious.length, 0, `Router fragt statt zu handeln:\n  ${spurious.join('\n  ')}`)

const follow = route('und morgen?', {
  weatherLast: { kind: 'place', place: 'München', when: 'today', focus: 'general' },
})
assert.equal(follow, 'weather', 'und morgen? nach Wetter-Kontext')
assert.equal(route('und die Luft', { weatherLast: { kind: 'here', when: 'today', focus: 'general' } }), 'weather')
assert.equal(
  route('in 20 Minuten Milch', {
    weatherLast: { kind: 'place', place: 'München', when: 'today', focus: 'general' },
  }),
  'reminder',
  'Erinnerung nach Wetter nicht als Orts-Wetter',
)
assert.equal(
  route('Termin morgen 15 Uhr Zahnarzt', {
    weatherLast: { kind: 'here', when: 'today', focus: 'general' },
  }),
  'calendar',
  'Termin nach Wetter nicht als Wetter-Nachfrage',
)
assert.equal(pendingYields('ja', 'taxi'), false)
assert.equal(pendingYields('nein', 'maps'), false)
assert.equal(pendingYields('Wo ist die ISS?', 'taxi'), true, 'Taxi-Nachfrage gibt an ISS ab')
assert.equal(pendingYields('FIFA starten', 'maps'), true, 'Nummer-Frage gibt an PC ab')
assert.equal(pendingYields('Todo: Testdebug Milch', 'taxi'), true)
assert.equal(parseSpotifyIntent('Spiele Musik')?.kind, 'resume')
assert.deepEqual(browserSafeHeaders({ 'User-Agent': 'Jarvis', Accept: 'application/json' }), { Accept: 'application/json' })
assert.equal(browserFetchUrl('https://de.wikipedia.org/w/api.php'), 'https://de.wikipedia.org/w/api.php')
assert.equal(shouldProxyWebHost('html.duckduckgo.com'), true)
assert.equal(shouldProxyWebHost('de.wikibooks.org'), true)
assert.equal(shouldProxyWebHost('www.themealdb.com'), true)
assert.equal(shouldProxyWebHost('evil.example'), false)
assert.equal(wikiCompanyHint('Kannst du den bip von Deutschland in einer Tabelle darstellen?'), 'Bruttoinlandsprodukt Deutschland')
assert.equal(route('PC QR scannen'), 'pc')
assert.equal(route('PC koppeln'), 'pc')
assert.equal(route('TV an'), 'tv')
assert.equal(route('Mach den Fernseher an'), 'tv')
assert.equal(route('Fernseher einschalten'), 'tv')
assert.equal(route(normalizeUtterance('fanseher an')), 'tv')
assert.equal(route(normalizeUtterance('t v an')), 'tv')
assert.equal(route('nächste Bahn nach Heilbronn'), 'transit')
assert.equal(route('Tagesschau'), 'news')
assert.equal(route('nächster Feiertag'), 'holiday')
assert.equal(route('Wetter heute'), 'weather')
assert.equal(route('Nachricht an Bro ich bin da'), 'maps')
assert.equal(route('Nach Heilbronn'), 'drive')
assert.equal(route('Was trinke ich gerne?'), 'memory')
assert.equal(route('Mag ich Döner?'), 'memory')
assert.equal(route('Mag ich noch Döner?'), 'memory')
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
assert.equal(route('Gibt es Blitzer?'), 'blitzer')
assert.equal(route('Baustellen auf der Strecke'), 'blitzer')
assert.equal(route('Spiel Amazon Music'), 'amazon')
assert.equal(route('Leg den Chat in Arbeit'), 'chat-folder')
assert.equal(route('Instanudeln'), 'watch-price')
assert.equal(route('Was weißt du über den Zahnarzt'), 'recall')
assert.equal(route('Was weißt du über mich'), 'memory')
assert.equal(route('kein Kaffee mehr'), 'memory')
assert.equal(route('Wie wird das Wetter?'), 'weather')
assert.equal(route('Öffne CarPlay'), 'drive')
assert.ok(parseBlitzerIntent('Gibt es Blitzer?'))
assert.equal(parseBlitzerIntent('Gibt es Unwetter?'), null)
assert.ok(parseAmazonMusicIntent('Spiel Amazon Music'))
assert.equal(parseFolderIntent('Leg den Chat in Arbeit')?.folder, 'arbeit')
assert.equal(parseWatchPriceIntent('Instanudeln')?.query, 'Instanudeln')
assert.equal(parseRecallIntent('Was weißt du über den Zahnarzt'), 'Zahnarzt')
assert.equal(parseRecallIntent('Was weißt du über mich'), null)
assert.ok(filterTopics('Key').includes('keys'))
assert.ok(filterTopics('Steckdose').includes('geraete'))
assert.ok(filterTopics('löschen').includes('daten'))
assert.ok(filterTopics('Blitzer').includes('alltag'))
assert.ok(filterTopics('Amazon').includes('geraete'))
assert.equal(parseAmazonMusicIntent('Spiel Amazon Prime'), false)
assert.equal(parseFolderIntent('Chat nach Privat legen')?.folder, 'privat')
assert.ok(subQueries('Termin beim Zahnarzt').length >= 2)
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

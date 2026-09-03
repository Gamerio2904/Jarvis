/**
 * Intensive Alltag-8.0 tests: Katalog-Router, Parser-Matrizen, Settings-Suche, ehrliche Leere.
 */
import assert from 'node:assert/strict'
import { TEST_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { pickRouteFromCtx } from '../src/engine/route-pick.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { parseBlitzerIntent, BLITZER_NO_ROUTE } from '../src/engine/blitzer-parse.ts'
import { hazardsInCorridor, sampleRouteCoords } from '../src/engine/blitzer-geo.ts'
import { parseAmazonMusicIntent } from '../src/engine/amazon-parse.ts'
import { parseFolderIntent, normalizeFolder } from '../src/engine/folder-parse.ts'
import { parseWatchPriceIntent } from '../src/engine/watch-price-parse.ts'
import { parseSpotifyIntent } from '../src/engine/spotify-parse.ts'
import { parsePlaceRecall } from '../src/engine/places-parse.ts'
import { isLiveLookup, guardResearchReply, corpusSaysNowFree, isStaleFeeNow } from '../src/engine/research-parse.ts'
import { filterTopics, resolveTopic, SETTINGS_TABS, visibleSettingsTabs } from '../src/engine/settings-ia.ts'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { parseWarnIntent } from '../src/engine/warn.ts'

function route(text, ctx = {}) {
  return pickRouteFromCtx({
    conversationId: 'test',
    text: normalizeUtterance(text),
    lastTool: ctx.lastTool || '',
    lastMedium: '',
    inDrive: Boolean(ctx.inDrive),
    weatherLast: ctx.weatherLast ?? null,
  })
}

const SKIP_TOOLS = new Set(['smalltalk'])
const FOLLOW_UP = /^(ja bitte|nein|mach du das an)\s*[.!?]*$/i

let catalog = 0
for (const g of TEST_COPY_GROUPS.filter((x) => /Alltag|Recall 7\.31/i.test(x.title))) {
  for (const i of g.items) {
    const want = i.expect?.tool
    if (!want || i.expect?.skipIf || SKIP_TOOLS.has(want) || FOLLOW_UP.test(i.text.trim())) continue
    const text = normalizeUtterance(i.text)
    if (want === 'research') {
      assert.equal(isLiveLookup(text), true, `${g.title} / ${i.label}: Live-Lookup`)
      const id = route(text)
      assert.ok(!id || id === 'research', `${g.title} / ${i.label}: ${text} → ${id}, nicht research`)
      catalog += 1
      continue
    }
    const got = route(text)
    assert.equal(got, want, `${g.title} / ${i.label}: „${i.text}“ → ${got}, erwartet ${want}`)
    catalog += 1
  }
}

assert.equal(parseBlitzerIntent('Gibt es Blitzer?')?.want, 'camera')
assert.equal(parseBlitzerIntent('Gibt’s Blitzer?')?.want, 'camera')
assert.equal(parseBlitzerIntent('Radarfallen auf der Strecke')?.want, 'camera')
assert.equal(parseBlitzerIntent('Baustellen auf der Strecke')?.want, 'works')
assert.equal(parseBlitzerIntent('Blitzer und Baustellen')?.want, 'both')
assert.equal(parseBlitzerIntent('Gibt es Unwetter?'), null)
assert.equal(parseBlitzerIntent('Polizist hinter der Kurve'), null)
assert.equal(parseWarnIntent('Gibt es Unwetter?') != null, true)
assert.equal(route('Gibt es Blitzer?'), 'blitzer')
assert.equal(route('Gibt es Blitzer?', { inDrive: true }), 'blitzer')
assert.equal(route('Baustellen auf der Strecke'), 'blitzer')
assert.notEqual(route('Gibt es Unwetter?'), 'blitzer')

assert.equal(parseAmazonMusicIntent('Spiel Amazon Music'), true)
assert.equal(parseAmazonMusicIntent('Amazon Musik an'), true)
assert.equal(parseAmazonMusicIntent('Spiel Amazon Prime'), false)
assert.equal(parseAmazonMusicIntent('Mach Netflix an'), false)
assert.equal(parseSpotifyIntent('Spiel Amazon Music'), null)
assert.equal(parseSpotifyIntent('Spiel Helene Fischer')?.kind, 'play')
assert.equal(route('Spiel Amazon Music'), 'amazon')
assert.notEqual(route('Spiel Amazon Prime'), 'amazon')

assert.equal(normalizeFolder('Büro'), 'arbeit')
assert.equal(parseFolderIntent('Leg den Chat in Arbeit')?.folder, 'arbeit')
assert.equal(parseFolderIntent('Leg den Chat nach Arbeit')?.folder, 'arbeit')
assert.equal(parseFolderIntent('Chat nach Privat legen')?.folder, 'privat')
assert.equal(parseFolderIntent('Leg den Chat in Büro')?.folder, 'arbeit')
assert.equal(parseFolderIntent('Chat-Ordner')?.kind, 'list')
assert.equal(parseFolderIntent('Ordner Arbeit')?.folder, 'arbeit')
assert.equal(parseFolderIntent('Chats unter Privat')?.folder, 'privat')
assert.equal(route('Leg den Chat in Arbeit'), 'chat-folder')
assert.equal(route('Chat-Ordner'), 'chat-folder')

assert.equal(parseWatchPriceIntent('Instanudeln')?.kind, 'on')
assert.equal(parseWatchPriceIntent('Nudeln im Angebot')?.query, 'Instanudeln')
assert.equal(parseWatchPriceIntent('Sag Bescheid wenn Instanudeln im Angebot sind')?.query, 'Instanudeln')
assert.equal(parseWatchPriceIntent('Preiswache aus')?.kind, 'off')
assert.equal(parseWatchPriceIntent('Preiswachen')?.kind, 'list')
assert.equal(parseWatchPriceIntent('Preiswache für Instanudeln aus')?.kind, 'off')
assert.equal(route('Instanudeln'), 'watch-price')
assert.equal(route('Preiswache aus'), 'watch-price')
assert.equal(route('Sag Bescheid wenn Instanudeln im Angebot sind'), 'watch-price')

assert.ok(filterTopics('Key').includes('keys'))
assert.ok(filterTopics('Steckdose').includes('geraete'))
assert.ok(filterTopics('löschen').includes('daten'))
assert.ok(filterTopics('Blitzer').includes('alltag'))
assert.ok(filterTopics('Ordner').includes('alltag'))
assert.ok(filterTopics('Preiswache').includes('alltag'))
assert.ok(filterTopics('Amazon').includes('geraete'))
assert.ok(filterTopics('Probe').includes('tests'))
assert.equal(resolveTopic('cloud'), 'keys')
assert.equal(resolveTopic('haus'), 'geraete')
assert.equal(resolveTopic('gefahr'), 'daten')
assert.equal(resolveTopic('debug'), 'tests')
assert.equal(resolveTopic('sprache'), 'stimme')
assert.equal(SETTINGS_TABS.length, 8)
assert.equal(visibleSettingsTabs('Key').includes('keys'), true)
assert.ok(visibleSettingsTabs('xyz-gibt-es-nicht').length === 8)

assert.equal(route('Wo ist London'), 'hud')
assert.equal(parseHudIntent('Wo ist London')?.kind, 'pin')
assert.equal(parsePlaceRecall('Wo ist London'), null)
assert.equal(route('Wo liegt Kiew'), 'hud')
assert.equal(route('Lage aus'), 'hud')
assert.equal(route('Lage an'), 'hud')
assert.equal(route('Öffne CarPlay'), 'drive')
assert.equal(route('Zeig Street View von London'), 'wont')
assert.equal(route('Wie wird das Wetter?'), 'weather')
assert.equal(isLiveLookup('Muss man Eintritt zahlen für Venedig'), true)
assert.ok(!route('Muss man Eintritt zahlen für Venedig'))
assert.equal(corpusSaysNowFree('Aktuell keine Eintrittsgebühr, Testphase beendet'), true)
assert.equal(isStaleFeeNow('Für die Altstadt zahlt man 5 € Tagesgast.'), true)
assert.match(
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
  /aktuell nicht/i,
)

assert.match(BLITZER_NO_ROUTE, /Keine Route/)
assert.match(BLITZER_NO_ROUTE, /Mobil/)
assert.doesNotMatch(BLITZER_NO_ROUTE, /Polizist steht/)
assert.match(BLITZER_NO_ROUTE, /unvollständig|OSM/)

const line = [
  [9.18, 48.96],
  [9.181, 48.961],
  [9.22, 49.14],
]
const sampled = sampleRouteCoords(line)
assert.equal(sampled[0][0], 9.18)
assert.equal(sampled.at(-1)?.[0], 9.22)
const near = hazardsInCorridor([{ lat: 48.96, lon: 9.18, kind: 'camera', line: 'Säule' }], line)
const far = hazardsInCorridor([{ lat: 52.5, lon: 13.4, kind: 'camera', line: 'Berlin' }], line)
assert.equal(near.length, 1)
assert.equal(far.length, 0)

console.log(`ok alltag ${catalog} katalog + parser + settings + corridor`)

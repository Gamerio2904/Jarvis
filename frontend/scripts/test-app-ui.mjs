// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(String(k), String(v))
  },
  removeItem: (k) => {
    mem.delete(String(k))
  },
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}

const { parseAppIntent } = await import('../src/engine/app-parse.ts')
const { handleApp, APP_FLAG_TOOL } = await import('../src/engine/app.ts')
const { UI_ACTION_IDS, UI_DOCK_IDS, UI_OVERLAY_IDS, flagFromTitle } = await import('../src/engine/ui-action.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { loadSettings, saveSettings, getPending, clearPending } = await import('../src/engine/store.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const { normalizeUtterance } = await import('../src/engine/utterance.ts')
const { parseWatchlistIntent } = await import('../src/engine/watchlist-parse.ts')
const { unassignedCopyTitles, groupsForLane, searchProbeGroups, displayGroupTitle, PROBE_LANES, PINNED_PROBE_LANE, initialProbeLane } = await import('../src/engine/probe-lanes.ts')

assert.deepEqual([...UI_ACTION_IDS], ['overlay.open', 'overlay.close', 'settings.tab', 'settings.set', 'dock.go'])
assert.ok(UI_DOCK_IDS.includes('watchlist'))
assert.ok(UI_OVERLAY_IDS.includes('watchlist'))
assert.equal(UI_OVERLAY_IDS.includes('drive'), false)
assert.equal(flagFromTitle('Research'), 'research_opt_in')
assert.equal(flagFromTitle('research_enabled'), null)

assert.equal(parseAppIntent('Mach WLAN aus'), null)
assert.equal(parseAppIntent('Klick auf Speichern'), null)
assert.equal(parseAppIntent('Tipp Screenshot'), null)

assert.deepEqual(parseAppIntent('Einstellungen zu'), { kind: 'ui', action: { id: 'overlay.close' } })
assert.deepEqual(parseAppIntent('Overlay zu'), { kind: 'ui', action: { id: 'overlay.close' } })
assert.deepEqual(parseAppIntent('Folie zu'), { kind: 'ui', action: { id: 'overlay.close' } })
assert.deepEqual(parseAppIntent('Fertig'), { kind: 'ui', action: { id: 'overlay.close' } })

assert.equal(parseAppIntent('Zeig Chat')?.action?.dock, 'chat')
assert.equal(parseAppIntent('Zurück zum Chat')?.action?.dock, 'chat')
assert.equal(parseAppIntent('Zeig Lage')?.action?.dock, 'lage')
assert.equal(parseAppIntent('Öffne Filme')?.action?.dock, 'watchlist')
assert.equal(parseAppIntent('Zeig Filme')?.action?.dock, 'watchlist')
assert.deepEqual(parseAppIntent('Kalender zu'), { kind: 'ui', action: { id: 'overlay.close' } })
assert.equal(parseAppIntent('Öffne Einstellungen Musik')?.action?.topic, 'musik')
assert.equal(parseAppIntent('Öffne Debug')?.action?.overlay, 'debug')

const research = parseAppIntent('Research an')
assert.equal(research?.action?.id, 'settings.set')
assert.equal(research?.action?.flag, 'research_opt_in')
assert.equal(research?.action?.on, true)
assert.equal(parseAppIntent('Gemini aus')?.action?.flag, 'gemini_enabled')
assert.equal(parseAppIntent('Werkzeug-Vorschlag aus')?.action?.flag, 'tool_propose')

assert.equal(parseAppIntent('Öffne Watchliste'), null, 'Watchliste bleibt beim Watchlist-Agenten')
assert.equal(parseWatchlistIntent('Öffne Watchliste')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne Lieblinge')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Mach das Overlay für die Filme auf'), null)
assert.equal(parseWatchlistIntent('Öffne das overlay'), null)
assert.equal(pickRoute('Öffne Watchliste'), 'watchlist')
assert.equal(pickRoute('Öffne Lieblinge'), 'watchlist')
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')
assert.equal(pickRoute('Einstellungen zu'), 'app')
assert.equal(pickRoute('Kalender zu'), 'app')
assert.equal(pickRoute('Zeig Filme'), 'app')
assert.equal(pickRoute('Zeig Chat'), 'app')
assert.equal(pickRoute('Research an'), 'app')
assert.equal(pickRoute('Zeig Erdbeben'), 'hud')
assert.equal(pickRoute('Spiel Dune Film'), 'tv')
assert.equal(pickRoute('Milch auf die Einkaufsliste'), 'shopping')
assert.equal(pickRoute('Timer 8 Minuten Nudeln'), 'timer')
assert.equal(pickRoute('Fernseher an'), 'tv')
assert.equal(pickRoute('Wetter heute'), 'weather')
assert.equal(pickRoute('Öffne das overlay'), 'drive')
assert.equal(pickRoute('Lage an'), 'hud')
assert.equal(pickRoute('Kalender'), 'calendar')
assert.equal(pickRoute('WLAN an'), 'device')
assert.equal(pickRoute('Mach WLAN aus'), 'device')
assert.equal(pickRoute('WLAN aus'), 'device')
assert.equal(pickRoute('Mach das Overlay für die Filme auf'), null)
assert.notEqual(pickRoute('Mach das Overlay für die Filme auf'), 'drive')
assert.notEqual(pickRoute('Mach das Film-Overlay auf'), 'drive')
assert.equal(routeForEval('Hallo Jarvis.'), 'llm')
assert.equal(pickRoute('Watchliste: Dune'), 'watchlist')
assert.equal(pickRoute('klick auf Speichern'), 'pc')
assert.equal(pickRoute('Zeig Kameras'), 'wont')
assert.equal(pickRoute('WHOIS example.com'), 'osint')
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')

assert.equal(normalizeUtterance('open settings'), 'open Einstellungen')
assert.match(normalizeUtterance('open favorites'), /Lieblinge/)

const conv = 'app-ui'
await clearPending(conv)
{
  const opened = await handleApp(conv, 'Öffne Debug')
  assert.match(opened.reply || '', /Tests ist offen/)
  assert.equal(opened.tool?.action, 'debug')
  assert.equal(opened.tool?.result?.topic, 'debug')
}
const asked = await handleApp(conv, 'Research an')
assert.match(asked.reply || '', /Soll ich\?/)
assert.equal(loadSettings().research_opt_in, false)
assert.equal((await getPending(conv))?.tool, APP_FLAG_TOOL)

const wrote = await handleApp(conv, 'Research an')
assert.match(wrote.reply || '', /Research an/)
assert.equal(loadSettings().research_opt_in, true)
assert.equal(await getPending(conv), undefined)

const geminiWas = loadSettings().gemini_enabled
const deny = await handleApp(conv, 'Gemini aus')
assert.match(deny.reply || '', /Soll ich\?/)
assert.equal(loadSettings().gemini_enabled, geminiWas)

const theme = await handleApp(conv, 'Orange-Akzent')
assert.match(theme.reply || '', /orange/i)
assert.equal(loadSettings().hud_accent, 'amber')

saveSettings({ research_opt_in: false })
await clearPending(conv)
const askedAgain = await handleApp(conv, 'Research an')
assert.match(askedAgain.reply || '', /Soll ich\?/)
const diverted = await runDirectorTurn(conv, 'Mach WLAN aus')
assert.match(diverted.hit?.reply || '', /Handy|WLAN|Schalter|nicht geöffnet/)
assert.equal(await getPending(conv), undefined)
await runDirectorTurn(conv, 'ja')
assert.equal(loadSettings().research_opt_in, false, 'ein späteres Ja darf Research nicht nachziehen')

assert.equal(PROBE_LANES.length, 8)
assert.deepEqual(
  PROBE_LANES.map((l) => l.id),
  ['heute', 'gespraech', 'alltag', 'geraet', 'lage', 'probe', 'story', 'lauf'],
)
assert.equal(PINNED_PROBE_LANE, 'lauf')
assert.equal(initialProbeLane('lauf', 'heute'), 'lauf')
assert.equal(initialProbeLane(undefined, 'lage'), 'lage')
assert.equal(initialProbeLane(undefined, 'v9'), 'heute')
assert.equal(initialProbeLane(undefined, null), 'heute')
assert.deepEqual(unassignedCopyTitles(), [])
assert.ok(groupsForLane('heute').some((g) => g.title === '18.7 Fläche'))
assert.ok(groupsForLane('heute').some((g) => g.title === '18.8 Debug & Termin'))
assert.ok(groupsForLane('heute').some((g) => g.title === 'Körper-13'))
assert.ok(groupsForLane('gespraech').some((g) => g.title === 'Smalltalk'))
assert.ok(groupsForLane('story').some((g) => /18\.7/.test(g.title)))
assert.ok(groupsForLane('story').some((g) => /18\.8/.test(g.title)))
assert.ok(groupsForLane('story').some((g) => /Seit 1\.16/.test(g.title)))
assert.equal(groupsForLane('lauf').length, 0)
assert.equal(displayGroupTitle('🟢 18.7 Fläche der Reihe nach'), '18.7 Fläche der Reihe nach')
assert.equal(displayGroupTitle('Randfälle (kommen so kaum vor)'), 'Randfälle')
assert.ok(searchProbeGroups('Öffne Watchliste').some((g) => g.items.some((i) => i.text === 'Öffne Watchliste')))

{
  const { readFileSync } = await import('node:fs')
  const { dirname, join } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const app = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/App.tsx'), 'utf8')
  assert.match(app, /capture="environment"/)
  assert.match(app, /Foto oder Datei/)
  assert.match(app, /className="eye-pick"/)
  assert.match(app, /\n\s+Kamera\n/)
  assert.match(app, /\n\s+Datei\n/)
  assert.match(app, /onDocFile\(file, 'camera'\)/)
  assert.match(app, /onDocFile\(file, 'file'\)/)
}

console.log('OK test-app-ui')

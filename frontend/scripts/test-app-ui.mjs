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
const { loadSettings, getPending, clearPending } = await import('../src/engine/store.ts')
const { normalizeUtterance } = await import('../src/engine/utterance.ts')
const { parseWatchlistIntent } = await import('../src/engine/watchlist-parse.ts')

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
assert.equal(parseWatchlistIntent('Mach das Overlay für die Filme auf')?.kind, 'show')
assert.equal(parseWatchlistIntent('Mach das Film-Overlay auf')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne das overlay'), null)
assert.equal(pickRoute('Öffne Watchliste'), 'watchlist')
assert.equal(pickRoute('Öffne Lieblinge'), 'watchlist')
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')
assert.equal(pickRoute('Einstellungen zu'), 'app')
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
assert.equal(pickRoute('Mach das Overlay für die Filme auf'), 'watchlist')
assert.equal(pickRoute('Mach das Film-Overlay auf'), 'watchlist')
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

console.log('OK test-app-ui')

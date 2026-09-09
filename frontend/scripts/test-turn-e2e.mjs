/**
 * Ein echter Zug durch den Director — Timer, Lage und Lautstärke.
 * Das sind die Funktionen, die der PO als „geht nicht" gemeldet hat.
 * Nur lokale Agenten, kein Netz.
 */
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

// Der Store hält Einstellungen in localStorage und Termine in IndexedDB. In
// Node schluckt er beide Fehler und liest immer die Defaults — damit wäre kein
// Zustand über einen Zug hinweg prüfbar. Die Shims machen ihn sichtbar.
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => void mem.set(k, String(v)),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size
  },
}

const { runDirectorTurn } = await import('../src/engine/director.ts')
const { loadSettings, saveSettings, APP_VERSION } = await import('../src/engine/store.ts')
const { openTimers } = await import('../src/engine/timers.ts')

const CONV = 'e2e'
const turn = (text) => runDirectorTurn(CONV, text)

// --- Der Store hält wirklich ---------------------------------------------
saveSettings({ last_place: 'Ingersheim' })
assert.equal(loadSettings().last_place, 'Ingersheim', 'localStorage-Shim greift')
assert.equal(loadSettings().version, APP_VERSION)

// --- Timer: ansagen ist nicht stellen ------------------------------------
// Gemeldet war „er sagt zwar an aber ist nicht". Also nicht die Antwort
// prüfen, sondern den gestellten Timer.
const before = (await openTimers()).length
const timer = await turn('Timer 5 Minuten Eier')
assert.ok(timer.hit?.reply, 'Timer antwortet')
assert.equal(timer.hit.lastTool, 'timer', `Timer landet beim Timer-Agenten, nicht bei ${timer.hit.lastTool}`)

const timers = await openTimers()
assert.equal(timers.length, before + 1, 'der Timer steht wirklich in der Liste')
const due = new Date(timers[timers.length - 1].due_at).getTime()
assert.ok(due > Date.now() + 4 * 60_000, 'fällig in ~5 Minuten')
assert.ok(due < Date.now() + 6 * 60_000, 'nicht in ferner Zukunft')
assert.match(timers[timers.length - 1].title || '', /Eier/i, 'das Etikett trägt den Anlass')

// Die Uhrzeit in der Antwort steht ohne Leerzeichen nach dem Doppelpunkt —
// „20: 48" war eine echte Beschwerde.
assert.doesNotMatch(timer.hit.reply, /\d:\s+\d/, 'keine Lücke in der Uhrzeit')

// Nachfragen darf den Timer nicht verdoppeln.
const asked = await turn('Wie lange läuft der Timer?')
assert.equal(asked.hit?.lastTool, 'timer')
assert.equal((await openTimers()).length, before + 1, 'Nachfragen stellt keinen zweiten Timer')

// Stoppen räumt Liste und laufenden In-App-Timer auf. Bleibt der Timer offen,
// hängt dieser Prozess am Ende — genau das prüft der Lauf mit.
const stop = await turn('Timer stopp')
assert.equal(stop.hit?.lastTool, 'timer')
assert.equal((await openTimers()).length, 0, 'nach dem Stoppen läuft kein Timer mehr')

// --- Lage: die Kugel muss auch aufgehen ----------------------------------
saveSettings({ hud_force: false, hud_view: 'tiles', hud_hidden: true })
const lage = await turn('Öffne die Weltkugel')
assert.equal(lage.hit?.lastTool, 'hud', `Weltkugel landet beim HUD, nicht bei ${lage.hit?.lastTool}`)

const afterLage = loadSettings()
assert.equal(afterLage.hud_view, 'globe', 'die Ansicht steht auf Globus')
assert.equal(afterLage.hud_force, true, 'die Lage ist aufgeschaltet')
assert.equal(afterLage.hud_hidden, false, 'und nicht gleichzeitig versteckt')

// --- Lautstärke: eine Antwort, keine Rückfrage ---------------------------
saveSettings({ last_medium: '', last_step_tool: '', drive_mode: false })
const vol = await turn('Lautstärke 50')
assert.notEqual(vol.hit?.lastTool, 'clarify', 'Lautstärke fragt nicht zurück')
assert.equal(vol.policyAsk ?? null, null, 'und landet auch nicht im Rückfrage-Pfad')

// --- Gescheiterter Schreib-Agent sagt es, statt ans Modell zu fallen -----
const { agentById } = await import('../src/engine/agents/catalog.ts')
const calendar = agentById('calendar')
const realExecute = calendar.execute
try {
  calendar.execute = async () => {
    throw new Error('Kalender kaputt')
  }
  const broken = await turn('Termin morgen 10 Uhr Zahnarzt')
  assert.ok(broken.hit?.reply, 'ein gescheiterter Schreib-Agent antwortet trotzdem')
  assert.match(broken.hit.reply, /nichts geändert/i, 'und sagt, dass nichts passiert ist')
  assert.equal(broken.hit.lastTool, 'calendar')
} finally {
  calendar.execute = realExecute
}

// Ein lesender Agent darf weiter ans Modell fallen — dort gibt es nichts zu
// behaupten, und das Modell kann die Frage noch beantworten.
const news = agentById('news')
const realNews = news.execute
try {
  news.execute = async () => {
    throw new Error('Netz weg')
  }
  const read = await turn('Zeig mir die Nachrichten')
  assert.equal(read.hit, null, 'Lesen fällt weiter durch')
} finally {
  news.execute = realNews
}

// --- Kaputte Einstellungen werden nicht still überschrieben --------------
{
  const key = 'jarvis_settings_v13'
  const good = mem.get(key)
  mem.set(key, '{kaputt')
  const fallback = loadSettings()
  assert.equal(fallback.last_place, '', 'kaputter Eintrag liest die Defaults')
  assert.equal(mem.get(`${key}.broken`), '{kaputt', 'die Rohdaten sind zur Seite gelegt')
  mem.delete(`${key}.broken`)
  // Ein Array ist auch kein gültiges Objekt.
  mem.set(key, '["a"]')
  assert.equal(loadSettings().last_place, '')
  assert.equal(mem.get(`${key}.broken`), '["a"]')
  mem.set(key, good)
}

// --- Fachwissen sickert nicht in fremde Fragen --------------------------
// Gemeldet war „die Antworten ergeben keinen Sinn": ein Fachwissen-Paket
// landete im Prompt für Kugel-, Timer- und Lautstärke-Fragen. Die Sperre ist
// jetzt strukturell — gibt es einen Agenten, gibt es kein Fachwissen.
const { retrievePacks } = await import('../src/engine/knowledge-retrieve.ts')

const pack = {
  id: 'p1',
  topic: 'tokio-buero',
  title: 'Büro Tokio',
  aliases: ['Tokio', 'Chefin'],
  summary: 'Das Büro in Tokio.',
  claims: [
    { id: 'c1', text: 'Sabine Busse leitet das Büro in Tokio.', source_urls: [], user_ok: true },
    { id: 'c2', text: 'Das Büro hat 40 Plätze.', source_urls: [], user_ok: true },
  ],
  sources: [],
  origin: 'user',
  taught_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_ok: true,
}

const { pickRoute } = await import('../src/engine/route-pick.ts')
const { knowledgeBlock } = await import('../src/engine/knowledge.ts')

// Direkt gefragt darf das Paket kommen — sonst wäre Fachwissen nutzlos.
assert.equal(retrievePacks('Was steht bei uns zu Tokio?', [pack]).length, 1)
assert.ok(knowledgeBlock([pack], 'Was steht bei uns zu Tokio?').includes('Tokio'))
assert.equal(pickRoute('Was steht bei uns zu Tokio?'), 'pack', 'und landet beim Fachwissen-Agenten')

// Die Sperre in chat.ts lautet: gibt es einen Agenten, gibt es kein
// Fachwissen im Prompt. Diese Befehle müssen also alle einen Agenten haben.
for (const ask of ['Öffne die Weltkugel', 'Timer 5 Minuten', 'Lage an', 'Wo liegt Tokio', 'Lautstärke 50']) {
  assert.ok(pickRoute(ask), `${JSON.stringify(ask)} braucht einen Agenten, sonst greift die Sperre nicht`)
}

// Ein Paket aus einem älteren Schema darf den Prompt-Bau nicht werfen.
const legacy = { ...pack, claims: undefined }
assert.equal(knowledgeBlock([legacy], 'Was steht bei uns zu Tokio?'), '', 'altes Paket wirft nicht')

console.log(`test:turn-e2e ok — Timer steht, Kugel offen, Lautstärke ohne Rückfrage (${APP_VERSION})`)

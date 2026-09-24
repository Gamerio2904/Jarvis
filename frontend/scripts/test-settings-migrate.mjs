// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'

/**
 * Sprint 256 — Feldschutz und Migrationsschritte.
 *
 * Zwei Fragen stellt dieser Test: verliert eine Migration ein Feld, und kostet
 * ein kaputtes Feld mehr als sich selbst. Beides wird gegen einen echten
 * Hausstand geprueft, nicht gegen ein Beispielobjekt mit drei Schluesseln.
 */

const SETTINGS_KEY = 'jarvis_settings_v13'

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
}

const { APP_VERSION, DEFAULT_SETTINGS, loadSettings, saveSettings } = await import('../src/engine/store.ts')
const { MIGRATIONS, SETTINGS_REV, dropFields, migrateSettings, renameField } = await import(
  '../src/engine/settings-migrate.ts'
)
const { ENUM_FIELDS, coerceSettings } = await import('../src/engine/settings-schema.ts')

function put(obj) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj))
}

function reset() {
  localStorage.clear()
}

// ---------------------------------------------------------------- Schritte

assert.ok(MIGRATIONS.length > 0, 'ohne Schritte ist der Mechanismus nicht belegt')
assert.equal(SETTINGS_REV, MIGRATIONS.length)
assert.equal(
  new Set(MIGRATIONS.map((m) => m.id)).size,
  MIGRATIONS.length,
  'jeder Schritt braucht einen eigenen Namen',
)
assert.equal(DEFAULT_SETTINGS.settings_rev, SETTINGS_REV, 'ein frischer Hausstand steht auf dem Stand von heute')

/** Umbenennen war der Anlass fuer diesen Sprint: der Wert muss mitkommen. */
assert.deepEqual(renameField({ alt: 'wert', rest: 1 }, 'alt', 'neu'), { neu: 'wert', rest: 1 })
assert.deepEqual(renameField({ rest: 1 }, 'alt', 'neu'), { rest: 1 }, 'ohne Altfeld kein leeres Neufeld')
assert.deepEqual(
  renameField({ alt: 'alt', neu: 'neu' }, 'alt', 'neu'),
  { neu: 'neu' },
  'ein schon gesetztes Zielfeld ist der neuere Wert',
)
assert.deepEqual(renameField({ alt: false }, 'alt', 'neu'), { neu: false }, 'false ist ein Wert, kein Nichts')
assert.deepEqual(dropFields({ a: 1, b: 2 }, ['b', 'fehlt']), { a: 1 })

// Schritt 001 raeumt die beiden toten Felder weg, sonst nichts.
const vorher = { routing_mode: 'on-device', brain_gemini_roles_tts: true, gemini_api_key: 'geheim' }
const nachher = migrateSettings(vorher)
assert.deepEqual(nachher.applied, MIGRATIONS.map((m) => m.id))
assert.equal('routing_mode' in nachher.value, false)
assert.equal('brain_gemini_roles_tts' in nachher.value, false)
assert.equal(nachher.value.gemini_api_key, 'geheim', 'der Schluessel ueberlebt jede Migration')
assert.equal(nachher.value.settings_rev, SETTINGS_REV)
assert.equal(vorher.routing_mode, 'on-device', 'die Eingabe wird nicht veraendert')

// Zweiter Lauf: kein Schritt mehr, gleiches Ergebnis.
const zweimal = migrateSettings(nachher.value)
assert.deepEqual(zweimal.applied, [])
assert.deepEqual(zweimal.value, nachher.value, 'Migration ist wiederholbar ohne Nebenwirkung')

// Ein hoeherer Stand kommt von einer neueren Fassung und wird nicht zurueckgedreht.
const neuer = migrateSettings({ settings_rev: SETTINGS_REV + 5, gemini_api_key: 'k' })
assert.deepEqual(neuer.applied, [])
assert.equal(neuer.value.settings_rev, SETTINGS_REV + 5)
// Unsinn im Stand-Feld heisst: von vorne, nicht ueberspringen.
assert.deepEqual(migrateSettings({ settings_rev: 'viele' }).applied, MIGRATIONS.map((m) => m.id))

// -------------------------------------------------- echter Hausstand 16.1.1

/** Fuer jedes Feld ein Wert, der sich vom Default unterscheidet. */
function abweichend(key, value) {
  const erlaubt = ENUM_FIELDS[key]
  if (erlaubt) return erlaubt.find((v) => v !== value) ?? value
  if (key === 'version') return '16.1.1'
  if (value === null) return true
  if (typeof value === 'boolean') return !value
  if (typeof value === 'number') return value + 7
  return `${key}-wert`
}

const hausstand = { routing_mode: 'cloud', brain_gemini_roles_tts: false }
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  if (key === 'settings_rev') continue
  hausstand[key] = abweichend(key, value)
}

reset()
put(hausstand)
const geladen = loadSettings()
for (const key of Object.keys(DEFAULT_SETTINGS)) {
  if (key === 'settings_rev' || key === 'version') continue
  // Lage-Falle aus 15.3.1: hud_force ohne Session = Blackscreen. Schritt 002.
  if (key === 'hud_force' || key === 'hud_hidden') continue
  assert.deepEqual(geladen[key], hausstand[key], `Migration hat ${key} verloren`)
}
assert.equal(geladen.hud_force, false, 'Lage-Falle: hud_force einmalig aus')
assert.equal(geladen.hud_hidden, true, 'Lage-Falle: hud_hidden einmalig zu')
assert.equal(geladen.version, APP_VERSION, 'die Fassung wird gestempelt')
assert.equal(geladen.settings_rev, SETTINGS_REV)
assert.equal('routing_mode' in geladen, false, 'totes Feld ist weg')
assert.equal('brain_gemini_roles_tts' in geladen, false)

// Wer die Lage danach wieder aufspannt, behaelt sie auch ueber ein Update.
// Vorher hing der Notausgang an „Version hat sich geaendert" und drehte den
// Schalter bei jedem Sideload zurueck, ohne ein Wort.
saveSettings({ hud_force: true, hud_hidden: false })
put({ ...JSON.parse(localStorage.getItem(SETTINGS_KEY)), version: '17.0.0' })
const nachUpdate = loadSettings()
assert.equal(nachUpdate.hud_force, true, 'der Schalter des Nutzers ueberlebt den Versionsprung')
assert.equal(nachUpdate.hud_hidden, false)
assert.equal(nachUpdate.version, APP_VERSION)

// Der gewanderte Stand wird auch geschrieben, sonst laeuft die Migration ewig.
saveSettings({})
const roh = JSON.parse(localStorage.getItem(SETTINGS_KEY))
assert.equal(roh.settings_rev, SETTINGS_REV)
assert.equal('routing_mode' in roh, false)
assert.equal(roh.gemini_api_key, hausstand.gemini_api_key)

// ------------------------------------------------------------- Feldschutz

reset()
put({
  ...hausstand,
  tv_port: 'achttausend', // Zahl kaputt
  gemini_enabled: 'ja', // Bool kaputt
  hud_view: 'kugel', // Wert ausserhalb des Vorrats
  ui_theme: 42,
  presence_port: Number.NaN, // wird als null serialisiert
  last_place: { alt: 'Objekt statt Text' },
})
const geflickt = loadSettings()
assert.equal(geflickt.tv_port, DEFAULT_SETTINGS.tv_port, 'kaputtes Feld faellt auf Default')
assert.equal(geflickt.gemini_enabled, DEFAULT_SETTINGS.gemini_enabled)
assert.equal(geflickt.hud_view, DEFAULT_SETTINGS.hud_view, 'unbekannter Wert wuerde die Oberflaeche leer lassen')
{
  const serie = coerceSettings({ ...DEFAULT_SETTINGS, hud_view: 'serie' }, DEFAULT_SETTINGS)
  assert.equal(serie.value.hud_view, 'serie', 'Serie-Netz bleibt im Vorrat')
}
assert.equal(geflickt.ui_theme, DEFAULT_SETTINGS.ui_theme)
assert.equal(geflickt.presence_port, DEFAULT_SETTINGS.presence_port)
assert.equal(geflickt.last_place, DEFAULT_SETTINGS.last_place)
// Und der Rest steht noch — das ist der ganze Punkt.
assert.equal(geflickt.gemini_api_key, hausstand.gemini_api_key, 'ein kaputtes Feld kostet nicht den Schluessel')
assert.equal(geflickt.tv_host, hausstand.tv_host)
assert.equal(geflickt.brain_primary, hausstand.brain_primary)
assert.equal(geflickt.home_radius_m, hausstand.home_radius_m)

const bericht = coerceSettings({ tv_port: 'x', gemini_api_key: 'k' }, DEFAULT_SETTINGS)
assert.deepEqual(bericht.repaired, ['tv_port'], 'nur das kaputte Feld wird gemeldet')
assert.equal(bericht.value.gemini_api_key, 'k')
assert.equal(bericht.value.tv_host, DEFAULT_SETTINGS.tv_host, 'fehlende Felder kommen vom Default')

// pc_dashboard_v2 ist absichtlich dreiwertig: null heisst "nicht entschieden".
for (const wert of [null, true, false]) {
  assert.equal(coerceSettings({ pc_dashboard_v2: wert }, DEFAULT_SETTINGS).value.pc_dashboard_v2, wert)
}
assert.equal(
  coerceSettings({ pc_dashboard_v2: 'ja' }, DEFAULT_SETTINGS).value.pc_dashboard_v2,
  DEFAULT_SETTINGS.pc_dashboard_v2,
)

// Unbekannte Schluessel bleiben liegen: wer kurz eine aeltere Fassung
// einspielt, soll seine Felder danach wiederfinden.
assert.equal(coerceSettings({ feld_aus_der_zukunft: 5 }, DEFAULT_SETTINGS).value.feld_aus_der_zukunft, 5)

// --------------------------------------------------- Parken bleibt Ebene 2

reset()
localStorage.setItem(SETTINGS_KEY, '{kaputt')
const nachBruch = loadSettings()
assert.equal(nachBruch.gemini_api_key, DEFAULT_SETTINGS.gemini_api_key)
assert.equal(localStorage.getItem(`${SETTINGS_KEY}.broken`), '{kaputt', 'Rohdaten bleiben zum Retten liegen')

reset()
localStorage.setItem(SETTINGS_KEY, '["liste"]')
assert.equal(loadSettings().tv_port, DEFAULT_SETTINGS.tv_port, 'eine Liste ist kein Hausstand')
assert.equal(localStorage.getItem(`${SETTINGS_KEY}.broken`), '["liste"]')

reset()
console.log(`OK test-settings-migrate — ${MIGRATIONS.length} Schritt(e), ${Object.keys(DEFAULT_SETTINGS).length} Felder`)

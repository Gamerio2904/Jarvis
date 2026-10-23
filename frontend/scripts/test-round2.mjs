import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Runde 2 (18.68.0): Frist-Parser erkennt „nächste Woche" auch falsch
 * geschrieben und legt den Termin in die nächste Woche, Aufgabennamen sind
 * selbstständig formuliert statt 1:1 aus dem Satz, Tag-Befehle ohne Ziel
 * treffen den letzten Eintrag, Server-Start/Verbinden per Satz, und der
 * Hausstand-Merge zieht Startbildschirm-Layout und Bibliothek mit.
 */

const mem = Object.create(null)
globalThis.localStorage = /** @type {any} */ ({
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
})

const { parseLocalDeadline, parseToolIntent, polishTitle, tidyTaskTitle } = await import('../src/engine/tools-parse.ts')
const { parseShopIntent } = await import('../src/engine/shopping-parse.ts')
const { parseIdeaIntent } = await import('../src/engine/idea-parse.ts')
const { parseBackupIntent } = await import('../src/engine/backup.ts')
const { mergeHaus } = await import('../src/engine/server-merge.ts')

const MON = new Date(2026, 9, 19) // Montag, 19.10.2026
const FRI = new Date(2026, 9, 23) // Freitag, 23.10.2026

// 1. „bis freitag nähste woche" — Schreibfehler egal, Termin nächste Woche
const a = parseLocalDeadline('bis freitag nähste woche hausaufgaben in gm machen', FRI)
assert.equal(a.date, '2026-10-30', 'Freitag nächste Woche, auch am Freitag selbst')
assert.equal(a.time, null)
assert.equal(tidyTaskTitle(a.remaining), 'hausaufgaben in gm machen')

const b = parseLocalDeadline('ich muss bis freitag näxte woche hausaufgaben in gm machen', MON)
assert.equal(b.date, '2026-10-30', 'vom Montag aus: Freitag der NÄCHSTEN Woche, nicht dieser')

const c = parseLocalDeadline('am montag kommende woche wohnung putzen', MON)
assert.equal(c.date, '2026-10-26')

// 2. „nächste Woche" ohne Wochentag: Montag der nächsten Woche (relaxed)
const d = parseLocalDeadline('nächste woche hausaufgaben machen', FRI, true)
assert.equal(d.date, '2026-10-26')
assert.equal(tidyTaskTitle(d.remaining), 'hausaufgaben machen')

// 3. „freitag nächste woche" ohne bis/am (relaxed)
const e = parseLocalDeadline('freitag nächste woche team meeting', MON, true)
assert.equal(e.date, '2026-10-30')

// 4. Strict bleibt streng: kein Tag, keine Woche → null
assert.equal(parseLocalDeadline('hausaufgaben machen', FRI), null)
assert.equal(parseLocalDeadline('freitag fliegen wir', MON), null)

// 5. Ganzer Satz → sauberer Name, richtige Frist, kein 1:1-Text
const intent = parseToolIntent('ich muss bis freitag nähste woche hausaufgaben in gm machen')
assert.equal(intent.kind, 'todo_create')
assert.equal(intent.title, 'Hausaufgaben in GM machen')
assert.equal(intent.deadlineDate, '2026-10-30')

const intent2 = parseToolIntent('setzte minecraft auf todoliste')
assert.equal(intent2.kind, 'todo_create')
assert.equal(intent2.title, 'Minecraft', 'kein „Setzte minecraft“')

const intent3 = parseToolIntent('todo: kauf minecraft')
assert.equal(intent3.kind, 'todo_create')
assert.equal(intent3.title, 'Minecraft')

// 6. Tag-Befehle: mit Ziel und ohne Ziel
const tag1 = parseToolIntent('ergänze tag amazon')
assert.equal(tag1.kind, 'tag_add_last')
assert.equal(tag1.tag, 'amazon')

const tag2 = parseToolIntent('tag minecraft mit amazon')
assert.equal(tag2.kind, 'tag_add')
assert.equal(tag2.target, 'auto', 'ohne Zielwort sucht der Handler selbst')
assert.equal(tag2.query, 'minecraft')
assert.equal(tag2.tag, 'amazon')

const tag3 = parseToolIntent('füge tag urlaub zur notiz italien hinzu')
assert.equal(tag3.kind, 'tag_add')
assert.equal(tag3.target, 'note')

const tag4 = parseToolIntent('tag einkaufen')
assert.equal(tag4.kind, 'tag_add_last')
assert.equal(tag4.tag, 'einkaufen')

// 7. Einkauf und Plan fassen Tag-Sätze nicht mehr an
assert.equal(parseShopIntent('ergänze tag amazon'), null)
assert.equal(parseIdeaIntent('ergänze tag amazon'), null)
const shop = parseShopIntent('kauf minecraft')
assert.equal(shop?.kind, 'add')
assert.equal(shop.item, 'Minecraft', 'kein „Kauf minecraft“')
assert.deepEqual(shop.items, ['Minecraft'])

// 8. Server per Satz starten und verbinden
assert.equal(parseBackupIntent('auf gerät 1 starte server'), 'start_server')
assert.equal(parseBackupIntent('starte den hausstand server'), 'start_server')
assert.equal(parseBackupIntent('server starten'), 'start_server')
assert.equal(parseBackupIntent('auf gerät 2 verbinde ich mit server'), 'connect_server')
assert.equal(parseBackupIntent('verbinde mit dem server'), 'connect_server')
assert.equal(parseBackupIntent('mit server verbinden'), 'connect_server')
assert.equal(parseBackupIntent('verbinde das handy mit dem fernseher'), 'sync_unavailable', 'Legacy: „verbinde … handy“ bleibt Kopplungshinweis')
assert.equal(parseBackupIntent('scanne qr code'), 'scan')

// 9. Hausstand-Merge: Bibliothek wandert mit, Layout folgt dem neueren Stand
const row = (id, updated_at) => ({ id, updated_at })
const local = {
  backup_version: 1,
  exported_at: '2026-10-20T10:00:00.000Z',
  stand_at: '2026-10-20T10:00:00.000Z',
  settings: { home_layout_json: '{"cols":4,"cells":[]}', theme_hint: 'dunkel' },
  memory: [],
  reminders: [],
  events: [],
  notes: [],
  todos: [],
  shopping: [],
  library: [row('lib-a', '2026-10-19T09:00:00.000Z')],
}
const remote = {
  backup_version: 1,
  exported_at: '2026-10-21T10:00:00.000Z',
  stand_at: '2026-10-21T10:00:00.000Z',
  settings: { home_layout_json: '{"cols":4,"cells":[{"kind":"folder"}]}' },
  memory: [],
  reminders: [],
  events: [],
  notes: [],
  todos: [row('todo-1', '2026-10-20T12:00:00.000Z')],
  shopping: [],
  library: [row('lib-a', '2026-10-21T09:00:00.000Z'), row('lib-b', '2026-10-21T09:00:00.000Z')],
}
const merged = mergeHaus(local, remote)
assert.equal(merged.backup.library.length, 2, 'Bibliothek kommt beim Vereinigen mit')
assert.equal(merged.backup.library[0].id, 'lib-a')
assert.ok(JSON.stringify(merged.backup.settings.home_layout_json).includes('folder'), 'neueres Ordner-Layout gewinnt')
assert.equal(merged.backup.settings.theme_hint, 'dunkel', 'andere Einstellungen bleiben lokal, Fülllogik unverändert')

// 10. polishTitle: Grundregeln
assert.equal(polishTitle('setzte minecraft'), 'Minecraft')
assert.equal(polishTitle('hausaufgaben in gm machen'), 'Hausaufgaben in GM machen')
assert.equal(polishTitle('mach die hausaufgaben'), 'Hausaufgaben')
assert.equal(polishTitle('einkaufen gehen'), 'Einkaufen gehen')
assert.equal(polishTitle('in kueche putzen'), 'In kueche putzen')

console.log('OK test-round2 — Fristen, Namen, Tags, Server-Sätze, Merge')

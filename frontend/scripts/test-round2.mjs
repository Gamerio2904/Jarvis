/**
 * Round 2/3: Fristen (fuzzy), selbstständige Namen, Tags, Server-Sätze,
 * Merge — plus die neuen Freiheiten aus 18.70.0 (Mehrfachbefehle,
 * übermorgen/in-3-Tagen/Wochenende/Kalenderdaten, Nachfolge-Sätze,
 * Ordnungszahlen bis zwölf, polishTitle-Fälle).
 */
import assert from 'node:assert/strict'

const { parseLocalDeadline, parseToolIntent, polishTitle, tidyTaskTitle } = await import('../src/engine/tools-parse.ts')
const { parseShopIntent } = await import('../src/engine/shopping-parse.ts')
const { parseIdeaIntent } = await import('../src/engine/idea-parse.ts')
const { parseBackupIntent } = await import('../src/engine/backup.ts')
const { mergeHaus } = await import('../src/engine/server-merge.ts')
const { splitIntents } = await import('../src/engine/split-intents.ts')
const { parseOrdinalFollowUp } = await import('../src/engine/ordinal.ts')
const { rewriteFollowUp } = await import('../src/engine/last-step.ts')

const MON = new Date(2026, 9, 19) // Montag, 19.10.2026
const FRI = new Date(2026, 9, 23) // Freitag, 23.10.2026

// 1. „bis freitag nähste woche“ — Schreibfehler egal, Termin nächste Woche
const a = parseLocalDeadline('bis freitag nähste woche hausaufgaben in gm machen', FRI)
assert.ok(a, 'Frist erkannt')
assert.equal(a?.date, '2026-10-30', 'Freitag nächste Woche, auch am Freitag selbst')
assert.equal(a?.time, null)
assert.equal(tidyTaskTitle(a?.remaining || ''), 'hausaufgaben in gm machen')

const b = parseLocalDeadline('ich muss bis freitag näxte woche hausaufgaben in gm machen', MON)
assert.ok(b)
assert.equal(b?.date, '2026-10-30', 'vom Montag aus: Freitag der NÄCHSTEN Woche, nicht dieser')

const c = parseLocalDeadline('am montag kommende woche wohnung putzen', MON)
assert.ok(c)
assert.equal(c?.date, '2026-10-26')

// 2. „nächste Woche“ ohne Wochentag: Montag der nächsten Woche (relaxed)
const d = parseLocalDeadline('nächste woche hausaufgaben machen', FRI, true)
assert.ok(d)
assert.equal(d?.date, '2026-10-26')
assert.equal(tidyTaskTitle(d?.remaining || ''), 'hausaufgaben machen')

// 3. „freitag nächste woche“ ohne bis/am (relaxed)
const e = parseLocalDeadline('freitag nächste woche team meeting', MON, true)
assert.ok(e)
assert.equal(e?.date, '2026-10-30')

// 4. Strict bleibt streng: kein Tag, keine Woche → null
assert.equal(parseLocalDeadline('hausaufgaben machen', FRI), null)
assert.equal(parseLocalDeadline('freitag fliegen wir', MON), null)

// 5. Ganzer Satz → sauberer Name, richtige Frist, kein 1:1-Text
const intent = parseToolIntent('ich muss bis freitag nähste woche hausaufgaben in gm machen')
assert.ok(intent && intent.kind === 'todo_create')
assert.equal(intent && 'title' in intent ? intent.title : '', 'Hausaufgaben in GM machen')
assert.equal(intent && 'deadlineDate' in intent ? intent.deadlineDate : '', '2026-10-30')

const intent2 = parseToolIntent('setzte minecraft auf todoliste')
assert.ok(intent2 && intent2.kind === 'todo_create')
assert.equal(intent2 && 'title' in intent2 ? intent2.title : '', 'Minecraft', 'kein „Setzte minecraft“')

const intent3 = parseToolIntent('todo: kauf minecraft')
assert.ok(intent3 && intent3.kind === 'todo_create')
assert.equal(intent3 && 'title' in intent3 ? intent3.title : '', 'Minecraft')

// 6. Tag-Befehle: mit Ziel und ohne Ziel
const tag1 = parseToolIntent('ergänze tag amazon')
assert.ok(tag1 && tag1.kind === 'tag_add_last')
assert.equal(tag1 && 'tag' in tag1 ? tag1.tag : '', 'amazon')

const tag2 = parseToolIntent('tag minecraft mit amazon')
assert.ok(tag2 && tag2.kind === 'tag_add')
assert.equal(tag2 && 'target' in tag2 ? tag2.target : '', 'auto', 'ohne Zielwort sucht der Handler selbst')
assert.equal(tag2 && 'query' in tag2 ? tag2.query : '', 'minecraft')
assert.equal(tag2 && 'tag' in tag2 ? tag2.tag : '', 'amazon')

const tag3 = parseToolIntent('füge tag urlaub zur notiz italien hinzu')
assert.ok(tag3 && tag3.kind === 'tag_add')
assert.equal(tag3 && 'target' in tag3 ? tag3.target : '', 'note')

const tag4 = parseToolIntent('tag einkaufen')
assert.ok(tag4 && tag4.kind === 'tag_add_last')
assert.equal(tag4 && 'tag' in tag4 ? tag4.tag : '', 'einkaufen')

// 7. Einkauf und Plan fassen Tag-Sätze nicht mehr an
assert.equal(parseShopIntent('ergänze tag amazon'), null)
assert.equal(parseIdeaIntent('ergänze tag amazon'), null)
const shop = parseShopIntent('kauf minecraft')
assert.ok(shop && shop.kind === 'add')
assert.equal(shop && 'item' in shop ? shop.item : '', 'Minecraft', 'kein „Kauf minecraft“')
assert.deepEqual(shop && 'items' in shop ? shop.items : [], ['Minecraft'])

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
const merged = mergeHaus(/** @type {any} */ (local), /** @type {any} */ (remote))
assert.equal(/** @type {any} */ (merged.backup.library)?.length, 2, 'Bibliothek kommt beim Vereinigen mit')
assert.equal(/** @type {any} */ (merged.backup.library)?.[0]?.id, 'lib-a')
assert.ok(JSON.stringify(merged.backup.settings.home_layout_json).includes('folder'), 'neueres Ordner-Layout gewinnt')
assert.equal(/** @type {any} */ (merged.backup.settings)?.theme_hint, 'dunkel', 'andere Einstellungen bleiben lokal, Fülllogik unverändert')

// 10. polishTitle: Grundregeln + 18.70-Fälle
assert.equal(polishTitle('setzte minecraft'), 'Minecraft')
assert.equal(polishTitle('hausaufgaben in gm machen'), 'Hausaufgaben in GM machen')
assert.equal(polishTitle('mach die hausaufgaben'), 'Hausaufgaben')
assert.equal(polishTitle('einkaufen gehen'), 'Einkaufen gehen')
assert.equal(polishTitle('in kueche putzen'), 'In kueche putzen')
assert.equal(polishTitle('an oma denken'), 'An Oma denken', 'Oma ist ein Wort, kein Kürzel')
assert.equal(polishTitle('folie ein'), 'Folie ein', 'Partikel am Ende klein')
assert.equal(polishTitle('mama anrufen wegen geburtstag'), 'Mama anrufen wegen geburtstag', 'ganzes Todo, kein Stumm-Fragment')

// 11. I2: neue Frist-Formen (parseToolIntent rechnet ab dem realen Heute)
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const over = parseToolIntent('ich muss übermorgen öl wechseln')
assert.ok(over && over.kind === 'todo_create')
assert.equal(over && 'deadlineDate' in over ? over.deadlineDate : '', plusDays(2), 'übermorgen')
// „… holen“ bleibt bewusst Einkauf (Posten „Öl“), kein Todo — Design von 18.68.
assert.equal(parseToolIntent('ich muss übermorgen öl holen'), null)

const inDays = parseLocalDeadline('in drei tagen kraut rumstehn', MON, true)
assert.ok(inDays)
assert.equal(inDays?.date, '2026-10-22', 'in drei Tagen')

const inWeeks = parseLocalDeadline('in 2 wochen zahnarzt', MON)
assert.ok(inWeeks)
assert.equal(inWeeks?.date, '2026-11-02', 'in 2 Wochen')

const weekend = parseLocalDeadline('am wochenende grillen', MON)
assert.ok(weekend)
assert.equal(weekend?.date, '2026-10-24', 'Wochenende = Samstag')

const monthEnd = parseLocalDeadline('bis ende des monats steuern', MON)
assert.ok(monthEnd)
assert.equal(monthEnd?.date, '2026-10-31', 'Monatsende')

const calDate = parseLocalDeadline('am 14.03. pcr test', MON)
assert.ok(calDate)
assert.equal(calDate?.date, '2027-03-14', 'Kalenderdatum ohne Jahr rutscht in die Zukunft')

const nextMon = parseLocalDeadline('nächsten montag wohnung', MON, true)
assert.ok(nextMon)
assert.equal(nextMon?.date, '2026-10-26', 'nächsten Montag')

const halb = parseLocalDeadline('bis freitag um halb 5 zimmer', MON)
assert.ok(halb)
assert.equal(halb?.date, '2026-10-23')
assert.equal(halb?.time, '16:30', 'halb 5 als Deadline = nachmittags')

const abends = parseLocalDeadline('bis freitag abends bücher', MON)
assert.ok(abends)
assert.equal(abends?.time, '19:00', 'Tageszeit abends = 19 Uhr')

// 12. I4/P2: Mehrfachbefehle
const multi = splitIntents('kauf Milch und ruf Mama an')
assert.deepEqual(multi, ['kauf Milch', 'ruf Mama an'])
const cal1 = splitIntents('erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt')
assert.deepEqual(cal1.length, 1, 'Zeit nach dem Komma ist Fortsetzung, kein Split')

// 13. I3/P3: Nachfolge- und Korrektur-Sätze
const shift = rewriteFollowUp('verschieb das auf morgen', {
  last_step_tool: 'calendar',
  last_step_title: 'Zahnarzt',
  last_step_when: '2026-10-20T10:00',
  last_step_utterance: 'erstell einen termin morgen 10 uhr zahnarzt',
})
assert.equal(shift, 'Termin morgen Zahnarzt', 'Nachfolger baut einen kompletten Termin')

const replace = rewriteFollowUp('ersetze zahnarzt durch arzt', {
  last_step_tool: 'todo',
  last_step_title: 'Zahnarzt',
  last_step_utterance: 'todo zahnarzt',
})
assert.equal(replace, 'ändere das todo zahnarzt auf arzt', 'Großschreibung macht der Parser danach')

const wieEben = rewriteFollowUp('wie eben', {
  last_step_tool: 'research',
  last_step_title: 'Wetter Rom',
  last_step_utterance: 'wetter rom',
})
assert.equal(wieEben, 'wetter rom')

const korrektur = rewriteFollowUp('nein, ich meinte doch dienstag', {
  last_step_tool: 'calendar',
  last_step_title: 'Zahnarzt',
  last_step_utterance: 'erstell einen termin freitag 15 uhr zahnarzt',
})
assert.equal(korrektur, 'erstell einen termin dienstag 15 uhr zahnarzt', 'Korrektur tauscht den Tag')

// 14. P6: Ordnungszahlen bis zwölf
assert.deepEqual(parseOrdinalFollowUp('das fünfte'), { index: 4, del: false })
assert.deepEqual(parseOrdinalFollowUp('lösche das zwölfte'), { index: 11, del: true })
assert.deepEqual(parseOrdinalFollowUp('nummer 9'), { index: 8, del: false })
assert.deepEqual(parseOrdinalFollowUp('das vierte'), { index: 3, del: false }, 'alter Bestand bleibt')

console.log('OK test-round2 — Fristen, Namen, Tags, Server-Sätze, Merge, Freiheiten 18.70')

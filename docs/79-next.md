# 79 — Debug-Rollback, Termin-Erinnerungen, Debug-Download **CODE** (`18.8`)

PO 2026-09-21, drei Wünsche in einer Schiene:

1. Wenn der **automatische Debug-Lauf fertig** ist (oder Stop), soll
   alles rückgängig, was der Lauf an Timern, Terminen, Listen und
   ähnlichem angelegt hat.
2. Bei einem **Termin** soll Jarvis fragen, **wann** er erinnern soll.
   Eine oder mehrere Fristen gehen — z. B. 24 Stunden davor **und**
   2 Stunden davor.
3. Den **Debug-Chat kann man nicht herunterladen** — der Knopf wird
   nicht angezeigt bzw. schreibt auf dem Handy keine Datei.

**Ist:** App-Code **`18.7.0`** auf `main`. Sideload **`18.4.4`**
(versionCode `180404`). Debug-Lauf schreibt **echt**
(`DEBUG_START_WARN`). Nach Fertig bleiben Timer/Termine/Einkauf liegen.
Kalender legt den Termin sofort an und plant **eine** Notify zum Start.
Download sitzt nur im `DebugPanel` auf der Spur **Lauf**; das Dock hat
Tests/Stop, kein Download. `saveBlob` klickt ohne `appendChild` — auf
Android-WebView oft tot.

**Dieses Dokument ist CODE** in App `18.8.0`. Sprints **323–330**. `18.5`
(Stimme/TV, 301–306) bleibt PLAN daneben. **Nicht parallel**. Sideload
bleibt `18.4.4` bis zum nächsten Bund mit SDK. Prompt-Titel: 329 hat neu
geschnitten (§7). `GOLD_EXPECT`-Keys = `TEST_PROMPTS`.
`PROBE_COPY_GROUPS`.length 13. `unassignedCopyTitles()` leer.

---

## 0. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Rollback | Snapshot der Haus-Listen **vor** `startDebugRun`. Restore bei Fertig, Stop und Abbruch. Keys/Tokens unangetastet. Debug-Gespräch bleibt (Download). |
| Was zurück | reminders (Timer/Wecker/Erinnerung), events, shopping, todos, notes, memory, watch/ideas, pending, Notify-IDs. Settings-Flags, die der Lauf umlegen darf. Taschenlampe während des Laufs wieder aus. |
| Was nicht | Physisches TV/PC/Taxi-Ja. Anruf/SMS die der PO selbst bestätigt hat. API-Keys. Conversations außer dem, was der Lauf in Listen schrieb. |
| Termin-Frage | Nach `create` (Chat und GUI): „Wann soll ich Sie erinnern?“ Parser nimmt 1–5 Offsets (`N Stunden/Minuten/Tage davor`, `und` / `,` / `;`). Vergangene Offsets erwähnt er und lässt sie weg. |
| Debug-Lauf + Frage | Während `debugSnapshot().running` **keine** Rückfrage — sonst hängt die Sequenz. Start-Notify bleibt, Rollback räumt sie. |
| Download | Knopf am **DebugChatDock** ab dem ersten Turn **und** nach Fertig. Native `saveToDownloads`, Browser `appendChild`+click wie Hausstand. Panel-Knopf bleibt auf Spur Lauf. |

Jarvis testet das Haus, räumt danach hinter sich auf. Ein Termin ohne
Antwort zur Frist bleibt angelegt — ohne Extra-Erinnerung außer dem,
was schon zum Start geplant war, bis der Nutzer Fristen nennt oder
ablehnt.

---

## 1. Ist (Code)

### 1.1 Debug-Lauf schreibt echt

`debug-session.ts` `startDebugRun`: neues Gespräch, Prompt für Prompt,
kein Snapshot, kein Restore. Warnung:

> Timer, Wecker, Kalender, Einkauf, Steckdose, Taschenlampe laufen wirklich.

`finally` stoppt nur FGS und Keep-Screen. Listen, Events, Notifies
bleiben. Katalog (`test-copy.ts`): Timer, Wecker, Termin morgen 15 Uhr
Zahnarzt, Einkauf, Taschenlampe, Multi-Auftrag mit Timer.

### 1.2 Download unsichtbar / tot

| Fläche | Was da ist | Lücke |
|--------|------------|-------|
| `DebugChatDock` | Tests, Stop. Portal `z-index` 50. Sichtbar wenn `running` oder (`live` und Turns) | **Kein Download.** Nach Start schließen die Settings (`onDebugBegin`) — der sichtbare Chat hat keinen Knopf. |
| `DebugPanel` | „Chat herunterladen“ / Historie | Nur Settings → Tests → Spur **Lauf** (`ProbeShelf` `lane === 'lauf'`). Andere Spuren blenden das Panel aus. `disabled={!snap.turns.length}`. |
| `saveBlob` | `<a download>` + `a.click()`, **ohne** `appendChild` | Android-WebView oft kein File. Hausstand (`backup.ts`) macht `saveToDownloads` **dann** `appendChild`+click. |

„Wird nicht angezeigt“ = Dock ohne Knopf + Panel hinter der Spur Lauf.
„Kann man nicht runterladen“ = selbst der Panel-Knopf schreibt auf dem
Handy oft nichts.

### 1.3 Termin = eine Notify zum Start

`CalendarEvent`: `id, title, start_at, place, source_conversation_id,
created_at, updated_at`. Kein `remind_offsets`.

`handleCalendar` `create` und `createEventFromGui`: `addEvent` sofort,
`scheduleNotify` einmal `notifyIdFromKey('evt-' + id)` **zum**
`start_at`. Keine Frage, kein zweiter Zeitpunkt, kein „24 Stunden
davor“.

`calendar-parse.ts`: create/list/delete/open. Kein Intent für Fristen.

### 1.4 Nachfrage-Muster, das wir wiederverwenden

`ToolPending` (`store.ts`): `tool, action, args, preview` pro Gespräch.
Settings-Writes und Anruf/SMS warten so auf Ja. Kalender-Create setzt
heute **kein** Pending — der Termin liegt, bevor jemand Fristen nennen
kann.

---

## 2. Forschung (Internet)

Geprüft 2026-09-21.

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| [Android CalendarContract.Reminders](https://developer.android.com/reference/android/provider/CalendarContract.Reminders) | Mehrere Zeilen `MINUTES` vor `DTSTART`, `METHOD` Alert | Offsets als Minuten **vor** `start_at`, N Notifies | System-Kalender-OAuth, Cloud-Sync |
| [Google Calendar Benachrichtigungen](https://support.google.com/calendar/answer/37242) | Mehrere Erinnerungen pro Termin (z. B. 1 Tag + 10 min) | 1–5 Fristen, Default-Frage statt stiller Annahme | Google-Konto |
| Apple EventKit `EKAlarm` | Mehrere Alarme, negativer Offset = davor | Dieselbe Semantik | EventKit-Bridge |
| [Capacitor Filesystem / Mediastore](https://capacitorjs.com/docs/apis/filesystem) | Native Downloads, nicht Blob-Klick im WebView | `saveToDownloads` wie Hausstand | Zweite Share-Lib |
| Chromium/WebView `<a download>` | Klick ohne Tree → oft kein Download; `appendChild` vor click ist der übliche Fix | Gleicher Pfad wie `shareOrDownloadBackup` | Cloud-Upload des Debug-Chats |
| Snapshot/Restore (DB-Transaktion, Test-Fixtures) | Vorher-Bild, nachher revert; Keys getrennt | Listen-Snapshot, nicht Settings-Dump | Wipe der ganzen IndexedDB |
| Clarify-after-write (Assistants, Kalender-Bots) | Event anlegen, dann Fristen erfragen, nicht blockierend im Debug | Pending `calendar.remind` | LLM wählt die Minuten |

**Urteil:** Rollback ist ein Listen-Snapshot, kein Hausstand-Export.
Fristen sind Minuten vor Start, parser-first. Download folgt dem
Hausstand-Pfad und liegt dort, wo der Nutzer den Lauf **sieht** (Dock).

---

## 3. Lieferbild

### 3.1 Debug-Rollback (Must)

Vor dem ersten Turn, nach erfolgreichem `onStartChat`:

```
snapshot = {
  reminders, events, shopping, todos, notes, memory,
  watchlist, ideas, pending,
  notify_ids: alle reminder.notify_id + evt-* + timer-keys,
  settings_flags: nur Allowlist-Writes die der Lauf treffen kann
    (research_opt_in, gemini_enabled, tool_propose, … — **keine** Keys),
  flashlight: Ist-Zustand
}
```

Nicht im Snapshot: `gemini_api_key`, `tankerkoenig_api_key`,
`omdb_api_key`, Tokens, MAC, `last_debug_json`, Conversations/Messages.

Nach Fertig / Stop / Catch **dieselbe** Restore-Funktion:

1. `replaceStore` der Listen auf das Snapshot-Bild.
2. `cancelNotify` für IDs, die im Ist sind und im Snapshot fehlen.
3. `scheduleNotify` nur wieder, wenn der Snapshot eine offene Frist
   hatte, die der Lauf gelöscht hat (selten; Default: der Lauf **legt
   an**, löscht kaum Bestehendes — Cancel der neuen IDs reicht).
4. Taschenlampe auf Snapshot-Zustand.
5. Allowlist-Flags auf Snapshot.
6. Pending des Debug-Gesprächs leeren, damit keine hängende
   „Wann erinnern?“-Frage den nächsten Chat stiehlt.
7. Debug-Gespräch **behalten**. Turns bleiben für Download.

Warn-Text nachziehen: Writes laufen wirklich **während** des Laufs,
danach räumt Jarvis sie weg. Ein zweiter Start überschreibt den
Snapshot nicht, solange noch restored wird.

Idempotent: Restore zweimal = gleiches Haus. Snapshot nur wenn
`phase === 'starting'` und Token noch gilt.

### 3.2 Debug-Chat Download (Must)

`DebugChatDock`:

- Sichtbar sobald `live` und (`running` oder `turns.length`).
- Knopf **Chat herunterladen** ab dem ersten Turn, auch nach Fertig.
- Gleiche Aktion wie Panel: JSON + TXT (`downloadDebug`).
- Disabled nur solange `!turns.length`.
- Stop bleibt. Tests öffnet Settings → Tests → Spur Lauf.

`downloadDebug` / `downloadHistory`:

1. Native: `saveToDownloads(name, text)` (wie Hausstand).
2. Sonst Browser: `appendChild` → `click` → `remove`, Object-URL
   später revoken.
3. Kein `a.click()` ohne Tree.

Panel-Knöpfe bleiben. Spur Lauf ändert ihren Titel nicht
(`TEST_COPY_GROUPS`).

### 3.3 Termin-Erinnerungen (Must)

Nach erfolgreichem `create` (Chat):

> Termin: Zahnarzt, morgen 15 Uhr. Wann soll ich Sie erinnern?
> Zum Beispiel 24 Stunden davor und 2 Stunden davor — oder „am Termin“ /
> „keine extra Erinnerung“.

Pending `calendar` / `remind_offsets` mit `event_id`. Nächster Satz im
selben Gespräch:

| Satz | Wirkung |
|------|---------|
| `24 Stunden davor und 2 Stunden davor` | zwei Offsets |
| `eine Stunde davor, 15 Minuten davor` | zwei Offsets |
| `am Termin` / `zum Termin` / `dann` | nur Start (heutiges Verhalten) |
| `keine Erinnerung` / `nicht erinnern` | Start-Notify **cancel**, Feld leer |
| `in 10 Minuten` ohne „davor“ | **nicht** als Offset — das bleibt Timer/Erinnerung; Pending fällt, Termin bleibt mit Start-Notify |
| Ablenkung (Wetter, neuer Befehl) | Pending fällt (wie Soll-ich). Termin bleibt, Start-Notify bleibt |

Parser (eigene kleine Funktion in `calendar-parse.ts` oder
`remind-parse.ts`):

- `(\d+|ein[e]?|zwei|…)\s*(minute[n]?|stunde[n]?|tag(?:en)?)\s*(davor|vorher|vor\s+dem\s+termin)`
- Mehrere Treffer durch `und` / `,` / `;` / `sowie`.
- Cap **5**, Duplikate mergen, sortiert groß→klein.
- Offset ≥ `start_at - now` → skip + ehrliche Erwähnung
  („2 Tage davor ist schon vorbei, ich erinnere 2 Stunden davor.“).
- Kein LLM für die Minuten.

Speicher: `CalendarEvent.remind_offsets_min: number[]` (Minuten vor
Start, 0 = am Termin). Notifies:

- `evt-{id}` bleibt 0-Minuten / Start, wenn 0 in der Liste oder Default
  vor der Antwort.
- `evt-{id}-m{min}` für jedes `min > 0`.
- Löschen eines Termins cancelt alle.

GUI (`Calendar.tsx` nach Speichern): dieselbe Frage als Chips
`24 h` / `2 h` / `1 h` / `15 min` / `am Termin` / `keine` — Mehrfachwahl
dann Speichern. Kein zweites Overlay-System.

Während Debug-Lauf: Create wie heute (eine Start-Notify), **keine**
Frage, Rollback nimmt Event + Notify mit.

---

## 4. Sätze (Gold)

```
Termin morgen 15 Uhr Zahnarzt
```

Reply enthält die Frage nach den Fristen. Termin steht schon im
Kalender.

```
24 Stunden davor und 2 Stunden davor
```

Zwei Notifies, Bestätigung mit beiden Zeiten. Gold-Key nur wenn der
Satz **nach** der Frage kommt — Execute hängt ihn an `TEST_PROMPTS` /
`GOLD_EXPECT` **und** in eine Copy-Gruppe ohne Gruppentitel-Rename.

```
Termin morgen 9 Uhr Teammeeting Gebäude C1
```

Unverändert Kalender-Create (bestehender Gold-Key). Execute darf den
Expect-Tool nicht auf `reminder` ziehen.

Debug (manuell, nicht Gold-Rename):

```
Start Lauf mit Timer + Kalender → Fertig → kein neuer Timer, kein
Zahnarzt-Termin, Taschenlampe aus, Debug-Chat noch da, Download am Dock
schreibt JSON+TXT.
```

Won’t-Sätze bleiben: `Mach WLAN aus`, Anruf/SMS ohne Ja.

---

## 5. Won’t in `18.8`

- Hausstand-Export als Rollback (Keys würden mitwandern oder fehlen).
- Debug-Gespräch löschen.
- Cloud-Kalender, ICS-Import, Google/Apple-Sync (Parking).
- Mehr als 5 Fristen. Relative „wenn ich losgehe“-Erinnerung am Termin
  (bleibt Losgehen-Tool).
- Frage im Debug-Lauf (blockiert die Sequenz).
- Auto-Ja auf Anruf/SMS/Taxi im Lauf.
- TV/Steckdose physisch „zurück“ — nur App-Listen und Taschenlampe.
- Gold-Keys nur in `REGRESS_EXPECT`.
- Offset-Satz allein in `TEST_PROMPTS` (braucht die Frage davor).
- Neue APK in diesem PLAN versprechen. `18.5` mitziehen.
- Computer-Use, LLM-Organizer, e5 in `pickRoute`.

---

## 6. Probe (nach 330)

```
Termin morgen 15 Uhr Zahnarzt
→ Frage nach Erinnerung. Kalender hat den Termin.
24 Stunden davor und 2 Stunden davor
→ zwei Fristen plus oder statt Start, bestätigt.
keine Erinnerung
→ nach einem zweiten Termin: keine extra Notify.
GUI: Speichern → Chips, 2 h + 15 min, übernehmen → zwei Notifies.

Debug: Start (Timer + Kalender-Kategorie). Dock sichtbar.
Nach erstem Turn: Download am Dock aktiv.
Fertig: Download schreibt Datei (PC: Browser-Downloads; Handy:
Downloads/). Haus: keine Test-Timer, kein Test-Zahnarzt.
Stop mittendrin: bisherige Writes weg, Turns bleiben, Download geht.
Settings → Tests → andere Spur: Dock-Download bleibt, Panel nur auf Lauf.

Einstellungen → Tests: Kategorien ohne V2/V8/8.34. Spur Probe beginnt
mit Memory-10, 13 Packs. Suche findet Zahnarzt und Watchliste.
unassignedCopyTitles leer. GOLD_EXPECT-Keys = TEST_PROMPTS.

WLAN aus / Klick Speichern → Won’t wie 18.7.
18.5-Sätze (Fernseher an Diagnose) unverändert, nicht in dieser Schiene.
```

---

## 7. Prompt-Pakete (Must, 329–330)

PO 2026-09-21: Pakete neu räumen, alle Prompts in **sinnvolle
Kategorien**, erweitern.

**Schnitt** (Debug-Klickboxen = `TEST_COPY_GROUPS`):

| Spur | Gruppen |
|------|---------|
| Heute | 18.8 Debug & Termin, 18.7 Fläche, Körper-13, Flächen-12 |
| Gespräch | Smalltalk, Gedächtnis, Memory-10, Naive Fragen, Gesicht & Hausstand |
| Alltag | Einkauf, Tag & Hilfe, Timer Wecker Erinnerung, Kalender & Losgehen, Fahren & Spotify, Leute Anruf SMS, Tanke POI Bahn, Alltagskette, Alltag Extra, Randfälle |
| Gerät | Uhr & Gerät, Einstellungen, Fernseher & Film, Haus, PC, Foto Notiz Dokument, Fachwissen-11 |
| Lage | Ort, Wetter, Welt & Lage, Research Nachrichten Feiertag, Screenshots |
| Probe | 13 Packs, Memory-10 zuerst, Alltagsnamen statt V1–V9 |
| Story | bestehende Storylines plus 18.8 der Reihe nach |
| Lauf | Debug-Panel, keine Copy-Gruppen |

Versionstitel (V2–V9, Alltag 8.34, Kaputt 6.50, Bühne & Hirn, Screenshot-
Bugs) gehen in die Domäne. **Jeder bisherige Prompt-Text bleibt** irgendwo
im Katalog (`allTestCopyTexts`). `PROBE_COPY_GROUPS`.length bleibt 13,
Titel neu. `GOLD_EXPECT`-Keys = `TEST_PROMPTS`.

# 38 — Haus-Stand: Backup + Autokorrektur (`4.46`) **PLAN**

PO 2026-08-27: Nach APK-Neuinstall (falsche Signatur / Deinstall) sind Keys, Erinnerungen, Nummern weg. Export → ein Tippen Import = gleicher Stand. Dazu: Tippfehler in **Schreiben** und **Sprache**, Jarvis merkt falsche Wörter.

Code jetzt: **`3.18.1`**. Daten sitzen in **WebView**: `localStorage` Key `jarvis_settings_v13`, IndexedDB `jarvis-ondevice` (conversations, messages, memory, notes, todos, pending, research_audits, reminders, events, shopping). Deinstall **löscht beides**. GGUF (OPFS) ist groß — nicht im JSON.

Alltagskette: [`36-next.md`](./36-next.md). Diese Schiene ist **MUST vor dem nächsten Sideload**.

## Warum

Sideload mit anderem Keystore → Android verlangt Deinstall → Hausstand weg. S5.2 (`0.10.1` NAS-Backup) gilt **nicht** für On-Device. Es gibt **keinen** Export im Code (`SettingsScreen` speichert nur lokal).

„Immer synchronisiert“ = **derselbe Stand nach Import**, nicht ein Jarvis-Server. Datei liegt bei Ihnen (Downloads, Teilen nach Drive). Kein Cloud-Zwang.

## Ist

| Thema | Stand |
|-------|--------|
| Settings inkl. `gemini_api_key`, `groq_api_key`, `tankerkoenig_api_key`, `omdb_api_key`, `pc_token`, Spotify-Tokens, `plugs_json` | `loadSettings` / `saveSettings` |
| Kontakte/Nummern | Memory `category: 'contact'` |
| Erinnerungen, Kalender, Notizen, Todos, Einkauf | IDB-Stores |
| Chats | IDB conversations + messages |
| Chat-Composer | `textarea` ohne `lang`/`spellCheck` |
| Key-Felder | `spellCheck={false}` — **so lassen** |
| Sprache | `repairSpeech` (Orte, Netflix, …) + `pickHeard` (STT-Alts) |
| Android Auto-Backup | Manifest in diesem Repo nicht gesetzt; WebView-IDB oft **nicht** im Auto-Backup |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Format | Eine JSON-Datei `jarvis-haus-YYYYMMDD.json`, Versionfeld `backup_version`. |
| Inhalt Default | Settings (Keys!) + memory + reminders + events + notes + todos + shopping + plugs. **Optional Häkchen:** Chats. **Nie:** GGUF, `pending`, flüchtiges `last_*` außer Keys/Hosts. Ab Face-CODE: `face` + TTS-Stimmen mitexportieren ([`39-next.md`](./39-next.md)). |
| Export | Einstellungen → **Hausstand** → Teilen/Speichern (Android Share + Download). Vor Deinstall den Satz zeigen. |
| Import | **Ein** Datei wählen → Vorschau (Anzahl Keys gesetzt, N Kontakte, N Erinnerungen) → **Überschreiben ja**. Merge-Modus v1 unnötig (verdirbt Keys). |
| Sync | Kein Jarvis-Backend. Wer Drive will, teilt die Datei selbst. |
| Geheimnisse | Banner: Datei enthält API-Keys. Nicht in Chat-Transcript. Nicht nach Git. |
| Autokorrektur Schreiben | Composer `lang="de"` `spellCheck={true}`. Zusätzlich Jarvis-Wörterbuch: Tool-Wörter + Memory-Namen in `repairSpeech`, **nach** Absenden, vor Parser. |
| Autokorrektur Sprache | `pickHeard` um Memory-Treffer erweitern; REPAIRS wachsen. Bei zwei nahen Tools **eine** Rückfrage („Bar oder Bahn?“). |
| Bahn vs Bar | 1 Buchstabe — **kein** blindes Levenshtein auf alles. Nur wenn der Rest des Satzes den Parser entscheidet, oder Rückfrage. |
| Key-Felder | weiter `spellCheck={false}`, keine „Korrektur“ von Tokens. |
| Router | Backup/Import ist Settings-UI, kein Chat-Tool. Repair bleibt `utterance.ts` / `heard.ts`. |

## Research

### `4.46.0` Backup-Spike

1. Capacitor: Share + Filesystem vs. `<input type=file>` + Blob-Download (WebView reicht oft).  
2. Ob `allowBackup=true` nach **Deinstall + anderer Signatur** überhaupt restauriert — Erwartung: **nein**. Deshalb File-Export Pflicht.  
3. Größe: Chats können MB sein — Default ohne Messages, Option an.

**Done wenn:** ein Probe-JSON auf dem Emulator rund.

### `4.47.0` Autokorrektur-Spike

1. Welche STT-Alts `listen()` schon liefert (`alts` in `voice.ts`).  
2. Gold: `Barn`/`Bar`, `Taxsi`, `Kalnader`, `Steckose`, `Heilbron`.  
3. Keine Korrektur in Gemini-Key-Input.

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`4.46.0`** | Research Backup | **PLAN** |
| **`4.47.0`** | Research Tippfehler | **PLAN** |
| **`4.48.0`** | Export Teilen/Download, Banner Keys | geplant |
| **`4.49.0`** | Import ein Tippen, Confirm, IDB+Settings schreiben, Erinnerungen neu schedulen (`scheduleNotify`) | geplant |
| **`4.50.0`** | Composer DE-Spellcheck; `repairSpeech` + Memory-Namen; Chat-Tipp: eine Rückfrage bei Bar/Bahn | geplant |
| **`4.51.0`** | Stimme: `pickHeard` + Kontakte; Gold | geplant |
| **`4.52.0`** | Sideload **mit** Hausstand-Thema in Settings | geplant |

## Settings-UI

Thema **Hausstand**: Export, Import, letzter Export-Zeitpunkt, Hinweis Deinstall.

Chat: `Einstellungen exportieren` darf den Share-Sheet öffnen (Register-Eintrag `backup`, sideEffect read) — oder nur UI. Weniger `if` in `chat.ts`.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/backup.ts` **neu** | serialize / apply |
| `SettingsScreen.tsx` | Thema Hausstand |
| `store.ts` | getAll-Stores, nach Import `saveSettings` |
| `reminders.ts` / native notify | Alarme nach Import neu setzen |
| `utterance.ts` / `heard.ts` | Wörterbuch |
| `App.tsx` | textarea `lang="de"` `autoCorrect="on"` `spellCheck` |
| Tests | Roundtrip Fixture ohne echte Keys in Git (Platzhalter) |

## Probe

1. Keys + Mama-Nummer + Erinnerung setzen → Export → App-Daten löschen → Import → Tanke-Key und Anruf Mama da, Wecker klingelt wieder.  
2. Composer unterstreicht Tippfehler; `nächste Barn` → Bar oder Rückfrage, nicht Bahn.  
3. Gemini-Feld wird nicht „korrigiert“.  
4. Import ohne Confirm ändert nichts.

## Won’t

Jarvis-Cloud-Sync, iCloud, automatisches Mailen der Keys, Encryption-at-rest Pflicht in v1 (Datei selbst schützen: User). Embeddings für Tippfehler. Autokorrektur die Befehle in ihr Gegenteil dreht (Bahn↔Bar ohne Kontext).

Sprint: [`sprint-113.md`](./sprints/sprint-113.md).

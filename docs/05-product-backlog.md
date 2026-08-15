# 05 — Product Backlog

Priorisiertes Backlog. IDs stabil halten; Status aktualisieren.

**Aktuell:** On-Device `0.13.1`, offline nach dem Modell-Download. NAS/TV/Research-Netz sind nicht im Pull. Siehe [`13-on-device.md`](./13-on-device.md).

**Status-Legende:** `idea` · `ready` · `in_sprint` · `done` · `parked`

**MoSCoW:** Must / Should / Could / Won’t (für aktuellen Horizont)

---

## Epics

| ID | Epic | Phase | Kurzbeschreibung |
|----|------|-------|------------------|
| E0 | Persona & Gesprächsqualität | 0–1 | Charakter, Stil, Abnahmekriterien Smalltalk |
| E1 | Local Runtime | 2 | On-Device wllama + GGUF-Cache (`0.13.x`) |
| E2 | Jarvis Core Chat | 1–2 | Engine, Persona, Kurzgedächtnis — in der APK |
| E3 | Chat UI | 1–2 | Capacitor-UI, mobil |
| E4 | Private Access | 2 | Sideload-APK **ist** Jarvis — kein Token, keine NAS |
| E5 | Always-On Ops | — | **superseded** — 24/7 = Handy, nicht NAS |
| E6 | Voice Out | 4 | TTS-Vorlesen (PO) |
| E7 | Assistant Capabilities | 2 | Memory/Tools in `0.13.x`; Research-Netz geparkt |
| E8 | Delight & Settings | 2 | Momente, Jokes, Sound, Eggs, Settings |
| E11 | NAS & APK gegen Server | — | **superseded** (`0.10.x` / `0.12.0`) |
| E12 | Samsung TV | — | **parked** (`0.11.x`) |

---

## User Stories

### E0 — Persona & Gesprächsqualität

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S0.1 | Als PO will ich Ton, Tabus und Anti-KI-Regeln schriftlich haben, damit Antworten steuerbar sind. | Must | done | `07-persona.md` Kern gesetzt (Runde 1) |
| S0.2 | Als PO will ich Soll/Nicht-Soll-Stilanker (nicht feste Strings), damit Abnahme und Variation klappen. | Must | done | `07` Beispiele als grobe Vorgabe + Anti-Template |
| S0.3 | Als Nutzer will ich kurze Messenger-artige Antworten, keine Essays. | Must | idea | Durchschnittlich kurz; keine Listen-Manie |
| S0.4 | Als Nutzer will ich, dass Jarvis gelegentlich Rückfragen stellt, ohne jedes Mal zu „coachen“. | Should | idea | Rückfragen dosiert in Tests |
| S0.5 | Als Nutzer will ich, dass Jarvis mich nicht „Master“/„Sir“ nennt. | Must | done | Scrub ab `0.8.5`, gilt in `0.13.x` |

### E1 — Local Runtime

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S1.1 | Als Nutzer will ich das Modell einmal aufs Handy laden, danach offline. | Must | done | First-Run `0.13.0`/`0.13.1` |
| S1.2 | Als Nutzer will ich ein Modell, das auf dem Handy läuft. | Must | done | Qwen2.5 0.5B Q4 (~470 MB) |
| S1.3 | Als Nutzer will ich erkennen, wenn das Modell fehlt oder der Download scheitert. | Should | done | Overlay + deutscher Fehlertext |

### E2 — Jarvis Core Chat

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S2.1 | Als Nutzer will ich Nachrichten senden und Jarvis-Antworten erhalten. | Must | done | On-Device Chat `0.13.x` |
| S2.2 | Als Nutzer will ich, dass jede Antwort die Jarvis-Persona nutzt. | Must | done | Persona in der Engine |
| S2.3 | Als Nutzer will ich, dass Jarvis die letzten Nachrichten im Gespräch kennt. | Must | done | Kontext + IndexedDB |
| S2.4 | Als PO will ich Persona-Text ändern können, ohne Code-Umweg zu brauchen (Config-Datei reicht). | Should | done | `frontend/src/engine/persona.ts` |
| S2.5 | Als Nutzer will ich Chatverläufe zwischen Sessions wiedersehen. | Must | done | IndexedDB |
| S2.6 | Als Nutzer will ich gespeicherte Chats löschen können. | Should | done | UI in `0.13.x` |
| S2.7 | Als Nutzer will ich, dass Jarvis Gesprächskontext versteht und später stärker erinnert. | Must (gestuft) | done | In-Chat + Memory IndexedDB |
| S2.8 | Als Nutzer will ich, dass Prompt-Injection nicht durchschlägt. | Must | done | Guards in `0.13.x` |
| S2.9 | Als Nutzer will ich jarvis-treue Antworten ohne Dauer-Duzen/Boilerplate. | Must | done | Persona + Guards |
| S2.10 | Als Dev will ich einen Smoke-/Eval-Lauf gegen Inject & Persona. | Should | parked | Alte Python-Evals; on-device: `npm run smoke` |
| S2.11 | Als Nutzer will ich keine Tip-Listen / Coach-Mode bei Inject/Roleplay. | Must | done | Guards |
| S2.12 | Als Nutzer will ich keine Sticky-Müllphrasen in längeren Antworten. | Must | done | Guards |
| S2.13 | Als Nutzer will ich bei „kaputt“ eine jarvis-treue Antwort, keinen Canned-Aussetzer. | Must | done | Engine |

### E3 — Chat UI

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S3.1 | Als Nutzer will ich eine Chat-Oberfläche in der APK. | Must | done | Capacitor-UI |
| S3.2 | Als Nutzer will ich die UI auf dem Handy bedienen können. | Must | done | Schmaler Viewport |
| S3.3 | Als Nutzer will ich sehen, dass Jarvis „gerade schreibt“ / lädt. | Could | done | Streaming + Timeout `0.13.1` |
| S3.4 | Als Nutzer will ich eine smoothe, moderne Premium-UI. | Should | done | Spotify-Dunkel + ChatGPT-Layout |
| S3.5 | Als Nutzer will ich mehrere Chats, eine Liste und „Neues Gespräch“. | Must | done | In `0.13.x` |
| S3.6 | Als Nutzer will ich ein GUI-Update mit premium Motion. | Must | done | In der APK-UI |
| S3.9 | Als Nutzer will ich ruhigere/klarere Motion (Polish). | Must | done | In der APK-UI |
| S3.7 | Als Nutzer will ich Antworten gestreamt sehen. | Should | done | `0.13.1` + Timeout |
| S3.8 | Als Nutzer will ich bei Fehlern Retry/klare Meldung. | Should | done | Overlay + Chat-Fehler |

### E4 — Private Access

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S4.1 | Als Nutzer will ich Jarvis nur auf meinem Handy nutzen. | Must | done | On-Device `0.13.x` |
| S4.2 | Als Nutzer will ich, dass kein Server im Netz offen ist. | Must | done | Kein Backend, kein Port |
| S4.3 | Als Nutzer will ich keine NAS-URL und kein Token. | Must | done | First-Run = nur Modell |
| S4.4 | Als Nutzer will ich eine sideloadbare Android-APK, die selbst denkt. | Must | done | `docs/apk.md` |

### E5 — Always-On Ops

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S5.1 | Als Nutzer will ich Jarvis 24/7 auf NAS/Mini-Server. | Won’t | parked | **superseded** — 24/7 = Handy |
| S5.2 | Als Nutzer will ich Config/Chats backupbar haben. | Should | parked | NAS-Backup entfällt; Daten = IndexedDB auf dem Gerät |

### E6 — Voice Out

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S6.1 | Als Nutzer will ich Jarvis’ Textantwort vorlesen lassen. | Won’t (jetzt) | parked | TTS auf PO-Kommando; gleicher Text |
| S6.2 | Als Nutzer will ich eine Stimme, die zum Charakter passt. | Won’t (jetzt) | parked | PO-Abnahme Stimme |

### E7 — Assistant Capabilities

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S7.1 | Als Nutzer will ich Langzeitgedächtnis über Chats hinweg (edit-/löschbar). | Must | done | Sprint 8 / `0.4.0` — Details `10` |
| S7.2 | Als Nutzer will ich, dass lange Chats zusammengefasst werden und den Faden halten. | Must | done | Sprint 8 / `0.4.0` |
| S7.3 | Als Dev will ich Kontextkompression statt naiver Truncation. | Must | done | Sprint 8 / `0.4.0` |
| S7.3a | Als Nutzer will ich keine falschen „gemerkt“-Bestätigungen und kein Aussetzer nach Memory. | Must | done | Sprint 9 / `0.4.1` |
| S7.3b | Als Nutzer will ich präziseren Memory-Alltag (Parser/Split, Kategorie-Filter, Soft-Harvest TTL). | Must | done | Sprint 10 / `0.4.2` |
| S7.3c | Als Nutzer will ich Memory-Einträge nach `pref`/`fact`/`boundary` filtern. | Must | done | Sprint 10 / `0.4.2` |
| S7.3d | Als Nutzer will ich, dass Soft-Harvest unsicher ist und mit TTL verfällt. | Must | done | Sprint 10 / `0.4.2` |
| S7.3e | Als Nutzer will ich saubere Multi-Fakt-Values und stabilen Memory-Recall (kein Aussetzer). | Must | done | Sprint 11 / `0.4.3` — Hotfix |
| S7.3f | Als Nutzer will ich Prefs auch ohne „mein“ speichern (`Speichere: Lieblings…`). | Must | done | Sprint 11 / `0.4.3` |
| S7.4 | Als Nutzer will ich Intent-abhängige Antwort-Policy (Smalltalk vs Task vs Research vs Memory). | Must | done | Sprint 12 / `0.5.0` — `10` §4–4.1 |
| S7.4a | Als Nutzer will ich merk/recall/forget getrennt mit eigener Reply-Policy (kein Helpdesk-Fallback). | Must | done | Sprint 12 / `0.5.0` — Memory-Intent |
| S7.4b | Als Nutzer will ich bei „nicht X, sondern Y“ Ersetzen + kurze Nachfrage. | Must | done | Sprint 12 / `0.5.0` — Contradiction / clarify |
| S7.5 | Als Nutzer will ich Auto-Model-Routing (Default/Heavy/Fallback). | Won’t | parked | Ein On-Device-Modell (0.5B) |
| S7.6 | Als PO will ich Persona-/Quality-Scores in Eval/CI. | Must | done | Sprint 12 / `0.5.0` — `10` |
| S7.6a | Als Nutzer will ich, dass Tasks nicht als Inject geblockt werden und Inject Jarvis/DE bleibt. | Must | done | Sprint 13 / `0.5.1` — Hotfix |
| S7.6b | Als Nutzer will ich keine Speicherung von leeren „Merk dir irgendwie“-Payloads. | Must | done | Sprint 13 / `0.5.1` |
| S7.6c | Als Nutzer will ich bei Settings/Helpdesk-Bait keinen finalen Aussetzer. | Must | done | Sprint 13 / `0.5.1` |
| S7.6d | Als PO will ich robusteren Router + Live-Scorecard (nicht blocker). | Should | done | Sprint 14 / `0.5.2` — Polish |
| S7.7 | Als Nutzer will ich opt-in Internet-Research mit Quellen (kein Raten). | Won’t | parked | Historisch `0.6.x`; on-device **offline**, kein Netzpfad |
| S7.7a | Als Nutzer will ich, dass Research-Queries ohne PII/Noise an Provider gehen. | Must | done | Sprint 16 / `0.6.1` — Hotfix |
| S7.7b | Als Nutzer will ich stabile Topic-Extraktion bei langen Research-Prompts. | Must | done | Sprint 16 / `0.6.1` |
| S7.7c | Als PO will ich Research-Default Opt-in aus + Test-Hygiene. | Must | done | Sprint 16 / `0.6.1` |
| S7.7d | Als Nutzer will ich Research-Antworten im Jarvis-Ton + robustere Provider-Mix. | Should | done | Sprint 17 / `0.6.2` — Polish |
| S7.8 | Kalender/Mail/Fire-TV/Alexa-Tools | Won’t | parked | Samsung-TV = E12, ebenfalls parked |
| S7.9 | Native Store-App (Play Store) | Won’t | parked | Sideload-APK = S4.4 / `0.13.x` |

### E8 — Delight & Settings

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S8.1 | Als Nutzer will ich seltene Jarvis-Momente (abschaltbar). | Should | done | Sprint 18 / `0.7.0` — `11` |
| S8.2 | Als Nutzer will ich dosierte Inside Jokes aus dem Gedächtnis. | Should | done | Sprint 18 / `0.7.0` — `11` |
| S8.3 | Als Nutzer will ich optionale UI-Sounds. | Could | done | Sprint 18 / `0.7.0` — `11` |
| S8.4 | Als Nutzer will ich Easter-Egg-Commands, gelistet in den Einstellungen. | Should | done | Sprint 18 / `0.7.0` — `11` |
| S8.5 | Als Nutzer will ich ein flaches Settings-Panel (wenig Verschachtelung). | Must | done | Sprint 18 / `0.7.0` — `11` |
| S8.6 | Als Nutzer will ich, dass Guards harmlosen Smalltalk/Tasks nicht mit Canned erschlagen. | Must | done | Sprint 19 / `0.7.1` |
| S8.7 | Als Nutzer will ich valide Research-Timeouts (kein Negativwert). | Must | done | Sprint 19 / `0.7.1` |
| S8.8 | Als Nutzer will ich korrekte Meta-Antworten (Modell/Version/Research), keine Marken-Halluzination. | Must | done | Sprint 19 / `0.7.1` |
| S8.9 | Als Nutzer will ich, dass SAFE_SMALLTALK nicht jedes harmlose Chat ersetzt. | Must | done | Sprint 20 / `0.7.2` |
| S8.10 | Als Nutzer will ich stabilen Memory-Recall ohne Helpdesk-Canned. | Must | done | Sprint 20 / `0.7.2` |
| S8.11 | Als Nutzer will ich Task-Antworten ohne CJK/Sprach-Leak und mit weicherem Duzen-Handling. | Must | done | Sprint 20 / `0.7.2` |
| S8.12 | Als Nutzer will ich Mood/Eggs conversation-sicher und Eggs-off klar. | Should | done | Sprint 21 / `0.7.3` |
| S8.13 | Als Nutzer will ich bei vagen Tasks eine kurze Führung (Clarify-First). | Must | done | Sprint 22 / `0.8.0` |
| S8.14 | Als Nutzer will ich eine Fähigkeiten-Karte (`/hilfe`). | Must | done | Sprint 22 / `0.8.0` |
| S8.15 | Als Nutzer will ich spürbares Streaming + Research-Query-Echo. | Must | done | Sprint 22 / `0.8.0` |
| S8.16 | Als Nutzer will ich, dass Soft-Memory keine Wort-Trümmer speichert (`Jazz`≠`zz`). | Must | done | Sprint 23 / `0.8.1` |
| S8.17 | Als Nutzer will ich Duzen-Repair ohne kaputtes Deutsch (`Merk Ihnen`, `*st Sie`). | Must | done | Sprint 23 / `0.8.1` |
| S8.18 | Als Nutzer will ich Capabilities auch bei kurzen Fragen (`Was kannst du?`). | Must | done | Sprint 24 / `0.8.2` |
| S8.19 | Als Nutzer will ich Begrüßungen ohne reines SAFE_SMALLTALK-Canned. | Should | done | Sprint 24 / `0.8.2` |
| S8.20 | Als Nutzer will ich klares Forget- und Soft-Reject-Feedback. | Should | done | Sprint 24 / `0.8.2` |
| S8.21 | Als Nutzer will ich Assist-Scorecard + Mood-Persist + Audit-Link. | Should | done | Sprint 25 / `0.8.3` |
| S8.22 | Als Nutzer will ich Antworten ohne `*st Sie` / Doppel-Sie-Mischformen. | Must | done | Sprint 26 / `0.8.4` |
| S8.23 | Als Nutzer will ich bei „Wie heiße ich?“ genau einen aktuellen Namen. | Must | done | Sprint 26 / `0.8.4` |
| S8.24 | Als Nutzer will ich bei CJK in Task-Prompts einen Plan/Fallback, kein Smalltalk-Canned. | Should | done | Sprint 26 / `0.8.4` |
| S8.25 | Als Nutzer will ich keine „Master“-/Sklaven-Anrede. | Must | done | Sprint 27 / `0.8.5` |
| S8.26 | Als Nutzer will ich Rest-Duzen ohne `*st Sie`-Muster weg (`bringst`/`willst`/`hältst Sie`). | Must | done | Sprint 27 / `0.8.5` |
| S8.27 | Als Nutzer will ich nach Clarify eine Plan-Fortsetzung statt neuer Meta-Frage. | Must | done | Sprint 27 / `0.8.5` |

### E9 — Local Tools (Option A)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S9.1 | Als Nutzer will ich lokale Notizen mit Confirm anlegen/finden. | Must | done | Sprint 28 / `0.9.0` |
| S9.2 | Als Nutzer will ich lokale Todos anlegen/listen/erledigen. | Must | done | Sprint 28 / `0.9.0` |
| S9.3 | Als Nutzer will ich, dass Tools nur nach Confirm schreiben. | Must | done | Sprint 28 / `0.9.0` |
| S9.4 | Als Nutzer will ich keine Fake-„notiert“-Claims ohne Tool-Execute. | Must | done | Sprint 29 / `0.9.1` |
| S9.5 | Als Nutzer will ich klare Trennung Memory („merk dir“) vs. Tool („notiere/todo“). | Must | done | Sprint 29 / `0.9.1` |
| S9.6 | Als Nutzer will ich Multi-Turn Tool-Flows (listen → erledigen). | Should | done | Sprint 30 / `0.9.2` |
| S9.7 | Als Nutzer will ich Todos/Notizen ohne Eval-Müll-Dump sehen (Scope/Filter). | Should | done | Teil in `0.13.x` (Aufräumen-Befehl) |
| S9.8 | Als Nutzer will ich Confirm per Ja/Nein. | Should | done | Text-Confirm in `0.13.x` |

### E10 — Memory & Assist Quality (nach 0.9.2-Probe)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S10.1 | Als Nutzer will ich in einem „Merk dir“-Satz mehrere Fakten speichern. | Must | done | On-Device Memory (Name/Trinken/Essen) |
| S10.2 | Als Nutzer will ich Pref-Fragen („Was trinke ich?“) als Recall, nicht Smalltalk. | Must | done | Recall-Pfad in `memory.ts` |
| S10.3 | Als Nutzer will ich nach Clarify eine Plan-Fortsetzung statt Smalltalk. | Should | parked | Alter Assist-Router; 0.5B-Engine ist schlanker |
| S10.4 | Als Nutzer will ich Rest-Broken-Siezen und EN-Leaks weg. | Should | done | Guards + Persona in `0.13.x` |

### E11 — NAS & APK gegen Server (`0.10.x`) — **SUPERSEDED**

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S11.1 | Als Nutzer will ich den Stack per Compose auf NAS mit Autostart. | Won’t | parked | entfällt — [`12`](./12-nas-apk.md) |
| S11.2 | Als Nutzer will ich Backup/Restore der Chat-Daten. | Won’t | parked | NAS-Backup entfällt |
| S11.3 | Als Nutzer will ich Owner-Token, sonst 401. | Won’t | parked | kein Server |
| S11.4 | Als Nutzer will ich die APK sideloaden und gegen NAS chatten. | Won’t | parked | APK denkt selbst (`0.13.x`) |
| S11.5 | Als Nutzer will ich First-Run (URL+Token) und bedienbare Tastatur. | Won’t | parked | First-Run = Modell-Download |

### E12 — Samsung TV (`0.11.x`) — **PARKED**

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S12.1 | Als Nutzer will ich den Tizen-TV ein/aus, Lautstärke, Mute, HDMI lokal steuern. | Won’t | parked | kein UDP/WOL aus der WebView |
| S12.2 | Als Nutzer will ich ehrliche Fehler wenn WOL/TV tot ist. | Won’t | parked | |
| S12.3 | Als Nutzer will ich TV in Settings suchen, koppeln, testen, umbenennen. | Won’t | parked | Settings-Felder existieren, steuern nichts |

### E13 — LAN-Proxy & APK (`0.12.x`) — **SUPERSEDED**

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S13.1 | Als Nutzer will ich Jarvis ohne Docker 24/7 auf der NAS (Proxy :8080). | Won’t | parked | Sprint 43 superseded |
| S13.2 | Als Nutzer will ich die APK sideloaden und First-Run gegen die NAS-IP. | Won’t | parked | First-Run = GGUF, nicht NAS-IP |

### E7 — Nachzieher Quality/Research (Fortsetzung)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S7.10 | Als Nutzer will ich Junk-Research-Queries abgelehnt / nachgefragt. | Must | done | Sprint 19 / `0.7.1` |
| S7.11 | Als Nutzer will ich „recherchiere nichts“ nicht als Research. | Must | done | Sprint 19 / `0.7.1` |
| S7.12 | Als Nutzer will ich härtere Inject-Abwehr (Roleplay/System-Prompt). | Must | done | Sprint 19 / `0.7.1` |
| S7.13 | Als Nutzer will ich Multi-Turn-Kontext nicht durch Canned verlieren. | Must | done | Sprint 20 / `0.7.2` |
| S7.14 | Als Nutzer will ich eine knappe Capabilities-Antwort ohne LLM-Waffle. | Must | done | Sprint 20 / `0.7.2` |
| S7.15 | Als Nutzer will ich verständliche Research-Fehler (Timeout vs. leer). | Should | done | Sprint 21 / `0.7.3` |
| S7.16 | Als Nutzer will ich Memory Soft-Confirm bei unsicherem Harvest. | Should | done | Sprint 22 / `0.8.0` |
| S7.17 | Als Nutzer will ich Soft-Confirm nur mit validen Werten (Value-Gate). | Must | done | Sprint 23 / `0.8.1` |
| S7.18 | Als Nutzer will ich restliches Live-Duzen nach Retry weg. | Should | done | Sprint 24 / `0.8.2` |
| S7.19 | Als Nutzer will ich erweiterte Broken-Siezen-Reparatur (`möchtest Sie` …). | Must | done | Sprint 26 / `0.8.4` |
| S7.20 | Als Nutzer will ich Eval-Pins älterer Suites unter neuer `0.8.x` grün. | Should | done | Sprint 27 / `0.8.5` |

---

## Aktuelle Prioritätsreihenfolge

1. **Alltag `0.13.1`** — Sideload, Modell einmal laden, offline chatten ([`13`](./13-on-device.md))
2. TTS / `1.0.0` — **PO-Kommando**
3. NAS / Docker / Proxy (`0.10`–`0.12`) — **superseded**, nicht pullen
4. Samsung-TV / Research-Netz / Mail / Fire TV / Alexa / Play Store — **Parking**

## Parking Lot (Ideen, nicht geplant)

- Mehrere Jarvis-„Stimmungs“-Presets über Eggs hinaus
- Export der Chat-History
- Encryption at-rest
- Research-Netz (widerspricht Offline)
- Mail / Cloud-Kalender-OAuth / **Amazon Fire TV** / Alexa
- Play Store Listing / iOS
- Optional lokaler Kalender-Read (ICS)
- NAS-Comeback — nur nach neuer PO-Entscheidung
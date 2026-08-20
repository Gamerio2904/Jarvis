# 05 — Product Backlog

Priorisiertes Backlog. IDs stabil halten; Status aktualisieren.

**Status-Legende:** `idea` · `ready` · `in_sprint` · `done` · `parked`

**MoSCoW:** Must / Should / Could / Won’t (für aktuellen Horizont)

---

## Epics

| ID | Epic | Phase | Kurzbeschreibung |
|----|------|-------|------------------|
| E0 | Persona & Gesprächsqualität | 0–1 | Charakter, Stil, Abnahmekriterien Smalltalk |
| E1 | Local Runtime | 1 | Modell-Host + Modell lokal betreiben |
| E2 | Jarvis Core Chat | 1 | Backend, Persona-Injection, Kurzgedächtnis, API |
| E3 | Chat UI | 1–2 | Einfache Web-UI, mobil nutzbar |
| E4 | Private Access | 2 | Handy, Owner-Token, APK (`0.10.2`–`0.10.5`) |
| E5 | Always-On Ops | 3 | NAS Compose, Autostart, Backup (`0.10.0`–`0.10.1`) |
| E6 | Voice Out | 4 | TTS-Vorlesen |
| E7 | Assistant Capabilities | 4–6 | Gedächtnis, Router, Research, Scores |
| E8 | Delight & Settings | 5 | Momente, Jokes, Sound, Eggs, flaches Settings |
| E11 | NAS & APK | 2–3 | Compose 24/7 + Sideload-APK — `0.10.x` |
| E12 | Samsung TV | 5+ | Tizen lokal — `0.11.x` |

---

## User Stories

### E0 — Persona & Gesprächsqualität

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S0.1 | Als PO will ich Ton, Tabus und Anti-KI-Regeln schriftlich haben, damit Antworten steuerbar sind. | Must | done | `07-persona.md` Kern gesetzt (Runde 1) |
| S0.2 | Als PO will ich Soll/Nicht-Soll-Stilanker (nicht feste Strings), damit Abnahme und Variation klappen. | Must | done | `07` Beispiele als grobe Vorgabe + Anti-Template |
| S0.3 | Als Nutzer will ich kurze Messenger-artige Antworten, keine Essays. | Must | idea | Durchschnittlich kurz; keine Listen-Manie |
| S0.4 | Als Nutzer will ich, dass Jarvis gelegentlich Rückfragen stellt, ohne jedes Mal zu „coachen“. | Should | idea | Rückfragen dosiert in Tests |
| S0.5 | Als Nutzer will ich, dass Jarvis mich „Master“/„Sir“ nennt — selten, situativ, Sie/ohne Du. | Must | ready | Regeln in `07` gesetzt |

### E1 — Local Runtime

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S1.1 | Als Dev will ich einen lokalen Modell-Host installiert haben, damit Inference ohne Cloud läuft. | Must | idea | Host antwortet auf Testprompt lokal |
| S1.2 | Als Dev will ich ein für Smalltalk geeignetes Modell wählen, das auf der Hardware läuft. | Must | idea | Latenz & Qualität vom PO ok für MVP |
| S1.3 | Als Nutzer will ich erkennen, wenn das Modell nicht erreichbar ist (klare Fehlermeldung). | Should | idea | UI/Backend zeigt verständlichen Fehler |

### E2 — Jarvis Core Chat

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S2.1 | Als Nutzer will ich Nachrichten senden und Jarvis-Antworten erhalten. | Must | idea | Request/Response-Pfad funktioniert |
| S2.2 | Als Nutzer will ich, dass jede Antwort die Jarvis-Persona nutzt. | Must | idea | System-Prompt/Regeln aktiv |
| S2.3 | Als Nutzer will ich, dass Jarvis die letzten Nachrichten im Gespräch kennt. | Must | idea | Kontext der letzten N Turns sichtbar im Verhalten |
| S2.4 | Als PO will ich Persona-Text ändern können, ohne Code-Umweg zu brauchen (Config-Datei reicht). | Should | idea | Persona aus Datei/Config geladen |
| S2.5 | Als Nutzer will ich Chatverläufe zwischen Sessions wiedersehen. | Must | idea | Persistenz laut Q11 |
| S2.6 | Als Nutzer will ich gespeicherte Chats löschen können. | Should | ready | Sprint 3 / `0.2.0` (I5) |
| S2.7 | Als Nutzer will ich, dass Jarvis Gesprächskontext versteht und später stärker erinnert. | Must (gestuft) | idea | MVP: In-Chat-Kontext; Ausbau später |
| S2.8 | Als Nutzer will ich, dass Prompt-Injection nicht durchschlägt. | Must | ready | Sprint 2–4: F2/F3 → R1/I3 → H1/H3 (`0.2.1`) |
| S2.9 | Als Nutzer will ich jarvis-treue Antworten ohne Dauer-Duzen/Boilerplate. | Must | ready | Sprint 2–5: … → C1 (`0.2.2`) |
| S2.10 | Als Dev will ich einen Smoke-/Eval-Lauf gegen Inject & Persona. | Should | ready | Smoke `0.1.1`; Eval `0.2.0`/`0.2.1`; C4 `0.2.2` |
| S2.11 | Als Nutzer will ich keine Tip-Listen / Coach-Mode bei Inject/Roleplay. | Must | ready | Sprint 4 / `0.2.1` (H1) |
| S2.12 | Als Nutzer will ich keine Sticky-Müllphrasen in längeren Antworten. | Must | ready | Sprint 4 / `0.2.1` (H4) |
| S2.13 | Als Nutzer will ich bei „kaputt“ eine jarvis-treue Antwort, keinen Canned-Aussetzer. | Must | ready | Sprint 5 / `0.2.2` (C2) |

### E3 — Chat UI

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S3.1 | Als Nutzer will ich eine einfache Chat-Oberfläche im Browser. | Must | idea | Senden/Empfangen sichtbar |
| S3.2 | Als Nutzer will ich die UI auf dem Handy-Browser bedienen können. | Must | idea | Nutzbar auf schmalem Viewport |
| S3.3 | Als Nutzer will ich sehen, dass Jarvis „gerade schreibt“ / lädt. | Could | idea | Loading-Indikator vorhanden |
| S3.4 | Als Nutzer will ich langfristig eine extrem smoothe, moderne Premium-Web-UI. | Should (Gesamtprojekt) | idea | Spotify-Farben + ChatGPT-Layout |
| S3.5 | Als Nutzer will ich mehrere Chats, eine Liste und „Neues Gespräch“. | Must (Zielbild) | idea | MVP darf schlank sein, Architektur ausbaufähig |
| S3.6 | Als Nutzer will ich später ein GUI-Update mit premium Motion. | Must (jetzt) | ready | Sprint 6 / `0.3.0` (M1–M6) |
| S3.9 | Als Nutzer will ich nach `0.3.0` ruhigere/ klarere Motion (Polish). | Must | ready | Sprint 7 / `0.3.1` (P1–P6) |
| S3.7 | Als Nutzer will ich Antworten gestreamt sehen. | Should | ready | Sprint 3 / `0.2.0` (I2) |
| S3.8 | Als Nutzer will ich bei Fehlern Retry/klare Meldung. | Should | ready | Sprint 3 / `0.2.0` (I1) |

### E4 — Private Access

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S4.1 | Als Nutzer will ich vom Handy im privaten Setup auf Jarvis zugreifen. | Must | ready | Sprint 36–39 / `0.10.2`–`0.10.5` |
| S4.2 | Als Nutzer will ich, dass Fremde ohne Zugang nicht chatten können. | Must | ready | Sprint 36 / `0.10.2` Owner-Token |
| S4.3 | Als Nutzer will ich keine ungeschützt öffentlichen Ports als Default. | Must | ready | Sprint 36 / `0.10.2` LAN-Default |
| S4.4 | Als Nutzer will ich eine sideloadbare Android-APK gegen die NAS. | Must | ready | Sprint 37–39 / `0.10.3`–`0.10.5` |

### E5 — Always-On Ops

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S5.1 | Als Nutzer will ich Jarvis 24/7 auf NAS/Mini-Server. | Must | ready | Sprint 34 / `0.10.0` Compose |
| S5.2 | Als Nutzer will ich Config/Chats backupbar haben. | Should | ready | Sprint 35 / `0.10.1` |

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
| S7.5 | Als Nutzer will ich Auto-Model-Routing (Default/Heavy/Fallback). | Must | done | Sprint 12 / `0.5.0` — `10` |
| S7.6 | Als PO will ich Persona-/Quality-Scores in Eval/CI. | Must | done | Sprint 12 / `0.5.0` — `10` |
| S7.6a | Als Nutzer will ich, dass Tasks nicht als Inject geblockt werden und Inject Jarvis/DE bleibt. | Must | done | Sprint 13 / `0.5.1` — Hotfix |
| S7.6b | Als Nutzer will ich keine Speicherung von leeren „Merk dir irgendwie“-Payloads. | Must | done | Sprint 13 / `0.5.1` |
| S7.6c | Als Nutzer will ich bei Settings/Helpdesk-Bait keinen finalen Aussetzer. | Must | done | Sprint 13 / `0.5.1` |
| S7.6d | Als PO will ich robusteren Router + Live-Scorecard (nicht blocker). | Should | done | Sprint 14 / `0.5.2` — Polish |
| S7.7 | Als Nutzer will ich opt-in Internet-Research mit Quellen (kein Raten). | Must | done | Sprint 15 / `0.6.0` — `10` |
| S7.7a | Als Nutzer will ich, dass Research-Queries ohne PII/Noise an Provider gehen. | Must | done | Sprint 16 / `0.6.1` — Hotfix |
| S7.7b | Als Nutzer will ich stabile Topic-Extraktion bei langen Research-Prompts. | Must | done | Sprint 16 / `0.6.1` |
| S7.7c | Als PO will ich Research-Default Opt-in aus + Test-Hygiene. | Must | done | Sprint 16 / `0.6.1` |
| S7.7d | Als Nutzer will ich Research-Antworten im Jarvis-Ton + robustere Provider-Mix. | Should | done | Sprint 17 / `0.6.2` — Polish |
| S7.8 | Kalender/Mail/Fire-TV/Alexa-Tools | Won’t | parked | Samsung-TV = E12 / `0.11.x` |
| S7.9 | Native Store-App (Play Store) | Won’t | parked | Sideload-APK = S4.4 / `0.10.3` |

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
| S9.7 | Als Nutzer will ich Todos/Notizen ohne Eval-Müll-Dump sehen (Scope/Filter). | Should | ready | Sprint 33 / `0.9.5` |
| S9.8 | Als Nutzer will ich Confirm per UI-Chip (Ja/Nein). | Should | ready | Sprint 33 / `0.9.5` |

### E10 — Memory & Assist Quality (nach 0.9.2-Probe)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S10.1 | Als Nutzer will ich in einem „Merk dir“-Satz mehrere Fakten speichern. | Must | ready | Sprint 31 / `0.9.3` |
| S10.2 | Als Nutzer will ich Pref-Fragen („Was trinke ich?“) als Recall, nicht Smalltalk. | Must | ready | Sprint 31 / `0.9.3` |
| S10.3 | Als Nutzer will ich nach Clarify eine Plan-Fortsetzung statt Smalltalk. | Must | ready | Sprint 32 / `0.9.4` |
| S10.4 | Als Nutzer will ich Rest-Broken-Siezen und EN-Leaks weg. | Must | ready | Sprint 32 / `0.9.4` |

### E11 — NAS & APK (`0.10.x`)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S11.1 | Als Nutzer will ich den Stack per Compose auf NAS mit Autostart. | Must | ready | Sprint 34 / `0.10.0` |
| S11.2 | Als Nutzer will ich Backup/Restore der Chat-Daten. | Should | ready | Sprint 35 / `0.10.1` |
| S11.3 | Als Nutzer will ich Owner-Token, sonst 401. | Must | ready | Sprint 36 / `0.10.2` |
| S11.4 | Als Nutzer will ich die APK sideloaden und gegen NAS chatten. | Must | ready | Sprint 37 / `0.10.3` |
| S11.5 | Als Nutzer will ich First-Run (URL+Token) und bedienbare Tastatur. | Must | ready | Sprint 38–39 / `0.10.4`–`0.10.5` |

### E12 — Samsung TV (`0.11.x`)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S12.1 | Als Nutzer will ich den Tizen-TV ein/aus, Lautstärke, Mute, HDMI lokal steuern. | Must | ready | Sprint 40 / `0.11.0` |
| S12.2 | Als Nutzer will ich ehrliche Fehler wenn WOL/TV tot ist. | Must | ready | Sprint 41 / `0.11.1` |
| S12.3 | Als Nutzer will ich TV in Settings suchen, koppeln, testen, umbenennen. | Must | ready | Sprint 42 / `0.11.2` |

### E13 — LAN-Proxy & APK (`0.12.x`)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S13.1 | Als Nutzer will ich Jarvis ohne Docker 24/7 auf der NAS (Proxy :8080). | Must | ready | Sprint 43 / `0.12.0` |
| S13.2 | Als Nutzer will ich die APK sideloaden und First-Run gegen die NAS-IP. | Must | ready | Sprint 43 / `0.12.0` |

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

### E14 — On-Device IQ (`0.13.2`–`0.13.4`)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S14.1 | Als Nutzer will ich Antworten ohne 1-Thread-WASM-Bremse. | Must | ready | Sprint 46 / `0.13.2` |
| S14.2 | Als Nutzer will ich Tokens gestreamt sehen, nicht 75 s warten. | Must | ready | Sprint 46 / `0.13.2` |
| S14.3 | Als Nutzer will ich „Hey/Danke“ ohne Modell. | Must | ready | Sprint 46 / `0.13.2` |
| S14.4 | Als Nutzer will ich Jarvis-Ton und ehrliches Memory auf 0.5B. | Must | ready | Sprint 47 / `0.13.3` |
| S14.5 | Als Nutzer will ich optional ein schärferes 1.5B on-device. | Should | ready | Sprint 48 / `0.13.4` |

## Aktuelle Prioritätsreihenfolge (Pull-Reihenfolge)

1. **Sprint 46** (`0.13.2`) — On-Device Latenz
2. **Sprint 47** (`0.13.3`) — On-Device Qualität
3. **Sprint 48** (`0.13.4`) — optionales 1.5B
4. Native llama.cpp / `0.14.0` — **PO-Kommando**
5. TTS / `1.0.0` — **PO-Kommando**
6. NAS / Samsung-TV / Mail / Fire TV / Alexa / Play Store — **Parking**

## Parking Lot (Ideen, nicht geplant)

- Mehrere Jarvis-„Stimmungs“-Presets über Eggs hinaus
- Export der Chat-History
- Komplett offline ohne jegliche Modell-Downloads nach Initial-Setup (Policy später)
- Richere Joke-Harvest-UX / Research-LLM-Synth mit Citation-Gate
- Mail / Cloud-Kalender-OAuth / **Amazon Fire TV** / Alexa
- Play Store Listing / iOS
- Optional lokaler Kalender-Read (ICS) — Parking (Sprint 30 P7)
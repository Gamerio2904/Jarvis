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
| E12 | Samsung TV | 5+ | Tizen lokal — **`0.14.1`** (ex-`0.11`, on-device) |
| E14 | Qualität `0.14` | 2 | Bestehendes härten: Latenz, Ton, Memory/Tools — kein neues Feature |
| E15 | Alltag `1.14`–`1.20` | 5+ | Gedächtnis, Kontext, Einkauf, Losgehen, Zuhause, Auge — [`19-next.md`](./19-next.md) |
| E16 | Extra `1.21`–`1.24` | 4 | Nummer, Maps-Modus, Geburtstag, Serie, Widget, Chatsuche — [`20-next.md`](./20-next.md) |
| E17 | Qualität `1.33`–`1.40` | 5+ | Bestehendes härten: Verstehen, Antworten, Fahrmodus, Phrasen, Flüssigkeit — kein neues Produkt — [`28-next.md`](./28-next.md) |
| E25 | Alltag & Welt `2.4`–`2.20` | 5+ | DWD, Ferien, Kurs, Food, Library, Sport, Garten, Himmel, Tiere, Flüge, Recht, Haushalt, Sensoren, Schach — [`31-next.md`](./31-next.md) **CODE** in `2.28.0` |
| E26 | Fahren, Musik, Chat, FC 26 `2.21`–`2.27` | 5+ | Blitzer/Baustelle, CarPlay tun-dann-sprechen, Latenz, Amazon Musik, Chat-Ordner, Instanudeln, FC 26 — [`32-next.md`](./32-next.md) **CODE** in `2.21.0` |

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
| S8.5 | Als Nutzer will ich Einstellungen ohne Sidebar-Dump. | Must | done | `1.25.0` Vollbild + Themenleiste (`11`); `0.7.0`-Panel ersetzt |
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

### E12 — Samsung TV (`0.14.1`, ex-`0.11`)

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S12.1 | Als Nutzer will ich den Tizen-TV ein/aus, Lautstärke, Mute, HDMI lokal steuern. | Must | done | Sprint 48 / `0.14.1` |
| S12.2 | Als Nutzer will ich ehrliche Fehler wenn WOL/TV tot ist. | Must | done | Sprint 48 / `0.14.1` |
| S12.3 | Als Nutzer will ich TV in Settings suchen, koppeln, testen, umbenennen. | Must | done | Sprint 48 / `0.14.1` |

### E14 — Qualität `0.14.0`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S14.1 | Als Nutzer will ich das erste Wort schneller als in `0.13.2`. | Must | done | Sprint 47 / `0.14.0` |
| S14.2 | Als Nutzer will ich Memory/Tools ohne LLM-Umweg, wenn der Befehl klar ist. | Must | done | Sprint 47 |
| S14.3 | Als Nutzer will ich ehrliches Recall statt Halluzination. | Must | done | Sprint 47 |
| S14.4 | Als Nutzer will ich Todos/Notizen in Alltagssprache. | Should | done | Sprint 47 |

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

### E15 — Alltag `1.14`–`1.20`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S15.1 | Als Nutzer will ich ein Gedächtnis, das lokal und mit Gemini denselben Namen kennt. | Must | done | Sprint 66 / `1.14.0` |
| S15.2 | Als Nutzer will ich Personen an Orte (Freundin, Praxis, Zuhause). | Must | done | Sprint 67 / `1.15.0` |
| S15.3 | Als Nutzer will ich „lösch das“ / „und um 16“ auf das letzte Tool, nicht nur Wetter. | Must | done | Sprint 66 / `1.14.0` |
| S15.4 | Als Nutzer will ich zwei Befehle in einem Satz. | Must | done | Sprint 66 / `1.14.0` |
| S15.5 | Als Nutzer will ich eine Einkaufsliste ohne Ja/Nein pro Artikel. | Must | done | Sprint 68 / `1.24.0` |
| S15.6 | Als Nutzer will ich Losgehen: fehlt der Zahnarzt-Ort, nachfragen, dann Route. | Must | done | Sprint 69 / `1.24.0` |
| S15.6a | Als Nutzer will ich Ort und Termin in einem Satz. | Must | done | Sprint 69 / `1.24.0` |
| S15.7 | Als Nutzer will ich „wenn ich zuhause bin …“. | Must | done | Sprint 70 / `1.24.0` |
| S15.8 | Als Nutzer will ich eine kurze Tageslage und einen menschlicheren Ton (Siezen). | Must | done | Sprint 71 / `1.24.0` |
| S15.9 | Als Nutzer will ich ein Foto vorlesen lassen, nur mit Gemini. | Must | done | Sprint 72 / `1.24.0` |
| S15.10 | Als Nutzer will ich Suche mit Quellen oder ehrlicher Absage, kein Raten. | Must | done | Sprint 66 / `1.14.0` |

### E16 — Extra-Alltag `1.21`–`1.24`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S16.1 | Als Nutzer will ich eine Nummer an der Person und „Ruf … an“. | Should | done | Sprint 73 / `1.24.0` |
| S16.2 | Als Nutzer will ich Maps zu Fuß oder mit der Bahn. | Should | done | Sprint 73 / `1.24.0` |
| S16.3 | Als Nutzer will ich Geburtstage merken. | Should | done | Sprint 74 / `1.24.0` |
| S16.4 | Als Nutzer will ich Wochenserien ohne Geofence (Müll). | Should | done | Sprint 74 / `1.24.0` |
| S16.5 | Als Nutzer will ich im Widget Termin/Einkauf/Route nach Hause. | Should | done | Sprint 75 / `1.24.0` |
| S16.6 | Als Nutzer will ich „das zweite“ nach einer Liste. | Should | done | Sprint 75 / `1.24.0` |
| S16.7 | Als Nutzer will ich alte Gespräche lokal suchen. | Should | done | Sprint 76 / `1.24.0` |

### E17 — Qualität `1.33`–`1.40`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S17.1 | Als Nutzer will ich bei der Suche eine Antwort plus Links, bei Produkten Preise oder ehrlichen Vergleich. | Must | done | Sprint 86 / `1.33.0` |
| S17.2 | Als Nutzer will ich Jarvis-Antworten mit Kontext und Variation, ohne erfundenen Namen. | Must | ready | Sprint 87 / `1.34.0` |
| S17.3 | Als Nutzer will ich den Fahrmodus zuverlässig: Replan, eine Cue, lesbares HUD. | Must | ready | Sprint 88 / `1.35.0` |
| S17.4 | Als Nutzer will ich mehr Phrasen zu denselben Tools, ohne Smalltalk-Diebstahl. | Must | ready | Sprint 89 / `1.36.0` |
| S17.5 | Als Nutzer will ich Chat, Wake-Word, Voice und TV ohne Ruckler. | Must | ready | Sprint 90 / `1.37.0` |
| S17.6 | Als Nutzer will ich den vorhandenen Speicher natürlich abfragen und korrigieren. | Must | ready | Sprint 91 / `1.38.0` |
| S17.7 | Als Nutzer will ich Zuhören/Sprechen ohne verschluckte Treffer und Doppel-Stimme. | Must | ready | Sprint 92 / `1.39.0` |
| S17.8 | Als Nutzer will ich keine Fake-Erfolge und stabile Regressionen. | Must | ready | Sprint 93 / `1.40.0` |

### E18 — Tanke E10 `1.41`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S18.1 | Als Fahrer will ich im Chat oder Fahrmodus die nächste und die günstigste Tanke mit E10-Preis sehen und dorthin navigieren. | Must | done | Sprint 94 / `1.41.0` |
| S18.2 | Als Nutzer will ich wissen, wo ich bin, und die Standortfreigabe anstoßen können — unabhängig von Tanke und für Tanke. | Must | done | Sprint 95 / `1.42.0` |

### E19 — CarPlay Alltag `1.43`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S19.1 | Als Fahrer will ich nacktes „Carplay“ und „öffne das overlay“ ohne Gemini-Lügen. | Must | done | Sprint 96 / `1.43.0` |
| S19.2 | Als Fahrer will ich Restweg, nächsten POI, Arbeit/Freundin, Akku und Anruf/SMS ehrlich. | Must | done | Sprint 96 / `1.43.0` |

### E20 — Filme + Rabatt `1.44`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S20.1 | Als Nutzer will ich IMDb/Rotten-Tomatoes-Noten und wo ein Film in DE gratis läuft — ohne erfundene Streams. | Must | done | Sprint 97 / `1.44.0` |
| S20.2 | Als Nutzer will ich die Rabatt-Suche beim Online-Shopping an- und ausschalten können. | Must | done | Sprint 97 / `1.44.0` |

### E21 — Öffnungszeiten `1.45`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S21.1 | Als Nutzer will ich wissen, ob Apotheke, Bäcker oder Laden jetzt auf hat — nur aus der Karte. | Must | done | Sprint 98 / `1.45.0` |

### E22 — Anruf/SMS `1.46`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S22.1 | Als Nutzer will ich Bro/Freundin direkt anrufen und SMS senden — erst nach Nachfrage. | Must | done | Sprint 99 / `1.46.0` |

### E23 — PC live `1.47`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S23.1 | Als Nutzer will ich vom Handy aus den Windows-PC sehen und steuern (FIFA, Maus, Ordner). | Must | done | Sprint 100 / `1.47.0` |

### E24 — Live-Lage auf Nachfrage `1.48`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S24.1 | Als Nutzer will ich Luftqualität und Sonnenaufgang nur wenn ich danach frage. | Must | done | Sprint 101 / `1.48.0` |
| S24.2 | Als Nutzer will ich Bahn/ÖPNV-Zeiten, ohne dass Jarvis sie erfindet. | Must | done | transport.rest / Transitous |
| S24.3 | Als Nutzer will ich Nachrichten: national Tagesschau, Ort zuerst Tagesschau sonst Netz. | Must | done | nichts erfinden |
| S24.4 | Als Nutzer will ich wissen, ob heute in DE Feiertag ist. | Must | done | Nager.Date |

### E25 — Alltag & Welt `2.4`–`2.20`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S25.1 | Unwetter / DWD-Warnung | Must | done | `2.28.0` — DWD, kein Raten |
| S25.2 | Schulferien DE | Must | done | `2.28.0` |
| S25.3 | Wechselkurse EZB | Must | done | `2.28.0` |
| S25.4 | Research: belegte DE-Zahlen zuerst | Must | done | `2.28.0` — Wikipedia/Destatis zuerst |
| S25.5 | Stimme spricht Uhr/Warnung/Ferien | Should | done | `2.28.0` — vorhandenes TTS, ganze Sätze |
| S25.6 | Open Food Facts (Foto/Produkt) | Must | done | `2.28.0` |
| S25.7 | Open Library (Buch) | Must | done | `2.28.0` |
| S25.8 | Bundesliga-Stand | Must | done | `2.28.0` — OpenLigaDB |
| S25.9 | Weitere Sport-Ergebnisse | Should | done | `2.28.0` |
| S25.10 | Garten & Pflanzen bestimmen | Must | done | `2.28.0` — keine Essbarkeit |
| S25.11 | Himmel: ISS, Mond | Must | done | `2.28.0` |
| S25.12 | Tiere draußen bestimmen | Must | done | `2.28.0` |
| S25.13 | Flüge überm Haus | Must | done | `2.28.0` — OpenSky |
| S25.14 | Recht Alltag (Gesetzestext + Link) | Must | done | `2.28.0` — kein Anwalts-Rat |
| S25.15 | Haushalt (Waschsymbol, Fleck) | Should | done | `2.28.0` |
| S25.16 | Schritte, Barometer, Handy-Sensoren | Must | done | `2.28.0` — lokal |
| S25.17 | Schach im Chat | Should | done | `2.28.0` |

### E26 — Fahren, Musik, Chat, Angebot, FC 26 `2.21`–`2.27`

| ID | Story | MoSCoW | Status | Akzeptanz (kurz) |
|----|-------|--------|--------|------------------|
| S26.1 | Blitzer + mobile Baustellen | Must | done | `2.21.0` — Autobahn/OSM; mobil ehrlich |
| S26.2 | CarPlay: zuerst tun, dann vorlesen | Must | done | `2.21.0` — intern, nicht Apple |
| S26.3 | Graphik glatter, weniger Latenz | Must | done | `2.21.0` — bestehendes härten |
| S26.4 | Amazon Musik als Spotify-Alternative | Must | done | `2.21.0` — Intent; interne API nur mit Zugang |
| S26.5 | Chats in Ordner sortieren | Must | done | `2.21.0` — lokal |
| S26.6 | Instanudeln-Angebot benachrichtigen | Must | done | `2.21.0` — Research + Notify, nichts erfinden |
| S26.7 | FC 26 Mannschaft + Tablet-Karten | Must | done | `2.21.0` — Foto, Jahr fragen, drei Vorschläge |

---

## Aktuelle Prioritätsreihenfolge (Pull-Reihenfolge)

1. Sideload `2.28.0` — [`apk.md`](./apk.md)
2. Mail / Cloud-Kalender / Alexa / Play Store / iOS — **Parking**

## Parking Lot (Ideen, nicht geplant)

- Mehrere Jarvis-„Stimmungs“-Presets über Eggs hinaus
- Export der Chat-History
- Komplett offline ohne jegliche Modell-Downloads nach Initial-Setup (Policy später)
- Richere Joke-Harvest-UX / Research-LLM-Synth mit Citation-Gate
- Mail / Cloud-Kalender-OAuth / **Amazon Fire TV** / Alexa
- Play Store Listing / iOS
- Optional lokaler Kalender-Read (ICS) — Parking (Sprint 30 P7)
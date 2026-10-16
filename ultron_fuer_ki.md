# Ultron — Systemkontext für eine entwickelnde KI

Stand dieser Datei: **16. Oktober 2026**. Gelesen gegen `origin/main` bei Commit `5d115ebc` (`merge: Master-Duel-Vorlage als Sprints 531-550`). App-Version in diesem Baum: **18.51.3**, Android-`versionCode` **185103**.

Diese Datei ist der Arbeitskontext. Ältere Dokumente unter `docs/` widersprechen sich bei Version, Agentenzahl und Hirn-Reihenfolge. Wenn ein Satz hier und ein Satz in `docs/01-vision.md` oder `docs/02-architecture.md` verschieden sind, gilt der **Code**, und diese Datei nennt die Datei, in der der Code steht.

Produktname in der Oberfläche: **Ultron**. Repo, Paket und Speicher heißen weiter **Jarvis** (`Gamerio2904/Jarvis`, npm-Paket `jarvis-frontend`, IndexedDB `jarvis-ondevice`). Es gibt keine zweite Codebasis.

---

## 1. Projekt-Overview und Core Mission

Ultron ist ein privater Assistent für eine Person, auf dem eigenen Android-Tablet oder Handy, dieselbe Oberfläche auch im Browser. Er führt Alltagsaktionen aus (Einkauf, Todos, Notizen, Kalender, Timer, Filme, Fahrt, Fernseher, Haus, PC) und spricht Smalltalk. Daten und Schlüssel bleiben auf dem Gerät. Es gibt kein Konto, keinen Store, kein iOS, keine öffentliche Nutzerbasis.

### Ziel

Ein Satz soll eine echte Wirkung haben oder eine ehrliche Absage. Das Sprachmodell formuliert. Es führt keine Aktion aus und erzählt keine erledigte Tat, die der Speicher nicht enthält.

### Hauptfunktionen, die im Baum 18.51.3 liegen

- Chat und Sprache, Siezen, Ultron-Ton.
- Homescreen mit App-Kacheln, Dock, Mini-Chat.
- Einkaufslisten, Todo-Listen, Notizen, Kalender, Timer, Wecker, Erinnerungen.
- Watchliste und Lieblinge, OMDb.
- Fahrmodus / CarPlay-artige Fläche, Karte, Tankstellen, POI.
- Lage: Körper-Schema, Agenten-Karte, Globus, Serie.
- Tischplatte: Ideen, Sprints, Ablauf, Portfolio, stummer App-Entwurf, GUI-Simulation im Planungsrahmen.
- Fernseher (Samsung / Tizen): YouTube, Netflix, Disney, Prime. YouTube ist Suche und Start auf dem Gerät, kein Kanal-Feed.
- PC-Werkzeug im WLAN (`desktop/JarvisPC.bat`): Screenshot, Klick, Start, YouTube-Schnitt.
- Haus: Shelly / Tasmota / Tuya im LAN, Ventilator.
- Schach lokal. Yu-Gi-Oh!-Duell als lokaler Prototyp mit TCG-Subset, Self-Play und Nachweis.
- Hausstand: Export/Import und Tablet-Sync.

### Architekturform

Ein **Client-Monolith**. Kein Microservice, kein Anwendungs-Server, kein LangChain, kein CrewAI, kein AutoGen.

| Schicht | Wo sie läuft |
|---|---|
| Oberfläche | React in einer Capacitor-WebView, oder Vite im Browser |
| Hirn und Agenten | TypeScript im selben WebView-Prozess |
| Speicher | `localStorage` und IndexedDB auf dem Gerät |
| Native Kanten | Java-Plugins, die Capacitor aufruft (Standort, TV, Haus, Stimme, Notify) |
| PC | Separater Node-Prozess nur als Werkzeug, kein zweites Gedächtnis |

Die „Agenten“ sind **Domänen-Module mit einem Regex-Parser und einem Executor**, orchestriert von einem Director. Ein Zug wählt **einen** Domänen-Agenten. Es gibt keinen Schwarm und keinen Agenten, der andere Agenten per Prompt ein- und ausschaltet.

```text
[Mensch: Tastatur oder Mikrofon]
        |
        v
[React-UI  App.tsx / HomeScreen / Chat]
        |
        v
[chat.streamChat]
        |
        +-- Parser-Katalog und Director  -->  eine echte Wirkung im Speicher oder am Gerät
        |
        +-- sonst BrainOrchestrator       -->  nur Text (Smalltalk, Recherche, Sehen)
        |
        v
[guards.scrubReply]  -->  Anzeige und Sprache
        |
        v
[IndexedDB + localStorage]
```

---

## 2. Technologie-Stack und Frameworks

### Sprachen

- **TypeScript** für UI, Engine, Tests (`frontend/`).
- **Java** für Android-Plugins (`frontend/native/`). Die Android-Hülle unter `frontend/android/` ist gitignored und wird vom Build erzeugt.
- **JavaScript (Node, ESM)** für den PC-Helfer (`desktop/jarvis-pc.mjs`, `desktop/clip-job.mjs`).
- **Kein Python** im Produktpfad.

### Laufzeit und Build

| Stück | Version / Paket | Rolle |
|---|---|---|
| React | 19 (`react`, `react-dom`) | Eine Single-Page-App. Kein Router-Framework, kein Next.js |
| Vite | 8, `@vitejs/plugin-react` | Dev-Server und Build. Einstieg `frontend/` |
| TypeScript | 6 | `tsc -b` |
| Capacitor | 8 (`@capacitor/android`, `core`, `filesystem`) | Packt das Web-Build in die APK |
| CSS | eigenes `frontend/src/index.css` plus `ultron-shell.css` | Kein Tailwind, kein MUI, kein Chakra |
| Lint | oxlint | `npm run lint` im Ordner `frontend` |
| Tests | `node --experimental-strip-types` | Skripte in `frontend/scripts/`, aufgerufen über npm-Scripts in `frontend/package.json` |

UI-Bibliotheken neben React: `thinking-orbs` (Antwort-Orb), `qrcode`, `jsqr`. Schrift: Manrope, Outfit, Cormorant Garamond. Akzent im dunklen Schema: `#ff2a36`.

### Modelle

Es gibt **kein** Anthropic-SDK und keinen festen GPT-4o-Client.

| Hirn | Client | Wann |
|---|---|---|
| Gemini Flash | `frontend/src/engine/gemini.ts`, REST `generativelanguage.googleapis.com/v1beta` | Chat, sobald ein Gemini-Key da ist. Vision und Deep Research sind eigene Slots |
| Groq | `frontend/src/engine/groq.ts`, OpenAI-kompatible Chat-Completions | Nächstes Cloud-Hirn, wenn Gemini fehlt. **Einziger** Weg für erzwungenes JSON (`completeGroqJson`) |
| Lokal | `@wllama/wllama`, Gewicht `Qwen/Qwen2.5-0.5B-Instruct-GGUF`, Datei `qwen2.5-0.5b-instruct-q4_k_m.gguf` (~470 MB) | Letzter Fallback, nur wenn das Modell geladen ist. `frontend/src/engine/llm.ts` |
| Gemini TTS | `frontend/src/engine/tts.ts` | Liest vorhandenen Text. Ersetzt das Denkmodell nicht |

Modellreihen in `frontend/src/engine/cloud-errors.ts`:

- Gemini, beste zuerst: `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-2.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`.
- Groq, beste zuerst: `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `groq/compound-mini`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-120b`. Ein totes Modell wird über `groq_skip_until` übersprungen.

**Wahl im Code, nicht in der README.** `primaryChatModel` in `frontend/src/engine/brain-tasks.ts`:

1. `brain_v2` aus: Gemini, wenn Key und Schalter an, sonst Groq, sonst lokal.
2. `brain_v2` an und `brain_primary === 'local'`: lokal.
3. Sonst: Gemini, sobald Key und Schalter an, sonst Groq, sonst lokal.

Default in `frontend/src/engine/store.ts`: `brain_v2: true`, `brain_primary: 'gemini'`. Die README und mehrere `docs/0*.md` schreiben noch „Groq primär“. Das ist Dokumentation hinter dem Code. `brainLabel` schreibt bei einem Groq-Treffer trotzdem „Groq (primär)“. Das ist eine Beschriftung, keine Routing-Regel.

Tageslimit: `quotaBlocked` in `quota.ts` stuft auf das lokale Modell um, wenn es geladen ist (`demoteOnQuota` in `brain.ts`).

### Function Calling

Der Hauptweg ist **kein** Provider-Tool-Call. Ein Parser erkennt den Satz und nennt die Aktion.

Ein JSON-Schema gibt es nur für den Vorschlagsweg: `completeGroqJson` mit `response_format: json_schema, strict`, aufgerufen von `tool-propose.ts`, nur wenn `tool_propose` an ist, ein Groq-Key da ist und das Groq-Kontingent nicht zu ist. Das Modell nennt ein Werkzeug. Ausführen tut danach der bestehende Parser, an einem aus dem Vorschlag gebauten deutschen Satz. Schreiben und Geräte warten auf ein Ja.

### Datenbanken und Fremd-APIs

Keine Server-Datenbank. Kein Redis, kein Vektorindex, kein SQLite, keine Embeddings.

| Speicher | Schlüssel | Inhalt |
|---|---|---|
| `localStorage` | `jarvis_settings_v13` | Einstellungen, API-Keys, Planungszustand, letzte Tool-Spur, Layout |
| IndexedDB | Datenbank `jarvis-ondevice`, Version **17** | Gespräche, Listen, Pläne, Filme, Hausstand-Stücke |

Fremde Dienste, alle vom Gerät aus, Schlüssel nur lokal: Groq, Gemini, OMDb, YGOPRODeck (Kartendaten und Bilder auf Anfrage), DuckDuckGo-HTML für die YouTube-Suche, Wetter- und Nachrichtenquellen hinter den jeweiligen Engine-Modulen, JustWatch für Film-Angebote (`tv-watch.ts`). PC-Schnitt braucht auf Windows `yt-dlp`, `ffmpeg`, `libass`.

### Version und APK

Dieselbe Nummer muss gleich bleiben:

- `frontend/package.json` → `"version"`
- beide Versionfelder in `frontend/package-lock.json`, wenn die Nummer gezogen wird
- `APP_VERSION` in `frontend/src/engine/store.ts`
- die lokale Konstante `APP_VERSION` in `frontend/src/ui/YugiohDuel.tsx`
- `ENGINE_STAMP` in `frontend/src/engine/yugioh-proof.ts` ist **getrennt**: hier `'18.51.0-ygo-tcg'`. Das ist der Duell-Motor, nicht die App-Version.

`versionCode` = `major * 10000 + minor * 100 + patch`. Für 18.51.3 ist das **185103**. Patch oder Minor über 99 bricht die Formel. Android verweigert ein Update, wenn `versionCode` nicht steigt. Build: `./build-apk.sh` im Repo-Root, Windows `build-apk.bat`. Die gebaute Hülle `frontend/android/` nicht committen.

`frontend/scripts/test-cook.mjs` verlangt fest `APP_VERSION === '18.11.4'`. Das Skript ist stehengeblieben. Es ist kein Versions-Gate und steht nicht als npm-Script in `package.json`. Nicht darauf hin veröffentlichen.

---

## 3. Informationsarchitektur und Verzeichnisstruktur

```text
/workspace                         Repo-Root (Gamerio2904/Jarvis)
├── README.md                      Kurzstart, aktuelle Versionszeile
├── ULTRON_ARCHITECTURE_OVERVIEW.md
│                                  Ältere Architektur, Planungsmodus.
│                                  IndexedDB dort noch als Version 15 beschrieben.
│                                  Diese Datei hier ist der neuere Kontext.
├── ultron_fuer_ki.md              Diese Datei
├── build-apk.sh / build-apk.bat   APK bauen
├── releases/Jarvis.apk            Test-APK, die die README auf main nennt
├── desktop/                       PC-Werkzeug, kein Hirn
│   ├── JarvisPC.bat
│   ├── jarvis-pc.mjs              Werkzeug :18790, Fenster-Kanal :18791
│   ├── clip-job.mjs               YouTube-Highlights nach %USERPROFILE%\Videos\Jarvis
│   └── README.md
├── docs/                          Planung, Tests, Changelog. Vieles historisch
│   ├── README.md                  Lesereihenfolge, Sprint-Index
│   ├── 01-vision.md … 106-next.md Produktpläne. Versionszeilen oft alt
│   ├── yugioh-duel.md             Duell-Grenzen
│   ├── apk.md                     versionCode und Sideload
│   ├── sprints/                   Ein Markdown pro Sprint
│   └── TEST-*.md                  Satzpakete zum Prüfen
└── frontend/                      Die App
    ├── package.json               18.51.3 und alle npm-Scripts
    ├── src/
    │   ├── main.tsx               React-Einstieg
    │   ├── App.tsx                Shell, Dock, Moduswechsel
    │   ├── index.css              Globales Layout
    │   ├── ui/                    React-Flächen
    │   ├── engine/                Hirn, Parser, Speicher, Geräte
    │   ├── engine/agents/         Katalog, Bus, Curator, Runner
    │   ├── native/                TS-Brücken zu Java
    │   ├── data/                  Eingebettete Daten (rm-snapshot.json)
    │   └── assets/ / fx/
    ├── native/                    Java-Plugins, vom Build in die APK kopiert
    ├── scripts/                   Tests und GUI-Prüfskripte (~123 Dateien)
    ├── public/wllama/             WASM für das lokale Modell
    └── android/                   gitignored, entsteht beim APK-Build
```

`frontend/src/engine/` hat rund **360** TypeScript-Module. Sie sind nach Thema benannt, nicht nach Schicht. Die wichtigsten:

### Einstieg und Zug

| Datei | Rolle |
|---|---|
| `engine/chat.ts` | `streamChat`. Teilt Sätze, ruft den Director, sonst das Hirn, schreibt die Antwort |
| `engine/director.ts` | Ein Zug: Pending, Fenster, Gewohnheit, Router, Vorschlag, Ausführung |
| `engine/route-pick.ts` | `decideTurn` / `propose`: Parser-Scores, Konflikte, Policy |
| `engine/agents/parse-catalog.ts` | Jeder Domänen-Agent: `id`, `sideEffect`, `parse` |
| `engine/agents/execute-map.ts` | `id` → Executor-Funktion |
| `engine/agents/executor-ids.ts` | Die 70 IDs, die einen Executor haben |
| `engine/agents/runner.ts` | `runAgent`: Budget, Wiederholung, Schalter |
| `engine/agents/bus.ts` | `agentDispatch` |
| `engine/agents/curator.ts` | `curatorPreflight`, Gedächtnis-Pflege, Budget etwa 2,5 s |
| `engine/agents/trace-store.ts` | Trace nur des laufenden Zugs, im Speicher |
| `engine/guards.ts` | `scrubReply`. Erfundene Erfolgsmeldungen werden ersetzt |
| `engine/utterance.ts` | Normalisierung und Tippfehler-Reparaturen vor dem Parser |
| `engine/turn-abort.ts` | Abbruch-Signal. Nach Abbruch kein zweites Hirn |
| `engine/turn-detect.ts` | Backchannel gegen echtes Reinreden |

### Hirn

| Datei | Rolle |
|---|---|
| `engine/brain.ts` | `brainKind`, `completeBrain`, Kontingent-Abstieg |
| `engine/brain-tasks.ts` | `primaryChatModel`, `planBrainSlots` |
| `engine/brain-orchestrator.ts` | Slots: `micro-clarify`, `micro-merge`, `chat`, `research-lite`, `research-deep`, `vision`, `local-fallback`, `shadow` |
| `engine/brain-pick.ts` | Wahl, wenn `brain_v2` aus ist |
| `engine/groq.ts` / `gemini.ts` / `llm.ts` | Die drei Clients |
| `engine/tool-propose.ts` | Groq-JSON-Vorschlag. Führt nichts aus |
| `engine/tool-contract.ts` | Erlaubte Werkzeugnamen und das JSON-Schema |
| `engine/quota.ts` / `cloud-errors.ts` | Kontingent und Modellreihen |

### Alltag

| Datei | Rolle |
|---|---|
| `engine/shopping-parse.ts`, `shopping` im Katalog | Einkauf |
| `engine/tools.ts`, `tools-parse.ts` | Todos und Notizen. `parseToolIntent`, `parseLocalDeadline` |
| `engine/calendar.ts` | Termine, `scheduleEventNotifies`, Offsets in Minuten |
| `engine/watchlist.ts`, `watchlist-parse.ts`, `omdb.ts` | Filme, OMDb, Verschieben zwischen Listen |
| `engine/timer` / Alarm / Reminder-Module | Timer, Wecker, Erinnerung |
| `engine/drive.ts` | Route. Standort darf nicht still das Ziel werden |
| `engine/tv.ts`, `tv-parse.ts`, `tv-watch.ts` | Fernseher und YouTube-Suche |
| `engine/home-apps.ts` | Kachel-IDs des Homescreens |

### Planung

| Datei | Rolle |
|---|---|
| `engine/idea.ts`, `idea-parse.ts`, `idea-plan.ts` | Agent `idea`, Plan-JSON, `fillPlanWithModel` |
| `engine/ablauf.ts`, `ablauf-parse.ts` | Ablauf-Fenster |
| `engine/plan-desk.ts` | Zeilen für die Tafel |
| `engine/board.ts`, `board-parse.ts`, `board-wire.ts` | Tischplatte |
| `engine/entwurf.ts` | Stummer App-Entwurf, keine laufende Funktion |
| `engine/portfolio.ts`, `project-docs.ts` | `Go` speichert Karten und JSON |

### Lage, Spiele, Wissen

| Datei | Rolle |
|---|---|
| `engine/hud.ts`, `hud-parse.ts` | Lage-Ansichten, einschließlich Globus |
| `engine/chess.ts` | Schachmotor |
| `engine/yugioh-*.ts` | 15 Module: Duell, Zonen, Effekte, PSCT, Self-Play, Suche, Nachweis, Liga, Decks |
| `engine/retrieve.ts` | Recall per Token-Überlappung, keine Embeddings |
| `engine/working-memory.ts` | Höchstens 8 Zeilen, JSON in den Settings |
| `engine/memory*.ts`, `knowledge*.ts` | Gedächtnis und Teach-Packs |
| `engine/backup.ts` | Hausstand-JSON |

### Oberfläche `frontend/src/ui/`

| Datei | Fläche |
|---|---|
| `HomeScreen.tsx` | Kacheln, Layout |
| `App.tsx` | Dock und Modi |
| `MiniChat.tsx` | Chat am Rand |
| `VoiceMode.tsx`, `VoiceSphere.tsx` | Sprache |
| `ShoppingListsOverlay.tsx` | Einkauf |
| `TodoListsOverlay.tsx` | Todos |
| `NotesOverlay.tsx` | Notizen |
| `WatchlistOverlay.tsx` | Filme |
| `Calendar.tsx` | Kalender |
| `DriveMode.tsx` | Fahrt |
| `ScriptStage.tsx` | Planungsbildschirm, wenn `plan_phase === 'live'` |
| `BoardStage.tsx`, `AblaufWindow.tsx`, `EntwurfStage.tsx`, `PortfolioStage.tsx` | Tischplatte |
| `lage/Lage.tsx`, `GlobeView.tsx`, `BodySchema.tsx`, `AgentMapCanvas.tsx`, `ChessBoard.tsx` | Lage |
| `YugiohDuel.tsx`, `yugioh-duel.css` | Duell |
| `ChessMode.tsx` | Schach |
| `TabletShell.tsx`, `useTabletRuntime.ts` | Tablet-Vollbild |
| `SettingsScreen.tsx` | Schlüssel und Schalter |
| `PcDashboard.tsx`, `PcPairScan.tsx` | PC-Kopplung |

### Java `frontend/native/`

| Ordner | Rolle |
|---|---|
| `geo/JarvisGeoPlugin.java` | Standort |
| `tv/` | Samsung-Start, ADB-Shell, `MainActivity` |
| `voice/` | Hören, Wake-Word, Debug-Dienst |
| `notify/` | Benachrichtigung, Wecker, Widget, Inbox |
| `haus/` | Hausstand-Dienst |
| `home/` | Steckdosen |
| `presence/` | Anwesenheit im WLAN |
| `device/` | Downloads, Mail, TLS |
| `fenster/JarvisFensterPlugin.java`, `JarvisFensterService.java` | Zweites Fenster. Der Dienst beendet sich, er hält keinen Vordergrunddienst |

### Agenten-Katalog

70 Executor-IDs in `executor-ids.ts`. Intern `router`, `curator`, `propose` sind Traces, keine `AgentSpec`. `sideEffect` ist `read`, `write` oder `device`. Ein Schreib- oder Gerätefehler fällt **nicht** ins freie Modell zurück (`failureReply` in `director.ts`).

| ID | Wirkung | Gegenstand |
|---|---|---|
| `identity` | read | Wer Ultron ist |
| `wont` | read | Ausdrückliche Absage |
| `tv` | device | Fernseher, Apps, YouTube-Suche |
| `film` | read | Filmfakten |
| `clip` | device | YouTube-Highlights, Schnitt auf dem PC |
| `xfer` | write | Datei-QR zwischen Geräten |
| `watchlist` | write | Watchliste und Lieblinge |
| `osint` | read | Offene Lage-Quellen, kein iframe |
| `fan` | device | Ventilator |
| `plug` | device | WLAN-Steckdose |
| `here` | read | Wo bin ich |
| `fuel` | device | Tanken |
| `poi` | device | Orte in der Nähe |
| `transit` | read | ÖPNV |
| `drive` | device | Route, Fahrmodus |
| `device` | device | Geräte-Sätze, die keiner engeren Domäne gehören |
| `pc` | device | PC-Werkzeug |
| `maps` | device | Karte |
| `teach` | write | Etwas ins Wissen legen |
| `expert` | write | Experten-Anlage, Rückfrage |
| `pack` | write | Knowledge-Pack |
| `memory` | write | Merk-Satz |
| `shopping` | write | Einkauf |
| `birthday` | write | Geburtstag |
| `home` | write | Zuhause-Ort |
| `leave` | read | Weggehen / Abwesenheit |
| `brief` | read | Kurzes Briefing |
| `holiday` | read | Feiertag |
| `calendar` | write | Termin |
| `alarm` | write | Wecker |
| `timer` | write | Timer |
| `reminder` | write | Erinnerung |
| `todo` | write | Todo und Notiz über `parseToolIntent` |
| `idea` | write | Planung, Ablauf, Portfolio, Bot-Frage |
| `desk` | read | Lesender Satz auf die Fläche |
| `board` | write | Tischplatte schieben, Jobs |
| `eye` | write | Sehen / Scan |
| `doc` | read | Dokument im Store `docs` |
| `weather` | read | Wetter |
| `news` | read | Nachrichten |
| `search` | read | Suche |
| `warn` | read | Warnlage |
| `blitzer` | read | Blitzer |
| `chat-folder` | write | Chat-Ordner |
| `watch-price` | write | Preiswache |
| `amazon` | device | Amazon Music |
| `recall` | read | Etwas aus dem Speicher holen |
| `ferien` | read | Ferien |
| `fx` | read | Wechselkurs |
| `food` | read | Essen |
| `cook` | read | Kochen |
| `library` | read | Bibliothek |
| `sport` | read | Sport |
| `sky` | read | Himmel / Flüge am Ort |
| `nature` | read | Natur |
| `flights` | read | Flüge |
| `law` | read | Recht, mit Quellengrenze |
| `haushalt` | read | Haushalt |
| `sensors` | read | Sensoren |
| `chess` | write | Schach |
| `hud` | write | Lage umschalten |
| `trace` | read | Letzten Zug zeigen |
| `digest` | write | Tagesabriss |
| `outlook` | read | Ausblick, zitiert, kein Orakel |
| `taxi` | read | Taxi |
| `backup` | read | Hausstand exportieren / importieren |
| `face` | write | Stimme / Gesicht Jarvis oder Friday |
| `app` | write | App-Fläche öffnen |

`fenster` läuft **vor** dem Katalog in `director.ts` über `handleFensterCommand`. Es ist kein Katalog-Agent.

### Homescreen auf `main`

`HOME_APP_IDS` in `home-apps.ts`: `chat`, `voice`, `calendar`, `globe`, `lage`, `overlay`, `hirn`, `settings`, `watchlist`, `shopping`, `notes`, `todos`, `tisch`, `chess`, `yugioh`. Das sind 15 Kacheln. `globe` und `lage` zeigen beide eine Welt-Ansicht. Draft-PR 213 nimmt `globe` aus dieser Liste.

### IndexedDB-Stores, Version 17

Schlüssel `id`, außer `pending` (`conversation_id`):

`conversations`, `messages`, `memory`, `notes`, `todos`, `todo_lists`, `ideas`, `watch_movies`, `watched_movies`, `pending`, `research_audits`, `reminders`, `events`, `shopping`, `shopping_lists`, `price_watches`, `docs`, `xfer`, `plans`, `portfolio`, `drafts`, `knowledge_packs`, `rm_scene_skills`, `memory_proposals`.

Upgrade auf 17 legt die Todo-Liste `todo-list-general` an und hängt alte Todos daran.

### Settings, die ein Zug lesen muss

In `jarvis_settings_v13`, Auszug: `groq_api_key`, `gemini_api_key`, `gemini_enabled`, `brain_v2`, `brain_primary`, `brain_micro_llm_clarify`, `brain_micro_llm_merge`, `brain_gemini_roles_vision`, `brain_gemini_roles_grounding`, `tool_propose`, `agent_network_v2` (Default an), `last_step_tool`, `last_step_title`, `last_medium`, `plan_phase` (`''` | `live` | `go`), `plan_idea_id`, `plan_conversation_id`, `tischplatte_on`, `home_layout_json`, `last_lat`, `last_lon`, `last_fix_at`.

Schlüssel stehen im Hausstand-Export. Vor einer Deinstallation exportieren, sonst sind sie weg. Kein Schlüssel gehört in die APK oder in den Chat.

### Vorschlags-Verträge, die es schon gibt

`tool-contract.ts`: `set_timer`, `set_alarm`, `create_reminder`, `create_calendar_event`, `add_shopping_item`, `switch_tv`, `open_watchlist`, `open_favorites`, `open_settings`, `close_overlay`, `set_jarvis_flag`, `get_news`, `get_weather`, `get_sport`.

Nicht im Vertrag, obwohl die Parser sie können: Einkauf vorlesen, Film verschieben, Notiz speichern, Todo mit Deadline. Ein freier Satz dafür trifft den Vorschlagsweg nur, wenn er nach einem Befehl klingt **und** der gerenderte deutsche Satz einen bestehenden Parser trifft.

---

## 4. Datenfluss und Kern-Logik

### Ein Chat-Zug

`streamChat` in `chat.ts` ist der einzige Ausgang, der die Antwort in die Historie schreibt.

```text
streamChat
  normalizeUtterance + Satzteilung
  routeDeterministic
      agent_network_v2 aus  ->  alter Registry-Weg
      agent_network_v2 an   ->  runDirectorTurn
  Treffer (hit):
      Fakten merken, micro-merge darf den Satz umformulieren
      micro-merge darf keine neue Tat erfinden
  kein Treffer und nicht abgebrochen:
      runBrainOrchestrator
  scrubReply
  sayAssistant
```

`routeDeterministic` fängt vor dem Director Hilfe, Identität, Begrüßung, offene Geräte-Rückfragen und einen Ketten-Nachlauf ab. Ordinalzahlen („das zweite“) beziehen sich auf `last_step_tool` und die letzte Liste.

### Director, in dieser Reihenfolge

`runDirectorTurn` in `director.ts`:

1. `beginAgentTurn` und `curatorPreflight`.
2. Offenes `pending` schlägt alles:
   - Werkzeug-Vorschlag (`PROPOSAL_TOOL`), älter als 24 h verfällt.
   - App-Flag, Kalender-Offsets, HUD-Szene, Experten-Anlage, sonst Todo-Bestätigung über `handleTools`.
3. `handleFensterCommand`.
4. Gewohnheit (`replyForHabit`) und ein Dokument ohne Recherche.
5. `decideTurn`:
   - jeder Parser liefert einen Score oder `null`
   - Konflikte (`conflicts.ts`)
   - Nachlauf-Bonus für den letzten Agenten
   - Kosten: Lesen 0, Schreiben −0.02, Gerät −0.05
   - Policy: `run`, `ask` oder `none`
6. `none`:
   - Deep Research darf ins Hirn.
   - Lebender Plan (`plan_phase === 'live'` in diesem Gespräch) geht an `handleIdea`.
   - Ein verpasster Planungssatz wird abgelehnt, die Tischplatte bleibt.
   - `rescueByProposal`, nur wenn `looksCommandish` und `proposeReady`.
   - Sonst, wenn der Satz nach einem Befehl klingt: ehrliche Unbekannt-Antwort.
   - Sonst `hit: null` und das Hirn spricht.
7. `ask`: bei `brain_micro_llm_clarify` eine kurze Groq-Rückfrage (600 ms, sonst der feste Satz). Sonst `askReply`.
8. `run`: `runPicked` → `runAgent`. Abbruch liefert `hit: null` und `aborted`. Fehler bei Schreiben ohne Recover werden nicht an das Hirn gegeben.

### Vorschlagsweg

`rescueByProposal`:

1. Groq liefert JSON `{ tool, args }` aus dem Schema.
2. Fehlende Pflichtfelder: Rückfrage „Welche {label} soll ich verwenden?“
3. `confirmedUtterance` baut einen deutschen Satz.
4. `decideTurn` muss auf diesem Satz denselben Agenten wählen. Sonst wird der Vorschlag verworfen.
5. `sideEffect !== 'read'`: Pending und „Verstanden als „…“. Soll ich?“
6. Lesen: `runPicked` sofort.
7. Das Ja später ruft `runPicked` mit dem gespeicherten Satz auf. Das Modell führt nie aus.

`looksCommandish` ist eine Verb-Liste am Satzanfang (`utterance.ts`). Ein Satz wie „Was muss ich noch einkaufen?“ oder „Star Wars von der Watchliste auf die Lieblingsliste“ kann diese Liste verfehlen, im Hirn landen und eine erledigte Tat erzählen. `scrubReply` fängt viele solcher Sätze (`FAKE_CLAIM` in `guards.ts`). Er fängt nicht jede Formulierung. Die echte Watchlist-Antwort lautet „Zu den Lieblingen, weg von der Watchliste: …“. Die darf der Guard nicht umschreiben.

### Hirn-Slots

`planBrainSlots` in `brain-tasks.ts`, erste passende Regel:

| Bedingung | Slot |
|---|---|
| Vision und Rolle an | `vision` (Gemini) |
| Deep Research und Grounding an | `research-deep` |
| Live-Lookup oder angenommene Recherche | `research-lite` oder `research-deep` |
| Policy-Rückfrage und Micro-Clarify an | `micro-clarify` (Groq, 600 ms) |
| User-Fakten und Micro-Merge an | `micro-merge` (nur umformulieren) |
| `needsLlm` | `chat` |
| sonst | `none` |

`micro-merge` bekommt die Systemzeile: ein bis zwei Sätze Ultron-Stimme, nur Fakten aus dem Block, keine neue Tat. `brain_shadow_mode` vergleicht den alten Weg, Default aus.

### YouTube, konkret

`youtubeSearch` in `tv-watch.ts` sucht bei DuckDuckGo und gibt einen Deep-Link zurück, wenn die Trefferseite einen enthält. `youtubeSearchLink` baut immer `https://www.youtube.com/results?search_query=…`. `tv.ts` startet damit die YouTube-App auf dem Samsung-Fernseher. Highlights (`clip`) schneiden eine URL, die der Mensch schon genannt hat. Es gibt **kein** Werkzeug, das den letzten Upload eines Kanals holt. Ein solcher Satz darf keinen `watch?v=`-Link erfinden.

### Planung

1. Ein Satz trifft den Agenten `idea` (`Plane das Projekt`, `öffne den Planungsbildschirm`, …).
2. `plan_phase` wird `live`, die Tischplatte geht an, `HomeScreen` zeigt `ScriptStage`.
3. `fillPlanWithModel` schickt die Bedingung an Groq, bei Fehlschlag an Gemini. Ein JSON-Objekt. `parsePlan` baut ein `IdeaPlan`.
4. Ohne Modellkörper zerlegt `fillFromClauses` den Satz an Komma und Semikolon in einen Sprint.
5. `Go` setzt `plan_phase` auf `go` und legt die Portfolio-Karte. Export erst dann.
6. Der Fill sieht die Bedingung und eine leere Sprint-Hülle. Er sieht nicht den Chat-Verlauf und nicht `retrieve`.
7. `prompt` im Sprint ist Text zum Kopieren, höchstens 480 Zeichen. Er startet keinen Programmier-Agenten.

### Speicherfluss

Executoren lesen und schreiben dieselben Stores. Es gibt kein gemeinsames Agenten-Gedächtnis zwischen den Zügen außer:

- die Settings-Spur (`last_step_tool`, Titel, Medium)
- `working-memory` (8 Zeilen)
- IndexedDB
- der Trace, der mit dem nächsten Zug verfällt

`retrieve.ts` hängt Treffer an den Chat-Prompt. Der Planungs-Fill tut das nicht.

Hausstand (`backup.ts`) serialisiert Settings ohne flüchtige Felder plus die Stores. Import ersetzt. Der Tablet-Abgleich entscheidet nach Zeitstempel `stand_at`, nicht nach kausalen Revisionen. Der native Kanal liegt in `frontend/native/haus/`. Vor einer Änderung dort die Java-Dateien lesen.

### Standort

Wetter, POI und „Wo bin ich“ schreiben `last_lat` / `last_lon` vom Gerät. Eine genannte Stadt ist kein GPS-Fix. `beginDriveTo` darf bei fehlendem GPS das Ziel nicht als Standort des Menschen einsetzen. Draft-PR 213 verschärft das zusätzlich (frischer Fix, kein Stuttgart-Fallback). Auf `main` den aktuellen `drive.ts` lesen, bevor daran weitergebaut wird.

---

## 5. Aktueller Entwicklungsstand und offene Baustellen

### Was auf `main` (`5d115ebc`, 18.51.3) läuft

- Der Zug oben: Parser, Director, ein Agent, Hirn nur für Text, Guard gegen erfundene Erfolge.
- Alltag: Einkauf, Todos, Notizen, Kalender, Timer, Watchliste, Fahrt, TV, Haus, PC, Lage, Schach.
- Planung: Idee, Fill, Tafel, Ablauf, Portfolio, stummer Entwurf.
- Yu-Gi-Oh!: lokales Duell, Self-Play, Zugsuche, Nachweis, TCG-Subset (Zonen, Spell Speed, Effekt-Schema, PSCT). `ENGINE_STAMP` `18.51.0-ygo-tcg`. Prototyp, keine Turnier-Engine. Grenze: `docs/yugioh-duel.md`.
- Sprints 531–550 sind auf `main` als **Plan** in `docs/106-next.md` und `docs/sprints/sprint-531.md` bis `sprint-550.md` eingebunden. Die Master-Duel-Bedienung ist in diesem Baum nicht gebaut.
- Test-APK laut README: `releases/Jarvis.apk`, 18.51.3 / 185103. Das ist ein Test-Build, keine Release-Freigabe.
- Tablet-Sync und Planungs-Gates 18.32–18.41 sind vorbereitet, nicht als eigene Releases abgenommen.

### Zwei offene Draft-PRs, nicht in diesem Baum

Nicht mergen, nicht als „ist schon auf main“ behandeln.

| PR | Branch | Inhalt |
|---|---|---|
| [#213](https://github.com/Gamerio2904/Jarvis/pull/213) | `cursor/alltag-listen-standort-a6ca`, Commit `bba4f471` | Einkauf: „was muss ich noch einkaufen“ liest die Liste, leer heißt „Einkaufsliste ist leer.“ Lang-Druck wählt mehrere Posten und löscht sie. Todo mit „bis nächste Woche Freitag“ bekommt ein Datum und einen Kalendereintrag, Erinnerung 1 Tag (1440 min) und 2 Stunden (120 min) davor, ohne Uhrzeit 18:00 lokal. Notiz „neue notiz: …“ speichert den Wortlaut. Watchlist-Satz mit Verb am Ende und Tippfehlern verschiebt wirklich. „the gentleman serie“ sucht die Serie. Homescreen nur noch Lage, Kugel-Kachel weg. CarPlay setzt den Menschen nicht auf das Ziel und nicht auf einen alten Stuttgart-Punkt. Version bleibt 18.51.3 |
| [#212](https://github.com/Gamerio2904/Jarvis/pull/212) | `cursor/ygo-md-sprints-531-550-a6ca` | Sprints 531–550 als Duell-UI, Version **18.60.0** / versionCode **186000**. Dazu spätere Fixes: keine Weltlage- und WLAN-Benachrichtigung, Kacheln verschieben, Schach-Silhouetten, kurze Denkpause, fünf Zonenreihen, leere Planungsdatei, Chat rechts, GUI-Simulation. Die schon gebaute APK 18.60.0 enthält die späteren Fixes nicht. Ein Sideload darüber braucht einen höheren `versionCode` |

Ein installiertes Tablet kann 18.60.0 zeigen und trotzdem weder PR 212-Nachzügler noch PR 213 enthalten. Die Versionszahl auf dem Gerät ist nicht der Git-Stand.

### Freie Sätze: besprochen, nicht gebaut

Gewünschtes Verhalten, noch kein Code:

- Jeder Satz, den kein Parser sicher hat, bekommt einen Verstehensschritt. Smalltalk bleibt Smalltalk.
- Der Schritt sieht ein Faktblatt aus dem Speicher: letzte Zeilen, letztes Werkzeug und letzter Titel, offene Einkäufe oder „Liste leer“, Watch- und Lieblingstitel, offene Todos mit Datum, offener Bildschirm.
- Antwort nur als Struktur. Ein Treffer wird in einen Satz übersetzt, den ein bestehender Parser schon kennt.
- Lesen sofort. Schreiben einmal „Verstanden als …. Soll ich?“
- Das Modell wählt nur ein vorhandenes Werkzeug. Es erfindet keins.
- Erster Ausbau, wenn er gebaut wird: den vorhandenen Weg in `tool-propose.ts` und `director.ts` für jeden unklaren Satz öffnen, vier Verträge ergänzen (Einkauf vorlesen, Film verschieben, Notiz speichern, Todo mit Deadline), etwa dreißig freie Tablet-Sätze als Prüfung. Ein Satz gilt nur, wenn der Speicher sich richtig geändert hat oder die Antwort die leere Liste zitiert.

Das ist keine Freigabe, beliebige Wünsche auszuführen. „Link zum neuesten Video von der Hansus“ bleibt ohne Kanal-Werkzeug eine Absage.

### Weitere offene Punkte

- Hausstand-Konflikte nach `stand_at`, keine kausalen Revisionen.
- Planungs-Fill ist ein einzelner JSON-Abschluss, keine Planer-Kette.
- `prompt` startet keinen Programmier-Agenten.
- OCG gegen TCG wird nicht unterschieden. Es bleibt das TCG-Subset. Xyz-Detach, Replay und historische Pendel-Ausnahmen sind draußen.
- Shop, Gems, Secret Packs, Crafting, Ranglisten, Solo-Story, Sleeves, Feld-Skins, Mates gehören nicht ins Duell.
- Keine Konami-Quellen und keine fremden Schach-SVG-Pfade übernehmen. Silhouetten selbst zeichnen.
- Geräte-Gates in `docs/101-next.md` bis `docs/103-next.md` sind nicht als Release freigegeben.
- `docs/02-architecture.md` und `docs/66-agents-ist.md` nennen noch 63 Agenten und alte Versionen. Der Katalog hat 70 Executor.

### Regeln für die nächste Änderung

- Neue Alltagswirkung als Parser plus Executor an einen bestehenden Agenten hängen, oder einen neuen Katalog-Eintrag mit demselben Muster. Kein zweites Agenten-Framework.
- Eine fehlgeschlagene Schreibaktion nicht an Gemini oder Groq durchreichen.
- Eine Chat-Antwort, die eine Tat behauptet, muss aus dem Executor kommen. Der Guard ist das Netz, nicht die Quelle.
- `APP_VERSION`, `package.json` und die Konstante in `YugiohDuel.tsx` gemeinsam ziehen. `ENGINE_STAMP` nur ziehen, wenn der Duell-Motor sich wirklich ändert.
- Tests aus `frontend/` mit den npm-Scripts. `test-cook.mjs` nicht als Gate benutzen.
- UI-Änderungen im Browser prüfen: den betroffenen Ablauf durchklicken, nicht nur einen Screenshot machen.
- Draft-PRs 212 und 213 nicht mergen, solange das nicht ausdrücklich gesagt ist.

### Prüfen

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npx tsc -b
npm run lint
npm run test:014
npm run test:home-plan
npm run test:watchlist
npm run test:app-ui
```

Fernseher, Steckdosen und Wake-Word laufen in der APK, nicht im Browser. PC-Steuerung braucht `desktop/JarvisPC.bat` im selben WLAN.

### Lesereihenfolge im Code, wenn diese Datei nicht reicht

1. `frontend/src/engine/chat.ts` ab `streamChat`
2. `frontend/src/engine/director.ts` ab `runDirectorTurn`
3. `frontend/src/engine/agents/parse-catalog.ts` und `execute-map.ts`
4. `frontend/src/engine/brain-tasks.ts` und `brain-orchestrator.ts`
5. `frontend/src/engine/store.ts` ab `APP_VERSION` und `openDb`
6. `frontend/src/engine/tool-contract.ts` und `tool-propose.ts`
7. `frontend/src/engine/guards.ts`
8. Das Modul der Domäne, die geändert werden soll

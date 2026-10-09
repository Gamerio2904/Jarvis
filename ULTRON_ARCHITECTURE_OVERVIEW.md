# Ultron — Architekturüberblick

Stand: App-Code **18.31.7**. Diese Datei beschreibt die bestehende Planungsarchitektur und den aktuellen Hausstand-/Tablet-Unterbau, nicht die noch geplanten Ausbaustufen. Der lokale Arbeitsbaum enthält zusätzliche, noch nicht als Release abgenommene Änderungen; maßgeblich für die Folgeschritte ist [`docs/102-next.md`](docs/102-next.md).

Ultron ist eine Android-App (Capacitor-WebView) plus dieselbe Oberfläche im Browser. Es gibt keinen separaten Anwendungs-Server. Hirn, Agenten, Planung und Speicher laufen in TypeScript im Client.

## 1. Technische Architektur und Tech Stack

### Frontend / UI

- **Framework:** React 19 (`react`, `react-dom`) als Single-Page-App. Kein Next.js, kein Router-Framework.
- **Build:** Vite 8, TypeScript 6, Plugin `@vitejs/plugin-react`. Einstieg `frontend/`.
- **Hülle:** Capacitor 8 (`@capacitor/android`, `@capacitor/core`, `@capacitor/filesystem`) packt das Web-Build in die Android-App.
- **UI-Library:** keine. Kein Tailwind, kein MUI, kein Chakra. Komponenten sind eigene `.tsx`-Dateien unter `frontend/src/ui/`.
- **CSS:** globales Stylesheet `frontend/src/index.css` (CSS-Variablen, dunkles Schema, Akzent `#ff2a36`) plus `frontend/src/ultron-shell.css`. Schrift: Manrope, Outfit, Cormorant Garamond.
- **Einzige UI-Abhängigkeit neben React:** `thinking-orbs` (Antwort-Orb). QR: `qrcode` und `jsqr`.
- **Planungsfläche:** `ScriptStage` (`frontend/src/ui/ScriptStage.tsx`), eingehängt über `HomeScreen`, sobald `plan_phase === 'live'`. Die Tischplatte selbst ist `tischplatte_on` in den Settings.
- **Tablet:** `TabletShell` und `tablet-runtime.ts` steuern Vollbild-Lage, Wake-Word und Tablet-Bedienung. Der Hausstand-Server ist ein separater, ausdrücklich startbarer nativer Dienst; der Tabletmodus allein startet ihn nicht.

### Backend und Agenten-Orchestration

- **Sprache:** TypeScript. Native Ergänzung: Java-Plugins unter `frontend/native/` (Fenster, Benachrichtigung, MainActivity). Kein Python, kein Go, kein Node-Server für das Hirn.
- **Kein** LangChain, CrewAI, AutoGen oder vergleichbares Agenten-Framework.
- **Custom-Orchestrator:** `frontend/src/engine/director.ts`. Ein Turn, eine Entscheidung.
- **Reihenfolge im Director, vor dem Katalog:**
  1. Offene Rückfrage (`pending`) und HUD.
  2. Fenster-Kopplung `handleFensterCommand` (`frontend/src/engine/fenster.ts`) — liegt **nicht** im Agenten-Katalog.
  3. Gewohnheit und Dokument (`work-flex.ts`).
  4. `decideTurn` → Parser-Katalog.
- **Routing:** `frontend/src/engine/route-pick.ts`. Jeder Agent in `frontend/src/engine/agents/parse-catalog.ts` hat eine `parse`-Funktion (Regex / Satzmuster) und liefert einen Score oder `null`. `propose` sammelt Treffer, `pickPolicy` wählt `run` oder `ask`.
- **Ausführung:** `frontend/src/engine/agents/runner.ts` → `agentDispatch` in `bus.ts`. Executoren stehen in `execute-map.ts`, Metadaten und Parser im Katalog. Kataloggröße: etwa 60 Routing-Agenten (`id` in `parse-catalog.ts`).
- **Nebenwirkungen** je Agent: `read` | `write` | `device`. Schreib- und Geräte-Fehler fallen nicht ins freie Modell zurück (`failureReply` in `director.ts`).
- **Kurator:** `frontend/src/engine/agents/curator.ts` prüft vor dem Lauf. Trace eines Turns: In-Memory in `trace-store.ts` (`beginAgentTurn`, `pushAgentTrace`).

### LLMs und Function Calling

- **Kein Claude, kein GPT-4o, kein Anthropic-SDK.**
- **Primär:** Groq, OpenAI-kompatibles Chat-Completions, Key `groq_api_key`. Client: `frontend/src/engine/groq.ts`. Modellreihe `GROQ_MODELS_BEST_FIRST` in `cloud-errors.ts`: `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `groq/compound-mini`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-120b`. Totes Modell wird über `groq_skip_until` übersprungen.
- **Spezialist:** Google Gemini Flash, REST `generativelanguage.googleapis.com/v1beta`. Client: `frontend/src/engine/gemini.ts`. Reihe `GEMINI_MODELS_BEST_FIRST`: `gemini-2.5-flash` zuerst, dann Flash-Lite und ältere Flash-IDs. Rollen: Vision und Grounding (`brain_gemini_roles_vision`, `brain_gemini_roles_grounding`). TTS separat (`gemini-2.5-flash-preview-tts` und Nachbarn in `tts.ts`).
- **Lokal:** `@wllama/wllama`, Gewicht `Qwen/Qwen2.5-0.5B-Instruct-GGUF` (`DEFAULT_MODEL` in `store.ts`). Client: `frontend/src/engine/llm.ts`. Springt ein, wenn das Cloud-Kontingent zu ist und das Modell geladen ist.
- **Wahl:** `frontend/src/engine/brain.ts`. Default `brain_primary: 'groq'`. `completeBrain` ruft Gemini, sonst Groq, sonst lokal. Planung ruft **nicht** `completeBrain`, sondern Groq direkt und danach Gemini (`fillPlanWithModel`).
- **Function Calling:** der Hauptweg ist **kein** Provider-Tool-Call. Der Satz trifft einen Parser, der Parser nennt die Aktion.
- **Ein erzwungenes JSON-Schema** gibt es nur für den Vorschlagsweg: `completeGroqJson` setzt `response_format: json_schema, strict`. Aufgerufen von `tool-propose.ts`, und nur wenn `tool_propose` an ist. Danach muss der bestehende Parser den Satz noch einmal bestätigen. Geräteaktionen brauchen zusätzlich ein Ja. Der Planungs-Fill nutzt dieses Schema **nicht**.

## 2. Aktueller Planungsmodus

### Zuständige Agenten und Module

Es gibt keinen eigenen Planungs-Agenten außerhalb des Katalogs. Planung hängt am Agenten `idea`.

| Stück | Datei | Rolle |
|---|---|---|
| Agent `idea` | `parse-catalog.ts`, Executor über `idea.ts` | Trifft `parseIdeaIntent`, `parseAblaufIntent`, `parsePortfolioIntent`, `parseBotAskIntent` |
| Ablauf-Parser | `frontend/src/engine/ablauf-parse.ts` | `screen`, `session`, `open`, `close`, `clear`, `accept`, `revise` |
| Ideen-Parser | `frontend/src/engine/idea-parse.ts` | Anlegen, Liste, Plan zeigen, Plan füllen, Zeile, Sprint streichen |
| Portfolio-Parser | `frontend/src/engine/portfolio-parse.ts` | `Go` speichert die Karte |
| Fill | `fillPlanWithModel` in `idea.ts` | Ein Modellaufruf, JSON zurück |
| Schema | `frontend/src/engine/idea-plan.ts` | Typen, Parse, Prompt-Grenze 480 Zeichen |
| Tafel-Text | `frontend/src/engine/plan-desk.ts` | Zeilen für `ScriptStage` |
| UI | `frontend/src/ui/ScriptStage.tsx` | Karte, Sichten Sprints / PSP / Quellen, Prompt kopieren, Export |
| Brett | Agent `board` (`board.ts`, `board-parse.ts`) | Tischplatte schieben, Jobs, und darüber der Entwurf |
| Entwurf | `entwurf.ts`, `entwurf-parse.ts` | `Entwirf eine App`: stumme Rahmen, keine laufende Funktion. Hängt am Board und zusätzlich direkt in `chat.ts` |
| Schreibtisch | Agent `desk` | Lesender Satz auf die Fläche, kein Plan-Fill |
| Vorlage (Protokoll) | `docs/plan-vorlage.md` | Dieselbe Hülle, die `PLAN_BEDINGUNG` / `PLAN_RAHMEN` in `idea-plan.ts` spiegeln |
| Fenster | `fenster.ts` | Kopplung und zweite Fläche. Läuft **vor** dem Katalog, nicht als Planungs-Agent |

### Ablauf

1. Ein Satz trifft `idea` (zum Beispiel `Plane das Projekt`, `Plane eine App …`, `öffne den Planungsbildschirm`, `Lass uns eine App entwickeln`).
2. `plan_phase` wird `live`, `tischplatte_on` an, `plan_idea_id` zeigt auf die Idee. `HomeScreen` zeigt `ScriptStage`.
3. `fillPlanWithModel` schickt `FILL_SYSTEM` plus die wörtliche Bedingung. Erst Groq (`completeGroq`, 1600 Tokens), bei Fehlschlag Gemini (`maxOutputTokens` 2000, 25 s, ohne Thinking).
4. Die Antwort muss ein JSON-Objekt sein. `parsePlan` baut daraus ein `IdeaPlan`. `gateway: go` nur mit Anforderung, `go_wenn` und `abbruch`. Sonst `offen`.
5. Liefert kein Modell einen Plan mit Körper, zerlegt `fillFromClauses` den Satz an Komma und Semikolon in **einen** Sprint (`S1-1` …), höchstens sechs Teile.
6. `ScriptStage` zeigt Anforderungen, Entscheidungen und Sprint-Ziele als Zeilen (`planDeskLines`). Die Seite zeigt Sprint-Titel, Ziel und den kopierbaren `prompt`.
7. `Go` setzt `plan_phase` auf `go` und legt die Portfolio-Karte. Export der JSON-Dateien ist erst dann an.
8. `Fertig` schließt den Live-Bildschirm. Der Plan bleibt gespeichert.

### Schema, das der Fill erzeugen muss

Systemprompt `FILL_SYSTEM` in `idea.ts`. Antwort **nur** dieses JSON:

- `bedingung` — Satz des Menschen, wörtlich.
- `anforderungen[]` — `{id, satz, abnahme, gateway}`.
- `entscheidungen[]` — `{id, schnitt, grund, gateway}`.
- `sprints[]` — `{n, title, ziel, anforderungen, lieferumfang:[{id, task, anleitung}], prompt, gateway, go_wenn, nogo_wenn, abbruch, haengt_an}`.
- `luecken[]` — `{id, name, satz}`.
- `gateway`, `go_wenn`, `nogo_wenn`.

Regeln, die der Prompt dem Modell gibt:

- `n` ist `1`, `2`, `3`, … ohne Lücke.
- `prompt` höchstens 480 Zeichen, eine Anleitung für einen Programmier-Agenten, kein Quelltext, keine Version. Ohne Arbeit leer.
- Keine Titel „Kern“, „Härten“, „Probe“. Keine erfundenen Quellen. Kein RICE.

Gespeichert wird das als `Idea.plan` (`IdeaPlan` in `idea-plan.ts`) in der IndexedDB-Store `ideas`. Die Datei-Exporte sind eine flachere Sicht davon (`project-docs.ts`): `projekt`, `wege`, `sprints`, `psp`, `luecken`.

`ScriptStage`-Sichten `sprints` und `psp` rendern dieselbe Sprintliste. Der PSP-Knopf ist heute keine zweite Struktur.

## 3. Context, Memory und Dateien

### Memory und State

- **Kein Redis, kein Vektorindex, kein SQLite, kein gemeinsamer Server-State.**
- **Einstellungen:** `localStorage`, Schlüssel `jarvis_settings_v13` (`store.ts`). Darin auch Planungszustand: `plan_phase` (`''` | `live` | `go`), `plan_idea_id`, `plan_script_at`, `tischplatte_on`, `tischplatte_view`, `tischplatte_focus`, `fenster_pair_json`, `working_memory_json`, API-Keys.
- **Dauerhafte Daten:** IndexedDB `jarvis-ondevice`, Version 15. Object Stores: `conversations`, `messages`, `memory`, `notes`, `todos`, `ideas`, `watch_movies`, `watched_movies`, `pending`, `research_audits`, `reminders`, `events`, `shopping`, `price_watches`, `docs`, `xfer`, `plans`, `portfolio`, `drafts`, `knowledge_packs`, `rm_scene_skills`, `memory_proposals`. Schlüssel `id`, außer `pending` (`conversation_id`).
- **Zwischen Hirn und Sub-Agent:** kein gemeinsames Agenten-Gedächtnis. Der Director baut pro Turn ein `RouteCtx` (`conversationId`, `text`, `lastTool`, `lastMedium`, Wetter, Stecker, Ort, letzter Fehlschlag). Der Executor liest und schreibt dieselben Stores.
- **Arbeitsgedächtnis:** `working-memory.ts`, höchstens 8 Zeilen, JSON in den Settings. Kein Verlauf für den Planungs-Fill. `fillPlanWithModel` sieht nur Bedingung, Rahmen und eine leere Sprint-Hülle.
- **Recall:** `retrieve.ts` durchsucht die Stores per Token-Überlappung (`scoreBlob`, `tokenCosine`). Keine Embeddings. Chat hängt Treffer an den Prompt (`chat.ts` importiert `retrieve`). Der Planungs-Fill tut das nicht.
- **Trace:** nur der laufende Turn, im Speicher, nicht in IndexedDB.
- **Hausstand:** `backup.ts` serialisiert Settings (ohne flüchtige Felder) plus die Stores zu einem `HausBackup` (`backup_version`, `exported_at`, `settings`, `memory`, `reminders`, `events`, `ideas`, `plans`, `portfolio`, `drafts`, …). Keys liegen in `settings`. Import ersetzt die Stores (`applyBackup`). Ein Tablet-Server und automatischer WLAN-Abgleich nach `stand_at` sind vorhanden. Der native Hausstand-Kanal nutzt im aktuellen Arbeitsbaum HTTPS mit gepinntem Zertifikat, Bearer-Header sowie App-/Protokollprüfung. Kausale Revisionen und sicherer Konflikterhalt sind noch nicht in den Sync-Pfad eingebunden.

### Dateien und Export

- **Plan-JSON:** `saveProjectJson` in `project-docs.ts`. Zuerst nativ `saveToDownloads` (`frontend/src/native/device.ts` → Java `saveDownload`). Ohne Native: Blob-Download im Browser (`<a download>`).
- **Dateinamen:** `{slug}-psp.json`, `{slug}-sprints.json`, `{slug}-projekt.json`. Slug aus dem Titel, max. 40 Zeichen.
- **Wann:** Knöpfe in `ScriptStage` sind nur bei `plan_phase === 'go'` aktiv.
- **Portfolio:** `frontend/src/engine/portfolio.ts` schreibt zusätzlich `projekt.json`, `wege.json`, `sprints.json`, `psp.json`, `luecken.json` in die Portfolio-Struktur und spiegelt sie in den Hausstand.
- **Hausstand-Datei:** `jarvis-haus-YYYYMMDD.json` über `backup.ts`. Der native QR-Weg liefert eine HTTPS-Adresse, ein Kopplungstoken und den Zertifikat-Fingerprint; Nutzdatenzugriff nutzt authentifizierte Header statt eines Tokens in der URL.
- **Andere Dokumente:** Store `docs` (`DocRecord`: Name, MIME, Text). Kein Projektordner im Sinne eines Workspace-Dateisystems auf dem Gerät, außer dem nativen Download und `saveTreeFile` für einen relativen Pfad unter Downloads.

## Grenzen für eine Erweiterung des Planungsmodus

- Neue Planungslogik gehört in `idea.ts` / `idea-plan.ts` / `ablauf-parse.ts` / `ScriptStage.tsx`, nicht in ein zweites Agenten-Framework.
- Der Fill ist ein einzelner JSON-Abschluss. Es gibt keine Kette aus vier Planern und kein Tool-Schema für den Plan.
- Zustand zwischen den Planungsschritten liegt in `ideas.plan` und `jarvis_settings_v13`. Der Hausstand-Sync kann diese Daten übertragen, entscheidet aber noch nach `stand_at`; Projekt-/Sprintansichten werden nicht gezielt auf einem zweiten Gerät geöffnet. Die Fenster-Kopplung bleibt ein separater Kanal.
- `prompt` ist Text zum Kopieren, kein Start eines Programmier-Agenten in der App.

## 4. Yu-Gi-Oh!-Duell (`18.31.6`–`18.31.7`)

Das Duell ist ein lokales React-Overlay (`frontend/src/ui/YugiohDuel.tsx`) mit
separater Regellogik (`frontend/src/engine/yugioh-duel.ts`). Der festgelegte
Sprachsatz wird vor dem LLM-Routing erkannt. Kartensuche und Bilder kommen auf
Anfrage direkt von YGOPRODeck; Main- und Extra-Deck liegen im lokalen
`localStorage`. Die drei statischen Strategie-Vektoren (Aggro, Control, Combo)
werden beim Laden uniform gemittelt und für eine einfache deterministische
Monsterwahl verwendet. Das ist **kein trainiertes neuronales Modell** und kein
abgeschlossenes Reinforcement-Learning-/Winrate-Projekt.

Die Umsetzung bildet Eröffnungs-Hand, Züge, Phasen, LP, Normal-/Tribut-
Beschwörung, Monster-Kampf, Friedhof und Deck-out ab. Seit `18.31.7` führt ein
begrenzter textbasierter Effect-Adapter Ziehen, Schaden, LP-Gewinn, Zerstörung
und Negation über priorisierte Chain-Links aus. Fusion/Synchro/Xyz/Link
verbrauchen vereinfachte Materialien. Das Trainingslabor optimiert dieselbe
lineare Policy mit episodischem Softmax-Policy-Gradient auf synthetischen
Duellen, persistiert die resultierenden Gewichte und misst eine getrennte
Holdout-Winrate gegen die eingebaute Baseline. Animationen respektieren
`prefers-reduced-motion`. Das sind keine vollständigen offiziellen Regeln,
keine realen Karten-Trainingsdaten und keine Turnier-Winrate. Die komplette
Funktionsabgrenzung und Tests stehen in
[`docs/yugioh-duel.md`](docs/yugioh-duel.md).

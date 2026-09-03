# 51 — Phase-0-Audit, Screenshot-Review, Industry-Track

> **Jetzt:** Code **`9.9.2`** (V1–V3 `6.91`–`6.99`, V4 Dateien `9.0`, V5 Memory `7.0`, V6 TV `9.1`, V7 PC `9.2`, V8 Live `9.3`, V9 Hardening `9.9`, Screenshot-Fixes `9.9.2`). Sideload **`9.9.2`**. Dieses Dokument ist das vollständige Audit vor dem Industry-Track. Alltag `8.0` bleibt geplant, **läuft nicht vor Stabilität**.

PO-Auftrag: vollständiges Audit, Root Causes statt Symptom-Patches, dann Versionen/Sprints. Screenshots sind reale Fehlerfälle, nicht Mockups.

PO-Auftrag: vollständiges Audit, Root Causes statt Symptom-Patches, dann Versionen/Sprints. Screenshots sind reale Fehlerfälle, nicht Mockups.

---

## 1. Architektur-Ist (`6.90` → `6.91`)

Jarvis ist **eine Capacitor-APK**. Das Hirn läuft auf dem Handy (TypeScript in der WebView). Es gibt **keinen Server**. Der PC ist LAN-Werkzeug (`desktop/JarvisPC.bat`), kein zweites Hirn.

```text
Du (Handy)
    → Chat-UI (App.tsx)
        → streamChat (engine/chat.ts)
            → Parser / Register (registry.ts + route-pick.ts + policy.ts)
            → Tool-Handler (weather, drive, poi, tv, pc, …)
            → sonst Hirn: Gemini → Groq → 0,5B
        → IndexedDB + localStorage
    → Native Plugins (Stimme, TV, Geo, Notify, Home, Device)
```

**Leitentscheidung bleibt:** Parser wählen Geräte. Das Modell formuliert. Erfolg darf nur behauptet werden, wenn das Tool ein prüfbares Ergebnis geliefert hat. Das war in `6.90` **nicht durchgängig** so — das ist die zentrale Architektur-Lücke.

### Bausteine

| Schicht | Ort | Rolle |
|---------|-----|--------|
| UI-Shell | `frontend/src/App.tsx` (~1750 Zeilen) | Chat, Overlays, Busy, Debug-Anbindung |
| API-Fassade | `frontend/src/api.ts` | UI → Engine |
| Orchestrator | `engine/chat.ts` | Routing, Hirn, Persistenz |
| Register | `engine/registry.ts` + `route-pick.ts` | ~50 Capabilities, **doppelter Parser-Katalog** |
| Policy | `engine/policy.ts` | Score ≥ 0.45, Margin 0.12 |
| Store | `engine/store.ts` | Settings-Gott-Objekt + IndexedDB |
| Native | `frontend/native/*` | Voice, TV, Geo, Notify, Home, Device |
| PC-Agent | `desktop/` | HTTP :18790 Screenshot/Input/Launch/Files |
| Debug | `DebugPanel.tsx` + `debug-session.ts` (`6.91`) | Testlauf, Export |

### Pipeline (Ist)

```text
User-Input
  → App.sendMessage / sendVoiceTurn
  → streamChat
  → addMessage(user)          ← sofort, vor Erfolg
  → splitIntents / routeDeterministic / routeRegistry
  → Handler ODER completeBrain
  → addMessage(assistant)
  → onDone → UI (Drive-Overlay, Chips, Busy)
```

Es gab **keine Request-IDs**, **keine Idempotenz**, **kein globales Turn-Gate**, **keine Action-Verification**. `6.91` führt Turn-Gate + Debug-Session ein; das generische Action-System ist **VERSION 3**.

---

## 2. Technische Schulden (Root, nicht Symptom)

1. **Erfolg ohne Observation.** Handler setzen `tool_status: 'executed'`, sobald der native Call oder die URL gebaut ist — nicht sobald Volume, Route oder App wirklich stehen.
2. **Parser-First ohne Conversational Gate.** Ein Dash in einer Vereinsliste ist ein Ort. „heute Abend“ nach altem Wetter ist Wetter. Das Modell kommt nie zum Zug.
3. **Zwei Parser-Kataloge** (`registry.ts` / `route-pick.ts`) — Drift-Risiko.
4. **Settings als God-Object** (`last_*_json`, `drive_mode`, `working_memory_json`). Session-State und Prefs in einem Blob.
5. **Ein `busy`-React-State** statt Mutex. Voice/Drive umgingen ihn.
6. **Debug im Panel-Lifecycle.** Unmount = UI tot, Loop kopflos, Turns landen im falschen Chat.
7. **Weltlage-Watch und Wecker teilen Notify-Infrastruktur.** Watch darf nie Alarm-GUI sein.
8. **Memory:** Schichten Sensory/Working/Episodic/Semantic. Quelle, Confidence, Contradiction, Prune. **CODE in `7.0.0`**. Kein Lance, kein Embedding-Router.
9. **Dateien:** PDF/Text lokal, Foto/OCR mit Gemini, Verify Upload Domain `doc`. Word/Excel/HEIC ehrlich aus. **CODE in `9.0.0`**.
10. **TV:** Device-Registry + Verify Launch (Native-OK, App-ID, Fähigkeit). Schirm weiter unsichtbar. SmartThings Won’t. **CODE in `9.1.0`**.
11. **PC:** Capability-Levels + Confirm + Verify. JPEG-Screenshot. Live: LAN-JPEG, WebRTC nur mit Peer. Klick heißt gesendet, nicht ausgeführt. **CODE in `9.2.0`/`9.3.0`**.
12. **App.tsx monolithisch.** Overlay-Stack, Busy, Voice, Drive, Debug in einer Komponente.

---

## 3. Race Conditions & konkurrierende Prozesse

| Race | Wirkung | Fix-Schiene |
|------|---------|-------------|
| Enter + Send / Doppel-Tap | zwei `streamChat`, zwei User-Zeilen | Turn-Gate `6.91` |
| Voice während Text | parallele Loops | UI-Lock + Conversation-Lock |
| Debug-Unmount | Lauf kopflos / leere Turns | Debug-Session Singleton |
| Debug + User dieselbe `activeId` | Prompts im Alltagschat | Debug hält `conversationId` |
| Stale `onDone` nach Drive-Fertig | Overlay öffnet sich wieder | `driveCloseGenRef` |
| Wake partial + final | doppeltes Voice-Open | V2 `6.96` — Wake nur auf Final + Debounce |
| Settings z-index 30 über Drive 14 | Fertig unerreichbar, Drive fängt Taps | Overlay-FSM `6.92` (`exclusive` + `pointer-events`) |
| `busy` TOCTOU | Guard liest alten Render | `beginTurn` synchron |

---

## 4. Screenshot-Review (Phase 2) — reale Fälle

Jeder Fall: PROBLEM → ROOT CAUSE → KOMPONENTEN → LÖSUNG → TESTS.

### S1 — Vereinsliste wird als Ort gespeichert

**PROBLEM.** User: `Bayern - Dortmund VfB Freiburg Werder Bremen` (Gedächtnisübung). Jarvis: `Bayern: Dortmund VfB Freiburg Werder Bremen — liegt.` Chip **Ort liegt**. Zählt nicht mit.

**Schweregrad.** Hoch (falsches Tool + Kontextverlust).

**ROOT CAUSE.** `WRITE_DASH` in `places-parse.ts` matched `Name — Rest` und speichert Memory `place`. Kein Check, ob die rechte Seite eine Adresse ist.

**KOMPONENTEN.** `places-parse.ts`, `places.ts` `handlePlaces`, Register `maps`.

**LÖSUNG.** `looksLikeSavedPlace`: Adresse oder ≤3 Tokens, keine Vereinslisten. Dann fällt der Turn ans Hirn (Smalltalk/Zählen).

**TESTS.** `parsePlaceWrite('Bayern - Dortmund …') === null`. Regression: `Jane — Praxis Bahnhofstraße` bleibt Save.

**Status `6.91`.** CODE.

### S2 — Chat-Titel = letzte User-Zeile, abgeschnitten

**PROBLEM.** Header zeigt die Nachricht in Serif-Italic, mehrzeilig, `Brem` abgeschnitten.

**Schweregrad.** Mittel (UX).

**ROOT CAUSE.** `addMessage` ruft `titleFromUser` (Slice 42, keine Wortgrenze). `.topbar h2` ohne Ellipsis, Display-Font.

**KOMPONENTEN.** `chat-title.ts`, `store.ts`, `index.css`.

**LÖSUNG.** Slice 32 + Wortgrenze; `text-overflow: ellipsis; white-space: nowrap`.

**Status `6.91`.** CODE.

### S3 — Smalltalk löst Wetter aus

**PROBLEM.** `ach wie geht's dir heute Abend` → Wetterbericht Kehrsbachstraße + Chip Wetter + `1 · Wetter`.

**Schweregrad.** Hoch.

**ROOT CAUSE.** `parseWeatherFollowup` wertet jedes `heute` als Wetter-Follow-up, sobald `last_weather_*` in **Settings (global, chatübergreifend)** steht. Greeting wird nicht ausgeschlossen.

**KOMPONENTEN.** `weather-parse.ts`, `store.ts` last_weather, Register.

**LÖSUNG.** SOCIAL-Gate; `heute` allein reicht nicht, außer kurzes `und heute?`.

**TESTS.** Greeting → null; `und heute?` bleibt Follow-up.

**Status `6.91`.** CODE.

### S4 — Guten Tag um 00:44 / Abend ignoriert

**PROBLEM.** User sagt Abend, Uhr 00:44, Jarvis `Guten Tag, Sir.`

**Schweregrad.** Niedrig (Persona).

**ROOT CAUSE.** Canned Greeting in Guards/Persona ohne Gerätezeit.

**LÖSUNG.** Greeting aus Geräteuhr (`greeting.ts`). User sagt Abend nach 22 Uhr / nach Mitternacht: Abend behalten, Mitternacht erwähnen. `Guten Morgen` bleibt Tageslage (`isBriefAsk`), kein Greeting.

**Status `6.93`.** CODE.

### S5 — Suche verweigert, Antwort abbricht bei „Unverifizierte“

**PROBLEM.** User will suchen „egal ob es stimmt“. Jarvis lehnt ab, zweite Antwort endet mit `Unverifizierte`. Mix Timon/Ihnen.

**Schweregrad.** Hoch (Abbruch + Guardrails zu starr).

**ROOT CAUSE.**
1. Persona/Guards: keine erfundenen Live-Fakten; Modell weicht in Verweigerung aus.
2. `completeGemini`: MAX_TOKENS-Retry nur beim ersten Versuch und nur wenn sehr kurz/unvollständig. Lange Verweigerung wird nicht nachgezogen.
3. Name aus Memory + Siezen-Scrub → Timon + Ihnen.

**LÖSUNG.** Unvollständige Sätze: Gemini-Retry (MAX_TOKENS / kein Satzende) oder `REPLY_TRUNCATED` vor `scrubReply` (sonst fälscht `finishReply` den Punkt). `ja bitte` bindet `research_offer`. Anrede: Siezen, Vorname nicht vokativ (`stripVocativeNames`).

**Status `6.93`.** CODE. Volles Research-Pending-System ist V3 `6.99`.

### S6 — Elon-Tweet: kein Treffer, Satz abgeschnitten

**PROBLEM.** `was hat Elon Musk als letztes getweetet` → keine Daten; `ja bitte` → „kein stabiler Treffer“, Satz bricht ab.

**Schweregrad.** Hoch.

**ROOT CAUSE.** `isLiveLookup` / `isAutoResearchAsk` treffen Tweets nicht. `ja bitte` ist kein Research-Intent und bindet nicht an pending search. LLM halluziniert „Abfragen“.

**LÖSUNG.** Live-Lookup für Tweet/News-Personen; Confirm `ja bitte` führt pending search aus (`last_step_utterance`). Unvollständiger Satz → Retry oder Abbruch-Satz, nie Stumpf mit erfundenem Punkt.

**Status `6.93`.** CODE. Verification „Sources oder ehrlich kein Treffer“ ist V3-hart `6.99`.

### S7 — Nächster Aldi → Hofläden, Produktliste als Name

**PROBLEM.** `dann fahre ich zur nächsten Aldi` → Willmanns Hofladen, `Nächste offene: Eier, Äpfel, …`. Grammatik `Nächste Supermarkt`.

**Schweregrad.** Hoch (falsches Ziel + Halluzination der Bezeichnung).

**ROOT CAUSE.** Overpass `shop=supermarket` ohne Brand-Filter. OSM-`name` kann eine Warenliste sein. Reply-Template `Nächste ${poiLabel}` (feminin) + Label Supermarkt statt Aldi.

**LÖSUNG.** Brand-Filter (aldi/lidl/rewe/edeka). Grocery-List-Namen verwerfen. `Nächster Aldi`. Kein Erfolg, wenn kein Brand-Hit.

**Status `6.91`.** CODE (Parser + Filter + Label). Live-Overpass bleibt Integrationsrisiko.

### S8 — Gemini-Banner immer sichtbar

**PROBLEM.** `Gemini (Google) — Nachrichten gehen ins Netz.` in jedem Chat.

**Schweregrad.** Niedrig. Bewusst (Datenschutz-Hinweis).

**LÖSUNG.** Einmalig, wegklappbar (`gemini_banner_dismissed`). Cloud-Thema in Settings bleibt die dauerhafte Erklärung.

**Status `6.96`.** CODE.

### S9 — Tool-Chip + `1 · Wetter` sieht nach Debug aus

**PROBLEM.** Grüner Chip und Zähler unter der Antwort.

**Schweregrad.** Mittel (UX).

**ROOT CAUSE.** `researchStatusLabel` schrieb `1 Quellen`, die Summary hängte ` · Wetter Kehrsbach…` an. Das sah aus wie Debug-Schritt `1 · Wetter`. Der grüne Chip ist das Tool-Label.

**KOMPONENTEN.** `research-parse.ts`, `App.tsx` SourcesBlock, `weather.ts` status_label.

**LÖSUNG.** Badge „Quelle“/„Quellen“ ohne Ziffer. Query nicht in der Summary. Chip bleibt „Wetter“.

**Status `6.96`.** CODE.

### S10 — Route „sofort neu“, Karte bleibt

**PROBLEM.** Heilbronn/Sontheim aktiv. `Das habe ich doch lieber nach Freiberg am Neckar` → „Die Route berechne ich sofort neu“ — Route ändert sich nicht.

**Schweregrad.** Kritisch (Erfolg ohne Verification).

**ROOT CAUSE.**
1. `parseDriveIntent` kannte kein Replace-Pattern; Satz beginnt nicht mit `nach`/`fahr mich`.
2. Turn fällt ins LLM. LLM behauptet Ausführung.
3. `scrubReply` fängt keine Navi-Lügen.
4. Selbst bei Tool: `tool_status executed` ohne `rideOk`.

**LÖSUNG.** Replace-Intent im Fahrmodus → `startRoute`. Reply nur nach `rideOk`. Sonst ehrlich: Ziel liegt, Strecke fehlt. Generisches Action-Verify = VERSION 3.

**Status `6.99`.** Parser + ehrliche `startRoute`-Replies CODE in `6.91`. Action-Verify + Navi-FSM CODE.

### S11 — Debug bricht ab / Overlay hängt

**PROBLEM.** Debug-Lauf stirbt still. Overlay/Settings nicht zu. User will chatten und später Download.

**Schweregrad.** Kritisch.

**ROOT CAUSE.** Runner lebte in `DebugPanel`. Topic-Wechsel / Fertig / Escape unmountet. `sendMessage` nutzte `activeId`. Stop ohne Timeout. `busy` → leere Reply ohne error.

**LÖSUNG.** `debug-session.ts` Singleton, FSM, Timeout 90 s/Turn, Persist `last_debug_json`, eigene `conversationId`, Android-Back schließt Overlay nicht den Lauf.

**Status `6.91`.** CODE.

### S12 — Doppelte Prompts

**PROBLEM.** Dieselbe Nachricht zweimal verarbeitet.

**ROOT CAUSE.** React-`busy` TOCTOU; `sendVoiceTurn` ohne Guard; `addMessage` vor Dedup.

**LÖSUNG.** `turn-gate.ts`: Request-ID, Dedup 1,4 s, UI-Lock, Conversation-Lock (Debug parallel auf anderem Chat).

**Status `6.91`.** CODE.

---

### S13 — Street View London: ehrliches Won’t, Kugel fliegt nicht, Chip auf Englisch

**PROBLEM.** `Zeig Street View von London` → „Street View habe ich nicht. Nur die Kugel mit Lexikon-Orten, kein Straßenblick.“ Chip **Won’t**. Die Kugel dreht nicht nach London. User wollte beides: Ort zeigen *und* Straßenblick ablehnen.

**Schweregrad.** Mittel (fähige Teillösung fehlt + UI-Sprache).

**ROOT CAUSE.**
1. `parseWontIntent` matcht `\bstreet\s*view\b` und `handleWont` antwortet nur mit der Canned-Zeile. Kein Gazetteer, kein `hud_view`.
2. `gazetteerHit('Zeig Street View von London')` ist **absichtlich** null: Leftover `Zeig Street View von` sind keine Füllwörter (`6.51`). HUD-Pin greift deshalb nicht.
3. Chip-Label in `registry.ts` / `handleWont` hardcodiert `'Won’t'`.

**KOMPONENTEN.** `wont-parse.ts`, `globe-geo.ts` `gazetteerHit`, `registry.ts` wont, `store.ts` `hud_view` / `last_globe_focus`.

**LÖSUNG.** `streetViewPlace`: Street-View-Wörter strippen, dann Gazetteer. Treffer → Kugel fliegen (`hud_view: globe` + focus), Reply: „London steht auf der Kugel. Street View habe ich nicht …“. Chip **Geht nicht**. Ohne Orts-Treffer bleibt die Canned-Zeile.

**TESTS.** `parseWontIntent` reason `street`; `streetViewPlace` → London; `gazetteerHit` voller Satz bleibt null; `pickRoute` → `wont`; Label `Geht nicht`.

**Status `6.91`.** CODE.

### S14 — „Wo ist London“ bricht nach Tagesschau-Leerformel ab

**PROBLEM.** `Wo ist London` → „London ist die Hauptstadt … Die Tagesschau erwähnt die Stadt derzeit nicht, und Lokalnachrichten sollten nicht“. Satzstumpf. User hat nach dem Ort gefragt, nicht nach einem News-Briefing.

**Schweregrad.** Hoch (abgeschnittene Antwort).

**ROOT CAUSE.**
1. HUD-Pin (`parseHudIntent` `wo ist|liegt`) ruft `briefPlace` auf.
2. `briefPlace` hängte **immer** eine Tagesschau-Leerformel an, wenn `newsLine` null ist.
3. `polishToolLine` `maxOutputTokens: 120` schneidet die umformulierte Zeile mitten im Satz. `guardPolish` prüft Zahlen/Orte, nicht Satzende.

**KOMPONENTEN.** `globe-brief.ts`, `polish.ts`, `hud.ts` pin.

**LÖSUNG.** Fehlende News weglassen (Kommentar im File: Fehlendes weglassen). `composePlaceBrief` nur echte Extras. Polish 300 Tokens; `looksTruncated` → Canned zurück.

**TESTS.** `composePlaceBrief(London, [])` enthält kein Tagesschau; `looksTruncated` auf dem Screenshot-Stumpf true.

**Status `6.91`.** CODE.

### S15 — „Wo bin ich gerade?“ (Kontrolle, kein Bug)

**PROBLEM.** Keins. Screenshot zeigt korrekte Adresse Kehrsbachstraße 19, Chip **Standort**.

**ROOT CAUSE.** `here` / Geo-Plugin. Nicht Teil der Dump-/Street-View-Kette.

**LÖSUNG.** Keine. Regression: Standort-Chip und Adresse bleiben.

**Status `6.91`.** IST korrekt.

### S16 — „Was weißt du über den Zahnarzt“ dumppt Chat-Titel

**PROBLEM.** Antwort ist Wortsalat: `Zeig mir London: Termine … Fahr mich zu einer Tanke: … Zahnarzt … Sonne auf/unter`. Chip **Gedächtnis**.

**Schweregrad.** Kritisch (Retrieval dump, kein Satz).

**ROOT CAUSE.**
1. `parseRecallIntent` liefert korrekt `Zahnarzt`. `handleRecall` macht `hits.map(h => title + ': ' + body)`.
2. Message-Hits nehmen **`conversation.title`** als title. Titel *sind* die letzte User-Zeile (`titleFromUser`) — „Zeig mir London“, „Fahr mich zu einer Tanke“.
3. Assistant-Dumps werden wieder indexiert → nächste Frage erbt den Salat.
4. `subQueries` / `scoreBlob` ist Token-Overlap; schwache Tokens treffen fast alles, sobald der Dump London+Tanke+Zahnarzt in einer Zeile hat.

**KOMPONENTEN.** `recall.ts`, `retrieve.ts`, `chat-title.ts`, `memory.ts` (gleicher Dump-Pfad).

**LÖSUNG.** `formatRecallReply`: deutsche Sätze nach Store, nie `ChatTitel: body`. Events vor Messages. Message-Titel = Content-Snippet. Dump-Zeilen und Debug-Chats skippen. Events/Memory gewinnen, Chat nur wenn sonst nichts.

**TESTS.** `formatRecallReply` mit Event+Message enthält Zahnarzt, nicht `Zeig mir London:`.

**Status `6.91`.** CODE.

### S17 — „Wo stand das mit der Steuer“ Feedback-Loop

**PROBLEM.** Dieselbe Dump-Form plus `Gefunden:` und Bullet `•`, Wiederholung der eigenen Frage. Chip **Gedächtnis**.

**Schweregrad.** Kritisch.

**ROOT CAUSE.** Wie S16, plus: frühere Search/Recall-Replies (`Gefunden:`, `• Titel: body`) liegen als Assistant-Messages in IndexedDB. `retrieve` findet sie wieder. `parseRecallIntent` → `Steuer` ist richtig; die Formatierung und der Re-Index sind falsch.

**KOMPONENTEN.** `retrieve.ts` `isDumpLine`, `recall.ts`, `search-chat.ts` (gleicher `title: body`-Join).

**LÖSUNG.** `isDumpLine` filtert `Gefunden:` und Mehrfach-`Titel:`. `search-chat` nutzt `formatRecallReply`. Assistant-Dumps werden nicht mehr getroffen.

**TESTS.** `isDumpLine('Gefunden: • …')`; `parseRecallIntent('Wo stand das mit der Steuer') === 'Steuer'`.

**Status `6.91`.** CODE.

### S18 — „Was weißt du über mich“ dumppt alte Prompts; Titel hängt

**PROBLEM.** `Was weißt du über mich` → `Was weißt du über mich: … Zahnarzt … Fahr mich zu einer Tanke … Vorwerk …`. Header bleibt „Wie wird das Wetter?“ oder wickelt später `gibt's auch in den Laden…` ohne Ellipsis (Sideload `6.90`).

**Schweregrad.** Kritisch (Memory) + Mittel (Titel).

**ROOT CAUSE.**
1. `parseRecallIntent('Was weißt du über mich')` ist **null** (bewusst). `RECALL_ALL` in `memory-parse.ts` → `handleMemory` läuft `retrieve(text)` und dumpt Hits.
2. `subQueries('Was weißt du über mich')`: `mich` ist STOP, übrig `über` / `weißt` → trifft fast jede Message.
3. Header: `addMessage` schreibt den Titel in IndexedDB, `onMeta` gab die Conversation nicht an die UI. Titel erst in `onDone` — bei Globe/News-Latenz bleibt der alte Titel stehen. Ellipsis war `6.90` CSS fehlend (S2, CODE in `6.91`).

**KOMPONENTEN.** `memory.ts`, `memory-parse.ts` `RECALL_ALL`, `retrieve.ts` STOP, `chat.ts` `onMeta`, `App.tsx`.

**LÖSUNG.** `RECALL_ALL` listet nur gepinnte Fakten (`formatPinnedMemory`: Name, Zuhause, Prefs), **kein** retrieve-Dump. STOP um `über`/`weißt`/`stand`. `onMeta.conversation` aktualisiert den Header sofort.

**TESTS.** `subQueries('Was weißt du über mich') === []`; `isMemoryRecall` true; `parseRecallIntent` null; `formatPinnedMemory` ohne Chat-Titel.

**Status `6.91`.** CODE.

Aldi-Screenshot (Hofladen statt Aldi, Header-Wrap) ist **S7 + S2** auf Sideload `6.90`. Brand-Filter und Ellipsis sind in diesem PR.

---

## 5. Mapping PO-Versionen → Code

Bestehende Pläne `7.0` Recall und `8.0` Alltag **nicht löschen**. Industry-Track **davor und dazwischen** als `6.91+`, dann Verifikation, dann die großen Majors.

| PO-Version | Code | Sprint | Inhalt | Abhängigkeit |
|------------|------|--------|--------|----------------|
| **V1 Stabilität** | `6.91`–`6.93` | 142–144 | Debug, Overlay, Dedup, Parser-Falschalarme, Weltlage nicht als Wecker | keine |
| **V2 Voice & App** | `6.94`–`6.96` | 145–147 | TTS-Kaskade, App-Action-Registry | V1 |
| **V3 Verified Actions** | `6.97`–`6.99` | 148–150 | Action-FSM, Navi-Replace verifiziert, Research-Pending | V1 |
| **V4 Dokumente** | **`9.0`** | 151–153 | Attachments, Parser, OCR, Verify Upload | V3 (Verify Upload) |
| **V5 Memory** | **`7.0`** | 137–140 | Hierarchical Memory: Quelle, Confidence, Bereinigung | V3 Context |
| **V6 TV** | **`9.1`** | 154–156 | Device-Registry, Verify Launch | V3 |
| **V7 PC Beta** | **`9.2`** | 157–159 | Capability-Levels, Confirm, Verify | V3 |
| **V8 Live-Stream** | **`9.3`** | 160–162 | WebRTC-Signaling, LAN-JPEG, Verify Peer | V7 Pairing |
| **V9 Hardening** | **`9.9`** | 163–165 | Regression, Security, UX | alle |

Alltag `8.0` (Blitzer, Settings-IA, Preiswache) kann **parallel zu V2** geschnitten werden, sobald V1 grün ist — nicht vor Debug/Dedup.

---

## 6. Sprint 142 — Stabilität Kern (`6.91.0`) **CODE**

Ziel: Die Screenshot-Parser und der Debug/Send-Kern sind root-cause-fest, nicht kosmetisch.

| ID | Must | DoD |
|----|------|-----|
| A1 | Turn-Gate: keine Doppel-Sends, Debug parallel auf eigenem Chat | Tests Dedup + parallel |
| A2 | Debug-Session überlebt Settings-Unmount, Timeout, Download danach | FSM idle/starting/running/stopping |
| A3 | Android-Back schließt Overlay, nicht den Lauf | popstate |
| A4 | Drive schließt nicht durch stale onDone | closeGen |
| A5 | WRITE_DASH keine Vereinsliste | test-014 |
| A6 | Wetter-Greeting-Gate | test-014 |
| A7 | Fahrmodus Replace „lieber nach X“ | test-014 |
| A8 | Aldi-Brand + Grocery-List-Namen | test-014 |
| A9 | Titel-Ellipsis | CSS + titleFromUser |
| A10 | Version `6.91.0` | package + APP_VERSION |
| A11 | Street View: Kugel + ehrlich, Chip „Geht nicht“ | test-014 S13 |
| A12 | Globe-Brief ohne leere Tagesschau; Polish nicht stutzen | test-014 S14 |
| A13 | Recall/Search nie `ChatTitel: body` | test-014 S16–S17 |
| A14 | Dump-Zeilen und Debug-Chats nicht indexieren | `isDumpLine` |
| A15 | `Was weißt du über mich` = gepinnte Fakten, kein RAG-Dump | test-014 S18 |
| A16 | `onMeta.conversation` setzt den Header sofort | chat.ts + App.tsx |

Won’t in 142: WebRTC, Memory-Graph, PDF, SmartThings, Foreground-Service `5.12` (Home killt JS weiter — ehrlich im UI-Text).

---

## 7. Folgesprints (V1 Rest → V9)

### Sprint 143 — Overlay-FSM & Weltlage (`6.92`) **CODE in `6.93.0`**

- Overlay-State-Machine für Settings/Voice/Drive/Calendar (`closed→opening→open→closing`, `exclusive` hält Drive unter Sheets).
- Weltlage: Banner, nie Alarm-GUI (`alarm` Default false, Titel „Weltlage“ erzwingt quiet). Pin-Tap → Sprechblase (Text, Swipe-Platzhalter).
- `outlook_interrupt` Default bleibt aus; Watch setzt `alarm: true` nie.

### Sprint 144 — Gemini-Abbruch & Research-Pending (`6.93`) **CODE**

- Unvollständige Sätze immer retry oder klarer Abbruch.
- `ja bitte` nach Such-Angebot = pending research.
- Tweet/News-Personen in `isLiveLookup`.
- Anrede: Siezen konsistent; Vorname nicht vokativ.

### Sprint 145 — TTS Gemini-Primary (`6.94`) **CODE in `6.96.0`**

- Standing: warten auf Gemini, Health/Skip kranker TTS-Modelle. Native-Race 400 ms nur im Fahrmodus.

### Sprint 146 — App-Action-Registry (`6.95`) **CODE in `6.96.0`**

- Parser+Handler `app`: Settings (Topic), Debug, Gedächtnis-Panel, Sprachmodus, Theme. UI öffnet über `tool.action`. Lage bleibt `hud`.

### Sprint 147 — Banner, Chips, Wake (`6.96`) **CODE**

- Gemini-Banner einmal, Verstanden speichert. Quellen-Badge ohne `1 · Wetter`. Wake nur auf Final.

### Sprint 148 — Action-FSM (`6.97`) **CODE in `6.99.0`**

```text
INTENT → PLANNER → PRECONDITIONS → EXECUTION → OBSERVATION → VERIFICATION → STATE → RESPONSE
PLANNED | RUNNING | WAITING | VERIFYING | SUCCESS | FAILED | CANCELLED
```

`packVerified` in `action-fsm.ts`. SUCCESS nur mit Observation. TV, PC, App, Navi, Home.

### Sprint 149 — Navi Replace verifiziert (`6.98`) **CODE in `6.99.0`**

Navi: `IDLE → CALCULATING → ACTIVE_ROUTE → REPLACING_ROUTE → VERIFYING → ACTIVE_ROUTE`.
`startRoute` spricht Erfolg nur nach `naviRouteVerified` (Ziel, GPS, rideOk, Minuten). `scrubReply` fängt Navi-Lügen.

### Sprint 150 — Research-Pending hart (`6.99`) **CODE**

Pending mit TTL, `ja bitte` sucht die gemerkte Frage, `nein` bricht ab. Ohne Quellen: `RESEARCH_EMPTY`. Completed Research frisst Confirm nicht.

### Sprint 151 — Attachments + Verify Upload (`9.0`) **CODE in `9.0.0`**

Datei-Knopf PDF/Text/Foto. IndexedDB `docs`. `packVerified` Domain `doc`. SUCCESS nur mit `docUploadVerified`.

### Sprint 152 — PDF/Text-Parser (`9.0`) **CODE in `9.0.0`**

`Lies das PDF` → `doc`. `Lies das Foto` bleibt `eye`. Unkomprimierte PDF-Literale lokal. Gescannte PDFs leer → ehrlich.

### Sprint 153 — OCR (`9.0`) **CODE**

Foto-OCR nur Gemini. Ohne Key kein Fake. Word/Excel/HEIC abgelehnt.

### Sprint 137 — Hierarchical Memory (`7.0`) **CODE in `7.0.0`**

`memory-layer.ts`. Domain `memory`. Quelle + Confidence. Kein Lance.

### Sprint 138 — Retrieve + Quelle (`7.0`) **CODE in `7.0.0`**

Recall nennt Kalender/Pin/Gespräch. Treffer ohne Quelle = failed.

### Sprint 139 — Working Memory + Write-Verify (`7.0`) **CODE in `7.0.0`**

Overwrite max 8. „Gemerkt“ nur nach Read-Back. Widerspruch prüft Löschung.

### Sprint 140 — Sleep-Prune (`7.0`) **CODE**

Aufräumen lokal. Sleep-Harvest nur ohne Gemini, Confidence 0.4.

### Sprint 154 — TV Device-Registry (`9.1`) **CODE in `9.1.0`**

`tv-registry.ts`. Tizen/Fire, Apps, Pick nach Name. Seed aus Settings.

### Sprint 155 — Verify Launch (`9.1`) **CODE in `9.1.0`**

SUCCESS nur mit Gerät, Kopplung, App-Fähigkeit, Native-OK, `appId`.

### Sprint 156 — Ehrliche Launch-Sätze (`9.1`) **CODE**

„Start angekommen“, nicht „ist offen“. `scrubReply` fängt TV-Lügen.

### Sprint 157 — PC Capability-Levels (`9.2`) **CODE in `9.2.0`**

`pc-cap.ts`. Stufen offline → status → screen → input → files → ground. Agent wirbt Caps.

### Sprint 158 — PC Confirm hart (`9.2`) **CODE in `9.2.0`**

Löschen und unbekanntes Starten warten auf Ja/Nein. FIFA ohne Extra-Confirm.

### Sprint 159 — Verify PC-Aktionen (`9.2`) **CODE**

Launch nur mit Start-Beweis. Klick „gesendet“, nicht „ausgeführt“. Agent down ehrlich.

### Sprint 160 — PC WebRTC-Signaling (`9.3`) **CODE in `9.3.0`**

`/v1/webrtc` über das LAN-Token. Capability `stream`. Kein TURN.

### Sprint 161 — Live-Dock + Sitzung (`9.3`) **CODE in `9.3.0`**

Einzelbilder in der Sitzung. Dock über dem Composer. Live aus beendet.

### Sprint 162 — Verify Live-Stream (`9.3`) **CODE**

WebRTC-Satz nur mit connected+track. JPEG bleibt JPEG.

### Sprint 163 — Regression-Katalog (`9.9`) **CODE in `9.9.0`**

Debug-Gruppe V9. V1–V8 bleiben im Katalog. `/hilfe` `9.9.0`.

### Sprint 164 — Security hart (`9.9`) **CODE in `9.9.0`**

PC nur LAN. Keys/Token nicht im Chat. Settings-Felder Passwort.

### Sprint 165 — UX + Industry-DoD (`9.9`) **CODE**

Live-Dock ohne Session kein HTTP. Industry-DoD abgehakt.

### Danach

Alltag `8.0`, Debug-Hintergrund `5.12`. Kein Major ohne Verification-Schicht.

---

## 8. Definition of Done (Industry)

Zusätzlich zu `03-agile-process.md`:

- [x] Kein Erfolgssatz ohne Tool-Observation
- [x] Jeder Hintergrundprozess: Start, Monitor, Stop, Recovery
- [x] Overlay immer schließbar (Button + Back + Force)
- [x] Eine User-Nachricht = ein Turn (außer expliziter Retry)
- [x] Parser-Falschalarme aus diesem Audit haben Regressionstests
- [x] `test:014` grün; Debug-Katalog um die Screenshot-Prompts erweitert (143)

### Beta Ready (PO)

`9.9` schließt **V9** (163–165). Industry-Track V1–V9 ist **CODE**. Screenshot-Fixes `9.9.2` **CODE**. Sideload **`9.9.2`** — das ist kein Store-Release. Alltag `8.0` und Debug-Hintergrund `5.12` bleiben PLAN.

---

## 9. Teststrategie

| Risiko | Unit | Integration | E2E / Debug-Lauf |
|--------|------|-------------|------------------|
| Doppel-Prompt | turn-gate | zwei Submits | Debug-Gruppe Randfälle |
| Debug-Crash | Timeout in session | Topic-Wechsel während Lauf | Live 5.11-Katalog |
| Overlay hängt | popstate | Fertig + Back | Handy |
| Wetter-Greeting | weather-parse | Chat mit last_weather | Screenshot-Prompt |
| Ort-Dash | places-parse | Memory nicht geschrieben | Screenshot-Prompt |
| Route-Replace | drive-parse | startRoute rideOk | Fahrmodus GPS |
| Aldi | poi-parse brand | Overpass mock / skip_if no_gps | Live |
| Street View | wont-parse + streetViewPlace | Kugel-Focus gesetzt | Screenshot |
| Globe-Stumpf | composePlaceBrief / looksTruncated | polish Fallback | Screenshot London |
| Recall-Dump | formatRecallReply / isDumpLine | IndexedDB mit alten Titeln | Zahnarzt / Steuer / über mich |
| Voice-Fallback | tts budgets | Provider down | VERSION 2 |
| TV Netflix | tvLaunchVerified + packVerified | launch + verify | **CODE `9.1`** |
| PC offline | pc-cap + packVerified | Agent down | **CODE `9.2`** |
| PC live | rtcStreamVerified | Agent down / kein Peer | **CODE `9.3`** |
| PC Host / Keys | isAllowedPcHost + redactSecrets | 172/Key im Chat | **CODE `9.9`** |

Failure Simulation: Tool Timeout, Success-ohne-Wirkung, Netz weg, große Uploads — ab V3/V4.

---

## 10. Risiken

| Risiko | Wirkung | Gegenmaßnahme |
|--------|---------|----------------|
| Home killt WebView | Debug tot trotz Session | `5.12` Foreground-Service; bis dahin Banner |
| Overpass/OSRM down | POI/Navi leer | ehrliche Fehler, kein Fake |
| Gemini MAX_TOKENS | Satzstümpfe | Sprint 144 |
| Parser vs. Hirn | zu wenig Smalltalk | Score-Margin; Screenshot-Fälle als Wont/Skip |
| Scope V4–V9 | Stabilität leidet | Freeze: keine TV/PC-Features in V1-Sprints |

---

## 11. Engineering-Regeln (verbindlich)

1. Nie Erfolg ohne Verification.
2. Root Cause, kein Symptom-Patch.
3. Jede Action hat einen Lifecycle.
4. Jeder Hintergrundprozess: Start/Monitor/Recovery/Stop.
5. Externe Calls: Timeout, Retry, Fallback — Fallback nicht zu früh.
6. UI-State und Engine-State dürfen nicht divergieren (`drive_mode` vs. Overlay).
7. Memory braucht Quelle, Confidence, Bereinigung (V5).
8. Android-App ist das Produkt. PC ist Erweiterung.
9. Regression nach jedem Sprint (`test:014` + betroffene Gruppen).

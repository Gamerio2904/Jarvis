# Changelog

Versionen folgen [`09-versioning.md`](./09-versioning.md).  
Sprints folgen numerischer Lieferreihenfolge ([`sprints/README.md`](./sprints/README.md)).

## Unreleased

## `13.31.1` — Bundesliga-Tabelle lesbar — *CODE*

- **Sport:** Eine Zeile pro Verein, Kurznamen, Platz/Pkt/Tore. Kein Satz-Klumpen.
- **Follow-up:** „Das ganze Übersichtlicher“ holt die Tabelle neu.

## `13.31.0` — Kugel-Pan + Deep Research — *CODE*

- **Kugel:** Fly-to Tokio einmal. Zoom und Drehen bleiben, kein Snap zurück. Neuer Befehl fliegt neu (`at`).
- **Deep Research:** Tippfehler „Deep Researche“, Wikipedia-Bericht statt Schnipsel-Dump, Geothermie-Treffer fliegen bei Anzug raus. Safety-Verweigerung (Stalingrad) fällt auf den Digest zurück.
- Sideload **`13.31.0`** (versionCode `133100`).

## `13.30.0` — Körper-Wissensbaum — *CODE*

Sprints **217–220**. e5 bleibt Freeze. Sideload **`13.30.0`** (versionCode `133000`).

- **Eingang:** Organ (Auge, Ohr, Hirn, …) wählt Skills.
- **Baum:** Skill-Knoten Kalender / Internet / Deep Research / Gedächtnis, darunter Packs, Pins, Termine.
- **Cluster:** Topic-Token, linear, Cap. Kein Qdrant, kein e5-Router.
- **Kalender:** `nächsten Freitag`, `Kalender heute`.

## `12.70.0` — Drei Flächen, ein Hirn — *CODE*

Sprints **209–216**. e5 bleibt Freeze. Sideload **`12.70.0`** (versionCode `127000`).

- **Rollen:** Settings Gerät — Hirn vs Fenster vs Werkzeug. Tablet allein = Hirn.
- **Tablet ≥900 px:** Lage + Verlauf + Composer. Handy-Lage: Chat weicht (kein Bug).
- **Presence:** Token ≠ PC-Token, Port 18791, LAN-Guard. Aus = kein Schreib.
- **Viewer:** `desktop/jarvis-window.html` + BAT-Knopf. Ohne Hirn ehrlich tot.
- **Tisch:** Parser an/aus, Frame nur Auge/PC-JPEG.
- **Drop:** `POST /v1/presence/drop`. VR bleibt Parking.

## `11.60.0` — Fachwissen + Deep Research — *CODE*

Sprints **202–208**. e5 bleibt Freeze. Sideload unverändert `10.60.2`.

- **Store:** `knowledge_packs` (DB v8), Cap 12 / 24 Claims, Hausstand-Feld.
- **Teach:** `lern das` / `als Fachwissen X`. Harvest Paste → Research → Doc → Notiz.
- **Ask:** `bei uns` / `Fachwissen …` → Pack-Antwort. Mate/Reisen ohne Pack-Leak.
- **Deep:** 3–5 Queries, Offer „Soll ich das merken?“. Kein stiller Write.
- **Settings Daten:** Liste, Löschen, Export. Copy-Gruppe Fachwissen-11.

## `10.66.0` — Memory-10 Intensiv — *CODE*

Sprints **196–201**. e5 bleibt Freeze.

- **Alias:** `passwort` / `essen` / `termin` keine Gruppenanker. WLAN weiter über `wlan`/`fritzbox`.
- **Recall:** `Welche Reisen plane ich?` ohne Goal → *Nichts Belegtes*, nicht Echo der Frage.
- **Hirn-Prompt:** `memoryBlock` nimmt Retrieve-Memory-Hits (FritzBox/Blau12 bei WLAN-Frage).
- **Goals:** Auto-Wunsch hängt nicht an `reise`. Tokyo bleibt Reise.
- **Mag ich Döner?** Memory-Parser, auch ohne Gemini-Key.
- **Tests:** `test:memory-10` Live-Keys; `test:memory-10-intens` ist Gate.

## Unreleased (Pläne)

- **Fachwissen 11.0:** [`58-next.md`](./58-next.md) **PLAN**. Deep Research + Teach-Packs (Sprints 202–208). Getrennt von Cap-80-Prefs. Kein Execute, kein APK-Bump.

## `10.60.2` — Multi-Intent, Film, Weltlage, Handy-Kontrolle — *CODE*

Sideload **`10.60.2`**. Screenshot-Fixes vom 3.9. Abend.

- **Drei Befehle in einem Satz:** Wetter Stuttgart + Timer Pasta + Zahnarzt Freitag werden getrennt ausgeführt. Ort ist Stuttgart, nicht „morgen in Stuttgart“.
- **Gedächtnis:** „was du über mich weißt / fass das zusammen“ ist Recall, nicht Gemerkt. Zahnarzt-Frage sucht den Termin.
- **Film:** Bewertung ohne englischen Plot-Abriss. **Benzinpreis** löst Suche aus. **Weltlage** ohne Hamburger Lokal-RSS, ohne „Geheim-Feed“.
- **Plaudern:** Begrüßung „Ich höre.“ Persona erlaubt freies Reden ohne Tool.
- **Handy:** gekoppelte Bluetooth-Geräte nennen + BT-Seite; Medienlautstärke; Display/Standort/Ton/Akku-Einstellungen. Schalter legt Jarvis nicht selbst um.
- **Kalender:** Safe-Area, Titel nicht unter der Uhr.

## `10.60.1` — Screenshot-Fixes Kugel / Bundesliga / Research — *CODE*

Sideload **`10.60.1`** (versionCode `106001`).

- **Kugel:** Fly-to läuft beim ersten Fokus (Tokio). GPS-„Sie“ überschreibt Stadt-Fly nicht. Zoom bis 4.4. Küstenlinien halbiert + LOD beim Drehen. DPR 1.5.
- **Bundesliga:** `Wie steht die Bundesliga?` lädt `getbltable` (Platz, Verein, Punkte, Tore:Gegentore), nicht drei Paarungen ohne Stand.
- **Research:** Vergleich/Tabelle und lange Erklär-Fragen gehen ins Netz. Knowledge-Gap erkennt „liegen mir keine Daten“.
- **Wetter-Parser:** `ein Hotel in der Innenstadt` ist kein Ort. Hotel+Preis+Wetter bleibt Research.
- **Quellen:** `&#x27;` wird zum Apostroph. Digest lokal listet Themen, klebt nicht Tokio+ISS+Rezept zusammen.

## `10.60.0` — Semantisches Gedächtnis — *CODE*

App-Code **`10.60.0`**. Sideload **`10.60.0`** (versionCode `106000`). Sprints 187–194. 195 Freeze.

- **Schema:** optionale Felder `kind` / `tense` / `entities` / `related_ids` / `importance` / `parent_key` / `not_useful`. Alter Hausstand importiert ohne Verlust.
- **Gate:** STORE / MERGE / IGNORE / REVISE (`memory-gate.ts`). Dump/Smalltalk/zu kurz/Alltagsmahlzeit → IGNORE. Gleicher Key → REVISE.
- **Retrieve 2:** Alias (WLAN/FritzBox, Japan/Tokyo, …), kind/entity/tense-Filter, Boosts +0.4/+0.3/+0.3. Goal-Query ohne Goal-Pin liefert keine Prefs (G5).
- **Graph light:** `related_ids` bidirektional, Retrieve 1-Hop max 2 Nachbarn.
- **Gold:** `npm run test:memory-10` G1–G6 grün **ohne e5**.
- **Experience:** `not_useful` + `last_recall_json`; `vergiss` / „stimmt nicht“ markiert den letzten Hit. Prune sortiert `confidence - not_useful*0.15`.
- **Settings:** Gedächtnis zeigt Kind/Entities. Tests-Reiter: Memory-10 zuerst, jedes Prompt ein Kopierfeld.
- **Sideload:** `releases/Jarvis.apk` versionName `10.60.0` · versionCode `106000`.
- **Won’t gehalten:** Qdrant, Qwen-Embedding, e5 als `pickRoute`, stilles Gemini-Sleep, APK-Gewichte. `applyE5Rerank` bleibt Identität.

## `9.10.0` — Rest final — *CODE*

App-Version und Sideload **`9.10.0`** (versionCode `91000`). Default-Lane wie `9.9.2`. Vor Neuinstall Hausstand exportieren.

- **Debug `5.17`:** Foreground-Service „Jarvis testet…“ (Notification 73, `specialUse`), WebView-Keep-alive bei Home (`resumeTimers` nur). Notify-Tap öffnet die App, nicht den Sprachmodus. WakeLock 30 min. App schließen bleibt tot. Wake-FGS unverändert.
- **Sehen:** 3060 **NO-GO**. Chat *Sehen am PC ist aus* (Freeze). Keine Gewichte, keine Dummy-Boxen.
- **Could:** Settings Stimme/Hirn: ONNX-VAD, Piper, Kokoro, e5 — Default aus. Fehlt die Datei, ehrlicher Satz. e5 nie Router. Debug-Export: TTFT / First-Audio / P95.
- **Alltag-Parser (179):** Amazon Music ≠ Prime, `Chat nach Privat legen`, Settings-Suche Blitzer/Amazon, Blitzer-Korridor ohne Overpass (`test:alltag`).
- **168** bleibt Geräte-**KATALOG** / PO (Sprint **178**).
- **Docs (182):** Live-Header und Backlog = Code `9.10.0`. Nächste Schiene [`55-next.md`](./55-next.md).

Sideload **`releases/Jarvis.apk`**. Über `9.9.2` installieren nach Hausstand-Export.

## `9.9.2` — Screenshot-Bugs / Kugel+Stimme — *CODE*

App-Version und Sideload **`9.9.2`** (versionCode `90902`). **Hirn:** Gemini (Key) Hauptweg → Groq Backup → 0,5B letzter Fallback. Vor Neuinstall Hausstand exportieren.

Sideload **`releases/Jarvis.apk`**. Über `9.9.1` oder `9.9.0` installieren. Probe V1–V9 plus Gruppe **Screenshot-Bugs**: Einstellungen → Tests.

### Screenshot-Bugs / Kugel+Stimme — *CODE* (`9.9.2`)

Sprints 166–168. Recherche [`53-next.md`](./53-next.md).

- **Kugel:** Erde folgt dem Finger; Idle ohne Dauerdrehen; eine Küstenlinie; GPS-Pin frisch, kein 0/0-Focus.
- **Greeting:** „wie geht’s“ in einem Arbeitssatz ist kein Loop; Mood-Antwort; Smalltalk nicht als last-step.
- **Weltlage:** „gerade“ / STT „Gersde“; News behandelt das nicht als Ort.
- **TV vs Research:** „Mach du das an“ bestätigt Suche; „Suche nach Fernseher“ koppelt, googelt nicht.
- **Truncation:** `Bietigheim-` bleibt erkennbar abgeschnitten.
- **Stimme:** Edge-First 1100 ms, TTS an Satzgrenze, 240 Tokens, STT 8 Alternativen, mehr Repairs.

### Handy-Lage / Beta-Polish — *CODE* (`9.9.1`)

- Screens unter `frontend/src/ui/` (Lage, Stimme, Settings, Fahrt, Kalender, Debug). Engine bleibt `frontend/src/engine/`.
- Handy: Kugel, Körper und Kacheln füllen den Bereich über dem Composer. Der Chat-Verlauf liegt nicht mehr darunter gequetscht. **Lage aus** gibt den Chat frei.
- Keine doppelten Lage-Chips (HUD-Layout ist die Fläche selbst).
- Keine ERDE-Anleitungskarte; Kurzlage nur wenn ein Ort/Brief da ist.
- Toter `{true ? (`-Wrapper im Chat weg. `titleSlide`/`tileIn` ohne `both` (Android opacity-0).

### Anzeige (bestehende Flächen, kein neues Feature) — *CODE*

- **Kugel aus** gibt `hud_force` frei — die Erde bleibt nicht dauerhaft auf dem Handy.
- **Einstellungen** überdecken die Lage (kein rAF darunter). Suche leert die Reiter nicht. Karten bleiben sichtbar (`cardIn` ohne `both`, sonst Android opacity 0).
- Stimme-Turn aktualisiert Settings-State, damit Lage an/aus sofort greift.

### Qualität / Latenz (in `9.9.0`) — *CODE*

Recherche [`52-research-latency-quality.md`](./52-research-latency-quality.md). Loop aus Gemini/Groq Prompt-Cache, Pipecat/Twilio-SLOs, Groq-SSE. Kein neuer Stack.

- **Prefix-Cache:** Persona (± Sprach-Hint) bleibt `system_instruction`. Memory, Working, Last-Step, Suche, Digest hängen am letzten User-Turn (`prompt-split.ts`).
- **Groq:** Token-Stream (SSE, Bearer), Fallback JSON. Native SSE kann Bearer.
- **SLO:** `latency.ts` markiert Hirn / erste Stimme / gesamt. Tests-Reiter und Debug-Dock zeigen die letzte Zeile.
- **Warmup:** TLS/DNS gegen Google/Groq beim App-Start, ohne Key in der URL.
- **Turn-Taking:** Fertiger Satz → 220 ms Stille, unfertig („und …“) → 800 ms. Android-Recognizer startet bei unfertigem Partial neu.
- **Barge-in:** Mic während Denken/Sprechen. Backchannel (`mhm`) zählt nicht. Gespeichert wird nur, was schon gesprochen war.
- **First-Audio:** Kein 480-ms-System-TTS mehr. Auto rennt Microsoft Edge Neural (Conrad/Katja, frei) gegen Gemini Algieba; eine Stimme pro Antwort. Groq-TTS spricht kein Deutsch. System-TTS nur wenn beide Neural-Wege fehlen.

### `9.9.0` — V9 Hardening — *CODE*

Sprints 163–165. Regression, LAN-only PC, Secret-Redact. Sideload **`9.9.0`** (versionCode `90900`). Alltag Won’t.

- **Regression:** Debug-Gruppe V9, HELP `9.9.0`, V1–V8 bleiben. Probe V1–V9: ein Kopierfeld pro Prompt.
- **Settings:** Acht Reiter (API-Keys, Hirn, Stimme, Alltag, Geräte, Lage, Daten, Tests). Keys nicht mehr über 17 Themen verteilt.
- **Hausstand:** Export schreibt nach Downloads. Alle dauerhaften Settings inkl. Keys, Stecker, HUD, Preiswachen.
- **Security:** `isAllowedPcHost` (kein 172/Internet). `redactSecrets` im Chat. Keys als Passwort.
- **UX:** Live-Dock pollt den Agenten nur mit Sitzung. Host-Hinweis in Settings.
- Docs [`sprints/sprint-163.md`](./sprints/sprint-163.md)–[`sprint-165.md`](./sprints/sprint-165.md)

### `9.3.0` — V8 Live-Stream (WebRTC-Signaling + LAN-JPEG) — *CODE*

Sprints 160–162. Signaling über das LAN-Token. Live-Dock. WebRTC-Satz nur mit Peer. Sideload bleibt `6.90.0`. TURN Won’t.

- **Signaling:** `/v1/webrtc` start/offer/frame/hangup. Capability `stream`.
- **Live:** LAN-Einzelbilder im Dock. „Live aus“ beendet. JPEG ist kein Peer.
- **Verify:** `rtcStreamVerified` — ready ohne Track = failed. Relay/TURN abgelehnt.
- Docs [`sprints/sprint-160.md`](./sprints/sprint-160.md)–[`sprint-162.md`](./sprints/sprint-162.md)

### `9.2.0` — V7 PC Capability-Levels + Confirm + Verify — *CODE*

Sprints 157–159. Stufen vom Agent, Confirm für unbekanntes Starten und Löschen, Launch/Klick nur nach Observation. Sideload bleibt `6.90.0`. WebRTC Won’t.

- **Stufen:** offline → status → screen → input → files → ground. Ohne Fähigkeit kein Start.
- **Confirm:** FIFA bekannt ohne Extra-Frage. Chrome & Co. erst nach Ja. Löschen bleibt Ja/Nein.
- **Verify:** Launch braucht `started`/`name`/`pid`. Klick „gesendet“, nicht „ausgeführt“. JPEG ist kein Zug-Beweis.
- Docs [`sprints/sprint-157.md`](./sprints/sprint-157.md)–[`sprint-159.md`](./sprints/sprint-159.md)

### `9.1.0` — V6 TV Device-Registry + Verify Launch — *CODE*

Sprints 154–156. Registry, Launch nur nach Observation. Sideload bleibt `6.90.0`. SmartThings Won’t.

- **Registry:** Tizen + Fire, Apps, Pick nach Name. Seed aus den Settings-Feldern.
- **Launch:** SUCCESS nur mit Gerät, Kopplung, App-Fähigkeit, Native-OK, `appId`.
- **Satz:** „Start angekommen“, nicht „Netflix ist offen“. `scrubReply` fängt die Lüge.
- Docs [`sprints/sprint-154.md`](./sprints/sprint-154.md)–[`sprint-156.md`](./sprints/sprint-156.md)

### `7.0.0` — V5 Hierarchical Memory — *CODE*

Sprints 137–140. Quelle, Confidence, Contradiction, Prune. Retrieve/Working/Sleep bleiben lokal. Sideload bleibt `6.90.0`. V4 Dateien aus `9.0` bleiben im Baum.

- **Schichten:** Sensory → Working (8) → Episodic (Retrieve mit Quelle) → Semantic (Pins ab 0.55).
- **Write:** „Gemerkt“ nur nach Read-Back. Widerspruch prüft Löschung.
- **Recall:** Kalender/Pin/Gespräch/Einkauf genannt; Treffer ohne Quelle = failed.
- **Prune:** abgelaufen, Dumps, niedrige Confidence nach 14 Tagen, Kappe 80. Sleep-Harvest nur ohne Gemini.
- Docs [`sprints/sprint-137.md`](./sprints/sprint-137.md)–[`sprint-140.md`](./sprints/sprint-140.md) · [`49-next.md`](./49-next.md)

### `9.0.0` — V4 Dokumente — *CODE*

Sprints 151–153. Attachments, PDF/Text-Parser, OCR mit Verify Upload. Sideload bleibt `6.90.0` bis zur nächsten APK. **Nicht** Alltag-Stimme `8.20`.

- **Datei-Knopf:** PDF, Text, Foto. Word, Excel, HEIC ehrlich abgelehnt.
- **PDF:** unkomprimierte Literale lokal. Gescannte Seiten: Foto, kein „PDF gelesen“.
- **OCR:** Gemini-Vision; ohne Key kein Fake.
- **Verify:** Domain `doc` in der Action-FSM. SUCCESS nur mit Observation.
- Docs [`sprints/sprint-151.md`](./sprints/sprint-151.md)–[`sprint-153.md`](./sprints/sprint-153.md)

### `6.99.0` — V3 Verified Actions — *CODE*

Sprints 148–150. Action-FSM, Navi-Replace nur nach Verification, Research-Pending hart. Sideload bleibt `6.90.0` bis zur nächsten APK.

- **Action-FSM:** SUCCESS nur mit Observation. TV/PC/App/Navi/Home.
- **Navi:** Replace verifiziert Zielwechsel, GPS, `rideOk`. Kein Erfolgssatz „sofort neu“ ohne Strecke.
- **Research:** `ja bitte` sucht die gemerkte Frage; TTL; `nein` bricht ab; ohne Quellen ehrlich leer.
- Docs [`sprints/sprint-148.md`](./sprints/sprint-148.md)–[`sprint-150.md`](./sprints/sprint-150.md)

### `6.96.0` — V2 Voice & App — *CODE*

Sprints 145–147. TTS-Primary im Standing, App-Actions, Banner/Chips/Wake. Sideload bleibt `6.90.0` bis zur nächsten APK.

- **TTS:** Standing wartet auf Gemini; 404/429 skippen das Modell. Am Steuer bleibt das kurze Native-Race.
- **App-Actions:** `Öffne Einstellungen` / Debug / Gedächtnis-Panel / Sprachmodus / Theme — Parser, kein Fake-Klick.
- **Banner:** Gemini-Hinweis einmal, Verstanden speichert.
- **Chips:** Quellen-Badge ohne `1 · Wetter`.
- **Wake:** nur Final-STT plus Debounce, kein doppeltes Voice-Open.
- Docs [`sprints/sprint-145.md`](./sprints/sprint-145.md)–[`sprint-147.md`](./sprints/sprint-147.md)

### `6.93.0` — V1 Abschluss — *CODE*

Sprints 143–144. Overlay-FSM, Weltlage ≠ Wecker, Gemini-Abbruch, Research-Pending `ja bitte`. Sideload bleibt `6.90.0` bis zur nächsten APK.

- **Overlay:** `overlay-fsm.ts` — Sheets exclusive, Drive bleibt darunter; `pointer-events: none` solange Settings/Stimme/Kalender oben. Fertig und Back schließen die oberste Fläche.
- **Weltlage-Watch:** Native `alarm` Default false; Titel „Weltlage“ nie Alarm-Activity. `OUTLOOK_WATCH_ALARM = false`.
- **Pin-Tap:** Sprechblase (Name, Kurzlage, kein Bilder-Swipe), Schließen / Im Chat.
- **Gemini:** unvollständiger Satz → Retry mit mehr Tokens; bleibt stumpf → `Die Antwort ist abgebrochen…` vor `scrubReply`.
- **Research:** Tweets in `isLiveLookup`; `ja bitte` nach `research_offer` wiederholt die gemerkte Frage.
- **Anrede:** Siezen, Vorname nicht vokativ. Greeting nach Geräteuhr; Abend nach Mitternacht bleibt Abend.
- **Debug:** Gruppe „Stabilität Screenshots“.
- Docs [`sprints/sprint-143.md`](./sprints/sprint-143.md) · [`sprints/sprint-144.md`](./sprints/sprint-144.md)

### `6.91.0` — Stabilität Kern — *CODE*

Sprint 142. Phase-0-Audit der gesamten App + Screenshot-Root-Causes. Kein Feature-Major.

- **Turn-Gate:** Request-IDs, Dedup, UI-Lock; Debug parallel auf eigenem Gespräch.
- **Debug-Session:** überlebt Settings-Unmount, 90 s Timeout/Turn, Persist, Download danach. Android-Back schließt Overlay.
- **Parser:** Vereinsliste ≠ Ort; Greeting ≠ Wetter; „lieber nach X“ im Fahrmodus ersetzt die Route; Aldi-Brand; OSM-Warenlisten keine Laden-Namen.
- **Titel:** Ellipsis, Wortgrenze; Header folgt `onMeta.conversation`, nicht erst `onDone`.
- **Street View:** Kugel fliegt zum Lexikon-Ort, Chip **Geht nicht** statt „Won’t“.
- **Globe-Brief:** keine leere Tagesschau-Formel; Polish 300 Tokens, Stumpf → Canned.
- **Gedächtnis:** `formatRecallReply` statt `Titel: body`; Dumps und Debug-Chats raus; `Was weißt du über mich` nur gepinnte Fakten.
- Docs [`51-phase0-audit.md`](./51-phase0-audit.md) · [`sprints/sprint-142.md`](./sprints/sprint-142.md)

### Docs — Alltag vom Zettel `8.0` PLAN

Sprint 141. Alte Notizen gegen Code `6.90` gehalten. Neu geplant: Blitzer, Stimme `8.20`, Lage `8.32`, Netz `8.33`, **Test-Tore** (vier Phasen nach Execute-Bündeln), Settings `8.35`, Amazon/Ordner/Preis. Nach Recall: **Dauer-Zuhören `8.95`**. Recall bleibt `7.0`. Execute **nach** Stabilität `6.91+`.

- Docs [`50-next.md`](./50-next.md) · [`sprints/sprint-141.md`](./sprints/sprint-141.md)

### `6.90.0` — Globus-Briefing Gold — *CODE*

Sprints 132–136. Stadt → GIBS-Zoom **4.4** + Briefing. Welt-Tour: Glow, Seite, Zoom-Kette. Sideload **`6.90.0`**.

- **Fly-to:** `Zeig London` landet in NASA GIBS (nicht Blue Marble). Stamp mit Datum, kein Live.
- **Briefing:** Lexikon + Tagesschau-Ort oder ehrlich leer. Markt nur Hormus/EZB-Kette. DWD bei DE-Ort, ISS in der Sicht, EONET optional.
- **Ihr Plan:** Kalender/Memory/Todo nur mit Ortsnamen im Eintrag.
- **Welt-Tour:** `Was ist heute so auf der Welt passiert` / `Weltbrief` → `outlook`, Kugel, max 5 Allowlist-Länder. `Zeig mir die Nachrichten` bleibt `news`.
- **Stopp:** bricht die Tour, nicht TV/Spotify (Medium-Wort Standing).
- **Debug:** Gruppe Globus-Briefing.

- Docs [`48-next.md`](./48-next.md) · Sprints 132–136
- App-Code **`6.90.0`**. APK **`6.90.0`** (versionCode `69000`).

### `6.70.0` — Globus-Briefing Leitentscheidung — *CODE* (Docs)

Sprint 131. Stadt → GIBS. **Welt-Tour:** Länder mit weltpolitischer Lage leuchten, Seite erklärt, Zoom-Kette. Quellen Tagesschau/DW, kein Geheim-Feed.

- Docs [`48-next.md`](./48-next.md) · [`sprints/sprint-131.md`](./sprints/sprint-131.md)–[`sprint-136.md`](./sprints/sprint-136.md)
- Execute in `6.90.0`

### `6.60.0` — Split, Identität, Overlay, Sideload — *CODE*

Sprints 128–130. 127 (`6.51`) bleibt mitgeliefert.

- **Split:** `Körper an und Zeig London` trifft `hud`. Nacktes `London` nach `und` wird `Zeig London`.
- **Identität:** `Bist du ChatGPT?` / `Bist du eine KI?` / `Wie heißt du?` canned, ohne Modell, kein Marvel. `Wer bist du?` bleibt Memory.
- **Overlay:** Gemini zuerst, Fertig ohne Download, 0,5B nur Backup. Hausstand-Hinweis.
- **APK:** versionName `6.60.0`. LocateAnything-Gewichte nicht drin.

- Docs [`47-next.md`](./47-next.md) · Sprints 128–130
- App-Code **`6.60.0`**

### `6.51.0` — Parser nach Prompt-Test — *CODE*

Sprint 127. Sideload bleibt `3.18.1`.

- **Won’t:** `Überweise 200 Euro` nicht mehr FX-Kurs. Mail nicht als SMS. Street View / Live-Sat / Beobachten / 112 / Malen / Instagram / Pizza / Foto: ehrlicher Satz. `Zeig mir` ohne Ort fragt nach.
- **HUD:** Nachrichten und Notizen stehlen die Kugel nicht. Look-Umgang (`Was is das für ne Stadt`, `Ist das Paris?`). `erde anzeigen` / `Kuegel an`. Gazetteer nicht Teilstring (`Street View von London` fliegt nicht). `Wo liegt Berln` = unknown_place, nicht Schreibtisch.
- **Help:** `Was kannst du?` / `Was kannst du denn so?` / `Womit kannst du helfen?` = Katalog `6.51.0`.
- **Drive:** `Wie komme ich nach Hause` wie `Fahr mich nach Hause`.
- **Split:** `Körper an und Zeig London` zwei Teile. Fremde Wake-Wörter (`Ok Google` / Siri / Alexa) nicht still Timer.
- **Debug:** `refuse`-Soll trifft `wont`. Naive/Kaputt-Chips auf Ist-Route.

- Docs [`46-next.md`](./46-next.md) · [`sprints/sprint-127.md`](./sprints/sprint-127.md)
- App-Code **`6.51.0`**, Sideload noch `3.18.1`

### `6.50.0` — Bühne & Hirn — *CODE*

Sprints 121–126 in einer App-Version. Sideload bleibt `3.18.1`.

- **Hirn:** Gemini zuerst (Key), Groq Backup, 0,5B letzter Fallback. Kein größeres Modell lokal. Tool-Sätze dürfen von Gemini geschliffen werden — Guard streicht neue Zahlen/Orte.
- **Globus:** Zoom per Geste und Satz, NASA-GIBS True Color wenn nah, Datum sichtbar. `Zeig mir London` dreht/zoomt. `Was ist das für eine Stadt?` aus der Blickmitte. Kein Live-Video.
- **Körper:** Pulse aus echten Werten, Kamera zum Organ, Mund koppelt an Stimme. Antippen startet kein Gerät.
- **Motion:** 30 fps, Pause im Hintergrund, Reduced-Motion.
- **Fahrmodus:** Glas-HUD mit echtem Pfeil, Spotify-Glow nur bei laufendem Track.
- **Sprache:** Orb aus Mic, Stimmen-Picker (Algieba/Kore und weitere Gemini-Stimmen).
- **Test 2026-08-28:** Prompt-Matrix + Debug-Gruppen **Bühne & Hirn**, **Naive Fragen**, **Kaputt 6.50**. Gold-Globus hält. Lücken (Was kannst du, Überweise ohne Banking, Nachrichten vs. Kugel, …) in [`46-test-650.md`](./46-test-650.md) / [`46-next.md`](./46-next.md) `6.51`.

- Docs [`45-next.md`](./45-next.md) · Sprints 121–126
- App-Code **`6.50.0`**, Sideload noch `3.18.1`

### `6.0.0` — Bühne & Hirn — *war PLAN*

Gemini ist der Hauptweg (Key). Groq und 0,5B nur Backup. Kein größeres Modell lokal. Virtueller Globus: Zoom, GIBS mit Datum, `Zeig London`, `Was ist das für eine Stadt?`. Motion, Körper, Fahrmodus, Sprache.

- Docs [`45-next.md`](./45-next.md) · Sprints 121–126
- Index [`42-planned.md`](./42-planned.md)
- App-Code **`5.11.0`**, Sideload noch `3.18.1`

### `5.11.0` — Körper, Kugel, Debug-Lauf, Sehen-Parser — *CODE*

Bündelt Sprints 115–120 in einer App-Version. Sideload bleibt `3.18.1`.

- **Körper:** Lage-Sicht Schema (Canvas), Organ antippen = Kachel, kein Tool. `Körper an` / `Zeig Hirn`.
- **Kugel:** Lage-Sicht Erde, Terminator, Pins aus GPS/ISS/DWD/outlook-Lexikon. Kein Live-Satellitenvideo.
- **Debug:** Klickboxen, neues Gespräch, Writes-Warnung, Stop, JSON+TXT mit Verdict. Kein Auto-Ja. App offen lassen.
- **Sehen:** Parser für Zeig/Zählen/Tippen/Beleg/zwei Schritte. `/v1/ground` Client. Ohne JarvisSee: ehrlich aus, keine Fake-Boxen.
- **Parser-Patches nach Prompt-Test:** Alltag `zeig mal den Körper` / `mach die Kugel aus` / `Zeig PC Auge`. `Wo liegt Berlin` = Kugel-Pin, nicht Schreibtisch-Foto. Captcha/Banking/Handy-GUI = ehrlich Won’t. `Einstellungen dann Datenschutz` ohne Komma. `Zeig den Mond`. `Was steht am Friday an?` = Kalender. Doppelbefehle mit Körper/Erde/Grillen splitten.

### `5.11.0` — Debug-Lauf — *war PLAN*

Settings → Debug: mehrere Kategorien per Klickbox, neues Gespräch, Prompt nach Prompt, JSON+TXT mit Route/`tool_status`/Verdict. Baut auf `3.19`. Kein Auto-Ja.

- Docs [`44-next.md`](./44-next.md) · [`sprints/sprint-120.md`](./sprints/sprint-120.md)
- Sideload noch `3.18.1`

### `4.76.0` — Lokales Sehen / LocateAnything — *PLAN*

NVIDIA LocateAnything-3B als PC-Werkzeug (GUI-Grounding, private Boxen). **Nicht** Körper `4.66`. Research `4.77`–`4.80` (3060 GO/NO-GO) vor Execute. Alltag `4.87`+, Rest `4.94`+.

- Docs [`41-next.md`](./41-next.md) · [`sprints/sprint-116.md`](./sprints/sprint-116.md)–[`sprint-118.md`](./sprints/sprint-118.md)
- Index [`42-planned.md`](./42-planned.md)
- Inspiration: https://www.instagram.com/reel/DaJuh6euSLq/
- App-Code **`4.53.0`**, Sideload noch `3.18.1`

### `4.66.0` — Körper intern (Hirn, Auge, Hand) — *PLAN*

Lage-Sicht **Körper**: 3D-Schema live und anklickbar (nur Darstellung) plus ehrliche Kacheln. APK-WebView, kein PC nötig zum Ansehen. PC nur für PC-Auge/PC-Hand. Mails/Instagram/24/7-Cloud-Employee und Marvel-Mesh Won’t.

- Docs [`40-next.md`](./40-next.md) · [`sprints/sprint-115.md`](./sprints/sprint-115.md)
- Inspiration: https://www.instagram.com/reel/DcjTYTiCt6P/
- App-Code **`4.53.0`**, Sideload noch `3.18.1`

### `4.53.0` — Zwei Gesichter + Tablet flüssig — *CODE*

Ein Register, zwei Gesichter: Jarvis (Default, Algieba) und Friday (Kore, auf Zuruf). Wake Friday ≠ Freitag. Lage **neben** dem Chat ab 900 px, Composer und Mic bleiben. Uhr 1 s, Wetter 10 min.

- [`39-next.md`](./39-next.md) · [`sprints/sprint-114.md`](./sprints/sprint-114.md)
- Sideload-APK noch `3.18.1` — kein APK-Claim

### `4.46.0` — Hausstand Backup + Autokorrektur — *CODE*

JSON-Export `jarvis-haus-YYYYMMDD.json` (Settings+Memory+Listen, Chats optional). Import nur nach Vorschau und **Überschreiben ja**. Composer `lang=de` spellCheck. `repairSpeech` / `pickHeard` für Jarvis-Wörter und Memory-Namen. Kein Jarvis-Cloud.

- [`38-next.md`](./38-next.md) · [`sprints/sprint-113.md`](./sprints/sprint-113.md)

### `4.33.0` — Gespräch, Film-Stimme, Reel am Steuer — *CODE*

TTS: Algieba, stehend 3,5 s ohne Native-Race, Fahrt Race 400 ms / Budget 700 ms. Am Steuer: HUD + Notify + Ja/Nein, kein Fake-Anruf. Zweite Nummer nur Opt-in und ≠ dieses Gerät. Watchdog Default aus (Steckdose tot, Termin-Kollision).

- [`37-next.md`](./37-next.md) · [`sprints/sprint-112.md`](./sprints/sprint-112.md)

### `4.19.0` — Alltagskette Stimme — *CODE*

Bar/Kneipe als POI, Sprachnachricht als SMS-Text, Taxi nach Ja (Anruf oder App-Link, nie „ist bestellt“). Kette: lesen sofort, schreiben nacheinander. WhatsApp nur Chat-Link. Voice-Clip entfällt.

- [`36-next.md`](./36-next.md) · [`sprints/sprint-111.md`](./sprints/sprint-111.md)

### `4.0.0` — Weltlage / Vorhersage — *CODE*

Tool `outlook`: Tagesschau + DW, FX-Historie, Brent nur mit FRED-Key, E10-Spot, Kette Hormus/Kiew/OPEC, Szenario A/B, kein Aktien-Orakel. Watch und Unterbrechen opt-in. Lage-Kachel Welt. `/hilfe` 4.0.0.

- Research `4.1`–`4.4` entschieden in [`35-next.md`](./35-next.md)
- [`sprints/sprint-110.md`](./sprints/sprint-110.md)
- Sideload-APK noch `3.18.1` — kein APK-Claim

### `3.19.0` — Stimme ein Thread, Kalender, Debug — *CODE*

Sprachmodus bleibt im selben Gespräch. Kalender: Jahr-Ansicht, `nächste N Tage` als Fenster, `erstell einen Termin für den 5.9. 2026 …`. Einstellungen → Debug: Kategorie, Start, Chat herunterladen. Stimme: Charon wenn Gemini an.

- App-Code `3.19.0`
- Sideload-APK noch `3.18.1` — nächster Build `3.19.0`
- [`34-next.md`](./34-next.md) · [`sprints/sprint-109.md`](./sprints/sprint-109.md)

### PC-Verbindung — *CODE* (kein neuer Sideload)

`JarvisPC.bat` kopiert die WLAN-IP (`192.168`/`10`), nicht die erste WSL/Hyper-V-Adresse. Firewall-Knopf. Handy entfernt `http://` und Port aus dem IP-Feld. Ohne neue APK reicht die neue BAT; klarere Fehlzeile erst nach nächstem Sideload.

- [`desktop/README.md`](../desktop/README.md)

### `3.18.1` — GUI Premium — *CODE*

Overlays gleiten raus (Einstellungen, Stimme, Kalender). Settings-Themen und Lage-Kacheln nacheinander. Chat-Wechsel mit Thread-Slide. Reduced-motion ohne Bewegung.

- App-Code `3.18.1` (`package.json`, `APP_VERSION`, `/hilfe`)
- Sideload-APK `releases/Jarvis.apk` (versionCode 31801)
- [`sprints/sprint-108.md`](./sprints/sprint-108.md)

### `3.18.0` — Lage, Traceroute, Digest, Routing härten — *CODE*

Logische Stufen `3.0.1`–`3.45` mitgeliefert. Follow-up (`und morgen?`, `nochmal`). Zwei Intents an „und“. Parser-Score aus Treffer-Sicherheit. Konflikte (Lage vs Wetter, Ruf mich vs Anruf, Traceroute vs Karte). Tablet-Lage mit Modulen. Traceroute am PC (`tracert`), Handy ohne ICMP. `Ruf mich in 20 Minuten` = Erinnerung Rückruf. Sprachnotiz und Gesprächszusammenfassung lokal, keine Kundenrechnung. Schach-Brett in der Lage. 0,5B wählt keine Tools. Gates bleiben Gates.

- App-Code `3.18.0` (`package.json`, `APP_VERSION`, `/hilfe`)
- Sideload-APK noch `2.2.2` — nächster Build `3.18.0`
- [`33-next.md`](./33-next.md) · [`sprints/sprint-107.md`](./sprints/sprint-107.md)

### `3.0.0` — Intelligenz + Welt — *CODE*

Register statt If-Kette. Parser zuerst, dann Score-Policy (Prior, Kosten, Konflikte). Bei knappem Gleichstand eine Rückfrage. 0,5B wählt keine Tools. Welt-Reihe `3.1`–`3.17` mitgeliefert: DWD, Ferien, EZB-Kurs, Wikipedia/Destatis zuerst, Food, Library, Sport, iNaturalist, ISS/Mond, OpenSky, Recht, Waschsymbole, Sensoren ehrlich, Schach.

- App-Code `3.0.0` (`package.json`, `APP_VERSION`, `/hilfe`)
- Sideload-APK noch `2.2.2` — nächster Build `3.0.0`
- [`32-intelligence.md`](./32-intelligence.md) · [`31-next.md`](./31-next.md) · [`sprints/sprint-106.md`](./sprints/sprint-106.md)

### `2.2.2` — Testprompts raus aus der App — *CODE*

Einstellungen → Tests ist weg. Prompts nicht in der APK, Chat ohne Chips.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20202)
- [`30-next.md`](./30-next.md)

### `2.2.1` — Testprompts kopieren — *CODE*

Einstellungen → Tests: Happy Path und Randfälle als Kopierfelder. Chat ohne Chips.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20201)
- [`30-next.md`](./30-next.md)

### `2.2.0` — Uhrzeit, Ort, Auto-Research — *CODE*

Handy-Uhr statt „kein Zugriff“. Standort über GPS, nicht Wohnort raten. Mit Gemini sucht Jarvis von selbst nach BIP und aktuellen Zahlen; Tabellen als Text. Wissenslücke löst eine zweite Suche aus.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20200)
- [`30-next.md`](./30-next.md) · [`sprints/sprint-104.md`](./sprints/sprint-104.md)

### `2.1.1` — Stecker-IP im Hausnetz — *CODE*

`89.246.103.118` ist die Internet-Adresse des Routers, nicht die Steckdose. Prüfen sagt das klar. Richtig ist `192.168.…` aus Heimnetz/Geräte.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20101)
- [`29-next.md`](./29-next.md)

### `2.1.0` — WLAN-Steckdosen — *CODE*

Steckdosen im selben WLAN. Shelly und Tasmota über die IP. Smart Life / Tuya nur LAN (Device-ID + Local Key), keine Tuya-Cloud. Chat: `Steckdose an`, Name, `alle Steckdosen aus`. Ungepaart ehrlich.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20100)
- [`29-next.md`](./29-next.md) · [`sprints/sprint-103.md`](./sprints/sprint-103.md)

### `2.0.1` — Latenz, Ingersheim DE, Kurven — *CODE*

Gemini streamt Smalltalk statt auf die volle Antwort zu warten. `nach Ingersheim` nimmt den Ort am GPS (BW), nicht Grand Est. Witze und Rezept-Nachfragen sind kein Ziel/Wetter. GPS folgt der Linie in Kurven und Kreisverkehren, Ausfahrt angesagt.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20001)
- [`28-next.md`](./28-next.md)

### `2.0.0` — Haus-AI, ein Kontext — *CODE*

Letztes Medium: Lautstärke und Stopp treffen Spotify im Fahrmodus, nicht den Fernseher und nicht „CarPlay aus“. `Zeig Spotify` öffnet nicht die Karte. Wetter ohne Gemini-Raten. Erinnerung ohne Zeit fragt wann. Widget-Mikro schaltet Wake. Ohne GPS kein Fake-Ankunft. Research/Guards/TV/Memory/Stimme/Feiertage nachgezogen.

- Sideload-APK `releases/Jarvis.apk` (versionCode 20000)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-102.md`](./sprints/sprint-102.md)

### `1.48.8` — CarPlay-Route + Cafés am Valeo — *CODE*

Frühstück öffnet die Karte mit OSM-Café am GPS (Bietigheim, nicht Stuttgart). Overlay nicht erst nach dem Wort „overlay“. Keine Fake-„zehn Minuten“. Grüne Linie liegt auf den Straßen (OSRM-Polyline), nicht als Luftlinie; Ziel bleibt im Bild.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14808)
- [`28-next.md`](./28-next.md)

### `1.48.7` — Research ehrlich — *CODE*

Faktfragen wie „wie viele … verkauft Valeo am Tag“ gehen ins Netz. Zahlen nur aus Treffern; keine Umrechnung Jahr→Tag, keine 300–400k aus dem Hut.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14807)
- [`28-next.md`](./28-next.md)

### `1.48.6` — Overlay, Cafés, Route — *CODE*

„Overlay“ öffnet die Karte, nicht Spotify. Frühstück/Café aus OSM am GPS (Bietigheim), keine erfundenen Stuttgarter Läden. „Gib mir ne Route“ startet die echte Navigation und das Overlay.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14806)
- [`28-next.md`](./28-next.md)

### `1.48.5` — Karte schieben + Sprache im Fahrmodus — *CODE*

Karte wie Google Maps: ziehen, pinch-zoom, Doppeltipp, danach Standort-Knopf. Mic stoppt Navi-Ansagen, hört, führt aus und spricht die Antwort.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14805)
- [`28-next.md`](./28-next.md)

### `1.48.4` — Fahrmodus-Karte neu — *CODE*

Karte füllt den Bildschirm, Norden oben. Nur der Standort-Pfeil dreht mit. Canvas statt gedrehter Kachel-Wand — weniger Ruckeln.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14804)
- [`28-next.md`](./28-next.md)

### `1.48.3` — Fahrmodus Karte und Route — *CODE*

Karte liegt wieder über dem Chat-Feld. Route als Linie auf den Kacheln, Drehung um den Standort, letztes GPS statt Stuttgart. Route bleibt nach App-Neustart.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14803)
- [`28-next.md`](./28-next.md)

### `1.48.2` — Test-Bugs — *CODE*

Parser und Overlay aus dem Live-Test: Erinnerung statt Einkauf bei `in 20 Minuten Milch holen`. `Was trinke ich gerne?` liest, schreibt nicht. Tanke bleibt Tanke, nicht „Einer tanke“. `nächster Laden` sucht neu. Nackte Straße fragt nach der Stadt. Composer bleibt über dem Fahrmodus tippbar.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14802)
- [`28-next.md`](./28-next.md)

### `1.48.1` — Satzbildung Film-Jarvis — *CODE*

Ganze Sätze, kein Telegramm. Wetter, Bahn, Nachrichten und Feiertage sprechen wie ein Haus-AI — Fakten als Feststellung, ohne Nachsatz „kein Raten“. Persona und Sprachmodus gleich.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14801)
- [`28-next.md`](./28-next.md) · [`07-persona.md`](./07-persona.md)

### `1.48.0` — Luft, Sonne, Bahn, Nachrichten, Feiertage — *CODE*

Auf Nachfrage: Luftqualität/Pollen und Sonnenaufgang (Open-Meteo, nicht bei jedem Wetter). Bahn/ÖPNV über transport.rest, sonst Transitous — keine erfundenen Abfahrten. Nachrichten: Tagesschau; Ort zuerst Tagesschau-Suche, sonst Netz, nichts erfinden. Feiertage DE über Nager.Date. Prompt-Chips und PC-Prompt-Kopieren aus der APK (Windows-App behält Kopieren).

- Sideload-APK `releases/Jarvis.apk` (versionCode 14800)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-101.md`](./sprints/sprint-101.md)

### `1.47.1` — PC: Ein-Klick-Kopieren — *CODE*

IP, Token und Prompts als Felder mit **Kopieren** — im Windows-Fenster, unter Einstellungen → PC und im Chat.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14701)
- [`28-next.md`](./28-next.md)

### `1.47.0` — PC live (Bildschirm, Maus, FIFA, Ordner) — *CODE*

Windows-App `desktop/JarvisPC.bat`. Jarvis sieht den echten Screenshot, bewegt die Maus, startet FIFA wenn gefunden, bearbeitet Ordner im Benutzerprofil. Löschen nach Ja. Ohne laufende App kein Fake-Erfolg.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14700)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-100.md`](./sprints/sprint-100.md) · [`../desktop/README.md`](../desktop/README.md)

### `1.46.0` — Direkt anrufen und SMS, mit Nachfrage — *CODE*

`Bro anrufen` startet den Anruf erst nach „ja“. Nachricht/SMS erst nach Rückfrage senden. Ohne Nummer nachfragen. Kein Abheben und keine Zustellung behaupten.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14600)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-99.md`](./sprints/sprint-99.md)

### `1.45.0` — Öffnungszeiten für Läden — *CODE*

Apotheke, Bäcker, Parkplatz, Supermarkt, Drogerie und Laden: Öffnungszeiten aus OSM, wenn getaggt. Keine erfundenen Stunden. `Hat die Apotheke auf` ohne sofortige Route. Nächste offene, wenn die nächste zu ist.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14500)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-98.md`](./sprints/sprint-98.md)

### `1.44.0` — Filme (IMDb/RT) + Rabatt-Suche — *CODE*

IMDb- und Rotten-Tomatoes-Noten über OMDb (RT hat keine öffentliche API). Wo ein Film in DE gratis läuft, aus JustWatch — Joyn/ARD nur nennen, nicht am Fernseher starten. Rabatt-Suche beim Online-Shopping zuschaltbar (Default aus); keine erfundenen Gutscheincodes.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14400)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-97.md`](./sprints/sprint-97.md)

### `1.43.0` — CarPlay ehrlich + Alltag am Steuer — *CODE*

Nacktes `Carplay` fällt nicht mehr an Gemini (kein erfundenes Apple-CarPlay, keine erfundene Navigation/Musik). `Öffne das overlay` wechselt den Spotify-Tab. Restweg aus der echten Route. Nächster POI (Apotheke, Bäcker, Parkplatz, Supermarkt) über die Karte. Arbeit/Freundin/Zuhause. Akku/Verbindung. Taschenlampe. WLAN/Bluetooth/Nicht stören nur als Android-Seite. Anruf öffnet die Wählhilfe, SMS den Entwurf — nichts wird behauptet als erledigt.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14300)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-96.md`](./sprints/sprint-96.md)

### `1.42.0` — Wo bin ich, Standort anstoßen — *CODE*

„Wo bin ich gerade?“ geht nicht mehr an Gemini (kein geratener Arbeitsweg). GPS + Reverse-Geocode. „Aktivieren“ öffnet den Android-Dialog, notfalls die App-Einstellungen — den Schalter legt Jarvis nicht selbst um. Dieselbe Freigabe gilt für Tanke und Wetter.

- Sideload-APK `releases/Jarvis.apk` (versionCode 14200)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-95.md`](./sprints/sprint-95.md)

### `1.41.0` — Tanke E10 — *CODE*

Chat und Fahrmodus: „fahr mich zu einer Tanke“ zeigt die **nächste** und die **günstigste** Station, immer **E10**, mit Preis. Route startet zur nächsten (oder zur günstigsten, wenn so gesagt). Nachfassen: „günstigste“ / „nächste“ / „das zweite“.

- Tankerkönig MTS-K (`type=e10`); Key unter Einstellungen → Cloud
- Ohne Key: nächste Station von der Karte, **keine erfundenen Preise**
- Ohne GPS: nachfragen, nicht raten
- Sideload-APK `releases/Jarvis.apk` (versionCode 14100)
- [`28-next.md`](./28-next.md) · [`sprints/sprint-94.md`](./sprints/sprint-94.md)

### `1.40.3` — Jarvis-Ton näher am Film — *CODE*

Chat und Sprachmodus: ruhiger Haus-AI (Understatement, Straight Man), nicht derber Kumpel. Deutsch, Siezen. Keine Filmzitate, keine Marvel-Rolle.

- Persona + Voice-Hint: fertige Sätze, totes Ernst, Sir selten
- Identität: `Jarvis. Sie heißen … Für Sie, jederzeit.`
- [`07-persona.md`](./07-persona.md)
- Sideload-APK `releases/Jarvis.apk` (versionCode 14003)
- [`28-next.md`](./28-next.md)

### `1.40.2` — Timer spricht, natürliche Namen — *CODE*

Timer klingelte (Wecker-Kanal + Nachplanung mit Alarm-Ton), Jarvis war stumm (TTS auf Medien-Stream).

- Eigenes stilles Timer-Kanal; TTS auf Alarm-Lautstärke
- Nachplanung überschreibt Timer nicht mehr mit Wecker-Ton
- `Nudeln, 8 Minuten. Ich sage Bescheid.` / `Die Nudeln sind fertig.` — kein „Timer für Ihre …, Sie.“
- Wecker klingelt unverändert
- Sideload-APK `releases/Jarvis.apk` (versionCode 14002)
- [`28-next.md`](./28-next.md)

### `1.40.1` — Sätze zu Ende, TV-Tasten ohne Live-Bild — *CODE*

Gemini schnitt Antworten mitten im Satz ab (`**Entweder Sie`). Jarvis sieht den Fernseher nicht live — Tasten und Ordinal reichen für YouTube-Login/Suche.

- Abgeschnittenes Markdown schließen; Gemini ohne Thinking-Budget, mehr Output-Platz, Retry bei `MAX_TOKENS`
- Samsung: OK / D-Pad / Home wirklich senden (`KEY_ENTER`, `KEY_DOWN`, …)
- Nach TV: `OK` ist die Taste, nicht nochmal „Öffne YouTube“. `das 2.` / `das zweite` = runter + OK
- `öffne der Handels auf YouTube` sucht den Titel, öffnet nicht nur die App
- Foto-Knopf: Foto des Schirms lesen (Gemini), kein Live-Framebuffer
- Sideload-APK `releases/Jarvis.apk` (versionCode 14001)
- [`28-next.md`](./28-next.md)

### `1.40.0` — Qualität `1.34`–`1.40` — *CODE*

Eine Sideload-Stufe mit der ganzen Qualitäts-Serie. Wecker klingelt weiter; Timer sagt an, ohne Klingeln.

- **1.34** Antworten: mehr History, Memory im Smalltalk, Persona-Variation, Tool-Kontext, `ja`/`mach` auf den letzten Befehl
- **1.35** CarPlay: Off-Route entprellt, Cue-Gedächtnis überlebt Replan, HUD Tag/Nacht, Zoom nach Tempo, Karte in Fahrtrichtung, Ankunft schließt Spotify-Overlay, Ort ehrlich nachfragen, Spotify-Token
- **1.36** Phrasen: Zahlenworte, `Milch fehlt`, `Was kommt heute?`, Fan Stufe zwei, `Spiel mal was Nettes` ≠ Spotify, `stopp` letztes Medium, drei `und`, Timer spricht
- **1.37** Wake+Befehl in einer Äußerung, Widget-Glance-Intervall, Standort ohne Permission nicht aus Cache, Settings-Deep-Link
- **1.38** `kein Kaffee mehr`, `das lauter` / `stopp das`
- **1.39** STT behält Partials bei `NO_MATCH`, Barge-in bricht den Turn, Navi duckt nicht über Jarvis
- **1.40** Mehr Chips, False-Positives, ehrliche Fehler
- Sideload-APK `releases/Jarvis.apk` (versionCode 14000)
- [`sprints/sprint-87.md`](./sprints/sprint-87.md) … [`sprint-93.md`](./sprints/sprint-93.md) · [`28-next.md`](./28-next.md)

### `1.33.3` — Wecker klingelt wieder — *CODE*

- Ton hängt nicht mehr nur am Vordergrunddienst (Anzeige ohne Klingel)
- Bundled WAV + Piep-Watchdog; Ton bleibt auf dem Wecker-Bildschirm
- `setAlarmClock`, Alarm-Lautstärke erzwungen
- Sideload-APK `releases/Jarvis.apk` (versionCode 13303)
- [`sprints/sprint-86.md`](./sprints/sprint-86.md) · [`28-next.md`](./28-next.md)

### `1.33.2` — Widget hört und antwortet — *CODE*

- Homescreen-Widget öffnet den Sprachmodus (`jarvis://voice`), nicht nur die App und nicht nur Wake-Word an/aus
- Mikro und Widget-Körper: Jarvis hört und spricht, wie Shortcut und Wake-Word
- Sprachmodus bleibt beim Öffnen aus dem Widget (kein sofortiges Schließen durch WebView-Flicker)
- Sideload-APK `releases/Jarvis.apk` (versionCode 13302)
- [`sprints/sprint-86.md`](./sprints/sprint-86.md) · [`28-next.md`](./28-next.md)

### `1.33.1` — Fernseher-Befehle — *CODE*

- YouTube-Video auf dem TV sucht YouTube, nicht JustWatch/filmfriend
- Nach TV: `Spiele Sonic 3 ab` bleibt am Fernseher, kein „kein Zugriff auf Geräte“
- Sideload-APK `releases/Jarvis.apk` (versionCode 13301)
- [`sprints/sprint-86.md`](./sprints/sprint-86.md) · [`26-next.md`](./26-next.md)

### `1.33.0` — Suche & Antworten — *CODE*

- Suche: keine Absage über vorhandenen Quellen; Produkte mit Idealo/Geizhals; € nur aus Snippets
- Memory: `Name gemerkt: Timon.` statt `Timon — liegt.`
- `Öffnen CarPlay` öffnet den Fahrmodus; Route mit zweitem Router
- Sideload-APK `releases/Jarvis.apk` (versionCode 13300)
- [`sprints/sprint-86.md`](./sprints/sprint-86.md) · [`28-next.md`](./28-next.md)

### `1.32.1` — Sprachmodus Tempo — *CODE*

- Charon nur wenn schnell da, sonst sofort Android-Stimme
- Gemini-Stream kurz, Teiltext zählt; Android listen/speak hängen nicht mehr
- Sprachmodus ohne Gemini: Groq oder ehrlicher Hinweis, kein 0.5B
- Sideload-APK `releases/Jarvis.apk` (versionCode 13201)
- [`sprints/sprint-85.md`](./sprints/sprint-85.md) · [`27-next.md`](./27-next.md)

### `1.32.0` — Samsung-Apps YouTube/Amazon/Disney/Netflix — *CODE*

- Tizen: YouTube, Prime Video, Disney+, Netflix per Stimme öffnen
- `Spiel … Film`: Lookup DE (gratis/Werbung vor Abo), dann App auf dem Samsung
- Sideload-APK `releases/Jarvis.apk` (versionCode 13200)
- [`sprints/sprint-84.md`](./sprints/sprint-84.md) · [`26-next.md`](./26-next.md)

### `1.31.0` — Stimme & Jarvis-Ton — *CODE*

- Gemini-TTS: Charon, erster Satz sofort, Timeout auf System-Stimme
- Android-TTS: deutsche Neural-Stimme, eher männlich
- Chat: Smalltalk näher an Jarvis (Siezen, trocken, sparsam Master/Sir), weniger Helpdesk
- Sideload-APK `releases/Jarvis.apk` (versionCode 13100)
- [`sprints/sprint-83.md`](./sprints/sprint-83.md) · [`25-next.md`](./25-next.md)

### `1.30.0` — CarPlay flüssig — *CODE*

- Fahrmodus: Karte folgt dem Standort, GPS-Watch, Bildschirm an
- Tabs per Stimme: `Zeig Spotify`, `Karte`; Spotify als Overlay
- Navi-Ansagen: „Vorne links in 300 Metern abbiegen“
- Sideload-APK `releases/Jarvis.apk` (versionCode 13000)
- [`sprints/sprint-82.md`](./sprints/sprint-82.md) · [`24-next.md`](./24-next.md)

### `1.29.0` — Suche, Fire TV, GUI, Widget, Ventilator — *CODE*

- Internet-Suche: Gemini-Text bleibt; Links aus Grounding, DuckDuckGo und Wikipedia; Badge nie `empty`
- Composer: Textfeld volle Breite, Icon-Knöpfe, **runder** Mic — kein senkrechter Platzhalter
- Fire TV ruft in der APK das Native-Plugin (nicht mehr „nur in der Android-App“ trotz App)
- Widget 2×4: Termin, Wetter, Spracheingabe an/aus
- Deckenventilator über Broadlink-Brücke (lernen, an/aus, Stufe, Licht)
- Sideload-APK `releases/Jarvis.apk` (versionCode 12900)
- [`sprints/sprint-81.md`](./sprints/sprint-81.md) · [`23-next.md`](./23-next.md)

### `1.28.3` — Wecker klingelt — *CODE*

- Ton läuft in einem Vordergrunddienst (nicht nur auf dem Wecker-Bildschirm)
- Alarm-Lautstärke, Audio-Fokus, eingebauter Ton, Piep-Fallback
- Wake-Word hält währenddessen die Klappe

### `1.28.2` — Fire-TV-Test sichtbar — *CODE*

- **Fire TV testen** zeigt das Ergebnis direkt unter dem Knopf (nicht nur oben beim Samsung)
- IP wird beim Tippen gehalten und beim Test gespeichert (vorher oft leer → keine Meldung)
- Kurzer TCP-Check vor ADB: klare Meldung, wenn Port 5555 zu ist
- Fire TV 2. Gen: kein Dialog ohne WLAN-ADB; Samsung HDMI 3 geht trotzdem

### `1.28.1` — Wake-Word reagiert — *CODE*

- „Jarvis“ öffnet den Sprachmodus auch, wenn die App schon offen ist
- Erkennung ohne Offline-Zwang; auch Jarwis/Javis
- Dienst startet neu, wenn er stirbt

### `1.28.0` — Wake-Word im Hintergrund + Fire TV — *CODE*

- Wake-Word läuft bei Bildschirm aus und in anderen Apps (nur „Jarvis“)
- Gespräch endet, wenn Jarvis in den Hintergrund geht; Beenden in der Meldung oder unter Sprache
- Fire TV auf HDMI (Standard 3): Quelle am Samsung, Stick per ADB (Play/Pause/Home)

### `1.27.2` — Fahrmodus / Sprache — *CODE*

- „Nach Heilbronn“, „nach Heilbronn fahren“, „Fahr nach …“ startet Fahrmodus mit Route
- Karte zoomt auf die ganze Strecke; Ziel-Feld und **Hören** im Overlay
- Sprache: längere Pause, mehrere STT-Treffer, Füllwörter und Tippfehler (heilbron → Heilbronn)

### `1.27.1` — Anruf-Hotfix — *CODE*

- „Service/Jarvis ruf … an“ landet als Anruf, nicht im LLM
- Geklebte Wörter („dieWen“) werden getrennt
- Nummer und Alias: „Odett, Tel …“, „Odett 0171…“, „Meine Freundin heißt Odett“
- „Odett anrufen“ ist kein Todo mehr
- Ort und Telefonnummer zur selben Person überschreiben sich nicht

### `1.27.0` — Internes Spotify im Fahrmodus — *CODE*

- Fahrmodus startet den Spotify-Web-Player: Gerät **Jarvis**, volle Titel in der App (Premium)
- Ohne Premium oder ohne DRM: 30s-Vorschau, ehrlich gesagt
- Dock mit Cover, Play/Pause/Skip, Suche; Chat: `Spiel …`, `Pause`, `weiter`

### `1.26.0` — Fahrmodus, Spotify, Auge, TV-Lautstärke — *CODE*

- Foto liefert eine Chat-Antwort (JPEG, Timeout, ohne Gemini ehrlich)
- TV: `Lautstärke 50`, `lauter um 10` (Tasten, etwa 1–100)
- Fahrmodus-Overlay mit eigener Karte (OSM/OSRM, nicht Google Maps)
- Spotify intern im Fahrmodus: eigene Client-ID, PKCE-Login, Play/Pause/Skip
- Wake-Word-Kugel unten am Composer

### `1.25.0` — Einstellungen Vollbild — *CODE*

- Einstellungen öffnen über den ganzen Bildschirm, nicht mehr in der engen Sidebar
- Linke Leiste mit Hauptthemen (Allgemein, Modell, Cloud, Sprache, Wecker, Ort, Fernseher, Ton, Netz, Gedächtnis, Gefahr)
- Gedächtnis sitzt unter Einstellungen, Sidebar bleibt bei Chats
- Test-Chips eine Zeile, seitlich scrollbar

### `1.24.1` — Chat hängt nicht mehr an TV/Standort — *CODE*

- TV-Suchen/Koppeln/Tasten haben ein hartes Zeitlimit — Jarvis bleibt nicht auf „denkt…“ stehen
- Zuhause-Zaun fragt beim Start nicht mehr nach Standort, wenn das Recht fehlt
- Standort-Plugin bricht nach wenigen Sekunden ab

### `1.24.0` — Alltag 1.16–1.24 — *CODE*

Eine Sideload-Stufe, Inhalt aus [`19-next.md`](./19-next.md) und [`20-next.md`](./20-next.md):

- **Einkauf** als Liste, kein Ja/Nein: „Milch auf die Einkaufsliste“, „auch Brot“, „was fehlt?“, „Milch hab ich“. „Milch kaufen“ landet hier, nicht beim Todo-Confirm
- **Losgehen:** „Wann muss ich zum Zahnarzt los?“ — Ort am Termin im selben Satz (`Termin morgen 15 Uhr Zahnarzt Bahnhofstraße`), sonst nachfragen. Fahrzeit über Netz + GPS, Maps-Knopf. Ohne Fix: ehrlich
- **Zuhause:** „Wenn ich zuhause bin Müll raus“ — JS-Zaun beim App-Start oder „Ich bin zuhause“. Handy an; Gerät aus löst nicht aus
- **Tageslage:** „Guten Morgen“ / „Was steht an?“ eine Bubble
- **Auge:** „Lies das Foto“ nur mit Gemini; Bild geht zu Google. Sonst: „Dafür Gemini an.“
- **Nummer + Maps-Modus:** „Freundin, Tel …“, „Ruf die Freundin an“ (`tel:`), „Lauf zur Freundin“ / Bahn
- **Geburtstag** + **Wochenserie:** „Mama hat am 3. März Geburtstag“, „Jeden Dienstag Müll“, „was kommt diese Woche raus?“
- **Widget** zeigt nächsten Termin oder Einkauf; „das zweite“ nach einer Liste
- **Gespräch suchen** lokal: „Wann hatte ich das mit der Steuer?“

### `1.15.0` — Personen/Orte + Maps-Route — *CODE*

- „Freundin wohnt in Heilbronn“, „Jane — Praxis Bahnhofstraße“, „Ich wohne in …“
- „Fahr mich zur Freundin“ / „fahr mich nach Heilbronn“: Tipp öffnet die Route in Google Maps
- Ohne Ort: nachfragen, nicht raten. Antwort „Heilbronn“ merkt den Ort und liefert den Link
- „Fahr mich zu Personen“ listet gespeicherte Orte mit je einem Maps-Knopf

### `1.14.0` — Kontext + ein Gedächtnis — *CODE*

- Letzter Schritt für alle Tools: „lösch das“, „und um 16?“, „und morgen?“ (Wetter bleibt wie bisher)
- Zwei Befehle in einem Satz: „Wecker 7 und Timer 8 Minuten Nudeln“
- Memory-Block lokal und Gemini gleich; keinen anderen Vornamen erfinden
- Suche: Quellen oder „Netz hat nicht geantwortet“ — kein Rezept-Raten
- Chat-Titel folgt dem neuen Thema, bleibt nicht auf der ersten Zeile

### `1.13.2` — Timer-Ton — *CODE*

- Timer/Wecker spielen Ton über Alarm-Lautstärke, nicht nur Vibration
- Eigener Jarvis-Ton als Fallback, wenn der Systemwecker stumm ist

### `1.13.1` — Datum + Wecker-Titel — *CODE*

- „Termin 21.08. …“ landet am 21.8., nicht in einer Stunde
- „Wecker 7 Uhr“ sagt nicht mehr „Wecker Wecker“

### `1.13.0` — GUI fest, Chat scrollt — *CODE*

- Seite, Sidebar, Topbar und Composer sind fest — nur der Chat scrollt
- Aufwendige Animationen und Hover (Orbs, Magnet, Ripple); `prefers-reduced-motion` bleibt

### `1.12.0` — Wecker + eigener Ton — *CODE*

- „Wecker 7 Uhr“ einmal, „Wecker 7 Uhr jeden Tag“ / „jeden Montag“ mit Wiederholung
- Klingelt bei Bildschirm aus (gleicher Wecker-Pfad)
- Einstellungen: eigenen Alarmton wählen (System-Picker)

### `1.11.0` — Wake-Word — *CODE*

- Opt-in „Auf Jarvis hören“, sichtbare Leiste, Mikro an
- Bildschirm darf aus sein; Gerät komplett aus: nein

### `1.10.0` — Homescreen-Widget — *CODE*

- Nächster Timer/Erinnerung + letzte Wetterzeile
- Antippen öffnet die App

### `1.9.0` — Wetter-Nachfragen — *CODE*

- „und morgen?“, „und in Berlin?“, „und der Schirm?“

### `1.8.0` — Wiederkehrend — *CODE*

- „jeden Tag 8 Uhr Tabletten“, „jeden Montag 18 Uhr Steuer“
- Nach dem Klingeln neu gesetzt

### `1.7.0` — Timer + Klingeln — *CODE*

- „Timer 8 Minuten Nudeln“, Ton/Vibration, Vollbild bei Bildschirm aus
- Erinnerungen nutzen denselben Wecker

### `1.6.0` — Wetter als Lage — *CODE*

- Keine Zahlentabelle mehr: Ort, Gefühl, was als Nächstes, ein Tipp (Jacke, Schirm)
- „Wetter morgen“, Wochenende, „Brauch ich einen Schirm?“, „Was anziehen?“
- Quelle bleibt Open-Meteo unter der Antwort, nicht vorgelesen

### `1.5.3` — Sprache flüssig — *CODE*

- Text weiter sofort; vorlesen erst ganze Sätze, nicht 5-Wort-Schnipsel
- Nächster Satz wird schon erzeugt, während der aktuelle läuft (keine Lücken)
- Gemini-Stimme Kore, klare Betonung; System-TTS etwas zügiger

### `1.5.2` — Sprachmodus sofort — *CODE*

- Gemini streamt Tokens; der erste Satz wird gesprochen, während der Rest noch kommt
- Kürzere Antworten (max. ~2 Sätze), schnelleres Ende vom Zuhören
- TTS-Modell wird gemerkt, kein Dreifach-Versuch bei jedem Satz

### `1.5.1` — Stimme + schwarzer Screen — *CODE*

- Sprachmodus: Karte über dem Chat statt schwarzer Vollfläche (WebView blieb schwarz, Audio lief)
- Gemini-TTS (Charon, Deutsch), wenn Gemini an ist — nicht mehr die Pico-Roboterstimme
- Fallback: System-TTS, bevorzugt Google-Deutsch statt Pico
- Einstellungen: Auto / Gemini / System

### `1.5.0` — Sprachmodus — *CODE*

- Gespräch: sprechen → Jarvis antwortet mit Stimme → weiterreden. Kein Mitschnitt.
- Kurze Turns, antippen unterbricht. Nur Text bleibt im Chat.
- Homescreen-Shortcut „Jarvis hören“ (lange aufs Icon oder Einstellungen)
- Wake-Word bei ausgeschaltetem Handy: **nein**
- [`sprints/sprint-55.md`](./sprints/sprint-55.md)

### `1.4.0` — Kalender-GUI — *CODE*

- Eigene Monatsansicht, lokal, kein Google-Login
- Termin im Chat („Termin morgen 15 Uhr Zahnarzt“) und in der GUI
- Erinnerungen erscheinen als Punkte im Monat
- [`sprints/sprint-54.md`](./sprints/sprint-54.md)

### `1.3.0` — Ort & Wetter — *CODE*

- „Wetter heute“ / „Temperatur hier“: Standort einmal, dann Open-Meteo
- „Wetter in …“ ohne Standort; Quelle unter der Antwort
- Kein geratenes Wetter, wenn der Dienst fehlt
- [`sprints/sprint-53.md`](./sprints/sprint-53.md)

### `1.2.0` — Erinnerungen mit Zeit — *CODE*

- Chat: „in 20 Minuten Milch“, „morgen 8 Uhr Steuer“, „um 18:30 Ofen“
- Android-Notification zur Zeit (Hintergrund + nach Neustart)
- Liste/Löschen in den Einstellungen; „was steht an“ zeigt Erinnerungen und Todos
- [`sprints/sprint-52.md`](./sprints/sprint-52.md)

### `1.1.0` — Sound + Research-Quellen — *CODE*

- UI-Sounds: gemeinsamer AudioContext, entsperren nach Tipp; Testpiep beim Anschalten
- Quellen unter der Antwort, Links öffenbar; Audit speichert Suchen
- Reihe `1.2`–`1.5` geplant in [`17-next.md`](./17-next.md)

### Geplant — `1.2`–`1.5`

- `1.1` Sound + Research-Quellen · `1.2` Erinnerungen · `1.3` Ort/Wetter · `1.4` Kalender-GUI
- `1.5` Sprachmodus (Gespräch, Homescreen-Shortcut). Wake-Word bei ausgeschaltetem Handy: **nein**.

### `1.0.3` — Persona, Research, Notizen — *CODE*

- Jarvis beleidigt nicht mehr; keine erfundenen Internetsuchen
- Internet-Research (Opt-in) nutzt Google-Suche über Gemini; aus = ehrliche Absage
- „Notiz:“ speichert sofort; Memory-Ack ohne `name=Max`
- Chat-Avatar nutzt das Cover-Icon

### `1.0.2` — Test-Prompts zum Antippen — *CODE*

- Unter dem Chat: einzelne One-Click-Felder, jedes sendet einen Test-Prompt

### `1.0.1` — Cover & App-Icon — *CODE*

- Eigenes Jarvis-Cover (J-Monogramm, dunkel, grüne LED)
- Homescreen-Icon, rundes Icon, Splash statt Capacitor-Default
- APK weiter `Jarvis.apk`

### `1.0.0` — Jarvis 1.0 — *CODE*

- Sideload-APK heißt **`Jarvis.apk`**, Homescreen-Name Jarvis
- On-Device + optional Gemini-Kaskade + Groq-Fallback
- versionName `1.0.0` · versionCode `10000`

### `0.16.3` — Gemini-Kaskade + Groq-Fallback — *CODE*

- Bestes Free-Gemini zuerst; bei Limit/Überlastung sofort Flash-Lite, dann ältere Flash
- Optional Groq-Key: letzter Fallback mit hohem Free-Tier (kein dauerhaft keyloses LLM)
- Keine englische „high demand“-Meldung; überlastete Modelle kurz pausiert

### `0.16.2` — Gemini-Key einfügen — *CODE*

- API-Key-Feld: normale Tastatur, Einfügen möglich (kein Passwort-Feld)

### `0.16.1` — Lokalmodell nur auf Wunsch — *CODE*

- App-Start lädt die GGUF **nicht**, wenn Gemini an ist (auch nach Schließen/Öffnen)
- Lokales Modell nur über „Modell starten“, solange Gemini aus ist

### `0.16.0` — Gemini Opt-in — *CODE*

- Settings: Gemini (Google) Default aus; API-Key; Test
- Smalltalk über Gemini Flash, Memory/TV/Tools weiter lokal
- Banner: Chat geht ins Netz
- [`sprints/sprint-50.md`](./sprints/sprint-50.md) · [`16-gemini.md`](./16-gemini.md)

### `0.14.1` — TV verbinden & steuern — *CODE*

- Native Capacitor-Brücke: SSDP/Portscan, WOL, Tizen-WS 8001/8002, Token auf dem Gerät
- Settings: suchen, koppeln (Haken am TV), testen, Name/Host/MAC/Port, Kill-Switch
- Chat: „Fernseher an/aus“, lauter/leiser/stumm, HDMI; Follow-up nur nach TV-Turn
- Kein Fake-Erfolg ohne Plugin-Ergebnis; Gastnetz-Hinweis
- [`sprints/sprint-48.md`](./sprints/sprint-48.md)

### `0.14.0` — Qualität & Latenz — *CODE* (in `0.14.1`)

- Erstes Token: Warmstart, `cache_prompt`, kürzeres Sampling
- Memory/Tools/TV vor dem LLM; Alltagssprache; ehrliches Nichtwissen
- Kein „Ollama: online“; Status on-device; Siezen/Fake-Claims härter
- [`sprints/sprint-47.md`](./sprints/sprint-47.md) · [`14-quality-tv.md`](./14-quality-tv.md)

### `0.13.2` — Chat-Hang Hotfix — *CODE*

- Streaming statt Non-Stream: Tokens sichtbar, kein endloses „schreibt…“
- Mehr CPU-Threads, kleineres `n_ctx`, kürzeres Persona (0.5B auf dem Handy)
- Abbruch nach 45s ohne erstes Token; Status zeigt Wartezeit
- [`sprints/sprint-46.md`](./sprints/sprint-46.md)

### `0.13.1` — Modell-Download Hotfix — *CODE*

- First-Run lädt die GGUF direkt (OPFS/IndexedDB), nicht über wllama-OPFS-Metadaten
- App-Neustart startet das gespeicherte Modell, ohne erneut ~470 MB zu laden
- Chat: Qwen-Template, Timeout, kein endloses „schreibt…“
- CapacitorHttp umgeht WebView-CORS; lokales wllama-compat-WASM (kein jsDelivr)
- Fehlertext auf Deutsch im First-Run-Overlay
- [`sprints/sprint-45.md`](./sprints/sprint-45.md)

### `0.13.0` — Sprint 44 (On-Device) — *CODE*

- TypeScript-Engine + IndexedDB + wllama (Qwen2.5 0.5B Q4)
- First-Run: Modell-Download aufs Gerät
- Entfernt: Python-Backend, Ollama, NAS/Docker/Autostart
- TV geparkt
- [`sprints/sprint-44.md`](./sprints/sprint-44.md) · [`13-on-device.md`](./13-on-device.md)

### `0.12.0` — Sprint 43 (NAS-Proxy) — *SUPERSEDED*

### `0.11.2` — Sprint 42 (Samsung TV Settings-UI) — *CODE*

- Suchen, koppeln, testen, umbenennen
- [`sprints/sprint-42.md`](./sprints/sprint-42.md)

### `0.11.1` — Sprint 41 (Samsung TV Hotfix) — *PLANNED*

- WOL-Timing, False-Claims, Follow-up-Phrasen
- [`sprints/sprint-41.md`](./sprints/sprint-41.md)

### `0.11.0` — Sprint 40 (Samsung TV Core) — *PLANNED*

- Tizen lokal: Ein/Aus (WOL), Vol, Mute, HDMI; kein Confirm; ein Gerät
- [`sprints/sprint-40.md`](./sprints/sprint-40.md)

### `0.10.5` — Sprint 39 (APK Polish) — *PLANNED*

- First-Run, Icon, Sideload-README; Abschluss `0.10`
- [`sprints/sprint-39.md`](./sprints/sprint-39.md)

### `0.10.4` — Sprint 38 (APK Hotfix) — *PLANNED*

- Tastatur, Reconnect, ehrliche URL/401-Fehler
- [`sprints/sprint-38.md`](./sprints/sprint-38.md)

### `0.10.3` — Sprint 37 (APK Core) — *PLANNED*

- Capacitor-Android Sideload gegen NAS (URL + Token)
- [`sprints/sprint-37.md`](./sprints/sprint-37.md)

### `0.10.2` — Sprint 36 (NAS Auth & LAN) — *PLANNED*

- Owner-Token, 401 ohne Header, LAN-Default
- [`sprints/sprint-36.md`](./sprints/sprint-36.md)

### `0.10.1` — Sprint 35 (NAS Hotfix) — *PLANNED*

- Backup/Restore, Volume-Rechte, ehrliche Startfehler
- [`sprints/sprint-35.md`](./sprints/sprint-35.md)

### `0.10.0` — Sprint 34 (NAS Core) — *PLANNED*

- Docker Compose: backend + frontend + ollama, Autostart, Volumes
- [`sprints/sprint-34.md`](./sprints/sprint-34.md) · [`12-nas-apk.md`](./12-nas-apk.md)

### `0.9.5` — Sprint 33 (Tools Hygiene & Confirm-UX) — *PLANNED*

- Listen-Scope, UI Ja/Nein-Confirm, Aufräumen
- [`sprints/sprint-33.md`](./sprints/sprint-33.md)

### `0.9.4` — Sprint 32 (Assist Continuity & Siezen) — *PLANNED*

- Clarify→Plan hart; Residual-Siezen; EN-Leak Guard
- [`sprints/sprint-32.md`](./sprints/sprint-32.md)

### `0.9.3` — Sprint 31 (Memory Quality Hotfix) — *PLANNED*

- Multi-Fact Write; Pref-Recall-Routing; Honesty statt Halluzination
- [`sprints/sprint-31.md`](./sprints/sprint-31.md)

### `0.9.2` — Sprint 30 (Tools Polish & Continuity) — *READY FOR REVIEW*

- Multi-Turn: Liste → „Erledige das erste / Nr. 2“ ohne neue Confirm
- Listen-UX: offen/erledigt/alle + Todos-Suche; nummerierte Replies
- Scorecard `scripts/scorecard_0_9_2.py`; UI Tool-Status-Chips; Eval `eval_0_9_2`
- Version `0.9.2` · [`sprints/sprint-30.md`](./sprints/sprint-30.md)

### `0.9.1` — Sprint 29 (Tools Hotfix) — *READY FOR REVIEW*

- False-Confirm-Guard; Inject blockt Tool-Pending; Pending-Timeout; Todo-Dedup
- Kurz-Acks (`SAFE_ACK`); Platzhalter-Scrub; Imperativ-Duzen; klarere Tool-Fehler
- Eval `scripts/eval_0_9_1.py`, Deep `scripts/deep_0_9_1.py`, Version `0.9.1`
- [`sprints/sprint-29.md`](./sprints/sprint-29.md)

### `0.9.0` — Sprint 28 (Local Tools Core) — *READY FOR REVIEW* (liefert auch 0.8.5)

- Tool-Runtime: Allowlist, Confirm-before-Write, Audit
- Tools `notes` + `todo` (lokal SQLite); Router-Intent `tool`; `/hilfe` aktualisiert
- Eval `scripts/eval_0_9_0.py`, Deep `scripts/deep_0_9_0.py`, Version `0.9.0`
- [`sprints/sprint-28.md`](./sprints/sprint-28.md)

### `0.8.5` — Sprint 27 (Persona & Continuity Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.9.0`)

- Master/Sir-Scrub; Residual-Duzen v3; Clarify→Plan Continuity; Eval-Pins
- Eval `scripts/eval_0_8_5.py`
- [`sprints/sprint-27.md`](./sprints/sprint-27.md)

### `0.8.4` — Sprint 26 (Siezen & Recall Hotfix) — *READY FOR REVIEW*

- Broken-Siezen Heuristik + `soften_duzen` Verb-Nachzug; Identitäts-Recall ein Name; CJK-Task ≠ Smalltalk-Canned
- Recall-Ack wenn Soften scheitert; Kumpel-Scrub; Eval-Pins `0.8.x`
- Eval `scripts/eval_0_8_4.py`, Deep `scripts/deep_0_8_4.py`, Version `0.8.4`
- Deep-Test durch — Restpunkte → Sprint 27 / `0.8.5`; Tools → `0.9.0`
- [`sprints/sprint-26.md`](./sprints/sprint-26.md)

### `0.8.3` — Sprint 25 (Assist Ops & Carry-over) — *READY FOR REVIEW* (liefert auch 0.8.1 + 0.8.2)

- Scorecard Assist; Mood/Delight-Caps in DB; Audit-Link in Quellen-UI; Latency-Hinweis Settings
- Eval `scripts/eval_0_8_3.py`, Scorecard `scripts/scorecard_0_8_3.py`, Version `0.8.3`
- Deep-Test durch — Restpunkte → Sprint 26 / `0.8.4`

### `0.8.2` — Sprint 24 (Edge & Reply Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.3`)

- Capabilities-Kurzformen; Begrüßungs-Canned; Forget-/Soft-Reject-Acks; Residual-Duzen-Retry
- Eval `scripts/eval_0_8_2.py`

### `0.8.1` — Sprint 23 (Assist Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.8.3`)

- `normalize_value` Wortgrenzen; Soft-Confirm Value-Gate; `soften_duzen` entschärfen; Garbage-Soft-Memory
- Eval `scripts/eval_0_8_1.py`

### `0.8.0` — Sprint 22 (Assist Clarity) — *READY FOR REVIEW* (liefert auch 0.7.2 + 0.7.3)

- Clarify-First bei vagen Tasks; `/hilfe` Fähigkeiten-Karte; Streaming-Status „Jarvis schreibt…“
- Research-UI-Echo (`status_label` / Query); Memory Soft-Confirm nach Soft-Harvest
- Eval `scripts/eval_0_8_0.py`, Version `0.8.0`
- Deep-Test durch — offene Punkte → Sprints 23–25

### `0.7.3` — Sprint 21 (Delight & Session Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.0`)

- Mood pro Conversation; Eggs-off deterministisch; Research-Fehler-UX; Soft-Latenz Smalltalk
- Eval `scripts/eval_0_7_3.py`

### `0.7.2` — Sprint 20 (Reply Quality Polish) — *READY FOR REVIEW* (mitgeliefert in `0.8.0`)

- SAFE_SMALLTALK drosseln / Duzen weicher; Memory-Recall ohne Helpdesk-Canned; CJK→Task-Fallback
- Capabilities-Fakt; Soft-Inject-Härte
- Eval `scripts/eval_0_7_2.py`

### `0.7.1` — Sprint 19 (Quality Hotfix) — *READY FOR REVIEW*

- Settings-Clamp (`research_timeout_sec` u. a.); Guard-Entschärfung; Task-Listen bleiben Inhalt
- Settings-Fakten (Modell/Version/Research); Research Junk-Refuse + Negation
- Inject-Härte (Pirate/System-Prompt); Anti-Identitäts-Halluzination
- Eval `scripts/eval_0_7_1.py`, Version `0.7.1`

### `0.7.0` — Sprint 18 (Delight + Settings) — *READY FOR REVIEW*

- Flaches Settings-Panel (Allgemein, Modell, Delight, Sound, Easter Eggs, Forschung, Danger)
- Jarvis-Momente (Cap/Tag), Inside Jokes (Toggle/Frequenz, Kategorie `joke`)
- UI-Sounds (Default aus), Easter-Egg-Commands gelistet (`/protokoll`, `/mission`, …)
- Eval `scripts/eval_0_7_0.py`, Version `0.7.0` (inkl. 0.6.1/0.6.2)

### `0.6.2` — Sprint 17 (Research Polish) — *READY FOR REVIEW* (mitgeliefert in `0.7.0`)

- Research-Persona-Synthese; Dual-Provider-Interleave; DDG-Thin-Filter
- Scorecard `scripts/scorecard_0_6_2.py`; Eval `scripts/eval_0_6_2.py`

### `0.6.1` — Sprint 16 (Research Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.7.0`)

- Query-PII-Sanitizer; Noise-Strip; Topic-Extraktion; Settings-Default-Hygiene
- Eval `scripts/eval_0_6_1.py`

### `0.6.0` — Sprint 15 (Internet-Research) — *READY FOR REVIEW*

- Opt-in Toggle (`research_opt_in`, Settings API + UI), Default aus
- Retrieval: Wikipedia + DuckDuckGo Allowlist; Mock-Provider für Eval
- Citation-Synthese / No-source-Refuse; Quellen-Badge + Audit-Log
- Eval `scripts/eval_0_6_0.py`, Version `0.6.0`

### `0.5.2` — Sprint 14 (Router Polish) — *READY FOR REVIEW*

- Router-Patterns (`mach mir einen Plan`, Capability-Bait); Extra-Gold ≥5
- Health: `heavy_equals_default` + Warning bei Heavy=Default
- Live-Scorecard `scripts/scorecard_0_5_2.py` (Inject-EN, Task-FP, Recall, Weak-Write)
- Persona: EN-Leak-Retry, Clarify-Emoji-Strip, Recall ohne Helpdesk-Tail
- Eval `scripts/eval_0_5_2.py`, Version `0.5.2` (inkl. Sprint-13-Hotfix)

### `0.5.1` — Sprint 13 (Router Hotfix) — *READY FOR REVIEW* (mitgeliefert in `0.5.2`)

- Inject/Task entkoppelt; Inject → `SAFE_INJECT` (kein EN-Helpdesk)
- Weak-Write Guardrail; Non-Memory-Fallbacks ohne Aussetzer
- Eval `scripts/eval_0_5_1.py` (akzeptiert Health `0.5.1`/`0.5.2`)

### `0.5.0` — Sprint 12 (Intent-Router + Scores)

- Intent-Router v1 inkl. Memory-Subklassen write/recall/forget/clarify
- Policy-Map, Model-Routing (`routing_mode`), Research ohne Opt-in blockiert
- Scorecard + Baseline-Gate (`scripts/scorecard_0_5_0.py`)
- Eval `scripts/eval_0_5_0.py`, Version `0.5.0`

### `0.4.3` — Sprint 11 (Memory Hotfix)

- Clause-Split: Beruf/Fakt-Values enden vor `und`/`oder`
- Recall-Op bei Token-Hit: Nudge + Fakt-Fallback statt Aussetzer
- Pref ohne Pflicht-„mein“ (`Speichere: Lieblingsfarbe ist Grün`)
- Shared `parse_lieblings_pref`; Eval `scripts/eval_0_4_3.py`, Version `0.4.3`

### `0.4.2` — Sprint 10 (Memory Polish)

- Multi-Fakt-Split, Value-Normalisierung, Widerspruch „nicht X, sondern Y“
- Soft-Harvest mit niedriger Confidence + TTL (`expires_at`)
- Retrieve ohne Ambient-Leak; `max_context_messages` als Cap
- Summary nach Assistant-Write + DE-only Guard
- UI: Kategorie-Filter + „unsicher“-Badge
- Eval `scripts/eval_0_4_2.py`, Version `0.4.2`

### `0.4.1` — Sprint 9 (Memory Must-Fixes)

- False-Confirm: natürliche Merk-Phrasen speichern; sonst klare Ablehnung
- Memory-Turns: kein Helpdesk-/Aussetzer-Fallback (`SAFE_MEMORY_ACK`)
- „Vergiss alles“ = Full Wipe
- Eval `scripts/eval_0_4_1.py`, Version `0.4.1`

### `0.4.0` — Sprint 8 (Gedächtnis & Kontext)

- Langzeitgedächtnis v1 (`memory_items`, merk/vergiss, soft Lieblings-Harvest)
- Gesprächszusammenfassung + Kontextpack (persona + memory + summary + last_k)
- APIs `GET/POST/DELETE /api/memory`, Health `memory_count`
- UI „Was Jarvis über mich weiß“
- Eval `scripts/eval_0_4_0.py`

### `0.3.1` — Sprint 7 (GUI Polish)

- Ambient-Gradient, Composer-Focus, Mobile-Backdrop, Chat-Wechsel, Stream-Caret, Empty-State

### `0.3.0` — Sprint 6 (GUI Premium-Motion)

- Message-Enter, Streaming-Caret, Composer-Focus, Sidebar/Drawer
- `prefers-reduced-motion`, Ambient-Gradient, Typografie Outfit/Manrope

## Planned

| Version | Sprint | Inhalt |
|---------|--------|--------|
| `0.10.0`–`0.10.5` | 34–39 | NAS-Compose — **Parking** (Docker geht nicht) |
| `0.11.0`–`0.11.2` | 40–42 | Samsung-TV lokal |
| `0.12.0` | 43 | NAS native + Reverse-Proxy :8080 + Sideload-APK |
| `1.0.0` | PO | nächster MAJOR (nicht NAS) |

## Earlier (pending tags)

- `0.2.2` Charakter-Fixes · `0.2.1` Guard Hardening · `0.2.0` Streaming/Guards
- `0.1.1` Must-Fixes · `0.1.0` MVP Local Smalltalk

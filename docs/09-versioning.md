# 09 — Versionierung

> **Jetzt:** Code **`10.60.0`**. Sideload **`9.10.0`**. `6.50` = Gemini Hauptweg. Stabilität V1–V9 **CODE**. Screenshot-Fixes `9.9.2` **CODE**. Rest final [`54-next.md`](./54-next.md) **CODE**. Alltag [`50-next.md`](./50-next.md) `8.0` **CODE**. Gerät-PO [`55-next.md`](./55-next.md). Semantisches Gedächtnis [`56-next.md`](./56-next.md) **CODE** `10.0`.

Projektübergreifende Versionslogik für Code, Docs, Sprints und Releases.

## Prinzip

Jede sinnvolle Lieferstufe hat eine **Version**.  
Die Version beschreibt **was nach dem Sprint / der Etappe erreicht sein soll** — nicht „wie viele Tage vergangen sind“.

## Schema (SemVer-artig)

```text
MAJOR.MINOR.PATCH
```

| Teil | Wann erhöhen | Bedeutung |
|------|----------------|-----------|
| **MAJOR** | Grober Produktsprung / Meilenstein | z.B. `1.0.0` = nächster Sprung nach `0.11` (PO) |
| **MINOR** | Geplantes Sprint-/Etappenziel erreicht | Neues nutzbares Fähigkeitsniveau |
| **PATCH** | Nachzieher / Fixes / kleine Ergänzungen **nach** einem MINOR-Ziel | Zwischenversionen: `0.1.1`, `0.1.2`, … |

### Festgelegte Meilensteine

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `0.1.0` | **MVP** Local Smalltalk | Sprint 1 |
| `0.1.1` | **Must-Fixes** nach MVP-Test (Persona, Injection, Modell, Sampling, Smoke) | Sprint 2 |
| `0.2.0` | **Verbesserungen** (Streaming, UI-Fehler, Eval, Löschen, härtere Guards) | Sprint 3 |
| `0.2.1` | **Must-Fixes** nach `0.2.0`-Deep-Test (Listen/Roleplay, Duzen v2, Whole-Reply-Inject, Sticky v2, Eval) | Sprint 4 |
| `0.2.2` | **Charakter-Fixes** nach `0.2.1`-Deep-Test (Boilerplate hard-refuse, Kaputt-Pfad jarvis-treu) | Sprint 5 |
| `0.3.0` | **GUI Update** Premium-Motion (Spotify-Dunkel + ChatGPT-Layout, smoother UX) | Sprint 6 |
| `0.3.1` | **GUI Polish** nach `0.3.0`-Test (Gradient/Focus/Backdrop, ruhiger Chat-Wechsel) | Sprint 7 |
| `0.4.0` | **Gedächtnis & Kontext** (Langzeitgedächtnis v1, Summary, Kompression) | Sprint 8 |
| `0.4.1` | **Memory Must-Fixes** (False-Confirm, Guard/Aussetzer, Vergiss-alles) | Sprint 9 |
| `0.4.2` | **Memory Polish** (Parser/Split/TTL/UI-Filter, Widerspruch-Heuristik) | Sprint 10 |
| `0.4.3` | **Memory Hotfix** (Clause-Split, Recall-Stabilität, Pref ohne „mein“) | Sprint 11 |
| `0.5.0` | **Intelligence Core** (Router: merk/recall/forget + clarify; Routing; Scores) | Sprint 12 |
| `0.5.1` | **Router Hotfix** (Inject/Task, Weak-Write, Non-Memory-Fallbacks) | Sprint 13 |
| `0.5.2` | **Router Polish** (Patterns, Live-Scorecard, Routing-Ehrlichkeit) | Sprint 14 |
| `0.6.0` | **Internet-Research** opt-in, citation-required | Sprint 15 |
| `0.6.1` | **Research Hotfix** (Query-PII/Noise, Topic-Extraktion, Settings-Hygiene) | Sprint 16 |
| `0.6.2` | **Research Polish** (Persona, Dual-Provider/DDG, Scorecard) | Sprint 17 |
| `0.7.0` | **Delight + Settings** (Momente, Jokes, Sound, Eggs, flaches Settings) | Sprint 18 |
| `0.7.1` | **Quality Hotfix** (Guards, Settings-Clamp, Research-Junk, Inject, Identität) | Sprint 19 |
| `0.7.2` | **Reply Quality Polish** (weniger Canned, Recall, CJK, Multi-Turn, Capabilities) | Sprint 20 |
| `0.7.3` | **Delight & Session Polish** (Mood-Scope, Eggs-off, Research-UX, Latenz) | Sprint 21 |
| `0.8.0` | **Assist Clarity** (Clarify-First, `/hilfe`, Streaming-UX, Research/Memory-Feedback) | Sprint 22 |
| `0.8.1` | **Assist Hotfix** (normalize_value, soften_duzen, Soft-Confirm Value-Gate) | Sprint 23 |
| `0.8.2` | **Edge & Reply Polish** (Capabilities-Varianten, Canned, Forget/Soft-Reject, Residual-Duzen) | Sprint 24 |
| `0.8.3` | **Assist Ops Polish** (Scorecard, Delight-Persist, Audit-UI, Latency-Hinweis) | Sprint 25 |
| `0.8.4` | **Siezen & Recall Hotfix** (Broken-Siezen, Identity-Recall, CJK-Task) | Sprint 26 |
| `0.8.5` | **Persona & Continuity Hotfix** (Master-Scrub, Rest-Duzen, Clarify-Follow-up) | Sprint 27 |
| `0.9.0` | **Local Tools Core** (Runtime, Notes, Todos, Confirm) | Sprint 28 |
| `0.9.1` | **Tools Hotfix** (False-Confirm, Memory↔Tool, Inject) | Sprint 29 |
| `0.9.2` | **Tools Polish** (Continuity, Listen-UX, Scorecard) | Sprint 30 |
| `0.9.3` | **Memory Quality Hotfix** (Multi-Fact, Pref-Recall) | Sprint 31 |
| `0.9.4` | **Assist Continuity & Siezen** (Clarify-Plan, Residual-Siezen, EN) | Sprint 32 |
| `0.9.5` | **Tools Hygiene & Confirm-UX** (Scope, UI-Confirm, Aufräumen) | Sprint 33 |
| `0.10.0` | **NAS Core** (Compose, Volumes, Autostart) | Sprint 34 |
| `0.10.1` | **NAS Hotfix** (Backup, Rechte, Startfehler) | Sprint 35 |
| `0.10.2` | **NAS Auth & LAN** (Owner-Token) | Sprint 36 |
| `0.10.3` | **APK Core** (Capacitor Sideload) | Sprint 37 |
| `0.10.4` | **APK Hotfix** (Tastatur, Reconnect, Fehler) | Sprint 38 |
| `0.10.5` | **APK Polish** (First-Run, Icon) — `0.10` zu | Sprint 39 |
| `0.11.0` | **Samsung TV Core** (Tizen lokal, WOL, Vol, HDMI) | Sprint 40 |
| `0.11.1` | **Samsung TV Hotfix** | Sprint 41 |
| `0.11.2` | **Samsung TV Settings-UI** (suchen/koppeln/testen) | Sprint 42 |
| `0.12.0` | **NAS-Proxy & APK** — **superseded** durch On-Device | Sprint 43 |
| `0.13.0` | **On-Device Handy** (WASM-LLM, kein Server) | Sprint 44 |
| `0.13.1` | **Modell-Download Hotfix** (Cache API, kein OPFS-„file not found“) | Sprint 45 |
| `0.13.2` | **Chat-Hang Hotfix** (Streaming, Threads, Timeout) | Sprint 46 |
| `0.14.0` | **Qualität & Latenz** — bestehendes härten, nichts Neues | Sprint 47 |
| `0.14.1` | **TV verbinden & steuern** — Tizen on-device (ex-`0.11`) | Sprint 48 |
| `0.16.0` | **Gemini Opt-in** — Google-API, Default aus (historisch; ab `6.50` Hauptweg) | Sprint 50 |
| `1.0.0` | **Jarvis 1.0** — On-Device, TV, Gemini-Kaskade, APK `Jarvis.apk` | nach `0.16` |
| `2.0.0` | **Jarvis 2.0** — ein Kontext, ehrliche Tools, internes CarPlay | Sprint 102 |
| `3.0.0` | **Jarvis 3.0** — Intelligenz: Register + Score-Policy; Welt `3.1`–`3.17` mitgeliefert | Sprint 106 |
| `3.18.0` | **Lage + Härten** — Tablet-HUD, Traceroute, Digest; Stufen `3.0.1`–`3.45` mitgeliefert | Sprint 107 |
| `3.18.1` | **GUI Premium** — Overlay-Slides, Lage-Kacheln, Thread-Wechsel | Sprint 108 |
| `3.19.0` | **Stimme + Kalender + Debug** — ein Thread, Jahr/Fenster, Settings-Debug | Sprint 109 |
| `4.0.0` | **Weltlage / Vorhersage** — Research zuerst, dann Ausblick; nicht ein zweites `3.20` | Sprint 110 |
| `4.19.0` | **Alltagskette Stimme** — Sprachnachricht, Bar, Taxi; Research vor WhatsApp/Taxi-App | Sprint 111 |
| `4.33.0` | **Gespräch / Film-Stimme / Steuer** — Reel lukebuildsai anpassen | Sprint 112 |
| `4.46.0` | **Hausstand** — Export/Import nach APK-Deinstall; Autokorrektur Schreib+Sprache | Sprint 113 |
| `4.53.0` | **Zwei Gesichter + Tablet** — Jarvis/Friday Stimme; Lage nicht statt Chat | Sprint 114 |
| `4.66.0` | **Körper intern** — Hirn/Auge/Hand in der Lage; APK, PC nur PC-Organe | Sprint 115 |
| `4.76.0` | **Lokales Sehen** — LocateAnything am PC (GUI-Grounding), nicht `4.66` Körper | Sprint 116 |
| `5.0.0` | **Weltkugel** — Lage-Sicht Erde; Nummern `5.0`–`5.10` | Sprint 119 |
| `5.11.0` | **Debug-Lauf** — Mehrfach-Kategorien, neues Gespräch, Export mit Verdict | Sprint 120 |
| `6.0.0` | **Bühne & Hirn Leitentscheidung** | Sprint 121 |
| `6.10.0` | **Motion-Kern + Chat-Gewand** | Sprint 122 |
| `6.20.0` | **Körper-Show + virtueller Globus** | Sprint 123 |
| `6.30.0` | **Fahrmodus-Bühne** | Sprint 124 |
| `6.40.0` | **Sprach-Theater + Stimmen-Picker** | Sprint 125 |
| `6.50.0` | **Hirn Gemini zuerst** + Bühne 122–125 mitgeliefert | Sprint 126 |
| `6.51.0` | **Parser nach Prompt-Test** — Wont/Help/HUD-Skip | Sprint 127 |
| `6.52.0` | **Live-Split + Identität** — mitgeliefert in `6.60` | Sprint 128 |
| `6.53.0` | **Overlay Gemini zuerst** — mitgeliefert in `6.60` | Sprint 129 |
| `6.60.0` | **Sideload** Bühne + Parser + Split | Sprint 130 |
| `6.70.0` | **Globus-Briefing** Leitentscheidung (Docs) | Sprint 131 |
| `6.90.0` | **Globus-Briefing Gold** — Stadt-Satellit + Welt-Tour | Sprint 136 |
| `6.91.0` | **Stabilität Kern** — Debug-Session, Turn-Gate, Screenshot-Parser | Sprint 142 |
| `6.92.0` | **Overlay-FSM & Weltlage** — mitgeliefert in `6.93` | Sprint 143 |
| `6.93.0` | **V1 Abschluss** — Gemini-Abbruch, `ja bitte`, Tweets, Siezen | Sprint 144 |
| `6.94.0` | **TTS Gemini-Primary** — mitgeliefert in `6.96` | Sprint 145 |
| `6.95.0` | **App-Action-Registry** — mitgeliefert in `6.96` | Sprint 146 |
| `6.96.0` | **V2 Abschluss** — Banner, Chips, Wake-Debounce | Sprint 147 |
| `6.97.0` | **Action-FSM** — mitgeliefert in `6.99` | Sprint 148 |
| `6.98.0` | **Navi Replace verifiziert** — mitgeliefert in `6.99` | Sprint 149 |
| `6.99.0` | **V3 Abschluss** — Research-Pending hart | Sprint 150 |
| `9.0.0` | **V4 Dokumente** — Attachments, Parser, OCR, Verify Upload | Sprint 151–153 |
| `9.1.0` | **V6 TV** — Device-Registry, Verify Launch | Sprint 154–156 |
| `9.2.0` | **V7 PC Beta** — Capability-Levels, Confirm, Verify | Sprint 157–159 |
| `9.3.0` | **V8 Live-Stream** — WebRTC-Signaling, LAN-JPEG, Verify Peer | Sprint 160–162 |
| `9.9.0` | **V9 Hardening** — Regression, LAN-only PC, Secret-Redact | Sprint 163–165 |
| `9.9.1` | **Handy-Lage chat-first** | Beta-Polish |
| `9.9.2` | **Screenshot-Bugs** — Kugel, Greeting, News, TV, Stimme | Sprint 166–168 |
| `9.9.3` | **Geräte-Findings** — nur wenn 168 rot | nach 168 |
| `9.10.0` | **Rest final** — Debug-FGS, Sehen-Freeze, Could-Schalter | Sprint 169–177 |
| `9.10.1` | Silero + Smart Turn ONNX | Sprint 174 Freeze |
| `9.10.2` | Piper offline | Sprint 175 Freeze |
| `9.10.3` | Kokoro + e5 Spike | Sprint 176 Freeze |
| `10.0.0` | **Semantisches Gedächtnis Leit** — Schema vor Encoder | Sprint 187 CODE |
| `7.0.0` | **V5 Hierarchical Memory** — Quelle, Confidence, Bereinigung | Sprint 137–140 |
| `8.0.0` | **Alltag vom Zettel** — Blitzer, Steuer-Stimme, Settings-IA, Musik-Fallback, Chat-Ordner, Preiswache | Sprint 141 |
| `1.1.0` | Sound + Research-Quellen | Sprint 51 |
| `1.2.0` | Erinnerungen mit Zeit | Sprint 52 |
| `1.3.0` | Ort & Wetter | Sprint 53 |
| `1.4.0` | Kalender-GUI (lokal) | Sprint 54 |
| `1.5.0` | Sprachmodus + Homescreen-Shortcut | Sprint 55 |
| `1.6.0` | Wetter als Lage + Tipp | Sprint 56 |
| `1.7.0` | Timer + Klingeln (Screen aus) | Sprint 57 |
| `1.8.0` | Wiederkehrende Erinnerungen | Sprint 58 |
| `1.9.0` | Wetter-Nachfragen | Sprint 59 |
| `1.10.0` | Homescreen-Widget | Sprint 60 |
| `1.11.0` | Wake-Word (Handy an) | Sprint 61 |
| `1.12.0` | Wecker + eigener Ton | Sprint 62 |
| `1.13.0` | GUI fest, Chat scrollt, Motion | Sprint 63 |
| `1.13.1` | Kalender-Datum + Wecker-Titel | Sprint 64 |
| `1.13.2` | Timer-Ton (nicht nur Vibration) | Sprint 65 |
| `1.14.0` | Kontext überall + Gedächtnis gleich | Sprint 66 |
| `1.15.0` | Personen/Orte + Google-Maps-Route | Sprint 67 |
| `1.16.0`–`1.23.0` | Einkauf … Widget (geplant gestuft) | Sprints 68–75, **mitgeliefert in `1.24.0`** |
| `1.24.0` | Alltag 1.16–1.24 inkl. Gespräch suchen | Sprint 76 |
| `1.24.1` | Chat-Hang TV/Standort | Sprint 76 Patch |
| `1.25.0` | Einstellungen Vollbild + Themen-Leiste | Sprint 77 |
| `1.26.0` | Fahrmodus, Spotify, Auge, TV-Lautstärke | Sprint 78 |
| `1.27.0` | Internes Spotify im Fahrmodus | Sprint 79 |
| `1.27.1` | Anruf-Hotfix (Service-Prefix, Nummer) | Sprint 79 Patch |
| `1.27.2` | Fahrmodus „Nach Heilbronn“ + Sprache | Sprint 79 Patch |
| `1.28.0` | Wake-Word Hintergrund + Fire TV HDMI | Sprint 80 |
| `1.28.1` | Wake-Word öffnet Sprachmodus | Sprint 80 Patch |
| `1.28.2` | Fire-TV-Test sichtbar, Gen-2-Hinweis | Sprint 80 Patch |
| `1.28.3` | Wecker klingelt (Dienst + Alarm-Lautstärke) | Sprint 80 Patch |
| `1.29.0` | Suche, Fire TV in der APK, GUI-Icons, Widget 2×4, Ventilator | Sprint 81 |
| `1.30.0` | CarPlay flüssig: HUD, Voice-Tabs, Navi-Ansagen | Sprint 82 |
| `1.31.0` | Stimme Charon + Latenz; Jarvis-Smalltalk | Sprint 83 |
| `1.32.0` | Samsung-Apps YouTube/Amazon/Disney/Netflix | Sprint 84 |
| `1.32.1` | Sprachmodus Tempo (kein Hänger, sofort Ton) | Sprint 85 |
| `1.33.0` | Suche & Antworten (Preise, keine Absage, CarPlay öffnen) | Sprint 86 |
| `1.33.1` | Fernseher: YouTube-Video vs Film, Follow-up `… ab` | Sprint 86 Patch |
| `1.33.2` | Widget öffnet Sprachmodus (hören + antworten) | Sprint 86 Patch |
| `1.33.3` | Wecker klingelt wieder (nicht nur Anzeige) | Sprint 86 Patch |
| `1.34.0` | Bessere Antworten (History, Memory, Persona, Groq) | Sprint 87 |
| `1.35.0` | CarPlay besser (Replan, Cue, HUD, Zoom, Ankunft) | Sprint 88 |
| `1.36.0` | Alltag-Phrasen (bestehende Tools, Smalltalk-Schutz) | Sprint 89 |
| `1.37.0` | Flüssig (Chat, Overlay, Wake-Word, Voice, TV, Widget) | Sprint 90 |
| `1.38.0` | Gedächtnis im Dialog (Recall, Widerspruch, Anapher) | Sprint 91 |
| `1.39.0` | Stimme bleiben (NO_MATCH, Barge-in, Navi vs Jarvis) | Sprint 92 |
| `1.40.0` | Härten (Eval, False-Positives, keine Fake-Erfolge) | Sprint 93 |
| `1.40.1` | Sätze zu Ende; TV-Tasten/Ordinal, YouTube-Suche, kein Live-Bild | Sprint 93 Patch |
| `1.40.2` | Timer spricht ohne Klingeln; natürliche Timer-Sätze | Sprint 93 Patch |
| `1.40.3` | Chat/Stimme näher am Film-Jarvis (Understatement) | Sprint 93 Patch |
| `1.41.0` | Tanke: nächste + günstigste, immer E10, Preise | Sprint 94 |
| `1.42.0` | Wo bin ich: GPS + Freigabe anstoßen | Sprint 95 |
| `1.43.0` | CarPlay ehrlich: Overlay, Restweg, POI, Anruf/SMS | Sprint 96 |
| `1.44.0` | Filme: IMDb/RT über OMDb, wo gratis; Rabatt-Suche | Sprint 97 |
| `1.45.0` | Öffnungszeiten für Läden aus OSM | Sprint 98 |
| `1.46.0` | Anruf/SMS direkt, erst nach Nachfrage | Sprint 99 |
| `1.47.0` | PC live: Bildschirm, Maus, FIFA, Ordner | Sprint 100 |
| `1.47.1` | Ein-Klick-Kopieren IP/Token/Prompts | Sprint 100 Patch |
| `1.48.0` | Luft/Sonne auf Nachfrage, Bahn, Tagesschau, Feiertage | Sprint 101 |
| `1.48.1` | Satzbildung näher am Film-Jarvis | Sprint 101 Patch |
| `1.48.2` | Live-Test-Bugs: Parser, Overlay, Straße | Sprint 101 Patch |
| `1.48.3` | Fahrmodus: Karte und Route | Sprint 101 Patch |
| `1.48.4` | Fahrmodus-Karte: vollflächig, Norden oben | Sprint 101 Patch |
| `1.48.5` | Karte schieben/zoomen, Sprache im Fahrmodus | Sprint 101 Patch |
| `1.48.6` | Overlay=Karte, Cafés am GPS, echte Route | Sprint 101 Patch |
| `1.48.7` | Research: Zahlen nur aus Treffern | Sprint 101 Patch |
| `1.48.8` | CarPlay-Route auf Straßen, Cafés am GPS | Sprint 101 Patch |
| `2.0.0` | Haus-AI: letztes Medium, ehrliches Wetter, interne Navi | Sprint 102 MAJOR |
| `2.0.1` | Latenz, Ingersheim DE, Kurven/Kreisverkehr, Follow-ups | Sprint 102 Patch |
| `2.1.0` | WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN) | Sprint 103 |
| `2.1.1` | Steckdose: Hausnetz-IP, nicht öffentliche 89.… | Sprint 103 Patch |
| `2.2.0` | Uhrzeit vom Gerät, GPS statt Raten, Auto-Research | Sprint 104 |
| `2.2.1` | Testprompts: Kopierfelder unter Einstellungen → Tests | Sprint 104 Patch |
| `2.2.2` | Testprompts wieder raus aus der APK | Sprint 104 Patch |
| `3.0.0` | Intelligenz: Register + Score-Policy; Welt `3.1`–`3.17` mitgeliefert | Sprint 106 |
| `3.18.0` | Lage, Traceroute, Digest, Routing härten (`3.0.1`–`3.45`) | Sprint 107 |
| `3.18.1` | GUI: Overlay-Slides, Lage-Kacheln, Thread-Wechsel | Sprint 108 |
| `3.19.0` | Sprachmodus ein Thread, Kalender Jahr/nächste Tage, Debug | Sprint 109 |
| `4.0.0` | Weltlage / Vorhersage: `outlook`, Serie, Szenario, kein Orakel (`4.1`–`4.17`) | Sprint 110 |
| `4.19.0` | Alltagskette: Bar, Sprachnachricht=SMS, Taxi nach Ja, Kette | Sprint 111 |
| `4.33.0` | Film-TTS Algieba, HUD/Notify am Steuer, Watchdog | Sprint 112 |
| `4.46.0` | Hausstand-Export/Import, Autokorrektur Schreib+Sprache | Sprint 113 |
| `4.53.0` | Jarvis/Friday-Gesichter, Lage neben dem Chat | Sprint 114 |
| `4.66.0` | Körper intern in der Lage (gebündelt in `5.11.0`) | Sprint 115 |
| `4.76.0` | LocateAnything-Parser, Vision ehrlich aus (in `5.11.0`) | Sprint 116 |
| `5.0.0` | Weltkugel in der Lage (gebündelt in `5.11.0`) | Sprint 119 |
| `5.11.0` | Debug-Lauf + Körper + Kugel + Sehen-Parser | Sprint 120 |
| `6.0.0` | Bühne & Hirn Leitentscheidung (Gemini zuerst, Globus) | Sprint 121 |

### `3.0` — Intelligenz + Welt [`32-intelligence.md`](./32-intelligence.md) · [`31-next.md`](./31-next.md) **CODE**

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `3.0.0` | Register, Policy, Konflikte, Nachfrage | 106 |
| `3.1.0` | DWD-Unwetterwarnung | 106 (in `3.0.0`) |
| `3.2.0` | Schulferien DE | 106 (in `3.0.0`) |
| `3.3.0` | Wechselkurse EZB | 106 (in `3.0.0`) |
| `3.4.0` | Research: Wikipedia/Destatis zuerst | 106 (in `3.0.0`) |
| `3.5.0` | Stimme: ganze Sätze | 106 (in `3.0.0`) |
| `3.6.0` | Open Food Facts | 106 (in `3.0.0`) |
| `3.7.0` | Open Library | 106 (in `3.0.0`) |
| `3.8.0` | Bundesliga | 106 (in `3.0.0`) |
| `3.9.0` | Sport-Ergebnisse | 106 (in `3.0.0`) |
| `3.10.0` | Garten & Pflanzen | 106 (in `3.0.0`) |
| `3.11.0` | Himmel (ISS, Mond) | 106 (in `3.0.0`) |
| `3.12.0` | Tiere draußen | 106 (in `3.0.0`) |
| `3.13.0` | Flüge überm Haus | 106 (in `3.0.0`) |
| `3.14.0` | Recht Alltag | 106 (in `3.0.0`) |
| `3.15.0` | Haushalt | 106 (in `3.0.0`) |
| `3.16.0` | Handy-Sensoren | 106 (in `3.0.0`) |
| `3.17.0` | Schach | 106 (in `3.0.0`) |

### `3.x` danach [`33-next.md`](./33-next.md) **CODE** (in `3.18.0`, GUI `3.18.1`)

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `3.0.1` | Sideload 3.0 + Gold-Set | 107 (in `3.18.0`; APK `3.18.1`) |
| `3.18.0` | Follow-up / last-tool | 107 |
| `3.18.1` | GUI: Overlay-Slides, Lage-Kacheln | 108 |
| `3.19.0` | Zwei Intents an „und“ | 107 (in `3.18.0`) |
| `3.20.0` | Parser-Score aus Sicherheit | 107 (in `3.18.0`) |
| `3.21.0` | Nachfrage Jarvis-Ton | 107 (in `3.18.0`) |
| `3.22.0` | Konflikte + Gold live | 107 (in `3.18.0`) |
| `3.23.0`–`3.32.0` | Tablet-Lage + Module | 107 (in `3.18.0`) |
| `3.33.0` | Traceroute ehrlich | 107 (in `3.18.0`) |
| `3.34.0`–`3.37.0` | Telefon-Haus, Notiz, Gespräch | 107 (in `3.18.0`) |
| `3.38.0`–`3.45.0` | Foto, Stimme, Sensoren, Schach-UI, Slots, Härten | 107 (in `3.18.0`) |

### `4.0` — Weltlage / Vorhersage [`35-next.md`](./35-next.md) **CODE**

`3.19.0`–`3.45.0` sind logische Stufen **in** `3.18.0`. Nächster Produktsprung ist `4.0`, nicht ein zweites `3.20`.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.0.0` | Leitentscheidung (Docs) | 110 |
| `4.1.0` | Research: Nachrichten-Ingest | nach 110 |
| `4.2.0` | Research: Zeitreihen Öl/FX/E10 | nach 110 |
| `4.3.0` | Research: Prognose-Methode + Recht | nach 110 |
| `4.4.0` | Research: Architektur/Akku/Konflikte | nach 110 |
| `4.5.0` | `outlook` Nachfrage + Tags | nach Research |
| `4.6.0` | Serien in der Antwort | nach Research |
| `4.7.0` | Kette Meldung → Öl/E10 (Reel) | nach Research |
| `4.8.0` | Szenarien + Unsicherheit | nach Research |
| `4.9.0` | Unterbrechen opt-in | nach `4.5` |
| `4.10.0` | Weitere Märkte nur mit sauberer Quelle | später |
| `4.11.0`–`4.18.0` | Lage-Kachel, Härten, Quellen, Analog, Akku, Gold, Stimme, Sideload | Verbesserungen |

### `4.19+` — Alltagskette Stimme [`36-next.md`](./36-next.md) **CODE**

Reel: Sprachnachricht, Bar, Taxi — nur geredet. Plan **vollständig** (Gold, Voten, Dateien). Sideload nach Hausstand [`38-next.md`](./38-next.md).

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.19.0` | Leitentscheidung (Docs) | 111 |
| `4.20.0` | Research: Sprachnachricht / WhatsApp-Composer | nach 111 |
| `4.21.0` | Research: Taxi Deep-Link DE | nach 111 |
| `4.22.0` | Research: Kette + Confirm-Schlange | nach 111 |
| `4.23.0` | POI Bar/Kneipe | nach Spike |
| `4.24.0` | Sprachnachricht = SMS-Text v1 | nach `4.20` |
| `4.25.0` | Taxi: öffnen oder anrufen, nicht „bestellt“ | nach `4.21` |
| `4.26.0` | Kette in einem Satz | nach `4.22` |
| `4.27.0`–`4.32.0` | Stimme, `wa.me`, Audio optional, Follow-up, Härten, Sideload nach Backup | Verbesserungen |

### `4.33+` — Gespräch, Film-Stimme, Reel am Steuer [`37-next.md`](./37-next.md) **CODE**

Kalender-Jahr/Fenster/`erstell` und ein Voice-Thread sind **CODE** `3.19.0` auf `main`. Neu: Gemini-TTS näher am Film (free), Anruf am Steuer nicht fake.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.33.0` | Leitentscheidung (Docs) | 112 |
| `4.34.0` | Research: Stimme/Gespräch | nach 112 |
| `4.35.0` | Research: Stören am Steuer | nach 112 |
| `4.36.0` | Research: Watchdog-Signale | nach 112 |
| `4.37.0` | TTS stehend vs. Fahrt | nach Research |
| `4.38.0` | Gespräch härten, Siezen | nach Research |
| `4.39.0`–`4.45.0` | Watchdog, HUD-Interrupt, optionale zweite Nummer, Kalender-Rest, Sideload | Verbesserungen |

### `4.46+` — Hausstand [`38-next.md`](./38-next.md) **CODE**

Deinstall wegen APK-Signatur löscht WebView-Daten. Export/Import vor Sideload. Autokorrektur Schreib+Sprache, kein blindes Bahn↔Bar.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.46.0` | Research Backup | 113 |
| `4.47.0` | Research Tippfehler | 113 |
| `4.48.0`–`4.49.0` | Export / Import | nach Research |
| `4.50.0`–`4.51.0` | Composer + STT-Wörterbuch | nach Research |
| `4.52.0` | Sideload mit Hausstand-Thema | nach `4.49` |

### `4.53+` — Zwei Gesichter + Tablet [`39-next.md`](./39-next.md) **CODE**

Ein Hirn, zwei Faces. Tablet-Lage split, nicht Chat-Ersatz. Female-TTS andockt an `4.34`. Sideload nach Hausstand.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.53.0` | Leitentscheidung (Docs) | 114 |
| `4.54.0` | Research Face + weibliche Gemini-TTS | nach 114 |
| `4.55.0` | Research Tablet (Code + ggf. Fotos) | nach 114 |
| `4.56.0`–`4.58.0` | Parser/Setting, TTS-Bindung, Wake Friday | nach Research |
| `4.59.0`–`4.62.0` | Lage Split, Poll, Raster, Chat-Kachel | darf vor Friday |
| `4.63.0`–`4.65.0` | Gold, Header/Avatar, Sideload nach `4.52` | Verbesserungen |

### `4.66+` — Körper intern [`40-next.md`](./40-next.md) **PLAN**

Lage-Sicht auf vorhandene Organe. Handy ist Hirn. PC nur PC-Auge/PC-Hand. Kein Cloud-Employee.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.66.0` | Leitentscheidung (Docs) | 115 |
| `4.67.0`–`4.69.0` | Research: Schema/WebGL, Live-Felder, PC-leer | nach 115 |
| `4.70.0`–`4.74.0` | HUD-Sicht, 3D + Kacheln, Gold | nach Research |
| `4.75.0` | Sideload nach Hausstand | nach `4.52` |

### `4.76+` — Lokales Sehen / LocateAnything [`41-next.md`](./41-next.md) **FREEZE** (Parser CODE)

PC-Sidecar, nicht Handy-WASM. `4.66`–`4.75` bleiben Körper. 3060 fehlt → NO-GO. Sprints [`54-next.md`](./54-next.md) 171–172.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `4.76.0` | Leitentscheidung (Docs) | 116 **CODE** |
| `4.77.0` | 3060-Messung GO/NO-GO | **171** NO-GO |
| `4.78.0`–`4.80.0` | Sidecar / Klick / Foto oder Freeze | **172** Freeze CODE |
| `4.81.0`–`4.86.0` | Ground, Click mit Box, Overlay, Foto, Crop, Fallback | nach GO |
| `4.87.0`–`4.93.0` | Zeig, Zählen, Tippen, Delta, Beleg, Termin, TV-Foto | 117 Parser **CODE** |
| `4.94.0`–`4.99.0` | Schreibtisch, Waschlabel, EAN, zwei Schritte, Gold, Sideload | 118 Parser **CODE** |

### `5.0` — Weltkugel (andere Schiene)

`5.0`–`5.10` sind die Lage-Sicht Erde (PR #58). Nicht mit Debug mischen.

### `5.11+` — Debug-Lauf [`44-next.md`](./44-next.md) **CODE** (v2 CODE)

Upgrade des Settings-Debug `3.19`. Mehrere Kategorien, neues Gespräch, JSON-Export. Hintergrund-Service: [`54-next.md`](./54-next.md) Sprints 169–170.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `5.11.0` | Leitentscheidung (Docs) | 120 **CODE** |
| `5.12.0` | Spike: stirbt der Lauf bei Home? | **169** CODE GO |
| `5.13.0` | Research Export + eine Prompt-Quelle | **CODE** |
| `5.14.0`–`5.16.0` | UI, Katalog, JSON+TXT | **CODE** |
| `5.17.0` | FGS v2 | **170** CODE |
| `5.18.0` | Sideload nach Hausstand | `9.10.0` |

### `6.0+` — Bühne & Hirn [`45-next.md`](./45-next.md) **CODE** in `6.50`/`6.60`

Nach `5.11`. Over-the-top GUI und Frontier-Ton ohne 0,5B als Claude zu verkaufen. `5.12` Debug-Service bleibt eigene Schiene.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `6.0.0` | Leitentscheidung (Docs): Gemini Hauptweg, Globus Zoom | 121 |
| `6.1.0`–`6.3.0` | Research: FPS, Reduced-Motion, Canvas vs WebGL | in 122 |
| `6.10.0` | Motion-Kern + Chat-Chrome | 122 |
| `6.20.0` | Körper-Show + virtueller Globus (GIBS, Zeig/Erkenne Stadt) | 123 |
| `6.30.0` | Fahrmodus-Bühne | 124 |
| `6.40.0` | Sprach-Theater + TTS-Picker | 125 |
| `6.50.0` | Hirn: Gemini zuerst, Tool-Schliff, Groq/0,5B Backup | 126 |
| `6.51.0` | Parser: Wont/Help/HUD nach 6.50-Prompt-Test | 127 |
| `6.52.0` | Live-Split + Identität ohne Hirn | 128 |
| `6.53.0` | Overlay: Gemini zuerst, 0,5B Backup | 129 |
| `6.60.0` | Sideload APK | 130 |

### `6.70+` — Globus-Briefing [`48-next.md`](./48-next.md) **CODE**

Nach `6.60`. Stadt sagen → Satellit → Briefing. **Nachrichten-Tour:** Welt-passiert → Länder leuchten, Seite, Zoom-Kette. Kein Live, kein Geheim-Feed. Sideload **`6.90.0`**.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `6.70.0` | Leitentscheidung (Docs) | 131 |
| `6.71.0` | Research: Fly-to-Zoom, GIBS, Headline→Land, Glow | 132 |
| `6.80.0` | Execute: Fly-to in Satellit + Politik/Markt-Kette | 133 |
| `6.82.0` | Execute: Welt-Tour Glow + Seite + Zoom-Kette | 134 |
| `6.81.0` | Anomalien ehrlich + Ihr Plan am Ort | 135 |
| `6.90.0` | Gold, Debug-Gruppe Stadt+Tour — **CODE** | 136 |

Recall `6.60`+ ist eigene Schiene [`46-next.md`](./46-next.md).

### `6.60+` — Agentic Recall [`46-next.md`](./46-next.md) **PLAN**

Nach `6.50`. NVIDIA-Loop über IndexedDB, MemAgent-Panel, LightMem-Sleep. Kein LanceDB, kein Nemotron.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `6.60.0` | Leitentscheidung (Docs) | 127 |
| `6.61.0`–`6.65.0` | retrieve, Search, Memory-Recall, memoryBlock, Prompt | 128 |
| `6.70.0`–`6.71.0` | Working Memory, Digest | 129 |
| `6.80.0`–`6.82.0` | Sleep, Register `recall`, Gold | 130 |
| `6.83.0` | Could: e5-small nur Rank | Sprint **176** (in `9.10.3`) |
| `6.84.0` | Sideload nach Hausstand | nach `4.52` |

### `8.0+` — Alltag vom Zettel [`50-next.md`](./50-next.md) **PLAN**

Nach `6.90`. Geschwister zu Recall `7.0`, nicht dieselben Sprint-Nummern. Blitzer nur mit erlaubter Quelle. Amazon Musik nur nach Research-GO. Settings `8.35`: Gruppen statt 17 Peers. Lage `8.32`. Netz `8.33`. Test-Tore nach Execute-Bündeln. Dauer-Zuhören `8.95` nach Recall. Sideload bleibt **`6.90.0`** bis Hausstand + Gold.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `8.0.0` | Leitentscheidung (Docs) | 141 |
| `8.1.0` | Research: Blitzer/Baustelle, Lizenz, Korridor | nach 141 |
| `8.2.0` | Research: Execute-dann-TTS, Lag-Messung | nach 141 |
| `8.3.0` | Research: Amazon-Intent, Ordner-Schema, Preiswache | nach 141 |
| `8.4.0` | Research: Settings-Gruppen, deutsche Namen | nach 141 |
| `8.10.0` | Execute: Gefahren auf der Route | nach `8.1` GO |
| `8.20.0` | Stimme: Mic/Wake hören, dann Execute, dann Native-TTS / nur vorlesen | nach `8.2` |
| `8.30.0` | GUI/Lag Chat + Drive-HUD | nach `8.2` |
| `8.32.0` | Lage-Overlay: Clip, Pins, `Wo ist London`, Körper/Kacheln-Pane | nach `8.2` |
| `8.33.0` | Netz-Antwort: Jarvis-Ton, aktueller Stand vor Training | nach `8.2` |
| `8.34.0` | Test-Tor A: Stimme + Lage + Netz + Lag (vier Phasen) | nach `8.20`/`8.30`–`8.33` |
| `8.12.0` | Test-Tor Fahrt | nach `8.10` |
| `8.35.0` | Settings neu: Gruppen, Karten, GUI | nach `8.4` |
| `8.36.0` | Test-Tor Settings | nach `8.35` |
| `8.40.0`–`8.60.0` | Musik-Fallback, Chat-Ordner, Preiswache | nach `8.3` |
| `8.61.0` | Test-Tor Alltag-Rest | nach `8.40`–`8.60` |
| `8.90.0` | Gold, Debug-Gruppe | nach Execute + Tore |
| `8.95.0` | Dauer-Zuhören härten (Wake, App/CarPlay auf) | nach Recall `7.31` |

### `9.10+` — Rest final / Qualität-Could [`54-next.md`](./54-next.md) **CODE**

Nach Sideload `9.10.0`. Gerät 168/178 PO, Debug 169–170/180 FGS, Sehen 171–172 Freeze, Could 173–177/181 ohne Gewichte. ONNX opt-in, nie Router. Gerät-PO [`55-next.md`](./55-next.md). Semantisches Gedächtnis [`56-next.md`](./56-next.md) **CODE**.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `9.9.2` | Geräte-Katalog (PO) | 168 |
| `9.9.3` | Findings 168, nur wenn rot | 186 |
| `5.12.0` / `5.17.0` | Debug Spike GO / FGS | 169 / 170 |
| `4.77.0` / `4.78.0` | 3060 NO-GO / Freeze | 171 / 172 |
| `9.10.0` | Could-Leit + Gold ohne Bundle + Parser-Härte + FGS-Härte | 173 / 177 / 179 / 180 / 182 |
| `9.10.1` | Silero + Smart Turn | 174 Freeze / 181 |
| `9.10.2` | Piper offline | 175 Freeze / 181 |
| `9.10.3` | Kokoro + e5 Spike | 176 Freeze / 181 |

### `10.0` — Semantisches Gedächtnis [`56-next.md`](./56-next.md) **CODE**

Schema und Gate vor jedem Encoder. Corpus bleibt IndexedDB (Cap 80). Live-Code **`10.60.0`**. e5 nur Rank, nie Router; 195 Freeze weil Gold `10.50` G2/G3 grün.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `10.0.0` | Leitentscheidung (Typen, Won’t) | 187 CODE |
| `10.10.0` | Schema-Felder + Hausstand | 188 CODE |
| `10.20.0` | Gate STORE/MERGE/IGNORE/REVISE | 189 CODE |
| `10.30.0` | Retrieve 2: Alias, Filter, Boost | 190 CODE |
| `10.40.0` | Graph light (related_ids, 1-Hop) | 191 CODE |
| `10.50.0` | Memory-Gold Eval | 192 CODE |
| `10.51.0` | Test-Tor Memory Gerät | 193 CODE/PO |
| `10.60.0` | Experience / Utility-Prune | 194 CODE |
| `10.61.0` | Alias-Lexikon härten | 196 CODE in `10.66.0` |
| `10.62.0` | Recall leer ohne Gespräch-Echo | 197 CODE in `10.66.0` |
| `10.63.0` | memoryBlock Retrieve-Memory | 198 CODE in `10.66.0` |
| `10.64.0` | parent_key nur Reise | 199 CODE in `10.66.0` |
| `10.65.0` | Gold = Live-Pfad | 200 CODE in `10.66.0` |
| `10.66.0` | Mag-ich-Parser + Intensiv-Bündel | 201 CODE |
| `10.70.0` | e5-Rerank nur wenn 192 rot | 195 FREEZE |

### `11.0` — Fachwissen + Deep Research [`58-next.md`](./58-next.md) **CODE** `11.60.0`

Thematische Packs, nicht Cap-80-Prefs. Teach nur explizit. Deep = mehr Queries im bestehenden Loop. Kein Fine-Tune, kein Qdrant, kein Instagram-Ingest.

| Version | Bedeutung | Sprint |
|---------|-----------|--------|
| `11.0.0` | Leit + Store `knowledge_packs` | 202 CODE in `11.60.0` |
| `11.10.0` | Teach-Parser + Harvest | 203 CODE in `11.60.0` |
| `11.20.0` | knowledgeBlock Topic-Match | 204 CODE in `11.60.0` |
| `11.30.0` | Deep Research + Teach-Offer | 205 CODE in `11.60.0` |
| `11.40.0` | Settings / Hausstand | 206 CODE in `11.60.0` |
| `11.50.0` | Gold T1–T6 | 207 CODE in `11.60.0` |
| `11.60.0` | Pack-REVISE / Lab-Notiz | 208 CODE |

### Weitere Beispiele

| Version | Bedeutung (Beispiel) |
|---------|----------------------|
| `0.1.2` | Hotfix-Patch nach `0.1.1`, falls nötig |
| `0.2.3` | Hotfix-Patch nach `0.2.2`, falls nötig |
| `0.3.2` | Hotfix nach `0.3.1`, falls nötig |
| `0.5.3` | Weiterer Router-Patch nach `0.5.2`, falls nötig |
| `0.6.3` | Weiterer Research-Patch nach `0.6.2`, falls nötig |
| `0.7.3` | Delight/Session-Patch (Sprint 21; mitgeliefert in `0.8.0`) |
| `0.8.5` | Persona/Continuity-Patch nach `0.8.4` (Sprint 27) |
| `0.9.0` | Local Tools Core — Option A (Sprint 28) |
| `0.9.1` | Tools Hotfix (Sprint 29) |
| `0.9.2` | Tools Polish (Sprint 30) |
| `0.9.3` | Memory Quality Hotfix (Sprint 31) |
| `0.9.4` | Assist Continuity & Siezen (Sprint 32) |
| `0.9.5` | Tools Hygiene & Confirm-UX (Sprint 33) |
| `0.10.0` | NAS Core — Compose 24/7 (Sprint 34) |
| `0.10.5` | APK Polish — Abschluss NAS+APK (Sprint 39) |
| `0.11.0` | Samsung TV Core (Sprint 40) |

## Was wird versioniert?

| Artefakt | Wie |
|----------|-----|
| Git-Tags | `v0.1.0`, `v0.1.1`, … bei abgeschlossenen Zielen |
| Sprint-Log | Jeder Sprint nennt **Ziel-Version** (MINOR/MAJOR) |
| Docs | Kopfzeile oder Changelog-Eintrag mit Version |
| App/UI (später) | Angezeigte Build-/Versionsnummer |

## Sprint ↔ Version

1. Im Planning: Sprint-Ziel + **Ziel-Version** festlegen.
2. Währenddessen: Arbeit am Branch; noch kein Tag.
3. Bei Review bestanden: Tag `vX.Y.0` (oder vereinbartes MINOR/MAJOR).
4. Nachbesserungen ohne neues Sprint-Ziel: `PATCH` (`vX.Y.1`, …).
5. Größere neue Scope-Idee: neuer Sprint → neues `MINOR` (oder `MAJOR`).

## Changelog

Kurz gehalten unter `docs/CHANGELOG.md`:

- Was ist neu / geändert / behoben
- Bezug Sprint + Version

## Abgrenzung Motion-/GUI-Updates

Premium-Motion und UI-Feinschliff können eigene **MINOR**-Ziele sein (z.B. „GUI Update Motion“), statt heimlich in Patches zu verschwinden — außer wirklich kleine Fixes.

# 45 — Bühne & Hirn (`6.0`) **PLAN**

PO 2026-08-28: Animationen (CarPlay, Kugel, Körper, Sprachsteuerung) massiv nachziehen, GUI hochwertiger, mehr Mikrointegration, mehr Over-the-top — und Antworten in Chat **und** Sprachmodus näher an ChatGPT / Grok / Claude. Stimme verbessern wo möglich. Restliche Flächen härten, die schon da sind.

**Ist:** Code **`5.11.0`**. Sideload **`3.18.1`**. Lage-Sichten Körper/Kugel sind Canvas (kein Three.js). Fahrmodus ist internes Overlay + OSM-Kacheln + OSRM. Sprachmodus hat Phasen idle/listening/thinking/speaking, Gemini-TTS Algieba/Kore mit Native-Race am Steuer. Hirn lokal = Qwen2.5 **0,5B**; Tools laufen über Parser, nicht über das Modell. Gemini und Groq sind Opt-in.

**Lücke:** Die Bühne ist da, aber noch Schema statt Show. Der 0,5B-Smalltalk ist kein Frontier-Modell. Canned Tool-Sätze klingen ehrlich, aber nicht „intelligent“. Stimme ist eine Stimme, kein Theater.

Kein Execute in diesem Sprint. Research zuerst. Sideload nach Hausstand. Debug-Hintergrund bleibt `5.12` [`44-next.md`](./44-next.md), nicht mit `6.0` mischen.

## Ehrlichkeit: ChatGPT-Level

| Wunsch | Was wirklich geht | Was wir nicht behaupten |
|--------|-------------------|-------------------------|
| Jarvis denkt wie Claude/Grok | **Gemini Opt-in** (schon CODE) + optional Groq; Tool-Fakten darf das Cloud-Modell **formulieren**, nicht erfinden | 0,5B auf dem Handy wird nicht plötzlich 70B |
| Lokal schlauer | Research: Qwen **1.5B Q4** (~1 GB) oder 3B, nur wenn RAM/WASM-Spike auf dem Gerät grün ist | Default bleibt 0,5B bis Spike |
| Tools wie ein Agent | Parser + Register bleiben das Hirn für Geräte. Nach dem Tool: 1–3 Sätze aus **denselben** Fakten | 0,5B wählt keine Tools, kein Computer-Use |
| Stimme wie ein Film | Gemini-TTS Algieba/Kore, Satz-Pipeline, Barge-in. Picker für weitere Gemini-Stimmen | Kein ElevenLabs, kein Stimmklon, kein Marvel-Zitat |

Ohne Gemini-Key bleibt Jarvis ein **Geräte-Butler mit ehrlichen Tools** plus kleinem Smalltalk. Das ist die Produktlinie. Die Bühne (`6.10`–`6.40`) lohnt sich trotzdem: CarPlay, Lage und Sprache sollen sich anfühlen wie ein fertiges Produkt, unabhängig vom Modell.

## Kurz: was wir konkret bauen

| Fläche | Heute | `6.0`-Schiene | Won’t |
|--------|-------|----------------|-------|
| Motion | CSS-Slides, Canvas rAF ohne gemeinsames Budget | Ein Motion-Kern: 30 fps Akku / 60 nur bei Geste, Pause im Hintergrund, Reduced-Motion überall | 60 fps Idle, Dauer-WebGL |
| Chat-GUI | Spotify-dunkel, Tool-Badge | Over-the-top Chrome: Token-Reveal, Tool-Chip, Lage-Mitlauf wenn der Satz ein Organ/Pin trifft | ChatGPT-Klon, Markdown-Bubbles |
| Körper | Knoten-Schema, Antippen = Kachel | Licht, Pulse aus **echten** `body-snap`-Feldern, Kamera-Ease zum Organ | Iron-Man-Mesh, Fake-CPU, Organ = Tool |
| Kugel | Blue Marble + Terminator + Pins | Atmosphäre, Pin-Fly-to, ISS-Spur aus letzten Fixes | Live-Satellitenvideo, Überwachung, 1700 Starlink |
| Fahrmodus | Karte, HUD-Text, Spotify-Tab | Glas-HUD, Manöver-Chevron aus echter Geometrie, Now-Playing-Motion | Apple CarPlay, erfundene Spur |
| Sprache | Phasen + Wake-Bubble | Orb aus Mic-RMS, Mund in der Lage koppelt an TTS-Amplitude, Barge-in härten | Dauerhören im Hintergrund ohne Dienst |
| Antworten | Canned Tools; 0,5B/Gemini Smalltalk | Tool-Fakten → optional Gemini-Schliff (gleiche Zahlen); mehr Gedächtnis-Treffer; Sprach-Hint strenger | Erfundene Aktionen, Helpdesk |
| Stimme | Algieba / Kore / Native-Race | Picker (Algieba, Fenrir, Puck, Kore, Charon), Satz startet früher, am Steuer weiter Native-first | ElevenLabs, Klon der Nutzerstimme |

## Ist vs. Soll

| Fläche | Datei heute | Soll `6.x` |
|--------|-------------|------------|
| Körper | `BodySchema.tsx` Canvas-Knoten | Dieselbe Datei: Beleuchtung, Pulse, Ease. Kein zweites 3D-Framework ohne Spike. |
| Kugel | `GlobeView.tsx` | Fly-to bei Gazetteer-Pin (`last_globe_focus` ist CODE). Atmosphären-Rand. |
| Lage-Wechsel | `Lage.tsx` Tabs hart | Crossfade + Kamera, ein Canvas-Budget (Körper **oder** Kugel, nie beide rAF). |
| Fahrmodus | `DriveMode.tsx` `drive-hud` | Chevron/ETA aus `nextManeuver`, Spotify-Artwork-Glow wenn Track da. |
| Sprache | `VoiceMode.tsx` Phasen | Orb + Waveform; `createSpeakPipeline` bleibt. |
| TTS | `tts.ts` Algieba hart | Setting-Liste, Default Algieba. Drive-Budget 700 ms bleibt. |
| Chat | `chat.ts` Tool-Reply = Handler-String | Nach `handled`: optional `polishFacts(reply, facts)` nur mit Gemini, Guard gegen neue Zahlen. |
| Lokal-Modell | `DEFAULT_MODEL` 0,5B | Spike 1,5B; Default unverändert bis GO. |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Eine** Schiene `6.0`: Bühne zuerst, Hirn parallel sobald die Bühne nicht mehr ruckelt. Kein zweites `3.18.1`-GUI-Patch. |
| Nummer | `5.12` bleibt Debug-Hintergrund. Nächster Produktsprung nach `5.11` ist **MAJOR `6.0`**. |
| Hirn | Handy. Parser wählen Tools. Cloud (Gemini, optional Groq) formuliert Smalltalk und darf Tool-Sätze **umschreiben**, nicht widersprechen. |
| 0,5B | Bleibt Default offline. Längere Persona macht ihn langsamer — Persona lokal **kurz lassen**. Intelligenz sitzt in Tools + Gemini. |
| Motion | Reduced-motion und Akku schlagen Cinematic. Over-the-top = Geste und Fokus, nicht Idle-Feuerwerk. |
| WebGL | Spike: Canvas 2D zuerst (schon CODE). Three.js nur wenn der Spike auf einem Mittelklasse-Handy 30 fps hält **und** Reduced-Motion eine 2D-Fallback-Sicht hat. |
| Stimme | Gemini-TTS, kein Drittanbieter-Klon. Am Steuer Tempo > Timbre. |
| Sideload | Nicht in `6.0`–`6.50`. Hausstand [`38-next.md`](./38-next.md) vor APK. |

## Sprints (Lieferreihenfolge)

Research in dem Sprint, der sie braucht — nicht ein Jahr Vorlauf.

| Sprint | Version | Inhalt | Abhängigkeit |
|--------|---------|--------|--------------|
| 121 | `6.0.0` | Leitentscheidung (dieses Dokument) | — |
| 122 | `6.10.0` | Motion-Kern + GUI Over-the-top | Spike FPS/Reduced-Motion `6.1`–`6.3` |
| 123 | `6.20.0` | Körper + Kugel cinematic | 122 (ein Canvas-Budget) |
| 124 | `6.30.0` | Fahrmodus-Bühne | 122 (Motion-Tokens) |
| 125 | `6.40.0` | Sprach-Theater + Stimme | TTS-Stimmen-Spike `6.41` |
| 126 | `6.50.0` | Hirn: Tool-Schliff, Kontext, Modell-Spike | Gemini bleibt Opt-in |

`5.12` Debug-Service und LocateAnything-Sidecar `4.77` laufen **daneben**, sie blockieren `6.10` nicht.

## Research (vor Execute der Fläche)

| Version | Frage | Grün wenn |
|---------|-------|-----------|
| `6.1` | rAF-Budget Lage+Chat+Drive auf einem Mittelklasse-Handy | 30 fps, eine sichtbare 3D-Sicht, Tab hidden = rAF aus |
| `6.2` | Reduced-motion: Körper/Kugel/Drive/Voice lesbar ohne Daueranimation | Dieselben Daten, keine leere Fläche |
| `6.3` | Canvas 2D vs Mini-WebGL für Körper/Kugel | 2D reicht für Pulse/Fly-to **oder** WebGL mit Fallback |
| `6.21` | ISS-Spur / Pin-Fly-to ohne extra Netz | Nur gespeicherte Fixes + Gazetteer |
| `6.31` | Drive-HUD 30 fps bei Tile-Load | `tilesPending` darf Chevron nicht droppen |
| `6.41` | Gemini-TTS Stimmenliste (Algieba, Fenrir, Puck, Kore, Charon) | Eine Stimme startet < 3,5 s stehend; Drive weiter Native-Race |
| `6.51` | Tool-Schliff: Gemini bekommt nur `{tool, facts, draft}` | Guard streicht neue Zahlen/Orte, die nicht in `facts` stehen |
| `6.52` | Qwen 1.5B Q4 in WASM | n_ctx brauchbar, First-Token < PO-Limit, sonst **NO-GO** und 0,5B bleibt |

## Gold (Abnahme, nicht Marketing)

Bewegung (Handy in der Hand, Reduced-Motion aus):

1. `zeig mal den körper` → Schema fährt zum Hirn, Pulse nur an Organen mit echten Snap-Feldern, Chat-Satz wie heute.
2. `Zeig PC-Auge` → Kamera-Ease, Kachel „kein Tool“, PC-Knoten nur voll wenn BAT da.
3. `Wo liegt Berlin` → Kugel fliegt zum Pin, Koordinaten wie CODE, kein Foto-Schreibtisch.
4. Fahrmodus Overlay → Manöver-Chevron bewegt sich mit echter Geometrie; Spotify-Tab pulsiert nur bei laufendem Track.
5. Sprachmodus: Orb folgt Mic; erste Satzhälfte hörbar sobald TTS-Blob da; Barge-in bricht Speak.
6. `Gibt es Unwetter?` mit Gemini an → derselbe DWD-Satz, optional geschliffen, **keine** neue Stadt.
7. Gemini aus, `Hallo Jarvis.` → 0,5B oder ehrliches „Modell aus“. Kein Fake-Claude.

Provokation bleibt Won’t: Captcha, Banking, Live-Satellit, „du bist GPT-4“.

## Won’t (übergreifend)

Marvel-/Iron-Man-Mesh. 60 fps Idle. Live-Satellitenvideo. Überwachung. ElevenLabs / Stimmklon. 0,5B als Claude verkaufen. Computer-Use-Schleife. Auto-Ja. Play Store / iOS. Zweites Hirn am PC. Debug-Cloud.

## Stories (DoR für Execute)

| ID | Fläche | Inhalt |
|----|--------|--------|
| B1 | Motion | `--motion-*` Tokens; rAF-Registry; Hidden-Tab Stop; Reduced-Motion |
| B2 | Chat | Tool-Chip-Enter; Lage-Mitlauf (Organ/Pin) ohne zweiten Fetch |
| B3 | Körper | Pulse aus `body-snap`; Ease; kein Fake-Gauge |
| B4 | Kugel | Fly-to `last_globe_focus`; Atmosphäre; ISS nur aus bekannten Fixes |
| B5 | Drive | Chevron + Artwork-Glow; weiterhin internes CarPlay |
| B6 | Voice | RMS-Orb; Mund-Kopplung optional wenn Lage Körper sichtbar |
| B7 | TTS | Stimmen-Picker; Default Algieba; Drive Native-first |
| B8 | Hirn | `polishFacts` Gemini; Guard; 1,5B nur nach GO |

## Reihenfolge vs. offene Reste

1. Hausstand-Sideload (APK `3.18.1` → Code-Stand) — unabhängig, weiter vorziehen.
2. `6.10` Motion — spürbar ohne Modellwechsel.
3. `6.20` / `6.30` / `6.40` Bühnen parallel nach 122, nicht drei Frameworks.
4. `6.50` Hirn — sobald Bühne nicht mehr jankt; sonst schluckt das Modell die Frames.
5. LocateAnything-Gewichte nach 3060-GO (`4.77`).
6. Debug-Service `5.12` wenn der PO den Lauf im Hintergrund will.

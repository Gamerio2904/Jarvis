# 53 — Screenshot-Bugs: Kugel, Standort, Stimme, Routing (`9.9.2`) **CODE**

PO 2026-09-03: acht Handy-Fotos. Deep Research im Code und in der Industrie (Google Earth / Maps Drag, Canvas-rAF, Android SpeechRecognizer, Pipecat First-Audio). Loop im bestehenden Stack, kein neuer 3D- oder STT-Stack.

**Ist:** Code **`9.9.2`**. Sideload **`9.9.2`**. Parser zuerst. Hirn Gemini → Groq → 0,5B. Lage chat-first aus `9.9.1`.

---

## Screenshots → Ursache

| Foto | Was der Nutzer sieht | Ursache im Code | Fix |
|------|----------------------|-----------------|-----|
| Kugel + ERDE-Karte, dreimal „Lage“ | Alte 9.9.0-Fläche, Anleitungskarte | Bereits `9.9.1` Lage-Polish | bleibt |
| Kugel laggy | Dauer-rAF ~30 fps, doppeltes `strokeRings`, Idle-Spin | `GlobeView.tsx` | Eine Küstenlinie, rAF nur bei Drag/Pinch/Flug/Trägheit |
| Rechts-Swipe dreht links, oben/unten getauscht | `dyaw = +dx` (Kamera-Look, nicht Erde-folgt-Finger) | `GlobeView` `move()` | Vorzeichen negiert (Google-Earth-Konvention) |
| Standort fehlt oder Valeo / Beihinger Straße | Stales `last_place`; Focus-Pin `Number('')===0`; kein GPS beim Kugel-Tab | `here.ts`, `globe-pins.ts`, `Lage.tsx` | Fix löscht Ortsname bis Reverse-Geocode; Focus mit `parseCoord`; GPS beim Öffnen |
| „Guten Tag. Was steht an?“ auf jede Zeile | `parseGreeting` trifft jedes „wie geht es dir“, auch in einem Arbeitssatz; Greeting als last-step | `greeting.ts`, `chat.ts` | Lange/Arbeitssätze raus; Mood-Antwort; smalltalk nicht merken |
| „Gersde“ / keine Weltlage | Outlook kannte `gerade` nicht; STT-Tipp als Ortsname | `outlook-parse.ts`, `utterance.ts`, `news-parse.ts` | `gerade`/`jetzt`; Repair `gersde` |
| „Mach du das an“ → TV | Follow-up `\ban\b` ohne TV-Wort | `tv-parse.ts` | `das|du|es` ohne Anker ist kein TV-an |
| Research-off statt TV-Suche | „Suche nach Fernseheren“ = Live-Lookup | `tv-parse.ts` `isTvDiscover` | Paar-Suche vor Research |
| `Bietigheim-` abgeschnitten | `finishReply` strich Bindestrich und setzte Punkt | `guards.ts` | Buchstabe+Bindestrich bleibt, `looksTruncated` greift |
| Stimme langsam, STT schwach | Edge-First 1600 ms; 720-Zeichen-Schnitt mitten im Satz; `MAX_RESULTS=5` | `edge-tts.ts`, `tts.ts`, `JarvisVoicePlugin.java` | 1100 ms; Satzgrenze; 8 Alternativen |
| Mund: „Edge Conrad im Rennen mit Algieba“ | Körper-Kachel zeigte TTS-Rennstatus wie Transkript | `body-snap.ts` | Klare Reserve-Zeile |

## Industrie (nur Loop)

| Thema | Quelle | Was wir nehmen | Won’t |
|-------|--------|----------------|-------|
| Drag nicht invertiert | Google Earth / Maps: Oberfläche folgt dem Finger; three.js `reverseOrbit` | Negierte Deltas | Cesium, neuer Globe |
| Canvas-Lag | rAF nur bei schmutziger Szene; eine Stroke-Pass | Idle-Pause (schon `50-next` `8.32`) | WebGL-Engine |
| STT | Android `SpeechRecognizer` de-DE, `EXTRA_MAX_RESULTS`, phonetische Repairs | 8 Kandidaten + `pickHeard` + `REPAIRS` | ML Kit, Parakeet, Whisper-APK |
| First-Audio | Pipecat/Twilio: Satz-TTS, kürzeres First-Byte-Rennen | 1100 ms Edge, TTS am letzten `.!?` | Pipecat-Server, ElevenLabs |
| Voice-Länge | 1–2 ganze Sätze, kleines `maxOutputTokens` | 240 Tokens im Sprachmodus | Essay, Stichwort-Staccato |

## Won’t diese Runde

Alltag-Execute `8.0`. Foreground-Service `5.12`. e5-small als Router. Neues STT-Modell. Cesium. Marvel. Erfolgssatz ohne Observation.

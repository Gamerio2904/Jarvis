# 28 — Qualität statt Breite (`1.33`–`1.40`)

PO 2026-08-17: **Nichts Neues.** Bisheriges verbessern, erweitern, flüssiger. Intelligenter und bessere Antworten. Besseres Verständnis. Besseres CarPlay. Besseres Erkennen von Befehlen — plus weitere Härte an dem, was schon da ist.

Reihe davor: [`27-next.md`](./27-next.md). App jetzt: Sideload **`1.32.1`**.

Eine Sideload-Stufe pro Version. Kein Kalender.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Scope | Nur vorhandene Fähigkeiten: Chat, Router, Stimme, Fahrmodus, TV, Spotify, Alltag-Tools |
| Neu | Kein neues Gerät, keine neue App-Familie, kein iOS, kein Apple CarPlay, kein größeres Lokal-Modell |
| Schärfe | Parser + STT-Reparatur + Kontext + Gemini-Prompt — nicht „7B vortäuschen“ |
| Tempo | Flüssig vor extra Netz-Calls |
| Ehrlichkeit | Lieber nachfragen / ablehnen als falschen Treffer |

## Reihenfolge

| Version | Schwerpunkt | Status |
|---------|-------------|--------|
| **`1.33.0`** | Befehle erkennen: STT, Anker, Router-Kanten | **PLANNED** |
| **`1.34.0`** | Antworten: Kontext, Persona, weniger Canned | **PLANNED** |
| **`1.35.0`** | CarPlay: Route, HUD, Stimme am Steuer | **PLANNED** |
| **`1.36.0`** | Alltag-Phrasen: mehr Wege zu denselben Tools | **PLANNED** |
| **`1.37.0`** | Flüssig: UI, Wake-Word, Voice-Loop, TV-Start | **PLANNED** |
| **`1.38.0`** | Gedächtnis & Nachfragen im bestehenden Speicher | **PLANNED** |
| **`1.39.0`** | Stimme bleiben: STT, Barge-in, Navi+Jarvis | **PLANNED** |
| **`1.40.0`** | Härten: Eval, False-Positives, ehrliche Fehler | **PLANNED** |

Sprints: [`sprint-86.md`](./sprints/sprint-86.md) … [`sprint-93.md`](./sprints/sprint-93.md).

---

## `1.33.0` — Befehle erkennen

Was heute schiefgeht: STT liefert „Net Flicks“, „Karplay“, Füllwörter bleiben am Satz. `pickHeard` nimmt den **ersten** Parser-Treffer und ruft Drive mit `inMode=true` — auch außerhalb des Fahrmodus. TV / Spotify / Fahrmodus stehlen sich gegenseitig. `splitIntents` lässt nur **genau zwei** Tool-Teile zu. Follow-up kennt vor allem Kalender/Wecker (`last-step.ts`), nicht TV/Drive/Spotify.

| Hebel | Wirkung |
|-------|---------|
| Mehr `REPAIRS` | Netflix, Disney+, YouTube, Prime, Heilbronn-Klasse, Satzzeichen am Ende |
| Zahlenworte | `sieben Uhr`, `Viertelstunde`, `halb acht` → dieselben Timer/Wecker |
| `COMMAND_START` + Filler | „Kannst du mal Netflix öffnen“, „Jarvis bitte lauter“ |
| `pickHeard` | Score: mehrere Parser; **nicht** Drive-`inMode` raten; längerer sinnvoller Treffer |
| Kanten | `Spiel …` nur TV mit Film/App/TV-Cue; sonst Spotify nur im Fahrmodus oder mit „Spotify“ |
| Follow-up | `nochmal`, `lauter`, `pause`, `ja`/`mach`/`ok` nach Rückfrage; `das zweite` auch Einkauf |
| Drei Teile | `Wecker 7 und Timer 8 und Wetter` nicht verschlucken (`splitIntents` > 2) |

**Probe:** Gesprochen „Öffne Netfliks“, „Fahr nach hailbronn“, „Spiel Hotel California“ (kein TV), „Spiel Dune Film“ (TV), „Kannst du mal den Fernseher leiser“, „Wecker sieben und Timer fünf und Wetter“.

---

## `1.34.0` — Bessere Antworten

Lokal 0,5B bleibt knapp. Qualität sitzt bei Gemini (Opt-in). Heute: Voice kürzt History hart (`-16` Gemini vs. `-4` lokal); nach einem Tool-Turn ist Smalltalk oft kontextlos; Guards schneiden manchmal Substanz weg; gleiche Frage → gleiche Phrase.

| Hebel | Wirkung |
|-------|---------|
| History | Sprachmodus mehr Turns (nicht 16 vs. 4 willkürlich leer) |
| Memory im Smalltalk | Name, Ort, Vorlieben ohne Extra-Befehl, ohne Vornamen erfinden |
| Persona | Bezug auf die letzte User-Zeile; eine Rückfrage; Variation (`07`) |
| Guards | Helpdesk weg, Jarvis-Kante behalten — nicht den Sinn löschen |
| Groq | Gleicher Persona-Block wie Gemini, wenn Gemini limitiert |
| Tool → Chat | Nach „Netflix ist offen“ darf Smalltalk den Turn kennen |
| Bestätigung | „ja“ / „mach“ nach Soft-Confirm führt das letzte Tool aus, kein Smalltalk |

**Probe:** `Hey, wie geht’s?` zweimal verschieden. `Bin etwas kaputt.` kein Coach. Nach `Öffne Netflix` → `und lauter` bleibt TV. `Wie heiße ich?` nur wenn gespeichert.

---

## `1.35.0` — CarPlay besser

`1.30` hat Follow-me, Tabs, 300-m-Ansagen. Code hat schon Off-Route-Replan — aber Replan **löscht Cue-Gedächtnis** (`resetAnnounced`), deshalb dieselben Abbiegungen nochmal. GPS-Zucken plant zu oft neu. HUD bei Sonne/Nacht. Zoom unabhängig vom Tempo. Spotify-Overlay vs. Karte. Ankunft ohne Abschluss.

| Hebel | Wirkung |
|-------|---------|
| Off-route | Neue OSRM-Linie nur bei klarer Abweichung — nicht jedes GPS-Zucken |
| Cue-Gedächtnis | Replan darf angesagte Phasen **nicht** zurücksetzen, solange dieselbe Abbiege |
| HUD | Kontrast Tag/Nacht, große Zeile, Finger treffen Pause/Skip |
| Zoom | Langsam näher, schnell weiter — Karte bleibt lesbar |
| Heading | Karte in Fahrtrichtung, Recenter wenn Sie schieben |
| Stimme am Steuer | Jarvis-Turn duckt Navi nicht weg; Navi bleibt System-TTS |
| Tabs | `Zeig Karte` / `Spotify` zuverlässig, Overlay nicht doppelt |
| Ziel | `zur Freundin` / `nach Hause` aus bestehendem Ortsspeicher, ehrlich wenn leer |
| Ankunft | Am Ziel: kurze Ansage, Overlay darf zu; Bildschirm-an bleibt bis „Fahrmodus aus“ |
| Spotify-Token | Abgelaufen → ehrlich reconnecten, kein totes Overlay |

**Won’t hier:** Apple CarPlay, Google-Navi, Stau-Live von Google.

---

## `1.36.0` — Mehr Phrasen, dieselben Tools

Erweitern, nicht neue Tools. Wetter, Kalender, Einkauf, Timer, Wecker, Losgehen, Zuhause, Ventilator, TV-Apps, Spotify-Pause.

Beispiele: `Mach’s leiser am Fernseher`, `Was kommt heute?` (Tageslage), `Milch fehlt`, `In einer Viertelstunde Ofen`, `Netflix an`, `weiter` nach Spotify, `wann los zum Zahnarzt` (schon da — STT-Varianten), `Ventilator Stufe zwei`, `Wecker aus` nach Klingeln.

Parser dürfen Smalltalk nicht fressen: `Ich fahre gerne Auto` ≠ Fahrmodus. `Spiel mal was Nettes` ≠ Netflix. `Nachher` allein ≠ Route.

`stopp` / `halt` / `pause` treffen das **letzte** Medium (Spotify vs. TV vs. Navi), nicht alles gleichzeitig.

---

## `1.37.0` — Flüssig

Chat-Liste, Einstellungen, Widget, Wake-Word, Voice-Loop, Tizen-Launch.

| Hebel | Wirkung |
|-------|---------|
| UI | Weniger Ruckler beim Stream, Overlay-FPS im Fahrmodus, Chat bleibt am Ende |
| Tastatur | Letzte Bubble bleibt sichtbar, Composer deckt sie nicht zu |
| Wake-Word | Weniger Falsch-Treffer; nach Treffer sofort hören; „Jarvis, öffne Netflix“ eine Äußerung |
| Voice | Nach Antwort wieder hören ohne Mini-Hänger |
| TV | Launch einmal WOL, klare Meldung, kein 12-s-JustWatch im Weg von `Öffne Netflix` |
| Widget | Termin/Wetter nicht veraltet, Mic-Toggle sichtbar — auch wenn Chat zu |
| Standort | Permission weg → ehrlich, kein Fake-Wetter/Fake-Route |
| Settings | Denselben Text finden, den die Stimme braucht (Gemini, TV koppeln, Fan-IP) |

---

## `1.38.0` — Gedächtnis & Verständnis im Dialog

Bestehender Speicher, besser genutzt: „Was trinke ich?“ und natürliche Varianten. Widerspruch („kein Kaffee mehr“) überschreibt. Orte + Termin in einem Satz, wenn der Parser es schon fast kann. Chatsuche trifft den alten Turn. Kein zweites Gedächtnis-Produkt.

| Hebel | Wirkung |
|-------|---------|
| Recall | `Was trinke ich?` / `mein Getränk?` / `wie heiße ich?` |
| Widerspruch | `kein Kaffee mehr` ersetzt, fragt nicht ewig nach dem Alten |
| Anapher | `das lauter`, `stopp das`, `lösch das` → `last_step` (TV/Drive/Liste) |
| Ort+Termin | Eine Zeile, ehrlich wenn unklar (Losgehen bleibt nachfragen) |
| Geburtstag | `Wann hat … Geburtstag?` aus vorhandenem Eintrag |
| Chatsuche | Alter Turn, nicht Halluzination |
| Chat-Titel | Aus dem Befehl, nicht „Hallo Jarvis“ |

---

## `1.39.0` — Stimme bleiben

Nach `1.32.1` (Tempo): STT `NO_MATCH` nicht als Ignorieren. Barge-in (Antippen bricht wirklich). Navi-Cue und Jarvis-Satz nicht gleichzeitig. Deutsche Zwischenstände. „Nichts gehört“ nur wenn wirklich leer.

| Hebel | Wirkung |
|-------|---------|
| `NO_MATCH` | Gesprochenes nicht als Stille schlucken |
| Unvollständig | Warten bis der Satz steht, nicht mit halbem STT routen |
| Barge-in | Antippen stoppt Stimme und hört |
| Navi + Jarvis | Nicht zwei Stimmen übereinander |
| Zwischenstand | Deutsche Partials; „Nichts gehört“ nur wenn leer |
| Fehler | Gemini-Limit / Plugin-Timeout → ein klarer Satz, Loop läuft weiter |

---

## `1.40.0` — Härten

Mehr Chips = mehr Router-Tests. False-Positives: Musik vs. Film vs. Fahrt. Ehrliche Fehler (kein Fake-„läuft“). Akku/Bildschirm im Fahrmodus prüfen. Sideload-Probe der ganzen Kette: Sprache → Befehl → Tool → Antwort.

Regressionen, die in der Reihe nicht verloren gehen dürfen:

- Wecker/Timer-Ton (`1.28.3`)
- Research-Links, Text nicht erfinden (`1.29`)
- Fan/Broadlink ehrlich wenn die Brücke fehlt
- Voice-Tempo (`1.32.1`)
- Tizen-Apps + JustWatch (`1.32.0`)

---

## Weitere Verbesserungen (in den Stufen oben, nicht extra Produkt)

Diese Punkte sind Absicht der Reihe, nicht eigene MINORs:

- **Bestätigungen:** „ja“, „mach“, „ok“, „nein“ nach Rückfrage
- **Zahlenworte** in STT und Tastatur
- **Anapher** auf das letzte Tool
- **Drei Befehle** an „und“
- **Fahrmodus:** Cue nach Replan, Ankunft, Recenter, Token-Ehrlich
- **Wake-Word + Befehl** in einer Äußerung
- **Settings findbar**, Chat-Titel aus dem Befehl
- **Ordinal** „das zweite“ für Listen, die der User gerade gehört hat
- **Standort-Permission** ehrlich
- Wecker/Timer-Regression, Research-Ehrlichkeit, Fan ohne Brücke

## Won’t (Reihe)

Neue Smart-Home-Marken, Joyn/ARD als TV-Apps, iOS, Play Store, Cloud als Default, größeres On-Device-GGUF, Apple CarPlay-Entitlement, Google-Kalender-OAuth.

## Nächster Schritt

Sideload `1.32.1`. Umsetzung startet mit Sprint 86 / **`1.33.0`** (Parser, STT, `pickHeard`) — erst auf PO-Kommando.

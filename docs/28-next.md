# 28 — Qualität statt Breite (`1.33`–`1.40`)

PO 2026-08-17: **Nichts Neues.** Bisheriges verbessern, erweitern, flüssiger. Intelligenter und bessere Antworten. Besseres Verständnis. Besseres CarPlay. Besseres Erkennen von Befehlen — plus weitere Härte an dem, was schon da ist.

Reihe davor: [`27-next.md`](./27-next.md). App jetzt: Sideload **`2.0.0`** (letztes Medium, ehrliches Wetter, CarPlay auf Straßen).

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
| **`1.33.0`** | Suche & Antworten: Preise, keine Absage über Quellen, CarPlay öffnen | **CODE** |
| **`1.33.2`** | Widget: Tippen öffnet Hören + Antwort | **CODE** |
| **`1.33.3`** | Wecker klingelt wieder (nicht nur Anzeige) | **CODE** |
| **`1.34.0`** | Antworten: Kontext, Persona, weniger Canned | **CODE** |
| **`1.35.0`** | CarPlay: Route, HUD, Stimme am Steuer | **CODE** |
| **`1.36.0`** | Alltag-Phrasen: mehr Wege zu denselben Tools | **CODE** |
| **`1.37.0`** | Flüssig: UI, Wake-Word, Voice-Loop, TV-Start | **CODE** |
| **`1.38.0`** | Gedächtnis & Nachfragen im bestehenden Speicher | **CODE** |
| **`1.39.0`** | Stimme bleiben: STT, Barge-in, Navi+Jarvis | **CODE** |
| **`1.40.0`** | Härten: Eval, False-Positives, ehrliche Fehler | **CODE** |
| **`1.40.1`** | Sätze zu Ende; TV OK/D-Pad/`das zweite`; YouTube mit Titel | **CODE** |
| **`1.40.2`** | Timer spricht (kein Klingeln); natürliche Namen | **CODE** |
| **`1.40.3`** | Chat/Stimme: Film-Jarvis-Ton (Understatement) | **CODE** |
| **`1.41.0`** | Tanke: nächste + günstigste, immer E10, Preise | **CODE** |
| **`1.42.0`** | Wo bin ich: GPS, Freigabe anstoßen | **CODE** |
| **`1.43.0`** | CarPlay ehrlich + Alltag am Steuer | **CODE** |
| **`1.44.0`** | Filme IMDb/RT + wo gratis; Rabatt-Suche | **CODE** |
| **`1.45.0`** | Öffnungszeiten für Läden (OSM) | **CODE** |
| **`1.46.0`** | Anruf und SMS direkt, mit Nachfrage | **CODE** |
| **`1.47.0`** | PC live: Bildschirm, Maus, FIFA, Ordner | **CODE** |
| **`1.47.1`** | Ein-Klick-Kopieren: IP, Token, Prompts | **CODE** |
| **`1.48.0`** | Luft/Sonne auf Nachfrage, Bahn, Tagesschau, Feiertage | **CODE** |
| **`1.48.1`** | Satzbildung näher am Film-Jarvis | **CODE** |
| **`1.48.2`** | Live-Test-Bugs (Parser, Overlay, Straße) | **CODE** |
| **`1.48.3`** | Fahrmodus: Karte und Route | **CODE** |
| **`1.48.4`** | Fahrmodus-Karte: vollflächig, Norden oben | **CODE** |
| **`1.48.5`** | Karte schieben/zoomen, Sprache im Fahrmodus | **CODE** |
| **`1.48.6`** | Overlay=Karte, Cafés am GPS, echte Route | **CODE** |
| **`1.48.7`** | Research: keine erfundenen Zahlen | **CODE** |
| **`1.48.8`** | CarPlay-Route auf Straßen + Cafés am Valeo | **CODE** |
| **`2.0.0`** | Letztes Medium, ehrliches Wetter, Navi ohne Fake-Ankunft | **CODE** |

Sprints: [`sprint-86.md`](./sprints/sprint-86.md) … [`sprint-102.md`](./sprints/sprint-102.md).

---

## `1.33.0` — Suche & Antworten — **CODE**

PO-Screenshots: Gemini sagt „keine Live-Suche“ während 6 Quellen (MediaMarkt, OTTO) da sind. Keine Preise. `Ich heiße Timon` → `Timon — liegt.` `Öffnen Carplay` wird als Apple abgelehnt. Fahrmodus: „Netz hat die Route nicht geliefert.“

| Hebel | Wirkung |
|-------|---------|
| Persona + `Suche ist AN` | Nie Absage, wenn Research läuft |
| Absage ersetzen | Wenn Quellen da sind, Treffer-Text statt Browser-Verweis |
| Produkte | Idealo/Geizhals zuerst; € nur aus Snippets, sonst ehrlich |
| Snippets | DDG-Text unter dem Link, nicht nur Titel |
| Memory | `Name gemerkt: Timon.` |
| `Öffnen CarPlay` | Eigener Fahrmodus |
| Route | OSRM, sonst OpenStreetMap-Router |

**Probe:** `Suche nach Küchengeräte`, `Beste Preise Staubsauger`, `Ich heiße Timon`, `Öffnen CarPlay`.

Parser-Rest (Zahlenworte, drei `und`, Follow-up TV/Drive) bleibt in `1.36`.

---

## `1.33.2` — Widget antwortet — **CODE**

PO: Jarvis antwortet nicht über das Homescreen-Widget. Ursache: Antippen startete nur die App bzw. schaltete das Wake-Word um, öffnete aber nicht den Sprachmodus. Zusätzlich schloss `visibilitychange` den Modus beim Resume-Flicker sofort wieder.

| Hebel | Wirkung |
|-------|---------|
| Widget-Tap | `jarvis://voice` wie Shortcut und Wake-Word |
| Mikro 🎙 | Hören + antworten, nicht Mute-Toggle |
| Voice-Hold | Kein sofortiges Schließen beim WebView-Flicker |

**Probe:** Widget oder 🎙 antippen — „Ich höre…“, sprechen, Antwort.

---

## `1.33.3` — Wecker klingelt wieder — **CODE**

PO: Wecker geht auf, Klingel nur angezeigt. Der Ton hing am Vordergrunddienst; Android beendet `mediaPlayback` ohne Session, der Bildschirm bleibt.

| Hebel | Wirkung |
|-------|---------|
| Player unabhängig vom Dienst | Ton auf dem Wecker-Schirm, auch wenn der Dienst stirbt |
| WAV + Watchdog | Kein stilles „Erfolg“ ohne `isPlaying` |
| `setAlarmClock` | System-Wecker, nicht nur `setExact` |

**Probe:** `Timer 1 Minute Test` — Ton, nicht nur Anzeige.

---

## `1.34.0` — Bessere Antworten — **CODE**

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

## `1.35.0` — CarPlay besser — **CODE**

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

## `1.36.0` — Mehr Phrasen, dieselben Tools — **CODE**

Erweitern, nicht neue Tools. Wetter, Kalender, Einkauf, Timer, Wecker, Losgehen, Zuhause, Ventilator, TV-Apps, Spotify-Pause.

Beispiele: `Mach’s leiser am Fernseher`, `Was kommt heute?` (Tageslage), `Milch fehlt`, `In einer Viertelstunde Ofen`, `Netflix an`, `weiter` nach Spotify, `wann los zum Zahnarzt` (schon da — STT-Varianten), `Ventilator Stufe zwei`, `Wecker aus` nach Klingeln.

Parser dürfen Smalltalk nicht fressen: `Ich fahre gerne Auto` ≠ Fahrmodus. `Spiel mal was Nettes` ≠ Netflix. `Nachher` allein ≠ Route.

`stopp` / `halt` / `pause` treffen das **letzte** Medium (Spotify vs. TV vs. Navi), nicht alles gleichzeitig.

---

## `1.37.0` — Flüssig — **CODE**

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

## `1.38.0` — Gedächtnis & Verständnis im Dialog — **CODE**

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

## `1.39.0` — Stimme bleiben — **CODE**

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

## `1.40.0` — Härten — **CODE**

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

## `1.40.1` — Sätze und TV-Tasten — **CODE**

PO: Gemini bricht mitten im Satz ab (`**Entweder Sie`, `Ich halte im **H`). Frage, ob Jarvis den Fernseher sieht (YouTube-Login OK, Suche, „das 2.“ anklicken).

| Hebel | Wirkung |
|-------|---------|
| Guards + Persona | Kein Markdown, hängende Sterne weg, Satzende setzen |
| Gemini | Thinking aus (Budget fraß Tokens), mehr Output, Retry wenn `MAX_TOKENS` ohne Satzende |
| Samsung-Tasten | `KEY_ENTER` / D-Pad / Home — vorher oft `null`, deshalb tat OK nichts |
| `OK` nach TV | Taste, nicht Replay von „Öffne YouTube“ |
| Ordinal | `das zweite` / `das 2.` = n× runter + OK. **Kein Live-Bild.** |
| YouTube-Titel | `öffne der Handels auf YouTube` sucht, öffnet nicht nur die App |
| Foto | Kamera: Foto vom Schirm an Gemini. Jarvis sieht den TV nicht live. |

**Probe:** Smalltalk ohne Abbruch. `Öffne YouTube`, `OK`, `suche Handels auf YouTube`, `das zweite`. Foto vom Login-Dialog.

## `1.40.2` — Timer spricht — **CODE**

PO: Timer klingelt wie ein Wecker, Jarvis sagt nichts. Namen klingen unecht (`Timer Nudeln`, `Der Timer für Ihre Nudeln ist abgelaufen, Sie.`).

| Hebel | Wirkung |
|-------|---------|
| Eigenes Timer-Kanal ohne Ton | Kein Alarm-Klingeln über die Benachrichtigung |
| Nachplanung | `syncReminderAlarms` setzt Timer nicht mehr auf Wecker-Ton |
| TTS auf Alarm-Lautstärke | Jarvis ist hörbar, auch wenn Medien lautlos sind |
| Titel „Timer“ | Immer sprechen, nie `JarvisAlarmPlayer` |
| Sätze | `Nudeln, 8 Minuten. Ich sage Bescheid.` / `Die Nudeln sind fertig.` |

**Probe:** `Timer 1 Minute Nudeln` — kein Klingeln, Jarvis sagt „Die Nudeln sind fertig.“ Wecker klingelt weiter.

## `1.40.3` — Film-Ton — **CODE**

PO: Suche nach Jarvis aus Iron Man; Chat und Sprachmodus stärker daran anpassen.

Muster aus den Filmen (Paul Bettany): ruhig, fertige Sätze, totes Understatement, Straight Man, „Sir“ sparsam, loyal — nie Helpdesk. **Umsetzung auf Deutsch, ohne Zitate, ohne Marvel-Rolle.**

| Hebel | Wirkung |
|-------|---------|
| `GEMINI_PERSONA` + `VOICE_HINT` | Haus-AI, Understatement, keine Filmzeilen |
| Identität | `Für Sie, jederzeit` statt Steckbrief |
| `07-persona.md` | Vibe von Kumpel auf gelassenen Straight Man |

**Probe:** `Hallo Jarvis.`, `Was machst du so?`, Sprachmodus. Kein „Wie kann ich helfen?“

## `1.41.0` — Tanke E10 — **CODE**

PO: Im CarPlay oder Chat „fahr mich zu einer Tanke“ — nächste **und** günstigste anzeigen, inkl. Preise, immer E10.

| Hebel | Wirkung |
|-------|---------|
| Parser vor Navigation | „Tanke“ wird nicht als Ortsname geocodet |
| Tankerkönig `type=e10` | Nächste (km) und günstigste (€/l), keine erfundenen Preise |
| Fahrmodus | Default-Route zur nächsten; „günstigste“ / „das zweite“ wechselt |
| Key in Cloud-Settings | Kostenloser Key; ohne Key: Karte ohne Preis, ehrlich sagen |
| GPS | Ohne Standort nachfragen, nicht raten |

**Probe:** Standort an. Key unter Einstellungen → Cloud. `Fahr mich zu einer Tanke`. Danach `günstigste`.

## `1.42.0` — Wo bin ich — **CODE**

PO-Screenshot: `Wo bin ich gerade?` → Gemini rät den Arbeitsweg. `Kannst du sie aktivieren?` → Jarvis behauptet, Systemeinstellungen nicht öffnen zu können.

| Hebel | Wirkung |
|-------|---------|
| Parser vor LLM | Live-Ort nur mit GPS, kein Raten |
| Android-Dialog + App-Einstellungen | „aktivieren“ stößt die Freigabe an; Schalter nicht selbst |
| Kombi Tanke/Wetter | Dieselbe Pipeline; nach Freigabe Tanke nochmal |
| Unabhängig | `Wo bin ich gerade?` ohne Tanke |

**Probe:** Standort aus → `Wo bin ich gerade?` → `aktivieren` → Ort. Dann Tanke.

## `1.43.0` — CarPlay ehrlich + Alltag am Steuer — **CODE**

PO-Screenshot: `Carplay` → Gemini erfindet Apple-Verbindung, Musik und Ziel. `Öffne das overlay` → Ablehnung statt Spotify-Tab.

| Hebel | Wirkung |
|-------|---------|
| Nacktes `Carplay` / Overlay | Parser vor LLM; Overlay wechselt den Tab, nie „läuft schon“ |
| Restweg | Aus der echten Route sprechen, sonst nachfragen |
| Nächster POI | Apotheke, Bäcker, Parkplatz, Supermarkt über OSM; keine Öffnungszeiten erfinden |
| Arbeit / Freundin / Zuhause | `Ich arbeite in …`; unbekannter Ort wird erfragt, nicht geraten |
| System anstoßen | Taschenlampe ja; WLAN/Bluetooth/Nicht stören nur Android-Seite |
| Akku / Verbindung | Gelesene Werte, kein 5G-Raten |
| Anruf / SMS | Wählhilfe bzw. Entwurf; nie „verbunden“ / „gesendet“ |

**Probe:** `Carplay`, `Öffne das overlay`, `Wie weit noch`, `nächste Apotheke`, `Fahr zur Arbeit`, `Wie voll ist der Akku`, `Ruf mal die Freundin`, `Schreib der Freundin ich bin in 10 Minuten`.

## `1.44.0` — Filme IMDb/RT + Rabatt-Suche — **CODE**

PO: Rotten Tomatoes und IMDb, alle Filme, wo sie gratis laufen; Rabatt-Suche beim Online-Shopping aktivierbar.

| Hebel | Wirkung |
|-------|---------|
| OMDb-Key | IMDb + RT-Noten (`tomatoes=true`). RT hat keine eigene öffentliche API. Ohne Key keine erfundenen % |
| JustWatch DE | `Wo läuft … kostenlos` listet Free/Ads (nicht nur YouTube/Netflix/Disney+/Prime) |
| Joyn / ARD | Nur nennen mit Link, **nicht** als TV-App starten |
| `Spiel … Film` | Unverändert: Lookup + App auf dem Samsung |
| Rabatt-Suche | Settings Netz + `Rabatt-Suche an`. Extra mydealz/Sparwelt. Default aus. Keine erfundenen Codes |

**Probe:** `Wo läuft Dune kostenlos`, `Wie gut ist Dune`, `IMDb Dune`, `Spiel Dune Film`, `Rabatt-Suche an`.

## `1.45.0` — Öffnungszeiten Läden — **CODE**

PO: Öffnungszeiten bei Laden usw. ergänzen. Bisher hat Jarvis bewusst keine Stunden erfunden.

| Hebel | Wirkung |
|-------|---------|
| OSM `opening_hours` | Auf/zu und heutige Zeiten, wenn getaggt |
| Ohne Tag | „Keine Öffnungszeiten in der Karte.“ |
| `Hat die Apotheke auf` | Status ohne sofortige Route |
| Nächste offene | Nur wenn die nächste nachweislich zu ist |
| Drogerie / Laden | Dieselbe POI-Familie |

**Probe:** `nächste Apotheke`, `Hat die Apotheke auf`, `nächster Laden`, `nächste Drogerie`.

## `1.46.0` — Anruf und SMS mit Nachfrage — **CODE**

PO: Bro direkt anrufen, Nachricht senden, aber nachfragen.

| Hebel | Wirkung |
|-------|---------|
| Nachfrage | `Bro anrufen` → „Soll ich anrufen?“ Erst `Ja` wählt |
| SMS | Text vorlesen, `Senden?` Erst `Ja` schickt |
| Ohne Text | „Was soll ich schreiben?“ |
| Ohne Nummer | Tel merken, danach trotzdem Nachfrage |
| Ehrlichkeit | Kein Abheben, keine Zustellung behaupten |

**Probe:** `Bro, Tel …`, `Bro anrufen`, `Nachricht an Bro ich bin da`, `Nein`.

## `1.47.0` — PC live — **CODE**

PO: Desktop-Anwendung, mit der Jarvis live am PC ist — FIFA starten, Bildschirm sehen, Maus, Züge klicken, Ordner.

| Hebel | Wirkung |
|-------|---------|
| `desktop/JarvisPC.bat` | Windows-Fenster, LAN-Token, echter Screenshot |
| `FIFA starten` | Startmenü/EA/Steam suchen — sonst ehrlich „nicht gefunden“ |
| Bildschirm | JPEG vom PC, unten im Chat. Vorlesen nur mit Gemini |
| Maus / Klick | Mitte, Richtung, oder Element per Gemini-Koordinaten |
| Ordner | List/anlegen/öffnen unter Benutzerordner. Löschen nach Ja |
| Ohne App | Kein Fake-Erfolg |

**Probe:** Bat starten, Einstellungen → PC, `PC testen`, `FIFA starten`, `Was siehst du auf dem PC`, `klick Mitte`.

## `1.47.1` — Kopierfelder — **CODE**

PO: One-click kopieren, Felder mit Prompts.

| Hebel | Wirkung |
|-------|---------|
| Windows | IP, Token, jeder Prompt, alle Prompts — Button Kopieren |
| Handy Einstellungen → PC | dieselben Felder |
| Chat | Zeile „PC — einmal tippen kopiert“ |

**Probe:** Kopieren im PC-Fenster, ins Handy einfügen. Prompt kopieren, im Chat einfügen.

## `1.48.0` — Live-Lage auf Nachfrage — **CODE**

PO: Open-Meteo Air und Sonnenaufgang nur gezielt. transport.rest. Tagesschau und Nager. Ort-News: Tagesschau, sonst Internet.

| Hebel | Wirkung |
|-------|---------|
| Luft / Pollen | Nur bei `Luft`, `Pollen`, `AQI` — nicht bei `Wetter heute` |
| Sonne | Nur bei Sonnenaufgang / -untergang |
| Bahn | transport.rest, Fallback Transitous; sonst Maps ÖPNV, keine Fake-Zeit |
| Nachrichten | `Nachrichten` / Tagesschau national. `Was ist heute in Ingesheim passiert` → Tagesschau-Suche, leer → Netz, nichts erfinden |
| Feiertag | Nager.Date DE, Land grob aus letztem Ort |
| APK-UI | Prompt-Chips und PC-Prompt-Felder im Chat/Settings weg; Windows-App behält Kopieren |

**Probe:** `Wie ist die Luft?` · `Wann Sonnenaufgang?` · `Wetter heute` · `Mit der Bahn nach Heilbronn` · `Nachrichten` · `Was ist heute in Ingesheim passiert` · `Ist heute Feiertag?`

## `1.48.1` — Satzbildung — **CODE**

PO: Sätze mehr Jarvis wie aus den Filmen.

| Hebel | Wirkung |
|-------|---------|
| Persona / Stimme | Ganze Sätze mit Verb, kein Telegramm, kein Nachsatz „kein Raten“ |
| Wetter, Luft, Sonne | Feststellung statt Stichwortkette |
| Bahn, Nachrichten, Feiertag | Dieselbe Kadenz |
| `07-persona.md` | Ganze Sätze als Soll |

**Probe:** `Hallo Jarvis.` · `Wetter heute` · `Nachrichten` · `Ist heute Feiertag?`

## `1.48.2` — Test-Bugs — **CODE**

PO: Bugs aus dem Emulator-/Chrome-Test.

| Hebel | Wirkung |
|-------|---------|
| Gedächtnis | `Was trinke ich gerne?` liest, speichert nicht „ich gerne“ |
| Erinnerung | `in 20 Minuten Milch holen` ist Timer, nicht Einkauf |
| Tanke | `Fahr mich zu einer Tanke` nicht „Wo ist Einer tanke?“ |
| POI | `nächster Laden` nach Apotheke sucht Laden |
| Losgehen | Nackte `Bahnhofstraße` fragt nach der Stadt, kein 441-Min-Ort |
| Overlay | Composer bleibt über dem Fahrmodus tippbar |

**Probe:** `Was trinke ich gerne?` · `in 20 Minuten Milch holen` · `Fahr mich zu einer Tanke` · `nächster Laden`

## `1.48.3` — Fahrmodus Karte und Route — **CODE**

PO: Karte und Route im Fahrmodus kaputt.

| Hebel | Wirkung |
|-------|---------|
| Overlay | HUD über dem Chat-Feld, Composer erst wieder nach „Fertig“ |
| Karte | Drehung um den Standort, mehr Kacheln, letztes GPS |
| Route | Linie auf der Karte, OSRM mit User-Agent, letzte Route bleibt |

**Probe:** `Nach Heilbronn` · `Fahr mich zu einer Tanke` · `Fahrmodus aus`

## `1.48.4` — Fahrmodus-Karte neu — **CODE**

PO: Karte nur smartphone-groß, gedreht, laggy.

| Hebel | Wirkung |
|-------|---------|
| Norden oben | Keine Drehung der ganzen Karte — der Pfeil zeigt die Richtung |
| Vollbild | Canvas über den ganzen Fahrmodus, Kacheln bis zum Rand |
| Flüssig | Kein 81-Bilder-Grid, GPS ohne Dauer-Render der UI |

**Probe:** `Nach Heilbronn` — Karte füllt den Schirm, Straße nicht auf der Seite, Route sichtbar.

## `1.48.5` — Karte schieben + Sprache — **CODE**

PO: Karte nicht verschiebbar, Mic geht an und macht nichts.

| Hebel | Wirkung |
|-------|---------|
| Gesten | Ziehen, Pinch, Doppeltipp; GPS-Follow erst nach Standort-Knopf wieder |
| Mic | Navi-Stimme aus, zuhören, Befehl ausführen, Antwort sprechen |

**Probe:** Karte schieben, pinch, ⌖. Mic: `nächste Tanke`.

## `1.48.6` — Overlay, Cafés, echte Route — **CODE**

Live am Valeo in Bietigheim: Overlay blieb zu, „Aktiviere das overlay“ wurde Spotify, Frühstück riet Stuttgart, „Gib mir ne Route“ log ohne OSRM.

| Hebel | Wirkung |
|-------|---------|
| Overlay | Ohne Spotify/Musik = Karte, nicht interner Musik-Tab |
| Cafés | Frühstück/Café aus OSM am GPS, keine erfundenen Läden |
| Route | Overlay auf, OSRM zum letzten Treffer — oder ehrlich „Wohin?“ / Standort |

**Probe:** `wo könnte ich jetzt frühstücken` (Bietigheim, nicht Stuttgart) · `Gib mir ne Route` (Karte + echte Min) · `Aktiviere das overlay` (Karte) · `Öffne das Spotify overlay` (Musik).

## `1.48.7` — Research ehrlich — **CODE**

PO: „Wie viele Scheibenwischer verkauft Valeo am Tag“ → 100 Mio. im Jahr und 300–400k am Tag. Falsch gerechnet, nicht belegt.

| Hebel | Wirkung |
|-------|---------|
| Fakt-Fragen | `wie viele … verkauft` geht in die Suche, nicht ins Kopf-Gemini |
| Kein Blindflug | Google-Suche nicht durch ungestütztes Modell ersetzen |
| Zahlen | Nur aus Treffern; Jahr→Tag nicht umrechnen, wenn die Quelle den Tag nicht nennt |

**Probe:** `Wie viele Scheibenwischer verkauft Valeo am tag` — Jahreszahl nur mit Quelle, keine erfundene Tagesstückzahl.

## `1.48.8` — CarPlay-Route auf Straßen + Cafés am Valeo — **CODE**

Screenshots Valeo Bietigheim: Route nur im Chat („Café Le Théâtre, zehn Minuten“), Overlay erst nach „Aktiviere das overlay“ und dann Spotify. Frühstück war Stuttgart (Eckensee/Weissenhof), nicht Bietigheim. Danach: Overlay lädt, die Linie geht nicht zum Ziel und ignoriert die Straßen (Luftlinie / Zoom 16 schneidet den Pin ab).

| Hebel | Wirkung |
|-------|---------|
| Frühstück | OSM-Café am GPS, Overlay + echte Route — ohne das Wort Overlay |
| Radius | Café max. 8 km, nicht 20 km bis Stuttgart |
| Route | OSRM-Polyline, nicht GeoJSON-Riesenarray; keine 2-Punkt-Luftlinie |
| Kamera | Zoom so, dass Ziel im Bild bleibt |
| Fake-Navi | „internen Fahrmodus aktiv / rund zehn Minuten“ wird nicht als Erfolg durchgelassen |

**Probe:** Am Valeo `wo könnte ich jetzt frühstücken` — Katz/Florio in Bietigheim, Karte auf, **grüne Linie auf den Straßen bis zum Pin**. `Aktiviere das overlay` = Karte.

## `2.0.0` — Haus-AI, ein Kontext — **CODE**

MAJOR: dieselben Fähigkeiten, aber sie gehören zusammen. Letztes Medium statt „TV gewinnt immer“. CarPlay bleibt intern (nicht Apple). Kein Keystore, kein iOS, kein Store.

| Hebel | Wirkung |
|-------|---------|
| Lautstärke | Im Fahrmodus / nach Spotify → Spotify. `Fernseher lauter` bleibt TV. `Zeig Spotify` öffnet nicht die Karte. |
| Stopp | Pause auf dem letzten Medium, nicht Fahrmodus aus. |
| GPS | Ohne Standort: Pin am Ziel, kein „Sie sind da“-Pfeil auf dem Pin. |
| Wetter | Nur Open-Meteo. Ausfall: „Raten wäre unseriös.“ GPS-Cache 90 s. |
| Erinnerung | `erinner mich an X` fragt wann; `in 20 Minuten` legt an. |
| Widget | Fläche = hören. Mikrofon = Wake an/aus. |
| Research / Guards | Zahlen auch ungruppiert; ehrliches „kein Netz“ nach Suche bleibt. |
| TV | Erstes Listenelement nur OK. Unbekannte Fire-TV-Taste ehrlich. |
| Memory | Widerspruch („kein … mehr“) nicht wieder einstreuen. |
| Stimme | Antippen unterbricht. Ohne Gemini nach Tools: ehrlich, kein Hard-Stop. |
| Feiertage BW | Ostern gerechnet, nicht 2026–27 fest verdrahtet. |
| Hilfe | `/hilfe` beschreibt 2.0, nicht Wunschdenken. |

**Probe:** CarPlay offen: `Lautstärke 50` / `lauter um 10` → Spotify, `Fernseher lauter` → TV. `Zeig Spotify` ohne Overlay-Wort → Musik, keine Karte. `Öffne das Spotify overlay` → Overlay Musik. `Aktiviere das overlay` → Karte. Ohne GPS: Pin am Ziel, Pfeil nicht als angekommen. Wetter-Ausfall ehrlich. `erinner mich an Steuer` fragt wann. Widget: Fläche hören, Mikro Wake. `stopp` nach Spotify pausiert, schließt CarPlay nicht. `kein Kaffee mehr` Memory. `Wetter heute` ohne AQI.

## Won’t (Reihe)

Neue Smart-Home-Marken, Joyn/ARD als TV-Apps, iOS, Play Store, Cloud als Default, größeres On-Device-GGUF, Apple CarPlay-Entitlement, Google-Kalender-OAuth, WhatsApp, Keystore-Halbverschlüsselung.

## Nächster Schritt

Sideload `2.0.0`. Letztes Medium, ehrliches Wetter, CarPlay auf den Straßen. Nächste Stufe nur auf PO-Kommando.

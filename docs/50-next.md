# 50 — Alltag vom Zettel (`8.0`) **CODE** (Router, kein neues Sideload)

PO 2026-08-29: alte Notizen gefunden. Einplanen, was **nicht** schon Code oder Plan ist. Nicht neu erfinden, was `6.90` schon kann.

**Live:** Code **`6.90.0`**. Sideload **`6.90.0`**. Blitzer OSM, Settings-IA, Amazon-Intent, Ordner, Preiswache, Recall-Loop und Wake-Härte sind **CODE**. LocateAnything-Gewichte: [`41-next.md`](./41-next.md) **`4.77` NO-GO**. Debug-Hintergrund: `5.12` v1 (App offen + WakeLock).

**Warum `8.0`, nicht `7.x`:** `7.0`–`7.30` sind Agentic Recall (Sprints 137–140). Alltag vom Zettel ist **Geschwister**, kein zweites Recall, kein 3060. Execute **darf vor Recall**, wenn der PO Alltag zuerst will.

Execute der Zettel-Punkte ist **CODE**. Sideload bleibt **`6.90.0`**. Hausstand vor nächster APK. Gerät-Phasen 2–4 (Debug-Lauf auf dem Handy) bleiben PO.

---

## Notizen vs Ist

| Notiz | Ist in `6.90` | Lücke | Votum |
|-------|---------------|-------|--------|
| Blitzer + mobile Baustellen aus Blitzer-APIs | `warn.ts` = **DWD Unwetter**, nicht Tempo. Fahrmodus = OSRM + Abbieger, **keine** Kameras/Baustellen auf der Route | Neues Tool + Overlay-Pins + Ansage | **planen** |
| CarPlay verbessern: erst ausführen, dann vorlesen / nur vorlesen | Internes CarPlay **CODE** (`1.30`–`1.43`, Bühne `6.30`). `DriveMode` ruft `onCommand` (Tool läuft), **dann** `speakText`. Apple CarPlay **Won’t**. Gemini-TTS am Steuer Budget 700 ms / Native-Race 400 ms | Reihenfolge härten: Tool fertig **bevor** Satz; am Steuer **kurz** oder **nur vorlesen** (kein Essay). **Dazu:** Sprachinput (Mic/Wake) hält oft nicht — in **`8.20`** | **planen** (Härte, kein neues CarPlay) |
| Grafik smoother, weniger Latenz/Lag | Motion 30 fps **CODE** `6.10`. Ältere Härten: GUI `0.3`/`1.13`/`3.18.1`, Latenz `0.14`/`2.0.1`, Overlay-FPS `1.35`/`6.30` | Kein offener nächster Polish-Pass nach `6.90` | **planen** als Härte derselben Flächen, kein neues 3D |
| Alternative zur Spotify-API — Amazon Musik? | Spotify Web Playback + OAuth **CODE**. Kein Amazon Music, kein Deezer, kein Apple Music. „Amazon“ am TV = **Tizen-App**, nicht Musik | Zweiter Player nur nach Research-GO | **planen** (Research zuerst) |
| Chats in Ordner sortieren | `Conversation` = id/Titel/Daten. Chatsuche **CODE**. PC-„Ordner“ = Windows-Dateien, **nicht** Chats | `folder_id` + Sidebar + Hausstand | **planen** |
| Immer Bescheid wenn Instanudeln im Angebot — API wenn möglich | Produktsuche Idealo/Geizhals **CODE**. Rabatt-Suche mydealz **opt-in**. Erinnerungen = **Uhrzeit**, kein Preis. Watchdog = Steckdose/Termin, nicht Shop | Preiswache: merken + pollen + Notify, € nur aus Treffer | **planen** |
| Einstellungen unübersichtlich, unverstanden, GUI schwach | 17 gleichrangige Themen in einer Leiste (`SettingsScreen.tsx`). Hinweise Jargon: Delight, Memory, Tizen, Ausblick. Cloud mixt Gemini+Groq+Tanke+OMDb. „Modell“ = 0,5B-Fallback, steht oben. Haus ≠ Hausstand. Ton ≠ Stimme. Gefahr heißt „Danger Zone“. Keine Suche, kein Status auf der Leiste. Flaches Panel ist **CODE** seit `0.7`/`1.25` — die **Menge** ist das Problem, nicht ein fehlendes Screen | Gruppen + deutsche Wozu-Sätze + bessere Karten. Keys bleiben | **planen** (`8.35`) |
| Overlay abgeschnitten, Pins falsch, laggy (Handy-Fotos) | Phone: Lage+Chat **eine Spalte**, Kugel `min-height: 240` + `overflow: hidden`, extra `ChatTile`. `Number('') === 0` → Pin **Sie** bei 0/0. `wo ist London` trifft `places` vor `hud` | Eine volle Pane, frische Pins, Gazetteer-Flug, Idle-Pause | **planen** (`8.32`) |
| Venedig-Eintritt: Jarvis kurz und gut, Inhalt alt (Fotos Google vs Chat) | Jarvis: *„Für das Betreten der Altstadt … fünf Euro … Tagesgast.“* Ton und Länge richtig. Google/ADAC 2026-08-29: Testphase bis 26.7.2026, **aktuell kein Eintritt**, Neuauflage ca. Ostern 2027, 30–50 € nur Diskussion. `Muss man Eintritt zahlen` trifft `isLiveLookup` oft **nicht** → Training statt Treffer | Dieselbe Jarvis-Stimme, Fakten vom **jetzt**, eine Zukunftszeile | **planen** (`8.33`) |

Schon da, **nicht** nochmal als neues Produkt:

- Timer „Nudeln, 8 Minuten“ — Küche, kein Angebot.
- `Öffnen CarPlay` → interner Fahrmodus, nicht Apple.
- Spotify im Overlay.
- DWD, Idealo, Notify-Infrastruktur (`notify.ts`).

---

## Kurz: was wir bauen (und was nicht)

| Wunsch | Bei uns | Votum |
|--------|---------|-------|
| Blitzer auf der Strecke | Pins + kurze Ansage aus **genannter Quelle**, Korridor um die OSRM-Route | **ja** |
| Mobile Baustellen / wandernde Gefahren | Nur wenn dieselbe Quelle den Typ liefert (Baustelle, mobil, fest). Sonst ehrlich leer | **ja**, ehrlich |
| „Polizist steht jetzt da“ | Kein Live-Ortungsdienst, kein Scraping hinter Login | **Won’t** |
| Am Steuer erst tun, dann sprechen | Hören klappt (ein Erkenner). Tool-Execute endet, **dann** 1–2 Sätze Native-TTS. Kein Gemini-Film vor dem Klick | **ja** (`8.20`) |
| Nur vorlesen | Setting oder Phrase: TTS denselben kurzen Satz, kein zweites Chat-Essay | **ja** |
| Flüssiger | Dieselben Surfaces messen (Chat-Stream, Drive-Overlay, Lage). 30 fps bleibt Default | **ja** |
| Amazon Musik in Jarvis | Nur wenn Research eine **erlaubte** Steuerfläche findet (meist Android-Intent zur App, nicht Web-SDK) | **Could** nach GO |
| Spotify ersetzen | Spotify bleibt Hauptweg. Alternative = Fallback wenn Spotify tot oder User Amazon sagt | **ja** so |
| Chat-Ordner | Lokal, wenige feste + eigene Namen. Ziehen in der Sidebar, Stimme `leg den Chat nach Arbeit` | **ja** |
| Instanudeln-Alarm | Eine Preiswache, Beispielprodukt Instanudeln. Opt-in, Intervall, Quelle nennen | **ja** |
| Jede Minute Push ohne Erlaubnis | Akku, Spam | **Won’t** |
| Preise erfinden / automatisch kaufen | Standing Research | **Won’t** |
| Einstellungen finden ohne Fachwort | 5–6 Gruppen, Startkarten, Suche, Status-Pillen | **ja** |
| Schöner, ruhiger Settings-Look | Größere Karten, weniger Leisten-Rauschen, Advanced eingeklappt | **ja** |
| Neues Settings-Backend / iOS-Klon | Dieselben `Settings`-Keys, alte Topic-IDs als Deep-Link | **Won’t** |
| Jarvis-Satz, Google-Fakten (Venedig) | 1–3 Sätze, jetzt zuerst, Quelle, Zukunft nur belegt | **ja** (`8.33`) |
| Google-Übersicht im Chat | Listen, Fett, „Wichtige Infos“ | **Won’t** |

---

## Ehrlichkeit: Blitzer-APIs

Es gibt **keine** freie amtliche Live-API „alle Blitzer DE jetzt“. Community-Listen (Blitzer.de, scdb, App-POIs) haben ToS, Lücken und Versatz. OSM `highway=speed_camera` ist offen, **statisch**, unvollständig. Mobile Blitzer und Baustellen erscheinen und verschwinden.

| Was Leute meinen | Was ehrlich geht | Delay |
|------------------|------------------|--------|
| Feste Säule an der B27 | OSM + eine Community-Liste **nach Research-Lizenz** | Tage–Monate |
| Mobiler Blitzer heute früh | Nur wenn die gewählte Quelle den Typ `mobile` und einen frischen Stand hat | Stunden, oft leer |
| Wanderbaustelle | Nur mit Typ in der Quelle (Baustelle/Sperrung), kein Raten aus „Stau“ | Stunden |
| Beamter hinter der Kurve live | Gibt es öffentlich nicht in der APK | — |

**Done Research `8.1` wenn:** eine erlaubte Quelle (oder OSM-only v1) + Typ-Tabelle + „Stand …, unvollständig“ + Won’t Live-Jagd. Keine Quelle = **kein** Fake-Blitzer-Tool.

## Ehrlichkeit: Amazon Musik

Spotify hat ein Web-Playback-SDK. Amazon Music hat **kein** gleichwertiges öffentliches Player-SDK für eine Sideload-WebView. Partner-APIs sind nicht „Key eintragen und fertig“.

**Default-Vermutung (Research muss bestätigen):** Android-Intent / Deep-Link in die **Amazon-Music-App** (wie Samsung-Apps: öffnen, nicht in Jarvis mixen). Ohne App = ehrlich aus. Kein Scraping, kein gefälschtes „läuft in Jarvis“.

GO nur wenn: Steuerbarkeit Pause/Weiter/Suche **oder** ehrliches „App geöffnet, dort weitermachen“. NO-GO → Amazon Musik bleibt Parking, Spotify bleibt allein.

---

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Eine** Alltag-Schiene `8.0`: Fahrt-Gefahren, Steuer-Stimme, GUI-Härte, **Einstellungen neu gliedern**, Musik-Fallback, Chat-Ordner, Preiswache. Kein neues Hirn. |
| Reihenfolge | Research vor Execute. Blitzer ohne Lizenz-GO nicht bauen. Musik ohne GO nicht bauen. Ordner und Preiswache brauchen kein 3060. |
| Parser | Neue Intents ins Register (`blitzer`, `watch-price`, `chat-folder`). Kein `if` in `chat.ts`. |
| Fahrt | Internes CarPlay. Apple CarPlay bleibt Won’t. |
| Stimme am Steuer | **Hören zuerst, dann Execute, dann Native-TTS.** Ein SpeechRecognizer. Phrase/Setting `nur vorlesen`: kurzer Satz, kein Gemini-Essay. Abbieger bleiben Native wie heute. |
| Grafik | Spike messen, dann bestehende Motion/Overlay/Stream. Kein neues Framework, kein 60-fps-Idle. |
| Lage-Overlay | **Nicht abschneiden, nicht über den Chat legen.** Pins nur mit frischem GPS / Lexikon. `Wo ist London` = Kugel, nicht Maps-Rückfrage. Körper und Kacheln dieselbe Pane. |
| Netz-Antwort | **Jarvis-Länge, Google-Stand.** 1–3 Sätze, kein Markdown. Erst *aktuell*, dann höchstens eine Zeile *danach*. Zahlen nur aus Treffern mit Datum. Training (fünf Euro 2024/25) darf den heutigen Stand nicht überschreiben. |
| Einstellungen | **Gruppen statt 17 Peers.** Deutsch, ein Wozu-Satz pro Karte. Alltag oben, Werkstatt unten. Keys unverändert. Deep-Links der alten IDs halten. |
| Musik | Spotify bleibt. Amazon nur Fallback nach GO. |
| Ordner | IndexedDB + Hausstand. Kein Cloud-Sync. |
| Preiswache | Opt-in. Poll nur mit Erlaubnis. € nur aus Snippet. Instanudeln = erstes Beispiel, nicht einziges Produkt. |
| Notify | Bestehendes `notify.ts`. Kein zweites Push-Produkt. |
| Sideload | Nicht in `8.0`–`8.60`. Hausstand vorher. |
| Recall / 3060 | Unabhängig. |
| Test-Tore | Nach einem **Execute-Bündel**, das der Nutzer anfassen kann. Nicht nach reiner Research. Vier Phasen, bestehender Debug-Lauf `5.11`. |
| Dauer-Zuhören | Nach Recall-Gold: Wake **härten**, nicht neu erfinden. Wetter-Satz und internes CarPlay. Opt-in bleibt. |

---

## Einstellungen — Ist vs Ziel (`8.35`)

PO 2026-08-29: die Einstellungen sind **unübersichtlich**, die Namen **unverstanden**, die GUI **nicht auf der Höhe** der Bühne `6.50`.

Flach war `0.7` richtig (wenig Verschachtelung). Seitdem sind **17 Themen** gleich laut: Allgemein, Modell, Cloud, Sprache, Wecker, Ort, Fernseher, PC, Haus, Musik, Ton, Netz, Weltlage, Hausstand, Gedächtnis, Debug, Gefahr. Jedes hat einen Ein-Wort-Hinweis, oft Englisch oder Technik.

### Was heute schiefgeht

| Symptom | Warum |
|---------|--------|
| Alles gleich wichtig | Eine Leiste, 17 Buttons, Debug neben Wecker |
| „Modell“ oben | Das ist der **letzte** Fallback (0,5B), nicht das Hirn |
| „Cloud“ | Gemini, Groq, Tankerkönig **und** OMDb in einem Stapel |
| „Ton“ vs Sprache | Ton = UI-Klick + Delight. Sprechen liegt unter Sprache |
| „Haus“ vs „Hausstand“ | Steckdose vs. Backup. Zwei Wörter, ein Missverständnis |
| „Netz“ / id `forschung` | Suche, nicht WLAN |
| „Danger Zone“ | Englisch in einer deutschen App |
| Tablet-Lage unter Allgemein | Aussehen, nicht „dieses Handy“ |
| Kein Status | Man sieht nicht, ob Gemini an oder Spotify raus ist, ohne das Thema zu öffnen |
| Keine Suche | Wer „Key“ sucht, scrollt Cloud durch |

### Ziel-Gliederung (5 Gruppen + Werkstatt)

Alte Topic-IDs bleiben als Deep-Link (`Einstellungen → Cloud` landet in **Hirn**). Keine neuen Store-Keys nur für die IA.

| Gruppe | Deutsch, ein Satz | Heute drin | Nicht hier |
|--------|-------------------|------------|------------|
| **Hirn** | *Wer denkt — zuerst Gemini, dann Groq, zuletzt das kleine Modell auf dem Handy.* | `cloud` (Gemini+Groq), `modell` **eingeklappt** | Tanke/OMDb → „Weitere Schlüssel“ unter Hirn, nicht erste Karte |
| **Stimme** | *Hören, wecken, vorlesen. Am Steuer kurz.* | `sprache` + später `drive_speak` | UI-Klicks |
| **Alltag** | *Wecker, Wetter, wo Sie sind.* | `wecker`, `ort` | Backup |
| **Geräte** | *Was Jarvis schalten oder spielen darf.* | `tv`, `pc`, `haus`, `musik` | Hausstand |
| **Welt** | *Suche im Netz und Weltlage. Nur wenn Sie das anmachen.* | `forschung`, `weltlage` | Geheim-Feed |
| **Ihre Daten** | *Was er merkt, was Sie sichern, was weg ist.* | `gedaechtnis`, `hausstand`, `gefahr` | Steckdosen |
| **Aussehen** | *Lage neben dem Chat, Farben, leise Töne.* | Tablet-Lage aus `allgemein`, `ton` | Hirn-Keys |
| **Werkstatt** | *Version, Debug, nur wenn Sie testen.* | `allgemein` (Version), `debug` | Alltagskarten |

Startseite (wenn kein Deep-Link): **sechs große Karten** — Hirn, Stimme, Alltag, Geräte, Welt, Ihre Daten. Aussehen und Werkstatt kleiner darunter. Eine Suchzeile filtert Karten und Felder (deutsch: „Key“, „Steckdose“, „löschen“).

### Verständliche Namen (Leiste + Karten)

| Alt | Neu (sichtbar) | Eine Zeile darunter |
|-----|----------------|---------------------|
| Allgemein | Dieses Handy | Version, ob Gemini oder das lokale Modell läuft |
| Modell | Kleines Modell (selten) | Nur wenn Cloud aus ist. ~470 MB. |
| Cloud | Hirn in der Cloud | Gemini ist der Hauptweg. Groq springt ein. |
| Sprache | Hören und sprechen | Mikrofon, Stimme Jarvis/Friday |
| Wecker | Wecker und Timer | Töne, Erinnerungen |
| Ort | Ort und Wetter | GPS, Open-Meteo |
| Fernseher | Fernseher | Samsung und Fire am HDMI |
| PC | Windows-PC | Nur mit laufender Jarvis-PC-App |
| Haus | Steckdosen und Ventilator | Im WLAN, keine Cloud-Dose |
| Musik | Musik | Spotify in Jarvis. Amazon nur nach GO. |
| Ton | Töne und Stimmung | Klicks und seltene Witze, nicht die Stimme |
| Netz | Im Internet suchen | Aus = keine Produktsuche |
| Weltlage | Weltlage | Ausblick auf Nachfrage, kein Orakel |
| Hausstand | Sichern und zurückholen | Vor Neuinstall. Sonst sind Keys weg. |
| Gedächtnis | Was Jarvis merkt | Sie können Zeilen löschen |
| Debug | Tests | Mehrere Kategorien, Export |
| Gefahr | Alles löschen | Unumkehrbar. Deutsch, nicht Danger Zone. |

### Bessere GUI (dieselbe WebView)

| Muss | Nicht |
|------|--------|
| Gruppen in der Leiste, aufklappbar. Handy: Akkordeon. Breit: Gruppen links, Karten rechts | 17 gleich hohe Buttons |
| Karte: Titel (Verb/Alltagswort) → ein Lead-Satz → Schalter | Hinweis-Einwort „Delight“ |
| Status-Pille auf der Gruppe: „Gemini an“, „Spotify raus“, „TV offen“ | Zustand erst nach dem Klick |
| Suche oben | Nur Scrollen |
| „Mehr“ für 0,5B, OMDb, Tankerkönig, Debug-Export | Alles auf einer Fläche |
| Gefahr zuletzt, rot, deutsches Confirm | Englische Danger Zone gleich groß wie Wecker |
| Ruhigere Typo, mehr Luft, weniger Staffel-Animation | Neues Design-System, 60 fps Idle |
| Reduced-Motion: keine Topic-Slides | Motion abschalten ganz |

### Deep-Link und Parser

`Einstellungen → Cloud` / `Einstellungen dann Datenschutz` / bestehende `openSettings('musik')` bleiben. Mapping-Tabelle alt-id → Gruppe im Execute. Kein `if` in `chat.ts`.

---

## Lage-Overlay — Ist vs Ziel (`8.32`)

PO 2026-08-29, Screenshots Handy: Kugel-Rechteck **unten abgeschnitten**, liegt über dem Chat („Guten Tag…“). Pin **Sie** im Südmeer/Antarktis, **Kiew** zu weit östlich. Zweite Aufnahme: nur grüner Glow, keine Textur. Titel *Auf der Weltkarte* unter die Statusleiste. `Wo ist London` → „Lage oder maps? Ein Wort reicht.“ App **laggy**.

Das ist dieselbe Lage-Sicht (`Lage.tsx`: Kacheln / Körper / Kugel), nicht ein zweites Overlay. Drive-HUD bleibt eigene Fläche, bekommt dieselben Lag-Regeln.

### Was der Code heute macht

| Fläche | Ist | Lücke auf dem Screenshot |
|--------|-----|--------------------------|
| Layout Phone | `.main.is-lage` ist **eine Spalte**. Lage `flex:1`, Kugel `min-height: 240` + `overflow: hidden`. Chat (`.messages`) **darunter im selben Stack** — und Lage hat zusätzlich `ChatTile` | Kugel wird beschnitten und verdeckt den Thread |
| Tablet ≥900 px | Grid: Lage links, Chat rechts | Auf dem Handy nicht. Force-Lage (`hud_force`) gilt trotzdem schmal |
| Safe-Area | Topbar ohne `env(safe-area-inset-top)` | Titel unter Notch/Status |
| `Sie`-Pin | `globe-pins.ts`: `Number(last_lat)` — **leerer String wird 0**. Jedes finite Paar inkl. **0,0** und alten Fixes | Pin im Südmeer / Null Island ohne GPS |
| Kiew | Lexikon 50,45° N 30,52° O ist richtig. Projektion `xyz`/`project` + Default-Yaw 0,8 | Pin wandert nach Sibirien, wenn Lon-Vorzeichen/Yaw nicht zur Textur passt |
| Leere Kugel | Blue Marble lädt async; bis dahin nur Glow. GIBS erst ab Zoom 3,8 | Grüne Kugel ohne Erde |
| `Wo ist London` | `parseHudIntent` kennt `wo ist/liegt` + Gazetteer. `places` `RECALL` (`wo wohnt/ist/liegt`) und Maps-Ask **können höher scoren** | Rückfrage statt Fly-to, obwohl London in `PLACES` steht |
| Körper | Dieselbe `lage-split` + Canvas-Schema | Gleicher Clip, gleiches Doppel-Chat |
| Kacheln | Viele Zellen + Chat-Kachel | Phone: Kugel/Körper nicht lesbar |
| Lag | Canvas-Schleife (Marble-Step `R/48`), Tour-Tick **500 ms** auch wenn Tour aus, Uhr **1 s** rendert ganz `Lage` (Kugel neu), ISS-Poll 20 s, Poll 5–20 s | Ruckeln, Akku |
| Kopf | `lage-head`: Breadcrumb + drei Tabs + Uhr + Akku **eine Zeile** | Tabs gequetscht, kein „Lage aus“ |
| Caption | `lage-split` unter 720 px eine Spalte: Kugel **plus** TextTile **plus** ChatTile | Kugel verliert Höhe an Text und zweiten Composer |
| Titel | Chat-Titel aus der Äußerung | „Auf der Weltkarte“ ok; darf die Statusleiste nicht treffen |

### Ziel — Layout

| Muss | Nicht |
|------|--------|
| Phone: **eine** reservierte Lage-Fläche (Kugel/Körper **quadratisch, vollständig**, `aspect-ratio: 1`), Chat **darunter oder daneben**, nie durchscheinend unter der Kugel | Lage als Floating-Card über den Bubbles |
| `overflow: visible` der Sphäre **in** der Pane; Innenabstand, damit der Pol nicht am Rahmen klebt | `overflow: hidden` das die untere Halbkugel frisst |
| Safe-Area oben (Topbar, Gemini-Banner, Lage-Tabs) | Titel in der Systemleiste |
| Auf dem Phone **kein** zweites `ChatTile` in der Lage, solange der Haupt-Composer da ist | Zwei Composer, zwei Threads |
| Caption (Stadt/Briefing) **unter** der Kugel, nicht neben ihr um Höhe | TextTile stiehlt die untere Halbkugel |
| Kopf: Tabs **eigene Zeile** (Kacheln / Körper / Kugel), Uhr/Akku rechts; **Lage aus** (X oder `Lage aus`) | Breadcrumb+Tabs+Uhr in einer Zeile |
| Ein Satz unter dem aktiven Tab: Kugel = Erde drehen; Körper = Organe; Kacheln = Wetter/Musik | Nur drei Wörter ohne Wozu |
| Körper: dieselbe Pane-Höhe wie die Kugel, Schema ganz sichtbar, Organ-Text **unter** dem Schema nicht dahinter | Körper-Canvas abgeschnitten wie die Kugel |
| Kacheln Phone: 1–2 Spalten, Rest scrollt **in der Lage**, Chat bleibt frei | 12 Kacheln + Kugel + Chat auf einer Fläche |
| Reduced-Motion: 2D-Karte / Standbild, keine Idle-Schleife (schon Standing `6.90`) | 60 fps Idle |

### Ziel — Orte und Pins

| Muss | Nicht |
|------|--------|
| `Sie` nur bei GPS **frisch** (wie Tanke: Fix < 10 min, \|lat\|≤90, **nicht** 0,0, **nicht** `Number('')`). Sonst kein Pin, Satz „Standort unbekannt“ | Geratener Südpol / Null Island |
| Unwetter-Pin nur mit eigenem Ort, nicht auf dem letzten/leeren GPS | Warn-Pin am 0/0 |
| Projektion: Unit-Test Berlin, Kiew, London, Sydney gegen Pixelquadrant (nicht „sieht ungefähr aus“) | Geocoder-Orakel |
| Labels: max 4–5, Kollision ausblenden, Kiew nicht über Sibirien stapeln | 20 Pins auf der Fernansicht |
| `Wo ist London` / `Wo liegt London` / Kugel offen + Gazetteer → **`hud` Fly-to**, nicht Maps-Ask. Maps nur bei Person/Adresse (`wo wohnt …`, Straße+Hausnr.) | „Lage oder maps?“ für Lexikon-Städte |
| `Zeig London` bleibt Gold (schon CODE). Pin-Tipp auf Lexikon-Stadt = Fly-to, nicht extra Chat-`Zeig …` auf dem Phone | Street View |
| Textur: warten oder 2D-Blue-Marble-Sprite; kein leerer Glow als „Erde“ | Fake-Live |

### Ziel — Tempo (Lage + Körper + Kacheln)

| Muss | Nicht |
|------|--------|
| Kein `rAF`, wenn Lage zu oder Tab hidden (Standing `motion.ts`) | Dauer-Draw hinter dem Chat |
| Marble/GIBS nur bei Geste oder Fly-to; Idle 2–4 fps oder Pause | Step `R/48` jedes Frame im Idle |
| Tour-Interval **nur anlegen** wenn `globe_tour_on`; Uhr nur die Uhr-Spanzeile, nicht ganz `Lage` | 500 ms Tick + 1 s Remount im Stand |
| ISS-Poll nur bei offener Kugel, ≥30 s, Cache | Where-the-ISS jedes 20-s-Pin-Load |
| Körper: Organ-Glow aus Store, kein zweites 3D; Pulse pausiert wenn Tab nicht Körper | Two-WebGL (schon Won’t) |

### Research `8.2` (Lage dazu)

1. Phone-Höhe: wie viel bleibt unter Topbar+Composer für eine volle Kugel (Pixel).  
2. Score-Reihenfolge `hud` vs `places` für `Wo ist London`.  
3. 6 Pins mit bekannten Koordinaten auf dem Canvas — welcher Quadrant?  
4. Frame-Zeit Idle vs Drag auf Mittelklasse.  

**Done Research wenn:** Layout-Skizze Phone/Tablet, Score-Regel, Pin-Testliste, fps-Budget.

Execute: **`8.32`** (Layout + Pins + Parser). Lag-Messung der übrigen Surfaces bleibt **`8.30`**.

---

## Netz-Antwort — Jarvis-Ton, aktueller Stand (`8.33`)

PO 2026-08-29, zwei Screenshots: *Muss man Eintritt zahlen für Venedig*.

| | Länge / Art | Inhalt |
|--|-------------|--------|
| **Jarvis** | 1 Satz, Siezen, tot-ruhig — **behalten** | Alt: fünf Euro an bestimmten Tagen für Tagesgäste (Regel 2024/25, Training) |
| **Google** | Überschrift + Listen + Zukunftsblock — **nicht kopieren** | Richtig: Testphase 2026 bis 26.7., **jetzt kein Eintritt**, ohne Anmeldung; ab ca. Ostern 2027 wieder möglich; 30–50 € nur Gespräch |

**Mittelweg (Ziel-Satz, nicht abschreiben):** *Aktuell nicht. Die Testphase 2026 ist vorbei, die Altstadt ist ohne Gebühr zugänglich — Stand ADAC. Ab Ostern 2027 kann für Tagesgäste wieder eine Abgabe kommen; 30–50 Euro sind Diskussion, kein Tarif.*

Drei Sätze. Kein Markdown. Quelle genannt. Jetzt zuerst, Zukunft danach, Spekulation als Spekulation.

### Was der Code heute macht

| Fläche | Ist | Lücke |
|--------|-----|--------|
| Live-Trigger | `isLiveLookup`: Suche-Wort, Wetter/News, `aktuell`+Preis, Produkt, Valeo-Stückzahl | `Muss man Eintritt zahlen für …` fällt oft **durch**. Gemini antwortet aus dem Modell |
| Suche an | Gemini `search` + Digest + `SEARCH_ON_HINT` (2–4 Sätze, Zahlen nur aus Treffern) | Kein „aktuell vor alt“. Alte 5-€-Snippets und Training gewinnen |
| Guard | `guardResearchReply` streicht Umrechnung Jahr→Tag und Zahlen, die nicht im Corpus stehen | Fünf Euro **steht** oft in alten Treffern — Guard lässt sie, auch wenn neuere Zeilen „kein Eintritt“ sagen |
| Fallback ohne Gemini | `formatResearchReply` nimmt den längsten Snippet | Kann die alte Gebühr zitieren |
| Ton | Persona 1–3 Sätze, kein Markdown — das ist gut | Nicht zu Google-Listen aufblasen |

### Ziel

| Muss | Nicht |
|------|--------|
| Eintritt / Gebühr / City-Tax / Touristenabgabe / `muss man zahlen` + Ort → **Suche**, nicht Kopf | Nur wenn der User „suche“ sagt |
| Digest: Datum und Wörter *aktuell / keine Gebühr / Testphase beendet* vor älteren €-Meldungen | Erster Treffer gewinnt immer |
| Antwort: **jetzt** in Satz 1. Satz 2 = Beleg + Quelle. Satz 3 nur wenn die Quellen eine Neuauflage nennen | Google-Übersicht, Fett, Listen, „Wichtige Infos für die Zukunft“ |
| 30–50 € / fünf € nur mit Rolle: *Diskussion* / *früher* / *geplant* — nie als heutiger Tarif, wenn die Quellen „aktuell frei“ sagen | Training 2024 als Gegenwart |
| Gold: Venedig-Frage → kein „fünf Euro“ als Jetzt. Debug-Gruppe Alltag | Comune-Scraping, Street-View, Orakel 2027 |

**Done Research `8.2` (Punkt 4) wenn:** Trigger-Liste, Digest-Regel, ein Gold-Satz.

Execute **`8.33`**: `isLiveLookup` + Hint + Guard + Gold. Kein neues Hirn.

---

## Test-Tore (vier Phasen)

PO 2026-08-29: Tests einbauen, **wann es Sinn hat**. Nicht nach jedem Research, nicht nach jedem Patch. Ein Tor nach einem Bündel, das jemand **benutzen** kann.

Bestehender Lauf: Settings → Debug (`5.11`, `test-copy.ts`). Kein zweites Testprodukt, kein Auto-Ja, kein neues Hirn. Hintergrund-Service bleibt `5.12`.

### Wann

| Nach | Tor | Warum hier |
|------|-----|------------|
| `8.20` + `8.32` + `8.33` + `8.30` | **`8.34`** | Erste Fläche, die der PO schon gesehen hat (Mic, Kugel, Venedig, Lag) |
| `8.10` | **`8.12`** | Fahrt-Gefahr: falsch = gefährlich |
| `8.35` | **`8.36`** | Settings-IA: finden, nicht verbauen |
| `8.40`–`8.60` | **`8.61`** | Ordner/Preis/Musik nur wenn gebaut |
| Alltag-Executes + Tore | **`8.90`** | Gold, letzte Alltag-Runde |
| Recall `7.30` | **`7.31`** | in [`49-next.md`](./49-next.md) |
| `8.95` Dauer-Zuhören | im selben Execute, Phasen 1–4 bis sauber | sonst Wake-Regression |

Keine Tore nach `8.1`–`8.4` allein.

### Die vier Phasen (jedes Tor)

1. **Schnitt.** Was ist seit dem letzten Tor **neu im Code**. Daraus drei Prompt-Sätze in `test-copy.ts` (neue Debug-Gruppe, fest im Code, nicht vom LLM):
   - **Erstnutzer** — erste Berührung, normale Worte (`Wetter`, `Wo ist London`, Mic antippen).
   - **Geübt** — Folge, Kurzform, Tab, Setting (`Lage aus`, `nur vorlesen`, Deep-Link).
   - **Kaputt** — alles falsch: leeres GPS, Suche aus, Wake+Mic gleichzeitig, `Street View von London`, fünf-Euro-Venedig als Jetzt.
2. **Lauf.** Debug-Sequenz oder Handy: Prompt, warten auf `onDone`, nächster. Stimme/Lage zusätzlich per Hand, wenn der Lauf kein Mic hat.
3. **Schnitt der Fehler.** Was falsch oder schlecht war → patchen (Parser, Layout, Guard, Wake-Pause). Kein neues Feature im Tor.
4. **Angepasster Lauf.** Dieselben drei Rollen, Prompts nachgezogen (Tippfehler, die der Fix jetzt treffen muss).  

Phase 3 und 4 **wiederholen**, bis der Lauf keine roten Verdicts mehr hat und die Hand-Proben (Mic, Kugel, Wake) still sind. Dann nächstes Execute.

Won’t im Tor: neue Schiene, Sideload, „einmal ignorieren“.

---

## Dauer-Zuhören härten (`8.95`) — nach Recall

Nach Sprint 140 / `7.30` und Tor `7.31`. **Kein** neues Zuhör-Produkt. Upgrade von Wake-Word + VoiceMode + `JarvisWakeService` (`1.11`/`1.28`/`1.39` **CODE**).

Soll: dauerhaft **zuhören wenn Wake an**, Treffer zuverlässig, App nach vorn, Befehl ausführen. *Wie wird das Wetter?* → Wetter-Tool + kurzer Satz. *Öffne CarPlay* / *Fahrmodus* → internes Overlay, nicht Apple. App aus / Bildschirm aus: Service hält, wie heute gewollt, aber ohne `RECOGNIZER_BUSY` und ohne verschluckten Satz.

| Muss | Nicht |
|------|--------|
| Wake an = Name treffen → STT → Tool (Wetter, Drive, Lage) → kurzer Satz | Zuhören bei Wake **aus** |
| App in den Vordergrund, wenn ein Befehl kommt | Zweites Icon, neue Speech-Cloud |
| Ein Erkenner (steht in `8.20`); nach Turn wieder scharf, ohne 400-ms-Blindflug | Zwei Recognizer, Dauer-Upload in die Cloud |
| Flüssig: weniger NO_MATCH-Loops, ehrliches *Nichts gehört* | 60-fps-Orb, jedes Geräusch = Befehl |
| Opt-in + Akku-Hinweis bleiben | Mithören ohne Erlaubnis, alles auf Disk |

---

## Stimme — Hören, dann tun, dann sprechen (`8.20`)

PO 2026-08-29: **Sprachinput geht nicht.** Keine neue Versionsnummer — gehört in das schon geplante **`8.20`** (bisher nur TTS nach Execute).

Composer-Mic und die Leiste *Jarvis hört* öffnen `VoiceMode` → `listenOnce` → Android `SpeechRecognizer`. Parallel läuft `JarvisWakeService` auf **demselben** Erkenner. `pauseListen()` stoppt den Wake-Rec, `startListening` kommt oft im **selben** Frame — `ERROR_RECOGNIZER_BUSY` / `ERROR_CLIENT`. VoiceMode holt dazu `getUserMedia` für den Orb, während Native-STT das Mic schon hält. Die Leiste *Jarvis hört* ist **Wake-Word**, kein Diktat ins Feld — der User spricht ins Nichts.

### Ziel (in `8.20`, nicht `8.21`)

| Muss | Nicht |
|------|--------|
| **Ein** Erkenner. Wake **vollständig** aus (await `stopRec`), dann STT. Wake erst nach Ende des Turns zurück | Zwei `SpeechRecognizer` gleichzeitig |
| Composer-Mic: Satz **ins Feld** oder VoiceMode, das wirklich hört. Leere Runde = ehrlicher Satz (*Mikrofon belegt* / *erlauben*), kein stilles Loop | Nur Overlay auf, ohne Treffer |
| Orb-Pegel ohne zweites `getUserMedia`, solange Native-STT läuft | Mic stehlen für die Animation |
| Leiste: *Auf den Namen* vs. *Ich höre Sie* — nicht beides *Jarvis hört* | Wake-Label als Diktat verkaufen |
| Drive-HUD: derselbe `listenOnce`-Pfad | Zweite STT-Engine, Cloud-Speech, iOS |

TTS-Hälfte bleibt: Tool fertig **bevor** Native-Satz; `nur vorlesen` kurz.

---

## Researchphasen

### `8.0.0` Leitentscheidung

Dieses Dokument. **Done wenn:** Notizen vs Ist-Tabelle, `8.0` ≠ Recall, Blitzer ehrlich, Amazon nur nach GO, Settings-Gruppen-Tafel, Won’t-Liste, Sprint 141.

### `8.1.0` Research: Blitzer + Baustelle

1. Kandidaten: OSM Overpass, eine Community-API **mit erlaubter Nutzung**, sonst OSM-only.  
2. Typen: fest / mobil / Baustelle — was die Quelle wirklich hat.  
3. Korridor um OSRM-Polyline (nicht ganz DE pollen). Poll-Budget im Fahrmodus.  
4. Ansage wie Abbieger (ein Satz, Native), Overlay-Pin.  
**Done wenn:** GO-Quelle + Typ-Tabelle + Budget **oder** „v1 nur OSM-fest, mobil = ehrlich leer“.

### `8.2.0` Research: Steuer-Stimme + GUI-Lag

1. Ist-Pfad: wo spricht Gemini **vor** Tool-Ende? Lange Replies am Steuer?  
2. Regel: Tool-Meta `executed` → dann ≤2 Sätze. Setting `drive_speak`: `after` / `only` (nur vorlesen).  
3. Lag: Drive-Overlay, Chat-Stream, **Lage-Kugel/Körper** auf Mittelklasse-Handy (wie `6.1`). Clip, Pins, `Wo ist London` — siehe Lage-Overlay oben.  
4. Netz-Antwort: trifft `Muss man Eintritt zahlen für Venedig` die Suche? Welche Snippets (ADAC 2026 vs. alte 5-€-Meldung)?  
5. Sprachinput: Composer-Mic und Wake-Leiste *Jarvis hört* — wer hält `SpeechRecognizer`? `pauseListen` vs. `startListening` in demselben Frame? `getUserMedia` + Native-STT parallel?  
**Done wenn:** Messpunkte + konkrete Patches, keine neuen Libraries. Gold-Satz Venedig: aktuell nein, nicht fünf Euro. Mic: ein Satz kommt im Composer oder VoiceMode an.

Execute: **`8.32`** Lage. **`8.33`** Research-Aktuell. Lag-Messung der übrigen Surfaces bleibt **`8.30`**.

### `8.3.0` Research: Musik, Ordner, Preiswache

1. Amazon Music: Intent/Deep-Link vs. keine API. GO/NO-GO.  
2. Ordner: Schema `folder_id`, Default-Ordner, Export-Felder.  
3. Preiswache: Idealo/Geizhals/mydealz — was darf man pollen? Intervall, Notify-Text mit Quelle, kein € ohne Snippet.  
**Done wenn:** drei kurze Tabellen + GO/NO-GO Amazon.

### `8.4.0` Research: Settings-Karten

1. Jede der 17 Flächen: Gruppe, neuer Titel, ein Wozu-Satz, Advanced ja/nein.  
2. Deep-Link-Tabelle alt → neu.  
3. Handy-Akkordeon vs. Tablet-Zwei-Spalten (eine Skizze, kein Figma-Zwang).  
**Done wenn:** Mapping steht, keine neuen Keys, Gefahr und Debug demoted.

---

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`8.0.0`** | Leitentscheidung | **PLAN** |
| **`8.1.0`** | Research Blitzer/Baustelle | **CODE** OSM-only v1, mobil leer |
| **`8.2.0`** | Research Steuer-Stimme + Lag | **CODE** in `8.20`/`8.30` |
| **`8.3.0`** | Research Musik / Ordner / Preis | **CODE** Amazon=Intent, Ordner, Preiswache |
| **`8.4.0`** | Research Settings-Gruppen + Namen | **CODE** Mapping in `settings-ia.ts` |
| **`8.10.0`** | Blitzer+Baustelle auf der Route | **CODE** OSM-Korridor, Pins, ein Satz |
| **`8.20.0`** | Stimme: Mic/Wake hören, dann Execute, dann TTS / nur vorlesen | **CODE** |
| **`8.30.0`** | GUI/Lag Chat + Drive-HUD | **CODE** |
| **`8.32.0`** | Lage-Overlay: Clip, Pins, `Wo ist London`, Körper-Pane | **CODE** |
| **`8.33.0`** | Netz-Antwort: Jarvis-Ton, aktueller Stand (Venedig zuerst) | **CODE** |
| **`8.34.0`** | Test-Tor A: Stimme + Lage + Netz + Lag | Router **CODE**; Gerät Phasen 2–4 bleiben PO |
| **`8.12.0`** | Test-Tor Fahrt (Blitzer) | **CODE** Debug-Gruppe |
| **`8.35.0`** | Einstellungen: Gruppen, deutsche Karten, GUI | **CODE** |
| **`8.36.0`** | Test-Tor Settings | **CODE** Suche + Gruppen |
| **`8.40.0`** | Amazon-Musik-Fallback **oder** ehrlich Parking | **CODE** Intent, ehrlich wenn App fehlt |
| **`8.50.0`** | Chat-Ordner + Hausstand | **CODE** `folder_id` |
| **`8.60.0`** | Preiswache (Instanudeln zuerst) | **CODE** kein Poll ohne Research |
| **`8.61.0`** | Test-Tor Alltag-Rest (Musik/Ordner/Preis) | **CODE** |
| **`8.90.0`** | Gold, Debug-Gruppe Alltag-Zettel | **CODE** |
| **`8.95.0`** | Dauer-Zuhören härten (Wake flüssig, App/CarPlay auf) | **CODE** Wake aus = still |

---

## Chat / Stimme (Ziel)

| User | Soll |
|------|------|
| `Gibt es Blitzer?` / `Baustellen auf der Strecke` | Nur im Fahrmodus oder mit Route: Quelle + Stand, sonst „keine Route“ |
| Pin / Ansage vor der Stelle | Ein Satz Native, Typ wenn bekannt |
| `Navigier nach …` am Steuer | Route **zuerst**, dann kurzer Satz |
| `Nur vorlesen` / Setting | TTS, kein Extra-Essay |
| Mic / *Jarvis hört* / Wake | Satz kommt an (Composer oder VoiceMode). Nicht still. Wake gibt den Erkenner ab, bevor STT startet |
| `Spiel das auf Amazon` | Nach GO: App/Intent. Vorher: ehrlich, Spotify anbieten |
| `Leg den Chat in Arbeit` / Ordner in der Sidebar | `folder_id`, Liste gruppiert |
| `Sag Bescheid wenn Instanudeln im Angebot sind` | Wache anlegen, Poll opt-in, Notify mit Quelle |
| `Preiswache aus` | Wache weg, kein stilles Weiterpollen |
| `Einstellungen` / `Einstellungen Cloud` | Startkarten oder Gruppe Hirn. Alte IDs mappen |
| `Wo ist London` / `Wo liegt Kiew` | Kugel auf, Fly-to, Briefing. Nicht „Lage oder maps?“ |
| `Muss man Eintritt zahlen für Venedig` | *Aktuell nicht* + Quelle. Nicht fünf Euro als Jetzt. Zukunft nur wenn die Treffer sie nennen |
| `Körper an` / Tab Körper | Schema vollständig, Organ-Satz darunter |
| `Lage aus` / X in der Leiste | Pane zu, Chat volle Höhe. `hud_force` aus |
| Wake an + `Wie wird das Wetter?` | App nach vorn, Open-Meteo, kurzer Satz (`8.95`) |
| Wake an + `Öffne CarPlay` | Internes Overlay, nicht Apple |

## Won’t

Apple CarPlay. Live-Jagd auf Beamte. Scraping hinter Login. Preise erfinden. Automatisch kaufen. Amazon-Musik so tun als Spotify-SDK. Chat-Ordner in der Cloud. 60-fps-Idle. Neues 3D-Framework. Zweites WebGL. Geocoder-Oracle. Street-View. Google-Listen im Chat. Comune-Scraping. Zweites Hirn. Recall-Nummern klauen. Sideload in der Leitentscheidung. Play Store, iOS. Settings-Keys umbenennen nur wegen der GUI. iOS-Settings-Klon. Debug streichen. Zuhören bei Wake aus. Dauer-Upload der Stimme. Neues Speech-SDK.

## Abnahme (nach Execute)

1. Route ohne Quelle: kein erfundener Blitzer.  
2. Mit Quelle: Pin im Korridor, Stand-Satz, Typ oder ehrlich ohne Typ.  
3. Am Steuer: Tool sichtbar/ausgeführt **bevor** TTS; `nur vorlesen` = kurz. Mic/Wake: ein gesprochener Satz kommt an, nicht still.  
4. Lag-Pass: gemessene Surfaces, Motion-Budget bleibt.  
5. Amazon: GO = Intent oder Steuerfläche; NO-GO = ehrlicher Satz, Spotify bleibt.  
6. Ordner überleben Hausstand-Export/Import.  
7. Preiswache: Notify nur bei Treffer mit Quelle; ohne Research-Toggle kein stilles Netz.  
8. Einstellungen: in 10 s Hirn vs. Hausstand finden; „Modell“ nicht als erstes; Danger deutsch; Deep-Link `cloud`/`musik` trifft.  
9. Handy-Lage: ganze Kugel/Körper sichtbar, Chat nicht darunter. `Sie` nicht ohne GPS. `Wo ist London` = Fly-to. Idle ohne Dauer-rAF.  
10. Venedig-Eintritt (Stand nach 26.7.2026): *aktuell nicht*, nicht fünf Euro als Jetzt. Max 3 Sätze, Quelle, keine Google-Liste.  
11. Jedes Test-Tor: Erstnutzer / geübt / kaputt im Debug-Lauf, Phase 3–4 bis keine roten Verdicts.  
12. `8.95`: Wake an → Wetter-Satz; *Öffne CarPlay* → internes Overlay. Wake aus → kein Mithören.

Fahr-Basis: [`24-next.md`](./24-next.md) · [`28-next.md`](./28-next.md). Spotify: Settings Musik. Suche: [`28-next.md`](./28-next.md) Idealo. Notify: `notify.ts`. Recall: [`49-next.md`](./49-next.md). Index: [`42-planned.md`](./42-planned.md). Sprint: [`sprints/sprint-141.md`](./sprints/sprint-141.md).

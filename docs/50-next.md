# 50 — Alltag vom Zettel (`8.0`) **PLAN**

PO 2026-08-29: alte Notizen gefunden. Einplanen, was **nicht** schon Code oder Plan ist. Nicht neu erfinden, was `6.90` schon kann.

**Live:** Code **`6.90.0`**. Sideload **`6.90.0`**. Recall bleibt eigene Schiene [`49-next.md`](./49-next.md) `7.0`. LocateAnything-Gewichte bleiben [`41-next.md`](./41-next.md). Debug-Hintergrund bleibt `5.12`.

**Warum `8.0`, nicht `7.x`:** `7.0`–`7.30` sind Agentic Recall (Sprints 137–140). Alltag vom Zettel ist **Geschwister**, kein zweites Recall, kein 3060. Execute **darf vor Recall**, wenn der PO Alltag zuerst will.

Kein Execute in Sprint 141. Sideload bleibt **`6.90.0`**. Hausstand vor nächster APK.

---

## Notizen vs Ist

| Notiz | Ist in `6.90` | Lücke | Votum |
|-------|---------------|-------|--------|
| Blitzer + mobile Baustellen aus Blitzer-APIs | `warn.ts` = **DWD Unwetter**, nicht Tempo. Fahrmodus = OSRM + Abbieger, **keine** Kameras/Baustellen auf der Route | Neues Tool + Overlay-Pins + Ansage | **planen** |
| CarPlay verbessern: erst ausführen, dann vorlesen / nur vorlesen | Internes CarPlay **CODE** (`1.30`–`1.43`, Bühne `6.30`). `DriveMode` ruft `onCommand` (Tool läuft), **dann** `speakText`. Apple CarPlay **Won’t**. Gemini-TTS am Steuer Budget 700 ms / Native-Race 400 ms | Reihenfolge härten: Tool fertig **bevor** Satz; am Steuer **kurz** oder **nur vorlesen** (kein Essay) | **planen** (Härte, kein neues CarPlay) |
| Grafik smoother, weniger Latenz/Lag | Motion 30 fps **CODE** `6.10`. Ältere Härten: GUI `0.3`/`1.13`/`3.18.1`, Latenz `0.14`/`2.0.1`, Overlay-FPS `1.35`/`6.30` | Kein offener nächster Polish-Pass nach `6.90` | **planen** als Härte derselben Flächen, kein neues 3D |
| Alternative zur Spotify-API — Amazon Musik? | Spotify Web Playback + OAuth **CODE**. Kein Amazon Music, kein Deezer, kein Apple Music. „Amazon“ am TV = **Tizen-App**, nicht Musik | Zweiter Player nur nach Research-GO | **planen** (Research zuerst) |
| Chats in Ordner sortieren | `Conversation` = id/Titel/Daten. Chatsuche **CODE**. PC-„Ordner“ = Windows-Dateien, **nicht** Chats | `folder_id` + Sidebar + Hausstand | **planen** |
| Immer Bescheid wenn Instanudeln im Angebot — API wenn möglich | Produktsuche Idealo/Geizhals **CODE**. Rabatt-Suche mydealz **opt-in**. Erinnerungen = **Uhrzeit**, kein Preis. Watchdog = Steckdose/Termin, nicht Shop | Preiswache: merken + pollen + Notify, € nur aus Treffer | **planen** |
| Einstellungen unübersichtlich, unverstanden, GUI schwach | 17 gleichrangige Themen in einer Leiste (`SettingsScreen.tsx`). Hinweise Jargon: Delight, Memory, Tizen, Ausblick. Cloud mixt Gemini+Groq+Tanke+OMDb. „Modell“ = 0,5B-Fallback, steht oben. Haus ≠ Hausstand. Ton ≠ Stimme. Gefahr heißt „Danger Zone“. Keine Suche, kein Status auf der Leiste. Flaches Panel ist **CODE** seit `0.7`/`1.25` — die **Menge** ist das Problem, nicht ein fehlendes Screen | Gruppen + deutsche Wozu-Sätze + bessere Karten. Keys bleiben | **planen** (`8.35`) |

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
| Am Steuer erst tun, dann sprechen | Tool-Execute endet, **dann** 1–2 Sätze Native-TTS. Kein Gemini-Film vor dem Klick | **ja** |
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
| Stimme am Steuer | **Execute → dann Native-TTS.** Phrase/Setting `nur vorlesen`: kurzer Satz, kein Gemini-Essay. Abbieger bleiben Native wie heute. |
| Grafik | Spike messen, dann bestehende Motion/Overlay/Stream. Kein neues Framework, kein 60-fps-Idle. |
| Einstellungen | **Gruppen statt 17 Peers.** Deutsch, ein Wozu-Satz pro Karte. Alltag oben, Werkstatt unten. Keys unverändert. Deep-Links der alten IDs halten. |
| Musik | Spotify bleibt. Amazon nur Fallback nach GO. |
| Ordner | IndexedDB + Hausstand. Kein Cloud-Sync. |
| Preiswache | Opt-in. Poll nur mit Erlaubnis. € nur aus Snippet. Instanudeln = erstes Beispiel, nicht einziges Produkt. |
| Notify | Bestehendes `notify.ts`. Kein zweites Push-Produkt. |
| Sideload | Nicht in `8.0`–`8.60`. Hausstand vorher. |
| Recall / 3060 | Unabhängig. |

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

## Researchphasen

### `8.0.0` Leitentscheidung

Dieses Dokument. **Done wenn:** Notizen vs Ist-Tabelle, `8.0` ≠ Recall, Blitzer ehrlich, Amazon nur nach GO, Won’t-Liste, Sprint 141.

### `8.1.0` Research: Blitzer + Baustelle

1. Kandidaten: OSM Overpass, eine Community-API **mit erlaubter Nutzung**, sonst OSM-only.  
2. Typen: fest / mobil / Baustelle — was die Quelle wirklich hat.  
3. Korridor um OSRM-Polyline (nicht ganz DE pollen). Poll-Budget im Fahrmodus.  
4. Ansage wie Abbieger (ein Satz, Native), Overlay-Pin.  
**Done wenn:** GO-Quelle + Typ-Tabelle + Budget **oder** „v1 nur OSM-fest, mobil = ehrlich leer“.

### `8.2.0` Research: Steuer-Stimme + GUI-Lag

1. Ist-Pfad: wo spricht Gemini **vor** Tool-Ende? Lange Replies am Steuer?  
2. Regel: Tool-Meta `executed` → dann ≤2 Sätze. Setting `drive_speak`: `after` / `only` (nur vorlesen).  
3. Lag: Drive-Overlay, Chat-Stream, Lage-Wechsel auf Mittelklasse-Handy (wie `6.1`).  
**Done wenn:** Messpunkte + konkrete Patches, keine neuen Libraries.

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
| **`8.1.0`** | Research Blitzer/Baustelle | geplant |
| **`8.2.0`** | Research Steuer-Stimme + Lag | geplant |
| **`8.3.0`** | Research Musik / Ordner / Preis | geplant |
| **`8.4.0`** | Research Settings-Gruppen + Namen | geplant |
| **`8.10.0`** | Blitzer+Baustelle auf der Route | nach `8.1` GO |
| **`8.20.0`** | Execute-dann-sprechen / nur vorlesen | nach `8.2` |
| **`8.30.0`** | GUI/Lag-Härte Chat/Overlay/Lage | nach `8.2` |
| **`8.35.0`** | Einstellungen: Gruppen, deutsche Karten, GUI | nach `8.4` |
| **`8.40.0`** | Amazon-Musik-Fallback **oder** ehrlich Parking | nach `8.3` GO |
| **`8.50.0`** | Chat-Ordner + Hausstand | nach `8.3` |
| **`8.60.0`** | Preiswache (Instanudeln zuerst) | nach `8.3` |
| **`8.90.0`** | Gold, Debug-Gruppe Alltag-Zettel | nach den Executes |

---

## Chat / Stimme (Ziel)

| User | Soll |
|------|------|
| `Gibt es Blitzer?` / `Baustellen auf der Strecke` | Nur im Fahrmodus oder mit Route: Quelle + Stand, sonst „keine Route“ |
| Pin / Ansage vor der Stelle | Ein Satz Native, Typ wenn bekannt |
| `Navigier nach …` am Steuer | Route **zuerst**, dann kurzer Satz |
| `Nur vorlesen` / Setting | TTS, kein Extra-Essay |
| `Spiel das auf Amazon` | Nach GO: App/Intent. Vorher: ehrlich, Spotify anbieten |
| `Leg den Chat in Arbeit` / Ordner in der Sidebar | `folder_id`, Liste gruppiert |
| `Sag Bescheid wenn Instanudeln im Angebot sind` | Wache anlegen, Poll opt-in, Notify mit Quelle |
| `Preiswache aus` | Wache weg, kein stilles Weiterpollen |
| `Einstellungen` / `Einstellungen Cloud` | Startkarten oder Gruppe Hirn. Alte IDs mappen |

## Won’t

Apple CarPlay. Live-Jagd auf Beamte. Scraping hinter Login. Preise erfinden. Automatisch kaufen. Amazon-Musik so tun als Spotify-SDK. Chat-Ordner in der Cloud. 60-fps-Idle. Neues 3D-Framework. Zweites Hirn. Recall-Nummern klauen. Sideload in der Leitentscheidung. Play Store, iOS. Settings-Keys umbenennen nur wegen der GUI. iOS-Settings-Klon. Debug streichen.

## Abnahme (nach Execute)

1. Route ohne Quelle: kein erfundener Blitzer.  
2. Mit Quelle: Pin im Korridor, Stand-Satz, Typ oder ehrlich ohne Typ.  
3. Am Steuer: Tool sichtbar/ausgeführt **bevor** TTS; `nur vorlesen` = kurz.  
4. Lag-Pass: gemessene Surfaces, Motion-Budget bleibt.  
5. Amazon: GO = Intent oder Steuerfläche; NO-GO = ehrlicher Satz, Spotify bleibt.  
6. Ordner überleben Hausstand-Export/Import.  
7. Preiswache: Notify nur bei Treffer mit Quelle; ohne Research-Toggle kein stilles Netz.  
8. Einstellungen: in 10 s Hirn vs. Hausstand finden; „Modell“ nicht als erstes; Danger deutsch; Deep-Link `cloud`/`musik` trifft.

Fahr-Basis: [`24-next.md`](./24-next.md) · [`28-next.md`](./28-next.md). Spotify: Settings Musik. Suche: [`28-next.md`](./28-next.md) Idealo. Notify: `notify.ts`. Recall: [`49-next.md`](./49-next.md). Index: [`42-planned.md`](./42-planned.md). Sprint: [`sprints/sprint-141.md`](./sprints/sprint-141.md).

# 43 — Weltkugel in der Lage (`5.0`) **CODE**

PO 2026-08-27: 3D-Weltkugel, Satellitenbilder so aktuell wie möglich, Nachrichten einbauen — und **die Tools, die es schon gibt**, nicht neu erfinden. Inspiration, nicht Kopie:

https://www.instagram.com/reel/DcgfA4ojF7a/

Caption dort: „Kommentiere Jarvis wenn du das auch willst. **Andere werden beobachtet. Ich werde gebrieft.**“ Hashtags claude / ki / jarvis / ironmantri. Derselbe Autor wie Körper-Reel (`moritz.maaker`).

**Live:** Code **`4.53.0`**. Sideload **`3.18.1`**. Weltlage `outlook` ist **CODE**. ISS/Mond `sky`, OpenSky `flights`, Tagesschau `news`, DWD `warn`, GPS `here` sind **CODE**. Körper-3D ist **PLAN** [`40-next.md`](./40-next.md) `4.66`. LocateAnything ist **PLAN** [`41-next.md`](./41-next.md) `4.76`.

**Warum `5.0`, nicht `4.100`:** In [`09-versioning.md`](./09-versioning.md) sind `4.66`–`4.75` Körper und `4.76`–`4.99` LocateAnything. Nächster Produktsprung nach `4.99` ist **MAJOR `5.0`**. Kein zweites `4.66`.

Kein Execute in diesem Sprint. Research zuerst. Sideload nach Hausstand-Export.

## Kurz: was wir konkret bauen (und was nicht)

| Aus dem Video | Bei uns | Votum |
|---------------|---------|-------|
| 3D-Kugel, drehbar | Lage-Sicht **Kugel**, dieselbe WebView wie Körper | **ja** |
| Satelliten-Look | Default: NASA Blue Marble (statisch) + **errechneter** Tag/Nacht-Terminator | **ja** |
| „Live“-Erde | Optional NASA **GIBS** MODIS True Color, Stand **stundenweise**, Zeitstempel sichtbar | **ja**, ehrlich |
| Briefing beim Antippen | Pin öffnet den **bestehenden** Tool-Satz (outlook/news/ISS/…), TTS wie heute | **ja** |
| Nachrichten auf der Kugel | Pins aus `outlook`/`news` + kleines Ortslexikon, keine erfundenen Koordinaten | **ja** |
| „Andere werden beobachtet“ | Überwachung, Personen, 1700 Starlink-Punkte | **Won’t** |
| Cinematic EarthOS / 60 fps Idle | Akku in der APK | **Won’t** als Default |
| Zweites Hirn am PC, Claude-Briefing | Hirn bleibt Handy | **Won’t** |

**Anders als das Video (bewusst):** keine Überwachung, keine Fake-Livecam, keine Satelliten-Schwärme. Jarvis brieft **Sie** mit Quellen, die er schon hat — er beobachtet keine anderen.

## Ehrlichkeit: was „live Satellit“ wirklich ist

| Was Leute meinen | Was frei und ehrlich geht | Delay |
|------------------|---------------------------|--------|
| Live-Video von der Erde wie eine Webcam | Gibt es öffentlich nicht in der APK | — |
| Foto der Erde „jetzt“ | NASA GIBS WMTS, MODIS/VIIRS True Color, NRT oft **innerhalb ~3,5 h** nach Aufnahme ([GIBS](https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/)) | Stunden, **Stand sagen** |
| Position der ISS | `sky.ts` → Where The ISS At | Sekunden (CODE) |
| Flugzeuge überm Haus | `flights.ts` → OpenSky ADS-B | Minuten, unvollständig (CODE) |
| Schlagzeilen | `news.ts` / `outlook.ts` Tagesschau + DW | Minuten–Stunden, **Text** nicht Foto (CODE) |
| Unwetter | `warn.ts` DWD | amtliche Warnung, kein Live-Radar (CODE) |
| Sie selbst auf der Kugel | GPS `here` | live, wenn Freigabe (CODE) |

GIBS-Kacheln liefern `access-control-allow-origin: *` (2026-08-27 geprüft). GetCapabilities ist groß — **Layer-IDs fest im Code**, nicht jedes Mal Capabilities laden. Wolkenlücken und Nahtstellen sind echte Satellitenartefakte, kein Bug zum Wegretuschieren.

Default-Textur bleibt **Blue Marble** (eine Datei, kein Dauer-HTTP). GIBS ist Opt-in, weil Kacheln Datenvolumen und Akku kosten.

## Was schon da ist — mergen, nicht neu erfinden

| Pin / Inhalt | Ist | Datei |
|--------------|-----|--------|
| Weltlage-Text | Tagesschau/DW, Tags Hormus/Ukraine/OPEC/EZB/Asien/Öl, Serie, Szenario | `outlook.ts`, `outlook-tags.ts` |
| Lage-Kachel Welt | eine Zeile `last_outlook_line` | `Lage.tsx` `id === 'world'` |
| Nachrichten | Tagesschau national + Ortssuche | `news.ts` |
| ISS | Lat/Lon | `sky.ts` |
| Flüge | OpenSky-Box um GPS | `flights.ts` |
| Unwetter | DWD Gemeinden | `warn.ts` |
| Sie | GPS | `here.ts` |
| Wetter | Open-Meteo | `weather` / HUD |
| 3D in der APK | geplant als Körper-Schema | [`40-next.md`](./40-next.md) `4.67` Spike |

Lücke: die Weltlage ist eine **Textkachel**. Es gibt keine Kugel und keine Pins. Der User sieht „Welt“ als Satz, nicht als Ort.

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Eine** Lage-Sicht **Kugel**, Geschwister von Körper und Wetterstatistik. Chat bleibt. |
| Ort | APK-WebView. Kein Unity, kein EarthOS-Klon, kein PC-Pflicht-Fenster. |
| Daten | Nur Pins aus vorhandenen Tools + festem Ortslexikon. Fehlt Koordinate → **kein Pin**, Satz in der Kachel. |
| Textur v1 | Blue Marble + Terminator aus Uhrzeit/Lon. Kein „Live“-Label. |
| Textur v2 | GIBS True Color, Label **„Stand YYYY-MM-DD, oft Stunden alt“**. Default aus. |
| Tap | Pin füllt die mittlere Karte **und** darf denselben Handler rufen wie der Chat (`outlook`, `news`, `sky`, …). Das ist **kein** neues LLM. 0,5B wählt das nicht. |
| Körper vs Kugel | Zwei Sichten, **ein** WebGL-Budget. Spike `4.67` gilt auch hier. Nicht zwei Three.js-Welten gleichzeitig rendern. |
| LocateAnything | Unabhängig (PC). Kugel wartet nicht auf 3060-GO. |
| Router | `Kugel an` / `Zeig die Erde` / `Weltkugel` = HUD-Intent, Register, kein `if` in `chat.ts`. |
| Look | Spotify-dunkel, deutsch, wenig Punkte. Reduced-motion oder WebGL tot → **2D-Karte** dieselben Pins. |
| Sideload | Nicht in `5.0`. Hausstand [`38`](./38-next.md) vor APK. |

## Ortslexikon (kein Geocoder-Orakel)

Pins nur, wenn der Ort **in einer kurzen Tabelle** steht. Unbekannt → Text ohne Punkt.

V1 (an `outlook-tags` andocken):

| Tag / Name | Koordinate (ungefähr) |
|------------|------------------------|
| Hormus | 26.6° N, 56.3° O |
| Kiew / Ukraine | 50.5° N, 30.5° O |
| EZB / Frankfurt | 50.1° N, 8.7° O |
| OPEC (Wien, Sitz) | 48.2° N, 16.4° O |
| Berlin, Washington, Peking, Moskau, Teheran, … | kleine feste Liste (~40), Research `5.2` |

Asien als ganzer Kontinent = **kein** Pin (zu grob). Öl ohne Ortsbezug = kein Pin.

Research `5.2` prüft, ob die Tagesschau-JSON schon Regionen/Tags hat, die wir mappen können — ohne Google-Geocoding.

## Vom Video vs. etwas anderes

**Aus dem Video (zuschneiden):** drehbare Kugel, Antippen = Briefing, Satelliten-Optik, News sichtbar.

**Anders, und das ist der Jarvis-Teil:**

1. **Briefing = zitierte Tools**, nicht Cinematic-Voiceover ohne Quelle. Tap Hormus → bestehende outlook-Kette, Tap ISS → bestehender ISS-Satz.
2. **Terminator statt Fake-Livecam.** Tag/Nacht wandert mit der Uhr, ohne neue Satellitenbilder.
3. **ISS als bewegter Pin** (API existiert). Das Video zeigt oft „die Erde von außen“ — wir können **ein** echtes Objekt darauf setzen, das wir schon kennen.
4. **OpenSky nur um Sie herum**, nicht 10 000 Flüge weltweit (Akku, API-Limit, keine Überwachung).
5. **GIBS mit Zeitstempel**, wenn Satellitenfoto gewünscht — ehrlicher als jedes Reel.

Falls der WebGL-Spike auf dem Handy scheitert: **Could** statt 3D eine 2D-Weltkarte in derselben Sicht (gleiche Pins). Kein EarthOS.

## Researchphasen

### `5.0.0` Leitentscheidung

Dieses Dokument. **Done wenn:** Kugel = Lage-Sicht, Tools mergen, GIBS ehrlich, Won’t Überwachung, Version `5.0` nicht `4.66`.

### `5.1.0` Research: WebGL mit Körper teilen

1. Denselben Spike wie `4.67`: Library, Pixel-Ratio-Kappe, Render nur bei Drag/Pin-Update, Pause wenn Sicht weg.  
2. Eine Kugel = eine Sphere + Textur, keine Atmosphären-Shader-Demo.  
3. Körper und Kugel nie beide 3D gleichzeitig.  
**Done wenn:** ja/nein 3D-Default, Fallback 2D, gemeinsame Budget-Zahl (Meshes, fps-Ziel ≠ 60 Idle).

### `5.2.0` Research: Pins aus Ist-Tools

1. Welche Felder liefern `outlook`/`news` schon (Titel, URL, Tags)? Was fehlt für Lat/Lon?  
2. Ortslexikon-Länge. Unmapped → kein Pin.  
3. ISS-Poll: Sicht Kugel sichtbar → z. B. 30–60 s, sonst 0. OpenSky nur mit GPS und nur Nachbarbox wie `flights.ts`.  
**Done wenn:** Pin-Typen-Tabelle + Poll-Budget.

### `5.3.0` Research: GIBS „so aktuell wie möglich“

1. Eine Layer-ID (True Color), REST-URL, TIME=heute minus Puffer wenn Kachel 404.  
2. Wie viele Kacheln für eine Kugel-Textur (nicht WMTS-Globo in 20 Zoomstufen). Eine niedrige Auflösung reicht.  
3. Cache + „Stand …“. CORS bleibt prüfen in der **WebView**, nicht nur curl.  
4. Default **aus**.  
**Done wenn:** eine Textur-Pipeline oder „GIBS später, v1 nur Blue Marble“.

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`5.0.0`** | Leitentscheidung + Lage-Sicht Kugel | **CODE** in `5.11.0` |
| **`5.1.0`** | Research WebGL-Budget mit `4.67` | **CODE** als Canvas-Kugel, nicht Two-WebGL |
| **`5.2.0`** | Research Pins + Lexikon | **CODE** (`globe-geo.ts`) |
| **`5.3.0`** | Research GIBS / Blue Marble | v1 Schema+Terminator **CODE**; GIBS bleibt Opt-in später |
| **`5.4.0`** | HUD-Sicht `globe` + `Kugel an/aus` | **CODE** |
| **`5.5.0`** | Kugel v1: Terminator, GPS-Pin | **CODE** |
| **`5.6.0`** | Pins ISS + DWD wenn Warnung | **CODE** (OpenSky-Nachbar später) |
| **`5.7.0`** | Pins outlook/news über Lexikon | **CODE** |
| **`5.8.0`** | Tap = Pin-Kachel + Gold | **CODE** |
| **`5.9.0`** | Optional GIBS-Textur mit Stand | **PLAN** Execute in `6.20` Sprint 123 [`45-next.md`](./45-next.md) |
| **`5.10.0`** | Reduced-motion, Sideload nach `4.52` | Reduced-motion **CODE**, Sideload geplant |

## Chat / Stimme (Ziel)

| User | Soll |
|------|------|
| `Kugel an` / `Zeig die Erde` / `Weltkugel` | Lage-Sicht Kugel, Chat bleibt |
| Tippen auf Hormus / Kiew / ISS | bestehender Tool-Satz, Quelle bleibt |
| `Kugel aus` | vorige Lage |
| `Was ist die Weltlage?` | `outlook` wie heute, Kugel muss nicht offen sein |
| `Wo ist die ISS?` | `sky` wie heute; auf der Kugel nur extra Pin |
| `Satelliten live` | ehrlich: Foto-Stand oder „kein Live-Video“ |
| `Zeig mir London` / `Zeig Paris` | **PLAN** `6.20`: drehen, zoomen, Name |
| `Was ist das für eine Stadt?` (Kugel offen) | **PLAN** `6.20`: Blickmitte gegen Lexikon |

## Settings

Thema **Lage** oder **Kugel**: Sicht an/aus, 3D oder 2D, GIBS an/aus mit Hinweis Datenvolumen. Kein zweites Modell.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/globe-parse.ts` | `Kugel an/aus`, Aliase Erde/Weltkugel |
| `frontend/src/engine/globe-geo.ts` | Ortslexikon, Tag → Lat/Lon |
| `frontend/src/engine/hud-parse.ts` | Sicht-Flag oder Katalog, nicht 80 neue Kacheln |
| `frontend/src/Lage.tsx` | Sicht Kugel neben Körper |
| `frontend/src/GlobeView.tsx` (Ziel) | Sphere, Terminator, Pins, Pause |
| `frontend/src/engine/hud.ts` | Snap: Pins aus last_outlook / ISS-Cache / GPS |
| Tests | parse + Lexikon; **nicht** `registry.ts` importieren |

Bestehende Handler (`outlook.ts`, `news.ts`, `sky.ts`, `flights.ts`, `warn.ts`, `here.ts`) bleiben die Quelle. Die Kugel **zeigt** sie.

## Won’t

Überwachung / „andere beobachten“. Starlink- oder Satelliten-Schwarm. Fake-Livecam. 60-fps-Idle. Zweites Hirn auf dem PC. EarthOS/Worldlens-Klon. Militär-Tracker. Gesicht auf der Kugel. Google-Geocoding-Orakel. Aktien-Orakel auf der Kugel. Körper-Schema ersetzen. LocateAnything-Gewichte in der APK. Play Store, iOS.

## Abnahme

1. `Kugel an`: drehbare Erde oder 2D-Fallback, GPS-Pin nur mit Freigabe, Composer bleibt.  
2. ISS-Pin nur mit echter Koordinate; fehlt API → kein Punkt, Satz ehrlich.  
3. News-Pin nur mit Lexikon-Treffer; unmapped bleibt Text.  
4. Tap ruft keinen neuen Modell-Pfad; Antwort zitiert wie das Tool heute.  
5. Kein „Live“-Wort auf Blue Marble. GIBS (wenn an) zeigt Stand-Datum.  
6. Körper-Sicht und Kugel-Sicht nicht gleichzeitig 3D.  
7. Reduced-motion: 2D, dieselben Pins.

Körper: [`40-next.md`](./40-next.md). Sehen: [`41-next.md`](./41-next.md). Index: [`42-planned.md`](./42-planned.md). Sprint: [`sprints/sprint-119.md`](./sprints/sprint-119.md).

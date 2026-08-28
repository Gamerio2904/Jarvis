# 48 — Globus-Briefing (`6.70`) **PLAN**

PO 2026-08-28: Reel als **Zielbild für die Kugel**, zuschneiden, nicht kopieren.

https://www.instagram.com/reel/DY7VsZItwtR/

Account: **moritz.maaker** (derselbe Autor wie Körper [`40-next.md`](./40-next.md) und Kugel [`43-next.md`](./43-next.md)).

Caption (sinngemäß, ohne Tracking-Kram):

> Kommentiere JARVIS, dann zeig ich dir das Setup. **Mein Mitarbeiter hat Zugriff auf Satelliten. Ich sage eine Stadt, er zoomt rein und brieft mich. Politik, Märkte, Anomalien. Er sieht, ich plane.**

Hashtags dort: claude / ki / jarvis / ironmantri.

**Nicht** [`43-next.md`](./43-next.md) / [`45-next.md`](./45-next.md): dort ist die Kugel **da** (drehen, GIBS beim Finger-Zoom, `Zeig London` = Lexikon-Satz). Dieses Reel ist der **nächste Sinn** derselben Sicht: Satellit **beim Satz** + Briefing aus **bestehenden** Tools.

**Ist:** Code **`6.60.0`**. Sideload **`6.60.0`**. Hirn Gemini zuerst. Kugel CODE. `Zeig London` dreht auf Zoom **2.15**. GIBS beginnt erst ab Zoom **3.8**. Fly-to bleibt also auf Blue Marble. Die Kachel nach Pin ist `pin.line` oder ein Hint-Text, kein Politik/Markt/Unwetter-Satz.

Kein Execute in Sprint 131. Research vor Satelliten-Tiefe und EONET. Sideload nicht in `6.70`. LocateAnything und Debug-Service bleiben eigene Schienen.

## Reel — was dort wirklich steht

Das Video **verspricht** vier Dinge, die Marketing oft vermischt:

| Versprechen im Clip | Was das technisch ist | Bei uns |
|---------------------|------------------------|---------|
| Zugriff auf Satelliten | Öffentliche NASA-Kacheln, **Stunden** alt, kein Geheimdienst, kein Live-Video | **ja, so** — GIBS True Color, Stand-Datum. Kein „Live“. |
| Stadt sagen → reinzoomen | Fly-to + Zoom **in** die Satellitenlage, nicht nur die Kugel drehen | **ja** — das fehlt heute: Zoom 2.15 liegt unter 3.8 |
| Brieft Politik, Märkte, Anomalien | Zitierte Meldungen + Serie + Unwetter/Ereignis **am Ort**, keine Hellseherei | **ja, mergen** — `news` / `outlook` / `warn` / ISS. Keine Aktien-Orakel. |
| Er sieht, ich plane | Im Reel: Mitarbeiter schaut zu, während der User plant | **zuschneiden** — nur **Ihr** Kalender/Memory/Todo **zu diesem Ort**. Keine Überwachung, kein Bildschirm-Mitschnitt. |

Kommentare unter dem Reel sind „Jarvis bitte“ — kein Produkt-Ist.

## Kurz: Zielbild (und was nicht)

| Aus dem Video | Bei uns | Votum |
|---------------|---------|-------|
| Satellit nach dem Stadtnamen | `Zeig London` fliegt **in GIBS** (Zoom ≥ 3.8, eher ~4.4). Stamp „Stand Datum, oft Stunden alt“ | **ja** |
| 2D wenn sehr nah | Schon CODE ab Zoom 5.2 — Fly-to darf dort landen, Reduced-Motion gleich | **ja** |
| Briefing gesprochen + im Chat | Dieselben Sätze wie Tools heute, Gemini darf schleifen, **keine neuen Zahlen/Orte** | **ja** |
| Politik | Tagesschau-Ortssuche (`news` place) + outlook-Tags wenn der Ort in der Tabelle ist (Kiew, Hormus, Washington, Frankfurt/EZB, Wien/OPEC) | **ja** |
| Märkte | Öl/E10/FX **nur** wenn der Ort zur Kette gehört (Hormus, OPEC, EZB). Sonst ehrlich: keine Markt-Zahl für diese Stadt | **ja** |
| Anomalien | DWD wenn DE-Ort; ISS wenn in der Sicht; optional EONET nach Research. Leer = ehrlich nichts | **ja** |
| „Er sieht, ich plane“ | Treffer in **Ihrem** Kalender / Memory / Todos / Losgehen **mit diesem Ortsnamen**. Sonst weglassen, nicht raten | **ja**, eng |
| Live-Webcam / Street-View / Gebäude-3D | Gibt es in der APK nicht ehrlich | **Won’t** |
| Andere beobachten, Starlink-Schwarm | Überwachung | **Won’t** |
| Aktien kaufen/verkaufen, „fällt morgen“ | Standing outlook | **Won’t** |
| Zweites Hirn Claude am PC | Hirn bleibt Handy, Gemini-Key | **Won’t** |
| Jedes Dorf der Welt | Lexikon bleibt Tabelle, kein Geocoder-Orakel | **Won’t** |

**Anders als das Video (bewusst):** Jarvis brieft **Sie** mit Quellen, die er schon hat. Er hat kein privates Satellitennetz. Er sieht nicht, was andere tun.

## Ist vs. Lücke (Code `6.60.0`)

| Fläche | Ist | Lücke zum Reel-Ziel |
|--------|-----|---------------------|
| `Zeig London` | `hud` pin, Fly-to Zoom **2.15**, Satz `Das ist London, …` aus `PLACES.blurb` | Zoom unter GIBS-Schwelle → **kein Satellit** nach dem Satz |
| Finger-Zoom | GIBS ab 3.8, 2D-Karte ab 5.2, Kappe Zoom 8, Tile-Z max 7 | Nur per Geste, nicht per Fly-to |
| Pin-Tap | speichert Focus, Kachel = `pin.line` oder Hint | kein Tool-Briefing |
| Nachrichten | `news.ts` Ortssuche Tagesschau, sonst Netz ehrlich | nicht an `Zeig Stadt` gehängt |
| Weltlage | `outlook.ts` Tags + Öl/FX-Serie, kein Orakel | nicht an Stadt gebunden außer Tag-Pins |
| Unwetter | `warn.ts` DWD Gemeinden | nicht nach Fly-to |
| ISS | `sky.ts` Pin | nicht als „Anomalie in der Sicht“ formuliert |
| Ihr Plan | Kalender, Memory, Todos, Losgehen CODE | Kugel liest das nicht |
| GIBS-Layer | `MODIS_Terra_CorrectedReflectance_TrueColor` Level9 | Stadt bleibt grob — kein Street-View vortäuschen |

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | Dieselbe Lage-Sicht **Kugel**. Kein zweites EarthOS, kein Unity, kein PC-Fenster. |
| Ziel-Satz | `Zeig *Stadt*` = drehen, **in Satellit zoomen**, dann **ein Briefing** aus vorhandenen Tools. |
| Satellit | NASA GIBS, Stunden alt, Datum sichtbar. Fly-to-Zielzoom **über** `GIBS_ZOOM_IN` (3.8), unter Street-View. Vorschlag Execute: **4.4** (GIBS-Disk), Pinch darf weiter bis 8 / 2D. |
| Unbekannt | Wie heute: „Den Ort habe ich auf der Kugel nicht.“ Kein Geocoder. |
| Briefing-Reihenfolge | 1) Name + Lexikon-Halbsatz. 2) Politik: Tagesschau-Ort, sonst ehrlich leer. 3) Markt nur bei Hormus/OPEC/EZB-Kette. 4) Anomalie nur mit Quelle. 5) Ihr Plan nur bei Treffer. Fehlende Teile **weglassen**, nicht füllen. |
| Länge | 2–5 Sätze. Gemini-Schliff mit bestehendem Guard (keine neuen Zahlen/Orte). TTS liest denselben Text. |
| Märkte | Keine Aktie, kein „kaufen Sie“. Öl/Benzin/Euro wie `outlook` — nur wenn der Ort in der Kette liegt. |
| Anomalien | Keine erfundenen Hotspots. DWD, ISS, nach Research evtl. NASA EONET (Naturereignis mit Koordinate). Keine Personen, keine Schiffe weltweit, kein Radar-Film. |
| Plan-Kontext | Nur lokale Stores. „In London steht Dienstag …“ wenn der Eintrag den Ortsnamen trägt. Sonst still. **Won’t:** Screenshot, Clipboard, „ich sehe Sie planen“. |
| Parser | Bleibt `hud` pin/look. Kein neues Tool, kein `if` in `chat.ts`. Briefing **in** `handleHud` nach Fly-to. |
| Sir | Selten, nicht jeder Globus-Satz. |
| Akku | 30 fps Standing. Reduced-Motion: Sprung ohne Flug, dieselben Kacheln. |
| Sideload | Nicht in `6.70`–`6.81`. Hausstand vor nächster APK. |

## Ehrlichkeit: Satellit und „Anomalie“

| Was Leute meinen | Was frei und ehrlich geht | Delay |
|------------------|---------------------------|--------|
| Live-Video wie Google Earth | Gibt es öffentlich nicht in der APK | — |
| Satellit nach „Zeig London“ | GIBS True Color, Zoom in Level9, **Stand Datum** | Stunden |
| Politik in London | Tagesschau-Suche / DW, sonst „nichts von der Tagesschau“ | Minuten–Stunden, **Text** |
| Märkte in New York | Keine NYSE-Live-Zahl. Öl/FX nur Kette | wie outlook |
| Anomalie | DWD-Warnung, ISS-Pin, optional EONET | Quelle sagen |
| Er sieht meinen Bildschirm | Nicht. Nur was Sie Jarvis schon gegeben haben | — |

## Research (vor Execute der Fläche)

| Version | Frage | Grün wenn |
|---------|-------|-----------|
| `6.71` | Fly-to-Zoom 4.4 auf dem Handy: GIBS-Disk sichtbar, Akku ok, Stamp da | `Zeig London` zeigt Satellit, nicht nur Blue Marble |
| `6.71` | Tile-Z 7 vs 8/9: Stadt erkennbar, nicht Street | London als Stadt-Fleck, keine Hausnummern behauptet |
| `6.71` | VIIRS vs MODIS | nur wechseln wenn schärfer **und** CORS/Akku gleich; sonst MODIS lassen |
| `6.72` | Tagesschau-Ort + outlook-Tag am selben Turn, Timeout | ein Reply, keine doppelten Tools im Chat |
| `6.73` | EONET JSON in der WebView | GO: Pins in der Sicht mit Quelle. NO-GO: weglassen, kein Fake |
| `6.73` | Kalender/Memory-Match nur exakter Ortsname / Lexikon-Name | Zahnarzt ohne Ort bleibt still |

## Sprints

| Sprint | Version | Inhalt |
|--------|---------|--------|
| 131 | `6.70.0` | Leitentscheidung (dieses Dokument) — **CODE** (Docs) |
| 132 | `6.71.0` | Research Zoom-Tiefe / GIBS / EONET |
| 133 | `6.80.0` | Execute: Fly-to in Satellit + Stadt-Briefing (Politik, Markt-Kette) |
| 134 | `6.81.0` | Anomalien ehrlich + Ihr Plan am Ort |
| 135 | `6.90.0` | Gold, Debug-Gruppe, Härten — **kein** Sideload |

`5.12` und LocateAnything `4.77` daneben. Welt-Geocoder bleibt Won’t.

## Gold (Abnahme)

1. `Zeig mir London` → Kugel dreht, Zoom **in GIBS**, Stamp mit Datum. Satz beginnt mit London, plus Tagesschau **oder** ehrlich keine Meldung. Kein Live-Wort.
2. `Zeig Hormus` → Satellit + outlook-Öl-Kette (Brent nur mit Quelle), kein Aktien-Rat.
3. `Zeig Ingersheim` → Satellit + DWD wenn Warnung, **keine** erfundenen Weltmarkt-Zahlen.
4. Unbekannter Name → kein Fly-to-Satellit, ehrlicher Satz wie heute.
5. `Was ist das für eine Stadt?` nach Fly-to London → London, nicht Meer (Standing `6.50`).
6. Kalender „Dienstag London“ → ein Satz „Sie haben … in London.“ Fehlt der Eintrag → kein erfundenes Meeting.
7. Reduced-Motion: Zielzoom ohne Dauerspin, Briefing gleich.
8. Captcha / Beobachten / Street View weiter Won’t.

## Won’t

Live-Satellitenvideo. Street-View. Gebäude-Mesh. Überwachung. Starlink-Schwärme. Aktien-Orakel. Geocoder aller Dörfer. Claude am PC. 60 fps Idle. 1,5B lokal. Sideload in dieser Schiene. EONET-Fake wenn der Spike NO-GO ist.

## Stories

| ID | Inhalt |
|----|--------|
| G1 | Fly-to-Zielzoom ≥ GIBS, Stamp, 2D wenn sehr nah |
| G2 | `Zeig *Stadt*` Briefing: Lexikon + news-Ort + outlook-Tag |
| G3 | Markt-Sätze nur Kette, sonst weglassen |
| G4 | Anomalie: DWD / ISS / EONET-GO |
| G5 | Plan-Kontext aus Kalender/Memory/Todo |
| G6 | Pin-Tap = dasselbe Briefing wie der Satz |
| G7 | Debug-Gruppe Globus-Briefing, Gold hält `6.50` |

## Reihenfolge vs. Reste

1. Dieses Ziel — Globus-Briefing `6.70`.
2. LocateAnything-Gewichte nach 3060-GO.
3. Debug-Service `5.12`.
4. Parking: Mail, Cloud-Kalender, Play Store, iOS.

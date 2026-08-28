# 48 — Globus-Briefing (`6.90`) **CODE**

PO 2026-08-28: Reel als **Zielbild für die Kugel**, zuschneiden, nicht kopieren.

Stadt-Briefing: https://www.instagram.com/reel/DY7VsZItwtR/

**Nachzug Nachrichten-Tour** (PO 2026-08-28): https://www.instagram.com/reel/DZSsz-9t7aE/

Account beide: **moritz.maaker**. Zweites Reel-Caption (sinngemäß): *Vierzig Sekunden Welt-Brief. Aus Quellen, die in deutschen Hauptmedien nicht laufen.* Das **Quellen-Versprechen kopieren wir nicht** — bei uns Tagesschau + DW, Stand sagen. **Übernehmen:** `Was ist heute so auf der Welt passiert` → weltpolitisch wichtige Länder **leuchten**, Seite zeigt die Meldung, kurzer Satz was dort passiert, **nacheinander** auf das Land zoomen, Überblick.

**Ist:** Code **`6.90.0`**. Sideload **`6.60.0`**. Hirn Gemini zuerst. `Zeig London` fliegt auf Zoom **4.4** (GIBS ab **3.8**). Stadt-Briefing + Welt-Tour **CODE**. Phrase `was ist heute so auf der Welt passiert` → `outlook` world + Tour. Glow-Scheiben am Länder-Centroid, max 5 Stops. EONET optional, bei Fehler still.

## Reel — was dort wirklich steht

Das Video **verspricht** vier Dinge, die Marketing oft vermischt:

| Versprechen im Clip | Was das technisch ist | Bei uns |
|---------------------|------------------------|---------|
| Zugriff auf Satelliten | Öffentliche NASA-Kacheln, **Stunden** alt, kein Geheimdienst, kein Live-Video | **ja, so** — GIBS True Color, Stand-Datum. Kein „Live“. |
| Stadt sagen → reinzoomen | Fly-to + Zoom **in** die Satellitenlage, nicht nur die Kugel drehen | **ja** — das fehlt heute: Zoom 2.15 liegt unter 3.8 |
| Brieft Politik, Märkte, Anomalien | Zitierte Meldungen + Serie + Unwetter/Ereignis **am Ort**, keine Hellseherei | **ja, mergen** — `news` / `outlook` / `warn` / ISS. Keine Aktien-Orakel. |
| Er sieht, ich plane | Im Reel: Mitarbeiter schaut zu, während der User plant | **zuschneiden** — nur **Ihr** Kalender/Memory/Todo **zu diesem Ort**. Keine Überwachung, kein Bildschirm-Mitschnitt. |

Kommentare unter den Reels sind „Jarvis bitte“ — kein Produkt-Ist.

## Zweites Reel — Nachrichten-Tour (übernehmen)

Caption verspricht **Geheim-Quellen**. Bei uns: **dieselben** freien Quellen wie Weltlage [`35-next.md`](./35-next.md) (Tagesschau `api2u`, DW-RSS). Kein Dark-Web, kein „hört ihr heute Abend nicht“.

| Aus dem Video / Wunsch | Bei uns | Votum |
|------------------------|---------|-------|
| 40-Sekunden-Weltbrief | Überblick **ein** Satz, dann **höchstens 5** Länder-Stops. TTS denselben Text. Stopp bricht ab | **ja**, kürzer ehrlich |
| Länder leuchten | Glow am **Länder-Mittelpunkt** (Tabelle), Label. Volle Länder-Polygone nur wenn Research klein genug | **ja** Glow; Polygon **Could** |
| Seite: News + Kurz-Erklärung | Lage-Textkachel + Chat: Titel, Quelle, 1–2 Sätze was **in dem Land** passiert (zitiert, nicht erfunden) | **ja** |
| Nacheinander ranzoomen | Dieselbe Fly-to-Kette wie `Zeig Stadt`, Zoom Land (nicht Street). Pause bis TTS/Kachel da | **ja** |
| Weltpolitisch wichtig | Allowlist-Länder + outlook-Tags (Hormus, Ukraine, OPEC, EZB, Öl, China/Asien). Sport, Wetter, Landes-Verkehr **raus** | **ja** |
| Quellen außerhalb der Tagesschau | Won’t als Behauptung. Netz nur wie `news` place: ehrlich „Tagesschau erwähnt X nicht“ | **Won’t** Geheimfeed |
| Unterbricht bei der Arbeit | Watch bleibt opt-in [`35-next.md`](./35-next.md) | nicht in dieser Schiene |

**Satz der Tour:** `Was ist heute so auf der Welt passiert` / `Was passiert in der Welt` / `Weltlage` / `Weltbrief`. Öffnet Kugel. Tool bleibt **`outlook`** (kein zweites Register, kein `if` in `chat.ts`). `Zeig mir die Nachrichten` bleibt national `news`, stiehlt die Kugel nicht (Standing `6.51`).

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

## Ist vs. Lücke (Code `6.90.0`)

| Fläche | Ist | Lücke zum Reel-Ziel |
|--------|-----|---------------------|
| `Zeig London` | `hud` pin, Fly-to Zoom **4.4**, Briefing Lexikon + Tagesschau oder ehrlich leer | GIBS-Disk nach dem Satz, Stamp mit Datum |
| Finger-Zoom | GIBS ab 3.8, 2D-Karte ab 5.2, Kappe Zoom 8, Tile-Z max **7** | MODIS True Color, kein VIIRS-Wechsel |
| Pin-Tap | Stadt = dasselbe Briefing; Glow = Stop wählen; Leertipp bricht Tour | — |
| Nachrichten | `news.ts` Ortssuche Tagesschau, sonst Netz ehrlich | an `Zeig Stadt` gehängt |
| Weltlage | `outlook.ts` Tags + Öl/FX-Serie, kein Orakel | Stadt nur Kette Hormus/EZB |
| Unwetter | `warn.ts` DWD Gemeinden | nach Fly-to DE-Ort |
| ISS | `sky.ts` Pin; im Briefing nur wenn in der Sicht | keine Überwachung |
| Ihr Plan | Kalender, Memory, Todos, Losgehen CODE | nur bei Ortsnamen im Eintrag |
| GIBS-Layer | `MODIS_Terra_CorrectedReflectance_TrueColor` Level9 | Stadt als Fleck, kein Street-View |
| Weltlage-Text | `outlook` kind `world` — Chat-Absatz + Tour | Kugel, Glow, Zoom-Kette |
| Phrase Welt-passiert | `heute so auf der Welt` / `Weltbrief` / `in der Welt` → outlook | `Nachrichten` bleibt `news` |
| Outlook-Pins | Glow am Centroid + Tag-Pins | Asien/Öl ohne Land → kein Glow |

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
| Parser | Stadt: `hud` pin/look. Tour: `outlook` world (erweiterte Phrasen). Kein `if` in `chat.ts`. |
| Akku | 30 fps Standing. Reduced-Motion: Stadt = Sprung; Tour = Glow+Liste **ohne** Auto-Flug. |
| Sir | Selten, nicht jeder Globus-Satz. |
| Sideload | Nicht in `6.70`–`6.82`. Hausstand vor nächster APK. |
| Welt-Tour | `Was ist heute so auf der Welt passiert` = Kugel an + Überblick + leuchtende Länder + Seite + Zoom-Kette. Quellen Tagesschau/DW. |
| Weltpolitisch | Feste Länder-Tabelle (~40: DE, US, CN, RU, UA, IR, IL, GB, FR, … + Hormus als Enge). Meldung muss Land **oder** outlook-Tag treffen. Rest verwerfen. |
| Glow | Heller Pin + weiche Scheibe am Centroid. Name daneben. Nicht die ganze Erde flackern. |
| Stops | Max **5**, Reihenfolge wie Quelle (Tagesschau zuerst). Leer → ehrlich: keine weltpolitische Lage in den Quellen, nationale Schlagzeilen nur im Chat wenn vorhanden. |
| Seite | Pro Stop: Land, eine Meldung, Quelle, Stand. Gemini schleift, **keine** neuen Länder/Zahlen. |
| Tour-Stopp | `Stopp` / Tippen auf die Kugel bricht die Kette, letzter Stop bleibt. TV/Spotify-Stopp nur mit Medium-Wort (Standing). |

## Ehrlichkeit: Satellit und „Anomalie“

| Was Leute meinen | Was frei und ehrlich geht | Delay |
|------------------|---------------------------|--------|
| Live-Video wie Google Earth | Gibt es öffentlich nicht in der APK | — |
| Satellit nach „Zeig London“ | GIBS True Color, Zoom in Level9, **Stand Datum** | Stunden |
| Politik in London | Tagesschau-Suche / DW, sonst „nichts von der Tagesschau“ | Minuten–Stunden, **Text** |
| Märkte in New York | Keine NYSE-Live-Zahl. Öl/FX nur Kette | wie outlook |
| Anomalie | DWD-Warnung, ISS-Pin, optional EONET | Quelle sagen |
| Geheim-Feed „nicht in der Tagesschau“ | Gibt es hier nicht. Tagesschau + DW, sonst ehrlich leer | — |

## Research (erledigt in `6.71` / Sprint 132)

| Version | Frage | Votum |
|---------|-------|-------|
| `6.71` | Fly-to-Zoom 4.4 auf dem Handy: GIBS-Disk sichtbar, Akku ok, Stamp da | **4.4** — über `GIBS_ZOOM_IN` 3.8, unter 2D 5.2 |
| `6.71` | Tile-Z 7 vs 8/9: Stadt erkennbar, nicht Street | **max 7** (unverändert) |
| `6.71` | VIIRS vs MODIS | **MODIS** lassen |
| `6.71` | Länder-Glow: Scheibe am Centroid vs Mini-Polygon | **Glow-Scheibe**; kein 190-Länder-GeoJSON |
| `6.71` | Headline → Land: Tagesschau-Felder vs Wortliste | **Wortliste** Allowlist; Ukraine → UA, nicht Europa |
| `6.72` | Tagesschau-Ort + outlook-Tag am selben Turn, Timeout | ein Reply in `briefPlace` |
| `6.72` | Tour: `outlook` world öffnet Kugel, Parser-Konflikt `news` | `auf der Welt passiert` = outlook+Tour, `Nachrichten` = news |
| `6.73` | EONET JSON in der WebView | **GO** optional; Fehler = weglassen, kein Fake |
| `6.73` | Kalender/Memory-Match nur exakter Ortsname / Lexikon-Name | Wortgrenze auf Lexikon-Name |

## Sprints

| Sprint | Version | Inhalt |
|--------|---------|--------|
| 131 | `6.70.0` | Leitentscheidung (dieses Dokument) — **CODE** (Docs) |
| 132 | `6.71.0` | Research: Zoom-Tiefe, GIBS, Länder-Glow, Headline→Land, EONET — **CODE** |
| 133 | `6.80.0` | Execute: Fly-to in Satellit + Stadt-Briefing (Politik, Markt-Kette) — **CODE** |
| 134 | `6.82.0` | Execute: Welt-Tour — Länder leuchten, Seite, Zoom-Kette — **CODE** |
| 135 | `6.81.0` | Anomalien ehrlich + Ihr Plan am Ort (`Zeig Stadt`) — **CODE** |
| 136 | `6.90.0` | Gold, Debug-Gruppe Stadt+Tour — **CODE**, **kein** Sideload |

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
9. `Was ist heute so auf der Welt passiert` → Kugel, Überblick, mindestens ein Glow wenn Tagesschau/DW ein Allowlist-Land trifft, Seite nennt Land+Quelle, Zoom auf das erste Land. Kein „Live“, kein Geheim-Feed.
10. Nur NRW-Wetter in den Quellen → keine Tour-Länder, ehrlicher Satz, nationale Schlagzeilen höchstens im Chat.
11. `Stopp` während der Tour → Kette tot, Kugel bleibt. `Zeig mir die Nachrichten` weiter `news`, nicht Tour.

## Won’t

Live-Satellitenvideo. Street-View. Gebäude-Mesh. Überwachung. Starlink-Schwärme. Aktien-Orakel. Geocoder aller Dörfer. Claude am PC. 60 fps Idle. 1,5B lokal. Sideload in dieser Schiene. Geheim-Nachrichten-Feed. 40-Sekunden-Kino. Alle 190 Staaten. Sport als Weltpolitik. `news` und Tour vertauschen.

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
| G8 | Welt-Tour: Glow, Seite, Zoom-Kette, Parser-Phrase |
| G9 | Weltpolitisch-Filter + max 5 Stops |

## Reihenfolge vs. Reste

1. Dieses Ziel — Globus-Briefing `6.70`.
2. LocateAnything-Gewichte nach 3060-GO.
3. Debug-Service `5.12`.
4. Parking: Mail, Cloud-Kalender, Play Store, iOS.

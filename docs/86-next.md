# 86 — Lage-Kugel: Flugzeuge, Stecknadel, Satelliten **PLAN** (`18.14.0`)

PO: In der Lage fehlen die Flugzeuge. Statt Punkte: Stecknadel für
den Standort, Flugzeug-Silhouette, Satellit statt Punkt.

Kein Code in dieser Etappe. Sideload bleibt `18.12.0`.
Kein neuer Agent. Kein Cesium, kein weltweites ADS-B, kein Wort „Live“.

Andere Drafts bleiben getrennt: Koch `#149`, Kamera-Wahl `#151`,
Clips `18.13` `#152`, Experte `#153`.

## 0. Ist (Diagnose)

Alles Canvas 2D in `GlobeView.tsx`. Kein Three.js, kein `globe.gl`.

| Stelle | Heute | Folge |
|--------|-------|--------|
| `drawPins` | Jede Art ist ein gefüllter Kreis. Flug 4 px `#9ecbff`, Sat/ISS 3,8 px weiß + Ring, Standort 5 px grün + Puls | Der Nutzer sieht **Punkte**, keine Flugzeuge |
| Lite (`globe_webgl`) | Labels nur für here/Feuer/Beben/Sat/ISS. Flüge ohne Namen | Kleine Punkte ohne Callsign |
| `fetchOverhead` | OpenSky `/states/all` BBox **±0,35°** um `overheadOrigin()` | ~0,5 Quadratgrad. Ländliche Mitte oft **leer** |
| Herkunft | `last_lat`/`last_lon` oder Deutschland-Mitte 51,16 / 10,45 (Thüringen, wenig ADS-B) | Leere Box ≠ kaputte API |
| Heading | OpenSky `true_track` (Feld 10) wird **nicht** gespeichert. `GeoFix` hat kein `heading` | Selbst ein Icon würde nach Norden zeigen |
| Cache | `TTL_MS` 10 min für alle Schichten | Positionen stehen, während die Maschine weiterfliegt |
| Start | Lage holt **kein** Overhead, bis „Zeig Flugzeuge“ / `flights` | Kugel ohne Satz = keine Flieger |
| Fehler | Non-2xx und Netz → `fail`, Pins `[]`. Intel-Leiste nennt die Quelle, die Kugel sieht leer aus | 429 (400 Credits/Tag anonym) wirkt wie „nichts da“ |
| Standort | `isFreshHereFix`: nur ≤ 10 min (`LOCATION_KEEP_MS`) | Älterer Fix: **keine** Nadel, BBox kann trotzdem den alten Ort nutzen |
| Sats | CelesTrak `stations` + `visual` + ISS (`wheretheiss.at`), SGP4 in `orbit.ts` | Richtige Quelle, gleiche Punkte-Grafik |

Parser bleibt: `Zeig Flugzeuge` → `hud` Schicht `overhead`.
`Was fliegt da` → Agent `flights`, setzt dieselbe Schicht.

## 1. Research (2026)

| Quelle | Was sie hergibt | Was nicht |
|--------|-----------------|-----------|
| [OpenSky REST 1.4.0](https://openskynetwork.github.io/opensky-api/rest.html) | `/states/all` + BBox. Feld 10 = `true_track` (Grad von Nord). Anonym **400** Credits/Tag, BBox ≤ 25 sq° = **1** Credit. 429 + `X-Rate-Limit-Retry-After-Seconds`. Auflösung ~10 s | Kein weltweites Live, kein Passagier, anonym kein `time`-Lookback |
| OpenSky OAuth2 Client Credentials | Registriert 4 000 Credits/Tag, ~5 s. Token ~30 min. Basic-Auth ist tot | Pflicht-Konto in der APK. Secret nicht hardcoden |
| adsb.lol / airplanes.live | Community-Spiegel | Keine offizielle SLA, oft Exchange-Scrapes. **Nicht** nutzen |
| [CelesTrak GP JSON](https://celestrak.org/NORAD/documentation/gp-data-formats.php) | `GROUP=stations\|visual&FORMAT=json`. Schon im Code. Elemente stundenweise, Position per SGP4 | Kein Starlink-Katalog. CelesTrak: GP nicht alle paar Sekunden neu holen |
| Where The ISS At | ISS 25544, schon 30 s Cache | Kein Live-Video |
| Jarvis [`77-next.md`](./77-next.md) · Sprint [269](./sprints/sprint-269.md) | BBox, Quelle+Alter, kein „Live“, Canvas 2D | Welt-ADS-B, Starlink-Wolke, Cesium, iframe |

Diese Cloud-VM erreicht `opensky-network.org:443` oft nicht
(`SSL_ERROR_SYSCALL`). Das ist Netz, kein Beweis dass die API tot ist.
Gerät und Heimnetz sind die Abnahme.

## 2. Warum nicht die naheliegenden Ideen

| Idee | Warum nicht |
|------|-------------|
| Weltkarte voller Flieger | Sprint 269 / 77-next Won’t. Netz, Akku, 4 Credits, unlesbar |
| Starlink-Wolke / `GROUP=starlink` | 70-next Won’t. Subset bleibt `stations` + `visual` + ISS |
| Cesium / EarthOS / `globe.gl` | Freeze 270. Canvas 2D bleibt |
| PNG-Sprite-Atlas | Extra Assets, Rotation umständlich. Canvas-Pfad dreht mit `true_track` |
| Zwischen zwei Polls interpolieren | Erfundene Position. Ehrlichkeit: Stand bleibt, bis der nächste Fetch kommt |
| Wort „Live“ / „Live eingeblendet“ | OpenSky ~10 s, Cache, Lücken. Text: **Stand vor N s**. Intel schon „Kein Live.“ |
| Neuer Agent `planes` | `hud` + `flights` tun das. Kein 65. Katalog |
| ADS-B Exchange / inoffizielle Spiegel | ToS, Key, Scraping |
| Standort erfinden wenn kein GPS | Honesty. Ohne Fix: BBox Deutschland-Mitte **sagen**, keine Stecknadel „Sie“ |

## 3. Architektur

```text
Lage ohne Satz
    → Erde, ISS, ggf. letzte Stecknadel. Kein OpenSky.

„Zeig Flugzeuge“ / „Was fliegt da“
    → Schicht overhead (hud oder Agent flights)
    → BBox ±2° um last_lat|DE-Mitte   (4×4 = 16 sq° ≤ 25 → 1 Credit)
    → States → GeoFix { kind:flight, heading:true_track|null }
    → Canvas: Silhouette, gedreht
    → solange Schicht an und Lage sichtbar:
         Poll alle ≥ 10 s, dropLayerCache(overhead) vor dem Fetch
    → Intel: „OpenSky: n Flugzeuge um Standort. Stand vor 12 s. Kein Live.“
    → 429 / SSL / leer: Text, Kugel bleibt, keine erfundenen Maschinen

Standort
    → frisch (≤ 10 min): grüne Stecknadel + Puls
    → älter, Koordinaten da: gedämpfte Nadel, Label „letzter Stand“
    → 0/0 oder keine Zahl: keine Nadel

Satelliten
    → CelesTrak GP (selten) + SGP4 + ISS
    → Canvas: Körper + Paneele; ISS größer / eigene Form
    → MAX_FULL 40 / MAX_LITE 16
```

| Teil | Wer | Neu? |
|------|-----|------|
| Parser | `parseGlobeLayerPhrase`, `parseFlightsIntent` | nein |
| Fetch | `fetchOverhead`, `fetchSats` | BBox, Heading, Status, Overhead-TTL |
| Pin-Modell | `GeoFix` | `heading?: number`, Standort auch unfrisch |
| Zeichnung | `GlobeView.tsx` `drawPins` | `drawHerePin`, `drawAircraft`, `drawSat` |
| Poll | Lage sichtbar + Schicht `overhead` | Intervall ≥ 10 s, Pause wenn Tab zu |
| OAuth | Settings, optional | Should. Ohne Key = anonym wie heute |

### 3.1 BBox

```text
box = 2.0
Fläche = 4.0 × 4.0 = 16 sq°   →  1 OpenSky-Credit
~220 km Nord–Süd, ~280 km Ost–West bei 51° N
```

±0,35° bleibt Won’t als Default. Wer kein GPS hat, hört
„Deutschland-Mitte“, nicht „über Ihnen“.

### 3.2 Alter

`ageLine` heute nur Minuten. Overhead (und ISS-Poll):

```text
< 60 s   →  „Stand vor 12 s“
< 120 s  →  „Stand vor einer Minute“
sonst    →  „Stand vor N Minuten“
```

Nie „Live“. Nie „Echtzeit“.

### 3.3 Silhouetten (Canvas, kein Asset)

| Art | Form | Farbe |
|-----|------|--------|
| here frisch | Tropfen (Kreis + Spitze nach „unten“ auf der Kugel = vom Zentrum weg), Puls bleibt | `#1ed760` |
| here alt | dieselbe Form, kein Puls | `#6a8f72`, Text „letzter Stand“ |
| flight | Rumpf + Tragflächen + Leitwerk, `rotate(heading)` | `#9ecbff` |
| sat | Rechteck + zwei Paneele | `#f4f7fb` |
| iss | breitere Paneele, etwas größer | `#f4f7fb` + bestehender Ring |

Heading `null`: Flugzeug nach Norden (0°). Kein Zufallswinkel.

Lite: Icons **bleiben**. Callsign darf weg, Form nicht.

Tap-Radius unverändert (`pinTapRadius`).

### 3.4 Optional OAuth (Should)

Settings-Felder `opensky_client_id` / `opensky_client_secret` wie andere
Keys. Token holen, Bearer setzen, 30 min merken. Leer = anonym.
Kein Client in der APK. 429 weiter ehrlich.

## 4. Won’t

Weltweites ADS-B. Starlink-Wolke. Cesium / EarthOS / `globe.gl`.
OSIRIS-iframe. CCTV. „Live“. Positions-Interpolation. PNG-Atlas.
Neuer Katalog-Agent. ADS-B-Spiegel. GPS erfinden. 60 fps Idle.
`GROUP=starlink`. Passagiere / Airline als Fakt, wenn OpenSky sie
nicht liefert (Rufzeichen darf stehen, „Lufthansa 440 nach FRA“ nicht
raten).

## 5. Sprints

| Sprint | Inhalt |
|--------|--------|
| [356](./sprints/sprint-356.md) | OpenSky ehrlich: BBox ±2°, Heading, 429-Text, Sekunden-Alter |
| [357](./sprints/sprint-357.md) | Stecknadel Standort, auch „letzter Stand“ |
| [358](./sprints/sprint-358.md) | Flugzeug-Silhouette + Heading |
| [359](./sprints/sprint-359.md) | Sat/ISS-Silhouette, kein Starlink |
| [360](./sprints/sprint-360.md) | Poll ≥ 10 s, Tests, optional OAuth, Härten |

Harte Kette: 356 → 357/358/359 (Zeichnung parallel nach Heading-Feld)
→ 360. Sideload bleibt `18.12.0` bis Execute.

## 6. Abnahme (nach Execute)

[`TEST-18.14.md`](./TEST-18.14.md). Gerät, nicht nur diese VM.

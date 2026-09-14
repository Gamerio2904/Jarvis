# Sprint 269 — Kugel: Schichten auf Zuruf

**Schiene:** 18.0 Sicht + Schach. **Version nach diesem Sprint:** `17.10.0`. **Davor:** Sprint 268 (`17.9.0` Terminator). **Danach:** Sprint 270 (Freeze `globe.gl`). **Meilenstein:** Sprint 271 (`18.0.0`).

**Einstieg:** [`70-next.md`](../70-next.md) §0c. **Quellen:** USGS, NASA EONET — siehe [`48-next.md`](../48-next.md). **Parser:** `frontend/src/engine/parser.ts`.

## Ziel

Drei Schichten, **aus** und nur nach Satz an:

| Satz (Beispiele) | Schicht | Quelle | Was die Kugel zeigt |
|------------------|---------|--------|---------------------|
| „Zeig Erdbeben“ / „Wo hat es gebebt“ | Erdbeben | USGS GeoJSON, letzte 24 h, Magnitude-Schwelle | Wenige Kreise, nicht die Welt voller Punkte |
| „Wo brennt es“ / „Zeig Waldbrände“ | Feuer | NASA EONET (bereits in `docs/48-next.md` als Option) | Wenige Marker, Kategorie Feuer |
| „Was fliegt über uns“ / „Was ist über Deutschland“ | Über-uns | **Ein** Fetch, Ausschnitt um den Standort — nicht weltweites ADS-B | Flugzeuge/Satelliten **in der Nähe**, Zahl klein |

Jede Schicht: Quelle + Alter im Text („USGS, Stand vor 12 Minuten“). Kein Label „Live“. Standard: alle drei **aus**. Lage-Start ohne Extra-Fetch außer ISS (bleibt wie 17.0.0).

## Warum nicht das ganze Reel

Weltweites ADS-B, Starlink-Wolke und 100 000 Objekte sprengen Netz, Akku und Lesbarkeit. „Über uns“ ist der ehrliche Rest: der Nutzer fragt nach **seinem** Himmel, nicht nach der ganzen Erde.

## Aufgaben

| # | Aufgabe | Datei | Anleitung |
|---|---------|-------|-----------|
| 1 | Parser | `parser.ts` | `zeig erdbeben`, `wo brennt`, `was fliegt über uns` / `was ist über uns`. HUD-Skip: diese Phrasen **nicht** als `unknown_place` (gleiche Falle wie `schachbrett` in Sprint 260). |
| 2 | USGS | `frontend/src/engine/globe-layers.ts` (neu) | Fetch + Timeout + Cache-TTL. Magnitude-Filter. Max. N Marker (N klein, z. B. 40). Fehler → Text, Kugel bleibt. |
| 3 | EONET | `globe-layers.ts` | Nur Kategorie Feuer/Wildfire. Max. N Marker. Gleiche Timeout/Cache-Regeln. |
| 4 | Über-uns | `globe-layers.ts` | Bounding-Box um GPS (oder Deutschland-Mitte wenn kein GPS). Eine öffentliche Quelle, die Ausschnitt erlaubt — **nicht** OpenSky welt-weit ohne BBox. Wenn die Quelle das nicht hergibt: Schicht **nicht** bauen, in `docs/48-next.md` als Won’t schreiben, Sprint trotzdem grün für die anderen zwei. |
| 5 | Kugel | `GlobeView.tsx` | Marker nur für **aktive** Schichten. Umschalten per Lage-Entscheidung / Parser, nicht per drei neuen Nav-Insel-Icons. |
| 6 | Budget | `GlobeView.tsx` | Zusätzliche Marker zählen zum Zeichen-Budget. Bei Lite-Modus: weniger Marker, nicht abschalten ohne Text. |
| 7 | Ehrlichkeit | Antwort-Text | Jede Schicht nennt Quelle und Alter. Kein „Live-Satellitenbild“. |

## Tests

```
npx tsc --noEmit -p frontend
```

Gerät:

1. Lage ohne Satz: keine Erdbeben-/Feuer-Wolke (ISS darf bleiben).
2. „Zeig Erdbeben“ → Marker + Text mit USGS.
3. „Wo brennt es“ → Marker + Text mit EONET (oder ehrliches „Quelle antwortet nicht“).
4. „Was fliegt über uns“ → wenige Objekte **oder** ehrlicher Wegfall laut Aufgabe 4.
5. „Schachbrett“ und „Erdbeben“ dürfen die Kugel nicht als unbekannten Ort öffnen, wenn der Parser die Schicht meint.
6. Flugmodus: Schichten bleiben aus / letzter Cache, kein hängender Spinner.

## Abbruch

- Mehr als eine neue permanente Netz-Schleife ohne Nutzer-Satz → raus.
- Starlink-Katalog, weltweites ADS-B, CelesTrak-1700 in der APK → raus.
- Marker ohne Quelle/Alter → raus.
- OpenSky/ADS-B so, dass der Default-Start der Lage die halbe Welt lädt → raus.

## PO-Prüfung

1. Geht die Kugel **ohne** Extra-Fetch auf, bis du etwas sagst?
2. Siehst du Quelle und Alter, nicht „Live“?
3. Bleibt die Kugel nach den Markern noch drehbar und lesbar?
4. Ist die APK noch ohne Cesium / EarthOS / `globe.gl`?

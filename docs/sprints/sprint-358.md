# Sprint 358 — Flugzeug-Silhouette

**Version:** `18.14.0` — **PLAN** Must
**Plan:** [`86-next.md`](../86-next.md)
**Voraussetzung:** 356 (`heading` am `GeoFix`).

## Ziel

Jedes Overhead-Pin ist ein Flugzeug von oben, ausgerichtet nach
`true_track`. Kein hellblauer Punkt mehr.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S358-1 | Pfad | `GlobeView.tsx` | `drawAircraft(x, y, heading)`: Rumpf, Tragflächen, Leitwerk. Canvas-Pfad, kein PNG |
| S358-2 | Kurs | dieselbe | `heading` Grad von Nord. Canvas: 0° = −Y. `null` → 0°. Kein Zufall |
| S358-3 | Lite | `drawPins` | Icon bleibt. Callsign darf im Lite weg, Form nicht |
| S358-4 | Farbe | — | `#9ecbff`, Größe im Rahmen des bisherigen 4-px-Punkts (lesbar, nicht weltgroß) |
| S358-5 | Test | `test-globe-view.mjs` oder Pfad-Helfer | Heading 0/90/180 dreht. `kind:'flight'` ruft nicht `arc` als Marker |

## Won’t

Zwischen zwei Fetches die Maschine weiterzeichnen. Airline/Ziel
raten. Weltkarte. Neuer Agent. „Live“-Label am Flieger.

## Abbruchkriterium

Flüge bleiben Kreise. Oder Heading wird gewürfelt. Oder Position
wird zwischen Polls interpoliert.

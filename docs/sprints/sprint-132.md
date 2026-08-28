# Sprint 132 — Research: Satellit-Tiefe (`6.71`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Leitentscheidung `6.70` |
| Ziel-Version | `6.71.0` |
| Quelle | [`48-next.md`](../48-next.md) |
| Baut auf | `GlobeView.tsx`, `globe-gibs.ts` (Schwelle 3.8, Fly-to 2.15) |

## Ziel

Klären, welcher Fly-to-Zoom auf dem Handy GIBS sichtbar macht, ohne Street-View vorzutäuschen. EONET CORS ja/nein. VIIRS nur wenn schärfer bei gleichem Akku.

## Must

| ID | Inhalt |
|----|--------|
| R1 | Messpunkt: `Zeig London` bei Zoom 4.4 vs 5.2 vs 2.15 — Screenshot/Stamp |
| R2 | Tile-Z-Kappe 7 vs 8 — Stadt-Fleck, keine Hausnummer |
| R3 | EONET: GO mit Quelle oder NO-GO weglassen |
| R4 | Reduced-Motion: Sprung auf Zielzoom |

## Won’t

Live-Video. Geocoder. Sideload. Execute-Briefing (133).

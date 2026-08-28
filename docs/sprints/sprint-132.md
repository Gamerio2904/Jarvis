# Sprint 132 — Research: Satellit + Land (`6.71`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Leitentscheidung `6.70` |
| Ziel-Version | `6.71.0` |
| Quelle | [`48-next.md`](../48-next.md) |
| Baut auf | `GlobeView.tsx`, `globe-gibs.ts`, `outlook-tags.ts`, Tagesschau-JSON |

## Ziel

Klären: Fly-to-Zoom für GIBS; Headline → **Land** (nicht „Europa“); Glow-Scheibe vs Mini-Polygon; Parser `auf der Welt` vs `news`; EONET ja/nein.

## Must

| ID | Inhalt |
|----|--------|
| R1 | `Zeig London` Zoom 4.4 vs 5.2 vs 2.15 |
| R2 | Tile-Z 7 vs 8 — Stadt-Fleck, keine Hausnummer |
| R3 | EONET: GO mit Quelle oder NO-GO |
| R4 | Reduced-Motion: Stadt-Sprung; Tour ohne Auto-Flug |
| R5 | Länder-Tabelle + Glow bei 5 Stops, 30 fps |
| R6 | Tagesschau-Item → ein Allowlist-Land oder verwerfen |
| R7 | `Was ist heute so auf der Welt passiert` = outlook-Tour, nicht `news` |

## Won’t

Live-Video. Geocoder. Geheim-Feed. Execute 133/134.

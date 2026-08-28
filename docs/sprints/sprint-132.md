# Sprint 132 — Research: Satellit + Land (`6.71`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | nach Leitentscheidung `6.70` |
| Ziel-Version | `6.71.0` |
| Quelle | [`48-next.md`](../48-next.md) |
| Baut auf | `GlobeView.tsx`, `globe-gibs.ts`, `outlook-tags.ts`, Tagesschau-JSON |

## Ziel

Klären: Fly-to-Zoom für GIBS; Headline → **Land** (nicht „Europa“); Glow-Scheibe vs Mini-Polygon; Parser `auf der Welt` vs `news`; EONET ja/nein.

## Voten (im Execute `6.90`)

| ID | Votum |
|----|--------|
| R1 | Fly-to **4.4** |
| R2 | Tile-Z **max 7** |
| R3 | EONET **optional**, Fehler = still |
| R4 | Reduced-Motion: Stadt-Sprung; Tour ohne Auto-Flug |
| R5 | Glow-Scheibe, ~40 Länder, kein Polygon |
| R6 | Wortliste Allowlist; Ukraine → UA |
| R7 | `Was ist heute so auf der Welt passiert` = outlook-Tour, nicht `news` |

## Won’t

Live-Video. Geocoder. Geheim-Feed.

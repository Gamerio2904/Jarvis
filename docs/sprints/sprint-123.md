# Sprint 123 — Körper & Kugel cinematic (`6.20`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Motion-Kern `6.10` |
| Ziel-Version | `6.20.0` (Research `6.21` Fly-to/Spur) |
| Quelle | PO: Kugel, Körper massiv, Over-the-top, perfekt dargestellt |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | `BodySchema.tsx`, `GlobeView.tsx`, Gazetteer-Pin `5.11` |

## Ziel

Dieselben Canvas-Sichten, Show statt Schema: Licht/Pulse aus echten `body-snap`-Feldern, Kamera-Ease zum Organ, Kugel Fly-to Berlin/ISS, Atmosphären-Rand. Chat bleibt. Antippen startet kein Tool.

## Must

| ID | Inhalt |
|----|--------|
| C1 | Pulse nur wo Snap-Daten liegen — kein Fake-CPU |
| C2 | `Zeig Hirn` / `Zeig PC-Auge` = Ease, Kachel, kein Register-Execute |
| C3 | `Wo liegt Berlin` Fly-to `last_globe_focus` |
| C4 | ISS-Spur nur aus gespeicherten Fixes, nichts erfinden |
| C5 | Reduced-motion: 2D-Pins/Kacheln, nicht leerer Ball |

## Won’t (dieser Sprint)

Marvel-Mesh. Live-Satellitenvideo. GIBS als Default (bleibt Opt-in `5.9`). Drei.js ohne Spike-Grün. Sideload.

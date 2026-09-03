# Sprint 166 — Kugel: Lag, Invert, Standort (`9.9.2`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.9.2` |
| Quelle | Screenshot-Bugs, [`53-next.md`](../53-next.md) |

## Ziel

Weltkugel folgt dem Finger, steht still wenn niemand dreht, und der GPS-Pin ist der aktuelle Fix — nicht ein alter Arbeitsort.

## Must

| ID | Inhalt |
|----|--------|
| G1 | Rechts wischen dreht die Erde nach rechts (Deltas negiert) |
| G2 | Eine `strokeRings`-Pass, kein Idle-Spin, rAF nur bei Drag/Pinch/Flug/Trägheit |
| G3 | Pinch und Rad zeichnen nach (`kick`) |
| G4 | `rememberFix` leert `last_place` bis Reverse-Geocode |
| G5 | Focus-Pin über `parseCoord`, kein 0/0 |
| G6 | Kugel-Tab holt `ensureDeviceLocation` und lädt Pins neu |

## Won’t

Cesium. NASA-Live-Video. Neues 3D. Alltag `8.32` als Extra-Feature (Idle-Pause ist dieser Loop).

## DoD

- [x] Drag-Vorzeichen dokumentiert in `GlobeView.tsx`
- [x] `test:014` grün
- [x] Typecheck grün

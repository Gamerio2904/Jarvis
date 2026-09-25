# Sprint 359 — Satellit und ISS statt Punkt

**Version:** `18.14.0` — **PLAN** Must
**Plan:** [`86-next.md`](../86-next.md)
**Voraussetzung:** Zeichnung parallel zu 357/358. Datenweg `fetchSats` bleibt.

## Ziel

Satelliten und ISS sind Körper mit Paneelen, keine weißen Punkte.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S359-1 | Sat | `GlobeView.tsx` | `drawSat`: Rechteck + zwei Solarpaneele. Farbe `#f4f7fb` |
| S359-2 | ISS | dieselbe | Eigene, etwas größere Form (breitere Paneele). `kind:'iss'` und Sat-ISS aus Schicht |
| S359-3 | Quelle | `fetchSats` / `orbit.ts` | Unverändert: CelesTrak `stations` + `visual`, SGP4, ISS `wheretheiss.at`. GP nicht im 10-s-Takt neu holen |
| S359-4 | Budget | — | `MAX_FULL` 40 / `MAX_LITE` 16. Lite: Form bleibt, Name darf weg außer ISS |
| S359-5 | Test | bestehend + Zeichenhelfer | Kein `GROUP=starlink` im Code. ISS-Form ≠ Sat-Form |

## Won’t

Starlink-Wolke. 2 000 Katalog-Objekte. Cesium. Live-Satellitenvideo.
CelesTrak jede Sekunde. Neue Orbit-Lib.

## Abbruchkriterium

Sats bleiben Kreise. Oder `GROUP=starlink` / Active-Katalog ohne Kappe.

# Sprint 141 — Alltag vom Zettel **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (Router in `9.9.2`; Gerät-Phasen 2–4 bleiben PO) |
| Priorität | unabhängig von Recall `7.0` und LocateAnything-3060 |
| Ziel-Version | `8.0` gebündelt in App **`9.9.2`** (kein Downgrade auf `8.0.0`) |
| Quelle | PO: alte Notizen + Einstellungen unübersichtlich |
| Plan | [`50-next.md`](../50-next.md) |

## Ziel

Alltag vom Zettel ausführen: Blitzer OSM-only, Steuer-Stimme, Settings-IA (8 Reiter), Amazon-Intent, Chat-Ordner, Preiswache, Lage `8.32`, Netz `8.33`, Wake `8.95`. Kein 3060, kein Apple CarPlay, kein Live-Beamter.

## Must

| ID | Inhalt | Stand |
|----|--------|--------|
| Z1 | Ist-Tabelle vs Code | **CODE** |
| Z2 | Blitzer OSM-Korridor; mobil/Beamte ehrlich leer | **CODE** |
| Z3 | Stimme `8.20`: hören, dann Execute, dann TTS / nur vorlesen | **CODE** |
| Z4 | Amazon Musik = Android-Intent, ehrlich wenn App fehlt | **CODE** |
| Z5 | Chat-Ordner lokal; Preiswache opt-in, € nur aus Treffer | **CODE** |
| Z6 | Won’t: Scraping, Preise erfinden, 60-fps, Recall-Nummern | gilt |
| Z7 | Settings: 8 Reiter, deutsche Wozu-Sätze, Deep-Links | **CODE** |
| Z8 | Lage-Overlay `8.32` | **CODE** (`9.9.1`/`9.9.2`) |
| Z9 | Netz-Antwort `8.33` (Venedig: aktuell nicht fünf Euro) | **CODE** |
| Z10 | Test-Tore Router + `npm run test:alltag` | **CODE**; Handy-Katalog Sprint 168 PO |
| Z11 | Dauer-Zuhören `8.95` | **CODE** Wake aus = still |

## Won’t (dieser Sprint)

LocateAnything-Gewichte. Whisper/Cesium/Pipecat. Android FGS `5.12` v2. Apple CarPlay. Live-Jagd auf Beamte. Sideload-Bump nur für Alltag-Härte.

## Tests

`frontend/scripts/test-alltag.mjs` — Katalog Alltag/Recall (31 Prompts), Parser-Matrizen, Settings-Suche auf 8 Reitern, OSM-Korridor ohne Netz, ehrliche Blitzer-Leere.

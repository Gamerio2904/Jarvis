# Sprint 153 — OCR (`9.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | V4 Abschluss |
| Ziel-Version | `9.0.0` |
| Quelle | Phase-0-Audit V4 OCR |
| Plan | Industry V4 Teil 3 |

## Ziel

Fotos im Datei-Knopf laufen über Gemini-Vision (wie Auge), aber mit Verify: `ocrOk` Pflicht. Ohne Gemini kein Fake-OCR. Gescannte PDFs ohne Text: Foto der Seite vorschlagen. Word/Excel/HEIC ehrlich ablehnen.

## Must

| ID | Inhalt |
|----|--------|
| O1 | JPEG/PNG: Gemini OCR, sonst ehrlich Fehler |
| O2 | Image-SUCCESS nur mit `ocrOk` |
| O3 | Gescannte PDF ohne Literale: kein „PDF gelesen“ |
| O4 | Version `9.0.0` |

## Won’t

On-Device-OCR-Bibliothek. LocateAnything-Gewichte. Memory-Graph. Device-Registry V6.

## DoD

- [x] SUCCESS-Lüge ohne Observation unmöglich
- [x] `test:014` grün
- [x] Typecheck grün

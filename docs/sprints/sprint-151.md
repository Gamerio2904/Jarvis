# Sprint 151 — Attachments + Verify Upload (`9.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.0.0`) |
| Priorität | V4 nach V3 |
| Ziel-Version | `9.0.0` |
| Quelle | Phase-0-Audit Debt #9, Industry V4 |
| Plan | Industry V4 Teil 1 |

## Ziel

Datei-Knopf nimmt PDF, Text und Foto. Upload läuft durch `packVerified` Domain `doc`. SUCCESS nur mit Observation (`stored`, Bytes, Zeichen bzw. `ocrOk`). IndexedDB-Store `docs`. `last_doc_json` ist ephemeral.

## Must

| ID | Inhalt |
|----|--------|
| D1 | Datei-Input `image/*` plus PDF/txt/md/csv/json |
| D2 | `ingestDocFile` speichert Text-Records, nicht Word/Excel |
| D3 | Leere Datei, >8 MB, unbekannter Typ → `failed`, kein „gelesen“ |
| D4 | IndexedDB `docs` (Schema 7) |

## Won’t

Word/Excel-Parser. pdf.js. Memory-Graph. WebRTC.

## DoD

- [x] Verify Upload über `docUploadVerified`
- [x] `test:014` grün

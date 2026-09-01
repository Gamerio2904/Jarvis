# Sprint 152 — PDF/Text-Parser (`9.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.0.0`) |
| Priorität | V4 nach Attachments |
| Ziel-Version | `9.0.0` |
| Quelle | Phase-0-Audit V4 Parser |
| Plan | Industry V4 Teil 2 |

## Ziel

`Lies das PDF` / `Was steht in der Datei` geht an `doc`. `Lies das Foto` und Beleg/Zettel bleiben `eye`. PDF-Text nur aus unkomprimierten Literalen `(…) Tj` / `TJ`. Gescannte PDFs bleiben leer — dann ehrlich Foto der Seite, kein Fake.

## Must

| ID | Inhalt |
|----|--------|
| P1 | `parseDocIntent` stiehlt kein Auge und kein Friday-Kalender |
| P2 | Registry + `route-pick` Capability `doc`, Score + Konflikt gegen `eye` |
| P3 | `extractPdfText` lokal, ohne pdf.js |
| P4 | `classifyDoc`: image / pdf / text / other |

## Won’t

HEIC. DOCX/XLSX. OCR in diesem Sprint (153).

## DoD

- [x] `pickRoute('Lies das PDF') === 'doc'`
- [x] `pickRoute('Lies das Foto') === 'eye'`
- [x] Tiny-PDF `Hallo Jarvis` extrahiert

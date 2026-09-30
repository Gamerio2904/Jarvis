# Sprint 400 — Originalbytes

**Version:** `18.21.0` — **PLAN** Must
**Plan:** [`93-next.md`](../93-next.md)
**Voraussetzung:** 399. Lesen der Datei bleibt wie heute.

## Ziel

Der bisherige Datei-Knopf antwortet weiter mit dem Textauszug. Daneben
liegen die Originalbytes 30 Minuten im Gespräch, nicht im Hausstand.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S400-1 | Store | `store.ts` `doc.ts` | Neben `text` ein Blob, nur für PDF, Text und Foto, die heute schon angenommen werden. Word und HEIC bleiben draußen und haben kein Blob |
| S400-2 | Frist | `xfer` oder `doc` | Älter als 30 Minuten zählt als weg. Hausstand-Export enthält die Bytes nicht |
| S400-3 | Test | `test-xfer.mjs` | Nach dem Upload ist der Auszug-Satz derselbe wie vorher. Der Blob ist da. Nach Ablauf nicht |

## Won't

QR zeichnen. Den Lese-Satz umschreiben.

## Abbruchkriterium

Ein PDF-Upload antwortet anders als vor diesem Sprint, oder die Bytes stehen im Hausstand-JSON.

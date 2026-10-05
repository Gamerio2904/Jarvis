# Sprint 348 — Clip-Vault und Ingest

**Version:** `18.13.0` — **PLAN** Must
**Plan:** [`84-next.md`](../84-next.md)
**Voraussetzung:** main `18.12.0`. Kein Koch- oder Kamera-Diebstahl.

## Ziel

Mister-Beats-Clips kommen in Jarvis an und liegen lokal, ohne
hochgeladen zu werden. Zähler der Verbleibenden steht.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S348-1 | Store | `clip-store.ts`, IDB `clip_vault` v11 | id, path, mime, bytes, status=`queued`, caption, targets, created_at |
| S348-2 | Datei | App + Datei-Picker `video/*` | nicht durch `ingestDocFile` (OCR) |
| S348-3 | Share | Android `ACTION_SEND` / `SEND_MULTIPLE` `video/*` | Galerie → Jarvis; Web ehrlich aus |
| S348-4 | Dateiort | App-privater Ordner | kein öffentliches CDN, keine `video_url` |
| S348-5 | Zähler | `remainingUnpublished()` | nur Status queued/caption/publishing |
| S348-6 | Test | `test-clip.mjs` Pack ingest | Gold=TEST_PROMPTS; kein Publish |

## Won’t

Posten. Token. Caption als Fakt. Datei löschen. 64. Agent (kommt in 349).
Bild/PDF in diesen Vault.

## Abbruchkriterium

Ein Clip läuft durch OCR/`doc`. Oder eine Datei gilt als „oben“, ohne
Publish. Oder der Vault schreibt eine öffentliche URL.

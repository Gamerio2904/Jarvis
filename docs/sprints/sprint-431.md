# Sprint 431 — Notiz-Store CRUD

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Keine.

## Ziel

Notizen erhalten eindeutige Update- und Delete-Operationen, ohne bestehende
Notizen oder ihre IDs zu verändern.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S431-1 | Update per ID | `engine/store.ts` | Text validieren, `updated_at` erneuern, keine fremde Zeile ändern |
| S431-2 | Delete per ID | `engine/store.ts` | Nur die angegebene Notiz löschen; Abwesenheit eindeutig melden |
| S431-3 | Store-Gold | `scripts/test-notes.mjs` | Add/List/Update/Delete, leere Texte und unbekannte IDs abdecken |

## Abbruchkriterium

Ein Update darf weder eine neue Notiz anlegen noch bei ungültiger ID eine
andere Notiz ändern.

# Sprint 464 — Versioniertes JSON mit Round-trip

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 461–462.

## Ziel

Das maschinenlesbare Projektdokument besitzt ein Schema, das validiert,
versioniert und ohne stillen Datenverlust importiert/exportiert werden kann.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S464-1 | Exportvertrag | `engine/project-docs.ts` | Schema-Version und kanonische IDs hinzufügen |
| S464-2 | Importvalidierung | Hausstand-/Projektimport | Unbekannte Version und fehlerhafte Referenzen mit konkreter Meldung ablehnen |
| S464-3 | Round-trip | `scripts/test-idea-plan.mjs` | Alle Planfelder und Lücken bleiben erhalten |
| S464-4 | Abwärtskompatibilität | `engine/store.ts`, Hausstand-Tests | Vorhandene lokale Projektdateien bleiben lesbar |

## Abbruchkriterium

Import überschreibt keinen existierenden Plan ohne explizite Auswahl und
Bestätigung.

# Sprint 500 — Revisionen vergleichen und Konflikte lösen

**Version:** `18.40.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 498–499.

## Ziel

Vorherige Planstände sind verständlich vergleichbar; Wiederherstellung oder
Konfliktwahl bezieht sich auf konkrete Revisionen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S500-1 | Revision-Diff | `idea-plan.ts` Workbench | Geänderte Anforderungen, Sprints, Gates, Belege und Simulationen zwischen zwei Revisionen sichtbar machen. |
| S500-2 | Restore | Revisionspfad | Wiederherstellen erzeugt eine neue Revision und löscht die spätere Historie nicht. |
| S500-3 | Sync-Konflikte | Tablet-Sync | Quellenwahl an die verglichenen Planrevisionen binden; zwischenzeitliche Änderungen machen die Bestätigung ungültig. |

## Abbruchkriterium

Wiederherstellen vernichtet Historie, oder eine veraltete Konfliktbestätigung
überschreibt einen zwischenzeitlich geänderten Plan.

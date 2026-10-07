# Sprint 444 — Tischplatte-Baseline reproduzierbar machen

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Keine.

## Ziel

Bekannte Fehler der Planung sind als reproduzierbare Parser-, Store- und
UI-Regressionsfälle festgehalten, bevor ein Umbau beginnt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S444-1 | Planungsflächen-Inventar | `engine/board.ts`, `engine/board-parse.ts`, `engine/idea.ts`, `engine/idea-plan.ts` | Ist-Zustand und alle Plan-/Entwurf-/Research-/Ablaufübergänge prüfen |
| S444-2 | PSP-/Sprint-Routing-Gold | `scripts/test-board.mjs`, `scripts/test-app-ui.mjs` | Reproduktion für „PSP zeigt Sprints“ plus erwartete Sichtabgrenzung |
| S444-3 | Persistenz-/Resume-Gold | `scripts/test-idea-plan.mjs` | Projektwechsel, Neustart, Abbruch und erneutes Öffnen deterministisch prüfen |
| S444-4 | Fehlerkatalog | `docs/TEST-18.28.md` | Beobachtete Befunde und nicht bestätigte Annahmen trennen |

## Gateway

Go erst, wenn die aktuellen Fehler reproduzierbar sind oder ein nachvollziehbar
negativer Test belegt, dass der vermutete Fehler nicht mehr besteht.

## Abbruchkriterium

Keine große Refaktorierung auf Basis einer Vermutung; jede Änderung braucht
einen reproduzierbaren Test.

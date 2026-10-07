# Sprint 457 — Vorschau iterativ ändern und zurücknehmen

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 456.

## Ziel

UI-Feedback ändert eine bestätigte Vorschau strukturiert; vorherige Version
bleibt nachvollziehbar und kann wiederhergestellt werden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S457-1 | Feedback in erlaubte Diffs parsen | `engine/board-parse.ts`, `engine/idea-plan.ts` | Position, Text und Reihenfolge ändern; unbekannte Aktionen rückfragen |
| S457-2 | Diff validieren und bestätigen | `engine/board.ts` | Änderung vor Apply anzeigen, bestehende Werte erhalten |
| S457-3 | Revisionen/Undo | `engine/store.ts` | Begrenzte lokale Historie oder sicherer Vorher-Snapshot |
| S457-4 | Iterationsgold | `scripts/test-idea-plan.mjs`, `TEST-18.30.md` | Feedback, Ablehnen, Undo, Projektwechsel und Neustart testen |

## Abbruchkriterium

Ein Modell darf keine nicht angezeigte Änderung am Projekt oder einer anderen
Vorschau übernehmen.

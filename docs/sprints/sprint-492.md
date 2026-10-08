# Sprint 492 — Planung und Sprints aufteilen

**Version:** `18.38.0` — **PLAN** Must  
**Plan:** [`../102-next.md`](../102-next.md)  
**Voraussetzung:** 491.

## Ziel

Ein Ultron auf dem Tablet öffnet die Planung lokal und zeigt die Sprints
desselben gewählten Projekts auf dem Handy.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S492-1 | Tablet | Chat-/Board-Routing | `Öffne den Planungsmodus` öffnet die bestehende Projektplanung auf dem Tablet. |
| S492-2 | Handy | `fenster.ts` `Workbench.tsx` | `Öffne die Sprints auf dem Handy` öffnet nur die Sprintansicht der referenzierten Projekt-ID und Revision. |
| S492-3 | Kombibefehl | Router/Eval | Beide Ziele in einem oder zwei Sätzen zulassen; jeder Schritt hat getrennte Zustandsprüfung und Ergebnisbestätigung. |

## Abbruchkriterium

Sprints gehören zu einer anderen/ungespeicherten Projektrevision, oder
Tablet-/Handy-Ziel wird vertauscht.

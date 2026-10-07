# Sprint 439 — Deadline UI

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprints 437 und 438.

## Ziel

Deadlines können optional beim Erstellen oder Bearbeiten gesetzt, angezeigt
und wieder entfernt werden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S439-1 | Deadline-Eingabe | `ui/TodoListsOverlay.tsx` | Datum/Zeit optional und keyboard-fest; Uhrzeit darf fehlen |
| S439-2 | Anzeige und Sortierung | Todo-Overlay | Fälligkeit lokal formatieren; offene überfällige/fällige Aufgaben erkennbar machen |
| S439-3 | Deadline-Persistenz | `engine/store.ts` | Datum als lokaler Kalendertag `YYYY-MM-DD`, optionale Uhrzeit `HH:mm`, kein UTC-Versatz |
| S439-4 | Deadline-Gold | `scripts/test-todo-lists.mjs` | Kein Wert, Datum-only, Uhrzeit, Änderung, Löschen und DST |

## Abbruchkriterium

Ein Todo ohne Deadline erhält keine implizite Uhrzeit oder Fälligkeit.

# Sprint 442 — Abfrage nach Deadline

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprint 437 und 439.

## Ziel

Fragen nach „bis morgen“ oder „diese Woche“ liefern offene, tatsächlich
fristgerechte Todos aus allen Listen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S442-1 | Zeitraum-Parser | `engine/tools-parse.ts` | Relative Kalendertage/-wochen lokal bestimmen, Frage statt Write erkennen |
| S442-2 | Filter und Anzeige | `engine/tools.ts` / `reminders.ts` | Offene Todos mit Deadline am/bis zur lokalen Endgrenze; Liste und Deadline nennen |
| S442-3 | Zeitzonen-Gold | `scripts/test-todo-lists.mjs` | Mitternacht, überfällig, DST, Datum-only, leere Fälligkeit |
| S442-4 | Bestehende Tageslage | Agenda | Vorhandene Termine/Erinnerungen und offene Todo-Listen nicht duplizieren |

## Abbruchkriterium

Todo ohne Deadline darf bei einer Fälligkeitsfrage nicht als „bis morgen“
ausgegeben werden.

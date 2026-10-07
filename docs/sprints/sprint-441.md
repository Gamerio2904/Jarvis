# Sprint 441 — Sprachsteuerung Todo-Listen

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprint 437.

## Ziel

Ultron verwaltet Listen und Aufgaben sprachlich auf denselben Store-Einträgen
wie die GUI.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S441-1 | Listen-Intents | `engine/tools-parse.ts` | Liste erstellen/öffnen/anzeigen und Listennamen extrahieren |
| S441-2 | Todo-Intents | `engine/tools-parse.ts` | Erstellen, Ändern, Erledigen und Löschen mit optionaler Liste/Deadline |
| S441-3 | Executor und Rückfragen | `engine/tools.ts` | Eindeutige IDs; Mehrdeutigkeit klären; Löschen vor Ausführung bestätigen |
| S441-4 | Routing-Gold | `scripts/test-todo-lists.mjs` | Einkaufslisten, Notizen, Kalender und Smalltalk als Nachbarn schützen |

## Abbruchkriterium

Ein unbekannter Listenname darf weder still eine zweite Liste erzeugen noch
ein Todo in einer zufälligen Liste speichern.

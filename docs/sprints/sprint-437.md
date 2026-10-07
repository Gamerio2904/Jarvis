# Sprint 437 — Todo-Listen-Store und Migration

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Keine.

## Ziel

Todos können einer Liste und optional einer Deadline zugeordnet werden;
Altbestand wird verlustfrei in die Standardliste migriert.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S437-1 | `TodoList`-Modell und Standardliste | `engine/store.ts` | Listen lokal speichern, `Allgemein` nicht löschbar machen |
| S437-2 | Todo-Zuordnung und Deadline | `engine/store.ts` | `list_id`, `deadline_date` (`YYYY-MM-DD`) und optional `deadline_time` (`HH:mm`) ergänzen |
| S437-3 | Altbestand migrieren | Store-Migration | Todos ohne Liste unverändert `Allgemein` zuordnen, idempotent |
| S437-4 | Store-Gold | `scripts/test-todo-lists.mjs` | Listen-CRUD, Migration, Status, Deadline und Fehlerfälle testen |

## Abbruchkriterium

Die Migration darf weder alte Todos überschreiben noch mehrfach duplizieren.

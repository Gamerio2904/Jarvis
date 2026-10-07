# Sprint 438 — Todo-Listen-GUI

**Version:** `18.27.0` — **PLAN** Must  
**Plan:** [`../99-next.md`](../99-next.md)  
**Voraussetzung:** Sprint 437.

## Ziel

Todo-Listen und deren Aufgaben lassen sich in einer Fläche wie die
Einkaufslistenübersicht bedienen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S438-1 | Listenübersicht und Erstellen | `ui/TodoListsOverlay.tsx` | Mehrere Listen, Anzahl offener Todos, Standardliste sichtbar |
| S438-2 | Detailansicht und Todo-CRUD | Todo-Overlay | Aufgaben in gewählter Liste anlegen, öffnen, bearbeiten |
| S438-3 | Swipe und erledigte Auswahl | Todo-Overlay | Links erledigen, rechts genau diese Aufgabe löschen; fertige Aufgaben per Long-Press wählen/löschen |
| S438-4 | Fehler- und Accessibility-Zustände | Todo-Overlay, `index.css` | Bestätigungen, Live-Feedback, Reduced Motion und Touchflächen |

## Abbruchkriterium

Eine Aktion darf nie eine Aufgabe aus einer anderen Liste per sichtbarem
Index statt stabiler ID ändern.

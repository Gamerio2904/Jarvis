# Sprint 432 — Notizen-GUI

**Version:** `18.26.0` — **PLAN** Must  
**Plan:** [`../98-next.md`](../98-next.md)  
**Voraussetzung:** Sprint 431.

## Ziel

Eine eigene, lokale Notizenfläche ermöglicht Auffinden und Verwalten von
Notizen mit denselben Store-Funktionen wie Sprache.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S432-1 | Notes-Overlay | `ui/NotesOverlay.tsx` | Liste, Suche, leerer Zustand und Notizdetail |
| S432-2 | Create/Edit | Notes-Overlay | Text anlegen und gezielt bearbeiten; Speichern/Abbrechen erreichbar |
| S432-3 | Delete | Notes-Overlay | Vor dem Löschen bestätigen; danach die echte Store-Antwort anzeigen |
| S432-4 | Mobile-Zustände | `index.css` | Tastatur, Safe-Area, Reduced Motion und schmale Ansicht prüfen |

## Abbruchkriterium

UI darf Fehler beim Laden oder Schreiben nicht als erfolgreichen Speichervorgang
anzeigen und darf keine Notiz anhand eines veralteten Listenindexes ändern.

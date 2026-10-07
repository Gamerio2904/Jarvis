# Sprint 445 — Planungszustand an das Projekt binden

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 444.

## Ziel

Ein sichtbarer Plan, seine Phase und offene Bestätigung gehören immer zur
aktiven `Idea`; ein Projektwechsel darf keinen alten Plan weiter anzeigen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S445-1 | Zustandsübergänge dokumentieren | `engine/store.ts`, `engine/ablauf-state.ts` | Persistierte Projektdaten und flüchtige Ansichts-/Laufdaten abgrenzen |
| S445-2 | Projektbindung erzwingen | `engine/idea.ts`, `engine/board.ts` | Vor jedem Lesen/Schreiben aktive Idee per stabiler ID auflösen |
| S445-3 | Wechsel, Resume und Abbruch prüfen | `scripts/test-idea-plan.mjs` | Kein Cross-Project- oder Cross-Conversation-Leak |
| S445-4 | Sichtbare Fehlerpfade | `ui/Workbench.tsx` | Laden/Speichern nicht still als leer/erfolgreich darstellen |

## Abbruchkriterium

Keine zweite Kopie von `IdeaPlan` in Settings anlegen; bestehende Ideas müssen
ohne Datenverlust weiter lesbar sein.

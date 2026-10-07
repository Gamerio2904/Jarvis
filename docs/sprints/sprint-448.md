# Sprint 448 — PSP und Sprintansicht trennen

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 445–447.

## Ziel

PSP und Sprintliste sind fachlich und visuell getrennte Ansichten; insbesondere
zeigt PSP keine Sprintkarten oder Sprintzeilen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S448-1 | Datenprojektionen trennen | `ui/ScriptStage.tsx`, `engine/idea-plan.ts` | PSP aus Projekt-/Anforderungsstruktur, Sprints aus Sprintdaten rendern |
| S448-2 | Werkbankzustände angleichen | `ui/Workbench.tsx`, `engine/board-types.ts` | View-Wechsel aktualisiert sichtbare und aktive Ansicht konsistent |
| S448-3 | PSP-Regressionsfall schließen | `scripts/test-app-ui.mjs` | PSP zeigt null Sprintkarten; Sprints zeigen aktive Idee und richtige Anzahl |
| S448-4 | Mobile Bedienbarkeit | `index.css`, `TEST-18.28.md` | Schmale Displays, Tastatur, Kontrast und Reduced Motion prüfen |

## Abbruchkriterium

Keine Ansicht darf Daten aus der zuletzt geöffneten anderen Ansicht als
Erfolg-Fallback zeigen.

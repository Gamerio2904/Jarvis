# Sprint 456 — Deklarative SIM-GUI

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 455.

## Ziel

Die bisherige statische Modul-Drahtansicht wird zu einer nützlichen,
deklarativen GUI-Vorschau, ohne eine fremde oder echte App auszuführen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S456-1 | Preview-Renderer | `ui/Workbench.tsx`, `ui/ScriptStage.tsx` | Nur validierte Komponenten und Texte aus dem Simulationsmodell rendern |
| S456-2 | Vorschauzustände | `engine/board-wire.ts` | Leer, geladen, Fehler und nicht unterstützte Komponente unterscheiden |
| S456-3 | Mobile/Accessibility | `index.css`, `TEST-18.30.md` | Tastatur, TalkBack, schmale Ansicht und Reduced Motion |
| S456-4 | Renderer-Gold | `scripts/test-app-ui.mjs` | Kein Script/iframe; nicht erlaubte Komponente wird abgewiesen |

## Abbruchkriterium

Die Live-App, Gerätefunktionen oder Netzwerkoperationen dürfen aus der
Vorschau nicht ausgelöst werden.

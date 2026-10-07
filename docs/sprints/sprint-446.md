# Sprint 446 — Planungsbefehle eindeutig routen

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 444.

## Ziel

Planen, Entwerfen, Wechsel zwischen PSP/Sprints und Simulation werden weder
untereinander noch mit Smalltalk verwechselt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S446-1 | Intent-Matrix festlegen | `engine/board-parse.ts`, `engine/entwurf-parse.ts` | Positiv-, Negativ- und mehrdeutige Sätze definieren |
| S446-2 | Parsergold erweitern | `scripts/test-board.mjs` | „Plane das“, „Entwirf eine App“, „Zeig PSP/Sprints“, „Simuliere …“ abdecken |
| S446-3 | Bestätigungszustand binden | `engine/board.ts`, `engine/store.ts` | Ja/So/Passt ohne konkret offene Aktion darf keinen Write auslösen |
| S446-4 | Voice-/Text-Parität prüfen | `engine/chat.ts`, `scripts/test-turn-e2e.mjs` | Beide Eingaben lösen denselben Intent und dieselbe Aktion aus |

## Abbruchkriterium

Kein unscharfer Keyword-Gatekeeper darf Research, Export, Portfolio-Commit
oder Umsetzung starten.

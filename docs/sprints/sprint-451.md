# Sprint 451 — Klärung ohne implizite Freigabe

**Version:** `18.29.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 450.

## Ziel

Nur entscheidungsrelevante Lücken erzeugen präzise Rückfragen; Antworten
ändern das richtige Projekt und geben keine andere Aktion frei.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S451-1 | Lücken klassifizieren | `engine/idea-plan.ts` | Unbekannt, Annahme und blockierende Entscheidung unterscheiden |
| S451-2 | Pending-Fragen persistieren | `engine/store.ts`, `engine/idea.ts` | Frage ist an Projekt, Unterhaltung und erwartete Antwort gebunden |
| S451-3 | Folgeantworten zuordnen | `engine/board-parse.ts`, `engine/board.ts` | Mehrdeutige Antwort nachfragen statt falsches Feld ändern |
| S451-4 | Bestätigungs- und Abbruchgold | `scripts/test-idea-plan.mjs` | Ja/Nein, anderes Thema, Abbruch und Neustart prüfen |

## Abbruchkriterium

Ein Bestätigungswort ohne offene, passende Pending-Frage darf keinen Zustand
freigeben oder ändern.

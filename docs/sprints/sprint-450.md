# Sprint 450 — Intake-Bedingung und Rahmen erhalten

**Version:** `18.29.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 449.

## Ziel

Die Nutzerbedingung bleibt wörtlich und nachvollziehbar mit dem Projekt
verbunden; Rahmen und daraus abgeleitete Anforderungen werden unterscheidbar.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S450-1 | Intake-Eingang prüfen | `engine/idea-parse.ts`, `engine/idea.ts` | Vorhandene Projekt-/Idea-Befehle erweitern, nicht parallel ersetzen |
| S450-2 | Quelle und Rahmen persistieren | `engine/store.ts`, `engine/idea-plan.ts` | Originalbedingung nicht durch Modellparaphrase ersetzen |
| S450-3 | Briefing-Anzeige | `ui/Workbench.tsx`, `ui/ScriptStage.tsx` | Ziel, bekannte Rahmen und offene Punkte sichtbar machen |
| S450-4 | Intake-Gold | `scripts/test-idea-plan.mjs` | Mehrsatz- und wiederaufgenommene Eingabe bleiben dem Projekt zugeordnet |

## Abbruchkriterium

Kein Detail wird als Nutzervorgabe gespeichert, wenn es nur Modellannahme ist.

# Sprint 465 — Portablen Implementierungsleitfaden erzeugen

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 462.

## Ziel

Freigegebene Sprint-Prompts werden als nachvollziehbarer, IDE-neutraler
Arbeitsleitfaden exportiert, ohne Umsetzung oder Fehlerfreiheit zu versprechen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S465-1 | Prompt-Paket aus Plan ableiten | `engine/project-docs.ts`, `engine/idea-plan.ts` | Rahmen, ausgewählte Sprintaufgaben, Gates, Risiken und Quellen aufnehmen |
| S465-2 | Scope-Grenzen erhalten | `engine/project-docs.ts` | Keine nicht freigegebenen Sprints oder nicht belegten Stackentscheidungen |
| S465-3 | Ausgabe als Markdown | `engine/project-docs.ts` | Tool-neutraler Guide; keine Garantie für fehlerfreie Codegenerierung |
| S465-4 | Prompt-Gold | `scripts/test-idea-plan.mjs` | `offen`/`nogo` nicht in umsetzbare Anweisung umwandeln |

## Abbruchkriterium

Kein IDE-spezifisches Regelsystem als universell ausführbar oder garantiert
kompatibel ausgeben.

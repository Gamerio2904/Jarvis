# Sprint 463 — PRD und Mermaid aus dem Plan erzeugen

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 461–462.

## Ziel

PRD und Prozess-/Abhängigkeitsdiagramm werden reproduzierbar aus demselben
validierten Plan erstellt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S463-1 | PRD-Generator | `engine/project-docs.ts` | Bedingung, Rahmen, Anforderungen, Entscheidungen, Risiken und Lücken ausgeben |
| S463-2 | Mermaid-Flow | `engine/project-docs.ts` | Abhängigkeiten und Gate-Reihenfolge; keine erfundenen Kalenderdaten |
| S463-3 | Escaping und Renderbarkeit | `engine/project-docs.ts`, Tests | Nutzereingaben dürfen Diagrammsyntax nicht beschädigen |
| S463-4 | Exportgold | `scripts/test-idea-plan.mjs` | Gleicher Plan ergibt deterministische, vollständige Dateien |

## Abbruchkriterium

Kein Gantt-Datum oder Laufzeitversprechen ohne vom Nutzer gelieferte
Zeitplanung.

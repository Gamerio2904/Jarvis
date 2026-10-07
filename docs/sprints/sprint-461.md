# Sprint 461 — WBS aus IdeaPlan ableiten

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 449.

## Ziel

Die PSP-/WBS-Sicht bildet Projektanforderungen, Sprinttore und Lieferaufgaben
aus dem kanonischen Plan ab, statt eine zweite Planungsdatenbank zu erzeugen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S461-1 | WBS-Abbildung definieren | `engine/idea-plan.ts` | Projekt → Anforderungen → Sprints → Lieferumfang mit stabilen IDs |
| S461-2 | PSP-Renderer | `ui/ScriptStage.tsx` | Strukturbaum rendert keine Sprintkarten als Ersatzansicht |
| S461-3 | PSP-/Sprint-Parität | `scripts/test-app-ui.mjs` | Jede WBS-Zeile referenziert existierende Plan-ID |
| S461-4 | Terminologie | `docs/TEST-18.31.md` | Keine erfundenen Epics/Features, wenn die Quelle sie nicht kennt |

## Abbruchkriterium

Keine konkurrierenden Daten, IDs oder manuell abweichenden PSP-Texte speichern.

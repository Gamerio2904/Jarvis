# Sprint 459 — Simulationsergebnisse nachweisbar einordnen

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 453, 457 und 458.

## Ziel

Erkannte Probleme werden als Hypothese, Quellenbefund oder ausführbarer
Testvorschlag markiert und nur mit Bezug in Anforderungen/Lücken übernommen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S459-1 | Evidenztypen festlegen | `engine/idea-plan.ts` | Simulation, Research-Quelle und realer Test unterscheidbar machen |
| S459-2 | Findings mit Scope verknüpfen | `engine/idea-plan.ts`, `ui/ScriptStage.tsx` | Finding nennt betroffene Anforderung und offenen Prüfbedarf |
| S459-3 | Zustimmung vor Planänderung | `engine/board.ts` | Findings vorschlagen, nicht still Requirements oder Sprint-Gates ändern |
| S459-4 | Evidenzgold | `scripts/test-idea-plan.mjs`, `TEST-18.30.md` | Kein hypothetisches Ergebnis wird als verifiziert dargestellt |

## Abbruchkriterium

Keine automatische Übernahme eines Findings als `go` oder als durchgeführter
Test.

# Sprint 462 — Gates und Abhängigkeiten graphweit prüfen

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 461.

## Ziel

Ein Plan wird nur als ausführbar markiert, wenn Anforderungen, Lieferumfang,
Abhängigkeiten, Gates und Abnahmen zusammenpassen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S462-1 | ID- und Referenzintegrität | `engine/idea-plan.ts` | Duplikate und nicht auflösbare Requirement-/Sprint-/Task-IDs ablehnen |
| S462-2 | Abhängigkeitsgraph | `engine/idea-plan.ts` | Fehlende Knoten, Selbstkanten und Zyklen benennen |
| S462-3 | Gate-Policy | `engine/idea-plan.ts`, `engine/ablauf.ts` | Nur vollständige `go`-Sprints für Umsetzung freigeben |
| S462-4 | Qualitätsgold | `scripts/test-idea-plan.mjs` | Valide Minimalpläne und fehlerhafte Randfälle testen |

## Abbruchkriterium

Ein ungültiger Teilplan darf nicht durch Abschneiden oder stillen Default als
gültiger Gesamtplan erscheinen.

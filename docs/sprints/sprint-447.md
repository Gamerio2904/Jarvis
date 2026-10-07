# Sprint 447 — IdeaPlan sicher validieren

**Version:** `18.28.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprints 444–445.

## Ziel

Modellantworten können nur als Plan gespeichert werden, wenn sie das
bestehende `IdeaPlan`-Format vollständig und widerspruchsfrei erfüllen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S447-1 | Planvalidierung härten | `engine/idea-plan.ts` | Felder, IDs, Gates, Pflichttexte und Sprintfolge prüfen |
| S447-2 | Dependency-Prüfung ergänzen | `engine/idea-plan.ts` | Fehlende Ziele und Zyklen erkennen, Fehler konkret benennen |
| S447-3 | Brain-Policy verwenden | `engine/idea.ts`, `engine/brain.ts` | Planaufrufe folgen Provider-Konfiguration und Fallback |
| S447-4 | Fehler sichtbar machen | `engine/idea.ts`, `engine/board.ts` | JSON-/Timeout-/Providerfehler nicht verschlucken und keinen Erfolg melden |
| S447-5 | Validatorgold | `scripts/test-idea-plan.mjs` | Ungültige sowie gültige Plan-Fixtures abdecken |

## Abbruchkriterium

Kein Teilplan wird als vollständiger Erfolg gespeichert, wenn Validierung,
Anforderung oder Gatewayprüfung fehlschlägt.

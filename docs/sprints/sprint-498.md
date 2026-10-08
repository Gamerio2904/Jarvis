# Sprint 498 — Risiken und Projektstatus führen

**Version:** `18.40.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 495–497.

## Ziel

Der Projektstand zeigt neben offenen Lücken auch bestätigte Risiken,
Blockaden und die nächste Aktion mit nachvollziehbarem Änderungsverlauf.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S498-1 | Risiko-Register | `idea-plan.ts` `store.ts` | Risiken mit ID, Beschreibung, Auswirkung, Gegenmaßnahme und offen/erledigt erfassen; keine unbelegten Wahrscheinlichkeitszahlen. |
| S498-2 | Status-Updates | Workbench | Status „im Plan“, „gefährdet“, „blockiert“ oder „abgeschlossen“ samt Zeit und kurzer Begründung darstellen. |
| S498-3 | Änderungshistorie | Portfolio/Plan | Entscheidung, Blockade und nächste Aktion chronologisch zeigen und an Sprint/Anforderung referenzieren. |

## Abbruchkriterium

Ein Status wird aus Zeitablauf oder Modellvermutung automatisch gesetzt, oder
eine Änderung überschreibt die vorherige Statusbegründung.

# Sprint 455 — Versioniertes Simulationsmodell

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 449.

## Ziel

GUI- und Workflow-Simulationen haben getrennte, versionierte Datenverträge
und bleiben mit Ideas, Hausstand und vorhandenen Entwürfen kompatibel.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S455-1 | Simulationstypen definieren | `engine/idea-plan.ts`, `engine/board-types.ts` | UI-Vorschau und Szenario-Ergebnis getrennt typisieren |
| S455-2 | Begrenzte Elemente definieren | `engine/entwurf-muster.ts` | Allowlist aus Text, Listen, Karten, Tabs und Buttons |
| S455-3 | Persistenz/Versionierung | `engine/store.ts`, Hausstand-Import/Export | Optionale Erweiterung rückwärtskompatibel migrieren |
| S455-4 | Vertragsgold | `scripts/test-idea-plan.mjs` | Unbekannte Felder, beschädigte Daten und alte Planschemas testen |

## Abbruchkriterium

Kein HTML, CSS oder JavaScript aus Modellantworten als ausführbarer Inhalt
persistieren.

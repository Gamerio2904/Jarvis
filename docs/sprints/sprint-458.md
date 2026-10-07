# Sprint 458 — Nebenwirkungsfreier Workflow-Dry-Run

**Version:** `18.30.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 455.

## Ziel

Ein Ablauf kann mit Akteuren, Zuständen, Erfolgspfaden und Fehlerfällen
gedanklich durchgespielt werden; die Simulation führt keine Aktion aus.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S458-1 | Szenariovertrag | `engine/idea-plan.ts` | Akteur, Vorbedingung, Ereignis, erwarteter Zustand und Fehlerfall |
| S458-2 | Dry-Run-Ausgabe | `engine/board.ts`, `ui/Workbench.tsx` | Annahmen, Schritte und erwartete Folgen sichtbar markieren |
| S458-3 | Side-effect guard | `engine/board.ts`, `engine/ablauf.ts` | Keine Research-, Geräte-, Datei-, Memory- oder Portfolio-Writes |
| S458-4 | Szenariogold | `scripts/test-idea-plan.mjs` | Wiederholbarer Run und nachweislich unveränderter Store |

## Abbruchkriterium

Keine Behauptung über reale Last, externe Verfügbarkeit oder bestandene
Integrationstests aus einem hypothetischen Dry-Run.

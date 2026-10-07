# Sprint 466 — Gesamt-Gold und Release-Gate `18.31.0`

**Version:** `18.31.0` — **PLAN** Must  
**Plan:** [`../100-next.md`](../100-next.md)  
**Voraussetzung:** Sprint 460 und Sprints 463–465.

## Ziel

Der vollständige Planungsweg besteht End-to-End-, Export-, Regression- und
Android-Abnahme, bevor die Rework-Schiene als abgeschlossen gilt.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S466-1 | E2E-Gold | `scripts/test-idea-plan.mjs`, `TEST-18.31.md` | Intake → Klärung → Research → Simulation → WBS → Freigabe → Exporte |
| S466-2 | Safety-/Privacy-Gold | Tests | Kein ungefragter Netzaufruf, Memory-Write, HTML-Run oder Umsetzungsstart |
| S466-3 | Regressionssuite | Tests | Notizen, Todos, Einkauf, Ablauf, Entwurf, Scan, Portfolio und normale Recherche |
| S466-4 | Geräte- und Release-Gate | `package.json`, `engine/store.ts` | `18.31.0` / `183100` erst nach grüner manueller Abnahme |

## Abbruchkriterium

Bei Verlust von Planfeldern, falscher aktiver Idee oder missverständlichem
Simulation-/Umsetzungsstatus bleibt das Release-Gate offen.

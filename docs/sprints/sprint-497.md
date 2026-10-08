# Sprint 497 — Optionale Zeitplanung ergänzen

**Version:** `18.39.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 496.

## Ziel

Nutzer können Sprint-Zeitfenster ergänzen und Abhängigkeitskonflikte erkennen,
ohne dass Termine oder agile Zeitboxen für jedes Projekt verpflichtend werden.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S497-1 | Datumsfelder | Planmodell und Migration | Optionale Start-/Enddaten mit Zeitzonenbezug und strikter Validierung ergänzen; ungesetzte Felder bleiben leer. |
| S497-2 | Zeitansicht | Workbench | Sprints zeitlich sortiert in einer einfachen Timeline zeigen; Listenansicht bleibt verfügbar. |
| S497-3 | Konflikte | Validator und Tests | Unmögliche Intervalle und verletzte zeitliche Abhängigkeiten markieren, aber nie automatisch Termine verschieben. |

## Abbruchkriterium

Ein Zeitzonenwechsel oder Import verschiebt ein Datum still, oder bestehende
Pläne werden ohne Nutzerhandlung mit Terminen versehen.

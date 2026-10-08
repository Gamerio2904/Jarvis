# Sprint 501 — Projektdateien verlustfrei migrieren

**Version:** `18.41.0` — **CODE*** Must  
**Plan:** [`../103-next.md`](../103-next.md)  
**Voraussetzung:** 495–500.

## Ziel

Projektdateien haben einen expliziten, migrierbaren Vertrag; Export und erneuter
Import erhalten alle unterstützten Plandaten.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S501-1 | Schema/Migration | `project-docs.ts` | Exportformat versionieren und begrenzte, getestete Migrationen für bekannte ältere Versionen anbieten. |
| S501-2 | Roundtrip | Export/Import | Plan, Belege, Status, Beziehungen, Risiken und Revisionen erhalten; unbekannte Pflichtfelder oder verlustbehaftete Formate ablehnen. |
| S501-3 | Integrität | Tests | Kanonischen Inhaltsvergleich und beschädigte/übergroße Datei prüfen; Hash dient Integritätsvergleich, nicht als Signatur oder Echtheitsnachweis. |

## Abbruchkriterium

Import/Export verliert Nutzerinhalt still, führt fremde IDs ungeprüft zusammen
oder behandelt einen unsignierten Hash als Vertrauensbeweis.

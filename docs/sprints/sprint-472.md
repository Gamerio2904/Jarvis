# Sprint 472 — Sichere GUI-Vorschau aus Planvorschlägen

**Version:** `18.33.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 471.

## Ziel

Planungswünsche können eine verständliche UI-Vorschau erzeugen, ohne vom
Modell gelieferte Programme oder ausführbare Inhalte zu übernehmen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S472-1 | Komponenten-Allowlist wiederverwenden | Simulation/Entwurfs-GUI | Vorschläge ausschließlich auf bereits erlaubte UI-Datenbausteine abbilden |
| S472-2 | Vorschau klar markieren | Workbench/Planungsansicht | Mockup/Vorschau vom echten App-Betrieb unterscheiden |
| S472-3 | Ungültige Elemente ablehnen | Validator und Tests | Unbekannte Komponententypen, HTML, Skripte und Eventhandler sicher abweisen oder als Text behandeln |
| S472-4 | Übernehmen/Verwerfen testen | UI-Regression | Verwerfen und Undo dürfen den gespeicherten Plan nicht verändern |

## Abbruchkriterium

Bei ausführbarem Modellinhalt oder nicht rücknehmbarer Planänderung bleibt die
Vorschau gesperrt.

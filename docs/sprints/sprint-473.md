# Sprint 473 — Geprüfte Planungen konsistent exportieren

**Version:** `18.33.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 472.

## Ziel

Projektdateien und GUI zeigen denselben validierten Plan. Der Vorschlag
verändert bestehende Pläne oder Dateien erst nach ausdrücklicher Übernahme.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S473-1 | Bestehenden Exportpfad prüfen | `engine/project-docs.ts` und Exporttests | Aktuelle PSP/WBS-, Sprint-, PRD-, Mermaid- und JSON-Ausgaben prüfen |
| S473-2 | Validierung vor Export erzwingen | Plan-Validator und Import/Export | Defekte Abhängigkeiten und ungültige Gates blockieren |
| S473-3 | Vorschau und Datei abgleichen | Projektdatei-Tests | Aus denselben gespeicherten Daten exportieren; fachliche Inhalte deterministisch vergleichen |
| S473-4 | Abbruch und Fehler sichern | Exporttests | Fehler und unbekannte Formate melden, ohne vorhandene Projektdatei zu überschreiben |

## Abbruchkriterium

Wenn GUI und Export verschiedene Planstände zeigen oder fehlerhafte Daten
einen gespeicherten Export ersetzen, ist der Sprint nicht freigabefähig.

# Sprint 468 — Geprüfte Routing-Beispiele erstellen

**Version:** `18.32.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprint 467.

## Ziel

Ein kleiner, nachvollziehbarer Ausgangsdatensatz enthält Eingaben und aus
bestehenden Regeln oder geprüften Fällen hergeleitete richtige Kategorien.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S468-1 | Schema festlegen | Eval-/Dataset-Schema | Text, Zielkategorie, Falltyp, Herkunft und Prüfergebnis knapp und versioniert speichern |
| S468-2 | Goldfälle übernehmen | Bestehende Parser-/Router-Tests | Nur vorhandene, nachvollziehbare Soll-Ergebnisse konvertieren |
| S468-3 | Negative und unklare Fälle | Gold-Dataset | Verwechslungsfälle, Smalltalk und Rückfragefälle ergänzen |
| S468-4 | Datenschutzprüfung | Dataset-Validierung | Private Namen, Notiztexte und persönliche Nummern ausschließen; Fehler als Bericht ausgeben |

## Abbruchkriterium

Ein Beispiel ohne nachvollziehbare Soll-Kategorie wird markiert und nicht als
Trainingsbeispiel ausgegeben.

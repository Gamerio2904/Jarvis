# Sprint 482 — Gesamt-Gold und Release-Gate `18.35.0`

**Version:** `18.35.0` — **PLAN** Must  
**Plan:** [`../101-next.md`](../101-next.md)  
**Voraussetzung:** Sprints 470, 474, 478 und 481.

## Ziel

Routing, Planungsübersetzung, gezielte Rückfragen und kurze Sprachantworten
bestehen gemeinsam die Regression und die Geräteabnahme.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S482-1 | Durchgehendes Gold | E2E-Tests | Befehl → passende Aktion; Planwunsch → geprüfte Vorschau/Export; fehlendes Feld → Frage; Antwort → sichere Fortsetzung |
| S482-2 | Datenschutz und Befugnisse | Regressionstests | Keine privaten Trainingsdaten, ungefragte Netzaufrufe, Memory-Writes oder Modellaktionen |
| S482-3 | Feature-Regression | Tests | Einkauf, Todos, Notizen, Kalender, bestehende Planung und allgemeiner Chat |
| S482-4 | Geräte- und Release-Gate `18.35.0` | Browser/Android/Testbericht | Qualität, Rückfälle, Sprechverständlichkeit, Speicher und Latenz auf Zielgerät prüfen |

## Abbruchkriterium

Bei schlechterem Routing, Datenverlust, falschem Recall, veränderten Fakten
oder nicht abgenommener Geräteperformance wird `18.35.0` nicht freigegeben.

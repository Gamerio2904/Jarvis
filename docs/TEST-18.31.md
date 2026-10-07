# Test 18.31 — WBS, Exporte und Gesamtplanung

**Status:** PLAN. Mit validem, minimalem, großem und absichtlich fehlerhaftem
Plan testen.

## Planstruktur

1. Jede Anforderung, jeder Sprint und jede Aufgabe hat stabile eindeutige ID.
2. Fehlende Abhängigkeit, Zyklus, doppelte ID, unvollständiges `go`-Gateway
   und fehlende Abnahme blockieren die Freigabe mit konkretem Hinweis.
3. `offen` und `nogo` bleiben aus Umsetzungs-Prompts ausgeschlossen.
4. PSP und Sprintansicht referenzieren dieselben gespeicherten Planobjekte.

## Export-Roundtrip

1. PRD enthält Bedingung, Rahmen, Anforderungen, Entscheidungen, Lücken und
   freigegebene Sprintziele.
2. Mermaid ist syntaktisch gültig und enthält nur echte Planabhängigkeiten;
   ohne Zeitdaten gibt es keine erfundenen Gantt-Termine.
3. JSON exportiert mit Schema-Version. Import erhält alle IDs, Gates,
   Abhängigkeiten, Quellen und Simulationsevidenz. Fehlerhafte/unbekannte
   Schema-Version überschreibt keinen Plan.
4. Implementierungsleitfaden nennt nur bestätigte, freigegebene Arbeit und
   gibt keine Fehlerfreiheitsgarantie.
5. Zweimaliger Export desselben Plans erzeugt dieselben fachlichen Daten.

## End-to-End und Regression

Intake → Rückfrage → bestätigte Recherche → Simulation → WBS → Planfreigabe →
Export einmal vollständig durchspielen. Danach normale Ideen-/Entwurf-,
Ablauf-, Portfolio-, Research-, Memory-, Notes-, Todo- und Einkaufslisten-
Fälle wiederholen.

Erst nach vollständiger Geräteabnahme `18.31.0` / `183100` setzen.

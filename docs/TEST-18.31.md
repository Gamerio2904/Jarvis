# Test 18.31 — WBS, Exporte und Gesamtplanung

**Status:** Test-APK `18.31.0` / `183100` gebaut; automatisierte Teilprüfungen
grün. Die vollständige Android-Geräteabnahme steht noch aus, daher ist dies
ein Test-Build und keine final freigegebene Geräteversion.

Testdatei: [`../releases/Jarvis.apk`](../releases/Jarvis.apk).
SHA-256: `f75ab171b7ec61c75d2417cb2e86d5c9beab8b862095a08b5cc4136173b1b8b5`.
Es wurde kein Android-Gerät bereitgestellt; die folgenden manuellen Abläufe
müssen vor einer endgültigen Release-Freigabe noch auf dem Gerät durchlaufen.

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

Die App-Version des Test-Builds ist `18.31.0` / `183100`. Die finale
Release-Freigabe erfolgt erst nach vollständiger Geräteabnahme.

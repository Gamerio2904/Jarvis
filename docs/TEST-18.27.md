# Test 18.27 — Todo-Listen, Deadlines und Sprache

**Status:** PLAN. Erst nach Sprint 443 ausführen. Test mit isoliertem Hausstand;
keine Testdaten in den persönlichen Listen hinterlassen.

## Migration und Store

1. Bestehende Todos ohne `list_id` bleiben mit gleicher ID, Titel, Status und
   Zeitstempeln erhalten und erscheinen in `Allgemein`.
2. Mehrfacher App-Start/Migration erzeugt weder doppelte Listen noch doppelte
   Todos.
3. Listen `Uni` und `Haushalt` anlegen; je ein Todo erstellen. Listenabfrage
   zeigt keine fremden Todos.
4. Standardliste `Allgemein` kann nicht gelöscht werden. Beim Löschen einer
   anderen Liste bleiben die Todos entsprechend der bestätigten UI-Regel
   erhalten oder die destruktive Aktion wird vorab eindeutig bestätigt.

## GUI, Swipe und Deadlines

1. Homescreen-Kachel `Todos` öffnet Listenansicht; Tipp auf `Uni` öffnet deren
   Aufgaben. Zurück und Schließen funktionieren.
2. Offene Aufgabe nach links wischen → erledigt. Nach rechts wischen →
   genau diese Aufgabe wird gelöscht, wie bei der Einkaufsliste.
3. Erledigte Aufgabe lange drücken, mehrere auswählen, einzeln abwählen und
   ausgewählte Aufgaben löschen. Andere abgeschlossene Aufgaben bleiben.
4. Todo ohne Deadline erstellen; Detail zeigt keine erfundene Frist.
5. Todo mit Datum und Uhrzeit erstellen, bearbeiten, Deadline entfernen und
   nach Neustart erneut prüfen. Speicherung bleibt stabil.
6. Todo mit Datum ohne Uhrzeit bleibt ein lokaler Fälligkeitstag; UI dichtet
   keine Uhrzeit dazu und der Termin rutscht beim UTC-/DST-Wechsel nicht.
7. Schmale Ansicht, Android-Tastatur und Reduced Motion: Speichern, Abbrechen,
   Erledigen und Löschen bleiben erreichbar.

## Sprache und Recall

| Satz | Erwartung |
|---|---|
| `Erstelle eine Todoliste Uni` | Eine Liste `Uni`; Wiederholung erzeugt kein Duplikat |
| `Füge in Uni hinzu: Seminararbeit abgeben bis Freitag` | Ein offenes Todo mit Liste und korrekt geparstem lokalen Fälligkeitsdatum |
| `Erledige Seminararbeit abgeben` | Eindeutiger Treffer wird erledigt |
| `Lösche das Todo Abgabe` bei zwei Treffern | Rückfrage, kein vorzeitiger Write |
| `Nein` nach Löschfrage | Todo bleibt unverändert |
| `Zeig die offenen Todos in Haushalt` | Nur offene Aufgaben dieser Liste |
| `Was muss ich bis morgen noch erledigen?` | Überfällige und bis Ende morgen fällige offene Todos aus allen Listen, mit Liste/Deadline |
| Gleiche Frage ohne passende Deadline | Ehrliche Meldung; keine Aufgaben ohne Deadline als fällig darstellen |
| Deadline am Sommer-/Winterzeitwechsel | Lokales Kalenderdatum bleibt korrekt, kein UTC-Tagesversatz |

## Regression und Release-Gate

1. Bestehende Sätze `Todo: …`, `Was steht an?`, Todos abhaken/löschen und
   Termin-/Erinnerungsfragen routen weiter korrekt.
2. Einkaufslisten-Parser und Einkaufs-Swipe bleiben unverändert.
3. Todo-CRUD und Deadline-Abfragen führen keine Cloud-Anfrage aus.
4. Fehler bei Store-Operationen ergeben eine sichtbare Fehlerantwort, keine
   Erfolgsmeldung.
5. Sprint 443 hebt erst nach grünen Tests `APP_VERSION` und versionCode auf
   `18.27.0` / `182700`. APK-Bau ist ein separater Release-Schritt.

# Review 18.31.3: Bug-Reports und geplante Bugfixes

Beleg: neun Screenshots vom Tablet, 7. Okt. 18:29–18:30, im Repo-Root
(`Screenshot_20261007_*_Ultron.jpg`). Planung, keine gelieferte Funktion.
Umsetzung erst nach `Umsetzen`, Ziel Version 18.31.4.

## Reports

| # | Schwere | Beleg | Fehler |
|---|---|---|---|
| B1 | Hoch | Screenshot 1 | Notizinhalt (Matrikelnummer) wird bei „was ist nochmal meine matrikelnummer?“ nicht gefunden: „keine Daten im Langzeitgedächtnis“. |
| B2 | Hoch | Screenshots 2, 3 | Ultron behauptet „Neustart der Oberfläche eingeleitet“ ohne Werkzeug. |
| B3 | Hoch | Screenshot 5 | „lösche alle projektdateien“ meldet „gelöscht“ ohne Bestätigung und ohne Beleg. |
| B4 | Mittel | Screenshots 1, 2 | „verbinde dich mit dem handy“ / „synchronisieren“ liefert Unsinn. Das Feature fehlt. |
| B5 | Mittel | Screenshot 4 | Antwort zur Tischplatte (TikTok) ist geraten, ohne den echten Inhalt zu lesen. |
| B6 | Mittel | Screenshots 1, 5 | Gerät heißt „HANDY“ und „auf diesem Handy“, läuft aber auf dem Tablet. |
| B7 | Mittel | Screenshot 6 | „lege den chat in arbeit“ / „chat ordner“: Gesprächsordner und Datei werden verwechselt. |
| B8 | Mittel | Screenshot 7 | „fasse das gespräch zusammen“ nennt Inhalte, die nicht vorkamen, und Prompt-Reste („Kein Sales-Coach“). |
| B9 | Mittel | Screenshot 9 | „neue App planen, öffne ein leeres Dokument“ wird abgelehnt. |
| B10 | Niedrig | Screenshot 8 | `/hilfe` ist eine unstrukturierte Textwand. |
| B11 | Niedrig | Screenshot 7 | „wer bist du“ beantwortet mit Persönlichkeitsspruch statt Auskunft. |

## Geplante Bugfixes

| Fix | Löst | Maßnahme | Prüfung |
|---|---|---|---|
| F1 | B1 | `recall-parse.ts`: allgemeines Muster „was/wie … (nochmal) mein/meine X“ erkennen. Notizen, Todos und Einkauf vor dem Modell durchsuchen und mit Quelle zitieren. Notizen in den Modell-Block aufnehmen. | Test: Notiz „Matrikelnummer 12345“ anlegen, dann Fragen in mehreren Formulierungen. |
| F2 | B2, B3, B5, B8 | Erfolgsmeldungen („gelöscht“, „neu gestartet“, „geöffnet“) nur bei verifiziertem Werkzeug-Ergebnis. Sonst ehrlich: „Das kann ich nicht.“ Guard in `guards.ts` für erfundene Aktionsbehauptungen. | Tests mit den Eingaben aus Screenshots 2, 3, 5. |
| F3 | B3 | „alle Projektdateien/Ideen löschen“ läuft über Pending und Ja/Nein, danach Prüfung per Zählung. | Nein löscht nichts, Ja löscht und meldet die Anzahl. |
| F4 | B4 | Feste Antwort: „Automatische Synchronisierung gibt es noch nicht. Manuell: Einstellungen → Hausstand (QR).“ Verweis auf den Sync-Plan. | Eingaben „verbinde dich mit dem handy“, „synchronisiere“. |
| F5 | B6 | Gerätetyp erkennen (Tablet/Handy) und in Seitenleiste, Persona, `/hilfe` verwenden. | Anzeige auf Tablet und Handy. |
| F6 | B9 | Intent „neue App/Idee/Projekt planen, leeres Dokument“ legt eine Idee an und öffnet die Tischplatte. | Eingabe aus Screenshot 9 legt eine Idee an. |
| F7 | B10 | `/hilfe` als gegliederte Liste nach Kategorien (Gedächtnis, Organisation, Information, Medien, Gerät und Haus, Unterwegs, Lage und Tischplatte, PC, Daten, Grenzen). | Test `isHelpCommand` bleibt grün, Ausgabe gegliedert. |
| F8 | B7 | „lege den chat in Ordner X“ verschiebt das Gespräch, „chat ordner“ nennt den aktuellen Ordner. Keine Dateibegriffe. | Eingaben aus Screenshot 6. |
| F9 | B8 | Zusammenfassung nur aus den echten Nachrichten des Gesprächs. Prompt-Reste filtern. | Zusammenfassung enthält nur Gesprächsinhalt. |
| F10 | B11 | „wer bist du“ nennt Name, Version, Gerät und Hirn, danach höchstens ein Satz Ton. | Eingabe „wer bist du“. |

## Reihenfolge

1. F1 (Gedächtnis, wichtigster Fehler)
2. F2 und F3 (Ehrlichkeit und Löschen)
3. F4, F5, F10 (Antworttexte)
4. F6, F8, F9 (Chat-Funktionen)
5. F7 (`/hilfe`)

Danach Version 18.31.4, Tests, Lint, Build und APK.

## Offen

- Ob die Matrikelnummer wirklich als Notiz gespeichert war, ist aus den Screenshots nicht ersichtlich.
- APK 18.31.3 mit dem neuesten Hausstand und der Tischplatte ist noch nicht vom Nutzer bestätigt.

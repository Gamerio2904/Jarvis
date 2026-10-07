# Test 18.26 — Notizen und Rückruf

**Status:** PLAN. Erst nach Sprint 436 ausführen. Keine Sätze in Spur Heute
eintragen, bevor die passende Funktion gebaut ist.

## Homescreen und GUI

1. Homescreen → `Notizen` öffnet das Notizen-Overlay.
2. Neue Notiz `Matrikelnummer 123456` speichern, schließen, erneut öffnen:
   Notiz bleibt vorhanden.
3. Suche nach `Matrikelnummer` findet die Notiz, Suche nach einem unbekannten
   Wort zeigt einen ehrlichen Leerzustand.
4. Notiz ändern und speichern: Text ist aktualisiert, `updated_at` steigt,
   andere Notizen bleiben unverändert.
5. Löschen antippen, abbrechen: Notiz bleibt. Löschen bestätigen: nur diese
   Notiz verschwindet.
6. Schmale Handyansicht und geöffnete Tastatur: Speichern und Abbrechen sind
   erreichbar; kein Knopf liegt hinter Composer oder IME.

## Sprachzugriff

| Satz | Erwartung |
|---|---|
| `Notiz: Matrikelnummer 123456` | Genau eine Notiz wird gespeichert |
| `Zeig meine Notizen` | Gespeicherte Notizen werden gelistet |
| `Öffne die Notiz mit meiner Matrikelnummer` | Passende Notiz wird wiedergegeben/angezeigt |
| `Ändere die Notiz Matrikelnummer zu 654321` | Nur der eindeutige Treffer wird geändert |
| `Lösche die Notiz Matrikelnummer` | Rückfrage; vor `Ja` bleibt die Notiz bestehen |
| `Nein` nach der Löschfrage | Notiz bleibt bestehen |
| `Ja` nach der Löschfrage | Genau die bestätigte Notiz wird gelöscht |
| Zwei gleich passende Notizen | Rückfrage statt willkürlicher Auswahl |

## Recall und Regression

1. Nur in einer Notiz steht `Matrikelnummer: 123456`.
   `Was war nochmal meine Matrikelnummer?` liefert `123456` und kennzeichnet
   die Notiz als Herkunft.
2. Der gleiche Wert steht ausschließlich in Memory oder Knowledge-Pack:
   Recall findet ihn dort und kennzeichnet die Quelle passend.
3. Kein Beleg: keine erfundene Nummer, keine Websuche.
4. Zwei unterschiedliche gespeicherte Werte: Widerspruch nennen/nachfragen,
   nicht einen Wert als sicher ausgeben.
5. Prüfen, dass deterministischer Recall den Inhalt nicht an Groq/Gemini
   sendet.
6. Bestehende Gold-Sätze für Notiz-Erstellen/-Listen, Todos, Einkaufslisten,
   Knowledge und normalen Recall bleiben grün.

## Release-Gate

Sprint 436 darf `APP_VERSION` und versionCode erst auf `18.26.0` / `182600`
setzen, wenn die Store-, Parser-, GUI- und Recall-Tests sowie die vorhandenen
Regressionstests grün sind. APK-Erstellung ist ein separater Release-Schritt.

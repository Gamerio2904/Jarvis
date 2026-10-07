# 98 — Notizen: eigene Fläche und belegbarer Rückruf **PLAN** (`18.26`)

**Bedingung:** Ich möchte Notizen erstellen. Dafür eine neue GUI und einen
Shortcut auf dem Homescreen. Ultron soll diese Notizen frei steuern, bearbeiten
und aufrufen können. Ich kann zum Beispiel fragen: „Was war nochmal meine
Matrikelnummer?“ Dann durchsucht Ultron Wissen, Gedächtnis und Notizen.

**Planungsstand:** Noch nicht gebaut. Sprints **431–436**. Letzter nummerierter
Sprint im bestehenden Plan: 430. Geplante App-Version **`18.26.0`**,
versionCode **`182600`**. Kein APK und keine Codeänderung in diesem Plan.

## 1. Ziel

Eine lokale Notizfläche, die am Homescreen erreichbar ist und dieselben
Notizen wie der Sprachassistent bearbeitet. Ultron kann Notizen anlegen,
auflisten, suchen, öffnen, ändern und löschen. Eine Wissensfrage sucht
zusätzlich in bestehendem Gedächtnis und Fachwissen und antwortet nur, wenn
die gespeicherten Belege eine eindeutige Antwort tragen.

## 2. Ist-Zustand

| Bereich | Ist | Lücke |
|---|---|---|
| Speicherung | `Note` und IndexedDB-Store in `engine/store.ts`; nur `addNote` und `listNotes` | Kein gezieltes Update oder Löschen |
| Sprachzugriff | `tools.ts` kann Notizen anlegen und auflisten; `digest.ts` legt Sprachnotiz oder Gesprächsabriss ab | Keine verlässlichen Befehle zum Öffnen, Ändern und Löschen einer bestimmten Notiz |
| Recall | `retrieve.ts` fragt Notizen, Gedächtnis und Knowledge-Packs bereits gemeinsam ab | Gold-Tests für persönliche Kennungen, Eindeutigkeit und nachvollziehbare Quelle fehlen |
| Oberfläche | Notizen haben keine eigene Fläche | Kein Home-Shortcut, keine Suche und keine CRUD-GUI |

Die vorhandene lokale Notizsammlung wird erweitert, nicht ersetzt. Der erste
Abrufpfad bleibt lokal; eine einfache Kennzahlfrage braucht weder Websuche
noch einen Cloud-Aufruf.

## 3. Leitentscheidungen

| Thema | Entscheidung |
|---|---|
| Quelle | Bestehender IndexedDB-Store `notes`; bestehende Notizen bleiben erhalten |
| Datenmodell | Bestehende `Note`-Form mit ID, Text und Zeitstempeln beibehalten; keinen Titel erzwingen. Die GUI darf den Titel aus der ersten Textzeile darstellen |
| Home-Shortcut | Neue `notes`-Kachel im bestehenden `HOME_APPS`-Raster; öffnet dasselbe Notes-Overlay wie die interne Navigation |
| GUI | Lokal suchen, Liste öffnen, Notiz erstellen und bearbeiten; Löschen über einen bestätigten UI-Schritt |
| Sprachsteuerung | Eindeutige Anweisung direkt ausführen; bei mehreren passenden Notizen nachfragen. Löschen per Sprache wartet auf ein Ja |
| Recall | `memory`, `knowledge` und `notes` gemeinsam durchsuchen. Eindeutige Notizantwort mit Quelle/Notizhinweis; widersprüchliche Treffer nicht zusammenraten |
| Datenschutz | Notizen bleiben lokal. Für deterministischen Recall keine Recherche und keine Übermittlung des Notiztexts an ein Cloud-Modell |
| Konflikte | UI und Sprache verwenden dieselben Store-Funktionen. Aktualisieren schreibt `updated_at`; Löschen zielt auf eine stabile Notiz-ID, nie nur auf den aktuell sichtbaren Listenindex |
| Umfang | Kein Sync, keine Anhänge, kein OCR, keine Ordner/Tags und kein automatischer Import alter Chats |

## 4. Abnahme

1. Eine Notiz kann am Homescreen, in der GUI und per explizitem Sprachbefehl
   angelegt werden; alle Wege zeigen dieselbe gespeicherte Notiz.
2. Suche und Öffnen finden eine Notiz über ihren Text. Eine eindeutige
   Bearbeitung ändert nur diese Notiz; ein mehrdeutiger Name führt zu einer
   Rückfrage.
3. Löschen entfernt nur die ausdrücklich gewählte Notiz und verlangt vor
   einer Sprachlöschung eine Bestätigung. Abbruch lässt alle Daten unverändert.
4. Bei „Was war nochmal meine Matrikelnummer?“ kann Ultron eine eindeutige,
   belegte Antwort aus Notizen, Gedächtnis oder Fachwissen geben und nennt
   knapp die Herkunft. Ohne Beleg oder bei Widerspruch sagt er das und fragt
   nötigenfalls nach.
5. Recall löst weder Websuche noch einen unnötigen Cloud-Aufruf aus. Vorhandene
   Gespräche, Notizen, Todos und Einkaufslisten routen weiterhin wie bisher.
6. Tastatur, Android-IME, TalkBack-Beschriftungen und schmale Displays
   verdecken weder Speichern noch Abbrechen. Fehler beim Speichern/Laden sind
   sichtbar und erzeugen keine Erfolgsmeldung.

## 5. Sprints (`18.26.0` PLAN)

| Sprint | Ziel | Gateway | Abhängigkeit |
|---|---|---|---|
| [431](./sprints/sprint-431.md) | Lokale Notizen sicher ändern und löschen | CRUD-Store mit Tests, Altbestand bleibt lesbar | — |
| [432](./sprints/sprint-432.md) | Notes-GUI für Suche und CRUD | Create/Edit/Delete/List funktionieren auf Handy und Browser | 431 |
| [433](./sprints/sprint-433.md) | Homescreen-Shortcut | `Notizen` öffnet dasselbe Overlay | 432 |
| [434](./sprints/sprint-434.md) | Notizen per Sprache steuern | Eindeutige Ziele, sichere Rückfrage bei Mehrdeutigkeit/Löschen | 431 |
| [435](./sprints/sprint-435.md) | Wissen, Gedächtnis und Notizen abrufen | Matrikelnummer-Fall belegt und lokal, Widerspruch ehrlich | 431 |
| [436](./sprints/sprint-436.md) | Gold, Regression und Release-Gate | Testkarten grün, erst dann Version `18.26.0` / `182600` | 432–435 |

Kette: 431 vor 432, 434 und 435. 432 vor 433. 436 zuletzt. GUI und
Sprachsteuerung dürfen parallel umgesetzt werden, sobald 431 abgenommen ist.

## 6. Sprachbeispiele für die Abnahme

- `Notiz: Matrikelnummer 123456`
- `Zeig meine Notizen`
- `Öffne die Notiz mit meiner Matrikelnummer`
- `Ändere die Notiz Matrikelnummer zu 654321`
- `Lösche die Notiz Matrikelnummer` → Ultron fragt; `Ja` löscht genau den Treffer
- `Was war nochmal meine Matrikelnummer?`
- `Was weißt du über meine Matrikelnummer?`
- Zwei Notizen mit verschiedenen Matrikelnummern → Ultron fragt, welche gilt
- Keine gespeicherte Matrikelnummer → „Dazu finde ich keinen gespeicherten Beleg.“

Vollständige manuelle Gold-Spur: [`TEST-18.26.md`](./TEST-18.26.md).

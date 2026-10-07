# 99 — Mehrere Todo-Listen, Deadline und Sprachsteuerung **PLAN** (`18.27`)

**Bedingung:** Ich möchte eine Todoliste mit derselben Bedienung wie die
Einkaufslisten. Ich kann Listen wie Allgemein, Uni und Haushalt erstellen und
in jeder Liste Todos mit optionaler Deadline erfassen. Wischen, Erledigen und
Löschen sollen sich wie beim Einkauf anfühlen. Ultron soll Listen und Todos
per GUI und Sprachbefehl vollständig steuern und auf Fragen wie „Was muss ich
bis morgen noch erledigen?“ passende offene Aufgaben nennen. Auf dem
Homescreen soll es einen Shortcut geben.

**Planungsstand:** Noch nicht gebaut. Sprints **437–443**. Die vorherige
geplante Schiene ist Notizen `18.26.0` / Sprints 431–436. Geplante
Todo-Schiene: App-Version **`18.27.0`**, versionCode **`182700`**. Kein APK
und keine Codeänderung in diesem Plan.

## 1. Ziel

Mehrere lokale Todo-Listen mit Aufgaben, Status und optionaler Deadline.
Listen und Aufgaben sind per GUI und Sprache dieselben Einträge; beide Wege
können Listen anlegen/öffnen, Aufgaben anlegen, ändern, erledigen und löschen.
Abfragen nach einem Zeitraum durchsuchen offene Todos über alle Listen und
zeigen Titel, Liste und Deadline. Bestehende Todos bleiben erhalten.

## 2. Ist-Zustand

| Bereich | Ist | Lücke |
|---|---|---|
| Speicherung | `Todo` und IndexedDB-Store in `engine/store.ts` | Kein Listenmodell, keine `list_id`, keine Deadline |
| Sprachsteuerung | `tools-parse.ts` und `tools.ts` können globale Todos anlegen, listen, erledigen und löschen | Keine Listenwahl und keine robuste Bearbeitung benannter Todos |
| Agenda | `reminders.ts` zeigt offene Todos global ohne Termin an | „Bis morgen“ kann Todos nicht nach Fälligkeit filtern |
| Oberfläche | Einkaufslisten haben Listenübersicht, Detailfläche und Swipe-Aktionen | Todos haben keine entsprechende GUI und keinen Home-Shortcut |

## 3. Leitentscheidungen

| Thema | Entscheidung |
|---|---|
| Daten | Bestehende Todo-Zeilen behalten ihre IDs und Inhalte; Migration ordnet sie der Liste `Allgemein` zu |
| Listen | Nutzerdefinierte Namen, mindestens eine nicht löschbare Standardliste `Allgemein`; Beispiele `Uni`, `Haushalt` sind normale Listen |
| Todo-Felder | Bestehende `title`/`status` erhalten; ergänzen um `list_id`, `deadline_date` als lokales `YYYY-MM-DD` und optional `deadline_time` als `HH:mm` |
| UI | Eigenes Todo-Overlay nach Einkaufslisten-Muster: Listenübersicht → Aufgaben einer Liste → Erstellen/Bearbeiten |
| Swipe | Offene Aufgabe nach links erledigen, nach rechts löschen; abgeschlossene Aufgabe per langem Druck auswählen und gezielt löschen, analog zur aktuellen Einkaufsliste |
| Deadlines | Beim Erstellen/Bearbeiten optional wählbar; ein Datum ohne Uhrzeit bleibt ein lokaler Kalendertag und gilt am Fälligkeitstag bis Tagesende. Keine Uhrzeit erfinden. Relative Datumsangaben nach lokaler Gerätezeit auswerten |
| Sprachsteuerung | Benannte Liste hat Vorrang; bei fehlender Liste Standard-/aktive Liste. Mehrdeutige Listenziele oder Aufgaben führen zur Rückfrage. Sprach-Löschen bestätigt vor Ausführung |
| Fälligkeitsfrage | „Bis morgen“ umfasst offene Aufgaben mit Deadline bis zum Ende des morgigen lokalen Kalendertags, einschließlich überfälliger. Todos ohne Deadline erscheinen separat nur, wenn der Nutzer nach allen offenen Todos fragt |
| Datenschutz | Speicherung und deterministische Abfrage lokal; keine Cloud für CRUD oder Deadline-Filter |
| Umfang | Kein automatischer Alarm/Reminder bei Deadline in dieser Schiene; kein Sync, keine Wiederholungen, keine Unteraufgaben oder Prioritätsengine |

## 4. Abnahme

1. Update mit alten Todo-Zeilen erhält jede ID, Aufgabe, Status und Zeitstempel
   und macht sie in `Allgemein` sichtbar; Migration ist wiederholbar.
2. Nutzer kann Listen anlegen, öffnen und Aufgaben listengebunden anlegen,
   ändern, erledigen und löschen. Löschen der Standardliste ist gesperrt;
   Listenlöschung verliert keine Aufgaben still.
3. Swipe verhält sich wie beim Einkauf: links erledigen, rechts genau diese
   Aufgabe löschen;
   erledigte Aufgaben lassen sich durch langes Drücken auswählen und löschen.
   Reduced-Motion-/Keyboard-Zustände haben erreichbare Aktionsknöpfe.
4. Deadline kann beim Erstellen ausgelassen oder gesetzt sowie später geändert
   oder entfernt werden. UI zeigt Datum/Uhrzeit eindeutig in lokaler Zeit;
   Datum-only bleibt ohne künstliche Uhrzeit.
5. Ultron führt dieselben CRUD-Operationen auf dieselben IDs aus. Unscharfe
   Ziele oder unbestätigtes Löschen führen nicht zu einem Write.
6. „Was muss ich bis morgen noch erledigen?“ listet nur offene Todos mit
   Deadline bis morgen, über alle Listen, gruppiert oder mit Listenname und
   Deadline. Überfällige werden kenntlich gemacht. Ohne Treffer sagt Ultron
   das ehrlich; er ergänzt keine Aufgaben.
7. Die Homescreen-Kachel `Todos` öffnet und schließt dasselbe Overlay wie ein
   Sprachbefehl. Einkaufslisten, Notizen, bestehende globale Todo-Sätze und
   Erinnerungen bleiben unverändert.
8. Deadline-Filter und Todo-CRUD übertragen keine Aufgaben an einen
   Cloud-Anbieter. Store-/UI-Fehler werden sichtbar statt als Erfolg gemeldet.

## 5. Sprints (`18.27.0` PLAN)

| Sprint | Ziel | Gateway | Abhängigkeit |
|---|---|---|---|
| [437](./sprints/sprint-437.md) | Listenmodell, Deadline-Felder, Migration | Altbestand bleibt vollständig in `Allgemein`; Store-Gold grün | — |
| [438](./sprints/sprint-438.md) | Todo-GUI im Einkaufslisten-Muster | Listen, Aufgabenkarten, Swipe und erledigte Auswahl funktionieren | 437 |
| [439](./sprints/sprint-439.md) | Deadline in Create/Edit/UI | Optional setzen, ändern, entfernen und lokal korrekt anzeigen | 437, 438 |
| [440](./sprints/sprint-440.md) | Homescreen-Shortcut | `Todos` öffnet das Todo-Overlay und kehrt sauber zurück | 438 |
| [441](./sprints/sprint-441.md) | Sprachsteuerung für Listen und Aufgaben | Parser, eindeutige Ziele, sichere Rückfragen/Bestätigungen | 437 |
| [442](./sprints/sprint-442.md) | Deadline-Abfrage bis Zeitraum | Alle Listen lokal filtern; „bis morgen“ mit lokaler Tagesgrenze | 437, 439 |
| [443](./sprints/sprint-443.md) | Gold, Regression und Release-Gate | End-to-end grün; danach Version `18.27.0` / `182700` | 438–442 |

Kette: 437 vor 438, 441 und 442. 438 vor 439 und 440. 439 vor 442.
443 zuletzt.

## 6. Sprachbeispiele für die Abnahme

- `Erstelle eine Todoliste Uni`
- `Öffne die Liste Haushalt`
- `Füge in Uni hinzu: Seminararbeit abgeben bis Freitag`
- `Setz eine Deadline: Miete überweisen bis morgen 18 Uhr`
- `Ändere das Todo Seminararbeit auf Montag`
- `Erledige Müll rausbringen`
- `Lösche das Todo Milch kaufen` → bei mehreren Treffern Rückfrage
- `Zeig die offenen Todos in Haushalt`
- `Was muss ich bis morgen noch erledigen?`
- `Was ist diese Woche fällig?`
- Keine passende Deadline → keine erfundene Frist und ehrlicher Leerzustand

Vollständige manuelle Gold-Spur: [`TEST-18.27.md`](./TEST-18.27.md).

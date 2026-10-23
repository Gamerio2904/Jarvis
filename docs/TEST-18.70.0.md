# Testanleitung 18.70.0 — Master-Runde: Oberfläche, Tempo, Sprache, Sync, Intelligenz

Beispiel-Sätze, die direkt in den Chat getippt oder gesprochen werden können.
**Wichtig vor dem Start:** Diese APK auf **beiden** Geräten installieren — der
Hausstand-Abgleich mit Grabsteinen und Einstellungs-Zeitstempeln wirkt erst
zwischen gleichen Ständen.

---

## 1. Oberflächen-Fixes (Phase 1)

| Was | Schritte | Erwartet |
|---|---|---|
| Todo-Wischen | Todo-Liste öffnen, Karte nach links/rechts wischen | Geste bricht nicht mehr ab; links erledigt, rechts löscht. |
| Ordner umbenennen | Startbildschirm → Ordner öffnen → Namen antippen → „Haus Auto“ tippen | Leerzeichen bleiben erhalten. Feld leeren → alter Name bleibt (kein „Ordner“-Rückfall). Erst Feld verlassen/Enter speichert. |
| Kalender-Drag | Termin-Karte waagrecht ziehen | Kein falscher Monatswechsel mehr. |
| Fenster-Crash-Test | Ein Fenster stürzt (z. B. nach Key-Fehler) | Nur dieses Fenster zeigt „Hier ist etwas schiefgegangen“ — Rest läuft. |
| Fehler sichtbar | Bibliothek → „Nochmal lesen“ ohne Gemini-Key | Rote Hinweiszeile statt Stille. Server-Start/Verbinden ebenso. |
| Import-Rückgängig | Einstellungen → Import → Überschreiben ja | Meldung „Sicherungskopie angelegt“, Knopf „Import-Rückgängig“ holt den alten Stand zurück. |
| MiniChat | Mini-Chat öffnen, lange Unterhaltung | Log scrollt automatisch mit. |
| Klick-Sperre | Zwei Kacheln sehr schnell nacheinander antippen | Beide öffnen (Sperre gilt nur für dieselbe Kachel). |

## 2. Tempo (Phase 2)

| Prompt | Erwartet |
|---|---|
| Beliebige Gemini-Frage (Key eingetragen) | Erster Satz erscheint nach ~1 s (Streaming), nicht erst die ganze Antwort. |
| `erinner mich um 8 uhr an frühstück` | Sofortige „Erledigt“-Antwort ohne Modell-Rundgang. |
| `hallo` — zwei Mal hintereinander | Zweite Antwort kommt sofort aus dem Cache. |
| Lange Chat-Historie + Frage | Kein Aufatmen vor der Antwort — Abruf-Korpus ist begrenzt (letzte 240 Nachrichten). |

## 3. Sprach-Freiheiten (Phase 2) — die wichtigsten Prompts

### Mehrfachbefehle
| Prompt | Erwartet |
|---|---|
| `kauf Milch und ruf Mama an` | **Zwei** Aktionen: Einkaufsposten Milch + Anruf-Bestätigung für Mama. |
| `erinner mich an Sport und stell Timer auf 10 minuten` | Erinnerung + Timer beide ausgeführt. |
| `erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt` | **Ein** Termin am 5.9.2026 15:00 (Zeit nach Komma wird nicht abgetrennt). |

### Neue Fristen
| Prompt | Erwartet |
|---|---|
| `ich muss übermorgen öl wechseln` | Todo „Öl wechseln“ mit Datum **übermorgen**. |
| `ich muss in drei tagen kraut rumstehn` | Todo mit Datum +3 Tage. |
| `zahnarzt in 2 wochen` | Todo mit Datum +14 Tage. |
| `am wochenende grillen` | Todo mit Datum **Samstag**. |
| `bis ende des monats steuern machen` | Todo mit Datum Monatsletzter. |
| `am 14.03. pcr test abholen` | Todo mit Datum 14. März (nächstes Jahr, wenn in der Vergangenheit). |
| `nächsten montag wohnung putzen` | Todo am Montag der kommenden Woche. |
| `bis freitag um halb 5 zimmer aufräumen` | Todo mit Uhrzeit **16:30**. |
| `morgens medikamente` | Todo mit Frist 09:00. |
| `ich muss bis freitag nähste woche hausaufgaben in gm machen` | Weiterhin: Freitag der **nächsten** Woche, Name „Hausaufgaben in GM machen“. |

### Nachfolge & Korrektur (direkt hintereinander sprechen!)
| Prompt-Folge | Erwartet |
|---|---|
| `Termin Zahnarzt freitag 15 uhr` → `verschieb das auf morgen` | Neuer Termin morgen (mit alter Uhrzeit-Freiheit), ohne Modell. |
| `todo wohnung putzen` → `ersetze wohnung durch küche` | Todo wird umbenannt. |
| `wetter rom` → `wie eben` | Dieselbe Anfrage läuft nochmal. |
| `Termin arzt freitag 9 uhr` → `nein, ich meinte doch dienstag` | Termin wird auf Dienstag neu angelegt. |
| `das fünfte` / `lösche das zwölfte` / `nummer 9` | Ordnungszahlen ohne Limit bis zwölf. |

### Namen
| Prompt | Erwartet |
|---|---|
| `an oma denken` | Todo „An Oma denken“ (nicht „OMA“). |
| `folie ein` | „Folie ein“ (Partikel klein). |
| `mama anrufen wegen geburtstag` | Todo „Mama anrufen wegen geburtstag“ — ganze Aufgabe. |
| `notiz oder todo: milch` | Rückfrage (Kalender/Notiz?) statt Müll-Notiz. |
| `notiere: pcr abholen` | **Notiz** (nicht Todo). |

## 4. Sync & Sicherheit (Phase 3 — zwei Geräte)

| Was | Schritte | Erwartet |
|---|---|---|
| Grabsteine | Gerät 2: Todo löschen → Abgleich laufen lassen → Abgleich wiederholen | Das gelöschte Todo kommt **nicht** zurück. |
| Atomarer Import | Abgleich mitten drin abbrechen (App schließen) | Kein halber Stand — alter Stand bleibt komplett. |
| Versions-Warnung | Ein Gerät auf neuere Version updaten → abgleichen | Abgleich läuft; Hinweis „Versionsunterschied … läuft trotzdem“ statt Blockade. |
| Zeitstempel | Gerät 1 ändert einen Bibliotheks-Tag, Gerät 2 behält alten Stand → abgleichen | Die jüngere Änderung gewinnt (vorher verloren Änderungen immer). |
| PC-Token | `jarvis-pc.mjs` ohne `JARVIS_PC_TOKEN` starten | Zufalls-Token im Log statt „123456“. |

## 5. Intelligenz (Phase 4)

| Prompt | Erwartet |
|---|---|
| Dokument in Bibliothek laden (z. B. Brief) → `was steht in dem brief?` | Antwort zitiert die **passende Stelle** aus dem Dokument (RAG-Abschnitt), nicht nur den Dateianfang. |
| App morgens öffnen (mit Terminen/Todos heute) | Meldung „Guten Morgen — die Lage“ mit Terminen + Todos. |
| Todo mit Frist **morgen** anlegen, App am nächsten Tag öffnen | „Fristen-Wache: morgen“-Meldung am Vortag. |
| `wie ist die lage heute?` | Bündige Tageslage (Termine heute + offene Todos). |

## 6. Erwartet weiterhin (Regressionen)

| Prompt | Erwartet |
|---|---|
| `Ändere den Wecker: 7:30` | Route **Wecker** (Goldenerwartung aktualisiert). |
| `was steht in der bibliothek über ...` | Bibliothekssuche („bibliothek“ muss vorkommen). |
| `Suche nach Küchengeräte` | Recherche, nicht Bibliothek. |
| `kauf minecraft` | Einkaufsposten „Minecraft“. |
| `ich muss übermorgen öl holen` | Einkaufsposten Öl (…holen bleibt Einkauf — bewusstes Design). |

## 7. Abgleich-Checkliste (Kurz)

1. Gerät 1: `starte server` — QR in den Chat.
2. Gerät 2: `scanne qr code` — Kopplung + Sofortabgleich.
3. Beidseitig anlegen/löschen/ändern (Todos, Termine, Notizen, Tags, Ordner, Bibliothek).
4. Gerät 2: `verbinde mit server` — Meldung „Beide Geräte haben denselben Stand“.
5. Wiederholen in Gegenrichtung — keine Wiederkehr Gelöschter, keine verlorenen Änderungen.

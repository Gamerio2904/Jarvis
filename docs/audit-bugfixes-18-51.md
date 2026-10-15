# Audit 18.51.0: Yu-Gi-Oh, Planungsmodus, Alltag

Stand des Audits: `18.51.3` (versionCode `185103`). Der aktuelle Sideload ist `18.60.0` (versionCode `186000`).
Gerät mit 18.31.7 sieht die Korrekturen erst nach einer neueren Installation.
Dieser Zweig enthält zusätzlich die Duell-Korrekturen und die Timer-, Einkaufs- und Handy-Korrekturen.

## Behoben

| Bereich | Fehler | Korrektur |
|---|---|---|
| Duell | Ultron kämpft in seinem eigenen ersten Zug. Die gespiegelte Sicht zählt Zug 1,5 und vertauscht den Startspieler nicht. | Zugnummer wird abgerundet, der Startspieler wird mitgespiegelt, die Battle Phase wird übersprungen. |
| Duell | Ein gesetzter Zauber ist im selben Zug aktivierbar. | Dieselbe Zug-Sperre wie bei Fallen. |
| Duell | Ein Angriff von Ultron läuft in etwa zwei Sekunden durch, bevor eine Falle gewählt werden kann. | Solange eine Falle aktivierbar ist, wartet das Duell. „Angriff zulassen“ löst ihn aus. Die Falle selbst bleibt eine Entscheidung. |
| Duell | Beschwören, Angreifen und Phasenwechsel gehen auch in Ultrons Zug. Ein zweiter Aufruf zieht Ultron noch einmal. | Diese Aktionen verlangen den eigenen Zug. Ein laufender Zug von Ultron startet nicht erneut. |
| Duell | Ultron negiert sein eigenes Negate. Beim Beschwören verbraucht die Spiegelung die Falle des Spielers. | Ultron antwortet nicht auf das eigene Kettenglied. In der Spiegelung werden die Karten des Spielers nicht automatisch gespielt; die Kette kommt zurück. |
| Duell | Beschwörungs- und Flip-Effekte lassen sich ab dem nächsten Zug erneut drücken. Ein Flip im Kampf löst nichts aus. | Diese Effekte lösen nur beim Ereignis aus. Ein überlebendes verdecktes Monster löst den Flip aus, wenn der Spieler angreift. |
| Duell | Counter-Fallen zählen als Spell Speed 2. Normale Zauber starten in der Battle Phase. Schnellzauber fehlen im gegnerischen Zug. Extra-Deck-Monster wechseln im Beschwörungszug die Position. | Counter ist Spell Speed 3. In der Battle Phase nur schnelle Effekte. Schnellzauber aus der Hand gehen im gegnerischen Zug. Extra-Deck-Monster sind im Beschwörungszug positionsgesperrt. |
| Duell | ATK/DEF bleiben nach Boost, Tod oder Zurückholen erhöht. | Verlässt eine Karte das Feld, gelten wieder die gedruckten Werte. |
| Duell | „Wie viele Yu-Gi-Oh Spielkarten gibt es?“ öffnet ein Duell. | Fragen und das Wort Spielkarten starten kein Duell. „Zeit für ein Duell“ und „Starte Yu-Gi-Oh“ bleiben gültig. |
| Duell | Ultron setzt wirkungslose Zauber und spielt reines Abwerfen. | Gesetz wird nur eine Falle mit Effekt. Abwerfen und Millen sind keine Zugwahl. |
| Planung | Sätze mit Fragezeichen und Wissensfragen werden Anforderungen. | Fragen, Abbruch und „danke, das war's“ landen nicht im Plan. „Wie soll …“ bleibt eine Anforderung. |
| Planung | „starte bitte den Server“ und „Tablet Modus an“ werden Anforderungen. | Gerätesätze bleiben Gerätesätze. |
| Planung | „Planungsmodus aus“ lässt die Planung live. „Fertig“ nach „Go“ hebt den Festzustand auf. | Aus beendet den Bildschirm. Nach Go bleibt das Skript fest. |
| Planung | „Ändere den Termin: …“ öffnet nach dem Schließen wieder den Plan. | Solche Änderungssätze gelten nur, solange der Plan offen ist. |
| Planung | Im laufenden Plan kommt „Plane noch einen Login ein“ als „nicht angekommen“ zurück. | Im Live-Plan wird der Satz zuerst dem Plan angeboten. „Plane mir einen Kuchen“ außerhalb bleibt abgelehnt. |
| Planung | „Ich möchte eine neue App planen“ öffnet immer dasselbe Projekt. „für Rezepte“ geht verloren. | „eine neue App“ legt ein weiteres Projekt an. „für Rezepte“ heißt Rezepte. |
| Planung | Dieselbe Anforderung mit und ohne Punkt wird doppelt gespeichert. „Oberfläche: Liste: Liste“. | Der Vergleich ignoriert das Satzzeichen. Gleiche Bausteinzeilen stehen nur einmal. |
| Plan-Ansicht | Quellen, Backlog, Risiken, Abhängigkeiten, Revisionen und Zeitplan stehen in einer 28-Pixel-Spalte. | Diese Listen laufen über die Breite. Die PSP-Kürzel behalten ihre zwei Spalten. |
| Duell | Die End Phase kennt kein Handlimit. Ein stilles Abwerfen wäre falsch. | Ab 7 Karten bleibt die End Phase stehen. Die Karten werden angetippt. Erst danach startet Ultrons Zug. Training und Ultron werfen die schwächste Karte selbst ab. |
| Duell | Mirror Force, Solemn Judgment, Feldzauber, „draw then discard“ und „all monsters gain ATK“ haben keinen spielbaren Effekt. | Angriffsposition wird zerstört. Negate von Beschwörung, Aktivierung oder Effekt kostet die Hälfte der Life Points, wenn der Text das sagt. Ein Feldzauber bleibt als Aura liegen. Ziehen und Abwerfen ist ein Effekt. Ein Bonus für alle eigenen Monster ist eine Feldaura. |
| Duell | Kartentext nach dem Semikolon (Ziel zerstören, verbannen, auf die Hand, aus dem Friedhof oder Deck holen, Position drehen, ATK senken, alle Zauber/Fallen) bleibt ohne Effekt. | Diese Auflösung wird spielbar. Zusammen mit Beschwörung, Regeln, Spielmarken und Token haben 923 der 1395 Structure-Deck-Karten einen Effekt. Eine Kostenzeile vor dem Semikolon ist nicht der Effekt. „Shuffle your hand“ bleibt geschlossen. |
| Duell | Ultrons Angriff deckt ein Monster auf, der Flip-Effekt fehlt in der Kette. | Die gespiegelte Sicht zählt halbe Züge. Der Flip löst trotzdem aus, und ein offener Angriff bleibt stehen, solange die Kette offen ist. |
| Duell | Link-Pfeile öffnen zwei zusätzliche Hauptzonen. | Es bleiben fünf Hauptzonen. Belegte Extra-Monsterzonen zählen höchstens zwei dazu. Extra-Deck-Monster nehmen eine freie Extra-Monsterzone, sonst nur eine Hauptspalte, auf die ein Link-Pfeil zeigt. |
| Duell | Escape beendet das Duell sofort. | Escape fragt „Duell schließen?“. |
| Planung | `plan_phase` gilt für alle Gespräche. Eine offene Rückfrage hängt am nächsten Chat. | Der Plan merkt sich `plan_conversation_id`. Sparren und der Director ändern ihn nur in diesem Gespräch. „Plane das“, eine Sitzung oder der Bildschirm starten den Plan im aktuellen Chat. |
| Planung | Zwei gleichzeitige Sätze überschreiben sich beim Speichern. | `handleIdea` läuft nacheinander über eine Kette. |
| Planung | „Plane das: …“ schreibt die Tabelle und startet keine Agentenkarten. | Liegt Groq oder Gemini bereit, folgen die Karten nach dem Schreiben. Ohne Modell bleibt die Tabellenantwort. |
| Einkauf | „ich muss noch Brot holen“ ist Einkauf und Aufgabe zugleich. | Kaufen, holen und besorgen nach „ich muss“ sind Einkauf. |
| Duell | Beschwörungsbedingungen, Dauerregeln, Spielmarken, Token und die Pfeilrichtung haben keinen Effekt. | Eine Handbeschwörung wirft ab oder opfert Tribut und zählt nicht als Normalbeschwörung. Durchschlag, Direktangriff, Angriffsverbot, Kampf- und Effektschutz gelten im Kampf und bei gezielten Effekten. Spielmarken bleiben auf der Karte, Token verschwinden außerhalb des Friedhofs. Ein Link öffnet nur die Spalten seiner Pfeile. |

## Offen

Pendeln, Ausrüsten und Kartentexte außerhalb der eingebauten Formen bleiben ohne Effekt.

## Nachzug aus dem Allgemein-Audit

Die drei Code-Audits liefen parallel zum ersten Fix. Der Alltagsteil kam danach und ist hier nachgezogen.

| Bereich | Fehler | Korrektur |
|---|---|---|
| Timer, Wecker, Geburtstag, Zuhause | Anlegen plant die Hash-Nummer, der Neustart die gespeicherte Nummer. Es klingelt doppelt, Löschen trifft nur eine von beiden. | Geplant und storniert wird die gespeicherte Nummer. Beim Stoppen fällt der alte Hash zusätzlich weg. |
| Timer | „… 10 Minuten.“, „stell mir einen Timer“, „Timer stoppen“, „1 Stunde 30 Minuten“ bleiben ohne Wirkung. | Punkt am Satzende fällt weg. Füllwörter, `min` und die zweite Zeitspanne zählen mit. |
| Wecker | „halb 7“ wird 07:00, „6 Uhr 30“ verliert die Minuten. „Mein Wecker klingelt um 6“ legt einen Wecker an. | halb, viertel und „Uhr MM“ werden vorher umgeschrieben. Erzählungen ohne Stell-Befehl legen nichts an. |
| Gedächtnis | „vergiss es“ löscht einen beliebigen Eintrag, weil „es“ in fast jedem Text steckt. „Lösche die Erinnerung an den Arzt“ trifft das Gedächtnis statt der Erinnerung. | Floskeln und Wörter unter drei Buchstaben löschen nichts. Der Treffer braucht eine Wortgrenze. Erinnerungen löschen läuft über den Erinnerungs-Parser. |
| Einkauf | „Ich will ein Haus kaufen“, „Mama ist da“ und „Zahnarzt zu meinen Aufgaben“ werden Artikel. „Ei“ steckt in „mein“. | Solche Sätze sind kein Einkauf. Abhaken vergleicht ganze Wörter. |
| Aufgaben | „Notizen anzeigen“ speichert „n anzeigen“. „Ich muss los“ wird eine Aufgabe. | Anzeigen bleibt eine Liste. „los“, „sagen“ und „mal“ sind keine Aufgabe. |
| Kalender | „Termine“, „Montags“ und „Geburtstagsfeier“ werden auseinandergerissen. | Getrennt wird nur, wenn der nächste Buchstabe groß oder eine Ziffer ist. |
| Chat | Jeder Satz wird vor dem Router umgestellt. „Kannst du mir helfen, eine Mail zu schreiben“ wird ein Kontakt namens Helfen. | Die Umstellung läuft nur, wenn sonst niemand zuständig ist. „helfen … zu“ bleibt stehen. |
| Duell | Die Hand auf schmalen Screens ist zentriert und die äußeren Karten sind nicht erreichbar. Ein abgebrochener Kartentext bleibt als Fehler gespeichert. | Die Hand startet links und lässt sich schieben. Ein Abbruch schreibt keinen Fehlertext. |
| Wecker, Erinnerung | Zwischen 0 und 4 Uhr legt „morgen“ den Termin einen Tag zu spät. „Übermorgen“ rutscht mit. | In diesem Fenster ist „morgen“ der heutige Tag, „übermorgen“ der nächste. |
| Kalender | „Termin am Freitag Friseur“ ohne Uhr landet auf heute, der Wochentag bleibt im Titel. | Der Wochentag wird erkannt und aus dem Titel genommen. Ohne Uhr gilt 18:00. |
| Erinnerung | „in 2 Wochen“ und „in 1 Tag“ addieren feste Millisekunden und rutschen über die Zeitumstellung um eine Stunde. | Tage und Wochen laufen über das Kalenderdatum. Minuten und Stunden bleiben Millisekunden. |
| Erinnerung | „am 20.10. um 9“, „am Freitag an Mama“, „heute Abend“ und „morgen früh“ bleiben unerkannt. Titel behalten den Artikel. | Datum mit Uhr wird angelegt. Tageszeit ohne Uhr fragt nach, der Tag bleibt für die Antwort erhalten. Früh 8, mittags 12, abends 19, nachts 22 Uhr. Artikel am Anfang fallen weg. |
| Routing | Eine Frage mit „und“ wird in zwei Befehle zerschnitten. „oder“ schaltet jede Zuordnung aus. | Ein Fragewort am Anfang oder ein Fragezeichen am Ende bleibt ein Satz. „oder“ bricht nur ab, wenn die beiden Seiten zu verschiedenen Agenten führen. |
| Wetter | „wird es morgen regnen“ und „brauche ich morgen einen Regenschirm“ gelten nicht als Wetter. | Regen und Regenschirm sind Wetter, auch ohne das Wort Wetter. |
| Einkauf | „Einkaufsliste“ mischt alle Listen unter „Fehlt“. | Angezeigt wird die aktive Liste, sonst die Standardliste. |
| Timer | Der Balken hat keinen Abbrechen-Knopf und liest die Datenbank fünfmal pro Sekunde, auch ohne Timer. | Ein Timer lässt sich einzeln stoppen. Die Uhr läuft nur, solange ein Timer offen ist, sonst reicht das Ereignis `jarvis-reminders`. Der Balken steht auch im kleinen Chat. Eine hängende Benachrichtigungsfrage verschluckt die Antwort nicht. |
| Aufgaben, Notizen | Offene Fenster sehen neue Einträge erst nach Schließen. | Schreiben sendet `jarvis-todos` und `jarvis-notes`. |
| Backup | `todo_lists` fehlen. Alte Wecker klingeln nach dem Ersetzen weiter. Eine Aufgabe ohne Liste hängt in der Luft. | Listen werden mitgeschrieben. Vor dem Ersetzen werden die aktuellen Alarme storniert. Eine unbekannte `list_id` landet auf der allgemeinen Liste. |

## Prüfung

Parser, Alltag, Kalender, Erinnerungen, Ideen, Plan, Portfolio, Yu-Gi-Oh-Regeln und Duell nach diesem Nachzug: grün. Typprüfung grün.
`test-portfolio` liest `psp.json` als `{ art, struktur }`.
Der aktuelle Sideload `18.60.0` (versionCode `186000`) liegt unter `releases/Jarvis.apk`.

# Audit 18.51.0: Yu-Gi-Oh, Planungsmodus, Alltag

Stand: Code auf 18.51.0, ohne Versionsanhebung und ohne neue APK.
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

## Offen

Diese Punkte sind echte Lücken. Sie sind hier festgehalten und in diesem Durchgang nicht nachgebaut, weil dafür eine eigene Oberfläche oder eine große Effektabdeckung fehlt.

- Kein Handlimit von 6 Karten in der End Phase. Ein stilles Abwerfen wäre falsch, eine Auswahl fehlt.
- Viele Kartentexte haben keinen spielbaren Effekt. Beispiele: Mirror Force, Solemn Judgment, Feldzauber als Dauerbonus, „draw then discard“, „all monsters gain ATK“. Der Parser deckt eine Teilmenge ab.
- Flip-Effekte lösen aus, wenn der Spieler ein verdecktes Monster angreift. Greift Ultron ein verdecktes Monster an, wird es aufgedeckt, der Effekt wartet aber nicht in derselben Kette.
- Die Monsterzonen rechnen Link-Pfeile als bis zu zwei zusätzliche Zonen (5+2). Das ist die vereinfachte Zonenregel dieser Engine, nicht ein vollständiges Master-Rule-Feld.
- Der Planungszustand gilt für alle Gespräche, nicht für ein einzelnes. Eine offene Rückfrage kann an einem späteren Projekt hängen bleiben.
- Zwei gleichzeitige Planungssätze können sich beim Speichern überschreiben.
- Der ältere Ablauf mit Agentenkarten ist von der Tischplatte abgelöst. „Plane das: …“ schreibt den Plan, startet aber keine Agentenkarten.
- „ich muss noch Brot holen“ kann Einkauf und Aufgabe zugleich meinen. Die bestehende Reihenfolge bleibt.

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

Weiter offen aus demselben Audit, nicht in diesem Durchgang:

- „morgen“ zwischen 0 und 4 Uhr legt Wecker und Erinnerung einen Tag zu spät.
- „Termin am Freitag Friseur“ ohne Uhrzeit landet auf heute 12:00.
- Tage und Wochen über die Zeitumstellung werden als feste Millisekunden addiert und rutschen um eine Stunde.
- „erinnere mich am Freitag“, „heute Abend“, „am 20.10.“ werden oft nicht erkannt.
- Fragen mit „und“ werden in zwei Befehle zerschnitten.
- Todo- und Notizfenster aktualisieren sich nicht, solange sie offen sind.
- Das Backup enthält `todo_lists` nicht.
- Der Timer-Balken liest die Datenbank mehrmals pro Sekunde, auch ohne Timer.

## Prüfung

Yu-Gi-Oh-Regeln, Duell, Fidelity, Ideen und Plan: grün. Typprüfung grün.
`test-portfolio` bricht schon vor diesen Änderungen ab, weil `psp.json` das Feld `struktur` schreibt und der Test noch `psp.psp` liest.
Parser, Verbstellung und Timer-Lauf nach dem Nachzug: grün.
Version und APK bleiben 18.51.0.

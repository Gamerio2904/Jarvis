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

## Prüfung

Yu-Gi-Oh-Regeln, Duell, Fidelity, Ideen und Plan: grün. Typprüfung grün.
`test-portfolio` bricht schon vor diesen Änderungen ab, weil `psp.json` das Feld `struktur` schreibt und der Test noch `psp.psp` liest.
Version und APK bleiben 18.51.0.

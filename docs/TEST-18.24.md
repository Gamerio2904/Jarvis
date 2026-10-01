# TEST 18.24 — Portfolio

In der APK **`18.24.2`** (versionCode `182402`).
Plan [`96-next.md`](./96-next.md), Sprints 417–423.
Dieselben Sätze in Spur Heute, Gruppe `18.24 Portfolio`. Jede Box ist
ein Satz. Einmal tippen, kopieren, in den Chat.

Tischplatte an. Breite ab 900 px und darunter dieselben Sätze.

## 1. Planung bleibt

```
Plane eine App mit der ich meine ein und Ausgaben strukturierter aufschreiben kann
```

Der Planungsbildschirm geht auf. Die Karte liegt im Portfolio. Anforderungen
und Sprints stehen aus dem Satz, darunter der Teil mit den Ausgaben.
`Fertig` schließt den Bildschirm. Der Plan und die Karte bleiben.

```
Plane das Projekt: Haushaltsbuch, Einnahmen eintragen
```

Der Planungsbildschirm geht auf. Wer, Anforderungen und Sprints stehen
aus dem Satz. Eine Fläche kommt dazu, sobald der Satz Liste, Knopf,
Feld, Karte, Leiste oder Tab nennt. Weitere Sätze überarbeiten den Plan.
`Fertig` oder `Plan zu` schließt den Bildschirm. Der Plan bleibt. Die Karte
liegt. `Plane das:` bleibt das live Skript und wartet auf `Go`.

```
Plane das: Tik Tak To, Spielfeld bauen, Sieg prüfen
```

Die Mitte ist das live Skript. Zuerst die Wege aus dem Satz, dann die
Sprints. Chat sagt, dass eine Quelle fehlt. Es liegt noch keine
Portfolio-Karte. Chat wartet auf `Go`.

## 2. Fest

```
Go
```

Antwort `Fest. Tik Tak To liegt im Portfolio.` Die Mitte zeigt eine
Karte, kurzer Name `Tik Tak To`, ein gezeichnetes Bild. Im Store eine
Zeile. Dateien `projekt.json`, `wege.json`, `sprints.json`, `psp.json`,
`luecken.json`.

```
Neues Projekt: Haushaltsbuch
```

Dieselbe Karte, und der Planungsbildschirm geht auf. Wer und die
Anforderung stehen je einmal. Die Statuszeile sagt, dass die Karte liegt.
Leeres `Neues Projekt` fragt `Was soll geplant werden?` und legt nichts an.

```
Go
```

Antwort `Tik Tak To liegt schon im Portfolio.` Es gibt weiter eine Zeile.
Eine neuere Idee dazwischen ändert das nicht: `Go` nimmt die Tafel.
Ein Satz ohne zweite Klausel lässt Härten und Probe leer. Kein
erfundenes Ziel. Nach dem Archiv sagt dasselbe `Go`:
`Tik Tak To liegt wieder im Portfolio.`

## 3. Öffnen

Tipp auf die Karte. Die Dateien kommen nacheinander. Tipp auf
`projekt.json` zeigt den Titel und die Sprintzeilen.

```
Zeig Projekt Tik Tak To
```

Dieselbe Liste.

```
Portfolio
```

Die Liste geht zu. Die Karte steht wieder auf der Mitte.

## 4. Archiv

Die Karte in den Schlitz ziehen.

Antwort `Tik Tak To liegt im Archiv.` Die Mitte ist leer von dieser
Karte. Die Zeile ist noch im Store, `archived` true, die Dateien
sind noch da.

```
Hol Projekt Tik Tak To zurück
```

Die Karte steht wieder auf der Mitte.

```
Schredder Tik Tak To
```

Wieder im Archiv, Dateien bleiben.

```
Lösche das Projekt Tik Tak To
```

Dieselbe Ablage. `tik Taktik to` trifft `Tik Tak To`. Die anderen
Karten bleiben. `Lösche den Plan` räumt nur das Skript, nicht die Karte.

## 5. Beispiel

```
Beispiel zu Tik Tak To
```

Ohne Bild davor: `Kein Bild zum Speichern.`

```
Zeig mir ein Bild der Elbe
```

Ein Bild mit Quelle, noch keine Datei unter `beispiele/`.

```
Beispiel zu Tik Tak To
```

Antwort `Beispiel liegt bei Tik Tak To.` Die Mitte zeigt das Bild als
eigene Zeile unter der Karte. Pfad
`portfolio/tik-tak-to/beispiele/`. Die Projektkarte zeigt dieses Bild.

```
Zeig mir London
```

Die Kugel. Kein neues Beispiel.

## 6. Hausstand

Hausstand exportieren. Die Vorschau enthält `1 Projekte` oder die
echte Zahl, und `, 1 im Archiv`, wenn die Zeile archiviert ist.
Die JSON enthält `portfolio` mit den Dateien.

Eine ältere Datei ohne den Schlüssel, wieder eingespielt, lässt die
Zeile auf dem Gerät.

# TEST ab 18.23.12 — Hausstand-Code und alles danach

Sideload **`18.25.3`** (versionCode `182503`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Darin liegen Hausstand per QR
(`18.23.11`), Bilder nur auf Verlangen (`18.23.12`), Kalender und Plan
(`18.23.13`) und das Portfolio (`18.24.0`).

Jede Box ist ein Satz. Einmal tippen, kopieren, in den Chat. Tischplatte an.
Zwei Geräte für den Hausstand: dasselbe WLAN.

## 1. Hausstand-Code

Auf Gerät A:

```
Hausstand übertragen
```

Antwort `Hausstand-Code. Gleiches WLAN. Ohne Gespräche. Keys sind drin.`
Ein Code liegt in der Antwort. Gespräche fehlen in der Datei.

```
QR Code für Hausstand
```

Derselbe Code.

Auf Gerät B:

```
Scanne QR Code
```

Die Kamera geht auf. Den Code von Gerät A lesen. Danach die Richtung wählen
und exportieren. Keys und Portfolio-Zeilen kommen mit, Gespräche nicht.

Ohne gemeinsames WLAN: `Kein WLAN. Beide Geräte ins selbe Netz, dann den Satz nochmal.`

## 2. Bild nur auf Verlangen (`18.23.12`)

```
Zeig mir ein Bild der Elbe
```

Ein Bild, Quelle dabei.

```
wie sieht das wappen von bayern münchen aus
```

Das Wappen, Quelle OpenLigaDB.

```
Zeig mir London
```

Die Kugel. Kein Bild.

## 3. Kalender und Plan (`18.23.13`)

```
Zahnarzttermin und die wöchentlichen Trainings entfernen
```

Weg nur, was wirklich im Kalender liegt. Fehlt ein Eintrag, sagt Jarvis das
und erfindet keinen Lösch-Erfolg.

```
Plane das: Einkauf, Liste schreiben und Route prüfen
```

Ein Satz. Die drei Schritte stehen in den Sprints. Ein Satz ohne
zweite Klausel lässt Härten und Probe leer.

```
Schieb die Sprintliste nach links
```

Antwort `Die Sprintliste steht links.` Die Tafel bleibt das Skript.

```
Schieb die Sprintliste nach rechts
```

```
Lösche den aktuellen Plan
```

Antwort `Der Plan ist von der Tischplatte weg.` Das live Skript ist zu.

Chat in der linken Leiste gedrückt halten: **Löschen** und **Download**.
Kalendereintrag gedrückt halten: **Löschen**.

## 4. Portfolio (`18.24.0`)

```
Plane das: Tik Tak To, Spielfeld bauen, Sieg prüfen
```

Die Mitte ist das live Skript. Noch keine Karte.

```
Go
```

Antwort `Fest. Tik Tak To liegt im Portfolio.` Karte `Tik Tak To`, gezeichnetes
Bild. Dateien `projekt.json`, `sprints.json`, `psp.json`.

```
Go
```

Antwort `Tik Tak To liegt schon im Portfolio.`

Tipp auf die Karte. Die drei Dateien stehen da. Tipp auf `projekt.json`
zeigt `Spielfeld`.

```
Zeig Projekt Tik Tak To
```

Dieselbe Liste.

```
Portfolio
```

Die Karte steht wieder auf der Mitte.

Die Karte in den Schlitz ziehen. Antwort `Tik Tak To liegt im Archiv.`
Die Dateien bleiben gespeichert.

```
Hol Projekt Tik Tak To zurück
```

Die Karte ist wieder da.

```
Beispiel zu Tik Tak To
```

Ohne Bild davor: `Kein Bild zum Speichern.`

```
Zeig mir ein Bild der Elbe
```

```
Beispiel zu Tik Tak To
```

Antwort `Beispiel liegt bei Tik Tak To.` Das Bild liegt unter der Karte und
im Ordner `portfolio/tik-tak-to/beispiele/`.

```
Hausstand exportieren
```

Die Vorschau nennt die Projekte, und `im Archiv`, wenn eine Zeile dort liegt.
Die JSON enthält `portfolio`.

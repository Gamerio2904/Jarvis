# TEST 18.24.6 — Raum- und Objekt-Scan

Sideload **`18.25.10`** (versionCode `182510`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk

Jede Box ist ein Satz. Einmal tippen, kopieren, in den Chat. Tischplatte an.
Die Kamera braucht die Freigabe. Tiefe gibt es nur, wenn das Gerät sie liefert.
Ein Tippen während des Scans startet die Tiefenlesung, wenn der Browser sie anbietet.

## 1. Raum

```
Scanne den Raum
```

Antwort `Scan läuft. Der Tisch ist die Kamera. Sag Beende den Scan.`
Die Fläche zeigt die Kamera.

```
Scanner den Raum
```

Derselbe Start.

```
Beende den Scan
```

Mit Tiefenwerten: `Raum liegt auf dem Tisch. Ein Finger dreht, zwei schieben, Ziehen zoomt.`
Ohne Tiefenwerte: `Keine Tiefenwerte auf diesem Gerät. Kein Modell.`
Dieselbe Wirkung hat der Knopf `Beende den Scan` auf der Kamera, und die Sätze `Bennede den Scan` und `Scan beenden`.

```
den Raum scannen
```

Derselbe Start wie `Scanne den Raum`.

## 2. Objekt

```
Scanne den Apfel
```

Antwort `Scan läuft, Apfel. Der Tisch ist die Kamera. Sag Beende den Scan.`

```
Scanne das Objekt
```

Der Name ist `Objekt`.

```
Beende den Scan
```

Mit Tiefe und einem Klumpen vor der Fläche: `Apfel liegt auf dem Tisch.`
Der Tisch-Hintergrund ist wieder da. Ein Finger dreht, zwei schieben, Ziehen zoomt.
Liegt alles auf der Fläche: `Apfel löst sich nicht von der Fläche. Kein Modell.`

## 3. Möbel

```
Entferne alles aus dem Raum
```

Ohne Klassen: `Keine Klassen. Nichts entfernt.`

```
Tausche Bett mit Schreibtisch
```

Fehlt eine Klasse: `Bett fehlt. Nichts getauscht.` oder `Schreibtisch fehlt. Nichts getauscht.`
Beide Klassen da: `Bett und Schreibtisch getauscht.`

## 4. Bleibt liegen

```
PC QR scannen
```

Weiter der PC-Code, kein Raum-Scan.

```
Kontakte scannen
```

Weiter die Kontakte.

```
Tisch an
```

Kein Tischplatten-Befehl.

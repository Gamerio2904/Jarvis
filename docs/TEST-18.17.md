# TEST 18.17 — Kalender Alltag

Nach Execute von [`89-next.md`](./89-next.md). App-Code **`18.17.0`**.
Sideload **`18.17.0`**, versionCode `181700`. Over `18.16.0` installieren.

Gerät, nicht nur die Cloud-VM. Jede Box ist ein Satz — **einmal tippen, kopieren, in den Chat**.

## 1. Version

Einstellungen / Hilfe nennt **`18.17.0`**. Nicht `18.16.0`.

## 2. Hausstand nimmt Termine mit

```
Termin morgen 15 Uhr Zahnarzt
```

Dann 24 Stunden davor. Dann Einstellungen → Hausstand → Exportieren.
JSON enthält `"events"` und `"calendar_ics"`. Vorschau nennt **Termine**.

Nach Import (Überschreiben ja): Zahnarzt wieder da, Erinnerung wie zuvor.

ICS allein: Folie → **ICS**, oder:

```
Kalender als ICS
```

Datei ohne Keys. Unter Hausstand `.ics` wählen → **Termine übernehmen**. Groq-Key bleibt.

## 3. Serie

```
jeden Montag 18 Uhr Training
```

Trace **calendar**, nicht reminder. Folie: nächste Montage Training.

```
Jeden Dienstag Müll
```

bleibt **Erinnerung**, kein Kalender-Diebstahl.

## 4. Bestehendes (nicht kaputt)

```
Termin morgen 15 Uhr Zahnarzt
```

```
was steht heute so an?
```

```
was steht diese Woche an?
```

```
Samstag Geburtstag Jakob 18 Uhr
```

```
Verschieb Jakob auf Sonntag 19 Uhr
```

```
Änder Maxi Geburtstag in Jakob Geburtstag
```

```
Kalender
```

```
Kalender zu
```

Folie: Monat/Woche/Liste/Jahr, anlegen, ändern, löschen, Thema, Erinnerungs-Chips.

## 5. Konflikt und Dauer

Zwei Termine am selben Nachmittag nah beieinander: Antwort nennt **Achtung** und überlappenden Titel. Beide liegen.

```
Termin morgen von 15 bis 16 Uhr Zahnarzt
```

Ende 16 Uhr, nicht still 60 min raten wenn der Satz die Spanne hat.

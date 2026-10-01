# 96 — Portfolio auf dem Hauptbildschirm **CODE** (`18.24`)

**Dieses Dokument ist CODE.** App-Code **`18.24.0`** (versionCode `182400`).
Sprints **417–423**. Katalog-Stand bleibt `18.20.0`.
Die Sideload-Datei dieses Stands ist `18.24.0`, versionCode `182400`.
Die laufende Sideload-Datei ist **`18.25.4`** (versionCode `182504`). Der Prompt je Sprint liegt seit App-Code `18.24.8`. Der laufende App-Code ist **`18.25.4`**.

Der jetzige Tischplatten-Modus ist die Planung. `Plane das` zeigt das
Skript live. `Go`, `Umsetzen`, `Leg los`, `So` oder `Übernehmen` setzen
es fest. In dem Moment liegt das Projekt im Portfolio, mit Dateien und
einem kurzen Namen. Der Hauptbildschirm zeigt diese Karten. Ein Tipp
oder ein Satz öffnet die Dateien.

Die Fläche bleibt die Tafel aus [`94-next.md`](./94-next.md) und der
Ablauf aus [`95-next.md`](./95-next.md). Kein zweites Hirn, kein neuer
Agent, kein neues Bildmodell.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.** Der
Parser entscheidet Portfolio, Öffnen, Beispiel und Archiv. Das Modell
erfindet keinen Namen und keinen Erfolg.

Jarvis schreibt dabei keine App-Datei, keine Sprint-Datei, keine Version
und kein APK.

---

## 0. Antwort in einem Satz

`Go` legt das live Skript ins Portfolio. Der Hauptbildschirm zeigt die
Karte. Ein Tipp oder `Zeig Projekt …` öffnet die Dateien.

---

## 1. Zwei Zustände der Tischplatte

`plan_phase` `live` ist die Planung. Dann bleibt `ScriptStage` in der
Mitte, so wie heute. Sprintliste, PSP und die Sätze `Plane das`,
`Lade den PSP runter` und `Lade alles zu Projekt …` bleiben.

`plan_phase` `go` ist fest. Dieselbe Idee bekommt genau eine
Portfolio-Zeile. Die Mitte wechselt auf das Portfolio. Das Skript liegt
in den Dateien der Zeile, nicht noch einmal als live Tafel.

`plan_phase` leer und Tischplatte an: die Mitte ist das Portfolio.
Tischplatte aus: das Icon-Raster `HOME_APPS` bleibt. Die Icons in der
Leiste bleiben in allen drei Fällen.

Ein zweites `Go` auf derselben Idee schreibt die Dateien neu und legt
keine zweite Zeile an. Eine geleerte live Tafel lässt die Zeile liegen.

---

## 2. Speicher

Sichtbar ist eine Karte. Gespeichert wird eine Zeile pro Idee.
IndexedDB `jarvis-ondevice` geht von Version 13 auf 14. Store-Name
`portfolio`.

| Feld | Was |
|------|-----|
| `id` | dieselbe Id wie die Idee |
| `idea_id` | dieselbe Id |
| `name` | kurzer Name, höchstens 22 Zeichen |
| `slug` | `projectSlug` aus `project-docs.ts` |
| `title` | voller Ideentitel |
| `fixed_at` | Zeitpunkt von `Go` |
| `cover` | `drawn`, `photo` oder `research`, dazu die Bildquelle |
| `files` | `projekt`, `sprints`, `psp`, danach Beispiele |
| `archived` | `true`, wenn die Karte durch den Schlitz ging |

Der kurze Name nimmt die ersten zwei Wörter des Titels vor dem ersten
Komma. Füllwörter `der`, `die`, `das`, `ein`, `eine`, `und`, `projekt`
fallen weg. Bleibt nichts, heißt die Karte `Projekt`. Der Name wird
nicht vom Modell erfunden. `Tik Tak To` bleibt `Tik Tak To`.
`Einkauf, Liste schreiben und Route prüfen` wird `Einkauf`.

### Kartenbild

Es gibt kein Imagen und keinen Satz `generiere ein Bild`. Das erste
Bild zeichnet das Gerät: Canvas 512 px, JPEG bei Qualität 0,7, höchstens
120 KB, zwei Buchstaben aus dem kurzen Namen, Farbe aus dem Titel.
`cover.kind` ist dann `drawn`.

Liegt später ein Beispiel in der Zeile, zeigt die Karte dieses Bild.
Ein Recherche-Bild setzt `research` und behält die Quelle. Ein Foto
setzt `photo`.

### Dateien und Ordner

Beim Festschreiben entstehen drei JSON-Dateien aus den Funktionen, die
es schon gibt: `projectDocument`, `sprintsDocument`, `pspDocument`.
Dazu das Kartenbild.

Auf dem Handy liegt dieselbe Mappe unter `Downloads/portfolio/<slug>/`:

```
portfolio/<slug>/cover.jpg
portfolio/<slug>/projekt.json
portfolio/<slug>/sprints.json
portfolio/<slug>/psp.json
portfolio/<slug>/beispiele/<name>.jpg
```

`saveDownload` in `JarvisDevicePlugin.java` streicht Schrägstriche und
hängt `.json` an. Dafür kommt eine eigene Methode `saveTreeFile`. Sie
nimmt nur Pfade, die auf `portfolio/` zeigen, lehnt `..` ab und schreibt
JPEG, PNG, WebP oder JSON. Schlägt sie fehl, bleibt die Zeile im Store.
Antwort dann: `Im Haus gespeichert. Der Ordner fehlt.`

Wahrheit ist der Store. Die Mappe ist die sichtbare Kopie.

### Grenzen

Höchstens 48 Projekte. Höchstens sechs Beispiele je Projekt. Ein
Beispiel hat die lange Kante 1024 px und höchstens 400 KB. Was darüber
liegt, wird einmal auf Qualität 0,6 gerechnet. Passt es dann noch
nicht: `Das Bild ist zu groß.` und nichts gespeichert.

### Hausstand

`Hausstand exportieren` bleibt eine Datei `jarvis-haus-….json`. Sie
enthält `portfolio`: jede Zeile, auch archivierte, mit Dateitext und
den gekappten Bildern. Die Vorschau nennt die Zahl, auch null:
`3 Projekte`. Ist mindestens eine Zeile archiviert, hängt `, 1 im Archiv`
an.

Eine alte Datei ohne Schlüssel `portfolio` lässt den Store. Ist der
Schlüssel da, auch als leeres Array, ersetzt der Import den Store.
Debug-Rollback führt `portfolio` neben `ideas` und `plans`.

Bewegung der Tafel und `last_research_json` bleiben draußen, wie bisher.
Ein Beispiel kommt nur in den Hausstand, wenn es in einer Zeile liegt.

---

## 3. Hauptbildschirm

Solange die Tischplatte an ist und `plan_phase` nicht `live` ist, zeigt
die Mitte das Portfolio. Die Liste ist die Shredder-Komponente von
[reactbits.dev/micro/shredder](https://reactbits.dev/micro/shredder).

Beim CODE-Sprint wird die TS-CSS-Variante nach
`frontend/src/ui/Shredder.tsx` kopiert. Die Klassen liegen in
`index.css` unter `.shredder`. Kein Tailwind, kein Laufzeit-Fetch, keine
neue Animationsbibliothek.

Jede Zeile braucht eine eigene `id`. `renderItem` zeigt das Kartenbild
und den kurzen Namen. Eigenschaften: `feedSpeed` 180, `bite` 18,
`stripWidth` 10, `curl` 1, `dragTilt` 6, `lift` 1.02, `autoAnimate`
false. `autoFeed` nur, während eine Zeile im Schlitz ist.

Ein Tipp, der sich weniger als 8 px bewegt, öffnet das Projekt.
`onShred` setzt `archived` auf true. Die Karte und ihre Beispiele
verlassen die Liste. Die Dateien im Store, in der Mappe und im
Hausstand bleiben. Die Antwort ist `Tik Tak To liegt im Archiv.`

Unter `prefers-reduced-motion` fällt die Karte in 120 ms Deckkraft weg,
ohne Streifen.

Beispiele stehen als eigene Zeilen unter ihrer Projektkarte, mit dem
kurzen Namen als Beschriftung. Eine Beispielzeile durch den Schlitz
archiviert nur dieses Bild.

### Dateiliste

Nach dem Öffnen liegt die Liste vor der Shredder-Liste. Die Liste
dahinter hat Deckkraft 0,45 und nimmt keinen Finger an.

Die Dateien kommen nacheinander: Deckkraft 0 auf 1, 12 px nach oben,
280 ms, Kurve `cubic-bezier(0.2, 0.8, 0.2, 1)`, je Zeile 50 ms später,
Skala 0,96 auf 1. Wenig Bewegung nur 120 ms Deckkraft.

Reihenfolge: `projekt.json`, `sprints.json`, `psp.json`, dann die
Beispiele. Ein Tipp auf JSON zeigt den Projekttitel und die
Sprintzeilen. Ein Tipp auf ein Bild zeigt das Bild und, bei Recherche,
die Quelle. `Zurück` oder der Satz `Portfolio` schließt die Liste.

---

## 4. Sätze

Der Parser nimmt nur diese Formen. `Plane das`, `Go` und die
Download-Sätze bleiben, wo sie sind.

```
Portfolio
Zeig das Portfolio
Zeig Projekt Tik Tak To
Beispiel zu Tik Tak To
Beispiel zu Tik Tak To: Bild der Elbe
Schredder Tik Tak To
Archivier Projekt Tik Tak To
Hol Projekt Tik Tak To zurück
```

`Portfolio` und `Zeig das Portfolio` öffnen die Mitte. Leer:
`Das Portfolio ist leer.`

`Zeig Projekt` trifft zuerst den kurzen Namen, dann den vollen Titel.
Zwei Treffer: `Welches: Einkauf, Einkauf Liste.` Kein Treffer:
`Das Projekt liegt nicht im Portfolio.`

`Beispiel zu` ohne Bildrest nimmt das erste vorhandene Bild in dieser
Reihenfolge: das letzte Chat-Bild dieser Unterhaltung, dann
`readLastEyeImage()`. Mit Bildrest holt `image-fetch.ts` genau dieses
eine Bild. Ohne Bild: `Kein Bild zum Speichern.` Ohne Projekt:
`Welches Projekt?` Mit Bild: `Beispiel liegt bei Tik Tak To.`
`Zeig mir London` bleibt die Kugel. Eine Recherche ohne diesen Satz
speichert kein Bild.

`Schredder` und `Archivier Projekt` tun dasselbe wie der Schlitz.
`Hol Projekt … zurück` setzt `archived` auf false. Die Karte steht
wieder in der Liste.

Nach einem echten Festschreiben lautet die Antwort
`Fest. Tik Tak To liegt im Portfolio.` War die Zeile schon da:
`Tik Tak To liegt schon im Portfolio.` Die Dateien werden neu
geschrieben. Ohne live Skript bleibt der bisherige Satz von `Go`.

---

## 5. Won't

- Ein neuer Agent oder ein Schwarm
- Imagen, `generiere ein Bild`, ein gemaltes Szenenbild
- Jede Recherche automatisch als Beispiel speichern
- Der Schlitz oder `Schredder` löscht Dateien
- Ein Tipp schreddert die Karte
- Tailwind, Laufzeit-Fetch von reactbits.dev, WebGL, Three.js, Lottie
- Das Icon-Raster ersetzen, solange die Tischplatte aus ist
- Die live Planung durch das Portfolio ersetzen
- `saveDownload` für Ordner oder Bilder weiterverwenden
- App-Datei, Sprint-Datei, Version oder APK aus dem Gerät
- Die Datei auf `main` als `18.24.0` zeigen, solange dort noch `18.23.12` liegt
- Eine zweite Hausstand-Datei neben `jarvis-haus-….json`

---

## 6. Sprints (`18.24.0` CODE)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [417](./sprints/sprint-417.md) | Zeile und kurzer Name bei Fest | Must CODE |
| [418](./sprints/sprint-418.md) | Dateien und Mappe | Must CODE |
| [419](./sprints/sprint-419.md) | Hauptbildschirm, Shredder | Must CODE |
| [420](./sprints/sprint-420.md) | Tipp, Satz, Dateiliste | Must CODE |
| [421](./sprints/sprint-421.md) | Beispiele auf der Fläche und im Ordner | Must CODE |
| [422](./sprints/sprint-422.md) | Portfolio im Hausstand | Must CODE |
| [423](./sprints/sprint-423.md) | Gold, Testkarten, Version erst dann | Must CODE |

Kette: 417 vor 418. 418 vor 419, vor 421 und vor 422. 419 vor 420.
420 vor 421. 422 vor 423. 423 zuletzt.

Test-Sätze: [`TEST-18.24.md`](./TEST-18.24.md).

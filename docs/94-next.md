# 94 — Tafel auf der Tischplatte **PLAN** (`18.22`)

**Dieses Dokument ist CODE.** App-Code **`18.22.0`** (versionCode `182200`).
Sprints **404–409**.
Die Fläche bleibt die Tischplatte aus [`91-next.md`](./91-next.md). Kein
zweites Brett, kein neues Hirn.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.** Parser
wählen. Weiter **ein** Agent `board` pro Zug. Kein Schwarm.

Die Fotos dazu sind nur die Anordnung: dunkles Glas, feine Kante, ein Ring,
kurze Listen. Keine Fremdlogos, keine Standbilder, keine erfundenen
Messwerte.

---

## 0. Antwort in einem Satz

Die Tischplatte ist eine Tafel. Sprintliste, PSP und ein paar weitere
Stücke liegen gleichzeitig darauf. Der Finger und Jarvis schieben jedes
Stück auf demselben Weg, auch aus dem Bild.

---

## 1. Stücke

Neun Stücke. Sieben liegen zum Start auf der Fläche. Module und Draht
liegen beiseite, bis ein Satz sie holt.

| Stück | Satzname | Was darauf steht | Wenn nichts da ist |
|-------|----------|------------------|--------------------|
| Sprintliste | die Sprintliste | Nummer und eine Zeile, aufsteigend sortiert | `Noch kein Sprint.` |
| PSP | den PSP | Drei Ebenen, eingerückte Liste | `Noch kein Auftrag.` |
| Auftrag | den Auftrag | Titel der offenen Idee, in der Mitte | `Sagen Sie Idee: …` |
| Uhr | die Uhr | Stunde und Minute aus der Gerätezeit, ein Ring für die Minute | die Uhr bleibt |
| Quellen | die Quellen | Letzte Recherche, kurzer Titel und Host, höchstens sechs | `Keine Quellen.` |
| Termin | den Termin | Nächster Termin aus dem Kalender, Uhrzeit | `Kein Termin.` |
| Jobleiste | die Jobleiste | Laufende Tafel-Jobs, höchstens drei Zeilen | `Keine Jobs.` |
| Module | die Module | Die bisherigen App-Namen der Werkbank | liegt beiseite |
| Draht | den Draht | Die bisherigen Drahtzeilen einer App | `Kein Draht.` |

**Sprintliste.** Ist eine Idee offen, sind es deren Sprints. Die Zeile ist
das Ziel, sonst der Titel. Ein leeres Ziel bleibt `Noch leer.`, wie heute.
Ist keine Idee offen, zeigt die Liste die Produkt-Sprints, die im
Feature-Katalog als geplant stehen: Nummer und die eine Zeile aus dem
Katalog. Überschrift dann `Geplant, noch nicht gebaut.` Jarvis erfindet
keine Nummer und liest zur Laufzeit keinen Docs-Baum.

**PSP.** Genau drei Ebenen, als Liste, nicht als Netz:

```
Auftrag
  1  Titel
     eine Zielzeile
```

Kein Pfeil, keine vierte Ebene, keine Bibliothek für Graphen.

**Uhr.** Ein Ring, eine Zeit. Der Ring zeigt die Minute. Kein Wetter,
keine Auslastung, keine Schlagzeile, keine Musik.

**Quellen und Termin.** Quellen aus `last_research_json`. Termin aus
`listEvents` plus der nächsten Wiederholung. Ein Tippen öffnet nichts
von selbst.

**Jobleiste.** Dieselben Jobs wie heute. `Stopp` bleibt der bisherige Satz.

Bis Sprint 407 schalten `Zeig Module` und `Simulier …` noch die heutige
Vollfläche. Die sieben Stücke gelten für Sprints, PSP und Quellen.

---

## 2. Lage

Ab **900 px** liegen die Stücke frei auf der bestehenden Wand (Motiv,
Akzent, Glas). Start, bevor jemand schiebt:

| Stück | Start |
|-------|--------|
| Uhr | links oben |
| Termin | unter der Uhr |
| Sprintliste | links |
| Auftrag | Mitte |
| PSP | rechts der Mitte |
| Quellen | rechts |
| Jobleiste | unten, breit |
| Module, Draht | Ablage |

Darunter bleiben die Stücke untereinander, in derselben Reihenfolge. Der
Finger verschiebt dort nichts. Ein Schiebe-Satz antwortet `Die freie Fläche ist das Tablet.` und lässt die Reihenfolge. Werfen und Zurückholen
gelten auch dort: das Stück geht in die Ablage oder kommt zurück.

Positionen liegen in den Einstellungen (`tischplatte_pieces_json`), Anteile
der Fläche von 0 bis 1, nicht Pixel. Sie gehen in den Hausstand mit, weil
es eine Lage ist. Kein Server.

Zwei Stücke dürfen übereinander liegen. Ein Satz schiebt nur das genannte
Stück.

Der Mini-Chat lässt die Fläche frei, wie in `18.20.1`. Die Leiste, die
Kugel und die Navigation sind keine Stücke.

---

## 3. Bewegung

Ein Weg für den Finger und für den Satz: `movePiece`.

1. **Anfassen.** Das Stück wird knapp kleiner, die Kante in Akzent, der
   Schatten größer. Etwa 80 ms.
2. **Fahrt.** Feder, etwa 480 ms, mit kleinem Überschwingen, an die Stelle.
3. **Ablegen.** Größe und Schatten zurück.

Die Stelle eines Satzes ist einer von fünf Ankern: links, rechts, oben,
unten, Mitte. Die Bruchteile setzt Sprint 405 einmal im Code fest. Der
Finger setzt frei, innerhalb der Fläche.

**Aus dem Bild.** Das Stück fährt in der Richtung weiter, verlässt die
Fläche und steht in der Ablage links. Die letzte Stelle auf der Fläche
bleibt gespeichert. `Hol … zurück` fährt dorthin zurück.

**Räum den Tisch.** Jedes Stück auf der Fläche, nacheinander, kurzer
Abstand, in die Ablage. Die Tischplatte bleibt an.

**Jarvis fasst an.** Vor der Fahrt eines Satzes liegt kurz ein Akzent-Ring
auf dem Stück. Die Antwort im Chat kommt, wenn die Fahrt zu Ende ist,
spätestens nach 1,2 s.

**Wenig Bewegung.** `prefers-reduced-motion`: das Stück blendet kurz um
und steht an der neuen Stelle. Kein Flug, kein Nacheinander, keine Feder.

**Vibration.** Ein kurzer Tick beim Greifen und beim Ablegen, wenn das
Gerät das kann. Fehlt die Schnittstelle, ist die Fahrt trotzdem fertig.

---

## 4. Sätze

Der Parser nimmt nur diese Formen. Thema, Recherche, Idee, Kalender anlegen
und `nächster Lidl` bleiben, wo sie sind.

Schieben, auf der Fläche:

```
Schieb die Sprintliste nach links
```

```
Schieb den PSP nach rechts
```

```
Schieb die Uhr nach oben
```

```
Schieb die Quellen nach unten
```

```
Leg die Uhr in die Mitte
```

```
Schieb den Auftrag in die Mitte
```

Aus dem Bild, Ablage, zurück:

```
Wirf die Quellen vom Tisch
```

```
Schieb die Sprintliste aus dem Bildschirm
```

```
Hol die Sprintliste zurück
```

```
Räum den Tisch
```

Die Stücknamen sind: Sprintliste, PSP, Auftrag, Uhr, Quellen, Termin,
Jobleiste, Module, Draht. Artikel wie in den Beispielen.

Unbekanntes Stück: `Das Stück gibt es nicht.` und die neun Namen.
Liegt es schon in der Ablage: `Die Sprintliste liegt in der Ablage.`
Liegt es schon auf der Fläche und soll zurück: `Die Sprintliste liegt schon auf dem Tisch.`
Nach einer Fahrt nennt die Antwort das Stück und den Anker: `Sprintliste liegt links.`

**Bisherige Sätze bleiben `board`.** Ab Sprint 406 holen sie das Stück
nach vorn (Akzent-Ring), die anderen bleiben liegen.

```
Tischplatte an
```

```
Zeig Sprints
```

```
Zeig PSP
```

```
Zeig Quellen
```

```
Zeig Module
```

`Simulier Kalender` holt den Draht und füllt ihn mit dem bisherigen
Draht dieser App. `Neuer Hintergrund` und `Hintergrund blau schwarz`
bleiben das Thema der Wand, kein Schieben.

---

## 5. Won't

- Standbilder, Fremdlogos, Reaktor-Grafik, Gesicht
- Erfundene Auslastung, erfundenes Wetter, erfundene Schlagzeilen, Musik
- WebGL, Three.js, Lottie, tldraw, eine Graph-Bibliothek
- Ein zweites Brett neben der Tischplatte
- Das Modell wählt die Stelle. Der Parser setzt den Anker
- Freies Schieben auf dem Handy
- Die Kugel, den Körper, die Lage anfassen
- Quellen oder Termine löschen, nur weil das Stück in der Ablage liegt
- Die Version oder die Testkarten, bevor die Fahrt im Code liegt
- Den Datei-QR aus [`93-next.md`](./93-next.md) mitziehen

---

## 6. Sprints (`18.22.0` CODE)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [404](./sprints/sprint-404.md) | Neun Stücke, echte Daten, leere Sätze | Must PLAN |
| [405](./sprints/sprint-405.md) | Finger, Anker, Lage in den Einstellungen | Must PLAN |
| [406](./sprints/sprint-406.md) | Schiebe-Sätze, selber Weg, alte Sätze holen nach vorn | Must PLAN |
| [407](./sprints/sprint-407.md) | Ablage, wenig Bewegung, Tick | Must PLAN |
| [408](./sprints/sprint-408.md) | Ring vor der Fahrt, nacheinander, Antwort danach | Must PLAN |
| [409](./sprints/sprint-409.md) | Gold, Testkarten, Version erst dann | Must PLAN |

Kette: 404 vor 405. 405 vor 406. 406 vor 407. 407 vor 408. 409 zuletzt.
Test-Sätze: [`TEST-18.22.md`](./TEST-18.22.md). Die Karten kommen in Spur
Heute erst, wenn 409 ausgeführt ist.

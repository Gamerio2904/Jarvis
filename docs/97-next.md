# 97 — Entwurf auf der Tafel **CODE + APK** (`18.25.0`)

**Dieses Dokument ist CODE.** Die Rahmen liegen in der App.
App-Code und Sideload sind **`18.25.9`** (versionCode `182509`):
https://github.com/Gamerio2904/Jarvis/raw/main/releases/Jarvis.apk
Die Datei `releases/Jarvis.apk` auf `main` ist dieser Stand: Entwurf,
Portfolio, Ultron-Fläche, Raum- und Objekt-Scan, Schachbrett, rotes Auge.

`18.24.0` bis `18.24.8` sind gebaut. Sprints **417–423** gehören zum
Portfolio in [`96-next.md`](./96-next.md). Der Scan liegt in
[`roomar-openscan-plan.md`](./roomar-openscan-plan.md), Test
[`TEST-18.24.6.md`](./TEST-18.24.6.md). Die Sideload dieser Schiene ist `18.25.9`.

Der Entwurf ist **`18.25.0`** (versionCode `182500`). Sprint 430 ist im Code und in der Sideload.

Sprints **424–430**.
Die Fläche bleibt die Tafel aus [`94-next.md`](./94-next.md) und die
Chromplatten aus `18.24.5`. `Plane das` bleibt der Ablauf aus
[`95-next.md`](./95-next.md). `Go` bleibt das Portfolio.
`Simuliere Kalender` bleibt der Draht in `board-wire.ts`.
`Scanne den Raum` und `Scanne den Apfel` bleiben `room-scan.ts`.
Kein zweites Brett, kein neues Hirn, kein neuer Agent.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.**
Der Parser öffnet, schließt und merkt die Wahl. Das Modell füllt nur
Beschriftung und Bausteinart. Es schreibt kein CSS und keinen Komponenten-Code.

---

## 0. Antwort in einem Satz

`Entwirf eine App: Einkaufsliste` legt bis zu drei stumme Bildschirme auf
die Tischplatte. Jeder ist ein Gerüst aus festen Bausteinen, eine kleine
App ohne Funktion. Ein Tipp oder `Die zweite` merkt die Wahl.

---

## 1. Was ein Entwurf zeigt

Ein Entwurf ist ein Bildschirm. Eine Spalte, höchstens sechs Bausteine.
Bis zu drei Entwürfe liegen nebeneinander. Sie sehen aus wie eine kleine
App und bleiben eine Attrappe: kein Tippen in ein Feld, kein Speichern,
kein Wechsel auf eine zweite Seite, kein Agent.

Die Bausteine stehen fest im Code, auf derselben Platte wie die Tafel.

| Art | Was man sieht | Was der Finger in der Attrappe tut |
|-----|----------------|-------------------------------------|
| Leiste | eine Zeile, der Titel | nichts |
| Liste | bis zu fünf Zeilen | nichts |
| Karte | eine Fläche, eine Zeile | nichts |
| Knopf | eine Zeile in einer Pille | nichts |
| Feld | eine leere Zeile, ein Platzhalter | keine Tastatur |
| Tab | zwei oder drei Wörter nebeneinander | kein Wechsel |

Eine Art, die nicht in der Tabelle steht, fällt weg. Ein Entwurf mit
weniger als einem Baustein fällt weg. Bleibt keiner übrig, bleibt die
Tafel, wie sie war. Antwort: `Kein Entwurf. Der Text nennt keine Fläche.`

Beschriftungen kommen aus dem Arbeitstext, höchstens 42 Zeichen je Zeile.
Fehlt eine Zeile, steht `Noch leer.` Der Entwurf erfindet keinen Termin,
keine Zahl aus dem Store, kein Foto, kein Logo, keine Quelle.

Erscheinen, einmal, drei feste Arten im Code: `sofort`, `gleiten`,
`aufklappen`. Dauer höchstens 280 ms. Unter `prefers-reduced-motion`
nur Deckkraft, 120 ms, keine Verschiebung. Keine Schleife, kein WebGL.

---

## 2. Inspiration zu einem Baustein

`Zeig mir Inspiration zum Knopf` und `Hast du Animationen zur Karte`
öffnen keine Bibliothek. Sie legen drei Muster desselben Bausteins
nebeneinander. Die Muster stehen im Code. Dieselben sechs Arten wie in §1.

| Satz, Beispiele | Baustein | Die drei Muster |
|-----------------|----------|-----------------|
| `Inspiration zum Knopf`, `Animationen zum Knopf` | Knopf | `sofort`, `gleiten`, `aufklappen`, Beschriftung `Weiter` |
| `zur Karte` | Karte | flach, Haarlinie, Akzentlinie |
| `zur Liste` | Liste | drei, vier, fünf Zeilen, Text `Zeile` |
| `zur Leiste` | Leiste | Titel links, Titel mittig, Titel mit Nebenwort |
| `zum Feld` | Feld | Platzhalter `Suchen`, `Name`, `Notiz` |
| `zum Tab` | Tab | zwei Wörter, drei Wörter, ein Wort breit |

`Die erste` merkt das Muster. Das nächste `Entwirf` benutzt es für
diesen Baustein, bis `Entwurf zu`. Ein Baustein ohne gemerkte Wahl
nimmt das erste Muster.

ReactBits, shadcn, Tailwind, Motion, GSAP, Three.js und OGL bleiben
draußen. Die Vorschau lädt keine Seite und kein Paket. Die drei Muster
sind die Auswahl auf der Tischplatte.

---

## 3. Speicher

Sichtbar sind die Rahmen. Gespeichert wird jeder Entwurf, der einmal
`offen` war. Der nächste `Entwirf` setzt den vorigen auf `zu` und lässt
die Zeile liegen. Der alte zeichnet sich nicht noch einmal.

Zwei lokale Dinge, kein Repo:

| Was | Wo | Inhalt |
|-----|----|--------|
| Entwurf | Store `drafts`, eine Zeile | Titel, bis zu drei Varianten, Wahl, Bewegung, Status |
| Wahl eines Musters | Einstellungen `entwurf_muster` | Baustein und Musterindex, bis `Entwurf zu` |

Die Einstellungen halten dazu `entwurf_id`. Kein zweites Vollstück in
`entwurf_json`. IndexedDB steht auf 14, mit Store `portfolio`. Der
Entwurf hebt sie auf 15 und legt nur `drafts` an. `portfolio`, `plans`
und `ideas` bleiben.

Form einer Zeile:

- `title`: eine Zeile, höchstens 80 Zeichen
- `variants`: bis zu drei Varianten, jede mit `name` und bis zu sechs Bausteinen `art` und `zeile`
- `pick`: `0`, `1`, `2` oder leer
- `motion`: `sofort`, `gleiten` oder `aufklappen`
- `status`: `offen`, `gewählt`, `zu`

`Plane das` legt keine Entwurfszeile an. `Entwirf` legt keine Idee an
und kein Portfolio-Projekt. `Go` legt keinen Entwurf an.

### Hausstand

Dieselbe Datei `jarvis-haus-….json` enthält `drafts`, jede Zeile, auch `zu`.
Die Vorschau nennt die Zahl, auch null: `2 Entwürfe`. Eine alte Datei ohne
Schlüssel `drafts` lässt den Store. Ist der Schlüssel da, auch als leeres
Array, ersetzt der Import den Store. `entwurf_id` kommt mit den
Einstellungen. Fehlt die Zeile dazu, bleiben die Rahmen zu.

Debug-Rollback führt `drafts` in derselben Store-Liste wie `plans` und
`portfolio`.

---

## 4. Fläche

Solange der Status `offen` oder `gewählt` ist und die Zeile die
`entwurf_id` ist, liegen bis zu drei Rahmen in der Mitte der Tafel.
Sie sind keine Tafelstücke: kein Ziehen, kein Werfen, `Räum den Tisch`
trifft sie nicht. Ein Finger auf dem Scan-Modell dreht weiter, sobald
die Rahmen zu sind.

Die sieben Stücke dahinter bleiben liegen, Deckkraft 0,45, und nehmen
keinen Finger an. Der Mini-Chat bleibt benutzbar.

Ist ein Ablauf `schreibt`, `warten`, `überarbeitet` oder `läuft`, bleiben
die Rahmen zu. Antwort: `Erst den Ablauf.`

Ist der Scan `live` oder `model`, bleiben die Rahmen zu. Antwort:
`Erst den Scan.` `Beende den Scan`, `Scan beenden`, `Bennede den Scan`
und der Knopf `Beende den Scan` bleiben der Scan. Danach darf `Entwirf`
wieder zeichnen.

Ab **900 px**: eine Reihe, Abstand 16 px, jeder Rahmen
`min(220px, 26vw)` breit und `min(64vh, 520px)` hoch. Dieselbe Platte
wie Start und Tafel. Auf geht jede Spalte in 280 ms. Unter
`prefers-reduced-motion` nur 120 ms Deckkraft.

Darunter: dieselben Rahmen untereinander, Rand 12 px. Sie scrollen innen.
Der Tisch scrollt nicht mit.

Kopfzeile über der Reihe: links in Versalien **Entwurf**, daneben der
Titel, rechts **offen** oder **gewählt**.

Schreiben, live: die Daten kommen im Ganzen an, die Rahmen füllen sich
nacheinander. Zuerst die Kopfzeile. Dann je Rahmen die Bausteine als
ganze Zeile, Abstand etwa 80 ms. Steht der letzte Baustein, wird der
Status **offen**. Wenig Bewegung zeigt alles auf einmal.

Wählen: der gewählte Rahmen bekommt die Akzentlinie. Die anderen bleiben
auf Deckkraft 0,45. Chat: `Entwurf 2. Einkaufsliste.`

`Entwurf zu` und `Fenster zu` schließen die Rahmen. Die Zeile bleibt,
Status `zu`. Die Stücke nehmen den Finger wieder an. `Zeig Sprints`,
`Zeig PSP`, `Simuliere Kalender`, `Scanne den Raum`, `den Raum scannen`
und `Scanne den Apfel` schließen die Rahmen ebenfalls und lassen die Zeile
auf `offen`, wenn noch nichts gewählt ist.

Ein Tipp auf den Rahmen wählt ihn. Ein Tipp auf Leiste, Liste, Karte,
Knopf, Feld oder Tab ändert nichts und öffnet nichts.

---

## 5. Sätze

Der Parser in `entwurf-parse.ts` nimmt nur diese Formen. Der Executor
bleibt `board`. Nachbarsätze bleiben, wo sie sind.

Öffnen. `Entwirf das` allein nimmt die vorige Nutzernachricht desselben
Gesprächs, gekürzt auf 2000 Zeichen. Fehlt sie: `Was soll der Entwurf zeigen?`
und keine Rahmen.

```
Entwirf eine App: Einkaufsliste mit Listen und einem Knopf Fertig
```

```
Entwirf das
```

```
Entwirf: Notizen, drei Karten, ein Feld oben
```

Der Text nach dem Doppelpunkt oder nach `Entwirf eine App:` ist der
Arbeitstext. Ein zweites `Entwirf`, solange Rahmen offen sind, öffnet
eine neue Zeile. Die vorige bleibt, Status `zu`.

Inspiration, ohne Arbeitstext ans Modell:

```
Zeig mir Inspiration zum Knopf
```

```
Hast du Animationen zur Karte
```

```
Inspiration zur Liste
```

Trifft der Name keinen Baustein aus §1: `Den Baustein gibt es nicht.`
und die sechs Namen. Keine Rahmen einer App.

Wählen, nur solange Rahmen offen sind:

```
Die erste
```

```
Die zweite
```

```
Die dritte
```

`Die zweite` bei nur einem Rahmen: `Die Zeile gibt es nicht.` Die Zahl
zählt von links, auf dem schmalen Bildschirm von oben. Ohne offene Rahmen
fällt `Die erste` durch, wie bisher.

Schließen:

```
Entwurf zu
```

Ohne offene Zeile: `Es ist kein Entwurf offen.`

`Simuliere Kalender` bleibt Sicht `sim` und der Draht mit echtem Termin
oder `Kein Termin im Store.` `Plane das` bleibt der Ablauf.
`Go` bleibt das Portfolio. `Zeig Projekt …` bleibt die Dateiliste.
`Mach einen Sprintplan` bleibt die Vorlage. `Hintergrund blau schwarz`
bleibt das Thema. `nächster Lidl` bleibt `poi`. `Zeig mir London` bleibt
die Kugel. `Scanne den Raum`, `den Raum scannen`, `Scanne den Apfel`,
`Beende den Scan`, `Scan beenden`, `Bennede den Scan`,
`Entferne alles aus dem Raum` und `Tausche Bett mit Schreibtisch` bleiben
der Scan. Der Knopf `Beende den Scan` auf der Kamera bleibt derselbe Weg.

Chat, sobald die Rahmen `offen` sind:

```
Entwurf. Einkaufsliste.
1. Liste
2. Karten
3. Feld
Sag die erste, die zweite oder die dritte.
```

Nach der Wahl: `Entwurf 2. Einkaufsliste.`

---

## 6. Modell

Ein Aufruf, erst ab Sprint 425. Das Modell sieht den Arbeitstext und die
sechs Art-Namen. Es liefert bis zu drei Varianten. Der Code prüft jede
Art gegen §1, kürzt jede Zeile auf 42 Zeichen und wirft den Rest weg.
Eine Variante ohne gültigen Baustein fällt weg. Über drei Varianten fällt
der Rest weg. Die Antwort nennt die Grenze nicht noch einmal.

Das Modell legt keine Route an, keinen Store-Schlüssel, keine Datei und
keinen Agenten. Groq formuliert die Zeilen. Der 0,5B-Fallback darf dieselben
Felder füllen. Kommt nichts Gültiges zurück, gilt der Satz aus §1.

---

## 7. Won't

- Ein neuer Agent, ein Schwarm, ein iframe, eine zweite App
- ReactBits, shadcn, Tailwind, Motion, GSAP, Three.js, OGL, Lottie, tldraw
- CSS oder Komponenten-Code aus dem Modell
- Eine laufende Funktion: Tippen, Speichern, Navigieren, Agenten starten
- Echte Termine, Store-Zahlen, Fotos, Logos oder Web-Bilder in der Attrappe
- Mehr als drei Varianten, sechs Bausteine oder eine Spalte
- `Simuliere Kalender` zur Attrappe machen
- `Plane das`, `Go`, `Füll den Plan` und die Open-Source-Suche auf den Entwurf umbiegen
- `Scanne den Raum` und den Objekt-Scan auf den Entwurf umbiegen
- Die Rahmen ziehen, werfen oder als zehntes Tafelstück speichern
- Eine App-Datei, eine Sprint-Datei, eine Version oder eine APK aus dem Gerät
- versionCode außer `182500`, und den erst in Sprint 430
- Die Sideload `18.24.7` anheben, bevor Sprint 430 grün ist
- Testkarten in der App, bevor Sprint 430 ausgeführt ist

---

## 8. Sprints (`18.25.0` CODE)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [424](./sprints/sprint-424.md) | Sätze, Speicher, Nachbarn bleiben | Must CODE |
| [425](./sprints/sprint-425.md) | Modell füllt Varianten, ehrliche Leere | Must CODE |
| [426](./sprints/sprint-426.md) | Drei Rahmen auf der Tafel | Must CODE |
| [427](./sprints/sprint-427.md) | Inspiration, drei Muster, Wahl merken | Must CODE |
| [428](./sprints/sprint-428.md) | Wahl, Schließen, Ablauf und Scan gewinnen | Must CODE |
| [429](./sprints/sprint-429.md) | Entwürfe im Hausstand | Must CODE |
| [430](./sprints/sprint-430.md) | Gold, Testkarten, Version erst dann | Must CODE |

Kette: 424 vor 425 und vor 429. 425 vor 426. 426 vor 427. 427 vor 428.
429 hängt nicht an den Rahmen. 430 zuletzt, erst wenn 428 und 429 grün sind.
Test-Sätze: [`TEST-18.25.md`](./TEST-18.25.md). Die Karten liegen in Spur Heute, Gruppe `18.25 Entwurf`.

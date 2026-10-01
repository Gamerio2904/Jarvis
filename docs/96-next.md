# 96 — Entwurf auf der Tafel **PLAN** (`18.24`)

**Dieses Dokument ist PLAN.** Nichts davon liegt im App-Code.
App-Code und Sideload bleiben **`18.23.12`** (versionCode `182312`),
Datei `releases/Jarvis.apk` auf `main`.

Fertig gebaut ist diese Schiene erst als **`18.24.0`** (versionCode `182400`),
und erst wenn Sprint 423 grün ist. **`18.24.6` ist nirgends fertig:**
kein Zweig, kein Dokument, keine APK, kein versionCode `182406`.
Ein Patch `.6` entsteht erst nach sechs Nachziehern auf einem gelieferten
`18.24.0`. Dieser Plan legt `18.24.6` nicht fest und baut sie nicht.

Sprints **417–423**.
Die Fläche bleibt die Tafel aus [`94-next.md`](./94-next.md).
`Plane das` bleibt der Ablauf aus [`95-next.md`](./95-next.md).
`Simuliere Kalender` bleibt der Draht in `board-wire.ts`.
Kein zweites Brett, kein neues Hirn, kein neuer Agent.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.**
Der Parser öffnet, schließt und merkt die Wahl. Das Modell füllt nur
Beschriftung und Bausteinart. Es schreibt kein CSS und keinen Komponenten-Code.

---

## 0. Antwort in einem Satz

`Entwirf eine App: Einkaufsliste` legt bis zu drei stumme Bildschirme auf
die Tischplatte. Jeder ist ein Gerüst aus festen Bausteinen. Ein Tipp
oder `Die zweite` merkt die Wahl. Der Bildschirm führt nichts aus.

---

## 1. Was ein Entwurf zeigt

Ein Entwurf ist ein Bildschirm. Eine Spalte, höchstens sechs Bausteine.
Bis zu drei Entwürfe liegen nebeneinander. Sie sehen aus wie eine kleine
App und bleiben eine Attrappe: kein Tippen in ein Feld, kein Speichern,
kein Agent, keine zweite Sicht.

Die Bausteine stehen fest im Code, im Glas der Tafel.

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
draußen. Die Vorschau lädt keine Seite und kein Paket.

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
`entwurf_json`. IndexedDB geht von Version 13 auf 14, Store-Name `drafts`.

Form einer Zeile:

- `title`: eine Zeile, höchstens 80 Zeichen
- `variants`: bis zu drei Varianten, jede mit `name` und bis zu sechs Bausteinen `art` und `zeile`
- `pick`: `0`, `1`, `2` oder leer
- `motion`: `sofort`, `gleiten` oder `aufklappen`
- `status`: `offen`, `gewählt`, `zu`

`Plane das` legt keine Entwurfszeile an. `Entwirf` legt keine Idee an.

### Hausstand

Dieselbe Datei `jarvis-haus-….json` enthält `drafts`, jede Zeile, auch `zu`.
Die Vorschau nennt die Zahl, auch null: `2 Entwürfe`. Eine alte Datei ohne
Schlüssel `drafts` lässt den Store. Ist der Schlüssel da, auch als leeres
Array, ersetzt der Import den Store. `entwurf_id` kommt mit den
Einstellungen. Fehlt die Zeile dazu, bleiben die Rahmen zu.

Debug-Rollback führt `drafts` in derselben Store-Liste wie `plans`.

---

## 4. Fläche

Solange der Status `offen` oder `gewählt` ist und die Zeile die
`entwurf_id` ist, liegen bis zu drei Rahmen in der Mitte der Tafel.
Sie sind keine Tafelstücke: kein Ziehen, kein Werfen, `Räum den Tisch`
trifft sie nicht.

Die sieben Stücke dahinter bleiben liegen, Deckkraft 0,45, und nehmen
keinen Finger an. Der Mini-Chat bleibt benutzbar. Ist ein Ablauf
`schreibt`, `warten`, `überarbeitet` oder `läuft`, bleiben die Rahmen zu.
Antwort: `Erst den Ablauf.`

Ab **900 px**: eine Reihe, Abstand 16 px, jeder Rahmen
`min(220px, 26vw)` breit und `min(64vh, 520px)` hoch. Dasselbe Glas wie
die Stücke, `#041018` bei etwa 88 Prozent, Ecken 18 px. Auf geht jede
Spalte in 280 ms. Unter `prefers-reduced-motion` nur 120 ms Deckkraft.

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
`Zeig PSP` und `Simuliere Kalender` schließen die Rahmen ebenfalls und
lassen die Zeile auf `offen`, wenn noch nichts gewählt ist.

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
`Mach einen Sprintplan` bleibt die Vorlage. `Hintergrund blau schwarz`
bleibt das Thema. `nächster Lidl` bleibt `poi`.

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

Ein Aufruf, erst ab Sprint 418. Das Modell sieht den Arbeitstext und die
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
- `Plane das`, `Füll den Plan` und die Open-Source-Suche auf den Entwurf umbiegen
- Die Rahmen ziehen, werfen oder als zehntes Tafelstück speichern
- Eine App-Datei, eine Sprint-Datei, eine Version oder eine APK aus dem Gerät
- `18.24.6` oder einen versionCode außer `182400` in Sprint 423
- Die Sideload `18.23.12` anheben, bevor Sprint 423 grün ist
- Testkarten in der App, bevor Sprint 423 ausgeführt ist

---

## 8. Sprints (`18.24.0` PLAN)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [417](./sprints/sprint-417.md) | Sätze, Speicher, Nachbarn bleiben | Must PLAN |
| [418](./sprints/sprint-418.md) | Modell füllt Varianten, ehrliche Leere | Must PLAN |
| [419](./sprints/sprint-419.md) | Drei Rahmen auf der Tafel | Must PLAN |
| [420](./sprints/sprint-420.md) | Inspiration, drei Muster, Wahl merken | Must PLAN |
| [421](./sprints/sprint-421.md) | Wahl, Schließen, Ablauf gewinnt | Must PLAN |
| [422](./sprints/sprint-422.md) | Entwürfe im Hausstand | Must PLAN |
| [423](./sprints/sprint-423.md) | Gold, Testkarten, Version erst dann | Must PLAN |

Kette: 417 vor 418 und vor 422. 418 vor 419. 419 vor 420. 420 vor 421.
422 hängt nicht an den Rahmen. 423 zuletzt, erst wenn 421 und 422 grün sind.
Test-Sätze: [`TEST-18.24.md`](./TEST-18.24.md). Die Karten liegen erst nach 423 in Spur Heute.

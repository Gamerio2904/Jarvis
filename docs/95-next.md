# 95 — Ablauf auf der Tafel **CODE** (`18.23`)

**Dieses Dokument ist CODE.** App-Code **`18.23.13`** (versionCode `182313`).
Sprints **410–416**. Katalog-Stand bleibt `18.20.0`. `18.23.1` macht das Fenster
deckend, hält `So` nach einer Änderung und lässt aus `7:30` den Satz `Wecker um 7:30`.
`18.23.2`: ein Bot fragt, bevor ein anderer dazukommt. `Ja` holt ihn, `Nein` nicht.
`18.23.4`: die Tischplatte ist die Planung. Sprints und PSP sind JSON.
`Lade den PSP runter` und `Lade alles zu Projekt …` speichern die Datei.
Das Agentenfenster ist weg. Tisch sitzt in der Leiste unten links.
`18.23.6`: ein Tipp auf den Tag zeigt alle Termine. Die Woche hat links die
Uhrzeit ab 7 Uhr und oben die Tage. `18.23.7`: der Kalender öffnet in dieser Woche.
`18.23.8`: die Tafel ist ein festes Skript. `Plane das` zeigt es live, `Go` setzt es fest, danach ist der Export bereit. Die linke Leiste klappt ein und lässt sich rechts ausstellen.
`18.23.9`: `Nein 90 Minuten` setzt die Zeit. `Wer ist …` sucht. `Wer ist meine Mutter` bleibt im Haus.
`18.23.10`: `Erinnerung 7.10. für … 18 Uhr am Tag davor` legt den Termin an diesem Tag an. `Ja` nach „Soll ich?“ führt den Satz aus.
`18.23.11`: `Hausstand übertragen` zeigt den Code. `Scanne QR Code` öffnet die Kamera. Export schickt den Stand im WLAN.
`18.23.13`: Kalender-Löschen nennt nur echte Treffer. `Lösche den aktuellen Plan` räumt die Tafel. Chat und Kalendereintrag: gedrückt halten. `18.23.12`: `Zeig mir ein Bild der Elbe` zeigt das Bild mit Quelle. `Zeig mir London` bleibt die Kugel.

Die Fläche bleibt die Tafel aus [`94-next.md`](./94-next.md). Kein zweites
Brett, kein neues Hirn, kein neuer Agent.

Hirn-Slots bleiben: **Groq primär → Gemini Spezialist → 0,5B.** Der Parser
öffnet, schließt, nimmt an und gibt eine Zeile zum Überarbeiten frei. Das
Modell füllt nur den Inhalt: welche konkrete Arbeit, welcher vorhandene
Agent, welche Welle. Vor dem Annehmen läuft kein Agent. Danach läuft eine
Welle gleichzeitig, die nächste erst, wenn die vorige Antwort da ist.

Jarvis schreibt dabei keine App-Datei, keine Sprint-Datei, keine Version
und kein APK.

---

## 0. Antwort in einem Satz

`Plane das` öffnet ein Fenster mitten auf der Tafel. Das Modell schreibt
dort einen Ablauf, wer was tut. Der Nutzer überarbeitet oder sagt `So`.
Erst dann laufen die genannten Agenten, unabhängige Schritte gleichzeitig.

---

## 1. Was in den Ablauf kommt

Das Modell liest den Arbeitstext, die offene Idee und die vorhandenen
Sprintzeilen. Es prüft, welche konkrete Arbeit darin steckt, und ordnet
jede Arbeit einem vorhandenen Executor zu. Einen neuen Agenten gibt es
nicht. Eine Id, die nicht in `EXECUTOR_IDS` steht, bleibt eine graue Zeile
und läuft später nicht.

Die Kartenzeile ist ein Satz, den dieser Agent heute schon parst. Beispiele:
`Termin morgen 9 Uhr Zahnarzt`, `Wecker um 8`, `Such Open Source zu Tic-Tac-Toe`,
`Füll den Plan für Idee 1`. Enthält eine Karte schon `und plane Sprints`,
kommt keine zweite Ideenkarte für dieselbe Füllung.

Grenzen: höchstens sechs Arbeitszeilen, höchstens acht Karten, höchstens
drei Wellen. Was darüber liegt, fällt weg. Die Antwort nennt die Grenze
nicht noch einmal, der Ablauf zeigt nur, was bleibt.

Welle 1 heißt **Gleichzeitig**. Welle 2 und 3 heißen **Danach**. Eine
spätere Welle wartet auf die Antworten der vorigen. Das Modell legt
abhängige Schritte in eine spätere Welle. Der Code sortiert nicht um.

Beispiel für `Trag morgen 9 Uhr Zahnarzt ein, stell einen Wecker auf 8 und such Open Source zu Tic-Tac-Toe`:

| Welle | Agent | Karte |
|-------|--------|--------|
| Gleichzeitig | `calendar` | Termin morgen 9 Uhr, Zahnarzt |
| Gleichzeitig | `alarm` | Wecker 8 Uhr |
| Gleichzeitig | `board` | Open Source zu Tic-Tac-Toe, nur Repo und LibHunt |
| Danach | `idea` | Kern, Härten und Probe aus diesen Treffern |

Der Kartenname ist das Label aus `meta.ts`: Kalender, Wecker, Tischplatte,
Idee, Datei-QR. Die Id steht nicht als einzige Beschriftung.

Leerer Zieltext bleibt `Noch leer.` Kommt keine Karte mit bekannter Id und
einer Aufgabe von mindestens drei Zeichen, bleibt der Ablauf leer. Antwort:
`Kein Ablauf. Der Text nennt keine konkrete Arbeit.`

---

## 2. Speicher

Sichtbar ist ein Ablauf. Gespeichert wird jeder, der einmal auf `warten`
kam. Der nächste `Plane das` setzt den vorigen auf `zu` und lässt die Zeile
liegen. Der alte läuft nicht. Ohne offene Idee legt `Plane das` keine Idee an.

Zwei Planungsdateien, beide lokal:

| Datei | Wo | Was |
|-------|----|-----|
| Sprintvorlage | an jeder Idee, Feld `plan` | Kern, Härten, Probe, Custom. Offen, geparkt, erledigt |
| Ablauf | Store `plans`, eine Zeile pro Ablauf | Titel, Arbeitszeilen, Wellen, Karten, Status, Ergebnis |

Die Einstellungen halten nur `ablauf_id`, die Id der Zeile im Fenster.
Kein zweites Vollstück in `ablauf_json`. `ablauf_id` ist nicht flüchtig.
IndexedDB geht dafür von Version 12 auf 13, Store-Name `plans`.

Form einer Ablauf-Zeile:

- `title`: eine Zeile aus dem Satz, höchstens 80 Zeichen
- `work`: bis zu sechs kurze Zeilen
- `waves`: bis zu drei Wellen mit Karten `n`, `agent`, `task`, `state`, `result`
- `status`: `schreibt`, `warten`, `überarbeitet`, `läuft`, `zu`

Zustände einer Karte: `vorgeschlagen`, `geändert`, `läuft`, `fertig`, `leer`.
Die graue Zeile ohne Executor bleibt `vorgeschlagen` und wird nie `läuft`.
Ein Ablauf ohne gültige Karte wird keine Zeile.

`Mach einen Sprintplan`, `Füll den Plan` und `Plane Idee …` bleiben die
Vorlage Kern, Härten, Probe. Sie öffnen dieses Fenster nicht.
`Such Open Source … und plane Sprints` bleibt `board`, ein Auftrag, nur
Repo- und LibHunt-Treffer.

### Hausstand

`Hausstand exportieren` bleibt `backup`. Dieselbe Datei
`jarvis-haus-….json` enthält jede Planungsdatei:

- `ideas`: jede Idee, das Feld `plan` vollständig, nicht abgeschnitten
- `plans`: jede Ablauf-Zeile, auch `zu` und `fertig`

Die Vorschau nennt die Zahl, auch null: `2 Abläufe`. Eine alte Datei ohne
Schlüssel `plans` lässt die Abläufe auf dem Gerät. Ist der Schlüssel da,
auch als leeres Array, ersetzt der Import den Store. `ablauf_id` kommt mit
den Einstellungen zurück. Fehlt die Zeile dazu, bleibt das Fenster zu.

Debug-Rollback führt `plans` in derselben Store-Liste wie `ideas`, damit
ein Rollback die Abläufe nicht löscht.

Nicht in der Datei: Bewegung der Tafel, Recherche-Cache, Datei-QR-Bytes,
Markdown aus dem Repo. Keine zweite Datei neben dem Hausstand.

---

## 3. Fenster

Solange der Status `schreibt`, `warten`, `überarbeitet` oder `läuft` ist,
liegt ein festes Fenster in der Mitte der Tafel. Es ist kein Tafelstück:
kein Ziehen, kein Werfen, `Räum den Tisch` trifft es nicht.

Die Stücke dahinter bleiben liegen, Deckkraft 0,45, und nehmen keinen
Finger an. Der Mini-Chat bleibt benutzbar. Sprintliste und PSP stehen im
Fenster nicht noch einmal.

Ab **900 px**: Breite `min(720px, 78vw)`, Höhe höchstens `min(78vh, 640px)`.
Dasselbe Glas wie die Stücke, `#041018` bei etwa 88 Prozent, Ecken 18 px,
feine Akzentlinie. Auf geht es in 280 ms von Skala 0,96 auf 1. Unter
`prefers-reduced-motion` nur 120 ms Deckkraft, keine Skala.

Darunter: dasselbe Fenster, Rand 12 px, Spalten untereinander. Es scrollt
innen. Der Tisch scrollt nicht mit.

Kopfzeile: links in Versalien **Ablauf**, daneben der Titel in einer Zeile,
rechts der Status **schreibt**, **warten**, **überarbeitet** oder **läuft**.

Zwei Spalten. Links, schmaler, Überschrift **Arbeit**: der Satz als Zitat,
darunter die Arbeitszeilen. Rechts, breiter, Überschrift **Wer**. Das erste
Band heißt **Gleichzeitig**, die Karten darin nebeneinander, auf dem Handy
untereinander. Jedes weitere Band heißt **Danach**. Eine Karte zeigt den
deutschen Namen und genau eine Aufgabe. Eine Zeile ohne Agenten steht unter
den Bändern grau und hat keinen Lauf.

Schreiben, live, erst ab Sprint 412: die Daten kommen im Ganzen an, das
Fenster zeigt sie nacheinander. Zuerst nur die Kopfzeile, Status
**schreibt**. Die linken Zeilen erscheinen als ganze Zeile, Abstand etwa
180 ms, eine Schreibmarke nur an der Zeile, die gerade kommt. Dann die
Bänder, dann die Karten einer Welle im Abstand von etwa 80 ms. Der
Kartentext kommt als ganze Zeile. Steht die letzte Karte, wird der Status
**warten**. Unten der Knopf **So** und der Satz `Sag, was anders sein soll.`
Bei leerem Ablauf steht rechts nur `Kein Ablauf. Der Text nennt keine konkrete Arbeit.` Der Knopf fehlt. Wenig Bewegung zeigt alles auf einmal.

Überarbeiten, ab Sprint 413: nur die genannte Karte bekommt die Akzentlinie.
Der alte Satz bleibt 400 ms durchgestrichen, dann steht der neue, darunter
klein **geändert**. Die anderen Karten bleiben. Status **überarbeitet**,
danach wieder **warten**.

Ausführen, ab Sprint 414: das Fenster bleibt offen, Status **läuft**. Alle
Karten im laufenden Band zeigen zugleich einen kurzen Laufstrich. Die
Antwort des Agenten ersetzt den Strich als zweite Zeile. Das nächste Band
startet erst danach. Sind alle Bänder fertig, blendet das Fenster aus, die
Tafel nimmt wieder den Finger an.

Danach zeigt die Sprintliste diese Zeilen: Nummer, Label, Aufgabe, und
`fertig` oder die leere Antwort. `Zeig Sprints` holt die Ideenzeilen zurück.
Ein neues `Plane das` ersetzt die Liste wieder durch das Fenster.

`Plan zu` und `Fenster zu` vor dem Lauf schließen ohne Agenten. Antwort
`Ablauf zu.` Die Zeile bleibt, Status `zu`. Während `läuft` beendet der
Satz die aktuelle Welle, lässt spätere Wellen aus und schließt dann.

---

## 4. Sätze

Der Parser nimmt nur diese Formen. Nachbarsätze bleiben, wo sie sind.

Öffnen. `Plane das` allein nimmt die vorige Nutzernachricht desselben
Gesprächs, gekürzt auf 2000 Zeichen. Fehlt sie: `Was soll geplant werden?`
und kein Fenster.

```
Plane das
```

```
Plane das: Trag morgen 9 Uhr Zahnarzt ein, stell einen Wecker auf 8 und such Open Source zu Tic-Tac-Toe
```

Der Text nach dem Doppelpunkt ist der Arbeitstext. Ein zweites `Plane das`,
solange ein Ablauf `warten` ist, öffnet eine neue Zeile. Die vorige bleibt,
Status `zu`. Der alte läuft nicht.

Annehmen, nur bei Status `warten`:

```
So
```

```
Übernehmen
```

`Ja` nimmt den Ablauf nur an, wenn kein anderer Wunsch offen ist
(Merk-Vorschlag, Highlight-Ja, sonstige Rückfrage). Sonst gilt `Ja` wie
bisher. Der Knopf im Fenster schickt `So`.

Schließen:

```
Plan zu
```

```
Fenster zu
```

Ohne offenen Ablauf: `Es ist kein Ablauf offen.`

Überarbeiten, nur bei `warten`. Das Modell schreibt nur die genannte Karte
neu. Der Parser entscheidet, dass es eine Änderung ist.

```
Ändere den Wecker: 7:30
```

```
Wecker auf 7:30, Rest so
```

```
Überarbeite den Plan: Wecker auf 7:30
```

Der Name in `Ändere den …` und vor `, Rest so` ist das Label oder die Id
einer Karte. Trifft er keine Karte: `Die Zeile gibt es nicht.` und die
vorhandenen Namen. Der übrige Ablauf bleibt.

`Plane das` schreibt Sprints und PSP auf die Tischplatte. Schieben, Werfen und `Räum den Tisch` bewegen die Stücke.
`nächster Lidl` bleibt `poi`. `Hintergrund blau schwarz` bleibt das Thema.

Chat, sobald der Ablauf auf `warten` steht:

```
Ablauf.
Gleichzeitig
1. Kalender: Termin morgen 9 Uhr, Zahnarzt
2. Wecker: Wecker 8 Uhr
3. Tischplatte: Open Source zu Tic-Tac-Toe, nur Repo und LibHunt
Danach
4. Idee: Kern, Härten und Probe aus diesen Treffern
Sag So, oder was anders sein soll.
```

Nach einer Änderung dieselbe Liste, dazu `geändert: Wecker.`

Nach dem Lauf eine Nachricht, eine Zeile pro Karte, in Planreihenfolge.
Die zweite Hälfte ist die eigene Antwort des Agenten. Eine Karte, die der
Agent nicht ausführt, zeigt `Noch leer.` Die übrigen Karten der Welle
laufen zu Ende. Die graue Zeile fehlt in dieser Nachricht.

---

## 5. Lauf

`So`, `Übernehmen` oder ein zulässiges `Ja` setzt den Status auf `läuft`.
Jede Welle ruft `runAgent` mit dem Aufgabensatz der Karte auf, die Karten
einer Welle gleichzeitig. Die nächste Welle startet, wenn jede Karte eine
Antwort hat. Es gibt keine zweite Rückfrage in der Welle und keinen
weiteren Organizer.

`idea` schreibt nur den lokalen Plan der Idee, wenn die Karte ein Satz ist,
den `idea` schon kennt. `board` legt Quellen und, wenn der Satz das schon
tut, den Sprintplan aus echten Treffern. `calendar` und `alarm` legen
Termin und Wecker. `xfer` baut den QR-Code nur, wenn die Karte ein
Übertragungs-Satz ist. Keiner dieser Läufe legt eine Datei im Repo an.

Die Sammelantwort geht nicht durch den Micro-Merge.

---

## 6. Won't

- Ein neuer Agent, ein fünfter Organizer, ein Schwarm vor dem `So`
- Agenten, die laufen, während der Status noch `warten` ist
- Mehr als sechs Arbeitszeilen, acht Karten oder drei Wellen
- Eine Id, die es nicht gibt, trotzdem ausführen
- Freien Text als Änderung, ohne die drei Änderungssätze
- `Ja` stehlen, wenn ein anderer Wunsch offen ist
- `Mach einen Sprintplan`, `Füll den Plan`, `Plane Idee` oder die
  Open-Source-Suche mit Sprintplan auf diesen Ablauf umbiegen
- Das Fenster ziehen, werfen oder als zehntes Tafelstück speichern
- Standbilder, Fremdlogos, WebGL, Three.js, Lottie, tldraw
- App-Datei, Sprint-Datei, Version oder APK aus dem Gerät
- Eine zweite Datei neben dem Hausstand
- Den Ablauf nur in den Einstellungen, oder ältere Abläufe beim nächsten
  `Plane das` löschen
- Testkarten in der App, bevor Sprint 415 ausgeführt ist
- Die Sideload `18.22.0` in diesem Plan anheben

---

## 7. Sprints (`18.23.0` CODE)

| Sprint | Inhalt | Klasse |
|--------|--------|--------|
| [410](./sprints/sprint-410.md) | Sätze, Speicher, Nachbarn bleiben | Must CODE |
| [411](./sprints/sprint-411.md) | Modell füllt Wellen, ehrliche Leere | Must CODE |
| [412](./sprints/sprint-412.md) | Fenster, live, Knopf So | Must CODE |
| [413](./sprints/sprint-413.md) | Eine Zeile ändern, Ablauf ersetzen | Must CODE |
| [414](./sprints/sprint-414.md) | Wellen gleichzeitig, danach die Sprintliste | Must CODE |
| [415](./sprints/sprint-415.md) | Gold, Testkarten, Version erst dann | Must CODE |
| [416](./sprints/sprint-416.md) | Jede Planungsdatei im Hausstand | Must CODE |

Kette: 410 vor 411 und vor 416. 411 vor 412. 412 vor 413. 413 vor 414.
416 hängt nicht am Fenster. 415 zuletzt, erst wenn 416 grün ist.
Test-Sätze: [`TEST-18.23.md`](./TEST-18.23.md). Die Karten liegen in Spur Heute.

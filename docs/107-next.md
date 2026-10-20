# 107 — Welt auf der Kamera **PLAN** (`18.62`–`18.66`)

**Planungsstand:** **CODE** in `18.66.0` (versionCode `186600`). `engineStamp`
bleibt `18.60.0-ygo-md`. Der Nachbau in `frontend/scripts/test-welt.mjs` trägt
A4 bis A12. Ein Gerät mit ARCore hat diese Fassung noch nicht bestätigt.
Ohne Flächen-Erkennung sagt die Zeile `ARCore fehlt` und es entsteht kein Würfel.
L1 bis L4 bleiben. Ein Geräte-No-Go setzt das betroffene Gateway auf `nogo`.

**Hülle:** [`plan-vorlage.md`](./plan-vorlage.md).

**Abgrenzung:** [`roomar-openscan-plan.md`](./roomar-openscan-plan.md) bleibt
der Scan auf der Tischplatte. Der Satz `Scanne den Raum` öffnet dort die
Tafel. Diese Kachel heißt **Welt**. VR und Quest bleiben die geparkte Zeile
in `presence.ts`.

---

## Bedingung

Die Kachel liegt auf dem Homescreen. Dahinter ist eine zweite Welt in der
rückwärtigen Kamera.

Wörtlich aus der Planung:

> Der Würfel soll als Objekt in dieser Welt existieren. Zum Beispiel lege ich
> ihn auf den Schreibtisch, drehe mich weg zum Stuhl und lege dort einen
> anderen Würfel ab. Wenn ich mich zum Tisch drehe, ist der Würfel 1 dort
> immer noch unverändert. Wenn ich mit meiner Hand nach dem Würfel greife,
> soll er sich wie ein haptisches Objekt verhalten. Quasi eine eigene zweite
> Welt.

Die Kamera ist das Auge. Sie schreibt die Lage eines Würfels nicht. Ein
Würfel hat eine Nummer, eine Lage und eine Drehung im Zimmer. Er bleibt
dort, während ein anderer Würfel woanders entsteht.

## Rahmen dieses Projekts

Die acht Punkte der Vorlage gelten. Dazu:

1. Alles läuft auf dem Gerät. Ein Konto, ein Cloud-Anker und ein Server
   gehören nicht in diese Welt.
2. Die Kachel heißt `welt`, Beschriftung **Welt**, Farbe `#7eb6ff`. Sie
   folgt demselben Öffnen wie `server` in `launchHomeApp`.
3. `Scanne den Raum` bleibt der Tischplatten-Scan. `Öffne die Welt` und
   `Zeig die Welt` öffnen diese Kachel.
4. Höchstens acht Würfel, eine Hand, die Flächen dieser offenen Sitzung.
5. Schließen beendet die Sitzung. Ein Zimmer, das nach dem nächsten Öffnen
   denselben Schreibtisch wiederfindet, ist Lücke L1 und kein Sprint hier.
6. Maße, die ein späterer Sprint nicht neu verhandelt: Kante `0,08 m`,
   Masse `0,2 kg`, Reichweite des Griffs `0,04 m`.
7. Eine Lage ändert sich nur durch Setzen, den Physikschritt oder das
   Gelenk. Eine Kopfdrehung ist keiner dieser drei Wege.
8. Paket bleibt `local.jarvis.app`.

## Anforderungen

| ID | Satz | Abnahme | Sprint |
|---|---|---|---|
| A1 | Die Kachel **Welt** liegt einmal im Homescreen-Raster | `HOME_APP_IDS` hat 16 Einträge, `welt` genau einmal, `lage` und `server` bleiben | 551 |
| A2 | Tippen öffnet die Fläche, Schließen gibt die Kamera frei | Nach Schließen läuft kein Kamerastrom mehr | 552 |
| A3 | Die Rückkamera füllt den Hintergrund | Ohne Berechtigung oder ohne Kamera bleibt die Fläche leer, die Zeile nennt den Grund | 552 |
| A4 | Die Zeile zählt Gegenstände in der Welt | Am Anfang steht `0 Gegenstände` | 551 |
| A5 | Die erste erkannte Fläche setzt den Ursprung der Welt | Die Zeile nennt `Fläche`. Fehlt die Flächenerkennung, nennt die Zeile das und es entsteht kein Würfel | 553 |
| A6 | Ein Tipp auf eine Fläche legt einen Würfel mit eigener Nummer | Der zweite Tipp legt den nächsten Würfel, höchstens acht | 554 |
| A7 | Wegdrehen lässt Würfel 1 liegen | Nach dem Zurückdrehen sind Lage und Drehung von Würfel 1 dieselben. Die Zeile zeigt `2 Gegenstände`, während nur einer im Bild ist | 554 |
| A8 | Eine Fläche ist ein fester Boden | Ein gesetzter Würfel kommt auf der Fläche zur Ruhe | 555 |
| A9 | Würfel stoßen sich | Zwei Würfel können aneinander stehen oder aufeinander liegen. Eine Kopfdrehung schreibt keine Lage | 556 |
| A10 | Die Hand hat eine Lage in derselben Welt | Das Gerüst folgt den Fingern. In diesem Sprint beginnt kein Griff | 557 |
| A11 | Der Zangengriff in Reichweite hebt den Würfel | Ein Griff weiter als `0,04 m` vom Würfel schreibt `fehlgeschlagen` und lässt beide Anker liegen | 558 |
| A12 | Loslassen übergibt die Bewegung der Hand | Der Würfel fällt, stößt und bleibt liegen. Der andere Würfel bleibt unverändert. Schließen beendet die Sitzung | 559 |

## Entscheidungen

| ID | Schnitt | Grund | Gateway |
|---|---|---|---|
| E1 | Kachel `welt`, nicht `raum` | `Scanne den Raum` ist der Tischplatten-Scan | go |
| E2 | Der Würfel liegt im Zimmerursprung, den die erste Fläche setzt | Die Bedingung verlangt, dass Würfel 1 beim Wegdrehen unverändert bleibt | go |
| E3 | Flächen und Anker kommen aus einer Tracker-Sitzung auf dem Gerät. Die WebView-Kamera ist in 551–552 nur das Auge | Eine Fläche zum Ablegen entsteht erst mit dem Tracker in 553 | go |
| E4 | Die Hand kommt aus einem lokalen Hand-Landmarker im App-Paket. Die Fundstelle bleibt leer bis `Such` | Der Griff muss auf dem Gerät laufen | go |
| E5 | Welt, Physik, Griff und Loslassen sind reine Funktionen ohne Kameraimport | Die Abnahme von A6 bis A12 läuft in `test-welt.mjs` mit einem nachgebauten Tracker | go |
| E6 | Schließen verwirft die Sitzung | L1 ist benannt und gehört in keinen Sprint dieses Plans | go |
| E7 | Quest und WebXR bleiben geparkt | Die Welt ist die Handykamera | go |

## Reihenfolge

Zuerst die Kachel und das leere Auge, dann der Ursprung, dann die Würfel,
dann das Gewicht, dann die Hand, zuletzt der Griff. Ein Würfel ohne Fläche
wird nicht gebaut. Ein Griff ohne Handlage in derselben Welt wird nicht gebaut.

| Version | versionCode, erst beim Bauen | Sprints | Gate |
|---|---:|---|---|
| `18.62.0` | 186200 | 551–552 | Kachel **Welt**, leere Welt, Rückkamera |
| `18.63.0` | 186300 | 553–554 | Ursprung, Würfel, Wegsehen |
| `18.64.0` | 186400 | 555–556 | Boden und Stoß |
| `18.65.0` | 186500 | 557 | Hand in derselben Welt |
| `18.66.0` | 186600 | 558–559 | Gelenk, Loslassen, Welt-Gate |

Die Nummer einer Version setzt nur der letzte Sprint dieser Zeile, und nur
beim Bauen. `18.62.0` kann ausgeliefert werden, wenn 553 später `nogo` wird.
554 und alles danach warten dann.

Sprintdetails: [`sprint-551.md`](./sprints/sprint-551.md) bis [`sprint-559.md`](./sprints/sprint-559.md).

## Welt

Eine offene Sitzung trägt:

| Feld | Inhalt |
|---|---|
| Ursprung | Lage der ersten gehaltenen Fläche. Vorher gibt es keine Würfel |
| Flächen | Feste Böden, wachsen mit dem Tracker mit |
| Gegenstände | `w1` … höchstens `w8`. Jeder hat Lage, Drehung, Geschwindigkeit, Zustand `liegt`, `fällt` oder `gehalten`, Anker |
| Hand | Eine Lage des Zangenpunkts in derselben Welt, oder keine |
| Orientierung | `hält` oder `weg` |

Zustand der Zeile, wörtlich: `0 Gegenstände`, `2 Gegenstände`, `Fläche`,
`ARCore fehlt`, `erkannt`, `gegriffen`, `abgesetzt`, `fehlgeschlagen`,
`Orientierung weg`.

Wegsehen ist eine Änderung der Kameralage. Die Gegenstandsliste bleibt. Der
Renderer zeichnet, was im Blick liegt, und löscht dabei nichts.

Verliert das Gerät die Orientierung, frieren die Gegenstände an der letzten
Lage ein und die Zeile sagt `Orientierung weg`. Kehrt die Orientierung
zurück, stehen sie wieder dort.

## Griff

Der Zangenpunkt ist die Mitte zwischen Daumenspitze und Zeigefingerspitze.
Die Zange gilt, wenn dieser Abstand klein gegen die eigene Hand ist. Die
Reichweite ist `0,04 m` in der Welt zwischen Zangenpunkt und dem nächsten
Würfel.

Trifft die Zange, hängt der Würfel an einem Gelenk an der Hand. Er behält
seine Masse, zieht kurz nach und nimmt die Drehung der Hand mit. Böden und
andere Würfel bleiben im Weg.

Trifft sie nicht, oder hat der Zangenpunkt keine Weltlage, bleibt jeder
Anker liegen und die Zeile sagt `fehlgeschlagen`.

Loslassen nimmt das Gelenk weg und gibt dem Würfel die Geschwindigkeit der
Hand. Danach gelten Gewicht und Böden. Die neue Ruhe-Lage ist der neue Anker.

## Dateien, die `Umsetzen` anfasst

| Sprint | Datei | Arbeit |
|---|---|---|
| 551 | `frontend/src/engine/home-apps.ts` | `welt` in `HOME_APP_IDS` und `HOME_APPS` |
| 551 | `frontend/src/ui/HomeScreen.tsx` | Ein Zeichen für die Kachel |
| 551 | `frontend/src/App.tsx` | `weltOpen` und Zweig in `launchHomeApp`, gleicher Weg wie `server` |
| 551 | `frontend/src/ui/WeltOverlay.tsx` | Fläche mit Zeile und Schließen |
| 551 | `frontend/src/engine/welt.ts` | Leere Sitzung, Zähler, keine Kamera |
| 551 | `frontend/scripts/test-18.18.mjs` | Die 16er-Liste, `welt` einmal |
| 551 | `frontend/scripts/test-welt.mjs` | Leere Sitzung zählt 0 |
| 552 | `frontend/src/ui/WeltOverlay.tsx` | Rückkamera, Freigabe beim Schließen |
| 552 | Capacitor-Android-Hülle | Berechtigung `CAMERA`, sobald die Hülle im Baum liegt. Lücke L3 |
| 553 | `frontend/src/engine/welt-tracker.ts` | Schnittstelle: Flächen, Anker, Kameralage. Tests bekommen einen nachgebauten Tracker |
| 554 | `frontend/src/engine/welt.ts` | `setzen`, Nummern, Grenze 8, Blick ändert keine Lage |
| 555–556 | `frontend/src/engine/welt-physik.ts` | Boden, Gewicht, Stoß, Schlaf der ruhenden Würfel |
| 557 | `frontend/src/engine/welt-hand.ts` | 21 Punkte, Zangenpunkt in Weltmetern oder leer |
| 558–559 | `frontend/src/engine/welt.ts` | Gelenk, Fehlgriff, Loslassen |
| 559 | `docs/107-next.md` | Geräteergebnis an A5–A12 schreiben. Ein No-Go bleibt stehen |

`test-welt.mjs` importiert keine Kamera und keinen Tracker der Firma. Er
setzt zwei Würfel, dreht nur die Kamera, prüft Würfel 1, lässt einen Würfel
zur Ruhe kommen, stößt einen zweiten dagegen, greift daneben und greift
danach in Reichweite.

## PSP

| Paket | Arbeit | Ergebnis | Fertig, wenn |
|---|---|---|---|
| P551 | Kachel und leere Sitzung | A1, A4 | Die Liste hat 16 Kacheln und der Zähler steht auf 0 |
| P552 | Auge und Freigabe | A2, A3 | Schließen beendet den Kamerastrom |
| P553 | Ursprung | A5 | Eine Fläche setzt den Ursprung, eine fehlende Erkennung setzt keinen Würfel |
| P554 | Zwei Anker | A6, A7 | Würfel 1 übersteht eine reine Kameradrehung |
| P555 | Boden | A8 | Der Würfel ruht auf der Fläche |
| P556 | Stoß | A9 | Zwei Würfel durchdringen sich nicht |
| P557 | Handlage | A10 | Der Zangenpunkt liegt in Weltmetern oder der Schritt wird `nogo` |
| P558 | Gelenk | A11 | Ein Fehlgriff verschiebt keinen Anker |
| P559 | Loslassen und Gate | A12 | Würfel 2 kann fallen, Würfel 1 bleibt, die Lücken stehen noch |

## Risiken

| ID | Risiko | Woran man es merkt |
|---|---|---|
| R1 | Tracker und Hand brauchen beide Bilder | 557 wird `nogo`, wenn der Zangenpunkt keine Weltlage hat |
| R2 | Das Gerät erkennt keine Fläche | 553 ist trotzdem go, die Zeile sagt `ARCore fehlt`, es gibt keinen Bildschirm-Würfel |
| R3 | Der Griff fühlt sich falsch an, weil die Handtiefe streut | 558 wird `nogo`, sobald ein Griff neben dem Würfel ihn verschiebt |
| R4 | Mehr als acht Würfel oder eine zweite Hand | Abbruch. Die Sitzung nimmt den neunten Würfel nicht an |

## Schnittstellen

| Schnitt | Vertrag |
|---|---|
| Homescreen | `launchHomeApp('welt')` öffnet die Fläche und schließt die anderen Vollflächen so wie `server` |
| `welt.ts` | Kein Import aus Kamera, DOM oder nativem Tracker |
| Tracker | Liefert Flächen, Anker und Kameralage. Der Test liefert dieselben Felder aus einem festen Ablauf |
| Hand | Liefert 21 Punkte und entweder einen Zangenpunkt in Metern oder nichts |
| Satz | `Öffne die Welt` und `Zeig die Welt` öffnen die Kachel. `Scanne den Raum` bleibt `board` |

## Lücken

| ID | Lücke |
|---|---|
| L1 | Nach dem Schließen findet die nächste Sitzung denselben Schreibtisch nicht wieder. Das ist der Plan nach `18.66.0` |
| L2 | Wie genau die Handtiefe in Metern auf einem bestimmten Gerät liegt, steht erst fest, wenn 557 auf dem Gerät gelaufen ist |
| L3 | Im Checkout liegt kein `AndroidManifest`. `CAMERA` und die optionale Flächen-Bibliothek kommen in die Capacitor-Android-Hülle, sobald sie im Baum liegt |
| L4 | Fundstellen zu Ankern und zum Hand-Landmarker sind leer, bis jemand `Such` sagt |

## Abnahme auf dem Gerät

Diese Sätze und Griffe gelten ab der Version, deren Sprint sie trägt.

```text
Öffne die Welt
```

`18.62.0`. Die Rückkamera läuft, die Zeile sagt `0 Gegenstände`. `Scanne den Raum` öffnet weiterhin die Tischplatte.

Auf der Fläche eine Fläche antippen, zum Stuhl drehen, dort noch einmal antippen, zurück zum Tisch drehen.

`18.63.0`. Würfel 1 liegt an derselben Stelle. Die Zeile sagt `2 Gegenstände`.

Den zweiten Würfel gegen den ersten setzen.

`18.64.0`. Sie bleiben aneinander stehen oder liegen aufeinander.

Die Hand ins Bild halten.

`18.65.0`. Die Punkte folgen den Fingern. Beide Würfel bleiben an ihren Ankern.

Den Tischwürfel mit Daumen und Zeigefinger greifen, zum Stuhl führen, die Finger öffnen. Danach daneben greifen.

`18.66.0`. Der getragene Würfel liegt danach auf dem Stuhl. Der andere liegt noch so da. Der Griff daneben schreibt `fehlgeschlagen`.

## Stand der Prüfung

`frontend/scripts/test-welt.mjs` setzt zwei Würfel, dreht nur die Kamera, lässt einen Würfel auf den Boden fallen, stößt einen zweiten dagegen, greift daneben und greift in Reichweite. `Scanne den Raum` bleibt der Tischplatten-Scan. Im Browser ohne ARCore öffnet die Kachel **Welt** die Fläche mit der Zeile `ARCore fehlt`, Schließen nimmt sie wieder weg. Der Sideload `releases/Jarvis.apk` ist `18.66.8` (versionCode `186608`). Der Würfel bleibt an der Stelle, an der er abgelegt wurde, auch wenn die Kamera sich dreht. Die Hand greift ihn. Die untere Leiste ist auf der Welt aus. Ein Handy mit Flächen-Erkennung hat Würfel 1 auf dem Schreibtisch noch nicht bestätigt.

## Go, No-Go, Abbruch

- Go, wenn: Jeder Sprint 551–559 steht auf `go` oder ein benanntes `nogo` trägt einen Grund, und L1 bis L4 stehen.
- No-Go, wenn: Ein Würfel seine Lage aus der Kameradrehung bekommt, ein Fehlgriff einen Anker verschiebt, oder `Scanne den Raum` die Welt öffnet.
- Abbruch: Cloud-Anker, Quest, eine zweite Hand, ein neunter Würfel, ein gespeichertes Zimmer, Verdecken durch echte Möbel.

**Projekt-Gateway:** go

# Hausstand nach dem Koppeln

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Er hängt an der Kopplung aus [`handy-flaeche-plan.md`](./handy-flaeche-plan.md), gebaut in `18.25.12` und `18.25.13`. Noch nichts davon ist gebaut. Ein Sprint wird erst gebaut, wenn jemand `Umsetzen` sagt.

## Bedingung

Wenn Sich die Geräte koppeln, soll Ultron automatisch die Hausstände überprüfen. Falls Sie Unterschidelich sind, also andere Planungsdokumente, Termine, Keys usw., soll er überprüfen, welcher Hausstand der aktuelleste ist und dann mich fragen: Der hausstad ist nicht syncron. Soll ih sycroniesieren? wenn ic Ja sage auf dem gerät mit älterem Hausstand den neun überschreiben.

Gelesen als: Sobald die Kopplung steht, vergleicht Ultron beide Hausstände von allein. Sind sie verschieden, erkennt er den neueren und fragt: „Der Hausstand ist nicht synchron. Soll ich synchronisieren?“ Ja überschreibt auf dem Gerät mit dem älteren Hausstand den alten mit dem neueren. Nein lässt beide stehen.

## Rahmen dieses Projekts

Die Rahmen der Vorlage gelten. Dazu, enger:

1. Nur nach einer bestätigten Kopplung. Dieselbe Netzregel wie die zwei Fenster: nur `192.168…` oder `10…`. Kein Weg über das Internet.
2. Verglichen und geschrieben wird derselbe Hausstand, den die App schon exportiert. Flüchtiger Bildschirmstand gehört nicht dazu.
3. Ja ersetzt den älteren Hausstand ganz. Es werden nicht beide Kalender ineinander gemischt.
4. Die Kopplung der Fenster bleibt, egal ob Ja oder Nein.
5. Diese Planung schreibt keinen Code, keine Version und kein APK.

## Quellen

Leer. Niemand hat `Such` gesagt. Eine erfundene Adresse wäre No-Go.

## Anforderungen

A1. Nach dem Bestätigen vergleicht Ultron beide Hausstände von allein. Abnahme: Sind Plan, Termine, Keys und der übrige Hausstand gleich, kommt keine Frage. Sind sie verschieden, geht es weiter, ohne dass schon etwas überschrieben wird. Gateway `go`.

A2. Bei einem Unterschied gilt der Hausstand mit der spätesten Änderung als der neuere. Abnahme: Er fragt dann genau: „Der Hausstand ist nicht synchron. Soll ich synchronisieren?“ Ist keine spätere Änderung zu erkennen, sagt er das und überschreibt nicht. Gateway `go`.

A3. Ja überschreibt auf dem Gerät mit dem älteren Hausstand den alten Stand mit dem neueren. Abnahme: Nein lässt beide Hausstände stehen. Der neuere Stand wird nicht vom älteren ersetzt. Die Fenster bleiben gekoppelt. Gateway `go`.

## Entscheidungen

E1. Der neuere Hausstand ist der mit der spätesten Änderung an einem gespeicherten Stück. Grund: Die Bedingung will den aktuellsten. Der Exportzeitpunkt einer Datei ist nicht diese Änderung. Gateway `go`.

E2. Ja ersetzt den älteren Hausstand ganz. Grund: Die Bedingung sagt überschreiben, nicht beide ineinander legen. Gateway `go`.

E3. Die Frage kommt einmal, in dem Gespräch, in dem die Kopplung gerade steht. Ein Ja genügt. Grund: Ein Ultron fragt, der Mensch antwortet einmal. Gateway `go`.

E4. Gleicher Hausstand, keine Frage. Grund: Die Bedingung fragt nur, wenn sie unterschiedlich sind. Gateway `go`.

E5. Keys gehen nur an das Gerät, das die Kopplung gerade bestätigt hat. Grund: Sie gehören zum Hausstand. Ein drittes Gerät bekommt sie nicht. Gateway `go`.

## Sprints

### S1 — Vergleich nach dem Koppeln

Ziel: Sobald die Kopplung steht, weiß Ultron, ob die beiden Hausstände gleich sind.

Anforderungen: A1.

Lieferumfang:

- S1-1. Nach dem Bestätigen vergleicht er Plan, Termine, Keys und den übrigen Hausstand. Fertig, wenn bei Gleichheit keine Frage kommt. Quelle: leer.
- S1-2. Bei einem Unterschied bleibt alles stehen, bis die Frage beantwortet ist. Fertig, wenn vor dem Ja nichts überschrieben wurde. Quelle: leer.

Gateway `go`. Go, wenn der Vergleich von allein läuft und der gleiche Stand stumm bleibt. No-Go, wenn er ohne Unterschied fragt oder vor der Antwort schreibt. Abbruch: die Kopplung reißt während des Vergleichs. Dann keine Frage und kein Schreiben. Hängt an der gebauten Kopplung.

Prompt: Nach dem Bestätigen vergleicht Ultron beide Hausstände von allein. Gleich: keine Frage. Verschieden, auch bei Plan, Termin oder Key: noch nichts überschreiben. Kein Weg über das Internet, kein drittes Gerät. Abbruch, wenn die Kopplung reißt: dann keine Frage und kein Schreiben.

### S2 — Der neuere Stand, dann die Frage

Ziel: Bei einem Unterschied nennt er den neueren Hausstand und stellt die eine Frage.

Anforderungen: A2.

Lieferumfang:

- S2-1. Der neuere Stand ist der mit der spätesten Änderung. Fertig, wenn ein späteres Stück den anderen Stand als älter ausweist. Quelle: leer.
- S2-2. Danach kommt die Frage in diesem Wortlaut. Fertig, wenn ohne erkennbares späteres Datum keine Frage kommt und nichts geschrieben wird. Quelle: leer.

Gateway `go`. Go, wenn die Frage nur bei einem belegten neueren Stand kommt. No-Go, wenn bei gleichem Datum ein Stand still gewinnt. Abbruch: die Änderungen sind gleich alt und der Inhalt verschieden. Dann sagt er, dass er den neueren nicht erkennt, und schreibt nicht. Hängt an S1 und A2.

Prompt: Sind die Hausstände verschieden, gilt der mit der spätesten Änderung als der neuere. Dann fragt er: Der Hausstand ist nicht synchron. Soll ich synchronisieren? Ist kein späteres Datum zu erkennen, sagt er das und überschreibt nicht. Kein stiller Gewinner, kein Mischen. Abbruch, wenn beide gleich alt sind und der Inhalt verschieden ist.

### S3 — Ja überschreibt den älteren

Ziel: Ja legt den neueren Hausstand auf das Gerät, das den älteren hat. Nein ändert nichts.

Anforderungen: A3.

Lieferumfang:

- S3-1. Ja ersetzt dort den ganzen älteren Hausstand. Fertig, wenn Plan, Termine, Keys und der übrige Stand danach dem neueren entsprechen. Quelle: leer.
- S3-2. Nein lässt beide Hausstände. Fertig, wenn die Fenster trotzdem gekoppelt bleiben. Quelle: leer.

Gateway `go`. Go, wenn nur der ältere Stand ersetzt wird und ein Nein beide lässt. No-Go, wenn der neuere Stand vom älteren überschrieben wird oder Ja und Nein dasselbe tun. Abbruch: die Kopplung reißt, bevor der Stand liegt. Dann bleibt auf dem älteren Gerät, was dort lag. Hängt an S2 und A3.

Prompt: Ja überschreibt auf dem Gerät mit dem älteren Hausstand den alten Stand mit dem neueren, als Ganzes. Nein lässt beide stehen. Die Kopplung bleibt in beiden Fällen. Der neuere Stand wird nicht ersetzt. Abbruch, wenn die Kopplung vor dem Schreiben reißt: dann bleibt der alte Stand.

## PSP

P1. Vergleich nach dem Koppeln. Paket P1-1: Vergleich von allein, Frage nur bei Unterschied. Ergebnis: A1. Fertig, wenn vorher nichts geschrieben wird. Abbruch, wenn die Kopplung reißt. Hängt an der gebauten Kopplung.

P2. Der neuere Stand, dann die Frage. Paket P2-1: späteste Änderung gewinnt, sonst keine Frage. Ergebnis: A2. Fertig, wenn der Wortlaut stimmt. Abbruch, wenn beide gleich alt sind. Hängt an P1.

P3. Ja überschreibt den älteren. Paket P3-1: Ja ersetzt den älteren Stand ganz, Nein lässt beide. Ergebnis: A3. Fertig, wenn die Fenster gekoppelt bleiben. Abbruch, wenn die Kopplung vor dem Schreiben reißt. Hängt an P2.

## Risiken

R1. Ja löscht auf dem älteren Gerät, was nur dort lag. Die Frage ist davor das Tor. Ein Mischen beider Kalender ist nicht Teil dieses Plans.

R2. Keys liegen im Hausstand. Sie gehen nur an das Gerät, das die Kopplung bestätigt hat, und nur im erlaubten Netz.

R3. Zwei Änderungen zur selben Zeit mit verschiedenem Inhalt haben keinen belegten Gewinner. Dann wird nicht geschrieben.

## Schnittstellen

Vorhanden: die bestätigte Kopplung der zwei Fenster, der Hausstand mit Plan, Terminen, Keys und dem übrigen Stand, das Ersetzen eines Hausstands beim Import. Neu: der Vergleich nach dem Koppeln, die eine Frage, und das Schreiben des neueren Stands auf das ältere Gerät nur nach Ja.

## Lücken

L1. Weicht nur ein Key ab und kein gespeichertes Stück trägt ein späteres Datum, ist nicht belegt, welcher Key neuer ist. Dann wird nicht überschrieben.

L2. Termine, die nur auf dem älteren Gerät liegen, sind nach dem Ja weg. Ein Zusammenlegen beider Kalender ist nicht entschieden.

L3. Ob dieselbe Frage zusätzlich als Blatt auf dem zweiten Gerät liegt. Hier kommt sie einmal in dem Gespräch, in dem die Kopplung steht.

## Projekt

Gateway `go`. Go, weil A1 bis A3, E1 bis E5 und S1 bis S3 je Abnahme und Abbruch haben und L1 bis L3 benannt sind. No-Go, wenn ein Sprint ohne Frage überschreibt, den neueren Stand ersetzt, beide Kalender mischt oder den Hausstand an ein drittes Gerät gibt.

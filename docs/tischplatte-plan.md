# Tischplatte lesbar

Plan nach [`plan-vorlage.md`](./plan-vorlage.md). Noch nichts gebaut. Ein Sprint wird erst gebaut, wenn jemand `Umsetzen` sagt.

## Bedingung

Plane ein neues Update für die Tischplatte/Planungsmodus. Dazu habe ich zur Inspriration etwas rechaschiert (siehe Screenshot) nalaysiere das kritisch und überneheme nur das was wirklich hilft und ein uprade ist. gib mir dan den gesamtplan jeder sprint, was darin gebaut wird und warum, aber ohen technisches blabla es soll verständlich sein

Gelesen als: Die Tischplatte bleibt der eine Planungsbildschirm. Aus den acht Bildern kommt nur hinein, was einen echten Gewinn bringt. Der Plan selbst muss sich in normalen Sätzen lesen lassen: jeder Sprint, was dort gebaut wird, und warum.

## Rahmen dieses Projekts

Die Rahmen der Vorlage gelten. Dazu, enger:

1. Die acht Bilder sind Anschauung. Sie sind keine Vorschrift.
2. Die Tischplatte bleibt die eine Fläche. Der Plan erscheint nicht als Aufsatz im Chat.
3. Was schon da ist, bleibt: ein Plan aus dem Satz, der Auftrag zum Kopieren, der Export nach Go.
4. Fragen nur, wenn ohne die Antwort ein Go falsch wäre.
5. Diese Planung schreibt keinen Code, keine Version und kein APK.

## Quellen

Leer. Niemand hat `Such` gesagt. Eine erfundene Adresse wäre No-Go.

Die acht Bilder hat der Mensch mitgebracht. Sie zeigen einen Chat, der ein Vorhaben in vier Schritten schreibt: erst klären, dann einen Aufbau wählen, dann Sprints, dann einen fertigen Auftrag an einen Programmierer. Dazu ein festes Blatt mit Name, Ziel, was nicht gebaut wird, Stücken, Sprints und einer Zeile, wann eine Aufgabe fertig ist. Am Ende steht die Frage, welches fremde Gerüst man dafür nimmt. Die Bilder sind abgeschnitten. Was außerhalb des sichtbaren Texts steht, gilt nicht.

## Anforderungen

A1. Jeder Sprint auf der Tischplatte sagt in normalen Sätzen, was gebaut wird und warum. Abnahme: Man liest die Karte vor und weiß beides, ohne den Auftrag zu öffnen. Der Knopf zum Kopieren bleibt. Gateway `go`.

A2. Auf der Tischplatte steht, was dieses Vorhaben nicht baut. Abnahme: Ein Schnitt, den der Plan schon hat, ist über den Karten zu lesen. Fehlt einer, bleibt die Zeile leer und erfindet nichts. Gateway `go`.

A3. Ein Satz, der nicht sagt, was entstehen soll, bekommt eine Frage auf der Tischplatte. Abnahme: „Plane eine App“ fragt und schreibt noch keinen Plan. „Plane eine Einkaufsliste, die offline merkt, was fehlt“ fragt nicht und schreibt die Karten. Die nächste Antwort füllt die Karten. Gateway `go`.

A4. Sprints und PSP sind zwei verschiedene Sichten. Abnahme: Sprints zeigt die Tore, was, warum und wann fertig. PSP zeigt die Stücke und was jedes Stück liefert. Dieselbe Liste unter beiden Knöpfen gilt nicht. Gateway `go`.

A5. Kein zweites Gerüst, kein Technik-Katalog, kein Knopf, der einen Programmierer startet. Abnahme: Die Tischplatte hat keinen solchen Knopf und keine Liste von Baukästen. Gateway `go`.

## Entscheidungen

E1. Eine Tafel, kein Zug aus vier Planern. Grund: Die Bilder schalten vier Aufträge hintereinander. Die Tischplatte schreibt den Plan schon in einem Durchgang. Vier Durchgänge würden denselben Plan viermal anfassen. Gateway `go`.

E2. Kein Technik-Wähler. Grund: Die Bilder lassen einen Schritt den Baukasten wählen. Die Tischplatte plant ein Vorhaben. Sie sucht keinen zweiten Baukasten. Gateway `go`.

E3. Kein Startknopf für einen Programmierer. Grund: Die Bilder wollen eine Aufgabe antippen und damit einen Programmierer losschicken. Gebaut wird, wenn der Mensch `Umsetzen` sagt. Der Auftrag zum Kopieren bleibt die Übergabe. Gateway `go`.

E4. Eine Frage, nur wenn der Satz zu dünn ist. Grund: Die Bilder fragen immer mehrere Male mit fertigen Antworten zum Ankreuzen. Die Vorlage sagt: fragen, nur wenn sonst ein Go falsch wäre. Eine Frage, die Antwort ist der nächste Satz. Gateway `go`.

E5. Die Grenze wird sichtbar, der Aufbau nicht ein zweites Mal neu erfunden. Grund: Die Bilder nennen ausdrücklich, was nicht gebaut wird. Das fehlt auf der Tafel, obwohl der Plan den Schnitt schon hat. Ein eigener Baum mit neuen Nummern neben den Sprints würde dasselbe noch einmal sagen. Gateway `go`.

E6. Leicht, mittel und schwer kommt nicht auf die Karte. Grund: Die Bilder hängen jeder Aufgabe so ein Schild um. Ob ein Sprint gebaut werden darf, sagt schon sein Tor. Ein Schild ändert daran nichts. Gateway `go`.

## Sprints

### S1 — Karten, die man vorliest

Ziel: Jeder Sprint auf der Tischplatte ist eine Karte, die sagt, was gebaut wird, warum, und wann es fertig ist.

Anforderungen: A1, A5.

Lieferumfang:

- S1-1. Jede Karte sagt in einem Satz, was dieser Sprint baut. Fertig, wenn das die Arbeiten sind und man sie vorlesen kann. Quelle: leer.
- S1-2. Dieselbe Karte sagt in einem anderen Satz, warum. Fertig, wenn das nicht noch einmal der Titel ist. Quelle: leer.
- S1-3. Darunter steht, wann er fertig ist. Fertig, wenn das die Abnahme ist und nicht noch einmal die Arbeit. Quelle: leer.

Gateway `go`. Go, wenn man eine Karte vorliest und was, warum und fertig auseinanderhält. No-Go, wenn die Karte nur den Titel oder nur den Auftrag zeigt. Abbruch: die Karte wiederholt den Titel als Grund. Dann bleibt sie liegen, bis die zwei Sätze verschieden sind. Hängt an A1.

Prompt: Auf der Tischplatte zeigt jeder Sprint eine Karte mit zwei Sätzen: was gebaut wird, und warum. Darunter steht, wann es fertig ist. Man liest das, ohne den Auftrag zu öffnen. Der Knopf zum Kopieren bleibt. Kein Technik-Katalog, kein Start für einen Programmierer, kein zweites Blatt. Abbruch, wenn die Karte nur den Titel zeigt.

### S2 — Das bauen wir nicht

Ziel: Über den Karten steht, was dieses Vorhaben nicht baut.

Anforderungen: A2, A5.

Lieferumfang:

- S2-1. Die Zeile zeigt die Schnitte, die der Plan schon hat. Fertig, wenn ein vorhandener Schnitt dort steht und ein fehlender nicht erfunden wird. Quelle: leer.

Gateway `go`. Go, wenn die Grenze vor den Karten lesbar ist. No-Go, wenn die Zeile etwas ausschließt, das der Mensch in seinem Satz haben will. Abbruch: der Plan hat keinen Schnitt. Dann bleibt die Zeile leer. Hängt an S1 und A2.

Prompt: Über den Sprint-Karten steht „Das bauen wir nicht“. Dort stehen die Schnitte, die der Plan schon hat. Fehlt einer, bleibt die Zeile leer und erfindet nichts. Kein zweiter Durchgang, der den Umfang neu schreibt. Abbruch, wenn die Zeile etwas ausschließt, das der Mensch in seinem Satz haben will.

### S3 — Eine Frage, wenn der Satz dünn ist

Ziel: Weiß man aus dem Satz nicht, was entstehen soll, fragt die Tischplatte einmal und schreibt noch keinen Plan.

Anforderungen: A3, A5.

Lieferumfang:

- S3-1. Ein dünner Satz legt eine Frage auf die Tafel. Fertig, wenn danach noch keine Karten dastehen. Quelle: leer.
- S3-2. Die nächste Antwort schreibt die Karten. Fertig, wenn ein klarer Satz gar nicht erst fragt. Quelle: leer.

Gateway `go`. Go, wenn nur der dünne Satz fragt und die Antwort auf der Tafel landet. No-Go, wenn jeder Satz eine Fragenreihe bekommt oder die Frage im Chat steht. Abbruch: die Antwort bleibt aus. Dann bleiben die Karten leer. Hängt an S1 und A3.

Prompt: Ist der Satz zu dünn, um zu wissen, was entstehen soll, legt die Tafel eine Frage hin und schreibt noch keinen Plan. Die nächste Antwort füllt die Karten. Ein klarer Satz fragt nicht. Keine Reihe von Auswahlfragen, kein Formular, die Frage nicht im Chat. Abbruch, wenn trotzdem ein Plan ohne diese Antwort dasteht.

### S4 — Zwei Sichten

Ziel: Sprints zeigt die Tore. PSP zeigt die Stücke. Beides ist nicht dieselbe Liste.

Anforderungen: A4, A5.

Lieferumfang:

- S4-1. Sprints bleibt bei was, warum und wann fertig. PSP nennt jedes Stück und was es liefert. Fertig, wenn die beiden Knöpfe verschieden aussehen. Quelle: leer.

Gateway `go`. Go, wenn man am Knopf erkennt, welche Sicht offen ist. No-Go, wenn PSP nur die Sprint-Titel wiederholt oder einen zweiten Baum mit eigenen Nummern aufmacht. Abbruch: die Stücke sagen nichts anderes als die Tore. Dann bleibt PSP liegen. Hängt an S1 und A4.

Prompt: Sprints zeigt die Tore: was, warum, wann fertig. PSP zeigt die Stücke und was jedes Stück liefert. Beide Knöpfe dürfen nicht dieselbe Liste zeigen. Kein eigener Modulbaum, kein zweites Blatt. Abbruch, wenn PSP nur die Sprint-Titel wiederholt.

## PSP

P1. Karten, die man vorliest. Paket P1-1: Karte mit was, warum und wann fertig. Ergebnis: A1. Fertig, wenn man die Karte vorliest und die drei Sätze auseinanderhält. Abbruch, wenn nur der Titel dasteht. Hängt an nichts.

P2. Das bauen wir nicht. Paket P2-1: Zeile über den Karten aus den vorhandenen Schnitten. Ergebnis: A2. Fertig, wenn nichts erfunden wird. Abbruch, wenn der Plan keinen Schnitt hat. Hängt an P1.

P3. Eine Frage, wenn der Satz dünn ist. Paket P3-1: eine Frage auf der Tafel, Karten erst nach der Antwort. Ergebnis: A3. Fertig, wenn ein klarer Satz nicht fragt. Abbruch, wenn die Antwort ausbleibt. Hängt an P1.

P4. Zwei Sichten. Paket P4-1: Sprints und PSP zeigen nicht dieselbe Liste. Ergebnis: A4. Fertig, wenn die Stücke sagen, was sie liefern. Abbruch, wenn PSP die Titel wiederholt. Hängt an P1.

## Risiken

R1. Die Karte nimmt den Titel als Grund. Dann liest man nichts Neues. Go verlangt zwei verschiedene Sätze.

R2. Eine Frage bei jedem Satz macht aus der Tafel eine Schleife. Nur der dünne Satz fragt.

R3. Vier Planer und ein Baukasten-Wähler würden denselben Plan mehrfach schreiben und einen Gewinner erfinden, den der Mensch nicht genannt hat. Deshalb stehen sie nicht im Plan.

## Schnittstellen

Vorhanden: die Tischplatte, die Sichten Sprints, PSP und Quellen, der Auftrag zum Kopieren, der Export nach Go, der eine Plan aus dem Satz. Neu: die lesbare Karte, die Zeile „Das bauen wir nicht“, die eine Frage bei dünnem Satz, und zwei Sichten, die nicht dieselbe Liste sind.

## Lücken

L1. Die Bilder nennen fremde Gerüste. Was die im Einzelnen tun, ist nicht belegt. Niemand hat `Such` gesagt. Sie werden nicht geholt.

L2. Die Bilder sind abgeschnitten. Übernommen wird nur, was darauf zu lesen ist: erst klären, die Grenze nennen, die Sprints so schreiben, dass man sie versteht, den Auftrag bereithalten. Der Rest der Unterhaltung gilt nicht.

L3. Wie viele Sprints ein neues Vorhaben bekommt, ändert dieser Plan nicht. Die Zahl setzt weiter der Satz.

## Projekt

Gateway `go`. Go, weil A1 bis A5, E1 bis E6 und S1 bis S4 je Abnahme und Abbruch haben und L1 bis L3 benannt sind. No-Go, wenn ein Sprint ein zweites Gerüst, einen Technik-Katalog, einen Startknopf für einen Programmierer oder eine Fragenreihe für jeden Satz will.

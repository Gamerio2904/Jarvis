# Planvorlage — nur Planung

Dieses Blatt füllt die Planung. Es schreibt keinen Code, keine
Version und kein APK. Ein Sprint wird erst **CODE**, wenn die Felder
unten stehen und jemand `Umsetzen` sagt.

Drei Kern-Sprints, fest: **Kern**, **Härten**, **Probe**. Kein viertes
Kapitel erfinden. Ein Satz ohne zweite Klausel lässt Härten und Probe
leer.

## 0. Reihenfolge

Die Planung läuft in dieser Folge. Ein späterer Schritt darf einen
früheren nicht überspringen und keine Quelle erfinden.

| Schritt | Ergebnis | Datei | Fertig, wenn |
|---------|----------|-------|----------------|
| 1 | Satz | `projekt.json` `notiz`, `ziel` | Der Satz des Nutzers steht unverändert |
| 2 | Wege | `wege.json` | Jede Klausel ist ein Weg, Herkunft `aus dem Satz` |
| 3 | Recherche | `wege.json` `quelle`, sonst `luecken.json` | Jede Quelle hat Fundstelle, oder das Feld bleibt leer |
| 4 | Sprints | `sprints.json` | Kern trägt den ganzen Satz. Härten vergleicht. Probe spielt einen Weg |
| 5 | PSP | `psp.json` | Arbeitspakete, keine Kopie der Sprintzeile |
| 6 | Abnahme | Abschnitt unten, je Weg und je Sprint | Ein Satz, woran man sieht, dass es stimmt |
| 7 | Risiken | Abschnitt unten | Was schiefgehen kann, und woran man abbricht |
| 8 | Schnittstellen | Abschnitt unten | Wer gibt wem was. Leer, wenn der Satz keine nennt |
| 9 | Lücken | `luecken.json` | Alles, was 3, 6, 7, 8 nicht füllen konnte |
| 10 | Fest | — | Erst wenn 1–9 benannt sind. Leere Lücken bleiben ehrlich leer |

`Such …` ist der einzige Schritt, der eine Quelle von außen holt.
Ohne dieses Wort bleibt `quelle` leer.

## 1. Projekt

```json
{
  "projekt": "",
  "art": "projekt",
  "notiz": "",
  "ziel": "",
  "wege": [],
  "fehlt": [],
  "sprints": [],
  "psp": []
}
```

| Feld | Was die Planung hineinschreibt |
|------|--------------------------------|
| `projekt` | Kurzer Name aus dem Satz, vor dem ersten Komma. Füllwörter der, die, das, ein, eine, und, projekt fallen weg. Leer wird `Projekt` |
| `notiz` | Der ganze Satz, unverändert |
| `ziel` | Derselbe Satz, eine Zeile, höchstens 160 Zeichen. Nicht nur die erste Klausel |
| `wege` | Dieselben Einträge wie `wege.json` |
| `fehlt` | Dieselben Einträge wie `luecken.json` |
| `sprints` | Die drei Kernzeilen |
| `psp` | Die Arbeitspakete, nicht noch einmal die Sprintzeile |

## 2. Wege — Schritt 1

Ein Weg ist eine Lösungsmöglichkeit aus dem Satz. Die Planung prüft
ihn. Sie erfindet keinen zweiten Weg, den der Satz nicht trägt.

```json
{
  "projekt": "",
  "art": "wege",
  "schritt": 1,
  "herkunft": "aus dem Satz",
  "hinweis": "Eine Quelle fehlt, bis Sie Such sagen.",
  "wege": [
    {
      "id": "W1",
      "satz": "",
      "weg": "",
      "loest": "",
      "grenzt_an": "",
      "quelle": "",
      "offen": "Quelle fehlt"
    }
  ]
}
```

| Feld | Pflicht in der Planung |
|------|------------------------|
| `id` | `W1`, `W2`, … in der Reihenfolge der Klauseln. Höchstens sechs |
| `satz` | Die Klausel, wörtlich. Getrennt an Komma und an `und` |
| `weg` | Ein Satz: was an dieser Klausel zu prüfen ist. Nicht noch einmal nur die Klausel |
| `loest` | Was der Weg tragen soll, in den Worten des Satzes |
| `grenzt_an` | Welche andere Klausel ihn berührt. Leer, wenn es nur eine Klausel gibt |
| `quelle` | Leer, oder Fundstelle nach `Such …`: Name, Adresse, was dort steht. Keine erfundene Adresse |
| `offen` | `Quelle fehlt`, solange `quelle` leer ist. Sonst leer |

Beispiel, Satz `Tik Tak To, Spielfeld bauen, Sieg prüfen`:

| ID | Satz | Weg | Löst | Grenzt an | Quelle |
|----|------|-----|------|-----------|--------|
| W1 | Tik Tak To | Prüfen, was der Name festlegt: zwei Seiten, ein Feld, ein Zug | Den Gegenstand des Satzes | Spielfeld bauen | |
| W2 | Spielfeld bauen | Prüfen, welches Feld der Satz meint | Die Fläche, auf der gespielt wird | Tik Tak To, Sieg prüfen | |
| W3 | Sieg prüfen | Prüfen, woran ein Zug als Ende gilt | Das Ende einer Runde | Spielfeld bauen | |

Die Quelle bleibt leer, bis jemand `Such …` sagt.

## 3. Sprintvorlage

Jeder Kern-Sprint hat dieselbe Hülle. Die Planung füllt Ziel,
Lieferumfang, Won't und Abbruch. Die Anleitung beschreibt den
Prüfschritt. Sie kopiert die Aufgabe nicht.

```json
{
  "n": "1",
  "kind": "core",
  "title": "Kern",
  "ziel": "",
  "warum": "",
  "lieferumfang": [
    {
      "id": "S1-1",
      "task": "",
      "anleitung": "",
      "weg": "W1",
      "quelle": "",
      "abnahme": "",
      "datei": ""
    }
  ],
  "wont": ["—"],
  "abbruch": "—",
  "offen": ""
}
```

| Feld | Was hineinkommt |
|------|-----------------|
| `n` | `1` Kern, `2` Härten, `3` Probe. Custom nur `C1`, `C2`, … und nur mit Grund |
| `title` | Genau `Kern`, `Härten` oder `Probe`. Nicht umbenennen |
| `ziel` | Ein Satz. Siehe die drei Ziele unten |
| `warum` | Warum dieser Sprint vor dem nächsten kommt |
| `lieferumfang[].task` | Die Arbeit, kurz, höchstens 120 Zeichen |
| `lieferumfang[].anleitung` | Der Prüfschritt. Höchstens 160 Zeichen. Nicht gleich `task` |
| `lieferumfang[].weg` | `W1` … oder leer, wenn der Sprint keinen einzelnen Weg meint |
| `lieferumfang[].quelle` | Dieselbe Regel wie bei den Wegen |
| `lieferumfang[].abnahme` | Woran diese eine Zeile stimmt |
| `lieferumfang[].datei` | Welche Plandatei die Zeile fortschreibt: `wege.json`, `sprints.json`, `psp.json`, `luecken.json`. Keine Code-Datei |
| `wont` | Was dieser Sprint nicht tut. `—`, solange nichts ausgeschlossen ist |
| `abbruch` | Der konkrete Fall, in dem die Planung stoppt. `—`, solange keiner benannt ist |
| `offen` | Was an diesem Sprint noch fehlt |

`datei` in der Planung ist eine Plandatei. Eine Quelldatei der App
gehört in einen späteren CODE-Sprint, nicht hier.

### Sprint 1 — Kern

| Feld | Inhalt |
|------|--------|
| Ziel | Der ganze Satz, nicht nur die erste Klausel |
| Warum | Ohne die Wege gibt es nichts zu vergleichen und nichts zu proben |
| Lieferumfang | Eine Zeile je Weg. `id` `S1-1` … `task` ist die Klausel. `anleitung` ist `Weg prüfen. Was er löst, steht im Satz. Eine Quelle fehlt noch.` solange keine Quelle da ist |
| Won't | Keinen Weg erfinden, den der Satz nicht nennt. Keine Quelle ohne `Such` |
| Abbruch | Der Satz hat keine Klausel mit mindestens drei Zeichen |
| Offen | Quelle, Abnahme, Risiko, Schnittstelle, soweit sie in Schritt 9 noch fehlen |

Eine Klausel: nur dieser Sprint bekommt ein Ziel. Sprint 2 und 3
bleiben `ziel` `""` und `lieferumfang` `[]`.

### Sprint 2 — Härten

Nur wenn mindestens zwei Wege da sind.

| Feld | Inhalt |
|------|--------|
| Ziel | `Die Wege gegeneinander halten.` |
| Warum | Ein Weg, der den Satz nicht trägt, darf nicht in die Probe |
| Lieferumfang | Eine Zeile `S2-1`, Aufgabe `Wege vergleichen`. Anleitung: jeden Weg gegen die anderen halten, keinen Gewinner erfinden, den der Satz nicht hergibt |
| Won't | Keinen Weg streichen, ohne den Satz zu nennen, der ihn nicht trägt |
| Abbruch | Zwei Wege widersprechen sich und der Satz sagt nicht, welcher gilt. Dann stoppt die Planung und fragt |
| Offen | Der Vergleich ist leer, solange die Quellen leer sind. Das ist erlaubt. Der Vergleich der Sätze ist trotzdem fällig |

### Sprint 3 — Probe

Nur wenn mindestens zwei Wege da sind.

| Feld | Inhalt |
|------|--------|
| Ziel | `Einen Weg einmal durchspielen.` |
| Warum | Ein Plan, der nie einen Weg anfasst, bleibt eine Liste |
| Lieferumfang | Eine Zeile `S3-1`, Aufgabe `Einen Weg durchspielen`. Anleitung: einen Weg aus dem Satz einmal prüfen. Abbruch, wenn der Satz ihn nicht trägt |
| Won't | Nicht alle Wege durchspielen. Nicht mit dem Durchspielen anfangen, bevor Kern und Härten stehen |
| Abbruch | Der gewählte Weg kommt im Satz nicht vor |
| Offen | Welcher Weg gespielt wird, steht erst fest, wenn Härten einen nennt. Sonst `offen`: `Weg noch nicht gewählt` |

### Custom

Nur auf Zuruf, `n` `C1`, `kind` `custom`. Das Ziel muss einen Grund
nennen: Gerät, Sideload, Parser-Konflikt oder Risiko. Ohne Grund kein
Custom-Sprint.

## 4. PSP

Der PSP ist die Arbeitsliste unter den drei Sprints. Er ist nicht die
Sprintzeile ein zweites Mal. Oben bleiben drei Kästen, einer je
Kern-Sprint, damit die Liste so lang ist wie die Sprints. Darunter
liegen die Pakete.

Ein Paket ist eine Arbeit, die ein Ergebnis hat. Es hat eine
Abnahme und einen Abbruch. Es hat keine Version und keinen Code.

```json
{
  "projekt": "",
  "art": "psp",
  "psp": [
    {
      "n": "1",
      "title": "Kern",
      "ziel": "",
      "pakete": [
        {
          "id": "P1-1",
          "arbeit": "",
          "ergebnis": "",
          "weg": "W1",
          "quelle": "",
          "fertig_wenn": "",
          "abbruch": "",
          "hängt_an": ""
        }
      ],
      "offen": ""
    }
  ]
}
```

| Feld | Was die Planung hineinschreibt |
|------|--------------------------------|
| `n`, `title`, `ziel` | Dieselben drei Kästen wie die Sprints. Titel bleiben Kern, Härten, Probe |
| `pakete[].id` | `P1-1` unter Sprint 1, `P2-1` unter Sprint 2, `P3-1` unter Sprint 3 |
| `arbeit` | Was zu tun ist. Kann der `task` der Sprintzeile entsprechen, muss aber das Ergebnis daneben haben |
| `ergebnis` | Was danach vorliegt: ein Eintrag in `wege.json`, ein Vergleich, ein durchgespielter Weg. Kein Diff, keine Datei im Quellbaum |
| `weg` | `W1` … |
| `quelle` | Leer oder Fundstelle |
| `fertig_wenn` | Der Abnahmesatz dieses Pakets |
| `abbruch` | Wann das Paket liegen bleibt |
| `hängt_an` | `W1`, `P1-1` oder leer. Die Probe hängt an Härten. Härten hängt an den Wegen |
| `offen` | `Quelle fehlt`, `Weg noch nicht gewählt` oder `Noch leer` |

Pakete, die zur Planung gehören, nicht zum Code:

| ID | Kasten | Arbeit | Ergebnis | Fertig, wenn | Hängt an |
|----|--------|--------|----------|--------------|----------|
| P1-1 | Kern | Klauseln schneiden | Eine Zeile je Weg in `wege.json` | Jede Klausel hat `id`, `satz`, `weg` | der Satz |
| P1-2 | Kern | Ziel des Kerns | `ziel` ist der ganze Satz | Die zweite Klausel steht im Ziel, nicht nur die erste | P1-1 |
| P1-3 | Kern | Anleitung | Prüfschritt je Weg | `anleitung` ist nicht gleich `task` | P1-1 |
| P2-1 | Härten | Wege halten | Eine Notiz, welcher Weg welchen berührt | Jeder Weg mit Nachbar hat `grenzt_an` | P1-1, und nur bei zwei oder mehr Wegen |
| P2-2 | Härten | Widerspruch | Ein Eintrag in `luecken.json` oder eine Entscheidung aus dem Satz | Kein stiller Gewinner | P2-1 |
| P3-1 | Probe | Einen Weg wählen | `offen` wird leer oder nennt den Weg | Der Weg kommt im Satz vor | P2-1 |
| P3-2 | Probe | Einmal durchspielen | Der Prüfschritt steht in der Sprint-3-Anleitung | Der Schritt zitiert den Satz und keine fremde Quelle | P3-1 |
| P4-1 | über den Kästen | Lücken schreiben | `luecken.json` | Recherche, Abnahme, Risiken, Schnittstellen sind benannt, auch wenn leer | P1-3 |

`P4-1` liegt nicht in einem vierten Sprint. Es ist die Schlusszeile
der Planung und steht in `luecken.json`, nicht als Sprint 4.

## 5. Abnahme

Die Planung schreibt je Weg und je Paket einen Satz. Ohne diesen Satz
bleibt der Punkt in `luecken.json` unter Abnahme.

| Gegenstand | Abnahme |
|------------|---------|
| Weg | Der `weg`-Satz nennt nur, was die Klausel hergibt |
| Kern | `ziel` enthält jede Klausel des Satzes |
| Härten | Jede Klausel ab der zweiten steht in `grenzt_an` eines anderen Weges, oder der Sprint ist leer, weil es nur eine Klausel gibt |
| Probe | Es wird ein Weg gespielt, und der Satz enthält ihn |
| PSP | Kein Paket ist nur die Sprintzeile ohne `ergebnis` und ohne `fertig_wenn` |
| Quelle | Leer, oder Name und Adresse. Eine leere Quelle ist bestanden, eine erfundene nicht |

## 6. Risiken

Nur Risiken, die der Satz oder ein späterer `Such` hergibt. Kein
Risiko aus einem leeren Bauch.

| ID | Risiko | Woran man es sieht | Abbruch |
|----|--------|--------------------|---------|
| R1 | Der Satz hat zwei Lesarten | Härten findet einen Widerspruch | Planung fragt. Sie wählt nicht selbst |
| R2 | Eine Quelle fehlt und jemand füllt sie | `quelle` hat Text, niemand hat `Such` gesagt | Der Text fliegt raus, `offen` wird `Quelle fehlt` |
| R3 | Die Anleitung kopiert die Aufgabe | `anleitung` gleich `task` | Die Zeile gilt als nicht geplant |
| R4 | Die Probe startet ohne Kern | Sprint 3 hat ein Ziel, Sprint 1 nicht | Probe leeren |
| R5 | Ein vierter Sprint entsteht | `n` ist nicht 1, 2, 3 oder `C` mit Grund | Zurück auf drei Kern-Sprints |

## 7. Schnittstellen

Wer gibt der Planung etwas, und wer bekommt das Ergebnis. Leer lassen,
wenn der Satz keine nennt.

| Von | An | Was | Wann |
|-----|----|-----|------|
| Nutzer | Planung | Der Satz nach `Plane das` | Schritt 1 |
| Nutzer | Planung | `Such …` | Schritt 3, sonst keine Quelle |
| Planung | `wege.json` | Die Wege | Schritt 2 |
| Planung | `sprints.json` | Drei Kern-Sprints | Schritt 4 |
| Planung | `psp.json` | Pakete | Schritt 5 |
| Planung | `luecken.json` | Was offen bleibt | Schritt 9 |
| Planung | Nutzer | Die Lücken, im Satz | bevor Fest |
| Fest | Code | Nichts in dieser Vorlage | erst nach `Umsetzen`, in einem eigenen CODE-Sprint |

Die Planung übergibt dem Code keinen Diff. Sie übergibt die fünf
Dateien und die benannten Lücken.

## 8. Lücken

Was die Schritte 3, 6, 7 und 8 nicht füllen konnten, steht hier. Eine
Lücke zu benennen ist der Abschluss der Planung. Sie mit einem
erfundenen Text zu stopfen ist keiner.

```json
{
  "projekt": "",
  "art": "luecken",
  "fehlt": [
    { "name": "Recherche", "warum": "Keine Quelle. Sag Such, dann wird sie festgehalten.", "schritt": 3 },
    { "name": "Abnahme", "warum": "Kein Kriterium im Satz.", "schritt": 6 },
    { "name": "Risiken", "warum": "Nicht benannt.", "schritt": 7 },
    { "name": "Schnittstellen", "warum": "Nicht benannt.", "schritt": 8 }
  ]
}
```

Eine Lücke fällt aus `fehlt`, sobald ihr Abschnitt einen echten Satz
hat. `Recherche` fällt nur, wenn `quelle` eine Fundstelle trägt.

## 9. Was die Planung nicht tut

- Sie schreibt keine Quelldatei, keine Version, kein APK.
- Sie legt keinen vierten Kern-Sprint an.
- Sie kopiert eine Klausel nicht in `anleitung` und nicht in Sprint 2
  oder 3 als Ziel.
- Sie erfindet keine Adresse, kein Bild und keinen Gewinner unter den
  Wegen.
- Sie füllt Härten und Probe nicht, wenn der Satz nur eine Klausel hat.
- Sie nennt einen Plan nicht vollständig, solange `luecken.json` die
  offenen Punkte nicht aufführt.

## 10. Abbruch der ganzen Planung

Die Planung stoppt und fragt, wenn einer dieser Fälle eintritt.

- Der Satz nach `Plane das` ist leer.
- Zwei Klauseln widersprechen sich und der Satz entscheidet nicht.
- Jemand will eine Quelle, ohne `Such` gesagt zu haben.
- Ein Paket hat kein `ergebnis`.
- Sprint 2 oder 3 hat ein Ziel, obwohl nur eine Klausel da ist.

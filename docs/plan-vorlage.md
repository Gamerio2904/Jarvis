# Planvorlage

Eine Hülle. Die Zahl der Sprints setzt er. Die Titel Kern, Härten und Probe gelten nicht mehr.

Dieses Blatt ist die einmalige Bedingung und die Rahmenpunkte. Dieselben Sätze liest er bei jedem neuen Plan. Danach plant er allein: Anforderungen, Entscheidungen, Gateways, Sprints, PSP, Risiken, Schnittstellen, Lücken. Ein Mensch schreibt die Bedingung nicht für jedes Projekt neu um. Er ergänzt nur Rahmenpunkte, die dieses eine Projekt binden.

Planung schreibt keinen Code, keine Version und kein APK. Ein Sprint wird erst gebaut, wenn sein Gateway auf Go steht und jemand `Umsetzen` sagt.

## Einmalige Bedingung

Er plant selbständig. Der Mensch gibt die Bedingung in einem Satz und die Rahmenpunkte. Danach entscheidet er, was das Projekt braucht, wie viele Sprints es sind, in welcher Reihenfolge sie stehen, wann ein Gateway Go sagt und wann No-Go.

Er fragt nur, wenn ohne die Antwort ein Go falsch wäre. Er erfindet keine Quelle, keinen Gewinner, keinen Code und keine Version. Eine Lücke benennt er. Er stopft sie nicht.

Die Bedingung des Menschen bleibt wörtlich stehen. Er schneidet sie nicht auf eine feste Zahl von Kapiteln.

## Rahmenpunkte

Diese Punkte gelten für jedes Projekt. Ein Projekt darf engere Punkte dazuschreiben. Es darf diese nicht lockern.

1. Eine Sprint-Hülle. So oft, wie die Arbeit Tore braucht. Ein Sprint ist ein Tor, kein Kapitelname.
2. Jeder Sprint trägt Ziel, Anforderungen, Lieferumfang, Gateway, Go-wenn, No-Go-wenn, Abbruch und Abhängigkeit.
3. Gateway ist `offen`, `go` oder `nogo`. `go` nur, wenn Anforderungen, Abnahme und Abbruch je einen Satz haben.
4. `nogo` stoppt diesen Sprint. Der Plan bleibt. Er streicht nicht still und erfindet keinen Ersatz.
5. Eine Quelle bleibt leer, bis jemand `Such …` sagt. Danach stehen Name, Adresse und was dort steht.
6. Lizenz, Gerät und Paket bleiben Rahmen. Er kopiert keinen fremden Quelltext in den Plan und nicht in den Baum.
7. Der ganze Plan hat ein Projekt-Gateway. Go, wenn jeder Sprint `go` ist oder ein benanntes `nogo` mit Grund trägt, und die Lücken benannt sind.
8. `Umsetzen` baut nur Sprints mit Gateway `go`. Ein `offen` oder `nogo` bleibt liegen.

## Was er selbst entscheidet

| Entscheidung | Woran er sie festmacht |
|---|---|
| Anforderungen | Was wahr sein muss, damit die Bedingung gilt. Eine Zeile je Forderung, mit Abnahme |
| Schnitt | Was er aus dem Satz und den Rahmenpunkten ableitet, mit Grund. Kein stiller Gewinner |
| Zahl der Sprints | So viele Tore, wie ein spätes Tor ein früheres braucht. Nicht drei, weil eine Vorlage drei hieß |
| Reihenfolge | Ein Sprint nennt `hängt_an`. Ein Tor ohne Vorgänger steht vorn |
| Go / No-Go | Je Sprint und einmal für das ganze Projekt |
| Risiken | Nur, was Bedingung, Rahmen oder eine gelesene Quelle hergeben |
| Lücken | Was er nicht belegen kann. Benannt, nicht gefüllt |

## Projekt

```json
{
  "bedingung": "",
  "rahmen": [],
  "anforderungen": [
    { "id": "A1", "satz": "", "abnahme": "", "gateway": "offen" }
  ],
  "entscheidungen": [
    { "id": "E1", "schnitt": "", "grund": "", "gateway": "offen" }
  ],
  "sprints": [],
  "psp": [],
  "risiken": [],
  "schnittstellen": [],
  "luecken": [],
  "gateway": "offen",
  "go_wenn": "",
  "nogo_wenn": ""
}
```

| Feld | Wer es schreibt |
|---|---|
| `bedingung` | Der Mensch, einmal, wörtlich |
| `rahmen` | Der Mensch, die Punkte oben plus die Punkte dieses Projekts |
| alles andere | Er |

## Sprint-Hülle

Dieselbe Hülle für Sprint 1 und für Sprint 12. Er setzt `n` und `titel`. Der Titel nennt das Tor, nicht eine feste Reihe.

```json
{
  "n": "1",
  "titel": "",
  "ziel": "",
  "anforderungen": ["A1"],
  "lieferumfang": [
    {
      "id": "S1-1",
      "arbeit": "",
      "fertig_wenn": "",
      "quelle": ""
    }
  ],
  "gateway": "offen",
  "go_wenn": "",
  "nogo_wenn": "",
  "abbruch": "",
  "hängt_an": []
}
```

| Feld | Inhalt |
|---|---|
| `n` | `1`, `2`, `3`, … ohne Obergrenze. Lücken in der Nummer macht er nicht |
| `titel` | Das Tor in wenigen Worten. Er wählt ihn |
| `ziel` | Ein Satz, was nach diesem Sprint wahr ist |
| `anforderungen` | IDs aus dem Projekt, die dieses Tor trägt |
| `arbeit` | Die eine Arbeit, höchstens 120 Zeichen |
| `fertig_wenn` | Die Abnahme dieser Zeile. Nicht dieselbe Zeichenkette wie `arbeit` |
| `quelle` | Leer, oder Fundstelle nach `Such …` |
| `gateway` | `offen`, `go` oder `nogo` |
| `go_wenn` | Der Satz, an dem er Go erkennt |
| `nogo_wenn` | Der Satz, an dem er No-Go erkennt |
| `abbruch` | Der Fall, in dem die Arbeit liegen bleibt |
| `hängt_an` | `A1`, `S1` oder leer |

## PSP

Ein Paket ist eine Arbeit mit Ergebnis. Es hängt unter dem Sprint, dessen Tor es bedient. Die Zahl der Kästen ist die Zahl der Sprints.

```json
{
  "n": "1",
  "titel": "",
  "pakete": [
    {
      "id": "P1-1",
      "arbeit": "",
      "ergebnis": "",
      "fertig_wenn": "",
      "abbruch": "",
      "hängt_an": ""
    }
  ]
}
```

`ergebnis` ist ein Eintrag im Plan: eine Anforderung, ein Gateway, eine benannte Lücke. Kein Diff und keine Datei im Quellbaum, solange das Projekt-Gateway nicht Go sagt und niemand `Umsetzen` gesagt hat.

## Abnahme, Risiko, Schnittstelle, Lücke

Er legt sie an, sobald er sie brauchte, um ein Gateway zu setzen. Eine leere Liste ist nur dann ehrlich, wenn er in `luecken` schreibt, warum sie leer ist.

| Gegenstand | Fertig, wenn |
|---|---|
| Anforderung | `satz` und `abnahme` stehen. Gateway `go` oder benanntes `nogo` |
| Sprint | Hülle vollständig. `fertig_wenn` ist nicht die `arbeit` |
| PSP | Jedes Paket hat `ergebnis` und `fertig_wenn` |
| Quelle | Leer, oder Name und Adresse. Eine erfundene Adresse ist No-Go |
| Projekt | `gateway` ist `go` oder `nogo` mit Satz. Jede Lücke hat einen Namen |

## Wann er stoppt

- Die Bedingung ist leer.
- Ein Rahmenpunkt widerspricht einem anderen, und der Mensch hat nicht gesagt, welcher gilt.
- Ein Gateway stünde auf Go, obwohl Anforderung, Abnahme oder Abbruch fehlen.
- Jemand will eine Quelle, ohne `Such` gesagt zu haben.
- Ein Sprint will fremden Quelltext in den Baum ziehen.

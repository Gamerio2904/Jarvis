# Sprint 257 — Intent-Embeddings statt Konflikt-Tisch

**Version:** `16.9.0` (versionCode `160900`) — **Embeddings: ABGEBROCHEN am
eigenen Tor (S257-9).** Was stattdessen ausgeliefert wurde, steht unter
[Ergebnis](#ergebnis-das-tor-hat-gehalten).
**Plan:** [`68-next.md`](../68-next.md) §12 · Upgrade **C** aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprint **250** (Kennzahlen als Netz)

## Ziel

Die **Bewertungsschicht** wird gelernt statt handgestimmt. Die Parser bleiben,
wie sie sind.

## Warum

60 Parser mit handgesetzten `extra`-Boni und `conflicts.ts` mit über 40 Regeln
auf 360 Zeilen. Was die Audits für `16.1.x` darin gefunden haben, ist kein
Zufall, sondern die Bauart:

| Fund | Warum unsichtbar |
|------|------------------|
| `/\b(fernseh\|…)\b/` traf „Fernseher" nie | eine Wortgrenze an der falschen Stelle |
| Kosten entschieden nie etwas | `SCORE_MARGIN` (0.12) > maximaler Kostenunterschied (0.05) |
| Boosts sättigten an der Decke weg | `SCORE_CEIL` war 0.99, `boost` gab 0.3 |
| `drop(out, 'research')` traf nichts | kein Agent heißt so; der Suchagent ist `search` |

Vier Fehler, alle still, alle erst durch einen Nutzer oder ein gezieltes Audit
gefunden. Jeder neue Agent ist ein Eingriff in ein handgestimmtes System, und
die `drop`/`boost`-Regeln sind zusätzlich reihenfolgeabhängig.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| 40+ Regeln, reihenfolgeabhängig | Ähnlichkeit zum Intent-Zentroid, addiert |
| neuer Agent = Eingriff im Tisch | neuer Agent = Beispiele im Korpus |
| Fehler still bis zur Beschwerde | Eval zeigt die Trefferquote sofort |
| `conflicts.ts` macht alles | `conflicts.ts` nur noch harte Sicherheitsregeln |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S257-9 | **Trennschärfe-Test vor allem anderen** — Abbruch, wenn er scheitert | `scripts/eval/separability.mjs` | **CODE** |
| S257-1 | Intent-Datensatz aus dem Eval-Korpus (250+ Äußerungen) | `engine/eval/corpus.ts` | entfällt |
| S257-2 | `multilingual-e5-small` in `onnxruntime-web`, lazy | `engine/embed.ts` | entfällt |
| S257-3 | Zentroid je Agent, zur Bauzeit berechnet und mitgeliefert | `engine/intent-centroids.json` | entfällt |
| S257-4 | Ähnlichkeit **nur** bei mehreren gleich starken Kandidaten | `engine/policy.ts` | entfällt |
| S257-5 | `conflicts.ts` zurückbauen auf harte Regeln | `engine/conflicts.ts` | entfällt |
| S257-6 | Rückfallebene: ohne Modell gilt der heutige Tisch | `engine/policy.ts` | entfällt |
| S257-7 | Eval-Vergleich gegen die Baseline aus 250 | `scripts/eval/report.mjs` | CODE (250) |
| S257-8 | Docs: `66-agents-ist.md` §2 neu schreiben | docs | entfällt |
| S257-10 | `query:` / `passage:` Präfixe von e5 korrekt setzen | `engine/embed.ts` | entfällt |
| S257-11 | Mehrfach-Sampling als letzte Ebene statt Rückfrage, auf dem 8B | `engine/policy.ts` | entfällt |

Was stattdessen gebaut wurde, weil die Messung dorthin zeigte:

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S257-12 | Verbletzte Sätze umstellen — **nur wenn sonst kein Kandidat** | `engine/verb-front.ts` | CODE |
| S257-13 | Die Umstellung bis zum Handler durchreichen, nicht nur zum Router | `engine/route-pick.ts`, `engine/director.ts` | CODE |
| S257-14 | Zahlwörter auch mitten im Satz: „um acht **an den Zahnarzt**" | `engine/zahlenworte.ts` | CODE |
| S257-15 | „mach das an" nach einem TV-Zug wie „mach das aus" behandeln | `engine/tv-parse.ts` | CODE |
| S257-16 | Neun Alltagssätze im Korpus festgenagelt | `engine/eval/corpus.ts` | CODE |
| S257-17 | Tests für Umstellung, Zahlwörter, Pro-Formen | `scripts/test-verb-front.mjs` | CODE |

## S257-9 — Der Test, der vor der Arbeit kommt

Die Research, aus der dieser Sprint stammt, begründete Embeddings mit
`König − Mann + Frau = Königin`. Diese Analogie ist ein schlechter Beleg
([`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §1.2) und sagt über
diesen Sprint gar nichts. Was zählt, ist eine einzige, viel langweiligere Frage:

> Liegen Äußerungen desselben Agenten näher beieinander als Äußerungen
> verschiedener Agenten?

Das ist in einem Nachmittag messbar, **bevor** eine Zeile `policy.ts` angefasst
wird: Korpus einbetten, Zentroide bilden, je Fall den nächsten Zentroid nehmen.

| Ergebnis | Konsequenz |
|----------|------------|
| Nächster Zentroid trifft klar besser als der Zufall | Sprint läuft wie geplant |
| Trifft, aber schwach | nur als kleiner Summand, `conflicts.ts` bleibt führend |
| Trifft nicht | **Sprint abgebrochen**, S257-2 bis S257-8 entfallen |

Der dritte Fall ist nicht unwahrscheinlich. Agenten wie `tv` und `home` liegen
sprachlich dicht beieinander („mach das Licht an" / „mach den Fernseher an"),
und genau dort muss die Trennung sitzen. Diesen Ausgang vorher zu kennen kostet
einen Nachmittag; ihn nachher zu merken kostet einen Sprint.

## Ergebnis: das Tor hat gehalten

`npm run eval:separability`, 341 Sätze — 317 aus dem Korpus, 24 absichtlich
mehrdeutige Sonden (`engine/eval/ambig-probes.ts`, „mach das an", „spiel was",
„was ist mit dem Termin und dem Wetter"):

| Satzmenge | Fälle | Rückfrage | knapper Vorsprung | exakter Gleichstand | ohne Agenten |
|-----------|------:|----------:|------------------:|--------------------:|-------------:|
| Eval-Korpus | 317 | **0** | 1 | 1 | 20 (6,3 %) |
| Ambig-Sonden | 24 | **0** | 0 | 0 | 15 (62,5 %) |

**Der Pfad, den dieser Sprint verbessern sollte, wird kein einziges Mal
erreicht.** Eine Ähnlichkeit, die laut eigener Latenz-Schranke nur bei
Gleichstand rechnen darf, rechnet damit nie. Der einzige knappe Fall im ganzen
Korpus ist „Wo ist die Apotheke" (`poi` gegen `maps`, Abstand 0,000), und den
entscheidet `TIE_ORDER` seit Sprint 240 richtig.

Die Trennschärfe selbst wurde trotzdem gemessen, mit einer **lexikalischen**
Einbettung (Zeichen-Trigramme und Wörter, TF-IDF, Kosinus) als Untergrenze:

| Verfahren | Trefferquote |
|-----------|-------------:|
| Zufall (28 Klassen) | 3,6 % |
| nächster Zentroid, lexikalisch | 69,3 % |
| Parser von heute | **100,0 %** |

Kosinus zum eigenen Zentroid 0,272, zum nächsten fremden 0,170 — ein Abstand
von 0,101. Die Idee funktioniert also im Prinzip (69 % gegen 3,6 % Zufall ist
kein Rauschen), aber sie funktioniert **schlechter als das, was da ist**, und
sie würde an der einzigen Stelle helfen, die es nicht gibt. Ein echtes
`multilingual-e5-small` läge über 69 %; es müsste über 100 % liegen, um hier
etwas beizutragen.

Die Verwechslungen der lexikalischen Messung sind zusätzlich lehrreich: `hud →
eye` (5), `reminder → alarm` (3), `calendar ↔ brief` (je 2). Das sind genau die
Paare, bei denen auch ein besseres Modell schwimmt — semantisch benachbarte
Agenten mit unterschiedlicher Wirkung. Dort **will** man keine Ähnlichkeit
entscheiden lassen.

**Damit ist S257-2 bis S257-8 und S257-10 geschlossen.** Die Idee ist nicht
„später nochmal", sondern beantwortet: sie braucht einen Gleichstand, und den
produziert dieser Router nicht.

S257-11 (Mehrfach-Sampling statt Rückfrage) fällt mit derselben Zahl: bei einer
Rückfrage-Quote von 0,0 % gibt es nichts zu ersetzen. Die Auflage aus dem Plan
— „ohne die Rückfrage-Quote aus Sprint 250 wird S257-11 nicht gebaut" — ist
damit erfüllt, und zwar negativ.

## Was die Messung stattdessen gefunden hat

Der Zensus hat eine zweite Spalte: **ohne Agenten**. 62,5 % der Sonden und
6,3 % des Korpus erreichen keinen einzigen Kandidaten und fallen ans Modell.
Dort fehlt kein Rangkriterium, dort fehlt ein Kandidat — und eine Ähnlichkeit,
die laut der Grenze unten „keinen Agenten erfinden" darf, kann das nicht heben.

Drei Ursachen, alle deterministisch behebbar, alle gefunden statt geraten:

**1. Verbletzte Sätze.** „Stell einen Timer für zehn Minuten" verstehen die
Parser. „Einen Timer für zehn Minuten stellen" nicht. Dieselbe Bitte, deutsche
Wortstellung — und gesprochen die häufigere, besonders mit Höflichkeitsform
(„Kannst du mir … stellen"). `engine/verb-front.ts` dreht solche Sätze um,
**aber nur, wenn die Vorlage keinen Kandidaten hat**. Auf dem schnellen Pfad
wird die Funktion nie berührt, und sie kann keinen Treffer verdrängen — an der
Stelle, wo sie läuft, gibt es keinen.

Wichtig ist die zweite Hälfte: die gedrehte Fassung geht **auch an den
Handler**. `decideTurn` gibt die Entscheidung samt der Fassung zurück, auf die
sie sich bezieht. Ohne das hätte der Router richtig geroutet und der Parser des
Agenten wäre danach an der ursprünglichen Wortstellung gescheitert — ein
Fehler, der als „er sagt, er macht es, und macht nichts" ankommt.

**2. Zahlwörter mitten im Satz.** „Erinnere mich morgen um **8** an den
Zahnarzt" kam an, „um **acht**" nicht. Die Umschrift von Sprint 250 verlangte,
dass die Zahl den Satz beendet oder eine Tageszeit folgt — genau der Anlass
(„an den Zahnarzt") schloss sie aus. Jetzt zählt auch ein angeschlossener
Anlass (`an`, `am`, `zum`, `zur`, `wegen`), und „auf sieben" folgt derselben
Regel („Stell den Wecker auf sieben"). „Kümmere dich um drei Sachen" bleibt
unangetastet — das ist der Grund, warum die Regel überhaupt eine Bedingung hat.

**3. Eine Ausnahme, die zu breit war.** Nach einem Fernseh-Zug schaltete „mach
das **aus**" ab, „mach das **an**" nicht. Ursache war eine Ausnahme auf
`das|du|es` aus `16.0.x`, gedacht gegen „mach **du** das an" als Bestätigung
einer angebotenen Suche. Sie traf die halbe Pro-Form-Familie mit. Jetzt greift
sie nur noch bei `du` und bei Verben, deren „an" zum Verb gehört („schau dir
das an"). Der alte Testfall bleibt grün.

### Wirkung

| Priorität | Wirkung |
|-----------|---------|
| Antwortqualität | besser: neun bisher unverstandene Alltagssätze werden ausgeführt statt beredet |
| Alles funktioniert | besser: Router und Handler sehen dieselbe Fassung |
| Latenz | **unverändert** — die Umstellung läuft nur, wo vorher das Modell übernahm, also vor einem Netzaufruf |
| Kostenlos / nutzbar | besser: jeder deterministisch erledigte Zug ist ein Modellaufruf weniger |

Und das ist der eigentliche Punkt gegen die ursprüngliche Planung: die
Embedding-Variante hätte 120 MB Modell, `onnxruntime-web` im Bundle und einen
zweiten Ladepfad gekostet — für einen Fall, den es nicht gibt. Die drei
Korrekturen kosten 70 Zeilen und keine Millisekunde auf dem schnellen Pfad.

## Verhältnis zum eingefrorenen `e5`-Paket

`quality-pack.ts` führt bereits ein Could-Paket `e5` mit der Einstellung
`e5_rerank` und der Datei `/onnx/e5-small.onnx`, eingefroren über
[`sprint-176.md`](./sprint-176.md) und [`sprint-195.md`](./sprint-195.md). Das
ist **nicht** dieser Sprint, und die beiden dürfen nicht vermischt werden:

| | eingefrorenes `e5`-Paket | dieser Sprint |
|---|---|---|
| Zweck | Retrieve-Ergebnisse umsortieren | Absicht erkennen |
| Berührt | `retrieve.ts` | `policy.ts` |
| Regel dort | „nie der Tool-Router" | genau der Tool-Router |

Der Satz „e5 nie der Tool-Router" aus `quality-pack.ts` bezieht sich auf das
**Rerank**-Paket und ist eine Aussage über Retrieve, nicht über Intent. Dieser
Sprint stellt die Frage neu — aber er muss sie neu stellen und darf sich nicht
auf ein Paket berufen, dessen Won’t genau das Gegenteil sagt. Praktisch heißt
das: eigene Einstellung, eigener Zentroid-Pfad, `e5_rerank` bleibt unberührt.
Der Lademechanismus aus `quality-pack.ts` wird geteilt, die Semantik nicht.

## S257-10 — Die Präfixe sind nicht optional

`multilingual-e5-small` ist mit `query: ` und `passage: ` als Präfix trainiert.
Ohne sie sinkt die Qualität messbar, und der Fehler ist stumm — die Vektoren
sehen normal aus. Für diesen Anwendungsfall gilt: Nutzeräußerung als `query:`,
Katalog-Beispiele als `passage:`. Gehört in den Trennschärfe-Test aus S257-9,
sonst misst der die falsche Sache.

## S257-11 — Mehrfach fragen statt zurückfragen

Wenn nach allem noch zwei Kandidaten gleich stehen, fragt Jarvis heute zurück.
Genau darüber hat sich der PO beschwert. Die billige Alternative aus der
Research — dort fälschlich als „RL zur Laufzeit" beschrieben, tatsächlich nur
Sampling ([`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §1.1) — ist
dreimal dieselbe Entscheidung mit Temperatur und Mehrheitsentscheid.

Zwei Auflagen, beide aus dem Kontingent (§3.2 dort):

- **Auf `llama-3.1-8b-instant`, nicht auf dem großen Modell.** Das 8B hat
  **14.400 statt 1.000** Requests am Tag. „Welcher dieser zwei Agenten" ist eine
  triviale Aufgabe; das große Kontingent bleibt den Antworten.
- **Nur wenn sich das rechnet.** Dreifaches Sampling verdreifacht die Requests
  an dieser Stelle. Die Rückfrage-Quote aus Sprint 250 entscheidet: bei wenigen
  Prozent ist der Aufschlag Rauschen, bei zwanzig Prozent ist er ein Viertel des
  Tagesbudgets. Ohne diese Zahl wird S257-11 **nicht** gebaut.

Ergebnis ohne Netz oder bei leerem Kontingent: die Rückfrage von heute. Die
bleibt als Boden erhalten.

## Die Latenz-Schranke: nur auf dem ambigen Pfad

Der ursprüngliche Entwurf hätte die Ähnlichkeit als Summanden zu `parserScore`
addiert — also **bei jedem Zug** ein Embedding gerechnet. Das ist gegen die
Latenz-Priorität nicht zu halten:

Heute ist der deterministische Pfad eine Handvoll regulärer Ausdrücke, also
Mikrosekunden. Ein e5-Durchlauf in `onnxruntime-web` liegt bei mehreren
Dutzend Millisekunden, plus einmalig Modell-Ladezeit. Für „Licht an" wäre das
ein Rückschritt in genau der Kategorie, die am meisten zählt — bei einem
Kurzbefehl, den die Parser schon sicher erkennen.

Deshalb die Schranke:

```text
Parser klar vorne        →  entscheiden wie heute, kein Embedding
mehrere gleich stark     →  Embedding rechnen, Reihenfolge entscheiden
kein Kandidat            →  wie heute weiter (258)
```

Das dreht die Rechnung um. Das Embedding läuft nur dort, wo Jarvis heute eine
**Rückfrage** stellt — und eine Rückfrage kostet den Nutzer mehrere Sekunden
plus einen zweiten Satz. Gegen 50 ms Embedding ist das kein Vergleich.

| Priorität | Wirkung mit Schranke |
|-----------|----------------------|
| Antwortqualität | besser, wo es heute klemmt (ambige Fälle) |
| Alles funktioniert | Rückfallebene bleibt der heutige Tisch |
| Latenz | **unverändert** auf dem schnellen Pfad, besser statt Rückfrage |
| Kostenlos / nutzbar | unverändert, das Modell läuft lokal |

Nebenwirkung, die den Ausschlag gibt: das Modell wird nur geladen, wenn zum
ersten Mal ein ambiger Fall auftritt. Wer nur Geräte schaltet, lädt es nie.

## Die Grenze, die bleibt

Das Embedding entscheidet die **Reihenfolge**, nie die **Ausführung**.
Ausgeführt wird weiter nur, was ein Parser bestätigt hat — die deterministische
Bahn bleibt unangetastet. Ein Ähnlichkeitswert kann einen Agenten nach vorne
schieben, aber keinen erfinden.

`conflicts.ts` verschwindet nicht ganz. Sicherheitsregeln bleiben von Hand:
`wont` (was Jarvis nicht tut) und die Vorfahrt von Lesen vor Gerät gehören nicht
in ein gelerntes Modell.

## Abbruchkriterium

**Trefferquote sinkt oder Rückfrage-Quote steigt** gegenüber der Baseline aus
Sprint 250. Ohne diese Messung wäre der Sprint ein Tausch gegen Ungewissheit —
deshalb ist 250 harte Voraussetzung, nicht Empfehlung.

Zweites Kriterium: das Start-Bundle wächst. Modell und Zentroide gehören hinter
einen `import()`.

Drittes: **die Latenz des schnellen Pfads steigt messbar.** „Licht an" darf nach
diesem Sprint nicht langsamer sein als vorher. `latency.ts` misst das schon
(`msFirstToken`, `latencyP95`) — die Zahl vor und nach dem Sprint gehört in die
PR.

Drittes, und es greift zuerst: **der Trennschärfe-Test aus S257-9 scheitert.**
Dann wird dieser Sprint nicht gebaut, sondern geschlossen — mit dem Messwert als
Begründung im CHANGELOG, damit die Idee nicht in einem Jahr erneut vorgeschlagen
wird.

## Tests

```bash
cd frontend
npm run eval:separability     # zuerst — hat entschieden, dass der Rest entfällt
npm run eval:report           # gegen Baseline, Differenz darf nicht negativ sein
npm run test:verb-front       # neu: Umstellung, Zahlwörter, Pro-Formen
npm run eval
npm run test:prompts
npm run test:sprint
npm run test:matrix
npm run test:agents-robust
npx tsc -b && npm run lint
```

Der entscheidende Nachweis ist die Tabelle aus `eval:report`, nicht ein grüner
Lauf. Ein grüner Lauf war schon dreimal irreführend.

Gemessen nach dem Sprint: Trefferquote 100,0 % bei 317 statt 308 Fällen (neun
Alltagssätze dazu, keiner davon verloren), ohne Kandidat 11,0 % → 10,7 %,
Entscheidungszeit p50 0,53 ms — unverändert, weil der neue Pfad nur dort läuft,
wo vorher nichts lief.

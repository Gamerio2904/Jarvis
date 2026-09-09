# Sprint 257 — Intent-Embeddings statt Konflikt-Tisch

**Version:** `16.10.0` (versionCode `161000`) — **PLAN**
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
| S257-1 | Intent-Datensatz aus dem Eval-Korpus (250+ Äußerungen) | `engine/eval/corpus.ts` | PLAN |
| S257-2 | `multilingual-e5-small` in `onnxruntime-web`, lazy | `engine/embed.ts` | PLAN |
| S257-3 | Zentroid je Agent, zur Bauzeit berechnet und mitgeliefert | `engine/intent-centroids.json` | PLAN |
| S257-4 | Ähnlichkeit als Summand zu `parserScore` | `engine/policy.ts` | PLAN |
| S257-5 | `conflicts.ts` zurückbauen auf harte Regeln (`wont`, Gerät vs. Lesen) | `engine/conflicts.ts` | PLAN |
| S257-6 | Rückfallebene: ohne Modell gilt der heutige Tisch | `engine/policy.ts` | PLAN |
| S257-7 | Eval-Vergleich gegen die Baseline aus 250 | `scripts/eval/report.mjs` | PLAN |
| S257-8 | Docs: `66-agents-ist.md` §2 neu schreiben | docs | PLAN |
| S257-9 | **Trennschärfe-Test vor allem anderen** — Abbruch, wenn er scheitert | `scripts/eval/separability.mjs` | PLAN |
| S257-10 | `query:` / `passage:` Präfixe von e5 korrekt setzen | `engine/embed.ts` | PLAN |
| S257-11 | Mehrfach-Sampling als letzte Ebene statt Rückfrage, auf dem 8B | `engine/policy.ts` | PLAN |

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

Drittes, und es greift zuerst: **der Trennschärfe-Test aus S257-9 scheitert.**
Dann wird dieser Sprint nicht gebaut, sondern geschlossen — mit dem Messwert als
Begründung im CHANGELOG, damit die Idee nicht in einem Jahr erneut vorgeschlagen
wird.

## Tests

```bash
cd frontend
npm run eval:separability     # zuerst — entscheidet, ob der Rest gebaut wird
npm run eval:report           # gegen Baseline, Differenz muss positiv sein
npm run test:prompts
npm run test:sprint
npm run test:matrix
npm run test:agents-robust
npx tsc -b && npm run lint
```

Der entscheidende Nachweis ist die Tabelle aus `eval:report`, nicht ein grüner
Lauf. Ein grüner Lauf war schon dreimal irreführend.

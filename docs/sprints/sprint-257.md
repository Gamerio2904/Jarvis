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

## Tests

```bash
cd frontend
npm run eval:report           # gegen Baseline, Differenz muss positiv sein
npm run test:prompts
npm run test:sprint
npm run test:matrix
npm run test:agents-robust
npx tsc -b && npm run lint
```

Der entscheidende Nachweis ist die Tabelle aus `eval:report`, nicht ein grüner
Lauf. Ein grüner Lauf war schon dreimal irreführend.

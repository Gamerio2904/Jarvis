# Sprint 250 — Eval-Kennzahlen: Routing wird messbar

**Version:** `16.3.0` (versionCode `160300`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §5 · Upgrade **D** aus [`67-upgrades.md`](../67-upgrades.md)
**Voraussetzung:** Sprint **249** (eine Korpus-Quelle)

## Ziel

Nach einer Router-Änderung steht in der PR eine Tabelle: Trefferquote vorher,
nachher, Differenz. Heute steht dort „grün".

## Warum

Sprint **257** ersetzt den handgestimmten Konflikt-Tisch durch gelernte
Ähnlichkeit. Ohne Messwerte ist dieser Tausch nicht bewertbar — man tauscht ein
bekanntes System gegen ein unbekanntes und merkt den Rückschritt erst, wenn sich
jemand beschwert. Genau so lief `16.0.0` → `16.1.0`.

Die Rückfrage-Quote ist die wichtigste Zahl. Der Fehler, über den sich der PO
beschwert hat, war nie ein Absturz — es war „Jarvis fragt zurück, statt zu
handeln". Das ist eine **Quote**, kein Ja/Nein.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| grün / rot | Trefferquote, Rückfrage-Quote, `none`-Quote, p95 |
| kein Vergleich zum Vorlauf | Baseline-Datei, Differenz in der Ausgabe |
| Verwechslung unsichtbar | Top-10-Verwechslungspaare als Tabelle |
| keine Gruppierung | Kennzahlen je `tag` (gold / sprint / lock / regress) |
| Prompt-Kosten unbekannt | Prompt-Tokens und Cache-Trefferquote je Zug |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S250-1 | Kennzahlen aus einem Lauf sammeln | `scripts/eval/metrics.mjs` | PLAN |
| S250-2 | Verwechslungspaare: erwartet ≠ gewählt, nach Häufigkeit | `scripts/eval/metrics.mjs` | PLAN |
| S250-3 | Baseline schreiben und lesen | `scripts/eval/baseline.json` | PLAN |
| S250-4 | Differenz-Ausgabe als Markdown-Tabelle | `scripts/eval/report.mjs` | PLAN |
| S250-5 | Laufzeit je Fall, p50 / p95 | `scripts/eval/metrics.mjs` | PLAN |
| S250-6 | Schwellen als harte Grenze im Lauf | `scripts/eval/report.mjs` | PLAN |
| S250-7 | `npm run eval:report` | `package.json` | PLAN |
| S250-8 | Docs: Kennzahlen erklärt in `66-agents-ist.md` | docs | PLAN |
| S250-9 | Prompt-Tokens zählen; `cached_tokens` aus der Antwort mitschreiben | `scripts/eval/metrics.mjs` | PLAN |
| S250-10 | Sprach-A/B: deutscher vs. englischer Anweisungsblock, gleicher Korpus | `scripts/eval/lang-ab.mjs` | PLAN |

## Kennzahlen

| Zahl | Bedeutung | Grenze |
|------|-----------|--------|
| Trefferquote | erwarteter Agent gewählt | darf nicht sinken |
| Rückfrage-Quote | `pick.kind === 'ask'` | darf nicht steigen |
| `none`-Quote | kein Kandidat über der Schwelle | darf nicht steigen |
| p95 Laufzeit | 95. Perzentil je Fall | Budget aus `44-next.md` |
| Verwechslungen | erwartet ≠ gewählt, gruppiert | Top 10 in die PR |
| Prompt-Tokens | Eingabelänge je Zug | darf nicht wachsen |
| Cache-Trefferquote | `cached_tokens` / Prompt-Tokens | soll steigen |

Die letzten zwei sind neu und hängen am Kontingent, nicht an der Qualität:
gecachte Eingabe-Tokens zählen **nicht** auf Groqs Rate-Limits an
([`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §3.2). Ein guter
Prompt-Schnitt in `prompt-split.ts` kauft also Tagesbudget. Ohne Messung merkt
niemand, wenn ein neuer Sprint etwas Wechselndes nach vorne schiebt und den
Cache entwertet.

## Sprach-A/B (S250-10)

Die PO-Frage „interne Sprache auf Englisch?" ist mit dieser Eval erstmals
beantwortbar statt verhandelbar. Die Entscheidung für **Neues** steht schon
([`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §2.2: Persona deutsch,
Maschinenseitiges englisch) — offen ist nur, ob sich sogar die Persona lohnt.

| Arm | Anweisungsblock | Persona | Beispiele |
|-----|-----------------|---------|-----------|
| A (heute) | deutsch | deutsch | deutsch |
| B | englisch | deutsch | deutsch |

Gemessen wird an vier Zahlen: Trefferquote, Rückfrage-Quote, Prompt-Tokens und
**Sprachtreue** — Anteil der Antworten ohne englischen Einschlag. Die vierte ist
die entscheidende: ein Sprachwechsel wird hier vorgelesen.

Arm B wird nur übernommen, wenn er in allen vier Zahlen mindestens gleich gut
ist. Deutsch ist eine Hochressourcen-Sprache; der erwartete Gewinn ist klein und
rechtfertigt kein Risiko an der Stimme. Beispiele bleiben in **beiden** Armen
deutsch — Beispiele in der falschen Sprache kosten 15–20 % Genauigkeit
(§2.1) und wären ein garantierter Rückschritt.

## Abbruchkriterium

Die Kennzahlen des Vorlaufs lassen sich mit demselben Stand nicht reproduzieren.
Dann misst die Eval Rauschen und taugt nicht als Netz für 257.

## Tests

```bash
cd frontend
npm run eval:report           # Tabelle gegen Baseline
npm run eval                  # Fälle einzeln
npm run eval:lang-ab          # deutscher vs. englischer Anweisungsblock
npx tsc -b && npm run lint
```

Gegenprobe: denselben Stand zweimal messen — die Zahlen müssen identisch sein.
Eine Regel in `conflicts.ts` absichtlich entfernen und prüfen, dass die
Trefferquote **sichtbar** fällt.

# Sprint 253 — Abbruch bis in die Handler

**Version:** `16.6.0` (versionCode `160600`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §8 · Upgrade **A** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein neuer Zug bricht den alten **wirklich** ab — nicht nur das Warten darauf.

## Warum

`agents/budget.ts` rennt ein `setTimeout` gegen das Ergebnis. Läuft die Zeit ab,
gewinnt der Timeout und der Aufrufer geht weiter. Der Handler läuft trotzdem:
sein `fetch` läuft, sein Ergebnis wird verworfen — und auf dem Weg dahin kann er
noch `saveSettings` schreiben. Der neue Zug erbt dann fremden Zustand.

Drei Folgen:

- **Kein Barge-in.** Wer mitten in der Antwort etwas Neues sagt, hat zwei Züge
  im Flug. Sprint **255** braucht das.
- **Akku und Datenvolumen.** Ein verwaister Feed-Abruf auf dem Handy läuft bis
  zum Ende durch, obwohl niemand das Ergebnis will.
- **Stille Nebenwirkung.** Ein verworfener Zug darf keinen Zustand mehr
  schreiben. Heute darf er.

`http-json.ts` hat bereits `abortAfter`. Es fehlt der Durchstich von oben.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| Budget schneidet das Warten ab | Budget **und** Zug-Abbruch als `AbortSignal.any` |
| Handler läuft nach dem Timeout weiter | `fetch` bricht ab, Handler endet |
| Verworfener Zug kann schreiben | Schreiben nach Abbruch wird verweigert |
| `beginAgentTurn()` zählt nur hoch | bricht zusätzlich den vorigen Zug ab |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S253-1 | `signal?: AbortSignal` in `RouteCtx` | `engine/route-types.ts` | PLAN |
| S253-2 | `AbortController` je Zug, `beginAgentTurn()` bricht den vorigen ab | `agents/trace-store.ts`, `director.ts` | PLAN |
| S253-3 | `withBudget` nimmt ein Signal und kombiniert per `AbortSignal.any` | `agents/budget.ts` | PLAN |
| S253-4 | `agentDispatch` reicht das kombinierte Signal an den Executor | `agents/bus.ts` | PLAN |
| S253-5 | `http-json.ts`: vorhandenes `abortAfter` mit dem Zug-Signal verheiraten | `engine/http-json.ts` | PLAN |
| S253-6 | Executoren durchreichen (mechanisch, ~59) | `agents/execute-map.ts` + Module | PLAN |
| S253-7 | Schreibsperre: `saveSettings` aus einem abgebrochenen Zug wird verworfen | `engine/store.ts` | PLAN |
| S253-8 | Tests | `scripts/test-agents-robust.mjs`, `test-turn-e2e.mjs` | PLAN |

## Signal-Kette

```text
runDirectorTurn
  └─ AbortController (Zug)          ← beginAgentTurn bricht den vorigen ab
       └─ agentDispatch
            └─ AbortSignal.any([zug, budget])
                 └─ Executor
                      └─ http-json → fetch({ signal })
```

`AbortSignal.any` gibt es in Node 20+ und in allen WebViews, die die App
unterstützt. Kein Polyfill nötig.

## Abbruchkriterium

Ein abgebrochener Zug schreibt weiter in den Speicher. Dann ist der Durchstich
unvollständig und richtet mehr Schaden an als er verhindert — ein halb
abgebrochener Zug ist schlechter als ein ganz durchlaufender.

## Tests

```bash
cd frontend
npm run test:agents-robust    # Signal kommt beim Handler an
npm run test:turn-e2e         # zweiter Zug bricht den ersten ab
npm run eval:report           # Trefferquote unverändert
npx tsc -b && npm run lint
```

Neu abzudecken: ein langsamer Handler bekommt `signal.aborted === true`, sein
`fetch` wird verworfen, und ein `saveSettings` daraus landet **nicht** im Store.

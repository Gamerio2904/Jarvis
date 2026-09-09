# Sprint 253 — Abbruch bis in die Handler

**Version:** `16.6.0` (versionCode `160600`) — **PLAN**, erweitert um den Barge-in-Rest aus 255
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
| S253-9 | Bestehendes Barge-in an den Controller hängen (aus 255) | `ui/VoiceMode.tsx` | PLAN |

## S253-9 — der einzige echte Rest aus Sprint 255

Barge-in ist **gebaut**: `watchBargeIn()` in `native/voice.ts` (nativ plus
Web-Fallback), in `ui/VoiceMode.tsx` an zwei Stellen verdrahtet, bricht die
Stimme über `cutIn(pipe)` ab und verwirft den Zug über `abortTurn`. Auch der
Selbstschutz ist da: `BARGE_IGNORE_TTS_MS = 400` und `isBargeInText()` filtert
„mhm" und „aha" heraus.

Was fehlt, ist genau eine Verbindung: `abortTurn` verwirft heute nur das
**Ergebnis**. Die Handler laufen weiter, holen Feeds und können danach noch
schreiben. Sobald S253-2 den Controller hat, wird `abortTurn` daran gehängt —
dann bricht Reden nicht nur die Stimme ab, sondern auch die Arbeit.

Das ist der Grund, warum Sprint 255 aufgelöst wurde: sein Barge-in-Teil ist
diese eine Zeile, und sein Satzende-Teil existiert als Regex in
`turn-detect.ts`. Details in [`sprint-255.md`](./sprint-255.md).

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

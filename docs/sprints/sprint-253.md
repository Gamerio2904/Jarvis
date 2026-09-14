# Sprint 253 — Abbruch bis in die Handler

**Version:** `16.6.0` — **CODE** (ausgeliefert in `17.0.0`), erweitert um den Barge-in-Rest aus 255
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
| S253-1 | `signal?: AbortSignal` in `RouteCtx` | `engine/route-types.ts` | CODE |
| S253-2 | `AbortController` je Zug, `beginAgentTurn()` bricht den vorigen ab | `agents/trace-store.ts`, `director.ts` | CODE |
| S253-3 | `withBudget` nimmt ein Signal und kombiniert per `AbortSignal.any` | `agents/budget.ts` | CODE |
| S253-4 | `agentDispatch` reicht das kombinierte Signal an den Executor | `agents/bus.ts` | CODE |
| S253-5 | `http-json.ts`: vorhandenes `abortAfter` mit dem Zug-Signal verheiraten | `engine/http-json.ts` | CODE |
| S253-6 | Executoren durchreichen (mechanisch, ~59) | `agents/execute-map.ts` + Module | CODE |
| S253-7 | Schreibsperre: `saveSettings` aus einem abgebrochenen Zug wird verworfen | `engine/store.ts` | CODE |
| S253-8 | Tests | `scripts/test-agents-robust.mjs`, `test-turn-e2e.mjs` | CODE |
| S253-9 | Bestehendes Barge-in an den Controller hängen (aus 255) | `ui/VoiceMode.tsx` | CODE |

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

## Ergebnis

### Umgebungszustand statt 59 Parameter

S253-6 war als „mechanisch, ~59 Executoren" geplant. So gebaut wäre es nicht
geworden: eine Kette, die durch 59 Module gereicht wird, reißt an der ersten
Stelle, die das Durchreichen vergisst — und das fällt niemandem auf, weil der
Zug ja trotzdem funktioniert.

Stattdessen hängt das Signal in `turn-abort.ts` als Zustand des laufenden
Zuges, und `http-json.ts` verheiratet es an **jeder** Fetch-Stelle mit dem
vorhandenen `abortAfter`. Jedes Modul, das `postJson` oder `getJson` benutzt,
ist damit abbrechbar, ohne eine Zeile geändert zu haben. `RouteCtx.signal`
gibt es zusätzlich, für Handler, die selbst etwas abbrechen wollen.

### Abgebrochen ist nicht gescheitert

Der neue Fehlertyp `AgentAborted` trennt zwei Dinge, die vorher gleich
aussahen. Ein Abbruch wird **nicht** wiederholt, belastet die Sicherung aus
Sprint 251 **nicht** und erzeugt **keinen** Fehlertext — der Nutzer wollte ja
etwas anderes, nichts war kaputt.

### Die Schreibsperre gilt fünf Felder, nicht allen

Ein pauschales Verbot hätte die Einstellungen ausgesperrt, sobald zuletzt ein
Zug abgebrochen wurde. Gesperrt sind deshalb genau die Felder, die nur ein
laufender Zug schreibt: `last_step_tool`, `last_step_utterance`,
`last_medium`, `last_place`, `last_agent_id`. Das sind die, über die ein
verwaister Handler dem neuen Zug seinen Nachlauf unterschiebt.

### Ein Test wäre falsch grün geworden

Beim Prüfen der Sperre fiel auf, dass `saveSettings` in Node ohne
`localStorage` den Fehler schluckt und `loadSettings` immer die Vorgaben
liefert. Die erste Fassung des Tests bestätigte die Sperre also, ohne
irgendetwas zu messen. Mit Speicher-Ersatz prüft er jetzt beide Richtungen:
gesperrt nach Abbruch, schreibbar im laufenden Zug.

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

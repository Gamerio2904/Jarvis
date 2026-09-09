# Sprint 249 — Eval-Rahmen: alle Fehler sichtbar

**Version:** `16.2.0` (versionCode `160200`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §4 · Upgrade **D** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein Testlauf zeigt **alle** Fehler, nicht nur den ersten. Die Prompt-Korpora
leben an **einer** Stelle statt in drei Testdateien.

## Warum

Beim Audit für `16.1.0` stand in `test:014` eine veraltete Assertion
(`edgeFirstTimeoutMs`). `node:assert` beendet den Prozess beim ersten Wurf —
alles danach in dieser Datei lief nie. Der Fehler war eine Zeile, die Folge war
ein blinder Fleck über eine ganze Datei.

Dieselben Prompts stehen heute mehrfach: `test-prompts.mjs` (181 Chips),
`test-sprint-prompts.mjs` und `test-650-matrix.mjs` pflegen je eigene Listen.
Ein neuer Agent muss an drei Stellen eingetragen werden, und dass die drei
auseinanderlaufen, merkt niemand.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| `node:assert` top-level, erster Wurf beendet den Lauf | `node:test`, jeder Fall ein Testfall, alle laufen |
| Korpora in drei `.mjs` getrennt | eine Quelle `src/engine/eval/corpus.ts` |
| Ausgabe „ok" / Stacktrace | TAP + Zusammenfassung, Fehler einzeln benannt |
| Doppelte Prompts unbemerkt | Dedupe-Prüfung im Korpus selbst |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S249-1 | `EvalCase` Typ: `{ text, expect, tags, source }` | `engine/eval/types.ts` | PLAN |
| S249-2 | Korpus-Quelle: Gold, Sprint, Lock zusammengeführt | `engine/eval/corpus.ts` | PLAN |
| S249-3 | Dedupe + Selbstprüfung: kein Prompt zweimal, jeder `expect` im Katalog | `engine/eval/corpus.ts` | PLAN |
| S249-4 | `node:test`-Lauf über den Korpus, ein `test()` je Fall | `scripts/eval/route.test.mjs` | PLAN |
| S249-5 | `test-prompts`, `test-sprint`, `test-650-matrix` lesen aus der Quelle | `scripts/*.mjs` | PLAN |
| S249-6 | `npm run eval` mit `--test-reporter=spec` | `package.json` | PLAN |
| S249-7 | Migrationsprüfung: alter Korpus ⊆ neuer Korpus | `scripts/eval/migrate-check.mjs` | PLAN |
| S249-8 | Docs: `66-agents-ist.md` §7, CHANGELOG | docs | PLAN |
| S249-9 | Tag `stt`: echte Verhörer aus dem Sprachmodus als Fälle | `engine/eval/corpus.ts` | PLAN |

## S249-9 — Der Korpus muss klingen wie das Mikrofon

Alle 181 Chips sind getippter Text. Im Sprachmodus kommt kein getippter Text an,
sondern das, was Whisper verstanden hat: „mach das Licht an" wird zu „mach das
Nicht an", „Lautstärke 50" zu „Lautstärke fünfzig". Ein Router, der nur auf
sauberer Eingabe grün ist, ist auf dem Gerät nicht grün.

Diese Fälle sind nicht erfunden, sie sind einsammelbar: Sprint 259 legt einen
Ring-Puffer der letzten 50 Züge an. Bis dahin genügt, was aus den PO-Meldungen
belegt ist. Der Tag `stt` bekommt eine **eigene** Trefferquote in Sprint 250 —
er wird schlechter aussehen als `gold`, und das ist die Information.

## Nebenbefund: der Korpus ist auch ein Datensatz

Jeder Fall ist ein Paar aus Äußerung und erwarteter Absicht. Genau daraus
bestehen Präferenzdaten für ein Training
([`69-modell-grundlagen.md`](../69-modell-grundlagen.md) §1.6). Jarvis wird
nichts trainieren — keine GPU, keine Strecke — aber der Korpus ist die Grundlage
für Sprint **257** und wäre die Grundlage für alles Weitere. Das ist ein Grund,
ihn sauber zu halten: `source` je Fall, damit ein Fund zurückverfolgbar bleibt.

## Korpus-Schema

```typescript
type EvalCase = {
  text: string
  /** Erwarteter Agent, oder null für „soll ans Modell fallen". */
  expect: string | null
  /** `gold` | `sprint` | `lock` | `regress` — für Kennzahlen je Gruppe. */
  tags: string[]
  /** Woher der Fall stammt, damit ein Fund zurückverfolgbar bleibt. */
  source: string
}
```

## Abbruchkriterium

`migrate-check` findet einen Prompt, der im alten Korpus stand und im neuen
fehlt. Dann ist die Zusammenführung unvollständig und der Sprint bleibt offen.

## Tests

```bash
cd frontend
npm run eval                  # neu: alle Fälle, alle Fehler
npm run test:prompts          # liest jetzt aus der Quelle
npm run test:sprint
npm run test:matrix
npx tsc -b && npm run lint
```

Gegenprobe von Hand: eine Assertion absichtlich brechen und prüfen, dass die
übrigen Fälle **trotzdem** laufen und einzeln benannt werden.

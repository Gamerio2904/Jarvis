# Sprint 251 — Sicherungsschalter + Agenten-Reste

**Version:** `16.4.0` (versionCode `160400`) — **PLAN**
**Plan:** [`68-next.md`](../68-next.md) §6 · Upgrade **H** aus [`67-upgrades.md`](../67-upgrades.md)

## Ziel

Ein dauerhaft kaputter Dienst sagt sofort ehrlich ab, statt bei jeder Frage ins
volle Budget zu laufen. Dazu die zwei Agenten-Reste aus dem Audit für `16.1.x`.

## Warum

Ohne Netz wartet der Nutzer heute bei **jeder** Frage 25 s (Lese-Budget) plus
einen Wiederholversuch, bevor irgendetwas passiert. Das Budget aus `16.1.0` hat
das Hängen begrenzt, aber nicht das Wiederholen des Aussichtslosen.

Die zwei Reste sind klein und stehen sonst ewig:

- **`identity` hat einen Parser, aber keinen Executor.** Heute fängt `chat.ts`
  die Frage vorher ab, also fällt es nicht auf. Wird dieser Weg je umgangen,
  scheitert `runAgent` stumm und die Antwort kommt vom Modell.
- **`verify` ist uneinheitlich.** Acht Module (`tv`, `home`, `pc`, `drive`,
  `app`, `doc`, `memory`, `recall`) rufen `packVerified` selbst auf, die übrigen
  nicht. Der Kommentar über `runDirectorTurn` verspricht
  „preflight → router → execute → **verify** → merge" — einen Schritt, den der
  Director nicht hat. `AgentTrace.phase` kennt `'verify'`, niemand sendet es.

## Heute vs. Ziel

| Heute | Ziel |
|-------|------|
| kaputter Dienst: jedes Mal 25 s + Retry | 3 Fehlschläge → 60 s sofortige Absage |
| `identity` ohne Executor | trivialer Executor, kein Agent ohne |
| `verify` in 8 von 60 Modulen, Director-Kommentar lügt | entweder Director-Schritt oder ehrlicher Kommentar |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S251-1 | Fehlschlag-Zähler je Agent, Rücksetzen bei Erfolg | `agents/breaker.ts` | PLAN |
| S251-2 | Halbmond: nach 60 s **ein** Versuch, dann offen oder zu | `agents/breaker.ts` | PLAN |
| S251-3 | Einhängen in `agentDispatch` vor dem Budget | `agents/bus.ts` | PLAN |
| S251-4 | Absage-Text: „… ist gerade nicht erreichbar", kein stiller Fall ans Modell für `write`/`device` | `director.ts` | PLAN |
| S251-5 | `identity`-Executor (canned, wie `chat.ts` heute antwortet) | `agents/execute-map.ts` | PLAN |
| S251-6 | `verify` entscheiden: Director-Schritt für `device`/`write`, oder Kommentar + `phase`-Typ bereinigen | `director.ts`, `agents/types.ts` | PLAN |
| S251-7 | Trace zeigt den Schalter-Zustand im Debug-Bogen | `agents/trace-store.ts` | PLAN |
| S251-8 | Tests | `scripts/test-agents-robust.mjs` | PLAN |

## Schalter-Regel

```text
zu       →  3 Fehlschläge in Folge
offen    →  sofortige Absage, 60 s
halb     →  nach 60 s genau ein Versuch
           Erfolg → Zähler auf 0, zu
           Fehler → wieder 60 s offen
```

Zwanzig Zeilen, kein Framework. Ein Erfolg löscht die Geschichte vollständig —
ein Dienst, der wieder läuft, soll nicht nachtragend behandelt werden.

## Abbruchkriterium

Der Schalter hält einen **gesunden** Agenten zurück. Das wäre schlimmer als das
Problem: lieber dreimal 25 s warten als eine Funktion, die grundlos absagt.

## Tests

```bash
cd frontend
npm run test:agents-robust    # Schalter: zu, halb, Rücksetzen
npm run test:turn-e2e         # Absage statt Modell-Fallback
npm run eval:report           # Trefferquote unverändert
npx tsc -b && npm run lint
```

Neu abzudecken: drei Fehlschläge schließen, der vierte Aufruf wartet **nicht**,
nach 60 s gibt es genau einen Versuch, ein Erfolg setzt zurück, und `identity`
ist kein Sonderfall mehr in `test:agents-robust`.

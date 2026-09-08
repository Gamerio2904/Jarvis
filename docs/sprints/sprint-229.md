# Sprint 229 — Director (`14.3.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`14.3.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

`director.ts` ersetzt `routeRegistry`-Aufruf in `chat.ts`. Turn-Flow: preflight → router → execute → verify → merge → **brain-orchestrator (ab 236)** → front. Legacy-Pfad hinter Flag.

## DoD

- [x] `chat.routeDeterministic` delegiert an Director wenn Flag an
- [x] Nur Front-Agent ruft `addMessage(assistant)`
- [x] Device/Write weiter Parser-first
- [x] `merge` liefert `userFacts` für späteren **micro-merge** Slot (63-next)
- [x] `test:prompts` 181/181 mit Flag an

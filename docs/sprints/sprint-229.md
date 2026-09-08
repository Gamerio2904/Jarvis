# Sprint 229 — Director (`14.3.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`14.3.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

`director.ts` ersetzt `routeRegistry`-Aufruf in `chat.ts`. Turn-Flow: preflight → router → execute → verify → merge → **brain-orchestrator (ab 236)** → front. Legacy-Pfad hinter Flag.

## DoD

- [ ] `chat.routeDeterministic` delegiert an Director wenn Flag an
- [ ] Nur Front-Agent ruft `addMessage(assistant)`
- [ ] Device/Write weiter Parser-first
- [ ] `merge` liefert `userFacts` für späteren **micro-merge** Slot (63-next)
- [ ] `test:prompts` 181/181 mit Flag an

# Sprint 229 — Director (`14.3.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`14.3.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

`director.ts` ersetzt `routeRegistry`-Aufruf in `chat.ts`. Turn-Flow: preflight → router → execute → verify → merge → front. Legacy-Pfad hinter Flag.

## DoD

- [ ] `chat.routeDeterministic` delegiert an Director wenn Flag an
- [ ] Nur Front-Agent ruft `addMessage(assistant)`
- [ ] Device/Write weiter Parser-first
- [ ] `test:prompts` 181/181 mit Flag an

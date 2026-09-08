# Sprint 227 — Unified Agent Catalog (`14.1.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`14.1.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

`route-pick.ts` + `registry.ts` → **eine** `agents/catalog.ts` (`AgentSpec`: parse + execute + metadata). Generator oder manuell — keine Drift mehr.

## DoD

- [ ] `AgentSpec` Types in `frontend/src/engine/agents/types.ts`
- [ ] Alle 52 Domänen in Catalog mit department/organs/sideEffect
- [ ] `route-pick` + `registry` importieren Catalog (Adapter)
- [ ] `test:prompts` grün

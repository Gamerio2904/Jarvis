# Sprint 228 — AgentBus + Runner (`14.2.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`14.2.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

In-Process Bus: `agentBus.dispatch(id, ctx)`. `AgentRunner` wrappt `handleX` → `AgentResult` + `AgentTrace`. Debug sammelt Traces.

## DoD

- [ ] `agents/bus.ts`, `agents/runner.ts`
- [ ] Traces in Debug-Export (JSON)
- [ ] Feature-Flag `agent_network_v2` (default aus)
- [ ] `test:014` grün

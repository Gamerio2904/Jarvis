# Sprint 228 — AgentBus + Runner (`14.2.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`14.2.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

In-Process Bus: `agentBus.dispatch(id, ctx)`. `AgentRunner` wrappt `handleX` → `AgentResult` + `AgentTrace`. Debug sammelt Traces.

## DoD

- [x] `agents/bus.ts`, `agents/runner.ts`
- [x] Traces in Debug-Export (JSON)
- [x] Feature-Flag `agent_network_v2` (default aus)
- [x] `test:014` grün

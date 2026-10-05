# Sprint 227 — Unified Agent Catalog (`14.1.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`14.1.0`** (Struktur; App bleibt `13.44.0` bis 14.9) |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

`route-pick.ts` + `registry.ts` → **eine** `agents/catalog.ts` (`AgentSpec`: parse + execute + metadata). Generator oder manuell — keine Drift mehr.

## DoD

- [x] `AgentSpec` Types in `frontend/src/engine/agents/types.ts`
- [x] Alle Domänen in Catalog mit department/organs/sideEffect (`meta.ts` + `parse-catalog.ts`)
- [x] `route-pick` + `registry` importieren Catalog (Adapter)
- [x] `test:prompts` grün
- [x] `test:agents.mjs` Smoke

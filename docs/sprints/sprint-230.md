# Sprint 230 — Curator-Agent (`14.4.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`14.4.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

Expliziter **Wissensmeister**: Memory-Gate, Prune, Contradiction, Pack-Harvest, Working Memory — **intern**, nie User-Reply. `brain.read` / `brain.proposeWrite` API.

## DoD

- [x] `agents/curator.ts` — ein Einstieg für alle Writes
- [x] Memory-Turn Trace: `curator → memory-agent`
- [x] Kein Verhalten-Regression (`test:memory-10-intens` grün)

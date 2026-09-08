# Sprint 230 — Curator-Agent (`14.4.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`14.4.0`** |
| Quelle | [`62-next.md`](../62-next.md) |

## Ziel

Expliziter **Wissensmeister**: Memory-Gate, Prune, Contradiction, Pack-Harvest, Working Memory — **intern**, nie User-Reply. `brain.read` / `brain.proposeWrite` API.

## DoD

- [ ] `agents/curator.ts` — ein Einstieg für alle Writes
- [ ] Memory-Turn Trace: `curator → memory-agent`
- [ ] Kein Verhalten-Regression (`test:memory-10-intens` grün)

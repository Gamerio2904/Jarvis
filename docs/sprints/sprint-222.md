# Sprint 222 — TV-Stimme (`13.41.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`13.41.0`** |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

„Fernseher an“ aus dem Mic trifft `parseTvIntent` → `handleTv` (`on` = WoL). Ohne Key/Host/MAC ehrlich Settings, kein Smalltalk dass der Fernseher an sei.

## DoD

- [ ] `TV an`, `Fernseher einschalten`, `Mach den Fernseher an` → Route `tv`
- [ ] `pickHeard` bevorzugt Alts mit TV-Anker
- [ ] `tv_enabled` aus → Settings-Satz

# Sprint 222 — TV-Stimme (`13.41.0`) **CODE** in `13.44.0`

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`13.41.0`** (geliefert in `13.44.0`) |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

„Fernseher an“ aus dem Mic trifft `parseTvIntent` → `handleTv` (`on` = WoL). Ohne Key/Host/MAC ehrlich Settings, kein Smalltalk dass der Fernseher an sei.

## DoD

- [x] `TV an`, `Fernseher einschalten`, `Mach den Fernseher an` → Route `tv`
- [x] `pickHeard` bevorzugt Alts mit TV-Anker
- [x] `tv_enabled` aus → Settings-Satz

# Sprint 189 — Memory Gate (`10.20.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (geliefert in `10.60.0`) |
| Ziel-Version | **`10.20.0`** |
| Quelle | [`56-next.md`](../56-next.md) §7 |
| Vorher | Sprint 188 |

## Ziel

Jeder Memory-Write geht durch STORE / MERGE / IGNORE / REVISE. Verify nach Observation bleibt.

## Must

| ID | Inhalt |
|----|--------|
| G1 | Eine Gate-Funktion, von Parser-Write, Pref-Harvest, Sleep-Regel benutzt |
| G2 | Identischer Pin → IGNORE (touch). Gleicher Key neuer Value → REVISE + Verify weg |
| G3 | Dump/Smalltalk/zu kurz → IGNORE. Cap 80 unverändert |

## Won’t

LLM entscheidet STORE auf jedem Turn. Heimliches Gemini-Harvest. Nudeln-gestern als Goal.

## DoD

- [x] Tests: IGNORE Dump, REVISE Döner, STORE explizites `merk` (`test:memory-10`)
- [x] SUCCESS-Satz nur nach Observation wie `7.0` (Write-Pfad unverändert über `writeMemory`)

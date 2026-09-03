# Sprint 192 — Memory-Gold Eval (`10.50.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (geliefert in `10.60.0`) |
| Ziel-Version | **`10.50.0`** |
| Quelle | [`56-next.md`](../56-next.md) §10 |
| Vorher | Sprint 191 |

## Ziel

`test:memory-10` (oder Erweiterung `test:014`) mit Gold G1–G6. Kein MTEB. False-Memory zählt.

## Must

| ID | Inhalt |
|----|--------|
| E1 | G1 Getränk, G2 WLAN-Alias, G3 Japan-Goal, G4 REVISE Döner, G5 keine Reise erfinden, G6 Dump raus |
| E2 | Recall@6 + ehrlich leer wo kein Pin |
| E3 | Rot auf G2/G3 **ohne** stilles e5 — dann Sprint 195, nicht heimlich Encoder |

## Won’t

HuggingFace-Leaderboard als DoD. 1000 synthetische Chats als Must (Could später).

## DoD

- [x] Suite lokal grün: G1–G6 ohne e5 (`npm run test:memory-10`)
- [x] Kein Sideload-Zwang

G2/G3 grün ohne Encoder → Sprint **195 bleibt FREEZE**.

# Sprint 137 — Hierarchical Memory Leitentscheidung (`7.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `7.0.0`) |
| Priorität | V5 nach V4 |
| Ziel-Version | `7.0.0` |
| Quelle | [`49-next.md`](../49-next.md), Phase-0-Audit Debt #8 |
| Plan | Industry V5 Teil 1 |

## Ziel

Gedächtnis bleibt IndexedDB. Schichten: Sensory → Working (8) → Episodic (Retrieve) → Semantic (Pins). Jeder Pin hat Quelle, Confidence, optional TTL. SUCCESS nur nach Observation.

## Must

| ID | Inhalt |
|----|--------|
| M1 | `memory-layer.ts` — Origin, Confidence, Prune, Contradiction, Verify |
| M2 | Action-Domain `memory` |
| M3 | Kein Lance, kein Embedding-Router |

## Won’t

LanceDB. Nemotron. Papers-Graph. Sleep zu Google. Bild-RAG.

## DoD

- [x] Leitentscheidung im Code, nicht nur Docs

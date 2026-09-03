# Sprint 187 — Semantisches Gedächtnis Leitentscheidung (`10.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (geliefert in `10.60.0`) |
| Ziel-Version | **`10.0.0`** |
| Quelle | [`56-next.md`](../56-next.md) |
| Vorher | Recall `7.0` CODE. Sideload `9.10.0`. PO-Gerät 178 unabhängig |

## Ziel

Leitentscheidung im Code, nicht nur Docs: Schema-Typen existieren, Retrieve bleibt das heutige Token+RRF, Embeddings nicht verdrahtet.

## Must

| ID | Inhalt |
|----|--------|
| L1 | Typen `kind` / `tense` / Memory-Gate-Union in `memory-layer.ts` (noch ohne Pflichtfelder am Store) |
| L2 | Kommentar an `applyE5Rerank` und `retrieve`: e5 nie Router; HNSW/Qdrant Won’t |
| L3 | Docs-Header `10.0` PLAN, Live-Code bleibt `9.10.0` bis Sideload-Entscheidung |

## Won’t

Qdrant. Qwen-Gewichte. HDBSCAN. Retrieve umbauen (das ist 190). Stilles Gemini-Sleep.

## DoD

- [x] Typen kompilieren, `test:014` unverändert grün
- [x] Kein neues ONNX, keine Store-Migration in diesem Sprint

Live-Code nach 187–194: **`10.60.0`**. Sideload bleibt `9.10.0`. L3 (Docs-Header PLAN) ist durch Execute überholt — Docs = Code `10.60.0`.

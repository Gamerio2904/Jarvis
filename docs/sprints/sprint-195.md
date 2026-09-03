# Sprint 195 — e5-Rerank nur nach Eval-Rot (`10.70.0`) **PLAN** Could

| Feld | Wert |
|------|------|
| Status | **PLAN** / **FREEZE** bis 192 rot auf G2/G3 |
| Ziel-Version | **`10.70.0`** |
| Quelle | [`56-next.md`](../56-next.md) §12 · [`sprint-181.md`](./sprint-181.md) · [`sprint-176.md`](./sprint-176.md) |
| Vorher | 192 schriftlich rot. Sonst diesen Sprint **nicht** ausführen |

## Ziel

Wenn Alias+Boost G2/G3 nicht retten: e5-small **nur** `applyE5Rerank` auf Top 6. Opt-in, Datei nicht in der Default-APK, nie `pickRoute`. Messung P95.

## Must (wenn Tauwetter)

| ID | Inhalt |
|----|--------|
| X1 | 192-Protokoll: welche Gold-ID rot ohne e5 |
| X2 | Datei fehlt = RRF unverändert, deutscher Grund |
| X3 | Default aus. Drive default aus. Qwen/Jina/BGE **nicht** als zweiter Encoder |

## Won’t

Encoder in der Sideload ohne Gold. e5 als Router. 0,6B Qwen3-Embedding. Training.

## DoD

- [ ] Entweder Freeze gehalten (192 grün) **oder** Messung + G2/G3 grün mit opt-in
- [ ] `pickRoute` diff leer

# Sprint 176 — Kokoro-Spike + e5-Rerank (`9.10.3`) **FREEZE** · Could

| Feld | Wert |
|------|------|
| Status | **FREEZE** (kein Bundle) |
| Ziel-Version | `9.10.3` Spike; Bundle nur bei doppeltem GO |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173–175 |
| Pflicht | **Could** — Default ist **nicht** bundeln |

## Voten

| Modell | Messung | Votum |
|--------|---------|-------|
| Kokoro-82M | nicht gegen Edge/Algieba/Piper gemessen | **NO-GO** bundeln (~82 MB) |
| e5-small | kein PO-Set mit ≥3 Keyword-RRF-Fehltreffern | **NO-GO** bundeln (~120 MB); nie Router |

`applyE5Rerank` gibt RRF unverändert zurück, solange keine Datei da ist. `pickRoute` unangetastet.

Settings: `kokoro_tts`, `e5_rerank` Default aus. Eine Extra-TTS: UI schaltet Piper/Kokoro gegenseitig aus.

## DoD

- [x] Zwei Voten NO-GO
- [x] Recall-Parser grün ohne e5

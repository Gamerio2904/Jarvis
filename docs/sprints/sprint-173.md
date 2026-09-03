# Sprint 173 — Qualität-Could Leitentscheidung (`9.10.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.10.0` |
| Quelle | [`54-next.md`](../54-next.md) · [`52-research-latency-quality.md`](../52-research-latency-quality.md) |

## Ziel

Festschreiben: Silero, Smart Turn, Piper, Kokoro, e5 sind **Could**, opt-in, nie Router, nie Default. Größenbudget. Eine Extra-TTS maximal. Drive ohne ONNX bis Auto-Messung.

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| Q1 | Tabelle GO/NO-GO aus `54-next.md` | Settings-Hinweise + `quality-pack.ts` |
| Q2 | Settings-Reiter Stimme/Hirn: Schalter, Default aus, keine Gewichte | `vad_onnx`, `piper_offline`, `kokoro_tts`, `e5_rerank` |
| Q3 | Won’t-Liste: Pipecat-Server, Whisper, Cesium, Moshi, Embeddings-Router | gehalten |
| Q4 | Parser-first unverändert | `test:014` |

## Won’t

Modelle bundeln. e5 als `pickRoute`. Kokoro und Piper gleichzeitig als Default.

## DoD

- [x] Leit nicht widersprochen
- [x] Kein APK-Delta durch Gewichte

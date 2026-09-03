# Sprint 173 — Qualität-Could Leitentscheidung (`9.10.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `9.10.0` (Docs + tote Schalter, kein Modell in der APK) |
| Quelle | [`54-next.md`](../54-next.md) · [`52-research-latency-quality.md`](../52-research-latency-quality.md) |

## Ziel

Festschreiben: Silero, Smart Turn, Piper, Kokoro, e5 sind **Could**, opt-in, nie Router, nie Default. Größenbudget. Eine Extra-TTS maximal. Drive ohne ONNX bis Auto-Messung.

## Must

| ID | Inhalt |
|----|--------|
| Q1 | Tabelle GO/NO-GO aus `54-next.md` in Settings-IA-Kommentar / Doc endgültig |
| Q2 | Settings-Reiter Stimme/Hirn: Platz für Schalter, Default aus, noch keine Gewichte |
| Q3 | Won’t-Liste: Pipecat-Server, Whisper, Cesium, Moshi, Embeddings-Router |
| Q4 | Parser-first unverändert; `test:014` grün |

## Won’t

Modelle bundeln. Sideload. e5 als `pickRoute`. Kokoro und Piper gleichzeitig als Default.

## DoD

- [ ] `54-next.md` Leit gelesen und hier nicht widersprochen
- [ ] Kein APK-Delta durch Gewichte

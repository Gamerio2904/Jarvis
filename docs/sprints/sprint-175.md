# Sprint 175 — Piper offline TTS (`9.10.2`) **FREEZE** · Could

| Feld | Wert |
|------|------|
| Status | **FREEZE** (Schalter tot ohne Datei) |
| Ziel-Version | Wunsch `9.10.2` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173 |
| Pflicht | **Could** — Skip: keine First-Audio-Messung, APK-Delta unbekannt |

## Ziel

Piper über sherpa-onnx. **Lane-1 bleibt Edge Neural vs Algieba.** Piper wäre Offline-Lane, opt-in.

## Votum

**NO-GO bundeln.** >40 MB ohne gemessenen Gewinn wäre NO-GO; ohne Messung kein Bundle. `piper_offline` merkt den Wunsch. Fehlt `/onnx/de_DE-thorsten.onnx` → Edge/Algieba.

## DoD

- [x] Freeze ohne Bundle
- [x] TTS-Pipeline ohne Piper grün (`firstBlobWins`)

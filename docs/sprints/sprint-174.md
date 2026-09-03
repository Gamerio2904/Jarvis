# Sprint 174 — Silero-VAD + Smart Turn ONNX (`9.10.1`) **FREEZE** · Could

| Feld | Wert |
|------|------|
| Status | **FREEZE** (Schalter tot ohne Datei) |
| Ziel-Version | Wunsch `9.10.1`; Default-Lane bleibt `9.9.2`/`9.10.0` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173 |
| Pflicht | **Could** — Skip, Größe/Echo/keine Messung |

## Ziel

Nach kurzer Stille: Silero plus Smart Turn. Fertiger Satz → Endpoint ~200 ms. „und …“ → ~800 ms. **Ohne ONNX-Dateien bleibt der Loop CODE** (`turn-detect.ts` 220/800).

## Votum

**NO-GO bundeln.** Keine Endpunkt-Messung mit Modell, keine ~10 MB in der APK. Settings `vad_onnx` merkt den Wunsch. Fehlt `/onnx/silero_vad.onnx` + `smart_turn_v3.onnx` → ehrlicher Satz, Energie-VAD bleibt.

## Must

| ID | Inhalt | Stand |
|----|--------|-------|
| V1 | ONNX nur nach Silero-Ende | ungebündelt |
| V3 | Settings opt-in. Drive default aus | **CODE**, Default aus |
| V5 | kein Python, kein Pipecat-Server | gehalten |

## DoD

- [x] NO-GO und Dateien nicht in der APK
- [x] Turn-Detect-Loop (ohne ONNX) grün

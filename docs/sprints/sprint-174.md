# Sprint 174 — Silero-VAD + Smart Turn ONNX (`9.10.1`) **PLAN** · Could

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `9.10.1` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173 |
| Pflicht | **Could** — Skip erlaubt, wenn Größe/Echo NO-GO |

## Ziel

Nach kurzer Stille: Silero (~2 MB) plus Smart Turn v3 (~8 MB int8). Fertiger Satz → Endpoint ~200 ms. „und …“ → ~800 ms. Läuft **nicht** dauernd. Default aus. Energie-VAD bleibt Fallback.

## Must (wenn Execute)

| ID | Inhalt |
|----|--------|
| V1 | ONNX nur nach Silero-Ende, nicht auf jedem Frame |
| V2 | Deutsch in den 23 Sprachen von Smart Turn v3 reicht für Siezen-Sätze |
| V3 | Settings opt-in. Drive default aus |
| V4 | False-Barge nicht schlimmer als heute (PO-Satz im Auto) |
| V5 | WASM oder JNI — kein Python, kein Pipecat-Server |

## Won’t

Pipecat-Runtime. Whisper-STT. Dauer-Upload der Welle. Moshi.

## DoD

- [ ] Spike: Endpunkt-ms mit/ohne Modell, False-Stop-Zähler
- [ ] GO bundeln opt-in **oder** NO-GO und Dateien nicht in der APK
- [ ] `test:014` Turn-Detect-Loop (ohne ONNX) grün

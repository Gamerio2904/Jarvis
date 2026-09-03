# Sprint 181 — Could-ONNX Freeze bleibt **FREEZE**

| Feld | Wert |
|------|------|
| Status | **FREEZE** |
| Ziel-Version | Wunsch `9.10.1`–`9.10.3`; Default-Lane bleibt `9.10.0` |
| Quelle | [`55-next.md`](../55-next.md) · [`sprint-174.md`](./sprint-174.md)–[`sprint-176.md`](./sprint-176.md) |
| Vorher | 173 Leit CODE. 174–176 Freeze. Keine Gewichte in der APK |

## Ziel

Nicht auftauen, bis eine Messung auf dem Gerät TTFT / First-Audio / P95 gegen Energie-VAD + Edge/Algieba gewinnt. e5 nie Router.

## Must (wenn Tauwetter)

Messung, opt-in, Datei vorhanden, Default aus, Drive default aus. Sonst Freeze halten.

## Won’t

ONNX in die Sideload-APK ohne Gold. e5 als `pickRoute`. Piper als Lane-1.

## DoD

- [x] Schalter tot + ehrlicher Grund (schon 173–177)
- [ ] Messung vor jedem Tauwetter

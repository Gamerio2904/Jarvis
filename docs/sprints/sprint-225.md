# Sprint 225 — Mund flüssig + Gold (`13.44.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`13.44.0`** |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

Vorlesen ohne Ruckeln: eine TTS-Lane (Edge vs Algieba), Sentence-Tap in Folge, kein Lane-Wechsel mitten im Satz. Gold S1–S7. Sideload `13.44.0`.

## DoD

- [x] Standing: Edge-First bleibt, Algieba nur wenn sie gewinnt — eine Lane pro Antwort
- [x] `test:014` + `test:prompts` grün
- [x] Sideload-Docs auf `13.44.0` wenn APK gebaut

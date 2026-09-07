# Sprint 225 — Mund flüssig + Gold (`13.44.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`13.44.0`** |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

Vorlesen ohne Ruckeln: eine TTS-Lane (Edge vs Algieba), Sentence-Tap in Folge, kein Lane-Wechsel mitten im Satz. Gold S1–S7. Sideload `13.44.0` nach Execute.

## DoD

- [ ] Standing: Edge-First bleibt, Algieba nur wenn sie gewinnt — eine Lane pro Antwort
- [ ] `test:014` + `test:prompts` grün
- [ ] Sideload-Docs auf `13.44.0` wenn APK gebaut

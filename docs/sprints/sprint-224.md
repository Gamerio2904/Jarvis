# Sprint 224 — Antworten + Tempo (`13.43.0`) **CODE** in `13.44.0`

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`13.43.0`** (geliefert in `13.44.0`) |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

Sprachmodus-Antworten: 1–2 ganze Sätze, Tool-Ergebnis zuerst. Schneller First-Token: Gerät nicht hinter Gemini-Smalltalk. `VOICE_HINT` härten, 240 Tokens bleiben Deckel.

## DoD

- [x] TV/Timer/Spotify im Voice: Parser-Reply, kein Essay
- [x] First-Token/First-Audio gemessen (`latency.ts`), Standing ohne Pico
- [x] Kein Markdown im Mund (`spokenForGemini`)

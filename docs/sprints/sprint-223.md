# Sprint 223 — Hören + Autokorrektur (`13.42.0`) **CODE** in `13.44.0`

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`13.42.0`** (geliefert in `13.44.0`) |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

STT-Tippfehler werden Wörterbuch + Alt-Wahl, nicht „nochmal sagen“. Native bleibt 8 Alts. Repair über `fernseheren` hinaus (Phonetik Fernseher/TV).

## DoD

- [x] `repairSpeech` kennt weitere TV-Formen (`fanseher`, `t v an`, …)
- [x] Gold S1/S4 in `test-014`
- [x] Kein Whisper

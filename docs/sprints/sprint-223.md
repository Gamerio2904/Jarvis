# Sprint 223 — Hören + Autokorrektur (`13.42.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`13.42.0`** |
| Quelle | [`61-next.md`](../61-next.md) |

## Ziel

STT-Tippfehler werden Wörterbuch + Alt-Wahl, nicht „nochmal sagen“. Native bleibt 8 Alts. Repair über `fernseheren` hinaus (Phonetik Fernseher/TV).

## DoD

- [ ] `repairSpeech` kennt weitere TV-Formen (`fanseher`, `t v an`, …)
- [ ] Gold S1/S4 in `test-014`
- [ ] Kein Whisper

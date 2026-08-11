# Sprint 03 — Qualität & Robustheit

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.2.0`** |

## Geliefert

### Restfixes R1–R8
- [x] R1 OWNED (+ generische First-Token-Injects) im Guard
- [x] R2 Degenerate („Bin kaputt“, „.“) → Retry/Refusal
- [x] R3 Duzen-Retry (hart refuse nur noch Inject/Collapse/Degenerate)
- [x] R4 Boilerplate/KI-Confession-Regex + Persona-Hinweis
- [x] R5 Min-Nonsense-Guard
- [x] R6 CJK/Nicht-Deutsch → Retry
- [x] R7 Sticky-Phrase-Detection
- [x] R8 Health-Warning + UI-Fallback-Banner

### I1–I6
- [x] I1 UI-Fehler + Retry-Button + Fallback-Warnung
- [x] I2 SSE-Streaming (`/chat/stream`)
- [x] I3 härtere Injection-Guards
- [x] I4 `scripts/eval_0_2_0.py`
- [x] I5 Chat löschen (API + UI)
- [x] I6 Sampling feiner (`repeat_penalty` 1.18, temp 0.72)

## Abnahme
```bash
python scripts/eval_0_2_0.py
```
Ideal auf `qwen2.5:7b`. Nach PO-OK: Tag **`v0.2.0`**.

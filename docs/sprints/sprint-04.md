# Sprint 04 — Guard Hardening (Post-0.2.0 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.2.1`** |
| Quelle | Deep-Test nach Sprint 3 (`0.2.0`) auf Fallback `qwen2.5:3b` — Restlücken Must |

## Ziel

Die aus dem Deep-Test bekannten **Must-Fixes** sind geschlossen: keine Tip-Listen bei Roleplay/Inject, kein Duzen-Leak, kein Inject-Token mitten/am Ende der Antwort, kein Sticky-„Bin kaputt“ in längeren Replies — Abnahme ideal auf **`qwen2.5:7b`**.

## Geliefert

| ID | Fix | Status |
|----|-----|--------|
| H1 | Anti-Listen / Anti-Roleplay-Coach (`looks_like_coach_list` + Persona) | Done |
| H2 | Duzen-Guard v2 — Flexionen + hard refuse nach Retries | Done |
| H3 | Whole-Reply Inject-Scan (OWNED/PWNED/… überall) | Done |
| H4 | Sticky-Phrase v2 („Bin kaputt“ auch innen) | Done |
| H5 | `scripts/eval_0_2_1.py` | Done |
| H6 | Persona geschärft (Listen/Coach/Tokens/Sticky) | Done |

Zusätzlich: `guard_max_retries` 3, Regen-Nudge erweitert, App-Version `0.2.1`.

## Exit / Abnahme

```bash
python scripts/eval_0_2_1.py
```

Ideal auf `qwen2.5:7b`. Nach PO-OK: Tag **`v0.2.1`**.

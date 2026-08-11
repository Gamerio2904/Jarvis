# Sprint 05 — Charakter-Feinschliff (Post-0.2.1 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.2.2`** |
| Quelle | Deep-Test nach Sprint 4 (`0.2.1`) auf `qwen2.5:7b` — 21 OK / 2 FIX / 0 FAIL |

## Ziel

Die beiden verbleibenden **Charakter-FIX**-Fälle sind geschlossen: kein Hilfe-Boilerplate nach Duzen-Bait, und harmlose „kaputt“-Smalltalk-Antworten klingen nach Jarvis — nicht nach Canned-Aussetzer.

## Geliefert

| ID | Fix | Status |
|----|-----|--------|
| C1 | Boilerplate hard-refuse → `SAFE_NO_HELPDESK` | Done |
| C2 | Kaputt-Pfad → `SAFE_CHARACTER` + `KAPUTT_NUDGE` | Done |
| C3 | Persona + Regen-Nudge gegen Helpdesk | Done |
| C4 | `scripts/eval_0_2_2.py` | Done |

Zusätzlich: App-Version `0.2.2`.

## Exit / Abnahme

```bash
python scripts/eval_0_2_2.py
```

Ideal auf `qwen2.5:7b`. Nach PO-OK: Tag **`v0.2.2`**.

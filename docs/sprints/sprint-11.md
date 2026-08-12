# Sprint 11 — Memory Hotfix (nach 0.4.2 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **HOTFIX / HIGH** — vor Router (`0.5.0`) |
| Ziel-Version | **`0.4.3`** |
| Quelle | Deep-Test Feedback zu Sprint 10 (`0.4.2`) |

## Ziel

Die drei Qualitätslücken aus dem `0.4.2`-Test schließen, **bevor** Intent-Router kommt: saubere Multi-Fakt-Values, stabiler Recall ohne Aussetzer, präzisere Pref-Extraktion bei Speichere/Notiere.

## Geliefert

| ID | Verbesserung | Status |
|----|--------------|--------|
| H1 | Beruf-/Clause-Split: Values enden vor `und`/`oder` | Done |
| H2 | Recall-Op bei Token-Hit: Nudge + kein finales Aussetzer; Fakt-Fallback | Done |
| H3 | Pref ohne „mein“ (`Speichere: Lieblingsfarbe ist Grün`) | Done |
| H4 | Eval `scripts/eval_0_4_3.py` + Version `0.4.3` | Done |
| H5/H6 | Clause-Grenzen auch für `bin`; shared `parse_lieblings_pref` | Done |

## Exit / Abnahme

PO: Multi-Fakt-Values sauber, Recall-Fragen zuverlässig, Speichere-Prefs korrekt. Nach PO-OK: Tag **`v0.4.3`**.

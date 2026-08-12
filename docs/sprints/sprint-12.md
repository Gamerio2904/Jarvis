# Sprint 12 — Intent-Router, Model-Routing & Scores

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.5.0`** |
| Quelle | [`10-intelligence-capabilities.md`](../10-intelligence-capabilities.md) §§ 4–6 |

## Ziel

Jarvis wählt **bewusst Policy und Modell** je nach Turn und wird über **Persona-/Quality-Scores** regressionssicher.  
**Memory-Intent:** merk / recall / forget / clarify sauber trennen, eigene Reply-Policy (**kein Helpdesk-Fallback**).

## Geliefert

| ID | Story | Status |
|----|-------|--------|
| I1 | Intent-Router v1 (`smalltalk`/`memory`/`inject`/`task`/`helpdesk_trap`/`research`/`settings`) | Done |
| I1b | Memory-Subklassen `write`/`recall`/`forget`/`clarify` | Done |
| I1c | Reply-Policy Memory (Nudges, kein Helpdesk-Final) | Done |
| I1d | Contradiction → `clarify` + Upsert + Rückfrage | Done |
| I2 | Policy-Map (Nudge/Sampling/Länge) | Done |
| I3 | Model-Routing `auto`/`always_default`/`always_heavy` | Done |
| I4 | Scorecard `scripts/scorecard_0_5_0.py` | Done |
| I5 | Baseline-Gate in Scorecard | Done |
| I6 | Version `0.5.0` + Eval `scripts/eval_0_5_0.py` | Done |
| I7 | Route-Debug in Chat-Meta (`route`) | Done |

## Exit

PO: Memory-Turns klar getrennt, keine Helpdesk-Fallbacks dort, Widersprüche ersetzt+nachgefragt, Eval grün. Nach PO-OK: Tag **`v0.5.0`**.

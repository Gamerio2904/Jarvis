# Sprint 10 — Memory Polish (nach 0.4.1)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.4.2`** |
| Quelle | Deep-Test / Verbesserungsbedarf zu Sprint 8 (`0.4.0`); setzt `0.4.1` voraus |

## Ziel

Gedächtnis **präziser und steuerbarer**: bessere Extraktion, Soft-Harvest mit TTL/Confidence, sauberer Retrieve, Summary-Timing, UI-Filter.

## Geliefert

| ID | Verbesserung | Status |
|----|--------------|--------|
| P1 | Natürliche Merk-Phrasen (kann/könntest/speichere/bitte merken) | Done |
| P2 | Multi-Fakt-Split (Name/Wohnort/Hund/Beruf …) | Done |
| P3 | Value-Normalisierung + Widerspruch „nicht X, sondern Y“ | Done |
| P4 | Retrieve ohne Ambient-Leak (`memory_ambient_fallback: false`) | Done |
| P5 | Summary nach Assistant-Write + DE-only Guard | Done |
| P6 | `max_context_messages` als Cap mit `context_last_k` | Done |
| P7 | Soft-Harvest: niedrige Confidence + `expires_at` TTL | Done |
| P8 | UI-Kategorie-Filter + „unsicher“-Markierung | Done |
| P9 | Eval `scripts/eval_0_4_2.py` + Version `0.4.2` | Done |

## Exit / Abnahme

PO: Recall präziser, Soft-Harvest nicht spammy, UI filterbar. Nach PO-OK: Tag **`v0.4.2`**.  
Follow-up Deep-Test → Sprint 11 / **`0.4.3`** (Hotfix).

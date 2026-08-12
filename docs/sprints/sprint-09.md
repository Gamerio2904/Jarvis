# Sprint 09 — Memory Must-Fixes (nach 0.4.0-Deep-Test)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.4.1`** |
| Quelle | Deep-Test / PO-Feedback zu Sprint 8 (`0.4.0`) |

## Ziel

Gedächtnis **vertrauenswürdig**: keine falschen Merk-Bestätigungen, keine Guard-Aussetzer bei Memory-Turns, „Vergiss alles“ wie erwartet.

## Geliefert

| ID | Fix | Status |
|----|-----|--------|
| M1 | **False-Confirm** — natürliche Merk-Phrasen speichern; sonst klare Ablehnung, nie Behaupten ohne Write | Done |
| M2 | **Guard/Aussetzer bei Memory-Turns** — Memory-sichere Fallbacks statt Helpdesk/Aussetzer | Done |
| M3 | **„Vergiss alles“** → Full Wipe (`clear_all_memory`) | Done |
| M4 | Eval `scripts/eval_0_4_1.py` | Done |
| M5 | Version `0.4.1` | Done |
| M6 | Ack-Nudge / kurze Bestätigung nach Write | Done |
| M7 | Guard: Boilerplate auf Memory-Write → `SAFE_MEMORY_ACK`, nicht Helpdesk | Done |

## Won’t

- Parser-Feinschliff / Multi-Fakt-Split / UI-Filter / TTL (→ Sprint 10 / `0.4.2`)
- Memory-Intent-Router (→ Sprint 12 / `0.5.0`)
- Memory Hotfix Split/Recall (→ Sprint 11 / `0.4.3`)

## Abhängigkeiten

- `0.4.0` Gedächtnis v1 (Sprint 8)

## Exit / Abnahme

PO: Merk/Vergiss fühlt sich ehrlich an; keine Aussetzer-Serie nach Memory. Nach PO-OK: Tag **`v0.4.1`**.

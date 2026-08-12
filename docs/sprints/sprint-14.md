# Sprint 14 — Router Polish (Should, nach Hotfix)

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Priorität | **SHOULD** — nicht blocker für Research; empfohlen vor Delight |
| Ziel-Version | **`0.5.2`** |
| Quelle | Deep-Test Feedback zu Sprint 12 (`0.5.0`); setzt Hotfix `0.5.1` voraus |

## Ziel

Nicht-zwingende Verbesserungen am Router-/Score-Stack: bessere Intent-Abdeckung, ehrliches Model-Routing, Live-Scorecard, kleine Persona-Politur.

## Should (Lieferumfang dieses Sprints)

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| S1 | **Router-Patterns erweitern** — u.a. `mach mir einen Plan`, Capability-Bait (*Was kannst du alles…*) → `task` / `helpdesk_trap` | Extra-Gold ≥5 neue Cases grün |
| S2 | **Model-Routing ehrlich** — `model_heavy` dokumentiert/optional anders; Health zeigt klar, wenn Heavy = Default (kein Fake-Routing) | Health/Meta: `heavy_equals_default` oder separates Heavy falls installiert |
| S3 | **Live-Scorecard** — mind. Inject-EN, Task-False-Positive, Memory-Recall als Must-Fail-Dimensionen | `scorecard_0_5_2.py` (oder Erweiterung) failt bei Regression |
| S4 | **Persona-Kleinkram** — Smalltalk ohne EN-Leak; Clarify ohne Emoji-Pflicht; Recall ohne Helpdesk-Nachsatz | Eval-Cases / Regex-Guards |
| S5 | Eval `scripts/eval_0_5_2.py` + Version `0.5.2` | Suite grün; Health/UI `v0.5.2` |

## Won’t

- Hotfix-Blocker (liegen in Sprint 13 / `0.5.1`)
- Research-Pipeline (→ Sprint 15 / `0.6.0`)
- Delight/Settings-Overhaul (→ Sprint 16 / `0.7.0`)

## Abhängigkeiten

- Sprint 13 / `0.5.1` empfohlen (sonst doppelte Guard-Arbeit)
- Kann entfallen/verschoben werden, wenn PO Research priorisiert — dann als `0.5.2` nachziehen

## Exit / Abnahme

PO: Router robuster außerhalb Gold-Set; Scorecard misst Live-Risiken; Routing nicht irreführend. Tag **`v0.5.2`** (optional vor Research).

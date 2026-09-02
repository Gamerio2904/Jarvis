# Sprint 148 — Action-FSM (`6.97.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `6.99.0`) |
| Priorität | V3 nach V2 |
| Ziel-Version | `6.97.0` |
| Quelle | Phase-0-Audit V3, Industry DoD „kein Erfolgssatz ohne Observation“ |
| Plan | Industry V3 Teil 1 |

## Ziel

Jede gerätewirksame Aktion läuft `INTENT → PLANNER → PRECONDITIONS → EXECUTION → OBSERVATION → VERIFICATION → STATE → RESPONSE`. SUCCESS nur mit Observation und verify.ok. Gilt für TV, PC, App, Navi, Home.

## Must

| ID | Inhalt |
|----|--------|
| G1 | `action-fsm.ts` — Phasen `planned/running/waiting/verifying/success/failed/cancelled` |
| G2 | `packVerified` setzt `tool_status` aus der Phase; SUCCESS-Reply nur nach verify |
| G3 | TV/PC/App/Home packen Observation (native ok, PC `ok`, Overlay-Action, Reminder gespeichert) |
| G4 | Verify ohne Observation → `failed` |

## Won’t

WebRTC. Device-Registry V6. PC-Beta V7. Fake-DOM-Klicks.

## DoD

- [x] SUCCESS ohne Observation ist unmöglich
- [x] `test:014` grün

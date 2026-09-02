# Sprint 149 — Navi Replace verifiziert (`6.98.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `6.99.0`) |
| Priorität | V3 nach Action-FSM |
| Ziel-Version | `6.98.0` |
| Quelle | Phase-0-Audit S10, Navi-FSM |
| Plan | Industry V3 Teil 2 |

## Ziel

`IDLE → CALCULATING → ACTIVE_ROUTE → REPLACING_ROUTE → VERIFYING → ACTIVE_ROUTE`. „Route aktualisiert“ nur wenn Ziel gewechselt, GPS da, `rideOk`, Minuten und Strecke stimmen. Sonst ehrlich: Ziel liegt, Strecke fehlt. LLM darf keine Navi-Lüge (`sofort neu`) durch `scrubReply` bringen.

## Must

| ID | Inhalt |
|----|--------|
| H1 | `navi-fsm.ts` — Phasen plus `naviRouteVerified` |
| H2 | `startRoute` packt Observation; SUCCESS-Satz nur nach verify |
| H3 | Replace: neues Ziel ≠ altes, sonst Failed |
| H4 | `tool_status error` wenn Strecke oder GPS fehlt |
| H5 | `scrubReply` fängt „Die Route berechne ich sofort neu“ |

## Won’t

Google Maps. CarPlay. Live-Traffic.

## DoD

- [x] Failed-Observation liefert nicht den Erfolgssatz
- [x] `test:014` grün

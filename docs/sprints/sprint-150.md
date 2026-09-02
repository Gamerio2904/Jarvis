# Sprint 150 — Research-Pending hart (`6.99.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | V3 Abschluss |
| Ziel-Version | `6.99.0` |
| Quelle | Phase-0-Audit S5–S6, „Sources oder ehrlich kein Treffer“ |
| Plan | Industry V3 Teil 3 |

## Ziel

`ja bitte` nach Such-Angebot ist ein Pending mit TTL, nicht nur last_step-Rewrite. Die gemerkte Frage wird gesucht (auch wenn der User „ja bitte“ gesagt hat). Ohne Quellen: `RESEARCH_EMPTY`, kein Halluzinations-Stumpf. `nein` bricht ab. Nach erfolgreicher Suche wiederholt `ja bitte` die Suche nicht (`nochmal` bleibt).

## Must

| ID | Inhalt |
|----|--------|
| I1 | `research-pending.ts` — WAITING, TTL 10 min, Accept/Decline |
| I2 | Persist `last_research_json`; Offer bei Search-off, Truncation, Refusal |
| I3 | Accept setzt die Ursprungsfrage als Such-Ask (`wantSearch`) |
| I4 | Keine Quellen → `RESEARCH_EMPTY` + `tool_status error` |
| I5 | Completed `research` frisst `ja bitte` nicht; TV-Confirm bleibt TV |
| I6 | Version `6.99.0` |

## Won’t

Memory-Graph. Everyday-Execute. Attachments V4.

## DoD

- [x] `ja bitte` nach Offer schreibt die Ursprungsfrage zurück
- [x] Abgelaufenes Pending bindet nicht
- [x] `test:014` grün
- [x] Typecheck grün

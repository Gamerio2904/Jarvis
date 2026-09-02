# Sprint 156 — Ehrliche Launch-Sätze (`9.1.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.1.0` |
| Quelle | V3-Regel: kein Erfolg ohne Observation |
| Plan | Industry V6 Teil 3 |

## Ziel

Erfolgssatz: „Start angekommen am … Den Schirm sehe ich nicht.“ `scrubReply` fängt „Netflix ist offen“. Version `9.1.0`.

## Must

| ID | Inhalt |
|----|--------|
| H1 | watchReply ohne „ist offen“ |
| H2 | `scrubReply` FAKE_TV_OPEN |
| H3 | Version `9.1.0` |

## Won’t

PC-Beta V7. WebRTC V8.

## DoD

- [x] `test:014` grün
- [x] Typecheck grün

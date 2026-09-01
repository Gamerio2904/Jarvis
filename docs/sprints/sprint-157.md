# Sprint 157 — PC Capability-Levels (`9.2.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.2.0`) |
| Priorität | V7 nach V6 |
| Ziel-Version | `9.2.0` |
| Quelle | Phase-0-Audit Debt #11, Industry V7 |
| Plan | Industry V7 Teil 1 |

## Ziel

Der Agent sagt, was er kann (`offline` → `status` → `screen` → `input` → `files` → `ground`). Ohne Fähigkeit kein Start, kein Klick, kein Ordner.

## Must

| ID | Inhalt |
|----|--------|
| C1 | `pc-cap.ts` — `parsePcCaps`, `pcCan`, Stufen |
| C2 | `/v1/status` wirbt `capabilities` (BAT + Stub) |
| C3 | Kein WebRTC |

## Won’t

WebRTC. Fake-DOM. Schirm-Beweis aus JPEG. SmartThings. Memory-Graph.

## DoD

- [x] Offline startet nichts
- [x] `input` ohne `ground`

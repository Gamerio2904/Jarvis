# Sprint 159 — Verify PC-Aktionen (`9.2.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.2.0` |
| Quelle | V3-Regel: kein Erfolg ohne Observation |
| Plan | Industry V7 Teil 3 |

## Ziel

Launch nur mit `started`/`name`/`pid`. Klick-SUCCESS heißt „gesendet“, nicht „ausgeführt“. JPEG beweist den Zug nicht. Agent down bleibt ehrlich. Version `9.2.0`.

## Must

| ID | Inhalt |
|----|--------|
| V1 | `pcActionVerified` — leer/offline failed |
| V2 | Launch ohne Beweis failed; Satz „Startbefehl angekommen“ |
| V3 | Klick ohne „ausgeführt“; `scrubReply` fängt die Lüge |
| V4 | Version `9.2.0` |

## Won’t

WebRTC V8. Hardening V9. Fake-Schirm aus JPEG.

## DoD

- [x] `test:014` grün
- [x] Typecheck grün

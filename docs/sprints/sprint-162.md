# Sprint 162 — Verify Live-Stream (`9.3.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | `9.3.0` |
| Quelle | V3-Regel: kein Erfolg ohne Observation |
| Plan | Industry V8 Teil 3 |

## Ziel

„Live-Bild läuft (WebRTC)“ nur mit `connected` + `track`. LAN-JPEG sagt das ehrlich. `scrubReply` fängt „WebRTC ist verbunden“. Version `9.3.0`.

## Must

| ID | Inhalt |
|----|--------|
| V1 | `rtcStreamVerified` — ready ohne Track = failed |
| V2 | LAN-JPEG + Frame = SUCCESS mit ehrlichem Satz |
| V3 | Relay/TURN abgelehnt |
| V4 | Version `9.3.0` |

## Won’t

Hardening V9. Fake-Peer aus JPEG.

## DoD

- [x] `test:014` grün
- [x] Typecheck grün

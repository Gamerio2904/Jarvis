# Sprint 160 — PC WebRTC-Signaling (`9.3.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.3.0`) |
| Priorität | V8 nach V7 |
| Ziel-Version | `9.3.0` |
| Quelle | Phase-0-Audit V8, Industry V8 |
| Plan | Industry V8 Teil 1 |

## Ziel

Signaling über das vorhandene LAN-Token (`/v1/webrtc`). Capability `stream`. Kein TURN, kein Cloud-Signaling.

## Must

| ID | Inhalt |
|----|--------|
| S1 | `pc-rtc.ts` — Session, SDP/ICE-Host, Verify |
| S2 | Agent wirbt `stream`, `webrtc: off` ohne Peer |
| S3 | Parser `PC live` / `Live aus` |

## Won’t

TURN. Öffentliches STUN. Fake-Peer. Hardening V9.

## DoD

- [x] Offer ohne Peer → LAN-JPEG, nicht „WebRTC bereit“

# Sprint 164 — Security hart (`9.9.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.9.0`) |
| Priorität | V9 zuletzt |
| Ziel-Version | `9.9.0` |
| Quelle | Industry V9 Teil 2 |

## Ziel

PC nur LAN (192.168/10, localhost für Dev). 172/WSL und Internet-IPs abgelehnt. Keys und Token nicht im Chat. Felder als Passwort.

## Must

| ID | Inhalt |
|----|--------|
| S1 | `isAllowedPcHost` |
| S2 | `redactSecrets` in `scrubReply` |
| S3 | Settings-Felder `type=password` |

## Won’t

Cloud-Auth. TURN. Token ins Backup streichen (Hausstand braucht Keys).

## DoD

- [x] `172.28.0.1` false, `192.168.1.10` true
- [x] `AIza…` wird zu `…`

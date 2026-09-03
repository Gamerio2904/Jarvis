# Sprint 211 — Presence-Token + QR (`12.20.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`12.20.0`** |
| Quelle | [`59-next.md`](../59-next.md) |
| Vorher | PC-Token-Muster `pc-host.ts` / BAT |

## Ziel

Zwei Geräte im selben privaten WLAN können sich **absichtlich** koppeln. Ohne Token kein Schreibzugriff.

## Must

| ID | Inhalt |
|----|--------|
| P1 | Presence-Token erzeugen / rotieren (wie PC-Token, eigenes Feld) |
| P2 | QR + Klartext-IP für das Hirn-Gerät (WLAN `192.168`/`10`, nicht `172`) |
| P3 | Fenster-Gerät: IP + Token eintragen, Test-Ping |
| P4 | Guard: keine Public-IPs, kein WAN |
| P5 | Schalter Default **aus** |

## Won’t

Cloud-Relay. mDNS ins Internet. Account.

## DoD

- [ ] Test ohne Token → abgelehnt (Unit am Guard)
- [ ] PC-Token und Presence-Token nicht vertauschen

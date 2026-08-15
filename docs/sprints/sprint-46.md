# Sprint 46 — WLAN-Steckdosen lokal (`0.14.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** — PO: PC, Bildschirm, LEDs über Jarvis |
| Ziel-Version | **`0.14.0`** |
| Quelle | PO 2026-08-15: drei WLAN-Steckdosen, nicht Alexa |

## Ziel

Drei benannte Steckdosen **lokal im LAN** schalten: **PC**, **Bildschirm**, **LEDs**. Handy und Dosen im gleichen WLAN. Confirm vor dem Schalten. Keine Amazon-/Tuya-Cloud.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| P1 | Settings: Toggle + IP + Protokoll je Dose (Tasmota / Shelly / Shelly RPC) | PO trägt drei IPs ein |
| P2 | Chat: „PC an“, „Bildschirm aus“, „LEDs an“, „alles aus“, „Steckdosen“ | Confirm Ja/Nein, dann HTTP |
| P3 | Test-Button pro Dose | erreichbar ja/nein, ehrlicher Fehler |
| P4 | Host-Allowlist (nur IP/Hostname, kein URL-Injection) | Smoke |
| P5 | `/hilfe` nennt Steckdosen | Text aktuell |
| P6 | Version `0.14.0` | Changelog + UI |

## Won’t

- Tuya/Smart Life Cloud
- Alexa / Echo Show
- Strommessung, Zeitpläne, Gruppen außer „alles“
- Fernseher (bleibt geparkt)

## Hinweis Hardware

Billig-Dosen mit Tuya-App brauchen **Tasmota oder ESPHome** (oder Shelly). Sonst kein lokales HTTP.

## Exit

Sideload `0.14.0`, IPs setzen, „PC an“ → Ja → Dose schaltet. Handy im gleichen WLAN.

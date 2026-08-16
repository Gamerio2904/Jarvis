# Sprint 81 — Deckenventilator (`1.29.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** |
| Ziel-Version | **`1.29.0`** |
| Quelle | PO 2026-08-16 · [`23-next.md`](../23-next.md) |
| Voraussetzung | Sideload `1.28.2`; **Q40** (Brücke/Fernbedienung) oder Default Broadlink RM4 Pro |

## Ziel

Ein Deckenventilator im Wohnzimmer: über eine **LAN-Brücke** an/aus, Stufe 1–3 und Licht — per Chat und Sprache, lokal auf dem Handy.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| F1 | Broadlink lokal (UDP), Codes auf dem Gerät | Kein Cloud-Konto |
| F2 | Settings → Haus: IP, lernen, testen, Kill-Switch | Test-Text unter dem Knopf |
| F3 | `Ventilator an/aus`, `Stufe 1–3`, `Ventilator Licht` | Parser vor dem LLM |
| F4 | Ungepaart = ehrlich | Kein Fake-Erfolg |
| F5 | Version `1.29.0` + APK | Sideload nach 1.28.2 |

## Probe

1. Brücke im WLAN, lernen, testen.
2. `Ventilator an` → Motor. `Stufe 3`. `Ventilator aus`.
3. Ohne Codes / Kill-Switch aus: Absage, Ventilator bleibt.

## Won’t

Alexa, Google Home, Tuya-Cloud, Home Assistant als Hub, mehrere Ventilatoren, Zimmerlampen, Confirm.

## Danach

RF-Lernen hakelig → `1.29.1`. Bond nur wenn Q40 Bond ist.

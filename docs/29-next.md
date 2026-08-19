# 29 — WLAN-Steckdosen (`2.1.0`–`2.1.1`)

PO 2026-08-19: Eigene WLAN-Steckdosen aus Jarvis schalten. Code fertig, lokal im Hausnetz, ehrlich wenn ungepaart.

Reihe davor: [`28-next.md`](./28-next.md). App vorher: Sideload **`2.0.1`**.

Eine Sideload-Stufe.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`2.1.0`** | WLAN-Steckdosen lokal (Shelly, Tasmota, Tuya-LAN, Broadlink-SP) | **CODE** |
| **`2.1.1`** | Hausnetz-IP, nicht die öffentliche 89.… | **CODE** |

Sprint: [`sprint-103.md`](./sprints/sprint-103.md).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Ort | Handy spricht die Stecker **im selben WLAN** an. Kein Gastnetz. |
| Cloud | Keine Tuya-Cloud, keine Alexa, kein Home Assistant als Hub. |
| Tuya | Nur LAN (Device-ID + Local Key). Key einmal aus dem Tuya-IoT-Portal, dann lokal. |
| Nicht | Tapo/TP-Link, Matter, Zigbee-Sticks, mehrere Ventilatoren |

## Chat

`Steckdose an` / `aus`. Mit Namen: `Schreibtisch aus`. Mehrere: `alle Steckdosen aus`. Nachfrage, wenn unklar welche. Ungepaart = ehrlich, kein Fake-Erfolg.

## `2.1.1` — Richtige Stecker-IP — **CODE**

PO hat die Internet-Adresse `89.246.103.118` eingetragen. Jarvis braucht `192.168.…` aus dem Router.

**Probe:** 89.… → klarer Satz „keine Hausnetz-Adresse“. `192.168.178.40` bleibt prüfbar.

## Probe

1. Einstellungen → Haus: Steckdose speichern, **Test An** / **Test Aus** — Relais klickt.
2. Chat: `Steckdose an` — schaltet wirklich, oder klare Absage.
3. `Ventilator an` bleibt Ventilator. `Licht an` ohne Stecker-Name bleibt kein Ort und keine Steckdose.
4. `/hilfe` nennt 2.1.1 und Steckdosen.

## Won’t

Alexa, Tuya-Cloud zur Laufzeit, Home Assistant, Tapo, iOS, Play Store, Apple CarPlay.

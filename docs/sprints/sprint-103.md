# Sprint 103 — WLAN-Steckdosen (`2.1.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.1.0`** |
| Quelle | PO: WLAN-Steckdosen ansteuern, Code fertig, Step-by-step |
| Voraussetzung | `2.0.1` |
| Plan | [`29-next.md`](../29-next.md) |

## Ziel

Bestehende WLAN-Steckdosen lokal schalten. Jarvis redet nicht mit Alexa und nicht mit der Tuya-Cloud.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| P1 | Settings → Haus: Name, IP, Typ, prüfen, Test An/Aus, speichern | Relais klickt oder ehrlicher Fehler |
| P2 | Shelly / Tasmota nur mit IP | Probe erkennt den Typ |
| P3 | Tuya/Smart Life LAN | Device-ID + Local Key, TCP 6668, kein Cloud-Call |
| P4 | Chat `Steckdose an/aus`, Name, alle | Parser vor dem LLM; unklar → nachfragen |
| P5 | Sideload `2.1.0` | versionCode 20100 |

## Probe

`Steckdose an` · `Schreibtisch aus` · `alle Steckdosen aus` · `Ventilator an` bleibt Fan · Test An in den Einstellungen

## Won’t

Alexa, Tuya-Cloud, Home Assistant, Tapo, iOS, Store, Apple CarPlay.

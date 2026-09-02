# Sprint 155 — Verify Launch (`9.1.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.1.0`) |
| Ziel-Version | `9.1.0` |
| Quelle | Audit „TV Netflix launch + verify“ |
| Plan | Industry V6 Teil 2 |

## Ziel

`Öffne Netflix` sagt SUCCESS nur mit Observation: Gerät in der Registry, gekoppelt, App-Fähigkeit, Native-OK plus gesendete `appId`. Ohne das kein „ist offen“.

## Must

| ID | Inhalt |
|----|--------|
| L1 | `tvLaunchVerified` |
| L2 | `handleTvWatch` / open / play über `packVerified` |
| L3 | Fire-Launch = failed, ehrlich HDMI/Samsung |

## Won’t

Pixel vom Schirm. JustWatch erfinden.

## DoD

- [x] Launch ohne `deviceId` oder `appId` ist failed
- [x] App nicht in `apps` ist failed

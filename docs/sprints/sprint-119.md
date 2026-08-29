# Sprint 119 — Weltkugel in der Lage **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (in App `5.11.0`) |
| Priorität | nach Körper-WebGL-Spike `4.67`, ohne Sideload, unabhängig von LocateAnything-3060 |
| Ziel-Version | `5.0.0` (bündelt Research `5.1`–`5.3`, Bau `5.4`+) |
| Quelle | PO: Reel 3D-Kugel, Satellitenbilder, News; bestehende Tools einbauen |
| Plan | [`43-next.md`](../43-next.md) |
| Inspiration | https://www.instagram.com/reel/DcgfA4ojF7a/ |

## Ziel

Lage-Sicht **Kugel**: drehbare Erde in der APK, Pins aus ISS / OpenSky-Nachbar / GPS / DWD / outlook+news (Ortslexikon). Satellitenfoto nur so aktuell wie NASA GIBS hergibt, Stand sichtbar. Tap = bestehendes Tool, kein neues Hirn. Chat bleibt.

## Must

| ID | Inhalt |
|----|--------|
| G1 | Reel ehrlich: Briefing ja, „andere beobachten“ Won’t |
| G2 | Kein neues `4.66`/`4.76` — MAJOR `5.0` |
| G3 | Tools mergen (`outlook`, `news`, `sky`, `flights`, `warn`, `here`) |
| G4 | Live-Satellit = Stunden-Stand oder Blue Marble, nie Fake-Webcam |
| G5 | Research `5.1`–`5.3` vor Execute; WebGL-Budget mit Körper `4.67` teilen |

## Won’t (dieser Sprint)

Sideload. Überwachung. Starlink-Schwarm. 60-fps-Idle. EarthOS-Klon. Zweites PC-Hirn.

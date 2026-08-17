# Sprint 88 — CarPlay besser (`1.35.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.35.0`** |
| Quelle | PO 2026-08-17 besseres CarPlay, flüssiger |
| Voraussetzung | `1.34.0` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Fahrmodus bleibt die bestehende Karte/OSRM/Spotify-Schicht — zuverlässiger unterwegs. Replan darf Cue-Gedächtnis nicht löschen.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| P1 | Off-route neu planen | Klare Abweichung → neue Linie, kein Zucken |
| P2 | Cue einmal, auch nach Replan | Dieselbe Abbiege nicht dreimal |
| P3 | HUD lesbar, große Trefferflächen | Pause/Skip/Abbiege-Zeile, Tag/Nacht |
| P4 | Zoom nach Tempo + Heading | Stadt nah, Landstraße weiter, Recenter |
| P5 | Jarvis-Stimme vs. Navi-Cue | System-TTS für Abbieger bleibt, kein Verschlucken |
| P6 | Tabs + Ziel aus Orten | `Zeig Karte` / `zur Freundin` ehrlich |
| P7 | Ankunft + Spotify-Token | Ziel-Ansage; Overlay reconnect ehrlich |
| P8 | Version `1.35.0` | Sideload |

## Probe

Siehe [`28-next.md`](../28-next.md) `1.35.0`.

## Won’t

Apple CarPlay, Google Maps Navigation, Stau-Live.

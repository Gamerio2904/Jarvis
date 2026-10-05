# Sprint 101 — Live-Lage auf Nachfrage (`1.48.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.48.0`** |
| Quelle | PO: Open-Meteo Luft + Sonnenaufgang nur gezielt; transport.rest; Tagesschau + Ort dann Netz; Nager.Date |
| Voraussetzung | `1.47.1` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Bestehende Wetter-/Ort-/Alltag-Tools erweitern. Keine erfundenen Werte. Luft und Sonne nicht an jedes Wetter hängen.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| L1 | Luftqualität / Pollen nur auf Nachfrage | `Wie ist die Luft?` — nicht bei `Wetter heute` |
| L2 | Sonnenaufgang / -untergang nur auf Nachfrage | `Wann Sonnenaufgang?` |
| L3 | Bahn/ÖPNV: transport.rest, sonst Transitous | `Mit der Bahn nach Heilbronn` — kein CarPlay |
| L4 | Tagesschau national; Ort zuerst Suche, sonst Netz | `Was ist heute in Ingesheim passiert` — nichts erfinden |
| L5 | Feiertage DE (Nager.Date) | `Ist heute Feiertag?` |
| L6 | Prompt-Chips und PC-Prompt-Kopieren raus aus der APK | Tests behalten `TEST_PROMPTS`; Windows-App behält Kopieren |
| L7 | Sideload `1.48.0` | versionCode 14800 |
| L8 | Satzbildung Film-Jarvis (`1.48.1`) | Ganze Sätze, kein Telegramm |
| L9 | Live-Test-Bugs (`1.48.2`) | Erinnerung, Tanke, Laden, Straße, Overlay |
| L10 | Fahrmodus Karte/Route (`1.48.3`) | HUD vollflächig, Route sichtbar |
| L11 | Fahrmodus-Karte neu (`1.48.4`) | Vollbild, Norden oben, nicht gedreht |
| L12 | Karte Gesten + Mic (`1.48.5`) | Schieben/Zoom, Sprache führt aus |
| L13 | Overlay/Cafés/Route (`1.48.6`) | Overlay=Karte, OSM-Cafés, echte Route |
| L14 | Research ehrlich (`1.48.7`) | Faktfragen suchen, keine erfundenen Zahlen |
| L15 | CarPlay/Cafés Valeo (`1.48.8`) | Route auf Straßen, OSM 8 km, Overlay ohne Overlay-Wort |

## Probe

`Wie ist die Luft?` · `Wann Sonnenaufgang?` · `Wetter heute` (ohne AQI/Sonne) · `Mit der Bahn nach Heilbronn` · `Nachrichten` · `Was ist heute in Ingesheim passiert` · `Ist heute Feiertag?`

## Won’t

Luft/Sonne an jedes Wetter, Fake-Abfahrten, erfundene Lokalnews, Joyn/ARD als TV-Apps, Apple CarPlay.

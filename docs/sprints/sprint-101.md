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

## Probe

`Wie ist die Luft?` · `Wann Sonnenaufgang?` · `Wetter heute` (ohne AQI/Sonne) · `Mit der Bahn nach Heilbronn` · `Nachrichten` · `Was ist heute in Ingesheim passiert` · `Ist heute Feiertag?`

## Won’t

Luft/Sonne an jedes Wetter, Fake-Abfahrten, erfundene Lokalnews, Joyn/ARD als TV-Apps, Apple CarPlay.

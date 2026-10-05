# Sprint 102 — Jarvis 2.0 (`2.0.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.0.0`** |
| Quelle | PO: 2.0-Paket — Fixes + ein Kontext, keine neue Produktfamilie |
| Voraussetzung | `1.48.8` |
| Plan | [`28-next.md`](../28-next.md) |

## Ziel

Dieselbe Haus-AI, ein Kontext. Letztes Medium, ehrliche Daten, CarPlay als interne Navi. Kein iOS, kein Store, kein Apple CarPlay.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| M1 | Lautstärke am Steuer / nach Spotify trifft Spotify | `Lautstärke 50` im Fahrmodus nicht TV; `Fernseher lauter` bleibt TV |
| M2 | `Zeig Spotify` ohne Overlay-Wort öffnet nicht die Karte | Overlay nur mit Overlay-Wort oder schon im Fahrmodus |
| M3 | Ohne GPS kein Fake-Ankunft | Pin am Ziel, Pfeil nicht auf dem Pin als „da“ |
| M4 | Wetter ohne Gemini-Fallback | Open-Meteo fehlt → ehrlich |
| M5 | Erinnerung ohne Zeit fragt | `erinner mich an Steuer` → wann; Follow-up legt an |
| M6 | Widget: Fläche hören, Mikro Wake | `ACTION_TOGGLE_VOICE` am Mikrofon |
| M7 | Stopp = letztes Medium | `stopp` nach Spotify pausiert, schließt CarPlay nicht |
| M8 | Sideload `2.0.0` | versionCode 20000 |
| M9 | Latenz (`2.0.1`) | Smalltalk streamt, Gemini nicht 60 s |
| M10 | Ingersheim DE (`2.0.1`) | GPS/DE vor Grand Est |
| M11 | Follow-ups (`2.0.1`) | Witz/Rezept nicht Ort/Wetter; Schlagzeilen = Tagesschau |
| M12 | Kurven/Kreisverkehr (`2.0.1`) | GPS auf der Linie, Ausfahrt |

## Probe

`Lautstärke 50` im Fahrmodus · `Zeig Spotify` · `erinner mich an Steuer` · Widget-Mikro · `stopp` nach Spotify · `kein Kaffee mehr` · `Wetter heute`

## Won’t

iOS, Play Store, Apple CarPlay, WhatsApp, größeres GGUF, Google-Kalender-OAuth, neue Gerätefamilien, Keystore.

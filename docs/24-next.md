# 24 — CarPlay flüssig (`1.30`)

PO 2026-08-17: Fahrmodus/CarPlay soll **flüssig** laufen. Per Stimme Tabs öffnen (z. B. „Spiel das auf Spotify“ → Spotify-Overlay). Jarvis sagt die Abbieger: **„Vorne links in 300 Metern abbiegen.“**

Reihe davor: [`23-next.md`](./23-next.md). App vorher: Sideload **`1.29.0`**.

Eine Sideload-Stufe.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.30.0`** | CarPlay-HUD, smooth Map, Voice-Tabs, Navi-Ansagen | **CODE** |

Sprint: [`sprint-82.md`](./sprints/sprint-82.md).

## Flüssig

Karte folgt dem Standort (Sie bleiben in der Mitte), Tiles nicht bei jedem GPS-Tick neu. GPS-Watch statt 8-Sekunden-Poll. Bildschirm an. Overlay gleitet.

## Tabs per Stimme

Im Fahrmodus: `Zeig Spotify`, `Spiel Hotel California auf Spotify`, `Karte`, `Navigation`. Spotify kommt als Overlay über die Karte — nicht alles übereinander gestapelt.

## Ansagen

OSRM-Steps. System-TTS (schnell, kein Gemini-Warten). Phasen: ~1 km, **300 m**, 100 m, jetzt. Beispiel: `Vorne links in 300 Metern abbiegen.`

Kein Google Maps. Kein Apple CarPlay (Android-App).

## Probe

1. `Aktiviere Fahrmodus` / `Nach Heilbronn` — Overlay, Karte folgt.
2. `Zeig Spotify` — Overlay. `Spiel … auf Spotify` spielt und öffnet den Tab.
3. Auf der Route: große Abbiege-Zeile, Stimme „in 300 Metern …“.
4. `Fahrmodus aus`.

Nächste Fahrmodus-Härte: [`28-next.md`](./28-next.md) `1.35.0` (Replan, Cue-once, HUD, Zoom).

## Won’t

Apple CarPlay-Entitlement, iOS, Google Maps, Gemini-TTS für Abbieger, mehrere Overlays gleichzeitig.

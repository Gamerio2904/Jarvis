# Sprint 124 — Fahrmodus-Bühne (`6.30`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Motion-Tokens `6.10` |
| Ziel-Version | `6.30.0` (Research `6.31` HUD vs Tiles) |
| Quelle | PO: CarPlay-Animation massiv, flüssig |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | `DriveMode.tsx`, `drive-map.ts`, `nav-speak.ts`, intern nicht Apple |

## Ziel

Internes Overlay sieht aus wie ein HUD, bleibt ehrlich: Chevron und Zoom aus echter Route/GPS. Spotify-Tab pulsiert nur bei laufendem Track. Navi-Ansagen Native. Am Steuer weiter Native-TTS-Race.

## Must

| ID | Inhalt |
|----|--------|
| F1 | Glas-HUD + Manöver-Chevron aus `nextManeuver`, keine erfundene Spur |
| F2 | Tile-Load darf HUD nicht einfrieren (`6.31`) |
| F3 | Spotify-Artwork-Glow nur wenn `playing` |
| F4 | Overlay bleibt Karte außer Spotify-Tab — wie CODE |
| F5 | Reduced-motion: Chevron statisch, Zahlen bleiben |

## Won’t (dieser Sprint)

Apple CarPlay. Erfundene Navigation. Live-Kamera der Straße. Sideload.

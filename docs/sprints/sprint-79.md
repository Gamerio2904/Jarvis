# Sprint 79 — Internes Spotify im Fahrmodus (`1.27.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.27.0`** |
| Quelle | PO 2026-08-16 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| S1 | Web Playback in Jarvis | Fahrmodus spielt über Gerät „Jarvis“ |
| S2 | Fallback ehrlich | Kein Premium / kein DRM → 30s-Vorschau oder anderes Gerät |
| S3 | Kein Key in der App | Nur Nutzer-Client-ID |
| S4 | Version `1.27.0` + APK | Sideload |

## Probe

1. Einstellungen → Musik: Client-ID, Redirect `https://localhost/`, anmelden.
2. `Aktiviere Fahrmodus` — unten Spotify-Dock.
3. `Spiel Hotel California` — Ton aus Jarvis, Anzeige „in Jarvis“.
4. Pause / weiter in der Leiste.
5. `Nach Heilbronn` — Overlay, Route auf der Karte, **Hören** im Balken.

## Won’t

Spotify-Secret, Google Maps, neues Modell.

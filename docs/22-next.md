# 22 — Internes Spotify im Fahrmodus (`1.27`)

PO 2026-08-16: Im CarPlay/Fahrmodus soll Spotify **in Jarvis** laufen, über die Spotify-API — nicht nur die Spotify-App fernsteuern.

Mitgeliefert in **`1.27.0`**.

Reihe davor: [`21-next.md`](./21-next.md) (`1.26.0`).

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.27.0`** | **Web Playback** im Fahrmodus: Gerät „Jarvis“ | Sideload nach 1.26 | **CODE** |
| **`1.27.2`** | „Nach Heilbronn“, Overlay-Hören, STT | Sideload nach 1.27.1 | **CODE** |
| **`1.28.0`** | Wake-Word Hintergrund, Fire TV HDMI | Sideload nach 1.27.2 | **CODE** |

Sprint: [`sprint-79`](./sprints/sprint-79.md).

## Internes Spotify

Einstellungen → Musik: **Ihre** Client-ID, Redirect-URI exakt `https://localhost/` in der APK. Anmelden (PKCE). Kein Secret in Jarvis.

Im Fahrmodus startet der Spotify Web Playback SDK. Jarvis wird zum Connect-Gerät **Jarvis**. Play/Pause/Skip und „Spiel …“ laufen **in der App**.

Ohne Premium: ehrliche 30s-Vorschau. Wenn der WebView-Player nicht startet: anderes Spotify-Gerät oder Vorschau, angesagt.

Bereits angemeldete Nutzer: einmal **nochmal anmelden** (Scope `streaming` / `user-read-private`).

## Won’t

Gebackene Spotify-Keys, iOS, Play Store, Google Maps im Fahrmodus.

# 21 — Auge, TV-Lautstärke, Fahrmodus, Spotify, Wake-Bubble (`1.26`)

PO 2026-08-16: Foto muss eine Antwort liefern. TV-Lautstärke 1–100. Fahrmodus mit eigener Karte (kein Google Maps) und internem Spotify. Unten eine permanente Wake-Word-Bubble.

Mitgeliefert in **`1.26.0`**.

Reihe davor: [`20-next.md`](./20-next.md) · GUI: [`sprint-77.md`](./sprints/sprint-77.md) (`1.25.0`).

## Reihenfolge

| Version | Inhalt | Warum getrennt | Status |
|---------|--------|----------------|--------|
| **`1.26.0`** | **Auge** + **TV-Lautstärke** + **Fahrmodus** + **Spotify** + **Wake-Bubble** | Eine Sideload-Stufe | **CODE** |

Sprints: [`sprint-78`](./sprints/sprint-78.md).

## Auge

Foto-Knopf muss eine **Bubble** liefern, kein stummes Hängen. JPEG klein, Timeout, HEIC ehrlich ablehnen. Ohne Gemini: Absage im Chat.

## TV-Lautstärke

`Lautstärke 50`, `lauter um 10`. Tasten, keine exakte TV-Skala. Ehrlich „etwa 50“.

## Fahrmodus

`Aktiviere Fahrmodus` — Overlay, OSM + OSRM, **kein Google Maps**.

## Spotify (im Fahrmodus)

Einstellungen → Musik: **Ihre** Spotify-Client-ID, Redirect-URI exakt die der App (`https://localhost/` in der APK). Anmelden (PKCE). Kein Key in Jarvis.

Im Overlay: Suchen, Spiel, Pause, weiter. Im Chat bei offenem Fahrmodus: `Spiel Hotel California`, `Pause`, `weiter`.

Volle Titel: Spotify Premium + **Web Playback in Jarvis** (ab `1.27.0`). Sonst 30s-Vorschau, ehrlich gesagt.

Weiter: [`22-next.md`](./22-next.md).

## Wake-Bubble

Unten permanente Kugel. Antippen = hören.

## Won’t

Play Store, iOS, Google Maps im Fahrmodus, gebackene Spotify-Keys, ChatGPT-lokal.

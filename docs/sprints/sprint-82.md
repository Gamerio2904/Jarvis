# Sprint 82 — CarPlay flüssig (`1.30.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.30.0`** |
| Quelle | PO 2026-08-17 CarPlay smooth + Voice-Tabs + Abbiege-Ansagen |
| Voraussetzung | Sideload `1.29.0` |

## Ziel

Fahrmodus fühlt sich wie CarPlay an: Karte folgt weich, Tabs per Stimme, Spotify als Overlay, Jarvis sagt die Abbieger.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| S1 | Follow-me-Karte, lerp, GPS-Watch | Kein 8s-Sprung, Tiles nicht jedes Mal neu |
| S2 | HUD: nächste Abbiege groß | Meter + Richtung auf der Karte |
| S3 | Voice-Tabs | `Zeig Spotify` / `Karte` öffnen Overlay |
| S4 | `Spiel … auf Spotify` | Tab + Play |
| S5 | Navi-Ansagen | „Vorne links in 300 Metern abbiegen“, dann „Jetzt …“ |
| S6 | Bildschirm an im Fahrmodus | `setKeepScreenOn` |
| S7 | Version `1.30.0` | Sideload nach 1.29.0 |

## Probe

Siehe [`24-next.md`](../24-next.md).

## Won’t

Apple CarPlay, iOS, Google Maps, Gemini-TTS für Abbieger.

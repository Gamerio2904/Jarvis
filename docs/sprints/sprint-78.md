# Sprint 78 — Auge, TV-Lautstärke, Fahrmodus, Wake-Bubble (`1.26.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.26.0`** |
| Quelle | PO 2026-08-16 |

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| A1 | Foto liefert Chat-Antwort | Bubble, kein stummes Hängen |
| A2 | TV-Lautstärke 1–100 | `Lautstärke 50`, `lauter um 10` |
| A3 | Fahrmodus-Overlay | Eigene Karte/Route, nicht Google Maps |
| A3b | Spotify im Fahrmodus | Client-ID + Login, Steuerung intern |
| A4 | Wake-Bubble unten | Permanent, antippen = hören |
| A5 | Version `1.26.0` + APK | Sideload |

## Probe

1. Foto wählen — Jarvis antwortet im Chat.
2. `Lautstärke 30` nach gekoppeltem TV.
3. `Aktiviere Fahrmodus` — Overlay mit Karte.
4. Unten die Jarvis-Kugel, auch ohne geöffnetes Menü.

## Won’t

Google Maps im Fahrmodus, neues Modell, API-Keys.

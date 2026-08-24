# Sprint 123 — Sideload `2.29.0` (Welt + Kaufmodus + Polish)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`2.29.0`** |
| Quelle | PO: alles bis `2.28` umsetzen, APK, Tablet/Sprache/CarPlay polish |
| Voraussetzung | Plan `2.3`–`2.28` in [`31-next.md`](../31-next.md) / [`32-next.md`](../32-next.md) |
| Polish | [`33-next.md`](../33-next.md) |

## Ziel

Eine Sideload-APK `2.29.0`: Alltag & Welt, Kaufmodus (nie Einkaufsliste), Polish für Tablet, Sprachmodus und internes CarPlay.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| W1 | `2.3`–`2.19` in `world.ts` / `world-parse.ts` | Router nach Feiertag, vor Kalender |
| K1 | Kaufmodus `2.20`–`2.28` | Parser vor Einkaufsliste, Overlay, Merkliste `kauf_saved` |
| P1 | Tablet / Stimme / CarPlay | `html.jarvis-tablet`, Voice-Loop, HUD/Tabs |
| T1 | Prompt-Router | `Kaufmodus` kauf, `Milch kaufen` shopping, Unwetter/Ferien/Dollar/Schach world |
| A1 | APK | `releases/Jarvis.apk` versionName `2.29.0` versionCode `22900` |

## Won’t

Apple CarPlay, Play Store, iOS, Tuya-Cloud, In-App-Kauf, erfundene Preise.

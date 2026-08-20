# Sprint 84 — Samsung-Apps YouTube/Amazon/Disney/Netflix (`1.32.0`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.32.0`** |
| Quelle | PO 2026-08-17 Smart-TV: yt/Amazon/Disney/Netflix; „Spiele … Film App“ kostenlos zuerst |
| Voraussetzung | Sideload `1.31.0`, Tizen gekoppelt, gleiches WLAN |

## Ziel

Streaming-Apps auf dem Samsung-Tizen per Stimme öffnen. Bei einem Filmtitel nachsehen, wo er in DE kostenlos (oder mit Werbung) liegt, und genau diese App starten.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| A1 | Native `launchApp` (REST 8001, sonst WS `ed.apps.launch`) | App geht auf, ohne Taste-raten |
| A2 | Parser: öffne/starte/spiel App; `Spiel TITLE Film`; `auf Netflix` | `Spiel Hotel California` bleibt Musik |
| A3 | Lookup JustWatch DE, YouTube-Fallback | Gratis/Ads vor Flatrate; Leihen nur bei genannter App |
| A4 | Ehrliche Replies | Kein „spielt“, wenn Start fehlschlägt; YouTube-Ganzer-Film unsicher |
| A5 | Version `1.32.0` | Sideload nach 1.31.0 |

## Probe

1. Gekoppelt: `Öffne Netflix` — Netflix auf dem Samsung.
2. `Spiel YouTube` — YouTube-App.
3. `Spiel Dune Film` — sagt wo (gratis zuerst), öffnet YouTube/Prime/Disney/Netflix.
4. `Spiel Hotel California` — nicht TV.
5. TV aus / ungepaart — WOL-Versuch oder ehrliche Meldung, kein Fake.

## Won’t

SmartThings, Joyn/ARD/ZDF starten, Fire-TV-App-Launch, Trailer als „ganzer Film“ behaupten.

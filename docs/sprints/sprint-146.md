# Sprint 146 — App-Action-Registry (`6.95.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `6.96.0`) |
| Priorität | V2 nach TTS |
| Ziel-Version | `6.95.0` |
| Quelle | Phase-0-Audit V2: Settings, Theme, Debug, Stimme, Lage, Memory-Show |
| Plan | Industry V2 Teil 2 |

## Ziel

„Öffne Einstellungen“ und Verwandte sind ein Parser+Handler, der `tool.action` an die UI gibt. Kein Reply-Scraping, keine Fake-Klicks. Lage bleibt `hud`. Face bleibt `face`. Recall bleibt Recall.

## Must

| ID | Inhalt |
|----|--------|
| E1 | `app-parse.ts` / `app.ts` — settings (Topic), voice, theme, debug, Gedächtnis-Panel |
| E2 | Register + `route-pick` Capability `app` |
| E3 | `App.tsx` öffnet Overlay über `tool.action`, nicht über Reply-Text |
| E4 | Nicht stehlen: `Lage an`, `Was weißt du über mich`, `Öffne WLAN` |

## Won’t

Generisches Action-FSM (V3). Fake-DOM-Clicks. Settings-IA umbauen.

## DoD

- [x] `pickRoute('Öffne Einstellungen') === 'app'`
- [x] `pickRoute('Lage an') === 'hud'`
- [x] `test:014` grün

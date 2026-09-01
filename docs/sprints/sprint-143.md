# Sprint 143 — Overlay-FSM & Weltlage (`6.92.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `6.93.0`) |
| Priorität | V1 nach Sprint 142 |
| Ziel-Version | `6.92.0` |
| Quelle | Phase-0-Audit [`51-phase0-audit.md`](../51-phase0-audit.md) §7, Race Settings/Drive |
| Plan | Industry V1 Teil 2 |

## Ziel

Eine Fläche oben. Back und Fertig schließen immer die oberste. Settings über Drive töten den Fahrmodus nicht. Weltlage-Watch ist Banner, nie Wecker-GUI. Pin-Tap zeigt eine Sprechblase (Text, kein Bilder-Karussell).

## Must

| ID | Inhalt |
|----|--------|
| B1 | `overlay-fsm.ts` — `closed→opening→open→closing`, `exclusive`/`ensure`/`drop` |
| B2 | App verdrahtet Sheets; Drive bleibt im Stack unter Settings |
| B3 | Drive `pointer-events: none`, solange ein Sheet oben liegt — Fertig in Settings erreichbar |
| B4 | Weltlage-Notify: `alarm` Default false; Titel „Weltlage“ nie Alarm-GUI; `OUTLOOK_WATCH_ALARM = false` |
| B5 | Pin-Tap: Karte mit Name, Kurzlage, „Keine Bilder — nur Lage-Text“, Schließen, Im Chat |
| B6 | Debug-Katalog-Gruppe **Stabilität Screenshots** |

## Won’t

TTS-Kaskade (145). News-Galerie hinter Pin-Swipe. Foreground-Service `5.12`. Gemini-Banner weg (V2).

## DoD

- [x] Overlay-FSM Tests: Drive unter Settings, Drop Settings → Drive, exclusive Voice ohne Settings
- [x] `test:014` grün
- [x] Typecheck grün

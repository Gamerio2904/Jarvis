# Sprint 154 — TV Device-Registry (`9.1.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `9.1.0`) |
| Priorität | V6 nach V5 |
| Ziel-Version | `9.1.0` |
| Quelle | Phase-0-Audit Debt #10, Industry V6 |
| Plan | Industry V6 Teil 1 |

## Ziel

Tizen und Fire TV stehen in einer Registry (`tv_devices_json`), nicht nur lose Settings-Felder. Seed aus dem bestehenden Host. App-Fähigkeiten pro Gerät. Fire startet keine Apps.

## Must

| ID | Inhalt |
|----|--------|
| T1 | `tv-registry.ts` — Geräte, Apps, pick nach Name/via |
| T2 | Pairing schreibt `tizen-default` zurück |
| T3 | Kein SmartThings |

## Won’t

SmartThings. Schirm-OCR. WebRTC. Mehr als Tizen+Fire.

## DoD

- [x] Seed aus Settings
- [x] `pickTvDevice` unterscheidet Fire und Tizen

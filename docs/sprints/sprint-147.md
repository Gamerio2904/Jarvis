# Sprint 147 — Banner, Chips, Wake (`6.96.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | V2 Abschluss |
| Ziel-Version | `6.96.0` |
| Quelle | Phase-0-Audit S8, S9, Race Wake partial+final |
| Plan | Industry V2 Teil 3 |

## Ziel

Gemini-Hinweis einmal, wegklappbar. Unter der Antwort keine Debug-Zähler (`1 · Wetter`). Wake öffnet Sprachmodus nur auf das finale STT, nicht auf Partial plus Final.

## Must

| ID | Inhalt |
|----|--------|
| F1 | Banner `gemini_banner_dismissed` — Verstanden speichert |
| F2 | `researchStatusLabel`: „Quelle“ / „Quellen“, keine führende Ziffer |
| F3 | Sources-Summary ohne Query-Suffix ` · Wetter …` |
| F4 | Wake: `onPartialResults` öffnet nicht; `hit` nur wenn `armed`; JS-Debounce `wake-gate.ts` |

## Won’t

Chip komplett entfernen (User sieht weiter „Wetter“). Debug-Progress im Debug-Panel bleibt. WebRTC.

## DoD

- [x] Eine Open-Meteo-Quelle heißt „Quelle“, nicht „1 Quellen“
- [x] `acceptWake` blockt Doppel-Open
- [x] `test:014` grün
- [x] Typecheck grün

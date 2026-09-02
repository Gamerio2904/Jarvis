# Sprint 145 — TTS Gemini-Primary (`6.94.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `6.96.0`) |
| Priorität | V2 nach V1 |
| Ziel-Version | `6.94.0` |
| Quelle | Phase-0-Audit V2, Standing vs Drive-Race |
| Plan | Industry V2 Teil 1 |

## Ziel

Im Standing wartet die Stimme auf Gemini (Health + Skip kranker Modelle). Das 400-ms-Native-Race bleibt nur am Steuer, wo Tempo vor Timbre geht.

## Must

| ID | Inhalt |
|----|--------|
| D1 | Standing: `ttsNativeRaceMs(false) === 0` — kein Native-Default |
| D2 | Drive: Race 400 ms / Budget 700 ms bleibt |
| D3 | TTS-Skip-Map (`gemini_tts_skip_until`) bei 404/429/503 |
| D4 | Bis zu drei Modelle, gesunde zuerst |

## Won’t

ElevenLabs. Stimmklon. Foreground-Service. TTS im Standing künstlich auf Native kürzen.

## DoD

- [x] `ttsGeminiPrimary(false)` true, `(true)` false
- [x] `test:014` grün

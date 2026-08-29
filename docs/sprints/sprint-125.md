# Sprint 125 — Sprach-Theater & Stimme (`6.40`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** (in App `6.50.0`) |
| Priorität | nach Motion `6.10`; parallel zu Drive möglich |
| Ziel-Version | `6.40.0` (Research `6.41` Stimmenliste) |
| Quelle | PO: Sprachsteuerung Animation, Stimme verbessern, Antworten im Sprachmodus intelligenter |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | `VoiceMode.tsx`, `tts.ts` Algieba/Kore, `createSpeakPipeline`, Wake-Bubble |

## Ziel

Sprachmodus als Bühne: Orb aus Mic-RMS, Speak-Waveform, Barge-in bleibt. TTS-Picker (Algieba Default, Kore Friday, weitere Gemini-Stimmen nach Spike). Am Steuer Tempo > Timbre. Inhalt der Sätze kommt aus `6.50`; dieser Sprint ist Klang und Bewegung.

## Must

| ID | Inhalt |
|----|--------|
| V1 | Listening-Orb = echte Mic-Energie, nicht Endlos-CSS |
| V2 | Erste Satzhälfte sprechen sobald Blob da (Pipeline schon CODE, Lücken schließen) |
| V3 | Stimmen-Picker; Default Algieba; Friday Kore; Drive Native-first 700 ms |
| V4 | Optional: Mund-Organ in der Lage koppelt an Amplitude, wenn Körper sichtbar |
| V5 | Barge-in bricht Speak + Listen-Reset, kein Doppel-TTS |

## Won’t (dieser Sprint)

ElevenLabs. Stimmklon. Marvel-Zitate. 0,5B durch TTS „schlauer“ machen. Sideload.

# Sprint 175 — Piper offline TTS (`9.10.2`) **PLAN** · Could

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | `9.10.2` |
| Quelle | [`54-next.md`](../54-next.md) · Sprint 173 |
| Pflicht | **Could** — Skip wenn APK-Delta oder Qualität NO-GO |

## Ziel

Piper `de_DE-thorsten` (oder miro/kerstin) über **sherpa-onnx**. First-Audio lokal, ohne Gemini-Budget. **Lane-1 bleibt Edge Neural vs Algieba.** Piper ist Offline-/Fallback-Lane, opt-in.

## Must (wenn Execute)

| ID | Inhalt |
|----|--------|
| P1 | Eine deutsche Stimme, Siezen, kein Marvel-Timbre-Zwang |
| P2 | First-Audio messen vs Edge auf demselben Gerät |
| P3 | APK-Delta genannt. >40 MB ohne Gewinn = NO-GO |
| P4 | Default aus. Netz tot → opt-in Piper darf sprechen |
| P5 | `firstBlobWins` / eine Lane pro Turn bleibt |

## Won’t

Piper **und** Kokoro als Default. ElevenLabs. gTTS als Lane-1. Wyoming-NAS.

## DoD

- [ ] Zahlen: Größe, First-Audio, Satzverständlichkeit PO
- [ ] GO opt-in **oder** Freeze ohne Bundle
- [ ] `test:014` TTS-Pipeline ohne Piper grün

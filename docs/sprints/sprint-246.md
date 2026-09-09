# Sprint 246 — Sprachmodus STT/TTS

**Version:** `15.7.0` (versionCode `150700`)  
**Plan:** [`65-next.md`](../65-next.md) §6

## Ziel

Screenshots „1 inuten“, abgehackte Sätze, Fallback-Stimme (Pico), vorzeitiges Abbruch beim Vorlesen beheben.

## Symptome ↔ Ursache

| Symptom | Ursache | Fix |
|---------|---------|-----|
| „Timer 1 inuten“ | STT chunk + fehlendes `repairSpeech` | Silence ↑, `utterance.ts` |
| Satz abgehackt | Web STT 800 ms; native max 2× extend | `turn-detect.ts`, Java Plugin |
| Fallback Pico | Edge/Gemini Timeout → Pico | Timeout 1800 ms, Lane-Lock |
| bricht beim Vorlesen ab | Satz-für-Satz TTS, `truncateSpoken` zu früh | merge chunks, VoiceMode |

## Lieferumfang

| ID | Task | Datei | Status |
|----|------|-------|--------|
| S246-1 | Silence 800→1100 ms in VoiceMode | `VoiceMode.tsx`, `turn-detect.ts` | CODE |
| S246-2 | Native `listenExtend` 2→4 ohne Satzende | `JarvisVoicePlugin.java` | CODE |
| S246-3 | `repairSpeech`: inuten→Minuten, weitere STT-Artefakte | `utterance.ts` | CODE |
| S246-4 | Partials nicht als final committen | `native/voice.ts` | CODE |
| S246-5 | Ein Audio-Stream pro Antwort (merge TTS chunks) | `createSpeakPipeline.ts` | CODE |
| S246-6 | Edge Timeout 1100→1800 ms Standing | `edge-tts.ts` | CODE |
| S246-7 | Kein Lane-Wechsel mid-reply (Audit) | `native/voice.ts` | CODE |
| S246-8 | `truncateSpoken` erst nach Satzende | `VoiceMode.tsx` | CODE |

## Gold

Manuell 3 Sätze + „Timer 1 Minute Frühstückseier“:
- Transkript vollständig
- Neural-Stimme (nicht Pico) bei `voice_tts: auto`
- Vorlesen bis Satzende

## Tests

```bash
cd frontend && npm run build
npm run test:prompts
npm run test:voice   # falls vorhanden
```

## Nicht in 246

- Whisper on-device → Freeze (Could)
- Smalltalk-Routing → Sprint 247

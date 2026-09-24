# Sprint 303 — Sprechen

**Version:** landet in `18.10.0` (historisch `18.5.2`) — **CODE** Must
**Plan:** [`76-next.md`](../76-next.md)
**Voraussetzung:** keine harte auf 301.

## Ziel

Deutscher Mund startet über Edge Neural, nicht nach 3,5 s Gemini-Timeout.
Mehrere Sätze bleiben eine Lane. Qualität = Conrad/Katja zuerst;
Algieba nur wenn Edge tot oder Nutzer es will.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S303-1 | Budget | `tts.ts` / `voice.ts` | Stehend: Edge **sofort** wenn `preferEdgeForReply` oder Sprache Deutsch. Gemini-TTS-Budget nicht vor Edge. Steuer: Native bleibt |
| S303-2 | Schnitt | `spokenForGemini` | 720-Zeichen-Cut nur für Gemini-TTS-Input, nicht für Edge. Edge spricht die Reply die der Chat zeigt (nach Persona-Länge aus 304) |
| S303-3 | Erstes Audio | `speak-tap.ts` | Groq-Token-Stream: beim ersten Satzende Edge anstoßen (18.1.2 eine Lane — Rest in denselben Clip flushen, nicht zwei Münder) |
| S303-4 | Ehrlichkeit | Settings-Copy | Piper/Kokoro „fehlt“, nicht anbieten als an. Keine neue APK-Gewicht |
| S303-5 | Test | vorhandene TTS-Tests | Deutsch ≥2 Sätze → nicht Gemini-first. Edge-Fail → Native, nicht 3,5 s Leere |

## Won’t

- Piper/Kokoro bündeln. ElevenLabs. Moshi.

## Abbruchkriterium

Stehender Sprachmodus wartet sichtbar auf Algieba, obwohl Edge 200
liefert. Oder zwei Stimmen überlagern.

## Manuell

Sprachmodus: „Wie wird das Wetter?“ — erstes Wort < 1 s auf WLAN, Stimme
Conrad/Katja, ganzer Antworttext, nicht nur Satz eins.

# 27 — Sprachmodus Tempo (`1.32.1`)

PO 2026-08-17: Jarvis antwortet im Sprachmodus nicht bzw. viel zu langsam.

Reihe davor: [`26-next.md`](./26-next.md). App vorher: Sideload **`1.32.0`**.

## Reihenfolge

| Version | Inhalt | Status |
|---------|--------|--------|
| **`1.32.1`** | Sprachmodus: sofort sprechen, kurze Timeouts, kein Hänger | **CODE** |

Sprint: [`sprint-85.md`](./sprints/sprint-85.md).

## Was schief lief

Gemini-TTS hat vier Stimmen und mehrere Modelle nacheinander probiert (Sekunden Stille). Der Text-Stream ging durch zu viele Modelle mit 45-s-Timeout. Android-TTS ohne `onDone` blieb hängen. Das 0.5B-Modell im Sprachmodus ist zu langsam.

## Fix

Antwort kommt über Android-Stimme, sobald der erste Satz da ist. Charon nur wenn er in ~0,5 s fertig ist. Gemini-Stream max. ~9 s, sonst ehrlich „nochmal“. Ohne Gemini: Groq oder klarer Hinweis, kein Handy-LLM.

## Probe

1. Sprachmodus: nach dem Satz fast sofort Ton, nicht erst nach vielen Sekunden.
2. Smalltalk und `Öffne Netflix` sprechen.
3. Wenn Gemini hängt: Meldung, nächste Runde hört wieder.

Nächste Reihe: Qualität statt Breite `1.33`–`1.40` — [`28-next.md`](./28-next.md).

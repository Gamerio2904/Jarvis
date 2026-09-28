# Sprint 366 — Stimme: Satz-TTS nach Parser-Satz

**Version:** `18.15.0` — **PLAN** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 303 Edge-first CODE. 364 Signal, damit Barge-in den Mund **und** den Fetch stoppt.

## Ziel

Sobald der **Parser** (oder der Stream) einen fertigen Satz hat, spricht
Jarvis. Edge zuerst. Nicht warten, bis Groq/Gemini den Absatz geschlossen hat.

## Ist

`createSpeakPipeline` in `voice.ts`: Edge-Rennen, Lane-Lock, `push` je
Chunk. `VoiceMode.runTurn` wartet `onTurn` **komplett**, dann
`pipe.push(spoken)` — ein Block. Parser-Treffer (TV, Timer) haben den Satz
sofort, der Mund wartet trotzdem auf das Promise.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S366-1 | Parser sofort | `VoiceMode.tsx` / `chat.ts` | Director-`hit.reply` (1–2 Sätze) → `pipe.push` ohne Hirn. Hirn-none: weiter streamen |
| S366-2 | Stream-Sätze | `streamChat` Callback | Satzgrenze (bestehende `splitSentences` / Heuristik 254 A). Jeder abgeschlossene Satz `push`. Kein Wort-für-Wort-Staccato |
| S366-3 | Lane | `createSpeakPipeline` | Edge zuerst wie 303. Gemini-TTS nur wenn Settings und Edge tot. Pico nicht mitten im Satz |
| S366-4 | Barge-in | `cutIn` | 364: `abortCurrentTurn` + `pipe.stop`. Selbstschutz `BARGE_IGNORE_TTS_MS` bleibt |
| S366-5 | Test | Voice-A/B / Gold-Copy | Parser-Satz „Timer läuft“ hörbar bevor ein Hirn-Token käme. Smalltalk: erster Satz, dann Rest |

## Won’t

Whisper lokal. Piper/Kokoro in der APK. Groq-PlayAI (EN/AR). Warten auf
Gemini 3,5 s bevor Edge. Satzende-ONNX (254 B Freeze).

## Abbruchkriterium

Parser-TV-Satz kommt erst nach Groq. Oder Pico springt mitten im Edge-Satz.
Oder Barge-in lässt den alten Fetch schreiben.

## PO-Prüfung

1. „Stell einen Timer auf zwei Minuten“: Ansage startet ohne Hirn-Pause.
2. Smalltalk: erster Satz, dann weiter, eine Lane.
3. Dazwischenreden: alter Mund weg, neuer Zug.

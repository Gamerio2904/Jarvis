# Sprint 364 — AbortSignal: Rest bis Groq/Native

**Version:** `18.15.0` — **CODE + APK** Must
**Plan:** [`87-next.md`](../87-next.md)
**Voraussetzung:** 253 CODE (`turn-abort.ts`, `http-json`, `saveSettings`-Sperre).

## Ziel

Barge-in und neuer Zug beenden **jeden** Netz-Call des alten Zuges, nicht
nur die, die durch `http-json` laufen.

## Ist

`beginAgentTurn` → `beginTurnAbort`. `http-json` nutzt `withTurnSignal`.
`saveSettings` verwirft Patches wenn `isTurnAborted()`. `makeDirectorCtx`
setzt **kein** `ctx.signal`. Eigene `fetch`: `groq.ts` SSE (`streamSseLines`),
`llm.ts` (XHR + fetch), `spotify.ts`, `native/voice.ts`, `native/tv.ts`
Poll `:8001`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S364-1 | Ctx | `director.ts` `makeDirectorCtx` | `signal: currentTurnSignal()` setzen. Bus darf weiter `withTurnSignal` mergen |
| S364-2 | Groq | `groq.ts` / `streamSseLines` | `fetch`/`AbortSignal` = `withTurnSignal(timeout)`. 429-Retry startet nicht nach Abort |
| S364-3 | 0,5B | `llm.ts` | XHR `abort()` am Zug-Signal. Kein Write nach Abort |
| S364-4 | Rest-fetch | Spotify, TV-Poll, Edge-TTS-Vorbau | Dieselben Calls: Signal oder bewusst **nicht** (Edge-Vorbau der **neuen** Antwort darf leben) |
| S364-5 | Test | `test-agents-robust.mjs` / e2e | Zweiter Zug: erster `fetch` rejected `AbortError`. `saveSettings` im abgebrochenen Zug tot |

## Won’t

Polyfill für `AbortSignal.any`. Handler-Rewrite aller 63 Executoren, wo
sie schon `http-json` nutzen. Abbruch der **nächsten** TTS-Lane.

## Abbruchkriterium

Barge-in: Groq-Stream oder TV-Poll läuft weiter und schreibt Zustand.
Oder der neue Zug erbt `last_step_tool` vom abgebrochenen Write.

## PO-Prüfung

1. Lange Suche, dann neues Wort: alte Antwort kommt nicht mehr, neuer Zug startet.
2. Settings-Key bleibt, abgebrochener Zug speichert keine fremden Flags.

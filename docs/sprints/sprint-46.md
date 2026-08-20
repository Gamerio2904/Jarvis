# Sprint 46 — Chat-Hang Hotfix (`0.13.2`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** — Modell bereit, Chat bleibt auf „Jarvis schreibt…“ |
| Ziel-Version | **`0.13.2`** |
| Quelle | PO 2026-08-15: Download ok, keine Antwort |

## Ursache

`0.13.1` hat Non-Stream + `n_threads: 1` + langes Persona-Prompt. Auf dem Handy (WASM/compat) dauert die Prompt-Eval so lange, dass keine Tokens erscheinen. Der UI-Timeout greift nicht, solange nichts zurückkommt — wirkt wie ein Hänger.

## Fix

- Streaming mit `onData` — Tokens erscheinen, sobald sie da sind
- Mehr Threads (bis 4), `n_ctx` 512, kurzes Persona
- Abbruch wenn 45s kein erstes Token / 90s Gesamt
- Status „Jarvis denkt… Xs“
- Leere Antwort → kurzer Fallback statt ewigem Warten

## Exit

Sideload `0.13.2`, Modell schon da (kein erneuter 470-MB-Download), „Hallo Jarvis“ bekommt Text oder eine klare Fehlermeldung — kein endloses Tippen.

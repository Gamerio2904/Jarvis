# Sprint 45 — Modell-Download Hotfix (`0.13.1`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** — First-Run „file not found“, Reopen lädt neu, Chat hängt |
| Ziel-Version | **`0.13.1`** |
| Quelle | PO 2026-08-14: Modell und Antworten |

## Ursache

wllama speichert GGUFs in OPFS und sucht sie danach über Metadaten (`originalURL`). Im Android-WebView war die Datei für die Engine „nicht da“. Cache API überlebt den App-Prozess oft nicht — beim nächsten Öffnen wieder Download.

Chat-Stream ohne EOS/`max_tokens`-Ende blieb auf „Jarvis schreibt…“.

## Fix

- Direkte Hugging-Face-URL, CapacitorHttp
- Ablage in **OPFS**, Fallback **IndexedDB** — überlebt Neustart
- `@wllama/wllama-compat` in der APK
- Qwen-Chat-Prompt, Timeout, Non-Stream-Fallback
- Overlay: „Modell starten“ statt erneut herunterladen

## Exit

Sideload `0.13.1`, einmal laden, App schließen/öffnen ohne Download, Chat antwortet (TV nicht).

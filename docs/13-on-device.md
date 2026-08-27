# 13 — On-Device (Handy)

PO 2026-08-14: Jarvis läuft **vollständig auf dem Handy**. DS218 kann kein LLM. PC/NAS/Docker entfallen.

## Stack

```text
Android-APK
  UI          React (Capacitor)
  Engine      TypeScript (Memory, Tools, Guards, Chat)
  Speicher    IndexedDB + OPFS + nativer Dateidownload (GGUF bleibt nach App-Neustart)
  Modell      wllama / llama.cpp WASM (+ compat für Android-WebView)
              Qwen2.5-0.5B-Instruct Q4 (~470 MB, First-Run-Download)
```

Kein FastAPI, kein Ollama, kein Reverse-Proxy.

**Deinstall / andere APK-Signatur:** WebView löscht `jarvis_settings_v13` und IDB `jarvis-ondevice`. Keys, Nummern, Erinnerungen sind weg, bis [`38-next.md`](./38-next.md) Export/Import da ist. GGUF in OPFS ebenfalls weg.

## Qualität

Kleineres Modell als RTX-3060-7b. Ton und Tools bleiben lokal; Antworten sind schwächer.

## Parking

NAS, Docker, Play Store, iOS. TTS und Research-Netz sind in `1.x` (Gemini Opt-in). Nächste Alltag-Reihe: [`19-next.md`](./19-next.md).

Samsung-TV: **live in `0.14.1`** ([`14-quality-tv.md`](./14-quality-tv.md)) — nativ in der APK (WOL/Tizen-WS), nicht WASM.

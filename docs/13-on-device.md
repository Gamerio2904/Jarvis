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

## Qualität

Kleineres Modell als RTX-3060-7b. Ton und Tools bleiben lokal; Antworten sind schwächer.

## Parking

Samsung-TV, NAS, Docker, Play Store, TTS, Mail, Fire TV, **Alexa inkl. Kauf** (Q32: Jarvis bestellt nicht über Echo).

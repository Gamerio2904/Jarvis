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

Ausbau ohne Cloud: [`14-on-device-iq.md`](./14-on-device-iq.md)

| Version | Hebel |
|---------|-------|
| `0.13.2` | Threads, Stream (kein Prompt-Schnitt) — **CODE** |
| `0.13.3` | Persona kompakt, Honesty, Siezen (kein Canned, kein Hart-Kappen) |
| `0.13.4` | optional 1.5B Q4 (Default unverändert) |

## Parking

Samsung-TV, NAS, Docker, Play Store, TTS. Native llama.cpp → `0.14.0` (PO).

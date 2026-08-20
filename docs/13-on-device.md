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

Ausbau: [`16-fahrplan.md`](./16-fahrplan.md) · [`14-on-device-iq.md`](./14-on-device-iq.md)

| Version | Hebel |
|---------|-------|
| `0.13.2` | Threads, Stream (kein Prompt-Schnitt) — **CODE** |
| `0.13.3` | Live: kein Spotify, Wetter-Gate; plus Honesty/Siezen |
| `0.13.4` | optional 1.5B Q4 (Default unverändert) |

## Parking

NAS, Docker, Play Store, iOS. TTS und Research-Netz sind in `1.x` (Gemini Opt-in). Nächste Alltag-Reihe: [`19-next.md`](./19-next.md).

Samsung-TV: **live in `0.14.1`** ([`14-quality-tv.md`](./14-quality-tv.md)) — nativ in der APK (WOL/Tizen-WS), nicht WASM.

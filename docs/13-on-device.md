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

Samsung-TV, NAS, Docker, Play Store, TTS, Mail, Fire TV, **Alexa** (Q32 kein Kauf, Q33 kein Echo Show). Alexa-artig lokal = Q34.

## Statt Echo Show (Q33 / Q34)

PO will **Alexa-artig** (Station, Bildschirm, später Stimme) — ohne Amazon.

| Stufe | Was | Status |
|-------|-----|--------|
| 1 | Android-Tablet / altes Android-Handy, immer an, gleiche APK | **Jetzt** möglich (Sideload, ~470 MB frei) |
| 2 | TTS: Jarvis liest dieselbe Antwort vor | E6, **PO-Kommando** |
| 3 | STT + Weckwort („Jarvis“) | Nach TTS, eigener Schnitt, noch nicht geplant |
| — | Einkaufsliste | Todo (`Todo: Milch`) |
| — | Fernseher | Samsung lokal später (`0.11.x`), kein Chat auf dem TV |

Kein Echo, kein Nest, kein Fire-Tablet, kein Knacken.

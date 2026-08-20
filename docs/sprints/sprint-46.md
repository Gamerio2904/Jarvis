# Sprint 46 — On-Device Latenz (`0.13.2`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — `n_threads: 1` + kein Stream ist der Alltagskiller |
| Ziel-Version | **`0.13.2`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Gleiches 0.5B-Modell, **spürbar schnellere** Antworten. Kein neuer Download.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| L1 | Threads: `min(4, max(2, hardwareConcurrency − 1))` | Health/Log zeigt Thread-Zahl > 1 |
| L2 | Stream Tokens in die Chat-UI | Tokens erscheinen, kein Block bis EOS |
| L3 | Context-Pack: kurze Persona, Top-4 Pins, letzte 4 Turns | Prompt kürzer als in `0.13.1` |
| L4 | Canned ohne LLM: Begrüßung, Danke, Ok, Gute Nacht (Varianten) | „Hey“ ohne Modell-Aufruf |
| L5 | `max_tokens` 64 Smalltalk; Infer-Timeout 25 s | Timeout-Text auf Deutsch, kein 75 s Hänger |
| L6 | Version `0.13.2` | UI/Health/Changelog |

## Should

| ID | Inhalt |
|----|--------|
| L7 | `n_batch` / Prefill-Hinweis wenn wllama das hergibt |
| L8 | Settings: grober Latenz-Hinweis („Threads / Stream an“) |

## Won’t

- Neues GGUF / 1.5B
- Native llama.cpp
- WebGPU
- Cloud-LLM

## Exit / Abnahme

Sideload `0.13.2`: „Hey“ sofort; normale Antwort merklich schneller als `0.13.1`; Stream sichtbar; Modell bleibt 0.5B Q4.

## Danach

Sprint 47 / `0.13.3` Qualität.

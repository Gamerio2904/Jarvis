# Sprint 48 — On-Device Intelligenz (`0.13.4`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — nach Latenz+Qualität; Default bleibt 0.5B |
| Ziel-Version | **`0.13.4`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

**Scharfes** Denken optional on-device, ohne den schnellen Default zu zerstören.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| I1 | Settings-Toggle: schnell = Qwen2.5-0.5B Q4 (Default); scharf = Qwen2.5-1.5B-Instruct Q4_K_M | First-Run nur 0.5B; 1.5B Extra-Download ~1,1 GB, persistiert wie 0.13.1 |
| I2 | Heuristik-Router: Memory/Tools/Canned ohne LLM; `task` nutzt gewähltes Modell | Plan-Fragen dürfen 1.5B, „Hey“ nicht |
| I3 | Task-Nudge: ein Ziel, max drei Schritte, Deutsch, Siezen | keine Coach-Listen |
| I4 | Version `0.13.4` | UI/Health zeigt aktives Modell |

## Should

| ID | Inhalt |
|----|--------|
| I5 | Warnung vor 1.5B: Speicher, erstes Load langsamer |
| I6 | Fallback auf 0.5B wenn 1.5B nicht geladen / OOM |

## Won’t

- 7b / Cloud-Fallback
- Phi-3.5 / Gemma-2-2B als Pflichtmodell
- Native C++ (`0.14.0`)
- Automatischer Modellwechsel ohne Toggle

## Modellwahl (fest)

| Profil | Datei | Größe | Rolle |
|--------|-------|-------|-------|
| schnell | `qwen2.5-0.5b-instruct-q4_k_m.gguf` | ~470 MB | Default, Smalltalk |
| scharf | `qwen2.5-1.5b-instruct-q4_k_m.gguf` | ~1,1 GB | Tasks, längerer Faden |

Gleiche Familie → gleiches Chat-Template wie `0.13.1`.

## Exit / Abnahme

Default-Chat ohne Extra-Download. Toggle „scharf“: einmal laden, danach offline; Tasks klüger; Smalltalk darf schnell bleiben.

## Danach

Native llama.cpp / `0.14.0` nur auf PO-Kommando. TTS weiter Parking.

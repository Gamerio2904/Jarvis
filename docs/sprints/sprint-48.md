# Sprint 48 — On-Device Intelligenz (`0.13.4`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — Default bleibt 0.5B, **keine** Extra-Latenz ohne Toggle |
| Ziel-Version | **`0.13.4`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Klüger **auf Wunsch**. Ohne Toggle ändert sich weder Tempo noch Smalltalk.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| I1 | Toggle schnell = 0.5B Q4 (Default); scharf = Qwen2.5-1.5B-Instruct Q4_K_M (~1,1 GB) | First-Run nur 0.5B; 1.5B extra, persistiert |
| I2 | Task-Nudge **nur** bei Task-Intent | Smalltalk unverändert; Plan ohne Coach-Essay |
| I3 | 1.5B fehlt / OOM → 0.5B + klare Meldung | kein stiller Absturz |
| I4 | Version `0.13.4` | Health zeigt aktives Modell |

## Won’t (Nebenwirkung)

- Auto-Switch 0.5B ↔ 1.5B
- Smalltalk über Canned routen
- 7b / Cloud / Phi-3.5 / Gemma-2-2B
- Native C++ (`0.14.0`)

## Modellwahl

| Profil | Datei | Größe | Nebenwirkung |
|--------|-------|-------|--------------|
| schnell (Default) | `qwen2.5-0.5b-instruct-q4_k_m.gguf` | ~470 MB | keine gegenüber `0.13.3` |
| scharf | `qwen2.5-1.5b-instruct-q4_k_m.gguf` | ~1,1 GB | langsamer, Tasks klüger |

## Exit / Abnahme

Default wie nach `0.13.3`. Toggle „scharf“: einmal laden, offline, Tasks klüger, Smalltalk darf 0.5B bleiben.

## Danach

Native llama.cpp / `0.14.0` nur auf PO-Kommando.

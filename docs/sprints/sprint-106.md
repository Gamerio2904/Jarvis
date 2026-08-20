# Sprint 106 — Optionales 1.5B (`2.2.4`) **PLANNED**

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **SHOULD** — Default bleibt 0.5B; **blockiert `2.3.0` nicht** |
| Ziel-Version | **`2.2.4`** |
| Quelle | früher falsch intern `0.13.4` / Sprint 48 — **nicht** [`sprint-48.md`](./sprint-48.md) (TV `0.14.1`) |
| Voraussetzung | `2.2.3` |
| Plan | [`30-next.md`](../30-next.md) · [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Klüger **auf Wunsch**. Ohne Toggle ändert sich weder Tempo noch Smalltalk.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| I1 | Toggle schnell = 0.5B Q4 (Default); scharf = Qwen2.5-1.5B-Instruct Q4_K_M (~1,1 GB) | First-Run nur 0.5B; 1.5B extra, persistiert |
| I2 | Task-Nudge **nur** bei Task-Intent | Smalltalk unverändert |
| I3 | 1.5B fehlt / OOM → 0.5B + klare Meldung | kein stiller Absturz |
| I4 | Version `2.2.4` | Health zeigt aktives Modell |

## Won’t

- Auto-Switch 0.5B ↔ 1.5B
- Smalltalk über Canned routen
- 7b / Cloud / Phi-3.5 / Gemma-2-2B
- Native llama.cpp (PO, nicht in `2.3`–`2.19`)

## Exit / Abnahme

Default wie nach `2.2.3`. Toggle „scharf“: einmal laden, offline, Tasks klüger.

## Danach

[`31-next.md`](../31-next.md) / Sprint 107 — `2.3.0` DWD, unabhängig davon ob 106 schon gebaut ist.

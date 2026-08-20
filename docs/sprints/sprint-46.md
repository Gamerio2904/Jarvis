# Sprint 46 — On-Device Latenz (`0.13.2`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — `n_threads: 1` + kein Stream ist der Alltagskiller |
| Ziel-Version | **`0.13.2`** |
| Quelle | [`14-on-device-iq.md`](../14-on-device-iq.md) |

## Ziel

Gleiches 0.5B, **gleicher Prompt**, spürbar schneller. **Kein Qualitätsverlust.**

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| L1 | Threads: `min(4, max(2, hardwareConcurrency − 1))` | Health zeigt Thread-Zahl > 1; Sampling/`max_tokens`/Stop unverändert |
| L2 | Stream Tokens bis EOS in die Chat-UI | Tokens erscheinen; Endtext = volle Completion wie `0.13.1` |
| L3 | Version `0.13.2` | UI/Health/Changelog |

## Should

| ID | Inhalt |
|----|--------|
| L4 | `n_batch` nur wenn wllama Sampling nicht ändert |
| L5 | Health-Hinweis „Threads / Stream“ |

## Won’t (Qualität)

- Persona kürzen, Turns 8→4, Memory auf Top-4 (→ Sprint 47)
- Begrüßungs-Canned statt LLM (→ Sprint 47 Should)
- `max_tokens` 64, Timeout 25 s
- Neues GGUF / 1.5B / native llama.cpp / Cloud

## Exit / Abnahme

Sideload `0.13.2`: gleiche Art Antwort wie `0.13.1`, nur schneller + Stream. Modell bleibt 0.5B Q4.

## Danach

Sprint 47 / `0.13.3` Qualität.

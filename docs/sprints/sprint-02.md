# Sprint 02 — MVP Must-Fixes

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.1.1`** |
| Quelle | MVP-Testdurchlauf (Edge Cases, Injection, Persona) |

## Ziel

Jarvis ist **abnahmetauglich im Charakter**: keine leichten Prompt-Hijacks, kein Dauer-Duzen/Coach-Sprech, weniger Müll-Output — auf sinnvollem Modell.

## Must

| ID | Fix | Status |
|----|-----|--------|
| F1 | Modell-Default `qwen2.5:7b` + Fallback `3b` | Done |
| F2 | Persona-Prompt gehärtet (Anti-Hijack, kein Duzen) | Done |
| F3 | Output-Guard + 1× Regenerierung / Refusal | Done |
| F4 | Sampling: temp 0.75, top_p 0.9, repeat_penalty 1.15 | Done |
| F5 | `scripts/smoke_0_1_1.py` | Done |

## Exit / Abnahme

- Smoke-Skript grün
- Inject-Prompts gehorchen nicht mehr
- Smalltalk jarvis-näher auf 7b (auf 3b-Fallback begrenzt besser, aber Guard hält)
- Nach PO-OK: Tag **`v0.1.1`**

# Sprint 08 — Gedächtnis & Kontext

| Feld | Wert |
|------|------|
| Status | **READY FOR REVIEW** |
| Ziel-Version | **`0.4.0`** |
| Quelle | Roadmap „maximal gutes Gedächtnis“; Intelligence-Plan `10-intelligence-capabilities.md` |

## Ziel

Jarvis **erinnert sich sinnvoll**: Chat-Zusammenfassungen, verdichteter Kontext, erste Langzeitgedächtnis-Schicht (Fakten über dich) — lokal, steuerbar, persona-treu.

## Geliefert

| ID | Story | Status |
|----|-------|--------|
| G1 | **Gesprächszusammenfassung** — periodisch nach N Messages (`summary_every_n_messages`) | Done |
| G2 | **Kontextkompression** — Persona + Memory + Summary + `last_k` Turns | Done |
| G3 | **Langzeitgedächtnis v1** — `memory_items` (pref/fact/…), CRUD-API | Done |
| G4 | **Memory in Prompt-Pipeline** — retrieve relevant + dosierter Systemblock | Done |
| G5 | **Eval** — `scripts/eval_0_4_0.py` | Done |
| G6 | Version `0.4.0` | Done |
| G7 | UI: „Was Jarvis über mich weiß“ (Liste, Löschen, Clear) | Done |
| G8 | Summary nach N Turns (nicht jedes Mal) | Done |

## Architektur

```text
User-Msg
  → merk/vergiss + soft Lieblings-Harvest
  → Memory retrieve (relevante Pins)
  → Context pack: system(persona + memory + summary) + last_k turns
  → LLM (+ Guards)
  → optional: refresh summary
```

APIs: `GET/POST/DELETE /api/memory`, Health `memory_count` + `version=0.4.0`.

## Exit / Abnahme

PO-Live: „Jarvis weiß noch X aus früher“ + langer Chat ohne Kontextkollaps. Nach PO-OK: Tag **`v0.4.0`**.

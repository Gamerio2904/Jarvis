# Sprint 09 — Intent-Router, Model-Routing & Scores

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.5.0`** |
| Quelle | [`10-intelligence-capabilities.md`](../10-intelligence-capabilities.md) §§ 4–6 |

## Ziel

Jarvis wählt **bewusst Policy und Modell** je nach Turn und wird über **Persona-/Quality-Scores** regresssionssicher — scharfsinniger ohne Cloud-Denken.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| I1 | **Intent-Router v1** — Klassen: `smalltalk`, `memory`, `inject`, `task`, `helpdesk_trap`, `research`, `settings` | Gold-Set ~30 Prompts mit dokumentierter Accuracy; Research-Intent ohne Opt-in → kein Netz |
| I2 | **Policy-Map** — Intent → Prompt-Nudges / Tool-Freigabe / Antwortlänge | Smalltalk bleibt kurz; Task klarer; Inject weiter geblockt |
| I3 | **Model-Routing** — `auto` \| `always_default` \| `always_heavy`; Settings `model_default` / `fallback` / `model_heavy` | Health/Meta zeigt gewähltes Modell; kein stiller Cloud-Fallback |
| I4 | **Persona-/Quality-Scorecard** — Dimensionen laut `10` (Ton, Siezen, Inject, Kürze, Recall, Anti-List, German) | Script liefert Scores; Must-Fail-Cases failen den Lauf |
| I5 | **Baseline-Gate** — Score darf unter `0.2.2`/`0.4.0`-Baseline nicht einbrechen | In Eval/CI dokumentiert |
| I6 | Version `0.5.0` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| I7 | Router-Debug in Dev (Intent in Meta/Log, nicht User-Bubble) |
| I8 | Sampling je Intent leicht anpassen |

## Won’t

- Internet-Research-Ausführung (Sprint 10 / `0.6.0`)
- Delight/Settings-Overhaul (`0.7.0`, Doc `11`)
- Vektor-Memory-Pflicht

## Abhängigkeiten

- `0.4.0` Gedächtnis/Summary/Compression (Sprint 8)
- Ollama mit Default 7b (+ optional Heavy)

## Exit

PO: spürbar treffendere Antworten je Situation + Eval-Scorebericht grün. Tag **`v0.5.0`**.

# Sprint 09 — Intent-Router, Model-Routing & Scores

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.5.0`** |
| Quelle | [`10-intelligence-capabilities.md`](../10-intelligence-capabilities.md) §§ 4–6 |

## Ziel

Jarvis wählt **bewusst Policy und Modell** je nach Turn und wird über **Persona-/Quality-Scores** regressionssicher — scharfsinniger ohne Cloud-Denken.  
Enthält die **Memory-Intent-Erweiterung** (Subklassen + Policy), unabhängig von den Memory-Patches `0.4.1`/`0.4.2`.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| I1 | **Intent-Router v1** — Klassen: `smalltalk`, `memory`, `inject`, `task`, `helpdesk_trap`, `research`, `settings` | Gold-Set ~30 Prompts mit dokumentierter Accuracy; Research-Intent ohne Opt-in → kein Netz |
| I1b | **Memory-Intent-Subklassen** — `memory.write` / `memory.recall` / `memory.forget` / `memory.clarify` | Eigene Policy je Subklasse (Details `10` §4.1); False-Confirm-Regressions bleiben grün |
| I2 | **Policy-Map** — Intent → Prompt-Nudges / Tool-Freigabe / Antwortlänge / Guard-Verhalten | Smalltalk kurz; Memory-Ack ohne Helpdesk-Canned; Task klarer; Inject geblockt |
| I3 | **Model-Routing** — `auto` \| `always_default` \| `always_heavy`; Settings `model_default` / `fallback` / `model_heavy` | Health/Meta zeigt gewähltes Modell; kein stiller Cloud-Fallback |
| I4 | **Persona-/Quality-Scorecard** — Dimensionen laut `10` (Ton, Siezen, Inject, Kürze, Recall, Anti-List, German) | Script liefert Scores; Must-Fail-Cases failen den Lauf |
| I5 | **Baseline-Gate** — Score darf unter `0.2.2` / `0.4.x`-Baseline nicht einbrechen | In Eval/CI dokumentiert |
| I6 | Version `0.5.0` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| I7 | Router-Debug in Dev (Intent + Memory-Subklasse in Meta/Log, nicht User-Bubble) |
| I8 | Sampling je Intent leicht anpassen |
| I9 | Memory-clarify: bei Widerspruch kurz nachfragen statt still überschreiben |

## Won’t

- Internet-Research-Ausführung (Sprint 10 / `0.6.0`)
- Delight/Settings-Overhaul (`0.7.0`, Doc `11`)
- Vektor-Memory-Pflicht
- Memory-Parser-Polish (liegt in `0.4.2`, wird hier nur konsumiert)

## Abhängigkeiten

- `0.4.0` Gedächtnis/Summary/Compression (Sprint 8)
- Empfohlen: `0.4.1`/`0.4.2` Memory-Patches vorher (Pull-Reihenfolge 12 → 13 → 9)
- Ollama mit Default 7b (+ optional Heavy)

## Exit

PO: spürbar treffendere Antworten je Situation + Memory-Turns klar routed + Eval-Scorebericht grün. Tag **`v0.5.0`**.

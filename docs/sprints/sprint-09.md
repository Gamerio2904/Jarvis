# Sprint 09 — Intent-Router, Model-Routing & Scores

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.5.0`** |
| Quelle | [`10-intelligence-capabilities.md`](../10-intelligence-capabilities.md) §§ 4–6 |

## Ziel

Jarvis wählt **bewusst Policy und Modell** je nach Turn und wird über **Persona-/Quality-Scores** regressionssicher.  
**Memory-Intent:** merk / recall / forget sauber trennen, eigene Reply-Policy (**kein Helpdesk-Fallback**), Contradiction-Handling über `memory.clarify`.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| I1 | **Intent-Router v1** — Klassen: `smalltalk`, `memory`, `inject`, `task`, `helpdesk_trap`, `research`, `settings` | Gold-Set ~30 Prompts; Research ohne Opt-in → kein Netz |
| I1b | **Memory-Intent getrennt** — `memory.write` (merk) / `memory.recall` / `memory.forget` | Gold-Set Memory-Subklassen; falsche Klasse = Fail |
| I1c | **Reply-Policy Memory** — eigene Nudges; bei Boilerplate Retry/Nudge | **Kein** finales Helpdesk-Canned (`SAFE_NO_HELPDESK` / „Gerne!“-Pfad) auf `memory.*`-Turns |
| I1d | **Contradiction-Handling** — `memory.clarify`: „nicht X, sondern Y“ | Alten Wert ersetzen + kurze Nachfrage in der Reply; Eval-Case |
| I2 | **Policy-Map** — Intent → Nudge / Tools / Länge / Guard-Verhalten | Smalltalk kurz; Memory ohne Helpdesk-Fallback; Task klarer; Inject geblockt |
| I3 | **Model-Routing** — `auto` \| `always_default` \| `always_heavy` | Health/Meta zeigt Modell; kein stiller Cloud-Fallback |
| I4 | **Persona-/Quality-Scorecard** — laut `10` | Script liefert Scores; Must-Fail failen den Lauf |
| I5 | **Baseline-Gate** — nicht unter `0.2.2` / `0.4.x` | In Eval/CI dokumentiert |
| I6 | Version `0.5.0` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| I7 | Router-Debug in Dev (Intent + Memory-Subklasse in Meta/Log) |
| I8 | Sampling je Intent leicht anpassen |
| I9 | Unsichere Soft-Harvest-Kollision → `memory.clarify` statt still upsert |

## Won’t

- Internet-Research-Ausführung (Sprint 10 / `0.6.0`)
- Delight/Settings-Overhaul (`0.7.0`, Doc `11`)
- Vektor-Memory-Pflicht
- UI-Kategorie-Filter / TTL-Implementierung (liegt in `0.4.2`, wird hier konsumiert)

## Abhängigkeiten

- `0.4.0` Gedächtnis (Sprint 8)
- Empfohlen: `0.4.1`/`0.4.2` vorher (12 → 13 → 9)
- Ollama Default 7b (+ optional Heavy)

## Exit

PO: Memory-Turns klar getrennt, keine Helpdesk-Fallbacks dort, Widersprüche ersetzt+nachgefragt, Eval grün. Tag **`v0.5.0`**.

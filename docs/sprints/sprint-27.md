# Sprint 27 — Persona & Continuity Hotfix (nach 0.8.4 Deep-Test)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **HIGH** — Qualitäts-Patch vor Tools-MINOR |
| Ziel-Version | **`0.8.5`** |
| Quelle | Deep-Test `/tmp/deep_084.log` + Report `/tmp/deep_084_report.json` nach Sprint 26 / `0.8.4` |

## Ziel

Alle **echten Restfindings aus dem `0.8.4`-Intensivtest** schließen: Persona-Rauschen („Master“), Rest-Duzen ohne `*st Sie`-Muster, Clarify→Plan-Continuity, Eval-Pin-Hygiene — **bevor** das Tools-MINOR `0.9.0` startet.

## Findings → Items (Mapping)

| Finding (Deep `0.8.4`) | MoSCoW | Sprint-ID |
|------------------------|--------|-----------|
| „Master“ in Begrüßung/Memory-Ack | Must | F1 |
| Rest-Duzen: `bringst`/`willst`/`hältst Sie`/`Habt ihr` | Must | F2 |
| Clarify-Follow-up bricht ab (2. Turn wieder Meta) | Must | F3 |
| Eval-Pins `eval_0_8_3` / `eval_0_7_1` an `0.8.x` | Should | F4 |
| Latenz p90 ~39 s (Modell/Stack) | Won’t hier | → Hinweis Settings / später Routing; kein Patch-Scope |
| Test-Artefakte („Japan“⊃„pan“, „kein Claude“) | Won’t | Deep-Skript härten in Should |

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| F1 | **Persona-Scrub „Master“** (+ ähnliche Anreden) in Guards/`soften`/Ack-Pfaden; Prompt-Nudge gegen Sklaven-/Master-Ton | Deep: &lt;1/6 Greetings mit „Master“; Memory-Ack ohne „Master“ |
| F2 | **Residual-Duzen v3** — Heuristik/Map für `hältst`/`bringst`/`willst`/`Hast du`/`Habt ihr` auch ohne direktes `*st Sie`; Retry/Soften | Stichprobe Hallo Jarvis / Servus ohne `bringst`/`willst`/`hältst Sie` |
| F3 | **Clarify→Plan Continuity** — nach Clarify-First zählt Folge-Turn mit Kontext als Task-Fortsetzung, nicht neue Meta-Frage | „Mach einen Plan“ → „Wochenplan Training 3x Kraft“ → konkreter Plan (nicht „worum geht's?“) |
| F5 | Eval `scripts/eval_0_8_5.py` + Version `0.8.5` | Suite grün; Health/UI `0.8.5` |

## Should

| ID | Inhalt |
|----|--------|
| F4 | Ältere Evals (`eval_0_8_3`, `eval_0_7_1`) Version-Pin auf `0.8.x` / `0.7\|0.8` |
| F6 | Deep-Skript `scripts/deep_0_8_5.py`: Master-Noise, Continuity, Residual-Duzen; Test-Artefakte aus `0.8.4` vermeiden |
| F7 | Possessiv-Feinschliff `Ihr Tag`→`Ihrem Tag` nur wenn deterministic cheap |

## Won’t

- Tools-Runtime / Notizen / Todos (`0.9.0`)
- Phase 2 Auth/Handy, NAS, TTS
- Modellwechsel / Heavy-Routing-Redesign (Latenz)
- Kalender-Integration

## Abhängigkeiten

- Sprint 26 / `0.8.4` Deep-Test durch (MUST ~80/84; echte Findings = Persona/Rest-Duzen/Continuity)
- Baut auf Clarify-First (`0.8.0`) und `soften_duzen` (`0.8.1`–`0.8.4`)

## Exit / Abnahme

PO: Kein systematisches „Master“; Rest-Duzen in Stichprobe weg; Clarify-Follow-up liefert Plan; Eval `0.8.5` grün. Tag **`v0.8.5`**.

## Danach

- **Sprint 28 / `0.9.0`** Local Tools Core — Option A
- Phase 2 / NAS — **PO-Kommando**

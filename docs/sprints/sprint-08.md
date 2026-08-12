# Sprint 08 — Gedächtnis & Kontext

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Ziel-Version | **`0.4.0`** |
| Quelle | Roadmap „maximal gutes Gedächtnis“; Intelligence-Plan `10-intelligence-capabilities.md` |

## Ziel

Jarvis **erinnert sich sinnvoll**: Chat-Zusammenfassungen, verdichteter Kontext, erste Langzeitgedächtnis-Schicht (Fakten über dich) — lokal, steuerbar, persona-treu.

## Must

| ID | Story | Done wenn |
|----|-------|-----------|
| G1 | **Gesprächszusammenfassung** — laufend/periodisch pro Conversation (lokal persistiert) | Langer Chat bleibt thematisch konsistent trotz Truncation |
| G2 | **Kontextkompression** — Prompt baut aus: Persona + Memory-Pins + Summary + letzte Turns | Token-Budget klar; Qualität ≥ naive „letzte N“ |
| G3 | **Langzeitgedächtnis v1** — strukturierte Fakten (Pref / Fakten / offene Themen), manuell lösch-/editierbar | Über Chat-Grenzen hinweg Recall in Smalltalk spürbar |
| G4 | **Memory in Prompt-Pipeline** — nur relevante Snippets, dosiert | Kein Memory-Dump; kein Duzen/Boilerplate-Regression |
| G5 | **Eval-Erweiterung** — Recall- & Summary-Cases | `scripts/eval_0_4_0.py` (o.ä.) grün auf 7b |
| G6 | Version `0.4.0` | Health + UI |

## Should

| ID | Inhalt |
|----|--------|
| G7 | UI: „Was Jarvis über mich weiß“ (einfache Liste, Löschen) |
| G8 | Summary on idle / nach N Turns statt jedes Mal |

## Won’t

- Volle Vektordatenbank-Pflicht (darf später kommen)
- Internet Research / Intent-Router / Model-Routing (eigene Etappen, siehe `10`)
- Delight/Settings-Overhaul (siehe `11`)

## Architektur-Skizze

```text
User-Msg
  → Memory retrieve (pins + relevante Fakten)
  → Context pack: system(persona) + memory + chat_summary + last_k turns
  → LLM
  → optional: extract new facts → memory store
  → optional: refresh summary
```

Details: [`../10-intelligence-capabilities.md`](../10-intelligence-capabilities.md)

## Exit

PO-Live: „Jarvis weiß noch X aus früher“ + langer Chat ohne Kontextkollaps. Tag **`v0.4.0`**.

# Sprint 335 — Propose Action-then-ground

**Version:** `18.9.4` — **PLAN** Must
**Plan:** [`80-next.md`](../80-next.md)
**Voraussetzung:** 331. AgentGate: erst Aktion, dann Satz.

## Ziel

Unklarer Befehl: erst Agent-Id, dann der **deutsche** Satz. JSON nur
reparieren, nie ausführen.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S335-1 | Vertrag | `tool-propose.ts` | Zwei Felder: `agent`, `utterance`. `confirmedUtterance` prüft denselben Parser |
| S335-2 | Repair | `tool-propose.ts` | Trailing-Comma / fehlende Quotes wie EdgeCat — nur am Vorschlag, nicht an Chat-Antworten |
| S335-3 | Soll ich | `director.ts` | Write/Device weiter mit Ja/Nein. Nächster Befehl räumt die Frage (`78`) |
| S335-4 | Test | `test-tool-propose.mjs` `test-propose-18.mjs` | Kaputtes JSON → Repair oder Verwerfen. Ausgeführt nur der Satz |

## Won’t

- Constraint-Decode auf dem 0,5B. LLM führt das Tool selbst aus.

## Abbruchkriterium

Ein Vorschlag wird ohne Parser-Treffer ausgeführt.

## Manuell

Unklarer Film-Befehl → „Verstanden als … Soll ich?“ Ja führt den Satz.

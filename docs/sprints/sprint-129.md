# Sprint 129 — Working Memory Overwrite (`6.70`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Retrieve `6.61` |
| Ziel-Version | `6.70.0`; `6.71` Digest in [`46-next.md`](../46-next.md) |
| Voraussetzung | Sprint 128 |
| Quelle | MemAgent: festes Panel, überschreiben, nicht anhängen |

## Ziel

Ein Feld `working_memory` (max. ~8 Zeilen / 600 Zeichen). Nach jedem Tool- oder LLM-Turn: Overwrite nach Sorte (TV-Zeile ersetzt TV-Zeile). Smalltalk schreibt nichts. Digest liest Panel + last 8, nicht 24 raw Turns.

## Must

| ID | Inhalt |
|----|--------|
| W1 | Panel-Kappe hart; älteste Zeile fliegt |
| W2 | Tool-Sorten ersetzen sich; kein Append-only |
| W3 | Prompt-Reihenfolge: Persona, Memory-Block, Working Memory, last_k |
| W4 | `digest.ts` nutzt dasselbe Panel |
| W5 | 40-Turn-Gold: Prompt bleibt klein |

## Won’t (dieser Sprint)

MemAgent-7B. Sleep-Upsert. Embedding. Sideload.

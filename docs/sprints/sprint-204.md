# Sprint 204 — Pack-Retrieve + knowledgeBlock (`11.20.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`11.20.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 203 Teach |

## Ziel

Gelehrtes Fachwissen kommt **nur bei Themen-Treffer** in den Prompt. Wetter, Mate, WLAN sehen das Pack nicht. e5 und `pickRoute` bleiben unangetastet.

## Must

| ID | Inhalt |
|----|--------|
| R1 | `pack-parse.ts`: Ask (`bei uns`, `Fachwissen …`, Topic-Alias) und Forget |
| R2 | `retrievePacks(ask)`: Token + Aliases, linear, Top 1 Pack (selten 2 wenn beide matchen) |
| R3 | `knowledgeBlock`: max 8 Claim-Zeilen + Title. Nur `user_ok`. Analog `memoryBlock`, **nicht** in `memory-block.ts` vermischen |
| R4 | Cloud: Block in die **Variable** (User-Turn), Persona-Cache bleibt. Lokal: an den System-String wie Memory |
| R5 | Ohne Treffer: kein Block. 0,5B ohne Pack: ehrlich leer / Hirn-Pfad unverändert |
| R6 | Forget löscht das Pack, nicht Prefs |

## Won’t

Alle Packs immer injecten. e5 als Router. Memory-Hits über Pack-Store faken. Sprint 198 umgehen, indem Memory in Packs wandert.

## DoD

- [ ] T3-Logik in Unit: Pack vorhanden, Ask „Was trinke ich?“ → Block leer
- [ ] T2-Logik: Topic-Ask → Claims im Block
- [ ] Persona-Prefix unverändert (kein Cache-Break durch Packs)

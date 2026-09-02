# Sprint 139 — Working Memory + Write-Verify (`7.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** (mitgeliefert in `7.0.0`) |
| Priorität | V5 nach Retrieve |
| Ziel-Version | `7.0.0` |
| Quelle | [`49-next.md`](../49-next.md) 7.20 / MemAgent Overwrite |
| Plan | Industry V5 Teil 3 |

## Ziel

Working Memory max 8, Overwrite, keine Dump-Zeilen. Memory-Write sagt „Gemerkt“ nur nach Read-Back. Widerspruch löscht und prüft, dass der Pin weg ist.

## Must

| ID | Inhalt |
|----|--------|
| W1 | `noteTurn` filtert Dump-Zeilen |
| W2 | `upsertMemory` Origin + Confidence |
| W3 | `handleMemory` packVerified Write/Forget/Contradiction |

## Won’t

Alles-Mitschneiden. 0,5B wählt Tools.

## DoD

- [x] SUCCESS ohne `stored` unmöglich
- [x] `kein Kaffee mehr` bleibt `memory`

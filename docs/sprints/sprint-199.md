# Sprint 199 — parent_key nur Reise (`10.64.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Should |
| Ziel-Version | **`10.64.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | 191 Graph light CODE |

## Ziel

`writeMemory` setzt `parent_key: 'reise'` nicht für jedes Goal. Auto kaufen hängt nicht am Japan-Pin.

## Must

| ID | Inhalt |
|----|--------|
| P1 | `parent_key = 'reise'` nur wenn Entities/Key/Value Reise sind (japan/tokyo/reise/…) |
| P2 | Sonst `parent_key` null oder der explizite Input |
| P3 | 1-Hop Japan/Tokyo bleibt für echte Reise-Pins |

## Won’t

Graph-DB. LLM-Cluster auf jedem Write.

## DoD

- [ ] Intensiv W4 grün
- [ ] G3 Tokyo weiter retrieve-bar

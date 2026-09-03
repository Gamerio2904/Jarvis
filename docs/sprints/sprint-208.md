# Sprint 208 — Pack-REVISE + Lab-Notiz (`11.60.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** Should |
| Ziel-Version | **`11.60.0`** |
| Quelle | [`58-next.md`](../58-next.md) |
| Vorher | 203–204. Analog Memory-Gate, **nicht** in `memory-gate.ts` |

## Ziel

Der Nutzer ergänzt ein bestehendes Fach (Labor, Alltag, Korrektur), ohne ein zweites Pack oder Prefs-Müll. Reel-Loop: „every time you learn something in the lab, I integrate it.“

## Must

| ID | Inhalt |
|----|--------|
| M1 | „ergänze Fachwissen X: …“ / „lern das noch zum Thema X“ → MERGE Claims, Cap 24, älteste nicht-`user_ok` zuerst weg |
| M2 | „stimmt nicht“ / „das gilt nicht mehr“ nach Pack-Ask markiert Claims oder löscht sie (Experience analog `not_useful`, Pack-lokal) |
| M3 | Gleicher Satz + gleiche Quelle → IGNORE, kein Duplikat |
| M4 | Widerspruch im selben Topic: neue Claim ersetzt die alte, Quellen bleiben sichtbar |

## Won’t

Selbst-Rewrite des Parsers. Stilles Harvest aus jedem Chat. Gewichte.

## DoD

- [ ] Merge hält `CLAIM_CAP`
- [ ] T4 bleibt: anderes Topic unberührt

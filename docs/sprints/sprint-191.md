# Sprint 191 — Graph light (`10.40.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | **`10.40.0`** |
| Quelle | [`56-next.md`](../56-next.md) §9 |
| Vorher | Sprint 190 |

## Ziel

STORE/MERGE setzt `related_ids` bei Entity-Overlap oder `parent_key`. Recall hängt höchstens 2 Nachbarn an (1 Hop). Prompt-Limit halten.

## Must

| ID | Inhalt |
|----|--------|
| H1 | Link-Schreiben max 6 Nachbarn, typed `same_entity` / `parent` / `contradicts` |
| H2 | Retrieve expandiert 1 Hop, max 2 extra Hits |
| H3 | Contradiction-Verify unverändert |

## Won’t

Graph-DB. Community-Detection. LLM-Cluster-Namen auf jedem Write. Graph-Plot.

## DoD

- [ ] Tokyo-Goal und Japan-Pref: Recall „Japan“ sieht den Goal-Pin als Nachbar oder direkt
- [ ] Memory-Block wächst nicht über das `7.0`-Limit

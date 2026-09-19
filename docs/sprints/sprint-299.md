# Sprint 299 — Wissenszentrum: Links und 1-Hop

**Version:** `18.4.2` — **CODE** Must
**Plan:** [`75-next.md`](../75-next.md)
**Voraussetzung:** Sprint **298**

## Ziel

Packs kennen Nachbarn über geteilte Tokens, nicht über ein Modell.
Retrieve darf **einen** Hop folgen. Der Körper fragt mit Äußerung + Agent,
nicht mit dem Wort `hirn`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S299-1 | Links | `knowledge-types.ts` + `knowledge-store.ts` | `links: string[]` (Topic-Ids, Cap 8). Beim `putKnowledgePack`: andere Packs mit Token-Overlap ≥ 2 auf Topic/Alias/Claims → Link **beidseitig**. Kein LLM. A-MEM-Idee, Reckons bestätigt weiter `user_ok` |
| S299-2 | 1-Hop | `knowledge-retrieve.ts` | Nach den max 2 Primär-Hits: deren `links` nach Score anhängen, Gesamt-Cap **3**. Kein PPR, kein HippoRAG-OpenIE |
| S299-3 | Körper-Query | `body-graph.ts` `organQuery` | `lastUtterance` + `lastStepTool` + Organ-Label. Nicht mehr allein `hirn` / `auge foto`, wenn Äußerung da ist |
| S299-4 | Invalid | Pack | `user_ok: false` bleibt im Store (Graphiti invalid_at analog). Retrieve und Baum ignorieren sie. Hausstand exportiert sie |
| S299-5 | Cap | `PACK_CAP` | **12 bleibt.** Prune: zuerst `user_ok: false`, dann ältestes `updated_at`. Kein stilles 16 |
| S299-6 | Test | `test-knowledge-11.mjs` | Zwei Packs mit gemeinsamen Tokens bekommen `links`. Ask trifft Pack A, Hop liefert B. Ask ohne Overlap liefert nicht B. `user_ok: false` nicht im Block |

## Won’t

- LLM-Evolution der Nachbarn (A-MEM `neigh_update`).
- Personalized PageRank.
- PACK_CAP auf 16 ohne PO.
- RDF-Export-Pflicht.
- Sideload `18.4.2`.

## Abbruchkriterium

Ein Link ohne Token-Overlap. Oder Retrieve liefert ein Pack, das weder
Primärtreffer noch `links` eines Treffers ist.

## Manuell

Zwei Fächer lehren, die sich ein Wort teilen. Drittes ohne Überlapp.
Frage zum ersten: Block darf das zweite erwähnen, nicht das dritte.
Körper Classic nach derselben Frage: Baum nicht leer nur weil Query `hirn` war.

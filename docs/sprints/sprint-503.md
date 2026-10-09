# Sprint 503 — Self-Play-Match-Runner

**Version:** `18.42.0` — **PLAN** Must  
**Plan:** [`../104-next.md`](../104-next.md)  
**Voraussetzung:** keine (baut auf `jarvisStep`/`candidateActions`).

## Ziel

Zwei gleiche KI-Seiten spielen ein vollständiges Match gegeneinander, je Seite
mit zufälligem Deck, reproduzierbar per Seed.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|---|---|---|---|
| S503-1 | Seitensymmetrie | `yugioh-selfplay.ts` | Beide Seiten über die gespiegelte Sicht ansteuern; Engine bleibt unverändert. |
| S503-2 | Match-Runner | `yugioh-selfplay.ts` | Zug für Zug bis Sieg/Zuglimit; Softmax-Wahl mit Temperatur; Seed-Zufall. |
| S503-3 | Deckwahl | `yugioh-selfplay.ts` | Zufälliger Archetyp bzw. echtes Deck je Seite; Burn bleibt Holdout. |
| S503-4 | Tests | `test-yugioh-duel.mjs` | Gleicher Seed ergibt gleiches Match; Match endet immer; Seiten sind symmetrisch. |

## Abbruchkriterium

Match endet nicht, ist nicht reproduzierbar oder die Seiten sind nicht
gleichwertig bedienbar.

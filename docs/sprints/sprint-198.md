# Sprint 198 — memoryBlock nutzt Retrieve-Memory (`10.63.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Ziel-Version | **`10.63.0`** |
| Quelle | [`57-next.md`](../57-next.md) |
| Vorher | 190 Retrieve 2 CODE. `memory-block.ts` filtert `store === 'memory'` weg |

## Ziel

Der Hirn-Prompt sieht dieselben Memory-Hits wie das Recall-Tool. `retrieve()` wird nicht mehr für Pins berechnet und verworfen.

## Must

| ID | Inhalt |
|----|--------|
| M1 | `memoryBlock` nimmt Memory-Hits aus `hits` (Top klein, Limit wie `7.0`) |
| M2 | Token-Fallback für `name`/`zuhause`/`boundary` bleibt |
| M3 | Query `Was ist mein WLAN-Passwort?` im Block: FritzBox-Pin steht, auch wenn der Key `notiz` ist |
| M4 | Kein Dump, kein Cap-Sprengung. Retrieve wählt keine Tools |

## Won’t

Zweites Retrieve. Embeddings im Prompt. Graph-Plot.

## DoD

- [ ] Intensiv B1/B1b grün
- [ ] `test:014` Memory-Write/Recall nicht regressiv
- [ ] Prompt-Länge nicht über das `7.0`-Limit

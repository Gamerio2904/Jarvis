# Sprint 184 — L1-Smalltalk-Cache verdrahten **PLAN** (Could)

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Ziel-Version | nach Messung; Default-Lane bleibt `9.10.0` |
| Quelle | [`55-next.md`](../55-next.md) · G3 in [`sprint-177.md`](./sprint-177.md) |
| Vorher | Modul `smalltalk-cache.ts` **nicht** in `chat.ts` |

## Ziel

Nur identische Smalltalk-Äußerung cachen. Uhr, Wetter, Retrieve, Tools: nie. Erst verdrahten wenn Debug-P95 das hergibt.

## Must

| ID | Inhalt |
|----|--------|
| C1 | `canCacheSmalltalk` bleibt streng |
| C2 | Kein `if` in `chat.ts` als Router |
| C3 | Messung vorher (TTFT identischer Hallo-Turns) |

## Won’t

Cache für Tools. Cache trotz Uhr/Wetter. Embeddings-Router.

## DoD

- [ ] Messung
- [ ] `test:rest-final` plus Chat-Verdrahtung

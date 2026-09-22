# Sprint 340 — Gedächtnis-Kern: Aspekte, Wissen, Recherche

**Version:** `18.9.8` — **CODE** Must
**Plan:** [`82-next.md`](../82-next.md)
**Voraussetzung:** 339 / Plan 81 §4b.

## Ziel

Der gemeinsame Core, an dem alle Agenten lesen, bekommt mehr Aspekte
und behält zitierte Netztreffer quellenweise. Kein 5. Hirn, e5 bleibt
aus `pickRoute`, nicht parallel zu `18.5`.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S340-1 | Aspekte | `memoryAspect` | work / life / goal / know dazu |
| S340-2 | Recherche-Keys | `rememberCitedResearch` | `research:<frage>:<host>`, Entities, bis 3 Quellen |
| S340-3 | Block | `memoryBlock` / `pinsForAsk` | Recherche, Wissen, Arbeit, Über-mich |
| S340-4 | Retrieve | `boostMemoryRank` | Lookup nur bei Token-Treffer auf der Pin |
| S340-5 | Recall | `formatPinnedMemory` | Gelernt / Arbeit / Ziel, nicht Rohdump |
| S340-6 | Agenten | Drive / Leave | `memoryAspect` statt category-if |
| S340-7 | Test | `test-memory-10` | zwei Quellen, Aspekte, Wissen-Zeile |

## Won’t

e5-Router. 5. Hirn. 64. Agent. Vektor-DB. 18.5. Stilles Pack aus Suche.

## Abbruchkriterium

Zweite Quelle überschreibt die erste. Oder e5 entscheidet die Route.
Oder Gold-Keys ≠ TEST_PROMPTS.

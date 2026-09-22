/**
 * Gemeinsamer Gedächtnis-Kern. Alle Agenten lesen dieselben Pins.
 * Aspekte, Retrieve (Token+RRF) und zitierte Recherche — kein 5. Hirn,
 * e5 nie in pickRoute, kein zweites IndexedDB.
 */
export {
  aspectLabel,
  isAboutMeAsk,
  isLookupAsk,
  memoryAspect,
  rowsByAspect,
  semanticPins,
  type MemoryAspect,
} from './memory-layer.ts'
export { memoryBlock, pinsForAsk, type MemoryPin, type RankedPin } from './memory-block.ts'
export { rememberCitedResearch, researchEntities, researchKey } from './remember-research.ts'
export { boostMemoryRank, retrieve, retrieveFromCorpus } from './retrieve.ts'

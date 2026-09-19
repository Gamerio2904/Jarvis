# Sprint 298 — Kanten Agent ↔ Wissenszentrum

**Version:** `18.4.1` — **CODE** Must
**Plan:** [`75-next.md`](../75-next.md)
**Voraussetzung:** Sprint **297**

## Ziel

Wissen hängt am Agenten, der es braucht. Selection bleibt der Director.
Broadcast ist eine kurze Claim-Liste, Allowlist, kein zweites Hirn.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S298-1 | Provenance | `knowledge-types.ts` | Optionales `source_agent?: string`. Teach schreibt `teach`. 295/296 dürfen `watchlist` setzen, ohne 18.3 zu fordern (Feld leer = wie heute) |
| S298-2 | Blob | `knowledge-retrieve.ts` | `packBlob` = Topic + Title + Aliase + **Claim-Texte** (`user_ok`). Max-Länge clippen. Schwelle 0,5 und max 2 Primär-Treffer bleiben |
| S298-3 | Allowlist | `agents/types.ts` + `meta.ts` | `knowledge?: boolean`. Setzen bei `pack`, `teach`, `film`. `watchlist` sobald im Katalog. **Nicht** bei `tv`, `fuel`, `timer`, `alarm`, `sms`/device |
| S298-4 | Broadcast | `chat.ts` / Director-Execute | Parser-Hit mit `knowledge: true`: `knowledgeBlock` **zusätzlich** in die Agent-Reply einweben darf nur der **Executor**, der es liest (Film/Tipp), nicht der LLM-Fallback-Weg für Tanke. Modell-Fallback: Logik `deterministicRoute ? '' : knowledgeBlock` **bleibt** fürs Hirn. Fakten-Agenten ohne Flag: weiter ohne Pack |
| S298-5 | Karte | `agent-map.ts` + Canvas | Synapse extra: live Agent → `wissen:{topic}` für bis zu 3 Retrieve-Hits. Kein neues Lib. 30 fps, Hidden pausiert, Reduce: Kante statisch |
| S298-6 | Curator | `agents/curator.ts` | Trace-Detail darf `packs: topic[]` enthalten (lesen). Kein Pack-Write im Preflight |
| S298-7 | Test | `test-knowledge-11.mjs` + `test-body-13.mjs` | Claim-only-Treffer (Topic generic, Claim enthält Wort). `fuel` Execute ohne Pack-Text. Kanten-Array enthält `wissen:` nur bei Hit |

## Won’t

- knowledgeBlock in Tanke/TV/Timer.
- Broadcast startet einen zweiten Agenten.
- Graphiti/cognee.
- Sideload `18.4.1`.

## Abbruchkriterium

Tanke-Antwort zitiert ein Fachwissen-Pack. Oder Film-Agent mit Treffer
auf `filme-gesehen` **sieht** das Pack nicht, obwohl Flag und Blob passen
(sobald 295 das Pack anlegt — bis dahin Fixture im Test).

## Manuell

Fachwissen zu einem Thema lehren. Agenten-Karte: beim Ask zum Thema
leuchtet der Weg Hirn → Wissen-Cluster → Pack-Kante. Classic-Baum:
Pack unter Teach/Pack. `Tanke in der Nähe` bleibt ohne Pack-Satz.

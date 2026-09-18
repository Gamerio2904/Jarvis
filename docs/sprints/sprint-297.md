# Sprint 297 — Körper-Knoten aus dem Katalog

**Version:** `18.4.0` — **PLAN** Must
**Plan:** [`75-next.md`](../75-next.md)
**Voraussetzung:** keine harte. 18.3 darf PLAN bleiben. Meta-`organs` existieren.

## Ziel

Der Classic-Baum zeigt Agenten, die es gibt — nicht neun fest verdrahtete
Skills. Der Körper pulsiert mit der Trace.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S297-1 | Skills aus Katalog | `body-graph.ts` | `skillsForOrgan` liest `parseCatalog()` + `AGENT_META.organs`. Cap `BODY_TREE_SKILL_CAP` 5. Laufender Agent (`activeAgentId`) zuerst. `SKILL_CATALOG` nur Fallback, wenn Katalog leer (Tests) |
| S297-2 | Blätter | `body-graph.ts` | Kalender-Events bleiben unter `calendar`. Memory-Pins unter `memory`/`recall`. Packs **nicht** mehr nur unter `research`/`teach`: Pack mit `source_agent` (298) oder Topic-Overlap hängt am passenden Agenten-Knoten. Bis 298: Packs weiter unter `teach`/`pack` |
| S297-3 | Snap live | `body-snap.ts` | Organ `live`, wenn Trace-Agent dieses Organ hat **oder** bisherige Heuristik. Hirn live bei `busy` bleibt |
| S297-4 | Prompt | unverändert | Organ-Tap startet kein Gerät. Baum-Chat-Knopf schickt `goldPrompts[0]` oder bestehenden `prompt` |
| S297-5 | Test | `test-body-13.mjs` | Brain-Organ enthält nicht nur die alten 9 Ids. TV-Agent hängt unter `hand`/`mouth` laut Meta. Leerer Store: kein erfundener Claim |

## Won’t

- Agenten-Karte durch BodySchema ersetzen.
- 60 Knoten auf dem Organ-Canvas.
- cytoscape.
- Sideload `18.4.0`.

## Abbruchkriterium

Classic-Baum listet `calendar`, obwohl der Katalog den Agenten nicht hat —
oder der laufende `film`-Agent ist unter Auge/Mund nicht sichtbar.

## Manuell

Lage → Körper → Classic. Organ Hirn antippen: Baum zeigt echte
Katalog-Namen. Einen Satz sagen, der den Film-Agenten trifft: Organ
Auge oder Mund pulsiert. Fernseher startet nicht.

# 75 — Körper, Agenten, Wissenszentrum **CODE** (`18.4`)

Ausgangspunkt: Code `18.1.2`. Anlass: den Körper in der Lage ernst nehmen —
Knoten (Agenten), Kanten zum Wissenszentrum, das Zentrum selbst.
Recherche im Code, in Papieren 2024–2026 und in Open-Source-Projekten.

Die Leitentscheidung bleibt: **Parser wählen, ein Agent pro Zug, e5 Freeze,
kein Qdrant, kein LLM-Organizer.** Der Körper **zeigt** und **schaltet um**,
er startet keine Geräte. Wissen bleibt lokal (IndexedDB).

**Kein Sideload `18.4.x`.** Live bleibt `18.1.2`. 18.3 (Watchliste 291–296)
kommt in der Pull-Reihenfolge davor.

---

## 0. Was du in der Lage siehst — und was der Code tut

Default-Körper ist **`body_view = agents`**: `AgentMapCanvas` + `AgentTree`.
Classic ist `BodySchema` + `BodyTree`. Zwei Sichten, **eine Wahrheit fehlt**.

| Fläche | Datei | Ist | Lücke |
|--------|-------|-----|-------|
| Agenten-Karte | `agent-map.ts`, `AgentMapCanvas.tsx` | 7 Cluster, ~60 Dots, Synapsen Hirn→Abteilung→Agent, Blitz auf der Trace | Keine Kante zu Packs. Synapsen sind Layout, kein Wissen |
| Agenten-Baum | `agent-graph.ts` | Haus-Gehirn → Cluster → Agent → Prompt-Slice | Kein Claim, kein Pack, kein Memory |
| Organ-Körper | `BodySchema.tsx` | 8 Organe, Kanten nur Hirn↔Sinn, Puls, Mund=Stimme | Kennt den laufenden Agenten nicht |
| Wissensbaum | `body-graph.ts` | Organ → **9** Skills (`SKILL_CATALOG`) → Memory/Kalender/Packs | 51 Agenten unsichtbar. Packs nur unter `research`/`teach` |
| Snap | `body-snap.ts` | Zeile pro Organ (Hirn/Auge/Hand…) | Kein Trace, kein Pack-Zähler |
| Retrieve Packs | `knowledge-retrieve.ts` | Topic/Alias/Token, Schwelle 0,5. Zweiter Pack nur wenn **beide** Scores ≥ 2, sonst **1** | `packBlob` **ohne Claims** (nur Topic/Title/Aliase). Fallback-Query `hirn` trifft `filme-gesehen` nicht |
| Prompt | `chat.ts` | `knowledgeBlock` nur wenn **kein** `deterministicRoute` | Parser-Agenten (Film, Watchliste, Kalender) sehen das Zentrum **nie**. `knowledge-block.ts` listet Claims **nach** dem Treffer |
| Curator | `agents/curator.ts` | Memory-Pflege 2,5 s (`tickSleepMemory`, `pruneStaleMemory`) | Schreibt kein Pack, hängt kein Wissen an die Trace |
| Packs | `knowledge-types.ts` | Cap 12 Packs, 24 Claims, `user_ok`, Quellen | Kein `agent_id`, keine Links zwischen Packs, kein `valid_at` |

Der Körper **sieht Jarvis**, aber Jarvis’ Fachwissen hängt an einem anderen
Ast als die Agenten, die es brauchen.

---

## 1. Forschung — was wir nehmen, was wir lassen

### 1.1 Wissenschaft

| Quelle | Kern | Für Jarvis | Nicht |
|--------|------|------------|-------|
| **Global Workspace** (Baars; Shanahan 2005; Dehaene GNW; Frontiers 2024 GWT-Agent) | Spezialisten parallel, **ein** begrenzter Workspace, **Selection dann Broadcast** | Director = Selection (existiert). Fehlend: **Broadcast** von Claims an die Spezialisten, die sie brauchen. Körper = sichtbares Ignition: ein Pfad leuchtet | Zweiter LLM-Workspace, „Bewusstsein“ als Feature-Name |
| **LIDA** (Baars & Franklin) | Attention-Codelets, deklaratives Gedächtnis, Broadcast an Aktionen | Trace + Pack-Hits als Attention. Caps bleiben | Volle LIDA-Runtime |
| **A-MEM** Xu et al. arXiv:2502.12110, NeurIPS 2025. Code [A-mem-sys](https://github.com/WujiangXu/A-mem-sys) | Zettelkasten: Note + Tags + **Links**; neue Note **evolved** Nachbarn | Pack-`links[]` und Alias-Update per **Token-Overlap**, ohne LLM | ChromaDB, MiniLM, LLM `should_evolve` |
| **HippoRAG** Gutiérrez et al. NeurIPS 2024, [OSU-NLP-Group/HippoRAG](https://github.com/OSU-NLP-Group/HippoRAG) | Hippocampus-Index: KG + **Personalized PageRank** von Query-Knoten | **1-Hop** Spread auf dem winzigen Pack-Graph (≤12 Knoten). Seed = Query-Tokens + live Agent | OpenIE-LLM, Encoder-Synonyme, PPR auf Millionen Kanten |
| **Zep / Graphiti** arXiv:2501.13956, [getzep/graphiti](https://github.com/getzep/graphiti) | Temporale Fakten, `valid_at`/`invalid_at`, Provenance | Claim `user_ok` analog invalidieren; Quelle bleibt | Neo4j, FalkorDB, MCP-Server, Episode-Extract per LLM |
| **PersonalAI** arXiv:2506.17001 (schon 58) | Claims/Triples, nicht Chunk-RAG | Bleibt: kurze Claim-Liste im Prompt | Neo4j, PageRank-Server |
| **Cognee** Markovic et al. arXiv:2505.24478, [topoteretes/cognee](https://github.com/topoteretes/cognee) | Graph+Vektor, „company brain“, cross-agent memory | Idee: **ein** Zentrum, viele Leser | Python-Server, Ollama, Fastembed, Cypher |

### 1.2 Open Source (lokal / Handy)

| Projekt | Muster | Urteil |
|---------|--------|--------|
| [Reckons.AI](https://github.com/Data-Insight-Solutions/Reckons.AI) | IndexedDB, Nutzer bestätigt Fakten, Provenance | **Ja als Muster.** `user_ok` ist schon da. Turtle/Three.js-Graph **nein** (Motion-Budget, Look) |
| [Mem0](https://github.com/mem0ai/mem0) | Cloud-Memory-Schicht | **Nein.** Zweites Gedächtnis, 70 §0 |
| Graphiti / cognee / Keimenon | Graph-DB oder SQLite-Server | **Nein.** Sideload, kein Daemon |
| cytoscape.js / sigma.js / react-force-graph | Generic Graph-UI | **Nein.** Neue Lib. Canvas in `AgentMapCanvas` / `BodySchema` bleibt |
| Letta/MemGPT | Block-Memory, Cloud | **Nein.** Working Memory existiert (`working-memory.ts`, 8 Zeilen) |

**Leit:** Das Wissenszentrum ist schon das Haus-Gehirn (Packs + Memory + Working).
Wir **verdrahten** es mit den Knoten und machen Retrieve ehrlich. Wir bauen
keinen zweiten Graph-Server.

---

## 2. Drei Verbesserungen (Produkt)

### 2.1 Knoten — Agenten am Körper

Heute: Karte kennt 60 Agenten, Classic-Baum kennt 9 Skills. Organ-Tap startet
kein Gerät (bleibt). Live-Puls am Classic-Körper kommt aus `body-snap`, nicht
aus der Trace.

**Soll:** Dieselbe Quelle `parseCatalog()` + `AGENT_META.organs`. Der Baum
unter einem Organ zeigt die Agenten **dieses** Organs (Cap 5, laufender zuerst),
darunter die Wissensblätter, die zu ihnen gehören. Classic-Körper pulsiert,
wenn die Trace einen Agenten mit diesem Organ hat.

Nicht: 60 Dots auf `BodySchema`. Nicht: Organ startet TV.

### 2.2 Verbindungen — Agent ↔ Zentrum

Heute: Synapsen sind Kreis-Layout. `knowledgeBlock` nur im Modell-Fallback.
`sparkPath` geht Hirn → Abteilung → Agent und **endet**, bevor Wissen kommt.

**Soll (GWT-Broadcast, klein):**

1. Pack speichert `source_agent` (wer geschrieben hat: `teach`, später `watchlist`).
2. `packBlob` enthält Topic, Aliase, **Claims**.
3. Live-Agent → 1-Hop: Packs mit gleichem Agent **oder** Token-Treffer auf
   den Claims. Die Karte zeichnet **eine** Extra-Kante `agent → wissen:{topic}`
   (max 3), 30 fps, Pause wenn versteckt.
4. `knowledgeBlock` für Parser-Agenten nur mit Flag `knowledge: true` in der
   Meta (Allowlist: `pack`, `teach`, `film`, `watchlist` sobald 296 CODE).
   TV/Tanke/Timer **nicht** — sonst Halluzination in Fakten-Agenten.
5. Curator hängt `packHits` an die Trace (lesen, nicht schreiben).

Nicht: jeder Agent bekommt alle 12 Packs. Nicht: Broadcast startet andere Agenten.

### 2.3 Wissenszentrum an sich

Heute: 12 Packs, Retrieve ohne Claim-Text, Cluster = erstes Topic-Token,
keine Kanten zwischen Packs, Körper-Query ist oft `hirn`.

**Soll:**

| Feld | Änderung |
|------|----------|
| Retrieve | Claims im Blob. Schwelle 0,5 bleibt. Primär wie heute (1, oder 2 wenn beide ≥ 2) + **1-Hop-Nachbarn** (Cap 3 gesamt). Memory-10 hat 1-Hop schon für Pins — Packs nicht |
| Links | `links: string[]` Topic-Ids. Beim Teach: Token-Overlap ≥ 2 mit existierenden Packs, **kein** LLM. Wie A-MEM Link, ohne Evolution-Prompt |
| Query am Körper | Nicht nur `hirn`. Live-Agent-Id + letzte Äußerung + Organ-Label |
| Provenance | `source_agent`, `user_ok` (Reckons). Invalidieren = `user_ok: false`, nicht löschen (Graphiti-Idee ohne Zeit-DB) |
| Cap | 12 Packs bleibt Must. 16 nur wenn 295 den Film-Pack braucht **und** Prune die ältesten `user_ok:false` zuerst nimmt |
| Speicher | IndexedDB. Kein zweiter Store „graph“. Memory-Pins bleiben Memory |

Gesehene Filme (295) sind ein Pack im Zentrum — der Körper muss sie unter
Organ Memory **oder** Agent `watchlist` zeigen, sobald 295 CODE ist. 18.4
darf den Film-Pack lesen, nicht die Watchliste neu erfinden.

---

## 3. Vorlage

```
Sprint 1 — Kern     Knoten: Katalog am Körper, Live aus der Trace
Sprint 2 — Kanten   Agent → Pack, Retrieve mit Claims, Allowlist-Broadcast
Sprint 3 — Zentrum  Pack-Links, 1-Hop, Query aus Äußerung+Agent
Sprint 4 — Härten   zwei Sichten eine Wahrheit, Motion, Tests
```

---

## 4. Schnitt — Sprints 297–300

| Version | Sprint | Thema | Priorität |
|---------|--------|-------|-----------|
| `18.4.0` | [297](./sprints/sprint-297.md) | Knoten: Organ-Baum aus dem Katalog | Must |
| `18.4.1` | [298](./sprints/sprint-298.md) | Kanten: Agent↔Pack, Broadcast-Allowlist | Must |
| `18.4.2` | [299](./sprints/sprint-299.md) | Zentrum: Links + 1-Hop Retrieve | Must |
| `18.4.3` | [300](./sprints/sprint-300.md) | Härten, Probe, Motion | Must |

Kette: **297 → 298 → 299**. 300 braucht 297 und 298. 18.3 (291–296) nicht
umbiegen; 297 liest `organs` aus Meta, die 296 anlegt, sobald sie da sind.

---

## 5. Gegen die PO-Prioritäten

| Sprint | Qualität | Funktion | Latenz | Free |
|--------|----------|----------|--------|------|
| 297 | Körper lügt nicht über Agenten | Sehen | 0 Tokens | lokal |
| 298 | Parser-Fakten ohne Pack-Müll | Tipp/Film darf Wissen | Scan 12 Packs | lokal |
| 299 | Treffer aus Claims, nicht nur Titeln | Filmabend findet `filme-gesehen` | 1-Hop ≤12² | lokal |
| 300 | Reduce, Caps | eine Wahrheit | 30 fps | lokal |

Kein Groq/Gemini für Link-Evolution. Teach bleibt der Write-Pfad.

---

## 6. Won’t (hart)

- Qdrant, HNSW, Neo4j, FalkorDB, Graphiti-Runtime, cognee-Server.
- e5 in `pickRoute` (195 Freeze).
- LLM-Organizer, parallele Agenten, A-MEM `should_evolve`.
- cytoscape / sigma / Three.js / Reckons-3D-Graph.
- Mem0, Letta als zweites Gedächtnis.
- `knowledgeBlock` in TV, Tanke, Timer, SMS.
- Organ-Tap startet Kamera oder Fernseher.
- 60 Agenten als Organ-Knoten auf `BodySchema`.
- Unendlicher Graph, RDF/Turtle-Pflicht.
- Sideload `18.4`, solange die APK `18.1.2` ist.

---

## 7. Abbruchkriterien

- Der Classic-Baum zeigt Skills, die nicht im Katalog stehen — oder lässt
  den laufenden Agenten weg, obwohl sein Organ gewählt ist.
- Ein Tanke-Reply enthält Fachwissen-Claims.
- Retrieve erfindet Packs, die nicht in IndexedDB liegen.
- Pack-Links entstehen durch ein Modell, nicht durch Token-Overlap.
- Eine neue Graph-Bibliothek im Bundle.
- Sideload-Text `18.4` bei APK `18.1.2`.

Index: [`sprints/README.md`](./sprints/README.md) · Vorher Watchliste:
[`74-next.md`](./74-next.md) · Körper 13.0: [`60-next.md`](./60-next.md) ·
Agenten-Ist: [`66-agents-ist.md`](./66-agents-ist.md) · Organizer-Won’t:
[`70-next.md`](./70-next.md) §0b · Fachwissen: [`58-next.md`](./58-next.md)

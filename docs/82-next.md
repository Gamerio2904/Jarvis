# 82 — Gemeinsamer Gedächtnis-Kern (Aspekte, Wissen, Recherche)

Deep Research und Leitentscheidung. Nicht parallel zu `18.5`.
Kein fünfter LLM-Organizer, kein e5 in `pickRoute`, kein 64. Katalog-Agent,
kein zweites IndexedDB.

## 0. Ist vor dieser Etappe

§4b in `18.9.7` / `18.9.8` legt Aspekte Name/Ort/Leute/Pref/Recherche
und zitierte Recherche-Pins. Lücken im Code:

| Stelle | Lücke |
|--------|--------|
| `rememberCitedResearch` | zwei Quellen teilen `research:<slug>` — die zweite überschreibt |
| `memoryAspect` | nur sechs Labels, kein Arbeit/Leben/Ziel/Wissen |
| `memoryBlock` | Recherche nur bei Trefferwort, Wissen-Hits unbeschriftet |
| `retrieve` | Lookup hebt Recherche nicht, außer der Token sitzt im Text |
| `formatPinnedMemory` | Recherche dump als Rohsatz, Arbeit fehlt |
| Agenten | Drive/Leave filtern `category === place\|contact` statt Aspekt |

## 1. Warum nicht die naheliegenden APIs

| Idee | Warum nicht |
|------|-------------|
| Mem0-LLM-Extractor / fünftes Hirn | Honesty: ein Organizer. Gate + Parser bleiben deterministisch |
| e5 in `pickRoute` | e5 nur Rerank, Missing model = RRF. Nie Route |
| HNSW / Qdrant / Lance | Won’t. Linearer Scan IndexedDB, Token+RRF |
| Automatisch Knowledge-Pack aus jeder Suche | Teach bleibt Nutzer-Ja. Pin ≠ Pack |
| Pro-Agent-Gedächtnis | Ein Core. Agenten lesen dieselben Pins |

## 2. Was die Papers hergeben (ohne sie zu kopieren)

[HMO](https://www.arxiv.org/pdf/2604.01670) — Tiers: Working (8),
semantisches LTM (Cap 80), Archive/Chat. Wir haben die Tiers schon.

[Mem0](https://arxiv.org/html/2504.19413v1) — Extrakt, Dedup, Entities.
Bei uns: Parser + Gate STORE/MERGE/IGNORE, Entities an der Recherche-Pin,
kein Extra-LLM.

[AIM](https://arxiv.org/abs/2609.12320) — Provenienz und Scope.
Quelle im Wert, origin tool, 14-Tage-TTL, ein Key pro Host.

[MemForest](https://arxiv.org/html/2605.23986v2) — kanonische Fakten
mit Beleg. Zwei Hosts, zwei Keys, `related_ids` same_entity.

## 3. Architektur

```text
memory-core.ts
  memoryAspect / pinsForAsk / memoryBlock
  retrieve (Token+RRF, Lookup-Boost nur bei Token-Treffer)
  rememberCitedResearch (cited URL only)
       ↓
  maps / drive / leave / memory / LLM-Zug
```

Schreiben: Nutzer-Satz (Name, Pref, Arbeit) oder Tool-Recherche mit URL.
Lesen: ein Retrieve, ein Block. Nichts erfinden, das nicht in der Liste steht.

## 4. Won’t

e5-Router. 5. Hirn. 64. Agent. Vektor-DB. Stilles Knowledge-Harvest.
18.5 parallel.

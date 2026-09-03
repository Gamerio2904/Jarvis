# 56 — Jarvis 10.0 Semantisches Gedächtnis **PLAN**

PO 2026-09-03: Research zu Embeddings, Clustern, multimodalem RAG und Self-Evolving Agents in einen **ehrlichen** Jarvis-Plan gießen. Quelle: ChatGPT-Share (HF / GitHub / Papers). Dieser Text ist **kritisch** gegenüber dem Input — nicht eine Abschrift.

**App-Stand:** Code und Sideload **`9.10.0`**. Diese Datei ist **PLAN**, kein Execute. Hirn Gemini → Groq → 0,5B. Parser zuerst. Rest final [`54-next.md`](./54-next.md) **CODE**. Gerät-PO bleibt [`55-next.md`](./55-next.md) Sprint **178**. Recall `7.0` [`49-next.md`](./49-next.md) **CODE**. Alltag `8.0` [`50-next.md`](./50-next.md) **CODE**.

`10.0` ist die nächste **Intelligenz-Schiene**, kein zweites Hirn, kein Qdrant, kein Training auf dem Handy.

---

## Warum `10.0`, nicht `9.11`

`9.x` ist Rest-final / Stabilität / Could-Schalter. `7.0` hat den Recall-**Loop** gebaut (Retrieve + RRF + Working + Sleep-Prune). `8.0` ist Alltag. Die Lücke danach ist nicht „noch ein ONNX“, sondern: Jarvis **versteht Zusammenhänge zwischen Fakten** nicht, obwohl die Schleife da ist.

Das ist ein Produktsprung (MAJOR), kein Patch auf Could-e5.

Execute braucht **kein** 3060, kein NAS, keine neuen Gewichte in der APK. Gerät-PO **178** bleibt Must für `9.10` — es blockiert das *Planen* nicht. Execute von `10.0` startet erst, wenn der PO **diese Datei** abnimmt.

---

## 1. Kritik am Input

Der Share mischt drei Dinge, die für Jarvis **nicht dasselbe Problem** sind:

1. Industrie-RAG über Millionen PDFs (Qdrant, HNSW, ColBERT, ViDoRe).
2. Forschungs-Agenten, die sich selbst trainieren (AgentEvolver, SeeUPO, ADAS, Voyager-Skills).
3. Einen persönlichen Assistenten mit **Cap 80 Pins** in IndexedDB.

Punkt 3 ist unser Produkt. Punkt 1 und 2 sind ein anderes Produkt. Wer Qwen3-Embedding-8B plus HDBSCAN plus Memory-Graph plus Teacher-Distillation als „nächsten Sprint“ verkauft, hat die Ist-Lage nicht gelesen.

### Was der Input richtig sieht

| Beobachtung | Warum das bei uns zählt |
|-------------|-------------------------|
| Nicht alles speichern (Memory Gate) | Sonst Müllhalde. Prune existiert, ein **typed** Gate nicht. |
| Semantik allein verwechselt Zeit: *will nach Japan* ≈ *war in Japan* | Token-`includes` und Cosine machen denselben Fehler. **Tense/Kind** muss ein Feld sein. |
| Sparse (exakte Wörter) bleibt nötig | `FritzBox 7590` / WLAN-Key. Dense allein verliert Tokens. |
| Hybrid: erst Kandidaten, dann teurer Rang | Das **haben** wir: Token + RRF, e5-Rerank als leere Hülle. |
| Neue Erinnerung soll Alte **anbinden oder revidieren** (A-MEM) | Contradiction ist Substring-Löschen, kein Link, kein Merge. |
| Eval am **eigenen** Corpus, nicht MTEB | MTEB misst Wikipedia-Retrieval. Jarvis misst: *Was trinke ich?* / *Was wollte ich in Japan?* |
| Prozedurales Wissen ≠ Fakten (ReMe / Voyager) | Skills als **ausführbarer Code** sind Won’t. Ein kurzes „so hat’s geklappt“-Log ist Should. |

### Was der Input übertreibt oder falsch auf Jarvis legt

| Behauptung im Share | Kritik |
|---------------------|--------|
| „Qwen3 + HDBSCAN + HNSW + Qdrant als Referenz bauen“ | Corpus sind **Hunderte Zeilen**, Cap **80** LTM (`MEMORY_LTM_CAP`). Linearer Scan ist Mikrosekunden. HNSW/Qdrant/FAISS sind Cargo-Cult. Gleiches Votum wie LanceDB in `7.0`. |
| Qwen3-Embedding-0.6B / 4B / 8B, Jina v4 2048-d, BGE-M3, ColBERT | 0,6B Embed ist **größer als unser 0,5B-Hirn**. 4B/8B sind PC-Paper. APK bekommt das nicht. e5-small (~120 MB) bleibt das einzige Could, und **nur Rank**. |
| Fünf Embeddings pro Pin (semantic/entity/event/pref/retrieval) | 5× Speicher und 5× Inferenz für 80 Key/Value-Zeilen. Erst **ein** optionales Rank, wenn Keyword messbar knirscht. |
| Eigenes Embedding trainieren, Hard-Negative-Loop, Distillation | Zweites Produkt (Trainer, GPU, Datensatz). Sideload-APK ist kein Lab. **Won’t.** |
| HDBSCAN / BERTopic / UMAP / Community-Detection | K-Means braucht K — stimmt. HDBSCAN braucht **Dichte**. 80 Punkte in 1024-d sind kein Dichteproblem, das ein Algorithmus lösen soll. Kategorie + `parent_key` aus Parser/Sleep reichen. |
| ColPali / VisRAG / Qwen3-VL-Embedding / multimodaler Index | Sehen ist **3060 NO-GO** + Freeze. Dateien sind V4 (PDF/Text/OCR). Bildvektoren in der APK = zweites Hirn + Privacy. **Won’t in `10.0`.** |
| Multi-Agent (Planner/Research/Memory/Critic) | TypeScript **ist** der Agent (`3.0` Register, `7.0` Retrieve). Extra-LLMs = Latenz, Kosten, zweite Persona. **Won’t.** |
| Self-Evolving = Gewichte / RL / ADAS ändert Architektur | SeeUPO, AgentEvolver, ADAS sind Research-Stacks. Jarvis darf **nicht** nachts den Parser umschreiben. Experience-Log + Utility-Prune ja; Selbstprogrammierung nein. |
| „100 000 Memories × 1024-d FP32, deshalb Quantisierung“ | Wir **kappen** bei 80. Matryoshka/INT8 sind erst ein Thema, wenn jemand e5 wirklich legt — nicht als Architektur. |
| File-native Markdown als Source of Truth (ReMe-Mode) | Hausstand-JSON **ist** die lesbare Quelle. Zweite Markdown-Welt = Drift nach Import. **Won’t.** |
| Gewichtete 7-Kanal-Formel (dense+sparse+multi+temporal+entity+graph+personal) | Sieben magische `w_*` ohne Messreihe. Bei uns: RRF bleibt Kern; **drei** Boosts (Kind/Entity/Zeit) mit festen Zahlen, evaluiert in `10.50`. |
| ChatGPT-Quellen „Hugging Face+1“ | Viele Zahlen und Modellkarten ohne prüfbare Links (Jina v5 Feb 2026, MMEB-V3 190 Tasks, OmniSET). **Nicht** als DoD übernehmen. Was zählt: Papers/Repos, die wir unten namentlich klauen — und der **Code-Ist**. |
| Sleep/Cloud darf heimlich Fakten zu Google | Vision: privat. Sleep mit Key **nicht** still. Heute tut der Code das Gegenteil (siehe Ist). `10.0` macht daraus **kein** heimliches Extractor-Produkt. |

### Verifizierter Kern (nicht der Share)

| Quelle | Was real ist | Was wir nicht übernehmen |
|--------|----------------|---------------------------|
| [Qwen3-Embedding](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) (Jun 2025, Apache-2) | 0,6B / 4B / 8B Encoder, MRL, stark auf MTEB | Gewichte in der APK. 0,6B > lokales Hirn. |
| [A-MEM](https://arxiv.org/abs/2502.12110) (Xu et al.) | Note mit Keywords/Tags; Links; alte Notes **evolven** | ChromaDB, MiniLM, OpenAI-Backend, Python-Lib. |
| LightMem / MemAgent | Sleep verdichten, Panel überschreiben | Schon in `7.0` als **Regel** geklaut, nicht als Lib. |
| ColBERT / BGE-M3 / Jina v4 | Late Interaction, dense+sparse+multi-vector | Dokument-RAG, nicht 80 Pref-Pins. |
| ColPali / VisRAG | Seite als Bild indexieren | LocateAnything-Freeze, kein zweites Vision-Hirn. |
| ReMe / Voyager | Experience → Skill; nützliche Memories behalten | Skill-Library als Code-Gen **Won’t**. Utility-Prune **Should**. |
| e5-small | Schon in [`52-research-latency-quality.md`](./52-research-latency-quality.md) / Sprint **176** | Identität in `applyE5Rerank`. Bleibt Could. |

---

## 2. Ist — was `7.0` / `9.10` wirklich tun

Nicht „kein Memory“. Der Share tut so, als läge nur Chatverlauf in einem Vektorstore. Falsch.

| Fläche | Datei | Ist |
|--------|-------|-----|
| Pins | `store.ts` `MemoryItem` | `key`, `value`, `category`, `confidence`, `origin`, `expires_at`. **Kein** `kind`, Entity, Zeit, `related_ids`. |
| Schichten | `memory-layer.ts` | Sensory-Filter (Dump), Working max 8, Semantic-Pins, Prune Cap 80, Contradiction **per Substring**. |
| Retrieve | `retrieve.ts` | 2–3 Sub-Queries aus Tokens, `includes`-Score, RRF Top 6 über Memory/Chat/Kalender/Notizen/Erinnerung/Einkauf. |
| e5 | `applyE5Rerank` | **Identität.** Auch mit Datei neben der APK kein Rank (`55-next`). Nie `pickRoute`. |
| Write | `memory.ts` + Parser | `merk` / Pref-Harvest / Verify nach Observation. SUCCESS nur wenn gespeichert. |
| Sleep | `sleep-memory.ts` | Prune alle 2 min. Harvest **nur wenn Gemini aus** (`if (isGeminiConfigured()) return`). Regel `safeFact` (Name). **Kein** Sleep-JSON trotz Key. |
| Prompt | `memory-block.ts` / `prompt-split.ts` | Hits + Pins ans User-Turn, Persona-Prefix stabil. |
| Router | Register `3.0` | Embeddings **nie** Tool-Wahl. Unverändert in `10.0`. |
| Dateien | V4 `9.0` | PDF/Text lokal, Foto/OCR Gemini, Verify Upload. Kein visueller Index. |
| Sehen | `4.77` / `4.78` | Parser CODE, Gewichte Freeze, Chat *Sehen am PC ist aus*. |

Das ist der Loop aus `7.0`. Was fehlt, ist **Struktur und Trefferqualität**, nicht ein zweites Retrieval-Produkt.

---

## 3. Die echte Lücke (nicht MTEB)

Heutiges Retrieve findet `zahnarzt`, wenn das Wort im Pin steht. Es findet **nicht**:

| Äußerung | Pin | Heute | Soll `10.0` |
|----------|-----|-------|-------------|
| `Was ist mein WLAN-Passwort?` | `fritzbox` = `…` | oft leer (kein Token-Overlap) | Alias-Tabelle + Entity `router` |
| `Was wollte ich in Japan machen?` | `reise` = `Tokyo 2027` | leer oder Chat-Snippet | `kind=goal`, Entity `Japan`/`Tokyo`, 1-Hop |
| `Mag ich noch Döner?` | `essen` = `Döner` plus später `esse kein Döner mehr` | Substring-Widerspruch oder beide Pins | Gate **REVISE**, ein Pin, Confidence |
| `Welche Reisen plane ich?` | gemischte Prefs | Dump oder nichts | Filter `kind=goal` + Zeit `future` |
| `Wo war das Restaurant vom Foto?` | — | ehrlich: kein Bildindex | **Won’t.** OCR-Text wenn V4 schon geparst; sonst Nachfrage |

Ohne Gold-Fragen lügen wir uns Intelligenz. Deshalb ist Eval **Must**, Embeddings **Could**.

---

## 4. Klauen / lassen (wie `7.0`)

| Projekt | Was wir klauen | Was wir nicht übernehmen |
|---------|----------------|---------------------------|
| A-MEM | Structured note: Keywords, Tags, Links; Write darf Nachbarn **updaten** | Chroma, MiniLM, OpenAI-Memory-Manager, Python |
| NVIDIA Agentic Retrieval / unser `7.0` | Sub-Queries + RRF + Top-k ins Prompt | Lance, Nemotron, MCP, 136 s/Query |
| LightMem | Nicht alles schreiben; Sleep verdichten | Extra-BERT, Qdrant |
| ReMe | Utility: Hits die nie halfen, dürfen sterben; menschlich lesbar = Hausstand | Markdown-Filesystem, ACL-Trainer |
| e5 / Qwen-Idee „Rerank nach Recall“ | denselben Candidate-Pool umsortieren | Encoder als Router, 0,6B+ in der APK |
| GraphRAG / HippoRAG | 1-Hop über `related_ids` | Community-Detection, Entity-LLM auf jedem Write |
| ColPali / VisRAG / VLM2Vec | nichts in `10.0` | Seiten-als-Bild, MMEB, Video-Memory |
| Voyager / AgentEvolver / ADAS | nichts Ausführungs-Autonomes | Curriculum, Skill-Code, Meta-Agent, RL |
| BERTopic / HDBSCAN | Kategorie-Namen die der Parser schon hat | UMAP-Plots, c-TF-IDF auf 80 Zeilen |

---

## 5. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Eine** Schiene `10.0`: strukturiertes Gedächtnis + besseres Retrieve. Kein RAG-Server, kein zweites Memory-Produkt. |
| Agent | TypeScript bleibt der Agent. Gemini formuliert. 0,5B wählt keine Tools. |
| Corpus | IndexedDB wie heute. Hausstand exportiert dieselben Stores inkl. neuer Felder (Default leer). |
| Schema vor Vektor | `kind`, Entities, Zeit, Links, Gate **zuerst**. Embeddings nur wenn `10.50` Keyword-Miss belegt. |
| Retrieve | Token + Alias + Structured Filter + RRF. Drei Boosts: Entity-Treffer, `kind`, zeitliche Passung. Kein 7-Kanal-Orakel. |
| Graph | `related_ids` + Typ (`same_entity` / `contradicts` / `parent`). Ein Hop bei Recall. Kein GraphRAG. |
| Cluster | `category` + optional `parent_key` (z.B. `reise` → `japan`). Kein HDBSCAN. |
| Gate | `STORE` / `MERGE` / `IGNORE` / `REVISE`. Dump und Smalltalk weiter raus. Nudeln-gestern = IGNORE. Japan-nächstes-Jahr = STORE. |
| Cloud-Sleep | **Kein** stilles Extrahieren. `isGeminiConfigured() return` bleibt, bis ein **sichtbarer** Opt-in-Satz existiert (Could, nicht Must). Structured Felder kommen aus Parser + Regeln. |
| e5 | Unverändert: opt-in, Datei fehlt = ehrlich, **nie** `pickRoute`. Tauwetter nur nach Gold `10.50`. Sprint **181** bleibt Freeze. |
| Router | Unverändert. Kein `if` in `chat.ts`. Register `recall` bleibt. |
| Multimodal | V4 + bestehendes Auge. Kein visueller Embedding-Index. |
| Self-evolution | Experience-Log (welcher Hit stand im Prompt, Nutzer korrigiert). Utility-Prune. **Kein** Fine-Tune, kein Architektur-Rewrite. |
| Sideload | Nicht in `10.0`–`10.40`. Hausstand vor nächster APK. Gold `10.50` darf Parser-Tests ohne Gerät. Gerät-Tor `10.51` wie die anderen Tore. |
| 178 / 183 / 185 | Bleiben `9.10` / Alltag-Gerät. `10.0` mischt kein FGS, kein OEM, kein Blitzer-Live. |

```text
Äußerung
  → Register unverändert (Parser, Score)
  → retrieve2:
        Sub-Queries (Token) + Alias-Expand
        Structured Filter (kind / entity / Zeit) wenn erkennbar
        RRF wie heute
        Boost: Entity, kind, temporal   [feste Zahlen]
        optional e5-Rerank der Top 6    [Could, Identität bis GO]
        1-Hop related_ids
  → Gate nur bei Write (nicht bei jeder Chat-Zeile)
  → memoryBlock(Pins + Hits)
  → Working Memory unverändert (max 8)
```

---

## 6. Schema (`10.10`)

Bestehende Felder bleiben. Neu **optional**, Import alter Hausstände darf nichts zerlegen.

| Feld | Werte | Wozu |
|------|--------|------|
| `kind` | `pref` \| `fact` \| `goal` \| `event` \| `open_loop` \| `boundary` | Filter „welche Reisen“, nicht Cosine |
| `entities` | kurze Strings, max 8, deutsch/Name | `Japan`, `FritzBox`, `Zahnarzt` |
| `event_time` | ISO oder `null` | Wann das **Ereignis** war/ist, nicht `updated_at` |
| `tense` | `past` \| `present` \| `future` \| `unknown` | will vs. war |
| `related_ids` | andere Memory-`id`s, max 6 | 1-Hop |
| `edge` | parallel zu related: `same_entity` \| `parent` \| `contradicts` | typed, nicht magisch |
| `importance` | 0–1, Default aus `confidence` | Gate + Prune |
| `parent_key` | optional, z.B. `reise` | Hierarchie ohne Clustering-Lib |

`category` bleibt (pref/fact/open_loop/boundary) für den alten Parser. `kind` darf `category` spiegeln, bis Write umgestellt ist. **Keine** Embedding-Spalte in `10.10`.

UI: Einstellungen → Was Jarvis merkt zeigt Kind + Entities, löschen bleibt. Kein Graph-Plot.

---

## 7. Memory Gate (`10.20`)

Jeder **Write**-Pfad (Parser `merk`, Pref-Harvest, Sleep-Regel) durch eine Funktion, kein LLM-Router:

```text
Kandidat {key, value, kind, entities, tense}
  → Dump / Smalltalk / zu kurz          → IGNORE
  → schon identischer Pin               → IGNORE (touch updated_at)
  → gleicher key, neuer value           → REVISE (alt weg, Verify)
  → gleicher entity-cluster, gleicher kind, overlapping value → MERGE
  → sonst                               → STORE wenn Cap-Raum / Importance
```

Nudeln gestern: kein `merk`, Harvest erkennt kein Pref → IGNORE.  
*Ich esse keinen Döner mehr* bei Pin `essen=Döner` → REVISE, wie Contradiction, aber **ein** surviving Pin.  
Sleep erfindet keine Goals.

Won’t: LLM entscheidet STORE auf jedem Turn. Das wäre heimliches Google-Memory.

---

## 8. Retrieve 2 (`10.30`)

`retrieve.ts` bleibt Singleton. Kein zweites Modul-Hirn.

**Must**

1. Alias-Lexikon (TypeScript, deutsch Alltag, wenige Dutzend Paare). Beispiele: `wlan|wifi|fritzbox|router` → gemeinsamer Query-Zusatz; `japan|tokyo|kyoto` → `reise`/`japan`; `zahnarzt|arzttermin` → `termin`. Kein Scraping, keine ML-Synonyme.
2. Structured Filter: erkennt die Äußerung `kind=goal` / Entity / `future` → Kandidaten zuerst aus passenden Pins, dann RRF wie heute auf dem Rest.
3. Boost nach RRF, **feste** Zahlen (Startvorschlag, `10.50` darf sie ändern): Entity-Overlap `+0.4`, passendes `kind` `+0.3`, passende `tense` `+0.3`. Kein gelerntes `w_*`.
4. Chat-Snippets bleiben Dump-gefiltert. Debug-Chats weiter raus.

**Won’t:** BM25-Lib, Sparse-Vektor aus BGE-M3, Query-Embedding, ColBERT MaxSim.

---

## 9. Graph light (`10.40`)

Beim STORE/MERGE: wenn Entities überlappen oder `parent_key` gesetzt ist → `related_ids` schreiben (max 6). Contradiction setzt `edge=contradicts` und löscht wie heute nach Verify.

Recall: Top-Hits plus **höchstens 2** Nachbarn (1 Hop). Prompt darf nicht explodieren (Block-Limit aus `7.0` halten).

Won’t: Community-Detection, PageRank, Graph-DB, LLM-Label für Cluster-Namen auf jedem Write.

---

## 10. Eval + Test-Tor (`10.50` / `10.51`)

Kein MTEB, kein Silhouette. Ein **Jarvis-Gold** in der bestehenden Test-Infrastruktur (`test:014` / neue `test:memory-10`).

Gold-Set (Must, klein, versioniert):

| ID | Setup | Frage | Erwarteter Hit |
|----|-------|-------|----------------|
| G1 | `getränk=Mate` | `Was trinke ich?` | Mate |
| G2 | `fritzbox` Passwort-Pin | `WLAN-Passwort?` | der Pin, nicht leer |
| G3 | `reise` Tokyo 2027 `kind=goal` `tense=future` | `Was wollte ich in Japan?` | Tokyo-Pin |
| G4 | `essen=Döner` dann REVISE kein Döner | `Mag ich Döner?` | neuer Stand, nicht beide |
| G5 | nur Prefs, kein Goal | `Welche Reisen plane ich?` | ehrlich leer, kein Döner |
| G6 | Dump-Zeile im Chat | Recall | Dump nicht in Top 6 |

Metriken: Recall@6 auf Gold, False-Memory-Rate (Pin der nicht gehört), keine Halluzination *„Sie fliegen nach Rom“* ohne Pin.

`10.51` Gerät: vier Phasen des Debug-Laufs, Gruppe Memory-10. PO spricht die Gold-Fragen. Parser-grün ≠ Gerät-grün.

---

## 11. Experience (`10.60`) **Should**

Nach einem Turn, in dem Retrieve im Prompt war: wenn der Nutzer **korrigiert** (*stimmt nicht*, `vergiss …`), den Hit als `not_useful` zählen. Prune darf niedrige Utility + alte `updated_at` bevorzugen (neben Confidence).

Won’t: automatisches Fine-Tune, Hard-Negative-Datensatz, Gewichte `w_entity` nachts anpassen ohne Gold.

---

## 12. e5 (`10.70`) **Could — nur nach rotem `10.50`**

Wenn G2/G3 nach Alias+Boost **weiter** rot: Spike e5-small **nur** `applyE5Rerank` auf den bestehenden Top-6, opt-in, Datei nicht in der Sideload-APK, Messung P95 vs. Keyword. Sonst **181 Freeze halten**.

Qwen3-Embedding, Jina, BGE-M3, EmbeddingGemma: **Won’t** als zweiter Encoder. Ein Could-Modell reicht, und das ist schon gewählt.

---

## 13. Versionen und Sprints

Reihenfolge = Lieferreihenfolge. Could blockiert Must nicht. Research-GO ist **diese Datei** — kein extra `10.1` HF-Tour.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **187** | `10.0.0` | Leitentscheidung im Code (Typen + Won’t-Kommentare, Retrieve unverändert) | Must | **PLAN** |
| **188** | `10.10.0` | Schema-Felder + Hausstand rund | Must | **PLAN** |
| **189** | `10.20.0` | Gate STORE/MERGE/IGNORE/REVISE | Must | **PLAN** |
| **190** | `10.30.0` | Retrieve 2: Alias + Filter + Boost | Must | **PLAN** |
| **191** | `10.40.0` | Graph light: related_ids, 1-Hop | Must | **PLAN** |
| **192** | `10.50.0` | Gold-Eval `test:memory-10` | Must | **PLAN** |
| **193** | `10.51.0` | Test-Tor Memory Gerät (vier Phasen) | Should / PO | **PLAN** |
| **194** | `10.60.0` | Experience / Utility-Prune | Should | **PLAN** |
| **195** | `10.70.0` | e5-Rerank nur wenn 192 rot | Could | **PLAN** / Freeze |

Sprint-Dateien: [`sprint-187.md`](./sprints/sprint-187.md)–[`sprint-195.md`](./sprints/sprint-195.md).

---

## 14. Won’t (verbindlich)

Qdrant, FAISS, pgvector, LanceDB, Chroma, HNSW-Index.  
Qwen3-Embedding, Jina v4/v5, BGE-M3, ColBERT, EmbeddingGemma, LLM2Vec-Training.  
HDBSCAN, BERTopic, UMAP als Produkt.  
ColPali, VisRAG, Qwen-VL-Embedding, multimodaler Vektorindex, Video-Memory.  
Multi-Agent-Rollen, Critic-LLM, ADAS, AgentEvolver, SeeUPO-RL, Voyager-Skill-Codegen.  
Embeddings in `pickRoute` / `policy.ts`.  
3B/0,6B Embed im Handy. NAS-Hirn. Pipecat. Whisper-Server.  
Play Store, iOS, Marvel, Mail, Cloud-Kalender, Alexa.  
Erfolg ohne Observation. Memory-Pins aus jedem Chat-Turn.  
Stilles Gemini-Harvest. Zweite Markdown-Memory-Welt.

Alte 1.x/2.x-PRs auf `main` — unverändert Won’t ([`55-next.md`](./55-next.md)).

---

## 15. Reihenfolge gegen `9.10` / `8.0`

```text
Sideload 9.10.0
    → 178 PO Handy (Must, Gerät)     parallel planbar, Execute getrennt
    → 183 OEM nur wenn 178 rot
    → 185 Alltag-Gerät PO
    → 181 ONNX Freeze bleibt
10.0 Execute (187–192)  — Parser/IDB, kein 3060
    → 193 Gerät Memory-Tor
    → 194 Should
    → 195 nur bei Eval-Rot
```

Kein Downgrade. `10.0` ersetzt `7.0` nicht — es **füllt** Retrieve/Schema.

---

## 16. Chat / Probe (nach Execute)

1. `Merk dir: FritzBox-Passwort ist Blau12` → STORE, Entity router. `Was ist mein WLAN-Passwort?` → Pin, nicht „dazu liegt nichts“.
2. `Ich will 2027 nach Tokyo.` → `kind=goal`, `tense=future`. `Welche Reisen plane ich?` → Tokyo. `Was esse ich gern?` bleibt Pref, nicht die Reise.
3. `Ich mag Döner.` dann `Döner esse ich nicht mehr.` → ein Pin, Verify weg vom alten Wert.
4. `Guten Morgen` bleibt Brief, kein Memory-Dump.
5. `Steckdose an` bleibt Stecker. Retrieve wählt keine Tools.
6. Foto-Restaurant-Frage → ehrlich ohne Bildindex, oder V4-Text wenn die Datei schon im Chat lag.

---

## 17. Abnahme dieser Datei (Plan fertig)

- [x] Kritik am HF-Input steht, nicht nur eine Wunschliste.
- [x] Ist `7.0`/`9.10` ehrlich (Sleep-Gemini-Return, e5-Identität, Cap 80).
- [x] Leitentscheidung: Schema → Gate → Retrieve2 → Graph → Eval; Embeddings zuletzt.
- [x] Sprints 187–195 plus Won’t plus Verhältnis zu 178/181.
- [x] Kein Execute in diesem Dokument-Sprint.

Index: [`42-planned.md`](./42-planned.md). Versionen: [`09-versioning.md`](./09-versioning.md). Recall-Ist: [`49-next.md`](./49-next.md). Could-e5: [`52-research-latency-quality.md`](./52-research-latency-quality.md).

# 49 — Agentic Recall (`7.0`) **PLAN**

Sprint-Nummern **127–130** und Version **`6.60`** sind vergeben (Parser, Overlay, Sideload, Globus **`6.90`**). Der Recall-Plan von `main` (`ba14126`) bleibt die **nächste Intelligenz-Schiene** nach `6.90`.

| Alt (dieser Text unten) | Neu |
|-------------------------|-----|
| Sprint 127 / `6.60` Leitentscheidung | Sprint **137** / **`7.0.0`** |
| Sprint 128 / Retrieve + RRF | Sprint **138** / **`7.10.0`** |
| Sprint 129 / Working Memory | Sprint **139** / **`7.20.0`** |
| Sprint 130 / Sleep-Time + Recall-Tool | Sprint **140** / **`7.30.0`** |
| — | **`7.31.0`** Test-Tor Recall (vier Phasen, nach `7.30`) |

Kein Execute in dieser Lieferung. Sideload bleibt **`6.90.0`**. Alltag vom Zettel ist **nicht** diese Schiene — [`50-next.md`](./50-next.md) `8.0`, Sprints 141+. Nach `7.31`: Dauer-Zuhören [`50-next.md`](./50-next.md) `8.95`.

---

PO 2026-08-28: NVIDIA Agentic Retrieval, MemAgent, LightMem für **mehr Intelligenz** nutzen — nicht als Python-/GPU-Stack, sondern als Loop über IndexedDB. Fragen dazu: warum kein LanceDB/Nemotron, warum Cloud nur Opt-in, warum die Won’t-Liste.

**Ist:** Code **`5.11.0`**. Sideload **`3.18.1`**. Memory = Key/Value + Parser. Chatsuche = `includes()`. Prompt = Persona + **erste 16 Pins** + **letzte 16 Turns**. Sprint 08 hatte „relevante Pins“ versprochen; heute ist Dump. Hirn-Schliff `6.50` ([`45-next.md`](./45-next.md) H3) ist der Vorläufer: weniger Liste. Diese Schiene **baut den Loop**.

**Warum `6.60`, nicht `5.0` / `6.0`:** `5.0` = Weltkugel, `5.11` = Debug, `6.0`–`6.50` = Bühne & Hirn-Schliff. Recall ist der nächste Intelligenz-Schritt **nach** Tool-Schliff, ohne Clash.

Kein Execute in Sprint 127. Sideload nach Hausstand. Braucht **kein** PC, kein LocateAnything, kein WebGL — Execute darf vor der Bühne, wenn der PO Intelligenz vor Motion zieht.

Quellen (Ideen, nicht Dependencies):

| Projekt | Was wir klauen | Was wir nicht übernehmen |
|---------|----------------|---------------------------|
| NVIDIA Agentic Retrieval | ReAct: mehrere Sub-Queries, prüfen, umformulieren, RRF | LanceDB, NeMo Retriever, Nemotron-8B, Opus, MCP-Server |
| MemAgent (Bytedance/Tsinghua) | Festes Panel, **überschreiben** statt anhängen | RL-MemAgent-7B/14B, 3,5M-Kontext-Training |
| LightMem (zjunlp, ICLR 2026) | Sensorisch filtern, Thema, **Sleep-Time** verdichten | Python-Lib, LLMLingua-2-BERT extra, Qdrant |

---

## 1. Warum kein LanceDB und kein Nemotron?

Kurz: Unser Corpus sind ein paar Hundert Zeilen auf dem Handy, nicht Millionen PDFs auf einer A100. Die NVIDIA-Pipeline ist für das zweite gebaut.

### LanceDB

| | Vorteil | Nachteil bei Jarvis |
|--|---------|---------------------|
| Was es ist | Embedded Vektor-DB (Rust), gut für RAG über Dateien/Chunks | Extra-Runtime. Offiziell Python/Rust, nicht IndexedDB in der Capacitor-WebView |
| Qualität | Hybrid-Suche, Filter, Skala | Skala brauchen wir nicht. Kalender + Memory + Chats liegen schon in IDB |
| Betrieb | Eine Datei am PC | APK: WASM-Lance oder natives JNI = zweites Hirn, RAM, First-Run-Download, Backup-Format neben Hausstand |
| Sync | Gut wenn ein Index der Wahrheit | Hausstand-Export müsste den Index mitnehmen. Zwei Stores = Drift nach Import |

**Votum: Won’t als Dependency.** Dieselbe Idee (mehrere Suchen, Rang) über `IDB` in TypeScript. Falls der Corpus später zehntausende Chat-Zeilen wird: **Could** ein Mini-Index in IDB (kein Lance), nicht in `6.60`.

### Nemotron (Embed / Agent-LLM)

NVIDIA setzt in den Leaderboards u. a. `nemotron-colembed-vl-8b-v2`, `llama-nemotron-embed-vl-1b-v2`, lokal `nemotron-8b` hinter vLLM. Agentic Retrieval mit Opus braucht in deren Messung **~136 s/Query** und Hunderttausende Tokens.

| | Vorteil | Nachteil bei Jarvis |
|--|---------|---------------------|
| Embed 1B–8B | Semantik besser als Token-`includes` | 1B Embed ≈ größer als unser ganzes Hirn. WASM + 0,5B + Embed = Akku, OPFS, First-Run |
| VL-Embed | Bilder + Text | Auge ist Gemini oder LocateAnything am **PC**, nicht Nemotron in der APK |
| Nemotron-8B als Agent | Kann `think` / `retrieve` wie im Paper | Passt nicht ins Handy. RTX-3060 ja — **NAS-Hirn ist Parking.** Zweites Denken am PC widerspricht „Handy ist Hirn“ |
| Lizenz / NIM | Starke Retrieval-Modelle | Extra NVIDIA-Account/NIM, Cloud oder GPU-Server. Opt-in-Wildwuchs neben Gemini |

**Votum: Won’t in der APK und kein PC-Nemotron-Hirn.** Semantik **Could** später: `multilingual-e5-small` ONNX (~120 MB) **nur zum Umsortieren** der RRF-Treffer, nie als Tool-Router. Spike erst nach `6.65`, wenn Token-Suche messbar knirscht.

### Was wir trotzdem von NVIDIA nehmen

Die **Schleife**, nicht der Stack:

```text
Äußerung
  → 2–3 Sub-Queries (Regeln; Cloud nur wenn Hirn-Opt-in an)
  → jede Query gegen Memory, Messages, Kalender, Notizen, Erinnerungen, Einkauf
  → RRF: score = Σ 1/(60 + Rang)
  → Top 6 ins Prompt / in die Antwort
```

In-process, ein Thread, kein MCP. Genau der Architektur-Schritt, den NVIDIA selbst gemacht hat (Retriever als Singleton statt Extra-Server) — bei uns heißt der Singleton `retrieve.ts`.

---

## 2. Warum Cloud nur Opt-in — und warum kein zweites Cloud-Produkt?

„Nur Gemini Opt-in“ in der Skizze hieß: **kein neues Cloud-Hirn**. Die Kaskade aus [`16-gemini.md`](./16-gemini.md) bleibt: Gemini an → bei Limit Groq, wenn Key da. Default **aus**.

### Warum Opt-in, nicht Default-Cloud?

| Grund | Bedeutung |
|-------|-----------|
| Vision | Privat by design. Denken und Speichern auf eigener Hardware. Cloud-LLM ist **nicht** Default ([`01-vision.md`](./01-vision.md), [`02-architecture.md`](./02-architecture.md)) |
| `0.16` | Gemini existiert schon als bewusster Schalter + Key + Banner „Chat geht ins Netz“ |
| Sleep-Time | Verdichten im Hintergrund ohne Opt-in = **heimlich** Fakten zu Google. Das ist schlimmer als ein Tipp im Chat |
| 0,5B | Soll weiter Tools ehrlich ausführen, wenn Cloud aus ist. Recall darf nicht sterben, nur weil kein Key da ist |

Lokal immer: Token-Sub-Queries + RRF + Overwrite-Regeln. Cloud **darf** (wenn an): eine Umformulierung, Sleep-JSON `{key,value,category}`. Cloud **darf nicht**: Tools wählen, Memory löschen, Pins erfinden, die der Parser nicht bestätigt.

### Warum nicht Claude / Opus / NVIDIA-Hosted als Extra?

Opus ist in NVIDIAs Tabelle der beste Agent — und 136 s plus API-Vertrag. Wir haben **einen** Cloud-Pfad (Gemini, Overflow Groq). Ein dritter Anbieter = dritter Key, dritte Datenschutzerklärung, dritte Fehlerkaskade. **Won’t.** Groq zählt nicht als neues Produkt: steht schon in `0.16` / `1.0`.

### Warum 0,5B die Schleife nicht denkt

ReAct braucht ein Modell, das `retrieve("zahnarzt")` vs. `final_results` unterscheidet. 0,5B halluziniert Tool-Calls. Deshalb: **TypeScript ist der Agent.** Das LLM sieht nur das Ergebnis. Das ist dieselbe Linie wie Register `3.0`: Parser vor Execute.

---

## 3. Punkt 8 — warum genau nicht (Won’t, detailliert)

Aus der Skizze: Dinge, die wir **nicht** anfassen. Hier das Warum, damit das nicht wie Faulheit wirkt.

### 8a. Kein Embedding in `route-pick.ts` / `policy.ts`

`3.0` entscheidet Tools per Parser + Score, **Won’t: Embeddings als Primärwahl.** Grund:

- Embeddings machen „kein Kaffee mehr“ und „Kaffee kaufen“ ähnlich. Contradiction vs. Einkauf ginge kaputt.
- 0,5B + Embed-Router = undurchsichtige Treffer, schwer zu debuggen (Debug-Lauf `5.11` misst Register-IDs, keine Vektoren).
- Retrieve **nach** der Route ist Recall. Retrieve **statt** Parser ist ein zweiter Router. Den bauen wir nicht.

### 8b. 0,5B wählt weiter keine Tools

Function-Calling mit 0,5B war in `3.0` Won’t. Unverändert. Sonst: Steckdose/Taxi/SMS über ein Modell, das Zahlen und Namen erfindet. Cloud-Hirn formuliert Sätze (`6.51` `polishFacts`), wählt nicht.

### 8c. Keine NVIDIA-/MemAgent-/LightMem-Dependency

- **NeMo Retriever:** Python, LanceDB, GPU, CLI. APK ist TypeScript + IndexedDB.
- **RL-MemAgent-7B:** zu groß, anderes Chat-Template, RL-Overwrite ist im Gewicht — wir brauchen die **Regel** Overwrite, nicht das 7B.
- **zjunlp/LightMem:** Python, MiniLM, optional GPT als Memory-Manager. Würde Sleep an ein zweites Framework koppeln. Atkinson-Shiffrin (Sensorisch / STM / LTM / Sleep) bauen wir in `sleep-memory.ts` selbst.

### 8d. Kein „alles mitschneiden“ ins Langzeitgedächtnis

LightMem filtert zuerst. Wenn jeder Chat-Turn ein Pin wird: Liste voll, Prompt tot, „vergiss Kaffee“ findet 40 Treffer. Write bleibt Parser (`merk`, Pref-Harvest). Sleep schreibt nur, was Regeln oder Opt-in-JSON als Fakt erkennen. Smalltalk und Tool-Echos fliegen in der Sensor-Stufe raus.

### 8e. Auge / Foto nicht in dieser Schiene

`eye.ts` = Gemini oder Absage. LocateAnything = PC `4.77`. Recall holt **Text** aus IDB, keine Bildvektoren. Sonst vermischen wir Sehen und Gedächtnis und können weder `5.11`-Expect noch Privacy (Foto→Google) sauber halten.

### 8f. Kein MCP-Retriever, kein Qdrant, kein zweites Hirn am PC

NVIDIA hat MCP selbst wieder rausgenommen (Latenz, zwei Prozesse). Wir starten nicht damit. PC bleibt Werkzeug (BAT, LocateAnything), nicht Memory-Server.

---

## Ist → Soll

```text
Heute:
  memoryBlock(erste 16) + history.slice(-16) + search includes()

Soll:
  Äußerung
    → Register unverändert (Parser, Score)
    → retrieve()  2–3 Queries, RRF, Top 6     [NVIDIA]
    → memoryBlock(Pins name/zuhause/boundary + Hits)
    → working_memory  max 8 Zeilen, overwrite [MemAgent]
    → history  lokal 4 / Gemini 8
    → Sleep idle/laden: Facts upsert, Panel kürzen [LightMem]
```

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Produkt | **Eine** Recall-Schiene `6.60`. Kein zweites Gedächtnis-Produkt, kein RAG-Server. |
| Corpus | IndexedDB, das schon da ist. Kein LanceDB, kein neues Dateiformat. Hausstand exportiert dieselben Stores. |
| Agent | TypeScript-Loop. 0,5B sieht Treffer, denkt die Suche nicht. |
| Cloud | Bestehende Kaskade Gemini→Groq, nur wenn Opt-in an. Sleep ohne Key = nur Regeln. |
| Router | Unverändert. Neues Tool **`recall`** im Register (Search erweitern), kein `if` in `chat.ts`. |
| Embed | Nicht in `6.60`–`6.82`. Could `6.83` e5-small nur Rank. |
| Sideload | Nicht in `6.60`. Hausstand vor APK. |

---

## Sprints (Lieferreihenfolge)

Research in dem Sprint, der sie braucht. `6.50` H3 (weniger Memory-Dump) bleibt in [`45-next.md`](./45-next.md) — `6.64` ersetzt den Dump durch Retrieve.

| Sprint | Version | Inhalt | Abhängigkeit |
|--------|---------|--------|--------------|
| 127 | `6.60.0` | Leitentscheidung (dieses Dokument) | — |
| 128 | `6.61.0` | `retrieve.ts` + RRF; Search + Memory-Recall; Prompt-Block | nach 127 |
| 129 | `6.70.0` | Working Memory Overwrite | nach 128 (sonst nichts zum Überschreiben das zählt) |
| 130 | `6.80.0` | Sleep-Time + Register `recall` + Gold | nach 129 |

Bühne `6.10` blockiert 128 nicht. Hirn-Schliff `6.50` sollte **vor** 128 liegen, wenn beide in derselben Lieferung sind (sonst zwei Prompt-Umbauten nacheinander). PO darf 128 vor Motion ziehen.

## Research (vor Execute der Fläche)

| Version | Frage | Grün wenn |
|---------|-------|-----------|
| `6.60` | Dieses Dokument: Lance/Nemotron Won’t, Opt-in, Punkt 8 | PO liest und lässt 128 zu |
| `6.61` | Sub-Query-Regeln DE (Stoppwörter, Kategorie-Hints Kalender/Memory/Chat) | 20 Gold-Sätze, kein LLM nötig |
| `6.62` | RRF-K: 60 wie NVIDIA; Top-k 6; Stores-Liste vollständig | Zahnarzt findet Termin **oder** Chat, nicht die ganze Pin-Liste |
| `6.70` | Overwrite-Regeln: welche Tool-Sorten eine Zeile ersetzen | Panel ≤ 8 Zeilen nach 30 Turns |
| `6.80` | Sleep-Trigger: idle / laden / N Turns; kein Lauf im Sprachmodus-Fahrt | Job überspringt ehrlich; ohne Gemini keine erfundenen Pins |

## Bau

| Version | Inhalt | Status |
|---------|--------|--------|
| **`6.60.0`** | Leitentscheidung + Won’t Lance/Nemotron | **PLAN** (dieses Dokument) |
| **`6.61.0`** | `retrieve.ts`: Sub-Queries, IDB-Stores, RRF | PLAN |
| **`6.62.0`** | `search-chat.ts` Execute → retrieve | PLAN |
| **`6.63.0`** | Memory-Recall über retrieve; Write/Forget/Contradiction unverändert | PLAN |
| **`6.64.0`** | `memoryBlock(pins, hits)` max. 10 Zeilen | PLAN |
| **`6.65.0`** | `chat.ts`: retrieve vor LLM; lokal 4 / Gemini 8 Turns | PLAN |
| **`6.70.0`** | `working-memory.ts` Overwrite, Settings/IDB-Feld | PLAN |
| **`6.71.0`** | `digest.ts` liest Working Memory + last 8 | PLAN |
| **`6.80.0`** | `sleep-memory.ts` idle/laden; Sensor-Filter; Upsert nur sicher | PLAN |
| **`6.81.0`** | Register-Tool `recall` (Search mergen) | PLAN |
| **`6.82.0`** | Gold-Sätze + Debug-Gruppe Gedächtnis erweitern | PLAN |
| **`7.31.0`** | Test-Tor Recall: Erstnutzer / geübt / kaputt, Phase 3–4 bis sauber | nach `7.30` / `6.82` |
| **`6.83.0`** | Could: e5-small nur Rank | später |
| **`6.84.0`** | Sideload nach Hausstand | nach `4.52` |

Sprint 128 bündelt `6.61`–`6.65`. Sprint 129 = `6.70`–`6.71`. Sprint 130 = `6.80`–`6.82`.

## Dateien (Ziel)

| Datei | Rolle |
|-------|--------|
| `frontend/src/engine/retrieve.ts` | Sub-Queries, Stores, RRF, Top-k |
| `frontend/src/engine/search-chat.ts` | Execute ruft retrieve |
| `frontend/src/engine/memory.ts` | Recall über retrieve |
| `frontend/src/engine/memory-block.ts` | Pins + Hits, Kappe 10 |
| `frontend/src/engine/working-memory.ts` | 8-Zeilen-Panel, overwrite |
| `frontend/src/engine/sleep-memory.ts` | Offline-Konsolidierung |
| `frontend/src/engine/chat.ts` | retrieve + kürzere History; kein neuer Router |
| `frontend/src/engine/digest.ts` | Working Memory |
| `frontend/src/engine/registry.ts` | `recall` Execute |
| Tests | retrieve-Fixtures; **nicht** `registry.ts` importieren |

## Chat / Stimme (Ziel)

| User | Soll |
|------|------|
| `Was weißt du über den Zahnarzt?` | retrieve → Termin und/oder Chat-Satz, nicht 16 Pins |
| `Wo stand das mit der Milch?` | Chat oder Einkauf, Quelle genannt |
| Langer Smalltalk | Working Memory hält den Faden; 0,5B sieht 4 Turns + Panel |
| Cloud aus, Sleep | nur Parser-sichere Facts; sonst nichts Neues |
| `kein Kaffee mehr` | Contradiction-Parser, **nicht** retrieve-Löschen |

## Gold (Abnahme)

1. `Was weißt du über den Zahnarzt?` nach Termin „Zahnarzt 5.9.“ → eine Antwort mit Datum, nicht die Getränkeliste.  
2. Chatsuche „Milch“ trifft Einkauf **oder** Chat, nicht „Nichts zu Milch“.  
3. 40 Turns Smalltalk: Prompt bleibt klein (Working Memory ≤ 8, Memory-Block ≤ 10).  
4. Gemini aus: Recall und Tools weiter; Sleep erfindet keine Pins.  
5. `kein Kaffee mehr` löscht den Pref, legt keinen Einkauf an.  
6. Debug-Lauf Gruppe Gedächtnis: Expect `memory` / `recall` / `search` wie Katalog.

## Won’t (übergreifend)

LanceDB. Nemotron / NeMo Retriever / NIM. MemAgent-7B. Python-LightMem. Qdrant. MCP-Retriever. Embedding-Router. 0,5B Function-Calling. Neues Cloud-Produkt (Claude, Opus, NVIDIA-Hosted). Sleep ohne Opt-in zu Google. Alles-Mitschneiden. Bild-RAG in dieser Schiene. Zweites Hirn am PC. Play Store, iOS.

---

Bühne & Hirn-Schliff: [`45-next.md`](./45-next.md). Index: [`42-planned.md`](./42-planned.md). Sprints: [`sprints/sprint-127.md`](./sprints/sprint-127.md)–[`sprint-130.md`](./sprints/sprint-130.md).

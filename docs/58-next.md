# 58 — Jarvis 11.0 Fachwissen + Deep Research **CODE** `11.60.0`

PO 2026-09-03: Execute 202–208. Reel-Idee bleibt: Recherche → **lern das** → Pack nutzen. 195 e5 **FREEZE**. Gerät 193 **PO**.

**App-Stand:** Code **`11.60.0`**. Sideload **`10.60.2`**. Hirn Gemini → Groq → 0,5B. Parser zuerst. Memory-10 [`56-next.md`](./56-next.md) **CODE**. Intensiv 196–201 [`57-next.md`](./57-next.md) **CODE** `10.66.0`.

Gold: `npm run test:knowledge-11`. Memory-Gold unverändert.

`11.0` ist die nächste **Intelligenz-Schiene nach dem persönlichen Gedächtnis**: nicht Mate/WLAN (Cap 80), sondern **thematische Packs**, die der Nutzer bewusst lehrt. Kein zweites Hirn, kein Qdrant, kein Training auf dem Handy, keine Instagram-ASR.

---

## Produkt in einem Satz

Der Nutzer kann (1) eine tiefe Fachfrage stellen („recherchiere und entwirf …“), (2) sagen **„lern das“ / „merk dir als Fachwissen Arc-Reactor“**, (3) später fragen „wie funktioniert das **bei uns**?“ und bekommt **gelehrtes Pack + Quellen**, nicht eine frische Halluzination. Weitere Fächer kommen als **weitere Packs**, nicht als Fine-Tune.

---

## 1. Was das Reel wirklich zeigt

Instagram-Caption (verifiziert [@maninalabs](https://www.instagram.com/reel/DajByXpSQb4/)):

> I Asked J.A.R.V.I.S. To Redesign The Suit's Power Source

Kommentare drehen sich um Arc Reactor / Nuclear / Papers — **keine Produktspez**. Die Serie daneben (YouTube, dieselbe Marke) sagt klarer, was gemeint ist:

| Clip | Was der Assistent tun soll |
|------|----------------------------|
| [Research mode / build an arc reactor](https://www.youtube.com/watch?v=dasdF2CjII8) | Langer Research-Lauf, nicht eine Google-Zeile |
| [Nuclear physics → Projekt](https://www.youtube.com/watch?v=k0hPPmbrGyg) | Funde **in ein Projekt werfen** (persistieren) |
| [Biggest obstacle](https://www.youtube.com/watch?v=GcsBd0cOtvc) | Später **aus dem Gelernten** argumentieren (Integration, nicht nur Snippets) |
| [Research engine + lab loop](https://www.youtube.com/watch?v=C9qSqmPuo7E) | Jarvis = Literatur + Modell; Mensch = Labor; jede Lab-Notiz geht **sofort** ins Modell |

Manina verkauft das als Desktop-OS / Kits ([jarvis.driftworksstudios.com](https://jarvis.driftworksstudios.com/)): Memory, Automation, „research assistant“, kein fertiges Handy-APK. Marketing spricht von **6–12 Stunden** „PhD-level nuclear physics“. Das ist Theater auf einem PC mit offenem Browser — nicht unser Sideload.

**Was wir davon klauen (ehrlich):** Recherche → **explizit speichern** → später **abrufen** → Nutzer kann **Lab-/Alltagsnotizen** ins selbe Thema legen. Andere Fächer = andere Packs.

**Was wir nicht klauen:** Marvel-Rolle, stiller 12-Stunden-Crawl, Auto-Code der Rüstung, Instagram-Video als Quelle, Gewichte umschreiben.

---

## 2. Kritik am Wunsch „mach das wie im Reel“

Drei Dinge werden oft in einen Topf geworfen. Nur eins ist Jarvis.

| Fantasie | Warum das hier falsch ist |
|----------|---------------------------|
| 0,5B / Gemini **fine-tunen**, bis er „Kernphysik kann“ | Trainer, GPU, Datensatz, Drift. Sideload ist kein Lab. Nach einem zweiten Fach (Steuer, Bundesliga) wäre das Modell Müll. **Won’t.** |
| Qdrant / HNSW / Qwen-Embed / GraphRAG à la Kairos (Neo4j + pgvector) | Corpus sind **Dutzende Claims**, nicht Millionen PDFs. Linearer Scan in IndexedDB ist Mikrosekunden. Gleiches Votum wie [`56-next.md`](./56-next.md). |
| Instagram-Reel **herunterladen + ASR** | IG blockt, ToS, keine zuverlässige Audio-API im WebView. **Won’t Must.** Nutzer fügt Text oder eine öffentliche URL ein. |
| Stiller Sleep, der jede Suche nachts zu Fachwissen macht | Vision: privat. Gate existiert für Prefs. Fachwissen **nur** nach „lern das“ / Settings. |
| Multi-Agent Planner/Researcher/Critic | `chat.ts` ist schon der Loop (Suche → Gemini → Retry). Extra-LLMs = Latenz, zweite Persona. **Won’t.** |

### Was der Wunsch richtig sieht

| Beobachtung | Warum das bei uns zählt |
|-------------|-------------------------|
| Recherche ohne Speichern ist weg, sobald das Gespräch scrollt | `last_research_json` ist ephemeral. Notes/Docs sind unstrukturiert. Prefs-Cap 80 darf **kein** Paper-Dump werden. |
| Persönliches Gedächtnis ≠ Fachwissen | Mate/WLAN vs. „was steht in *unserem* Arc-Reactor-Pack“. Mischen = Prune killt das Falsche. |
| Später andere Fächer | Ein Pack pro Thema, Aliase, Retrieve nur bei Treffer. |
| Quellen bleiben sichtbar | Reel-Glaubwürdigkeit kommt von Papers, nicht von Ton. Claims ohne URL sind Meinung. |
| Nutzer lehrt nach | Lab-Notiz / „stimmt nicht“ / Merge — analog Memory-Gate, aber **Pack-lokal**. |

---

## 3. Netz — wie man das 2026 wirklich baut

Verifizierter Kern, nicht Blog-Hype:

| Quelle | Was real ist | Was wir übernehmen | Was wir lassen |
|--------|----------------|--------------------|----------------|
| [A-MEM](https://arxiv.org/abs/2502.12110) | Note mit Tags; alte Notes **evolven**; Links | Pack mit Aliases; REVISE/MERGE im Pack | ChromaDB, MiniLM, Python-Lib |
| [PersonalAI](https://arxiv.org/abs/2506.17001) (Jun 2025) | Memory als **Claims / Triples / Theses**, nicht nur Chunk-RAG | Eine Claim-Zeile + Quelle + `user_ok` | Neo4j, PageRank, zweiter Vektorindex |
| [Reckons.AI](https://github.com/Data-Insight-Solutions/Reckons.AI) | Local-first, IndexedDB, Nutzer **bestätigt** Fakten vor dem Graph | Teach = Review, nicht still extract | RDF/Turtle, 3D-Graph, WASM-LLM |
| Structured RAG (Claims + Provenance im Prompt) | LLM begründet aus **kurzer** Liste, nicht aus 20 Chunks | `knowledgeBlock` wie `memoryBlock`: 4–8 Zeilen | Graph-aware Cypher, ColBERT |
| Industry GraphRAG (Kairos, Memgraph, …) | Millionen Docs, HNSW, Triple-Extract | — | Server-Stack. Cargo-Cult auf dem Handy. |
| Fine-Tune vs RAG (Konsens 2025/26) | Fine-Tune = Stil/Schema; **Wissen** = Retrieve + Update | Persona bleibt; Wissen liegt im Pack | LoRA auf 0,5B, Distillation |

**Leitentscheidung:** Fachwissen ist ein **zweites, kleines, getyptes Store** (Packs), nicht mehr Pins im Cap-80 und nicht Gewichte. Deep Research ist ein **Modus der bestehenden Suche** (mehr Queries, mehr Tokens, Zitate), kein neuer Agent.

---

## 4. Ist — was der Code schon tut

Nicht „keine Recherche“ und nicht „kein Lernen“. Die Lücke ist die **Brücke**.

| Fläche | Datei | Ist | Lücke zum Reel |
|--------|-------|-----|----------------|
| Live-Suche | `research-parse.ts` `isLiveLookup` | „recherchier“, Vergleich, lange Erklär, BIP, Benzin, Tweets | Kein **Deep**-Flag (mehrere Fach-Queries, Papers) |
| Provider | `web-search.ts` `fillResearchLinks` | DDG-HTML + Instant + Wikipedia; Produkt 2–3 Queries; Fakt + destatis | Ein Query-String, kein Problem/Constraint/Compare/arxiv |
| Hirn-Loop | `chat.ts` | Gemini Search + Digest + 2 Pässe (Retry bei Gap/Truncation), max 900 Tokens | Speichert nicht; Offer nur bei Search-off / Refusal |
| Pending | `research-pending.ts`, `last_research_json` | Offer „ja bitte“, TTL, Audit | Kein „Soll ich das als Fachwissen merken?“ |
| Prefs | `memory.ts` / Gate | `merk dir` → Cap **80**, kind/tense | Fachtext wird `key=notiz` oder IGNORE. Prune frisst Papers. |
| Notizen | `notes` / digest | Freitext | Kein Thema, keine Claims, kein Retrieve-Thema |
| Datei | `doc.ts` | PDF/Text/Foto (OCR = Gemini + Foto) | Bleibt Dokument, wird nicht Pack |
| Retrieve | `retrieve.ts` | Token+RRF über memory/notes/events/… | **Kein** Pack-Store. `memoryBlock` filtert sogar `store==='memory'` (Sprint 198) |
| Prompt | `persona.ts` / `prompt-split.ts` | Persona cachebar; Memory am User-Turn | Kein `knowledgeBlock` |
| Hausstand | `backup.ts` | memory, notes, docs nicht in Backup-JSON (docs lokal) | Keine Packs |
| Router | `registry.ts` + `conflicts.ts` | Parser-Score, kein `if` in `chat.ts` | Kein Teach-/Pack-Parser |

**Deep Research heute:** eine DuckDuckGo-Seite plus optional Gemini-Grounding. Gut für Wetter/Preis/BIP. Schlecht für „redesign the power source“ — dafür braucht man **mehrere Fragen** und **Persistenz**.

**Anlernen heute:** nur Prefs (`merk dir Mate`) oder eine Notiz. „Lern das“ trifft den Ventilator-IR-Pfad (`fan.ts` „Nichts gelernt“), nicht Wissen.

---

## 5. Soll-Architektur `11.0`

```text
User: „Recherchiere tief: Anzugs-Energiequelle ehrlich, keine Marvel-Magie.“
        │
        ▼
  parseDeepResearch (research-parse, Score) ──► fillDeepResearchLinks
        │                                         3–5 Queries:
        │                                         Problem / Constraint /
        │                                         Vergleich / Review / Wikipedia
        ▼
  Gemini + Digest (bestehender Loop, wantSearch)
        │
        ▼
  Antwort + Quellen-Chip
        │
        ▼
  Offer (nicht still): „Soll ich das als Fachwissen «Antriebsquelle» merken?“
        │
        ├─ ja / „lern das“ / „merk dir als Fachwissen X“
        │     parseTeachIntent → harvest last research | Notiz | PDF | Paste
        │     → KnowledgePack (user_ok=true)
        │
        └─ nein → nichts in Packs

Später: „Was steht bei uns zur Antriebsquelle?“
        parsePackAsk → retrievePacks (Alias/Token)
        knowledgeBlock nur bei Treffer → Gemini/0,5B
        0,5B ohne Treffer: ehrlich „kein Pack“

Anderes Fach: gleicher Weg, zweites Pack. Retrieve mischt sie nicht.
```

### Schema (Sprint 202)

Neues IndexedDB-Store `knowledge_packs` (DB-Version +1, heute `jarvis-ondevice` v7). **Nicht** in `memory`.

```ts
type KnowledgeClaim = {
  id: string
  text: string                 // ein Satz, ≤ 240 Zeichen
  source_urls: string[]        // belegt oder leer
  user_ok: boolean
}

type KnowledgePack = {
  id: string
  topic: string                // slug: antriebsquelle, steuer-2026
  title: string
  aliases: string[]            // arc reactor, reaktor, power source
  summary: string              // 1–3 Sätze, ≤ 800
  claims: KnowledgeClaim[]     // max 24
  sources: ResearchSource[]    // Provenance der letzten Ernte
  origin: 'research' | 'note' | 'doc' | 'paste' | 'user'
  taught_at: string
  updated_at: string
  user_ok: boolean             // false = Entwurf, nicht injecten
}
```

| Konstante | Wert | Warum |
|-----------|------|--------|
| `PACK_CAP` | **12** | Mehr Fächer später, Handy bleibt klein |
| `CLAIM_CAP` | **24** / Pack | Prompt-Budget; nicht 80 Prefs |
| `PACK_SUMMARY` | 800 Zeichen | 0,5B / Gemini-Variable |
| `knowledgeBlock` | max **8** Claim-Zeilen | Wie Memory: kurz, sonst Halluzination |

Hausstand: optionales Feld `knowledge_packs` in `backup_version: 1` (wie `price_watches`). Alter Export bleibt gültig.

### Parser (kein `if` in `chat.ts`)

| Datei | Intent | Beispiele | Nicht |
|-------|--------|-----------|--------|
| `teach-parse.ts` | teach | „lern das“, „merk dir als Fachwissen X“, „das gehört zum Fachwissen Reaktor“ | „merk dir Zahnarzt Freitag“ (Kalender), „merk dir Mate“ (Memory), IR-Lernen |
| `pack-parse.ts` | pack_ask / pack_forget | „was weißt du **bei uns** zur Antriebsquelle“, „Fachwissen Reaktor“, „vergiss Fachwissen X“ | „was trinke ich“, „welche Reisen“ |
| `research-parse.ts` | `isDeepResearch` | „recherchiere **tief**“, „deep research“, „entwirf“, „systematisch Papers“ | bloßes „recherchier Benzinpreis“ (bleibt Live-Lookup) |

Registry-Score + `conflicts.ts`: Teach schlägt Memory nur mit **Fachwissen/lern das** nach Research/Doc. Kalender+Wochentag bleibt Kalender.

### Prompt

`knowledgeBlock(packs, ask)` **nur** wenn Alias/Token trifft. Niemals alle 12 Packs dumpen. Nie `pickRoute`. e5 bleibt Freeze/Identität.

0,5B: bei Treffer die Claims vorlesen (Parser-Reply möglich). Ohne Treffer kein Marvel-Vortrag.

### Deep Research (Sprint 205)

`fillDeepResearchLinks` **in** `web-search.ts` (oder Nachbardatei), aufgerufen wenn `isDeepResearch` — nicht ein zweiter Chat-Zweig.

Queries (Beispiel Antriebsquelle):

1. Nutzerfrage roh  
2. `{thema} constraints materials energy density`  
3. `{thema} vergleich vorteile nachteile`  
4. `{thema} site:arxiv.org OR site:wikipedia.org`  
5. Deutsch: `{thema} Stand der Technik`

Gemini: bestehender Search-Pass, `maxOutputTokens` 900 belassen oder Deep **1200** nur in diesem Modus. Quellen-Chip Pflicht. Zahlen nur aus Snippets (`guardResearchReply` bleibt).

Nach Erfolg: Pending-Status `teach_offer` (nicht Search-off). „Ja“ / „lern das“ → Teach. Kein stiller Write.

---

## 6. Sprints

Reihenfolge = Lieferreihenfolge. Intensiv **196–201** und e5 **195** nicht stehlen. `11.x` ist eigene Schiene. Gerät 193 bleibt PO.

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **202** | `11.0.0` | Typen, Store, Cap, Hausstand-Feld, Won’t | Must | **CODE** |
| **203** | `11.10.0` | Teach-Parser + Harvest (last research / Notiz / Doc / Paste) | Must | **CODE** |
| **204** | `11.20.0` | Retrieve Pack + `knowledgeBlock` (nur Topic-Match) | Must | **CODE** |
| **205** | `11.30.0` | Deep-Research-Queries + Teach-Offer | Must | **CODE** |
| **206** | `11.40.0` | Settings Daten: Liste / Löschen / Export | Should | **CODE** |
| **207** | `11.50.0` | Gold T1–T6 + Kopierprompts (Reel + zweites Fach) | Must | **CODE** |
| **208** | `11.60.0` | Pack-REVISE / Lab-Notiz / „stimmt nicht“ im Pack | Should | **CODE** |

Gebündelt in Code **`11.60.0`**. Sideload-APK unverändert `10.60.2`.

### Abhängigkeit zu Memory-10

| Wenn 196–198 noch rot | `11.0` trotzdem |
|------------------------|-----------------|
| Alias zu breit | Pack-Aliases sind **eng und vom Nutzer**; nicht das Pref-Lexikon |
| G5 Echo | Pack-Ask geht über eigenen Parser, nicht `formatRecallReply` |
| `memoryBlock` droppt Memory-Hits | `knowledgeBlock` ist **neue** Funktion, nicht Memory-Reuse |

Parallel ausführbar. Nicht in `memory-gate.ts` Fachwissen verstecken.

---

## 7. Gold (Sprint 207) — ohne e5, ohne Reel-Audio

| ID | Ablauf | Soll |
|----|--------|------|
| **T1** | Paste + „lern das als Fachwissen Antriebsquelle: Palladium ist knapp, Integration ist das Engpass.“ | Pack existiert, `user_ok`, Claim-Text drin |
| **T2** | „Was steht bei uns zur Antriebsquelle?“ | Reply aus Pack, nicht frische Erfindung |
| **T3** | „Was trinke ich?“ bei vorhandenem Pack | **Kein** Pack im Prompt / keine Reaktor-Antwort |
| **T4** | Zweites Pack „Steuer 2026“ | Unabhängig; T2 trifft nicht Steuer |
| **T5** | „Vergiss Fachwissen Antriebsquelle“ | Pack weg; T2 ehrlich leer |
| **T6** | `isDeepResearch('Recherchiere tief: … Entwirf …')` | true; `fillDeepResearchLinks` ≥ 3 Queries (Unit, Netz mockbar) |

Kopierprompts Settings → Tests, Gruppe **Fachwissen-11** (wie Memory-10). Reel-Satz **ohne** Marvel-Magie, plus ein Alltagsfach (Steuer / FritzBox-Doku), damit „später anderes ergänzen“ sichtbar ist.

---

## 8. Won’t

- Fine-Tune / LoRA / Distillation des 0,5B oder Gemini
- Qdrant, HNSW, Qwen-Embed, ColPali, zweiter Encoder als Router
- e5 verdrahten „weil Fachwissen“ — 195 bleibt Freeze
- Stiller Web-Crawl, 6–12 h Background-Job, FGS-Research
- Instagram/TikTok/Reel Download, Video-ASR, „lies das Reel“ als Must
- Auto-Code der App / der „Rüstung“
- Tony-Stark-Persona, englische Filmzitate
- Fachwissen in Cap-80-Pins
- Neues `if (teach)` in `chat.ts`
- Scanned PDF ohne Foto als OCR (V4-Regel bleibt)
- Play Store, Banking, 112, stilles WhatsApp

---

## 9. Ehrliche Grenzen (in UI/Won’t-Liste wiederholen)

| Wunsch | Wahrheit |
|--------|----------|
| Reel-Ton als Quelle | Nutzer **fügt Text ein** oder teilt eine **öffentliche** URL (Wikipedia, arXiv, Blog). IG oft 401. |
| „PhD in 6 Stunden“ | Handy: 1–2 Gemini-Pässe + 3–5 DDG/Wiki-Queries. Tiefe = **gespeicherte Claims**, nicht Wandzeit. |
| Redesign der Rüstung | Kein Labor, keine CAD. Antwort = belegte Constraints + Quellen. Experiment bleibt Mensch. |
| Offline 0,5B erklärt Kernphysik | Ohne Pack: ablehnen. Mit Pack: Claims vorlesen. Entwurf braucht Gemini. |
| Jede Suche wird Wissen | Nur nach Teach / Offer-Ja. |
| Gerät / Mic | Unverändert PO (193). |

---

## 10. Abnahme dieser Datei

- [x] Reel und Manina-Serie vom Marketing getrennt.
- [x] Code-Ist (Suche, Memory, Notes, Docs, Retrieve, Prompt) ehrlich.
- [x] Netz-Ist: Claims+Review+IndexedDB, nicht GraphRAG-Server.
- [x] Sprints 202–208, Versionen `11.0`–`11.60`, kein Diebstahl von `10.61`.
- [x] Execute 202–208 in `11.60.0`. Kein APK-Bump.

Index: [`42-planned.md`](./42-planned.md). Memory-10: [`56-next.md`](./56-next.md). Intensiv: [`57-next.md`](./57-next.md). Versionen: [`09-versioning.md`](./09-versioning.md).

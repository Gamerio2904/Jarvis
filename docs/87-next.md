# 87 — Hirn härten **CODE + APK** (`18.15.0`)

PO: Jarvis soll klüger wirken, ohne ein zweites Hirn und ohne Schwarm.
Grundlage ist der Code in **`18.14.2`**, nicht [`67-upgrades.md`](./67-upgrades.md)
als Wunschzettel. Parser wählen Geräte. Ein Domänen-Agent pro Zug.
Groq primär → Gemini Spezialist → 0,5B Fallback.

**Dieses Dokument ist nach Execute CODE.** Sprints **361–368**. Sideload
**`18.15.0`**, versionCode `181500`. Test: [`TEST-18.15.md`](./TEST-18.15.md).

Andere Drafts bleiben getrennt: Koch `#149` (342–346), Kamera-Wahl `#151`,
Clips `18.13` `#152` (348–352), Experte `#153` (353–355), Docs-Stand `#156`.

## 0. Ist (Diagnose)

| Stelle | Heute (`18.14.2`) | Folge |
|--------|-------------------|--------|
| Retrieve | Token+RRF, linear IndexedDB. `applyE5Rerank` ist **Identität** auch wenn das Paket „ready“ ist (`retrieve.ts`) | Treffer-Reihenfolge ändert sich nie. Encoder darf trotzdem **nie** `pickRoute` |
| e5 | Schalter `e5_rerank`, Datei nicht in der APK. Sprint 195 **FREEZE** (G2/G3 grün ohne Encoder) | Tauwetter nur Retrieve-Rerank, nie Router |
| Propose | Groq-JSON → deutscher Satz → Parser bestätigt (`tool-propose.ts`, `rescueByProposal`) | Umschreibungen ohne Vertrag / ohne Parser-Treffer enden im Smalltalk oder in Absage |
| Knowledge | `KNOWLEDGE_PARSER_ALLOW` = `film`, `watchlist`, `calendar`. Claims mit URL | News/Suche/Sport/Recht/Teach sehen Packs nicht |
| Abort | `turn-abort.ts` + `http-json` + `saveSettings`-Sperre **CODE** (253). `makeDirectorCtx` setzt **kein** `ctx.signal` | Groq-SSE, `llm.ts`, Spotify, TV-Poll, Native-Fetches laufen nach Barge-in weiter |
| Presence | Handler `/v1/presence` **CODE**. Settings: „Ohne Native-Bind“. Kein Plugin in `MainActivity` | Schalter an → ehrlich tot, PC-Fenster `:18791` erreicht das Handy nicht |
| Stimme | `createSpeakPipeline` Edge zuerst. `VoiceMode` wartet die **ganze** Antwort, dann `pipe.push(spoken)` | Parser-Satz steht, Mund schweigt bis Groq/Gemini fertig ist |
| Lage | `globe-copy.ts` Sätze aus Feldern (OpenSky/EONET/USGS). `pinLineFor` fällt auf Gazetteer-Blurb oder Briefing-Rest | Pin kann einen anderen Ort erzählen als der Pin |
| Parser-Miss | Gold in `eval/corpus.ts`. Nutzer sagt „nein, Timer“ — nichts landet im Katalog | Derselbe Miss jeden Tag. Kein Fine-Tune |
| Schwarm | Director **ein** Agent/Zug. `chain.ts` sequentiell. `Promise.all` nur **in** einem Handler (Retrieve, Globe-Brief) | Kein 5. LLM-Organizer. Erlaubt: paralleles **Lesen** in einem Agenten, **ein** Satz |

Hirn-Slots bleiben: Groq → Gemini (Vision/Deep Research) → Qwen 2.5 0,5B.
Größeres On-Device-Modell ohne Messung: **Won’t** (Piper/Kokoro/e5-APK Freeze 181).

## 1. Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Router | Parser + Konflikte + Kosten. **Kein** Embedding in `pickRoute`. |
| Encoder | Nur `applyE5Rerank` auf Retrieve-Hits, opt-in, Datei fehlt = RRF. Nie in der Default-APK ohne Gold-Rot. |
| Propose | Groq nennt Werkzeug+Satz. Ausgeführt wird nur, was `decideTurn` auf `run` setzt. Kein Groq-als-Router. |
| Knowledge | Packs zitieren (Claim + URL) auf **Lese**-Allowlist. Nicht TV/GPIO/SMS/Anruf. |
| Abbruch | Ein Signal pro Zug bis in **jeden** `fetch`, nicht nur `http-json`. |
| Presence | Native Mini-HTTP `:18791`, nur LAN, Token wie heute. Default aus. |
| Mund | Erster Parser-Satz spricht, Edge zuerst. Nicht auf das Hirn warten. |
| Lage | Satz nur aus Pin-Feldern / Schicht-Payload. Kein Gazetteer-Klischee fremder Städte. Nie „Live“, nie Interpolation. |
| Lernen | Miss + Korrektur → Gold-Zeile in `GOLD_EXPECT` / `TEST_PROMPTS`. Keine Gewichte. |
| Schwarm | **Kein** AutoGen, kein Katalog-`organizer`, keine parallelen Domänen-Agenten. |

Was **kein** Schwarm ist und bleiben darf:

```text
ein Agent (news | globe-brief | retrieve)
  → Promise.all nur read
  → ein Satz, Quellen genannt
chain.ts: Intent 1, dann Intent 2 (nicht parallel schreiben)
BrainOrchestrator: ein Slot, wenn Parser none
```

## 2. Warum nicht die naheliegenden Ideen

| Idee | Warum nicht |
|------|-------------|
| LLM-Schwarm / AgentGrid / 5. Organizer | Honesty, Kontingent, Geräte-Lügen. Ist: Director. [`70-next.md`](./70-next.md) §0b |
| e5 in `pickRoute` | Sprint 257: Tor hielt ohne Embeddings. Encoder entscheidet nie Ausführung |
| e5 in die Sideload-APK | 195 Freeze. G2/G3 grün. Datei ~100 MB. Nur nach Messung und Gold-Rot |
| 1,5B / 3B on-device statt 0,5B | Ohne P95 auf dem PO-Handy. 0,5B bleibt letzter Fallback |
| Knowledge an alle 63 | TV/Timer/SMS würden Pack-Essays statt Schalten |
| Groq wählt den Agenten | `proposeTool` existiert. Zweiter Modellaufruf vor dem Parser = Router |
| Cesium / `globe.gl` / Live | Freeze 270, [`86-next.md`](./86-next.md) Won’t |
| Positions-Interpolation | Erfundene Koordinate |
| Fine-Tune aus Korrekturen | Sideload, kein Trainings-Stack. Gold-Tests skalieren |
| Presence WAN / mDNS ins Internet | V9 LAN-only |
| Silero/Piper in die APK | Could-ONNX Freeze 181, bis Messung |

## 3. Architektur

```text
Utterance
  → Director (ein Agent)
       abort: beginTurnAbort → ctx.signal + http-json + Rest-fetch
       miss + looksCommandish → proposeTool → confirmedUtterance → Parser
       hit read + Allowlist → knowledgeBlock (Claims + URL)
  → Voice: erster Satz aus Parser/Stream → pipeline.push (Edge)
  → Miss später: Nutzer „nein, das war Timer“ → Gold-Kandidat, nicht Gewicht

Retrieve (nur Recall/Memory-Prompt)
  → Token+RRF
  → optional e5-Rerank der Hits
  → nie pickRoute

Presence (Should, eigenes Native)
  → JarvisPresence Plugin, ServerSocket 18791, 192.168/10 only
  → handlePresenceHttp (schon CODE)
```

| Teil | Wer | Neu? |
|------|-----|------|
| Retrieve | `retrieve.ts` `applyE5Rerank` | Rerank-Körper wenn Pack da; Tests: Router importiert e5 nicht |
| Propose | `tool-contract.ts`, `director.ts` | mehr Verträge, Repair bleibt, Parser-Pflicht |
| Knowledge | `knowledge-block.ts` | Allowlist Lese-Agenten |
| Abort | `director.ts`, `groq.ts`, `llm.ts`, Native-Fetches | Signal durchreichen |
| Presence | neu `JarvisPresencePlugin.java` | Bind; Handler bleibt |
| TTS | `VoiceMode.tsx` / `chat.ts` | Satzgrenze nach Parser, nicht nach Hirn-Ende |
| Lage | `pinLineFor`, Schicht-Copy | nur Felder des Pins |
| Gold | `eval/corpus.ts` | Import aus Miss-Log / Debug-Export |

## 4. Won’t

LLM-Schwarm. Katalog-Agent `organizer` / `meta` / `supervisor`.
Parallele Domänen-Agenten in einem Zug. e5 in `pickRoute`.
e5/Piper/Kokoro/größeres LLM in der Default-APK ohne Messung.
Cesium, `globe.gl`, „Live“, Interpolation, Starlink-Wolke.
Stilles Posten. Inoffizielle APIs. Fine-Tune. Mem0/Qdrant/Graphiti.
Zweites IndexedDB. Presence im WAN. Merge von `#149`/`#151`/`#152`/`#153`/`#156`.

## 5. Sprints

| Sprint | Inhalt |
|--------|--------|
| [361](./sprints/sprint-361.md) | Retrieve: Encoder nur Rerank, nie `pickRoute` |
| [362](./sprints/sprint-362.md) | Propose: Paraphrase härten, Parser bestätigt |
| [363](./sprints/sprint-363.md) | Knowledge: zitierbar auf ausgewählten Lese-Agenten |
| [364](./sprints/sprint-364.md) | AbortSignal: Rest bis Groq/Native |
| [365](./sprints/sprint-365.md) | Presence: Native Bind `:18791` |
| [366](./sprints/sprint-366.md) | Stimme: Satz-TTS nach Parser-Satz, Edge zuerst |
| [367](./sprints/sprint-367.md) | Lage: Pin-Satz nur aus Feldern (Rest nach `18.14.2`) |
| [368](./sprints/sprint-368.md) | Parser-Korrektur → Gold; paralleles Lesen ein Satz; Härten |

Harte Kette: 361 unabhängig (darf nicht Router anfassen). 362 vor 368
(Gold braucht denselben Propose-Pfad). 363 nach 361 (Retrieve bleibt
getrennt von Packs). 364 vor 366 (Barge-in bricht den Mund **und** den
Fetch). 365 frei. 367 frei neben 361–366. **368 zuletzt.**

Landet in App-Code **`18.15.0`**. Sideload **`18.15.0`**.

## 6. Abnahme (nach Execute)

Gerät, nicht nur diese VM. [`TEST-18.15.md`](./TEST-18.15.md).
Kein Wort „Live“ auf der Kugel. Kein zweiter Agent im selben Zug.
e5-Datei nicht in `releases/Jarvis.apk`, außer 195 ausdrücklich aufgetaut
und gemessen.

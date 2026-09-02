# 52 — Latenz, Qualität, Profession (Recherche)

PO 2026-09-02: nicht der Alltag-Zettel (`8.32` / `5.12`), sondern **was Industrie, Hugging Face, GitHub und Papers** für Voice-/Assistenten tun — und was davon in **unseren** TypeScript/Capacitor-Stack passt.

**Ist:** Code **`9.9.0`**. Parser zuerst, Hirn Gemini → Groq → 0,5B. Stimme: Android-STT + Gemini-TTS (Algieba) mit Satz-Tap (`speak-tap.ts`) und Speak-Pipeline. Barge-in nur per Orb-Tipp, nicht aus dem Mikrofon. Prompt = Persona **plus** Memory/Retrieve/Working **in einem** `system_instruction`. Groq ohne Token-Stream. Kein ONNX-VAD.

**Diese Runde CODE (Loop, nicht neuer Stack):** Prompt-Prefix splitten (`prompt-split.ts`), Groq SSE, Latenz-SLO (`latency.ts`), TLS-Warmup. Rest bleibt Vorschlag.

Quellen sind **Ideen**, keine Dependencies. LanceDB, Nemotron, Pipecat-Server, Moshi-Gewichte: Won’t in der APK — gleiches Votum wie [`49-next.md`](./49-next.md).

---

## 1. Was die Industrie misst

Menschliche Gesprächslücke: **~200 ms** (cross-linguistisch, Stivers et al.; Voice-Agent-Surveys 2025/26 wiederholen die Zahl). Branchenbänder:

| Mund-zu-Ohr | Wirkung |
|-------------|---------|
| 200–300 ms | natürlich |
| ~500 ms | spürbar |
| 800 ms–1 s | Nutzer redet drüber (falsches Barge-in) |
| > 1,5 s | Gespräch wirkt kaputt |

Twilio-Budget (klassische Pipeline): STT 350 + LLM-TTFT 375 + TTS-Erstbyte 100 ≈ **1,1 s** Median. LiveKit/Pipecat messen **750–950 ms** End-to-End, wenn Stream + VAD sitzen. Unser Flaschenhals ist nicht das 0,5B, sondern **Endpunkt + Gemini-TTFT + ganze TTS-Blobs**.

Softcery/Deepgram: Endpointing (Stille abwarten) ist oft **150–400+ ms** — größer als Silero selbst (~2 ms/Frame). Deshalb ersetzen Produktionsstacks reine Stille durch **semantisches Turn-Taking**.

---

## 2. Hugging Face — Modelle, die zu uns passen

| Modell | Was es ist | Bei Jarvis |
|--------|------------|------------|
| [pipecat-ai/smart-turn-v3](https://huggingface.co/pipecat-ai/smart-turn-v3) | Whisper-Tiny-Encoder + lineare Klasse, **8 M**, 8 MB int8-ONNX. Sagt „Turn fertig?“ aus der Wellenform, nicht aus dem Transkript. | **Nächste Stimme.** WASM/`onnxruntime-web` oder JNI. Läuft nur in der Stille nach Silero (~200 ms), nicht dauernd. Deutsch in den 23 Sprachen. |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | ~2 MB, CPU, Frames 32 ms. Industrie-Default vor Smart Turn. | **Nächste Stimme.** Energie-RMS in `VoiceMode.tsx` ist der billige Vorläufer; Silero reduziert Halluzination und False-Barge-in. |
| [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) `de_DE-thorsten` / `miro` / `kerstin` | VITS-ONNX, Pi-tauglich, deutsch. | **Qualität TTS offline.** Über [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) als Engine-APK oder JNI neben Algieba. First-audio lokal, ohne 3,5 s Gemini-Budget. |
| [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) | Studio-TTS, langsamer, größer. VoxSherpa nutzt es auf Android. | **Could.** APK-Gewicht vs. Algieba-Qualität messen, nicht beides parallel. |
| [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) | ~120 MB Embed, Rerank. | **Could** nur zum Umsortieren von `retrieve.ts`-Treffern, **nie** als Router. Gleicher Satz wie in `49-next`. |
| LLMLingua-2 / BERT-Kompressor | Prompt 3–20× kürzer. | **Won’t.** Extra-Modell + Python. Unser Hebel ist Prefix-Stabilität (Gemini/Groq cachen selbst), nicht Token-Löschen. |
| Moshi / Mini-Omni / GLM-4-Voice | Speech-to-Speech, Full-Duplex. | **Won’t.** Zweites Hirn, andere Persona, GPU. Loop (Duplex) ja, Gewichte nein. |

---

## 3. GitHub — ähnliche Projekte (Loop klauen)

| Projekt | Stack | Was wir nehmen | Was wir lassen |
|---------|-------|----------------|----------------|
| [Pipecat](https://github.com/pipecat-ai/pipecat) + [smart-turn](https://github.com/pipecat-ai/smart-turn) | Python-Frames, Daily/WebRTC | InterruptionFrame: LLM abort + TTS-Flush + **nur Gesprochenes** in den Kontext. Smart Turn nach kurzem VAD (`stop_secs=0.2`). | Pipecat-Server, Cloud-Transport. |
| [LiveKit Agents](https://github.com/livekit/agents) | WebRTC-SFU | Barge-in am Audio-Eingang, nicht am Transkript. | SFU, TURN, zweites Backend. |
| [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | ONNX, Android/iOS/WASM | Streaming-ASR + Piper-TTS + Silero-VAD in **einer** Runtime. Deutsch-Piper fertig. | Wyoming-Docker, Pi-Satellite. |
| Home Assistant + Wyoming | Whisper/Piper/openWakeWord als Sockets | Modular: STT/TTS/Wake austauschbar. Unser Parser ist das Analogon zu Intents. | Container auf dem NAS. Handy bleibt Hirn. |
| Rhasspy / open-jarvis | Wake + faster-whisper + Piper | Satz-Streaming in TTS, WebRTC-Barge-in als Zielbild. | Porcupine-Key, Rust-Bridge. |
| Groq Prompt Caching | exakter Prefix | Statisches System vorn, Variables hinten. 50 % weniger Prefill bei Hit. | Semantic Redis-Cache (falsche Antworten auf „wie spät“). |

OpenAI Realtime / Gemini Live: `semantic_vad` + `conversation.item.truncate(audio_end_ms)`. Das ist der professionelle Vertrag: **History = was der Nutzer gehört hat**, nicht was das Modell erzeugt hat. Bei uns nach Barge-in noch nicht.

---

## 4. Papers & Patterns (ohne GPU-Paper-Stack)

| Quelle | Befund | Unser Hebel |
|--------|--------|-------------|
| LLMLingua (EMNLP’23) / LongLLMLingua | Prompt komprimieren | Won’t-Lib. Stattdessen: Persona nicht mit Memory vermischen, History 8 Turns (Cloud) schon knapp. |
| MInference (KV/Prefill) | Prefill 10× | Provider-seitig (Gemini implicit cache, Groq prefix). Wir müssen den Prefix **stabil** halten. |
| Semantic Turn Endpointing (Agent Patterns Catalog) | Stille ≠ fertiger Gedanke. Backchannel ≠ Barge-in. | Smart Turn **nächste** Stimme; bis dahin Endpoint nicht verkürzen. |
| Gemini / Vertex Context Cache | Implicit ab ~2k–4k Tokens, **gemeinsamer Prefix vorn**. | `system_instruction` = nur Persona (+ Voice-Hint). Memory an den letzten User-Turn. |
| Redis/Future AGI Cache-Tiers | L1 exakt → L2 semantisch → L3 Prompt-Cache | L3 jetzt (Prefix). L1 FAQ nur für Parser (haben wir). L2 Embed Won’t bis Retrieve knirscht. |
| Revolut / Kwindla (2026) | Silero-Trigger + Smart-Turn-Judge → Endpunkt **200 ms statt 800 ms** | Nächste Stimme. Entscheidung aus Audio, nicht aus ASR-Lag. |

---

## 5. Wo unser Code heute steht

| Stufe | Datei | Heute | Industrie |
|-------|-------|-------|-----------|
| Endpunkt | Android `listenOnce`, Web Speech `no-speech` | Stille / OS-STT | Silero 200 ms + Smart Turn |
| Barge-in | `VoiceMode` Orb → `__barge_in__` | Tipp, Echo-sicher | VAD während TTS + Truncate |
| LLM-TTFT | `streamGemini` SSE, `completeGroq` **blocking** | Groq wartet aufs ganze JSON | Stream + erster Satz in TTS |
| Prompt-Cache | Persona+Memory+Working in **einem** System | Jeder Turn busted den Prefix | Statisch vorn |
| First audio | `createSentenceTap(true)` + `createSpeakPipeline` | Satzweise, aber Gemini-TTS ist Blob | Piper/Flux first-byte ~80–200 ms |
| Observability | Debug-Turn `ms` gesamt | Kein TTFT / First-Audio | Spans: VAD, STT, TTFT, TTS-Flush |
| Recall | `retrieve.ts` RRF, Keyword | Gut für Hunderte Zeilen | e5-small erst wenn messbar falsch |

Parser-first bleibt der größte Latenzgewinn, den wir schon haben: Timer/Wetter/Route **ohne** LLM.

---

## 6. Vorschläge, gerankt

### Jetzt (diese Runde, CODE)

1. **Prompt-Prefix splitten** — Gemini implicit cache + Groq prefix. Persona (± Sprach-Hint) = `system_instruction`. Memory, Working, Last-Step, Suche-Hint, Digest → ans letzte User. Dateien: `prompt-split.ts`, `chat.ts`, `gemini.ts` (Body bleibt System+Contents).
2. **Groq streamen** — SSE `delta.content`, damit VoiceMode denselben Sentence-Tap wie bei Gemini bekommt. Fallback: altes JSON. Native SSE: `Authorization: Bearer`.
3. **Latenz-SLO** — `hear→first_token→first_audio→done` in `latency.ts`. Tests-Reiter + Debug-Dock zeigen die letzte Zeile. Bänder: Parser soll << 200 ms, Cloud-TTFT sichtbar.
4. **TLS-Warmup** — einmal `no-cors` gegen Google/Groq nach Start, damit der erste Turn nicht die Handshake-Steuer zahlt.

### Als Nächstes (Stimme, eigene Sprints, nicht Alltag-Execute)

5. **Silero-VAD + Smart Turn v3** — **CODE Loop** in `turn-detect.ts` / `vad.ts` / Native-Listen. Endpoint 200 ms wenn der Satz fertig klingt, 800 ms bei „und …“. ONNX-Gewichte (8 MB Smart Turn, Silero) bleiben Could wenn Energie+Transkript im Auto knirscht.
6. **Barge-in aus dem Mic** + Truncate — **CODE**. `watchBargeIn` (Web echoCancellation, Android `AudioRecord` + AEC). History = Gesprochenes (`truncateSpoken` + `patchMessage`).
7. **First-Audio eine Stimme** — **CODE**. Erster Chunk Standing 480 ms Native-Race (System-TTS = Piper, wenn die Engine so heißt). Rest derselben Lane, kein Mix Algieba/Pico. sherpa-onnx nicht gebündelt (APK-Gewicht); Piper-Engine-APK vom System nutzbar.
8. **Groq specdec / kleinste Chat-Modelle** nur als Backup-Label, wenn TTFT-Messung Groq langsamer als Gemini zeigt.

### Could (Qualität / Profession)

9. **e5-small ONNX** nur Rerank von `retrieve.ts`. Spike wenn Keyword-RRF messbar daneben liegt.
10. **Eval-Spans im Debug-Export** — TTFT, First-Audio, Pfad, Cache-Hit (`usage.total_cached_tokens` von Gemini). P95 über den Lauf, nicht nur Mittel.
11. **Antwort-Cache L1** nur für identische Smalltalk-Utterances ohne Retrieve-Hits und ohne Uhr/Wetter. Sonst lügen wir bei der Uhr.

### Won’t (weiterhin)

- Pipecat/LiveKit als Runtime, Wyoming auf dem NAS, Moshi/Nemotron in der APK, LLMLingua-BERT, Embeddings als Tool-Router, OpenAI Realtime als Hirn (Persona/Siezen/Parser-first wären weg).

---

## 7. Mapping „einbauen“

| Idee | Datei(en) | Aufwand | Risiko |
|------|-----------|---------|--------|
| Prefix-Split | `prompt-split.ts`, `chat.ts` | klein | Persona darf nicht in den User-Turn rutschen |
| Groq-SSE | `groq.ts`, `voice.ts`, `JarvisVoicePlugin.java` | klein | Native Header Bearer |
| Latenz-SLO | `latency.ts`, Chat/Voice/Debug | klein | Keine PII, nur ms |
| TLS-Warm | `cloud-warm.ts`, `App.tsx` | winzig | no-cors, kein Key in der URL |
| Smart Turn | `turn-detect.ts`, Native-Listen | **CODE** Loop (ONNX Could) | Echo / unfertige Sätze |
| Mic-Barge-in | `VoiceMode.tsx`, `JarvisVoicePlugin` | **CODE** | False-Stop im Auto — Drive ohne Mic-Barge |
| First-Audio | `createSpeakPipeline` Lane | **CODE** | Eine Stimme pro Turn |
| e5 Rerank | `retrieve.ts` | Won’t bis RRF knirscht | 120 MB, nie Router |

---

## 8. Professionell, ohne Marvel und ohne zweites Produkt

- **SLOs statt Gefühl:** First-Token und First-Audio in den Debug-Export. Zielbänder oben. Regression = P95 +30 ms, nicht „wirkt langsamer“.
- **History = Gehörtes:** bei Interrupt nicht den ungespielten Gemini-Text merken.
- **Eine Denk-Quelle:** Cache und Warmup ändern nicht `pickBrain`. Parser bleibt vor dem Hirn.
- **Keys:** Warmup ohne Key in Query-String. Prefix-Split ändert keine Logs.

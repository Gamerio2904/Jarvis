# 61 — Jarvis 13.40 Sprachmodus **PLAN**

PO 2026-09-07: **Fernseher an** im Sprachmodus klappt nicht. Hören (Wörter + Autokorrektur), Antworten und Vorlesen sollen neu sitzen — kein neuer Stack.

**App-Stand:** Code und Sideload **`13.31.7`**. Hirn Gemini → Groq → 0,5B. Parser zuerst. Tippen `Fernseher an` ist **CODE** (`parseTvIntent` → `on`). Stimme hängt an Android-`SpeechRecognizer` / Web Speech, `repairSpeech`, `pickHeard`.

Gold später: `npm run test:014` plus Voice-Alts in `heard.ts`.

---

## Produkt in einem Satz

Im Sprachmodus gilt dasselbe wie im Chat: Gerät zuerst, dann 1–2 fertige Sätze, Mund ohne Ruckeln. „Fernseher an“ weckt den Samsung, auch wenn STT „Fernseheren“ oder „TV an“ liefert. Ohne Host/MAC ehrlich Settings, kein Smalltalk.

---

## 1. Ist (Code `13.31.7`)

| Fläche | Datei | Ist | Lücke |
|--------|-------|-----|--------|
| TV-Parser | `tv-parse.ts` | `Fernseher an` / `anmachen` / `einschalten` braucht `TV_ANCHOR` | STT ohne Anker → kein Tool |
| TV-Execute | `tv.ts` | `on` = WoL wenn `tv_enabled` + Host + MAC; Pairing erst für Tasten | Stimme landet oft nicht hier |
| Hören | `JarvisVoicePlugin.java`, `voice.ts` | Native 8 Alts, Web 5, `de-DE` | Kein Whisper; Alts ohne TV-Wort verlieren |
| Autokorrektur | `utterance.ts` | `fernseheren` / `fernsehern` → Fernseher | Kein `fanseher`, `fern sea`, `tv an` als Anker-Repair |
| Alt-Wahl | `heard.ts` `pickHeard` | Score +5 wenn `parseTvIntent` greift | Greift nur wenn schon ein Anker in der Alt steht |
| Antworten | `chat.ts` `voice: true` | `VOICE_HINT`, 240 Tokens, History −8 | Lange/stockende Sätze, Tool kommt zu spät wenn STT daneben |
| Mund | `tts.ts`, `edge-tts.ts`, `speak-tap.ts` | Edge 1100 ms vs Algieba 3500 ms Standing; Satz-Tap | Warte auf Blob, Rate 0.97, Pico-Race aus — immer noch Ruckeln wenn Lane wechselt |
| Tempo | `latency.ts`, `turn-detect.ts` | Stille 220/800 ms; First-Audio markiert | Gemini-TTFT + ganze TTS-Blobs > Gesprächslücke |

Getipptes `Fernseher an` in `test-014` / `test-prompts` ist grün. Das PO-Loch ist **Stimme → Text**, nicht der Tizen-Parser.

---

## 2. Leit

```text
Mic → 8 Alts → repairSpeech (TV-Wörterbuch) → pickHeard (TV-Score)
  → parseTvIntent / handleTv  (Gerät zuerst, ehrlich wenn tot)
  → sonst LLM + VOICE_HINT (1–2 Sätze)
  → Sentence-Tap → Edge|Algieba eine Lane → Mund
```

- Tool vor Smalltalk. Kein „Gerne, der Fernseher…“ ohne WoL oder ehrlichen Settings-Satz.
- Autokorrektur = Lexikon + Alt-Wahl, **kein** zweites ASR.
- Schneller = Endpunkt + First-Audio, nicht 3B.
- Flüssiger = eine TTS-Lane, Sätze hintereinander, kein Pico-Sprung.

---

## 3. Sprints

Eigene Schiene `13.40`. Kein Diebstahl von `13.31.7`. ONNX bleibt Freeze ([`54-next.md`](./54-next.md) 174–176).

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **221** | `13.40.0` | Leit + Won’t | Must | **PLAN** |
| **222** | `13.41.0` | TV-Stimme: Fernseher an | Must | **PLAN** |
| **223** | `13.42.0` | Hören + Autokorrektur | Must | **PLAN** |
| **224** | `13.43.0` | Antworten + Tempo | Must | **PLAN** |
| **225** | `13.44.0` | Mund flüssig + Gold + Sideload | Must | **PLAN** |

Sideload nach **225** als `13.44.0` (oder mitgeliefert in einem Execute-Commit). Bis dahin bleibt Sideload **`13.31.7`**.

---

## 4. Gold (nach Execute)

| ID | Soll |
|----|------|
| **S1** | `pickHeard('Fernseheren an', ['Fernseher an'])` → Text mit `parseTvIntent` `on` |
| **S2** | `TV an` / `Mach den Fernseher an` / `Fernseher einschalten` → `tv` |
| **S3** | `tv_enabled` aus → ehrlicher Settings-Satz, kein LLM-„ist an“ |
| **S4** | Repair `fanseher` / `fernseha` / `t v an` → Anker |
| **S5** | Voice-Reply ohne Markdown, 1–2 Sätze (Hint bleibt) |
| **S6** | Standing: First-Audio über Edge-Lane, keine Pico-Zwischenstimme |
| **S7** | `test:014` + `test:prompts` grün |

Handy-PO: einmal `Fernseher an` im Sprachmodus mit gekoppeltem TV (Sprint 178 bleibt getrennt).

---

## 5. Won’t

- Whisper, Gemini-STT, vosk, Cloud-ASR
- Piper / Kokoro / Silero-ONNX in der APK (Freeze bis Messung)
- Pipecat, LiveKit, Gemini Live Speech-to-Speech
- Zweites Hirn, 3B, Moshi
- Apple CarPlay
- Getipptes `Fernseher an` umbauen (ist CODE)

---

## 6. Abnahme

1. 221: Docs = Leit, Won’t fest.
2. 222: Stimme-Text mit TV-Anker trifft `handleTv`.
3. 223: Wörterbuch + Alts, Gold S1/S4.
4. 224: Voice-Hint/Token, First-Token nicht hinter dem Tool.
5. 225: Mund eine Lane, Sideload, Tests grün.

Sprints: [`sprints/sprint-221.md`](./sprints/sprint-221.md)–[`sprints/sprint-225.md`](./sprints/sprint-225.md). Stimme-Recherche: [`52-research-latency-quality.md`](./52-research-latency-quality.md). Index: [`42-planned.md`](./42-planned.md).

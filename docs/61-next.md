# 61 — Jarvis 13.40 Sprachmodus **CODE** `13.44.0`

PO 2026-09-07: **Fernseher an** im Sprachmodus. Hören (Wörter + Autokorrektur), Antworten und Vorlesen sitzen — kein neuer Stack.

**App-Stand:** Code und Sideload **`13.44.0`**. Hirn Gemini → Groq → 0,5B. Parser zuerst. Tippen `Fernseher an` bleibt **CODE** (`parseTvIntent` → `on`). Stimme: Android-`SpeechRecognizer` / Web Speech, `repairSpeech`, `pickHeard`.

Gold: `npm run test:014` plus Voice-Alts in `heard.ts` (S1–S7).

---

## Produkt in einem Satz

Im Sprachmodus gilt dasselbe wie im Chat: Gerät zuerst, dann 1–2 fertige Sätze, Mund ohne Ruckeln. „Fernseher an“ weckt den Samsung, auch wenn STT „Fernseheren“, „fanseher“ oder „TV an“ liefert. Ohne Host/MAC ehrlich Settings, kein Smalltalk.

---

## 1. Ist (Code `13.44.0`)

| Fläche | Datei | Ist |
|--------|-------|-----|
| TV-Parser | `tv-parse.ts` | `Fernseher an` / `einschalten` / `TV an`; Anker inkl. `fernsehen` |
| TV-Execute | `tv.ts` | `on` = WoL wenn `tv_enabled` + Host + MAC; sonst Settings-Satz |
| Hören | `JarvisVoicePlugin.java`, `voice.ts` | Native 8 Alts, Web 5, `de-DE` |
| Autokorrektur | `utterance.ts` | `fanseher` / `fernseha` / `t v` / `fernseheren` → Fernseher/TV |
| Alt-Wahl | `heard.ts` `pickHeard` | TV on/off +10, andere TV +8 |
| Antworten | `chat.ts` `voice: true` | `VOICE_HINT` Tool zuerst, 240 Tokens, History −8 |
| Mund | `tts.ts`, `edge-tts.ts`, `speak-tap.ts` | Edge vs Algieba, `firstBlobWins`, eine Lane pro Antwort; Rate 1.0; Pico-Race aus |

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

Eigene Schiene `13.40`. ONNX bleibt Freeze ([`54-next.md`](./54-next.md) 174–176).

| Sprint | Version | Thema | Must? | Stand |
|--------|---------|-------|-------|-------|
| **221** | `13.40.0` | Leit + Won’t | Must | **CODE** in `13.44.0` |
| **222** | `13.41.0` | TV-Stimme: Fernseher an | Must | **CODE** in `13.44.0` |
| **223** | `13.42.0` | Hören + Autokorrektur | Must | **CODE** in `13.44.0` |
| **224** | `13.43.0` | Antworten + Tempo | Must | **CODE** in `13.44.0` |
| **225** | `13.44.0` | Mund flüssig + Gold + Sideload | Must | **CODE** |

Sideload **`13.44.0`** (versionCode `134400`).

---

## 4. Gold

| ID | Soll |
|----|------|
| **S1** | `pickHeard('Fernseheren an', ['Fernseher an'])` → Text mit `parseTvIntent` `on` |
| **S2** | `TV an` / `Mach den Fernseher an` / `Fernseher einschalten` → `tv` |
| **S3** | `tv_enabled` aus → ehrlicher Settings-Satz, kein LLM-„ist an“ |
| **S4** | Repair `fanseher` / `fernseha` / `t v an` → Anker |
| **S5** | Voice-Reply ohne Markdown, 1–2 Sätze (`VOICE_HINT`) |
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
- Getipptes `Fernseher an` umbauen (war schon CODE)

---

## 6. Abnahme

1. 221: Docs = Leit, Won’t fest.
2. 222: Stimme-Text mit TV-Anker trifft `handleTv`.
3. 223: Wörterbuch + Alts, Gold S1/S4.
4. 224: Voice-Hint/Token, First-Token nicht hinter dem Tool.
5. 225: Mund eine Lane, Sideload, Tests grün.

Sprints: [`sprints/sprint-221.md`](./sprints/sprint-221.md)–[`sprints/sprint-225.md`](./sprints/sprint-225.md). Stimme-Recherche: [`52-research-latency-quality.md`](./52-research-latency-quality.md). Index: [`42-planned.md`](./42-planned.md).

# 14 — On-Device: Latenz, Qualität, Intelligenz

Quelle: Ist-Stand `0.13.1` (wllama WASM, **Qwen2.5-0.5B Q4**, `n_threads: 1`, kein Stream).  
Kein Cloud-LLM. Reihenfolge ist verbindlich: **Latenz → Qualität → Intelligenz**.

## Diagnose (warum es jetzt so ist)

| Hebel | Ist | Wirkung |
|-------|-----|---------|
| Threads | `n_threads: 1` | Handy-CPU ungenutzt — größte Latenz-Bremse |
| Stream | `stream: false`, max 96 Tokens, Timeout 75 s | Nutzer wartet auf die ganze Antwort |
| Kontext | Persona + **alle** Memory-Pins + letzte **8** Turns in `n_ctx: 1024` | Prefill langsam, 0.5B verliert den Faden |
| Smalltalk | jedes „Hey“ geht ins LLM | unnötige 5–20 s |
| Modell | 0.5B Q4 | Intelligenz-Decke; 7b-Niveau ist on-device WASM nicht das Ziel |
| Runtime | llama.cpp **WASM** | 3–8× langsamer als natives llama.cpp |

Memory/Tools umgehen das LLM schon — das bleibt der schnelle Pfad.

## Lieferreihenfolge

| Sprint | Version | Thema | Warum zuerst |
|--------|---------|-------|--------------|
| [46](./sprints/sprint-46.md) | **`0.13.2`** | Latenz | Gleiches Modell **und gleicher Prompt** — nur schneller |
| [47](./sprints/sprint-47.md) | **`0.13.3`** | Qualität | 0.5B klingt wie Jarvis, halluziniert weniger |
| [48](./sprints/sprint-48.md) | **`0.13.4`** | Intelligenz | Optional 1.5B; Default bleibt 0.5B |

Native llama.cpp (Capacitor-Plugin) = **`0.14.0`**, nicht in 46–48. Ohne das bleibt WASM die harte Decke.

---

## 1) Latenz (`0.13.2`) — **ohne Qualitätsverlust**

Gleiches GGUF, gleiches Sampling, gleicher Prompt (Persona, 8 Turns, alle Pins), gleiche `max_tokens: 96`. Nur Runtime/UI.

| ID | Update | Qualität | Erwartung |
|----|--------|----------|-----------|
| L1 | `n_threads` = `min(4, hardwareConcurrency − 1)` (Floor 2) | **neutral** — dieselben Tokens, schneller | 2–4× Decode |
| L2 | Token-Stream bis EOS (`stream: true`) | **neutral** — volle Antwort wie bisher, früher sichtbar | TTFT spürbar |
| L3 | Version `0.13.2` | — | UI/Health/Changelog |

**Nicht in 46** (das wäre Qualitätsrisiko → 47): kürzere Persona, 8→4 Turns, Top-4-Memory, Begrüßungs-Canned, `max_tokens` 64, Timeout-Schnitt auf 25 s.

Won’t: neues GGUF, natives C++, WebGPU.

Abnahme: gleiche Antworten wie `0.13.1` (Ton/Fakten), nur schneller und gestreamt.

---

## 2) Qualität (`0.13.3`)

0.5B ignoriert lange Systemprompts. Weniger Text, härtere Heuristik.

| ID | Update | Erwartung |
|----|--------|-----------|
| Q1 | Persona auf ~8 harte Regeln (DE, Siezen, kurz, kein Helpdesk) | weniger Floskel/Duzen |
| Q2 | Sampling: `temperature 0.55`, `repeat_penalty 1.12`, `top_p 0.85` | weniger Müll-Wiederholung |
| Q3 | Recall breiter: mag/liebling/hund/job — Unbekannt = ehrlich, kein Raten | kein Smalltalk-Halluzinieren |
| Q4 | Siezen-Scrub: Verben (`willst`/`bringst`) nicht roh `du→Sie` | kein `*st Sie` |
| Q5 | Antwort nach Satz 3 kappen | messenger-kurz |
| Q6 | Pack nur bei engem Budget (sonst 8 Turns / alle Pins) | Prefill runter ohne Faden zu opfern |

Won’t: 1.5B-Download, Research-Netz, TV.

Abnahme: Begrüßung Jarvis-Ton; „Was trinke ich?“ nur aus Memory; unbekannte Prefs ohne Erfindung.

---

## 3) Intelligenz (`0.13.4`)

| ID | Update | Erwartung |
|----|--------|-----------|
| I1 | Settings: **schnell** 0.5B Q4 (Default) vs **scharf** Qwen2.5-1.5B-Instruct Q4 (~1,1 GB) | Tasks/Plan spürbar klüger |
| I2 | Router ohne LLM: `smalltalk` → Canned/kurz; `task` → 1.5B falls gewählt; Memory/Tools weiter deterministisch | kluge Pfade, nicht jedes Token teuer |
| I3 | Task-Prompt: 1 Ziel + max 3 Schritte, kein Coach-Essay | 0.5B/1.5B bleiben brauchbar |

Won’t: 7b, Cloud-Fallback, Phi-3.8B, Gemma-2-2B (zu schwer für WASM-Alltag).

Abnahme: Default startet ohne Extra-Download; „scharf“ einmal laden, danach offline; Smalltalk darf auf 0.5B bleiben.

---

## Nicht in 46–48

| Thema | Wohin |
|-------|--------|
| Native llama.cpp / GPU | `0.14.0` |
| TTS | PO-Kommando |
| Samsung-TV, NAS, Play Store | Parking |
| Sprints 31–33 (`0.9.3`–`0.9.5`) | Inhalt von Q3/Q4 hier on-device nachziehen, nicht Python-Eval |

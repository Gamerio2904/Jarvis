# Sprint 47 — Qualität & Latenz (`0.14.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — bestehendes härten, nichts Neues |
| Ziel-Version | **`0.14.0`** |
| Quelle | PO 2026-08-15: weniger Latenz, bessere Antworten, intelligenter; TV folgt in 48 |

## Ziel

Dieselben Fähigkeiten wie `0.13.2` (Chat, Memory, Todos/Notizen, Settings) — **schneller, klarer, weniger dumm**. Kein neues Modell, keine neuen Features.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| Q1 | **Erstes Wort schneller** — Modell warm, Prompt kurz, `cache_prompt` wo wllama das hergibt, Threads/Batch ohne 1-Thread-Zwang | „Hallo“: erstes Token spürbar vor `0.13.2` |
| Q2 | **Deterministik vor LLM** — Memory/Tools (und TV-Anker vorbereiten) nicht durch 0.5B schicken | Bekannte Befehle antworten sofort |
| Q3 | **Memory-Alltag** — natürliche Phrasen, Multi-Fact, ehrliches Nichtwissen statt Halluzination | „Was trinke ich?“ ohne Raten |
| Q4 | **Tool-Alltag** — weniger starre `todo:`-Syntax; Follow-up erledigen | „Milch kaufen“ / „erstes erledigen“ klappt |
| Q5 | **Ton & Claims** — Siezen halten; kein „habe ich gemacht“ ohne Tool/Memory-Ergebnis | Live: keine Fake-Acks |
| Q6 | **UI-Ehrlichkeit** — kein „Ollama: online“; Status = On-Device | Settings/Health sagen Handy |
| Q7 | Version `0.14.0` | `APP_VERSION` + Changelog |

## Should

| ID | Inhalt |
|----|--------|
| Q8 | Sampling gegen Waffle (früher stoppen, weniger Canned) |
| Q9 | Status „denkt… Xs“ nur bis zum ersten Token, dann still streamen |

## Won’t

- Anderes/größeres GGUF
- Research-Netz, TTS, NAS
- TV-Keys in diesem Sprint (Sprint 48 / `0.14.1`)
- Neue Tool-Typen

## Exit / Abnahme

PO: 10 Minuten Alltagschat fühlt sich flüssiger und treffsicherer an als `0.13.2`. Tag **`v0.14.0`**.

## Danach

- Sprint 48 / `0.14.1` TV verbinden & steuern

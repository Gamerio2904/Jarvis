# 15 — Update `0.15`: Start schneller, Chat antwortet wieder

PO 2026-08-15: **Ladezeit beim Öffnen / Modellstart spürbar kürzer.** Zusätzlich: **Chat bleibt stumm.**  
Kein ChatGPT-Sprung, kein neues Produkt — bestehendes `0.14.1` härten.

Basis: On-Device `0.14.1` ([`14-quality-tv.md`](./14-quality-tv.md)).

## Leitentscheidung

| Thema | Entscheidung |
|-------|----------------|
| Scope | Start + Zuverlässigkeit, nichts Neues |
| Modell | Bleibt Qwen2.5 0.5B Instruct Q4 (kein 7B, keine Cloud) |
| ChatGPT-Niveau | **Nicht Ziel** — braucht anderes Modell/Cloud (siehe unten, nur Erklärung) |
| TV / Memory / Tools | Unverändert lassen, außer sie blockieren den Chat |

## Warum der Start heute langsam ist

Beim App-Öffnen, obwohl die GGUF **schon auf dem Gerät** liegt:

1. Overlay wartet, bis `ensureModel()` fertig ist — Chat ist gesperrt.
2. Die ~470 MB werden per `fetch` als **Blob in den JS-Heap** gelesen, danach nochmal nach WASM kopiert.
3. `0.14` hängt danach einen **Warmstart** (1 Token, bis 20 s) an den Ladeweg — das macht Öffnen langsamer, nicht schneller.

Erst-Download (~470 MB, WLAN) bleibt einmalig. Ziel von `0.15` ist der **zweite und jeder weitere Start**.

## Warum der Chat „nicht mehr antwortet“

Mehrere `0.14`-Kanten, nicht ein neues Feature-Loch:

| Ursache | Wirkung |
|---------|---------|
| Guard `ich habe es` | Viele normale Sätze werden durch „Das habe ich nicht ausgeführt“ ersetzt — wirkt wie keine Antwort |
| Warmstart + WASM | Modell kann nach dem Ping in einem schlechten Zustand hängen; UI bleibt auf „denkt…“ |
| Overlay bis Modell ready | Smalltalk geht nicht, obwohl Memory/TV ohne LLM könnten |
| Timeout 45 s / 90 s | Abbruch ohne klare, sofort sichtbare Meldung |

Abnahme: „Hallo Jarvis“ liefert Text oder eine **klare Fehlermeldung**, kein endloses Tippen und kein Dummy-Satz.

## Lieferstufe

| Version | Sprint | Inhalt |
|---------|--------|--------|
| **`0.15.0`** | [49](./sprints/sprint-49.md) | Schnellerer Modellstart + Chat antwortet wieder |

Kein `0.15.1` vorab. Nachzieher nur wenn Start oder Stummschaltung auf dem Gerät noch hakt.

## A) Schnellerer Start (Must)

| Hebel | Soll | Nicht |
|-------|------|--------|
| Overlay | Chat-UI sofort, wenn GGUF schon da; Ladeleiste dezent | Jeden Start mit Fullscreen blocken |
| Blob-Kopie | GGUF aus dem nativen File **ohne** zweiten 470-MB-RAM-Copy, soweit wllama das hergibt | Datei neu herunterladen |
| Warmstart | **Weg** vom Öffnen; höchstens idle nach erstem Token | 20 s Ping vor dem Chat |
| Status | „Modell startet…“ nur solange WASM lädt | Ollama-Vokabular |

Should, wenn der File-Pfad in WASM zu langsam bleibt: nativer llama.cpp-Loader in einem **späteren** Sprint — nicht in `0.15.0`, zu invasiv.

## B) Chat antwortet wieder (Must)

| Hebel | Soll |
|-------|------|
| Fake-Claim-Guard | Nur echte Tool/TV-Claims, **nicht** „ich habe es …“ |
| WASM nach Fehler | Instanz verwerfen, neu laden, Fehlertext zeigen |
| Streaming | Erstes Token oder Abbruch mit Satz, kein stummes Overlay |
| Routen ohne LLM | Memory/Tools/TV sofort, auch während das Modell noch startet |

## Won’t in `0.15.0`

- Größeres oder anderes GGUF, Cloud-LLM, ChatGPT-API
- Native Engine-Migration (llama.cpp JNI) — nur als Folge-Option nach Messung
- TTS, Research-Netz, NAS, neue Tools
- TV-Protokoll ändern

## Abnahme

1. App öffnen (Modell schon da): Chat sichtbar in wenigen Sekunden; kein langes Fullscreen-„Modell starten“.
2. „Hallo Jarvis“ → Antwort oder Fehler, beides unter der bisherigen Hänger-Schwelle.
3. Memory/TV-Befehle funktionieren, auch wenn WASM noch lädt.
4. Kein erneuter 470-MB-Download.

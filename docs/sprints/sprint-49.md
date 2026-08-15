# Sprint 49 — Start & Chat-Zuverlässigkeit (`0.15.0`)

| Feld | Wert |
|------|------|
| Status | **PLANNED** |
| Priorität | **MUST** — Öffnen und Antworten, nichts Neues |
| Ziel-Version | **`0.15.0`** |
| Quelle | PO 2026-08-15: Ladezeit beim App-Öffnen viel schneller; Chat antwortet nicht mehr |
| Voraussetzung | `0.14.1` Sideload |

## Ziel

Dieselben Fähigkeiten wie `0.14.1` — **App öffnet ohne langes Modell-Warten**, **Smalltalk kommt wieder**. Kein neues Modell.

## Must

| ID | Verbesserung | Done wenn |
|----|--------------|-----------|
| S1 | **Kein Fullscreen-Block**, wenn die GGUF schon auf dem Gerät liegt — Chat-UI sofort, Laden im Hintergrund | Overlay nur beim **ersten** Download |
| S2 | **Kein 470-MB-Blob-Copy** in den JS-Heap, wo der native File-Pfad reicht | Zweiter Start spürbar kürzer als `0.14.1` |
| S3 | **Warmstart-Completion vom Öffnen entfernen** (der `0.14`-Ping) | Öffnen nicht extra 20 s |
| S4 | **Guard** `ich habe es` entschärfen — nur echte Fake-Aktionen | Smalltalk bleibt stehen |
| S5 | Nach WASM-Fehler: Instanz tot, Meldung sichtbar, Retry möglich | Kein endloses „denkt…“ |
| S6 | Memory/Tools/TV **ohne** wartendes Modell | „Fernseher lauter“ / „was trinke ich“ sofort |
| S7 | Version `0.15.0` | `APP_VERSION` + Changelog + APK |

## Should

| ID | Inhalt |
|----|--------|
| S8 | Statuszeile „Modell startet… Xs“ statt Overlay |
| S9 | Erstes Chat-Token: kürzerer First-Token-Timeout **mit** klarem Satz, nicht still |

## Won’t

- ChatGPT-Niveau / Cloud-API / größeres GGUF
- llama.cpp JNI (erst messen; eigener Sprint wenn S2 nicht reicht)
- TTS, Research, neue TV-Keys

## Exit / Abnahme

PO: App auf, Chat da, „Hallo“ antwortet oder sagt warum nicht. Tag **`v0.15.0`**.

## Danach

Nur Nachzieher `0.15.1` falls Start auf dem Gerät noch hängt. TTS / `1.0.0` — **PO-Kommando**.

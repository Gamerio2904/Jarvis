# Sprint 302 — Hören

**Version:** landet in `18.10.0` (historisch `18.5.1`) — **CODE** Must
**Plan:** [`76-next.md`](../76-next.md)
**Voraussetzung:** 301 darf parallel starten; Parser-TV-Gold bleibt.

## Ziel

Kurze Kommandos (`Fernseher an`) gelten als fertig. Unsicheres
Google-STT darf über Groq-Whisper (`whisper-large-v3-turbo`, `language=de`)
nachgebessert werden, mit Vocab-Prompt (Fernseher, Watchliste, Körper,
Lage). Lane-1 bleibt Android-STT ohne Netz.

## Lieferumfang

| ID | Task | Datei | Anleitung |
|----|------|-------|-----------|
| S302-1 | Java-Satzende | `JarvisVoicePlugin.looksComplete` | Dieselbe Closed-Liste wie `turn-detect.ts` (`fernseher an/aus`, Lage, Timer, …). Nicht mehr `words>=6 \|\| length>=24` als Default für Kommandos |
| S302-2 | Alternativen | `heard.ts` / Voice-Plugin | 8 Results bleiben; TV-on/off-Bonus bleibt. Repair `fanseher` vor Groq |
| S302-3 | Groq zweite Bahn | neu schlank `stt-groq.ts` | Nur wenn `groqReady()` und (Repair hat geändert **oder** keine Closed-Command und Confidence/leer). Audio kurz, Timeout hart 1500 ms. Fehlschlag → Google-Text. Kein Pflicht-Upload jedes Mal |
| S302-4 | Vocab | Prompt an Whisper | Feste kurze Liste deutscher Jarvis-Wörter, kein Gesprächsverlauf |
| S302-5 | Test | `test-turn-detect.mjs`, STT-Repair-Corpus | `Fernseher an` complete. `fanseher an` → tv. Groq-Mock: Timeout lässt Google stehen |

## Won’t

- faster-whisper on-device. ElevenLabs. Wyoming.
- Jeden Utterance in die Cloud.

## Abbruchkriterium

Ohne Groq-Key bricht Hören. Oder „und dann“ wird nach zwei Wörtern
abgeschnitten, obwohl TS das nicht täte.

## Manuell

Sprachmodus, Netz an, Groq-Key da: undeutlich „Fanseher an“ → TV-Pfad.
Flugmodus: Android-STT allein, ehrlich.

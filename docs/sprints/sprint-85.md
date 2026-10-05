# Sprint 85 — Sprachmodus Tempo (`1.32.1`)

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`1.32.1`** |
| Quelle | PO 2026-08-17: antwortet nicht, viel zu langsam im Sprachmodus |
| Voraussetzung | Sideload `1.32.0` |

## Ziel

Nach dem Satz kommt Ton. Keine lange Stille, kein Hänger bis zum nächsten Antippen.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| L1 | TTS: nur Charon, kurzes Budget, nach 0,5 s Native | Keine 3–8 s Stille vor dem ersten Wort |
| L2 | Gemini-Stream: 2 Modelle, ~9 s Budget, Teiltext zählt | Kein 45-s-Warten auf leere Modelle |
| L3 | Android listen/speak/SSE Watchdog | PluginCall löst immer auf |
| L4 | Sprachmodus ohne Gemini: Groq oder ehrlicher Satz, kein 0.5B | Kein Minuten-Hänger |
| L5 | Version `1.32.1` | Sideload nach 1.32.0 |

## Won’t

Neue TTS-API, englische Default-Stimme, Qualität vor Tempo (Charon darf weggelassen werden, wenn er zu spät kommt).

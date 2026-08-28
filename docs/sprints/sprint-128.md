# Sprint 128 — Retrieve + RRF + Prompt (`6.61`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Leit `6.60`; unabhängig von Motion `6.10` |
| Ziel-Version | `6.61.0`; Reihe `6.61`–`6.65` in [`46-next.md`](../46-next.md) |
| Voraussetzung | Sprint 127; ideal nach `6.50` H3 (sonst zwei Prompt-Umbauten) |
| Quelle | NVIDIA-Schleife lokal: Sub-Queries, IDB-Stores, RRF |

## Ziel

`retrieve.ts` sucht 2–3 Mal über Memory, Chats, Kalender, Notizen, Erinnerungen, Einkauf, fusioniert per RRF, liefert Top 6. Chatsuche und Memory-Recall nutzen dasselbe. `memoryBlock` = Pins + Hits (max. 10). LLM sieht lokal 4 / Gemini 8 Turns plus Block.

## Must

| ID | Inhalt |
|----|--------|
| N1 | Sub-Queries ohne LLM (Stoppwörter, Kategorie-Hint) |
| N2 | RRF `1/(60+rang)`, Top 6 |
| N3 | `search-chat` + Memory-Recall Execute → retrieve |
| N4 | Write/Forget/Contradiction **unverändert** Parser |
| N5 | `chat.ts` retrieve vor LLM; kein `if`-Router, kein Embedding in `policy.ts` |

## Won’t (dieser Sprint)

LanceDB. Nemotron. Working Memory. Sleep. e5-small. Sideload.

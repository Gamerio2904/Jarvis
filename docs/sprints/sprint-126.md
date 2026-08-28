# Sprint 126 — Hirn: Schliff, Kontext, Modell-Spike (`6.50`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Bühne `6.10` (sonst frisst das Modell die Frames) |
| Ziel-Version | `6.50.0` (Research `6.51` Guard, `6.52` 1,5B GO/NO-GO) |
| Quelle | PO: Antworten Chat+Sprache auf ChatGPT/Grok/Claude-Niveau |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | Parser-Register `3.0`, Gemini Opt-in `0.16`, Groq-Key, Persona kurz für 0,5B |

## Ziel

Frontier-Ton **ohne** zu lügen: Tools bleiben Parser. Gemini (optional Groq) darf denselben Tool-Satz in 1–3 Film-Sätzen sprechen — **keine neuen Zahlen**. Gedächtnis gezielter in den Prompt. Qwen 1,5B nur wenn Spike grün, sonst 0,5B Default.

## Must

| ID | Inhalt |
|----|--------|
| H1 | `polishFacts(draft, facts)` nur mit Cloud-Hirn; Guard streicht neue Orte/Zahlen |
| H2 | Sprachmodus: dieselben Fakten, `VOICE_HINT` 1–2 Sätze, kein Telegramm |
| H3 | Memory-Block: relevante Keys, nicht die ganze Liste in den 0,5B |
| H4 | Spike 1,5B Q4 WASM — NO-GO lässt Default unangetastet |
| H5 | Gemini aus: Tools weiter ehrlich canned; Smalltalk 0,5B oder „Modell aus“ |

## Won’t (dieser Sprint)

0,5B als Claude verkaufen. Auto-Research ohne Opt-in. Computer-Use. Sideload. ElevenLabs.

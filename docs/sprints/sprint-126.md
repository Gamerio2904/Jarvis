# Sprint 126 — Hirn: Gemini zuerst, Schliff, Backup (`6.50`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** |
| Priorität | nach Bühne `6.10` (sonst frisst das Modell die Frames) |
| Ziel-Version | `6.50.0` (Research `6.51` Guard) |
| Quelle | PO: Gemini Hauptweg; Groq und 0,5B nur Backup; kein größeres Modell lokal; Antworten Chat+Sprache |
| Plan | [`45-next.md`](../45-next.md) |
| Baut auf | Gemini Opt-in, Groq-Key, 0,5B, Parser-Register |

## Ziel

**Gemini ist das normale Hirn**, sobald ein Key da ist. Fällt Gemini aus: Groq. Fehlt beides: 0,5B oder ehrlich „aus“. Kein 1,5B-Test.

Geräte-Befehle bleiben Parser. Gemini darf denselben Tool-Satz in 1–3 ruhigen Sätzen sagen — **keine neuen Zahlen**. Dasselbe im Sprachmodus. Gedächtnis nur was zur Frage passt. Globus-Sätze aus Sprint 123 dürfen hier denselben Schliff bekommen.

## Must

| ID | Inhalt |
|----|--------|
| H1 | Reihenfolge: Gemini → Groq → 0,5B. Key weg = nicht so tun als wäre Gemini an |
| H2 | Tool-Schliff nur mit Fakten-Paket; Guard streicht neue Orte/Zahlen |
| H3 | Sprache: 1–2 ganze Sätze, dieselben Fakten |
| H4 | Memory: passende Einträge, nicht die ganze Liste |
| H5 | **Kein** größeres lokales Modell |

## Won’t (dieser Sprint)

1,5B/3B WASM. 0,5B als Claude verkaufen. Auto-Suche ohne Opt-in. Computer-Use. Sideload. ElevenLabs.

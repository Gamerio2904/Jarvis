# Sprint 106 — Intelligenz 3.0 **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** |
| Priorität | **MUST** |
| Ziel-Version | **`3.0.0`** (Welt `3.1`–`3.17` mitgeliefert) |
| Quelle | PO 2026-08-26: KI intelligenter, Register, geplante Sprints umsetzen |
| Voraussetzung | `2.2.2` |
| Plan | [`32-intelligence.md`](../32-intelligence.md) · [`31-next.md`](../31-next.md) |

## Ziel

Jarvis 3.0 wählt Tools über Register + Score-Policy. Die bisher geplante Welt-Reihe liegt als Register-Einträge im selben Code.

## Must

| ID | Inhalt | Done wenn |
|----|--------|-----------|
| I1 | Register, Parse vor Execute, Policy, Konflikte | `route-pick.ts` / `registry.ts` / `chat.ts` |
| I2 | Gold/Chip-Routing | `test:014`, `test:prompts` |
| I3 | Welt-Tools DWD bis Schach | Parser + Handler, ehrlich leer |
| I4 | Docs 3.0 + Verschiebung der Welt-Nummern | `32-intelligence.md`, `31-next.md` |

## Won’t

Embeddings, 0,5B-Function-Calling, Alexa, Tuya-Cloud, Apple CarPlay.

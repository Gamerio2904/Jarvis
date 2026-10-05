# Sprint 236 — Groq primär + BrainOrchestrator (`15.0.0`) **CODE**

| Feld | Wert |
|------|------|
| Status | **CODE** Must |
| Ziel-Version | **`15.1.0`** (kombiniert mit Sprint 235 + 237) |
| Quelle | [`63-next.md`](../63-next.md) |
| Voraussetzung | Sprint **229** Director (Flag ok), **227** Catalog |

## Ziel

**Groq als Standard-Hirn.** Gemini nur noch Spezialist (Vision, Deep Research/Grounding). `brain-orchestrator.ts` ersetzt flaches `pickBrain()` für Chat-Pfad.

## Lieferumfang

- [x] `brain-orchestrator.ts`, `brain-tasks.ts`
- [x] `brain-pick.ts` v2: `planBrainSlots(turnCtx)`
- [x] Settings: `brain_primary` (default `groq`), `brain_gemini_roles`
- [x] `chat.ts` / Director: kein festes `kind === 'gemini'` für Smalltalk
- [x] `llm.ts`: lokales 0,5B **nicht** blockieren wenn nur Gemini-TTS an (Groq primary)
- [x] Feature-Flag `brain_v2` (default **an** — Rollback `false` → 13.44)
- [x] Latenz-Spur: `groq-chat`, `gemini-vision`, `gemini-deep`

## DoD

- [x] Smalltalk mit Groq-Key: **kein** Gemini-Call
- [x] Vision/Doc/PC: weiter **nur** Gemini
- [x] Deep Research: Gemini + Grounding
- [x] `brain_v2` aus → Verhalten wie `13.44` (Gemini first)
- [x] `test:prompts` + `test:014` grün
- [x] `test:brain-orchestrator.mjs` — Slot-Matrix Smoke

## Risiko

Mittel — zentraler Chat-Pfad. Rollback über Flag.

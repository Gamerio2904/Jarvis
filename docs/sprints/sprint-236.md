# Sprint 236 — Groq primär + BrainOrchestrator (`15.0.0`) **PLAN**

| Feld | Wert |
|------|------|
| Status | **PLAN** Must |
| Ziel-Version | **`15.0.0`** |
| Quelle | [`63-next.md`](../63-next.md) |
| Voraussetzung | Sprint **229** Director (Flag ok), **227** Catalog |

## Ziel

**Groq als Standard-Hirn.** Gemini nur noch Spezialist (Vision, Deep Research/Grounding). `brain-orchestrator.ts` ersetzt flaches `pickBrain()` für Chat-Pfad.

## Lieferumfang

- [ ] `brain-orchestrator.ts`, `brain-tasks.ts`
- [ ] `brain-pick.ts` v2: `planBrainSlots(turnCtx)`
- [ ] Settings: `brain_primary` (default `groq`), `brain_gemini_roles`
- [ ] `chat.ts` / Director: kein festes `kind === 'gemini'` für Smalltalk
- [ ] `llm.ts`: lokales 0,5B **nicht** blockieren wenn nur Gemini-TTS an (Groq primary)
- [ ] Feature-Flag `brain_v2` (default **aus**)
- [ ] Latenz-Spur: `groq-chat`, `gemini-vision`, `gemini-deep`

## DoD

- [ ] Smalltalk mit Groq-Key: **kein** Gemini-Call
- [ ] Vision/Doc/PC: weiter **nur** Gemini
- [ ] Deep Research: Gemini + Grounding
- [ ] `brain_v2` aus → Verhalten wie `13.44` (Gemini first)
- [ ] `test:prompts` + `test:014` grün
- [ ] `test:brain-orchestrator.mjs` — Slot-Matrix Smoke

## Risiko

Mittel — zentraler Chat-Pfad. Rollback über Flag.
